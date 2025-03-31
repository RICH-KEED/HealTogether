import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No Token" });
    }

    // Log token for debugging (remove in production)
    console.log("Received token:", token.substring(0, 15) + "...");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized - Invalid Token" });
      }

      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError.message);
      return res.status(401).json({ error: "Token verification failed", details: jwtError.message });
    }
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(401).json({ error: "Not authorized, token failed" });
  }
};

// Add the protectRoute export that's being imported in auth.route.js
// This is just an alias for authMiddleware for backward compatibility
export const protectRoute = authMiddleware;

// Add the isAdmin middleware
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Not an admin." });
  }
};

export default authMiddleware;
