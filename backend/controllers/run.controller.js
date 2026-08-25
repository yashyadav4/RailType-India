import Run from "../models/run.model.js";
import User from "../models/user.model.js";

// POST /api/runs — Save a single run (authenticated)
export const saveRun = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cityId, lineId, timeMs, accuracy, cpm, mistakes } = req.body;

    if (!cityId || !lineId || !timeMs || accuracy == null || !cpm) {
      return res.status(400).json({ message: "Missing required run fields" });
    }

    const run = new Run({
      user: userId,
      cityId,
      lineId,
      timeMs,
      accuracy,
      cpm,
      mistakes: mistakes || 0,
    });

    await run.save();

    // Increment the user's total run count
    await User.findByIdAndUpdate(userId, { $inc: { totalRuns: 1 } });

    res.status(201).json({ message: "Run saved", run });
  } catch (error) {
    console.error("Error saving run:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/runs/bulk — Sync guest runs on first login (authenticated)
export const bulkSaveRuns = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { runs } = req.body;

    if (!Array.isArray(runs) || runs.length === 0) {
      return res.status(400).json({ message: "No runs to sync" });
    }

    // Cap at 50 runs to prevent abuse
    const capped = runs.slice(0, 50);

    const runDocs = capped.map((r) => ({
      user: userId,
      cityId: r.cityId,
      lineId: r.lineId,
      timeMs: r.timeMs,
      accuracy: r.accuracy,
      cpm: r.cpm,
      mistakes: r.mistakes || 0,
      createdAt: r.playedAt || new Date(),
    }));

    await Run.insertMany(runDocs);

    // Update total run count
    await User.findByIdAndUpdate(userId, {
      $inc: { totalRuns: capped.length },
    });

    res.status(201).json({
      message: `${capped.length} guest runs synced`,
      count: capped.length,
    });
  } catch (error) {
    console.error("Error bulk saving runs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/runs/mine — Get logged-in user's run history
export const getMyRuns = async (req, res) => {
  try {
    const userId = req.user.userId;
    const runs = await Run.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json(runs);
  } catch (error) {
    console.error("Error fetching runs:", error);
    res.status(500).json({ message: "Server error" });
  }
};
