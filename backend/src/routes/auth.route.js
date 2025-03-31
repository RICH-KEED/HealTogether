import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";  // Add this import
import { 
  checkAuth, 
  login, 
  logout, 
  signup, 
  updateProfile, 
  validateReferralCode, 
  generateReferralCode,
  requestVerification
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);

// Fixed login route with proper User model import and variable name
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Please provide both email and password" });
    }

    // Find user - fixed variable name from user to User
    const foundUser = await User.findOne({ email });
    
    // Validate password
    if (!foundUser || !(await bcrypt.compare(password, foundUser.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Check that JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined! Cannot generate token.");
      return res.status(500).json({ error: "Server configuration error" });
    }
    
    // Generate token
    const token = jwt.sign({ userId: foundUser._id }, process.env.JWT_SECRET, {
      expiresIn: "30d"
    });
    
    // Set HTTP-only cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    });
    
    // Return user info without password
    const userWithoutPassword = foundUser.toObject();
    delete userWithoutPassword.password;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);
router.post("/validate-referral", validateReferralCode);
router.post("/generate-referral", protectRoute, generateReferralCode);
router.post("/request-verification", protectRoute, requestVerification);

router.get("/check", protectRoute, checkAuth);

export default router;
