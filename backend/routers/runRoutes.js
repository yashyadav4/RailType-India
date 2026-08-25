import express from "express";
import { saveRun, bulkSaveRuns, getMyRuns } from "../controllers/run.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All run routes require authentication
router.post("/", protect, saveRun);
router.post("/bulk", protect, bulkSaveRuns);
router.get("/mine", protect, getMyRuns);

export default router;
