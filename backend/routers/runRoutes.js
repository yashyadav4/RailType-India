import express from "express";
import { saveRun, bulkSaveRuns, getMyRuns, getLeaderboard, getTotalRuns } from "../controllers/run.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route for leaderboards & stats
router.get("/leaderboard/:cityId/:lineId", getLeaderboard);
router.get("/stats/total", getTotalRuns);

// All other run routes require authentication
router.post("/", protect, saveRun);
router.post("/bulk", protect, bulkSaveRuns);
router.get("/mine", protect, getMyRuns);

export default router;
