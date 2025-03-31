import express from "express";
import { 
  getPendingUsers, 
  verifyUser, 
  rejectUser,
  createGroup,
  getAllUsers,
  deleteUser,
  getGroups
} from "../controllers/admin.controller.js";
import { protectRoute, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply both middleware - first check authentication, then check if admin
router.use(protectRoute);
router.use(isAdmin);

router.get("/pending-users", getPendingUsers);
router.get("/all-users", getAllUsers);
router.get("/groups", getGroups);
router.post("/verify-user/:id", verifyUser);
router.post("/reject-user/:id", rejectUser);
router.post("/create-group", createGroup);
router.delete("/delete-user/:id", deleteUser);

export default router;
