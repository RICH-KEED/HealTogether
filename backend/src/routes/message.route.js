import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  getMessages, 
  getUsersForSidebar, 
  sendMessage, 
  getTherapistsForSidebar,
  getGroups,
  joinGroup,
  getGroupMessages,
  sendGroupMessage
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/therapists", protectRoute, getTherapistsForSidebar);
router.get("/groups", protectRoute, getGroups);
router.get("/group/:id", protectRoute, getGroupMessages);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/send-group/:id", protectRoute, sendGroupMessage);
router.post("/join-group/:id", protectRoute, joinGroup);

export default router;
