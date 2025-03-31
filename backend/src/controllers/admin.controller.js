import User from "../models/user.model.js";
import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import GroupMessage from "../models/groupMessage.model.js";

export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ 
      role: { $nin: ["user", "admin"] },
      status: "pending"
    }).select("-password");
    
    res.status(200).json(pendingUsers);
  } catch (error) {
    console.log("Error in getPendingUsers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.log("Error in getAllUsers:", error.message);
    res.status(500).json({ message: "Internal server error" });
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
    
    // Generate referral code for professional
    const referralCode = `${user.role.substring(0,3).toUpperCase()}${user._id.toString().substring(0,5)}${Math.floor(1000 + Math.random() * 9000)}`;
    
    user.status = "verified";
    user.referralCode = referralCode;
    await user.save();
    
    res.status(200).json({ message: "User verified successfully", referralCode });
  } catch (error) {
    console.log("Error in verifyUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.status = "rejected";
    await user.save();
    
    res.status(200).json({ message: "User rejected successfully" });
  } catch (error) {
    console.log("Error in rejectUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { type, name, description } = req.body;
    const createdBy = req.user._id;
    
    const newGroup = new Group({
      type,
      name,
      description,
      createdBy,
      members: [createdBy]  // Admin is automatically a member
    });
    
    await newGroup.save();
    
    res.status(201).json(newGroup);
  } catch (error) {
    console.log("Error in createGroup:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Prevent deleting admin users
    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin users cannot be deleted" });
    }
    
    // Delete all messages sent by or to this user
    await Message.deleteMany({
      $or: [
        { senderId: id },
        { receiverId: id }
      ]
    });
    
    // Remove user from all groups
    await Group.updateMany(
      { members: id },
      { $pull: { members: id } }
    );
    
    // Delete the user
    await User.findByIdAndDelete(id);
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error in deleteUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    // Fetch groups with populated creator and members information
    const groups = await Group.find()
      .populate("createdBy", "fullName profilePic email")
      .populate("members", "fullName profilePic email role");
    
    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getGroups:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
