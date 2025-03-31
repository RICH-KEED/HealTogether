import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    let filteredUsers = [];
    
    // If the user is a therapist or other professional, only show users who signed up with their referral code
    if ((req.user.role === "therapist" || req.user.role === "ngo" || req.user.role === "volunteer") && 
         req.user.status === "verified") {
      
      // First try with referralCode matching
      filteredUsers = await User.find({ 
        referralCode: req.user.referralCode,
        role: "user"
      }).select("-password");
      
      // If no users found, try with referredBy field
      if (filteredUsers.length === 0) {
        filteredUsers = await User.find({ 
          referredBy: loggedInUserId,
          role: "user"
        }).select("-password");
      }
      
      // Debug info
      console.log(`Found ${filteredUsers.length} referred users for ${req.user.role} (${req.user.fullName})`);
    } else {
      // For regular users, show everyone except professionals (handled by getTherapistsForSidebar) and admin
      filteredUsers = await User.find({ 
        _id: { $ne: loggedInUserId },
        role: "user" // Only show regular users
      }).select("-password");
    }
    
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTherapistsForSidebar = async (req, res) => {
  try {
    // For regular users, only show therapists (not NGOs or volunteers)
    // This ensures users in "Chat with Therapist" only see actual therapists
    const therapists = await User.find({ 
      role: "therapist", // Only therapists, not NGOs or volunteers
      status: "verified"
    }).select("-password");

    res.status(200).json(therapists);
  } catch (error) {
    console.error("Error in getTherapistsForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate("createdBy", "fullName profilePic");
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getGroups: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    
    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    // Fetch messages and populate sender info
    const messages = await GroupMessage.find({ groupId })
      .populate("sender", "fullName profilePic")
      .sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: groupId } = req.params;
    const sender = req.user._id;
    
    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    // Check if user is a member of the group
    if (!group.members.includes(sender)) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }
    
    // Create and save the message
    const newMessage = new GroupMessage({
      text,
      sender,
      groupId
    });
    
    const savedMessage = await newMessage.save();
    
    // Populate sender info
    const populatedMessage = await GroupMessage.findById(savedMessage._id)
      .populate("sender", "fullName profilePic");
    
    // Broadcast message to all group members via socket
    io.to(`group_${groupId}`).emit("newGroupMessage", populatedMessage);
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;
    
    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    // Check if user is already a member
    const isAlreadyMember = group.members.some(
      member => member.toString() === userId.toString()
    );
    
    if (isAlreadyMember) {
      // If already a member, just return the group
      const populatedGroup = await Group.findById(groupId)
        .populate("members", "fullName profilePic email role")
        .populate("createdBy", "fullName profilePic");
      
      return res.status(200).json(populatedGroup);
    }
    
    // Add user to group members
    group.members.push(userId);
    await group.save();
    
    // Return fully populated group data
    const populatedGroup = await Group.findById(groupId)
      .populate("members", "fullName profilePic email role")
      .populate("createdBy", "fullName profilePic");
    
    // Subscribe user to group socket room
    const socketId = getReceiverSocketId(userId);
    if (socketId) {
      io.to(socketId).socketsJoin(`group_${groupId}`);
    }
    
    res.status(200).json(populatedGroup);
  } catch (error) {
    console.log("Error in joinGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
