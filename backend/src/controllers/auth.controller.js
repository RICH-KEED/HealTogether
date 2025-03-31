import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password, role, referralCode } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (role === "admin") {
      return res.status(403).json({ message: "You are not allowed to assign the admin role" });
    }

    if (role === "user" && !referralCode) {
      return res.status(400).json({ message: "Referral code is required for users" });
    }
    
    // Validate referral code for user role
    let referringTherapist = null;
    if (role === "user" && referralCode) {
      referringTherapist = await User.findOne({ 
        referralCode, 
        status: "verified", 
        role: { $ne: "user" } 
      });
      
      if (!referringTherapist) {
        return res.status(400).json({ message: "Invalid referral code" });
      }
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      role: role || "user", // Default to "user" if no role is provided
      referralCode: role === "user" ? referralCode : undefined,
      // Only non-user roles start with pending status
      status: role !== "user" ? "pending" : "verified",
      // Store which therapist referred this user (only for user role)
      referredBy: (role === "user" && referringTherapist) ? referringTherapist._id : undefined
    });

    if (newUser) {
      // Generate JWT token
      generateToken(newUser._id, res);
      await newUser.save();

      // Return user data
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        role: newUser.role,
        status: newUser.status,
        // Only non-user accounts require verification
        requiresVerification: role !== "user" 
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if professional account needs verification
    const needsVerification = user.role !== "user" && user.status === "pending";
    if (needsVerification) {
      generateToken(user._id, res);
      return res.status(200).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        role: user.role,
        status: user.status,
        requiresVerification: true
      });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    // Set CORS headers first to ensure they're present
    res.set({
      'Access-Control-Allow-Origin': req.headers.origin || 'http://localhost:5176', 
      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });

    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    try {
      // Configure cloudinary with basic upload parameters, without upload_preset
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "connecto_profiles",
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [
          { width: 400, height: 400, crop: "limit", quality: "auto" }
        ],
        resource_type: 'auto'
      });
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: uploadResponse.secure_url },
        { new: true }
      ).select("-password");

      res.status(200).json(updatedUser);
    } catch (cloudinaryError) {
      console.error("Cloudinary upload error:", cloudinaryError);
      res.status(500).json({ message: "Image upload failed. Please try a smaller or different image." });
    }
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add a new controller for referral code validation
export const validateReferralCode = async (req, res) => {
  const { referralCode } = req.body;
  
  try {
    // Find a verified professional with this referral code
    const professional = await User.findOne({ 
      referralCode,
      status: "verified", 
      role: { $ne: "user" } 
    });

    if (!professional) {
      return res.status(400).json({ valid: false, message: "Invalid referral code" });
    }

    res.status(200).json({ valid: true, message: "Valid referral code" });
  } catch (error) {
    console.log("Error in validateReferralCode controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add a new controller for generating referral codes for professionals
export const generateReferralCode = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user || user.role === "user") {
      return res.status(403).json({ message: "Only verified professionals can generate referral codes" });
    }
    
    if (user.status !== "verified") {
      return res.status(403).json({ message: "Your account must be verified to generate referral codes" });
    }
    
    // Generate a more random and secure referral code
    const randomBytes = require('crypto').randomBytes(8).toString('hex');
    const prefix = user.role.substring(0,3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    const referralCode = `${prefix}-${randomBytes.substring(0,6)}-${timestamp}`;
    
    // Update user with the new referral code
    user.referralCode = referralCode;
    await user.save();
    
    res.status(200).json({ referralCode });
  } catch (error) {
    console.log("Error in generateReferralCode controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.status === "verified") {
      return res.status(400).json({ message: "User is already verified" });
    }
    
    // Generate more random and secure referral code
    const randomBytes = require('crypto').randomBytes(8).toString('hex');
    const prefix = user.role.substring(0,3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    const referralCode = `${prefix}-${randomBytes.substring(0,6)}-${timestamp}`;
    
    user.status = "verified";
    user.referralCode = referralCode;
    await user.save();
    
    res.status(200).json({ message: "User verified successfully", referralCode });
  } catch (error) {
    console.log("Error in verifyUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requestVerification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: "Verification message is required" });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.status === "verified") {
      return res.status(400).json({ message: "User is already verified" });
    }
    
    if (user.status === "pending") {
      return res.status(400).json({ message: "Verification is already pending" });
    }
    
    // Set verification request flag and message
    user.verificationRequest = true;
    user.verificationMessage = message;
    user.status = "pending";
    
    await user.save();
    
    res.status(200).json({ message: "Verification request submitted successfully" });
  } catch (error) {
    console.log("Error in requestVerification:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
