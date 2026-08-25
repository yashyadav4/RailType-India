import express from "express";
import { getUserProfile, googleLogin, updateUserProfile } from "../controllers/user.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// When a POST request hits /api/users/google, run the googleLogin function
router.post("/google", googleLogin);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

export default router;
