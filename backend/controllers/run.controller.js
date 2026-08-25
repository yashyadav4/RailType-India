import Run from "../models/run.model.js";
import User from "../models/user.model.js";
import { evaluateStamps } from "../utils/stampEvaluator.js";

// POST /api/runs — Save a single run (authenticated)
export const saveRun = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cityId, lineId, timeMs, accuracy, cpm, mistakes, routeLength = 0 } = req.body;

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

    // Calculate global rank
    const rankAgg = await Run.aggregate([
      { $match: { cityId, lineId, timeMs: { $lt: timeMs } } },
      { $group: { _id: "$user" } },
      { $count: "count" }
    ]);
    const globalRank = rankAgg.length > 0 ? rankAgg[0].count + 1 : 1;

    // Update user stats and PB
    const user = await User.findById(userId);
    let newStampsEarned = [];
    if (user) {
      user.totalRuns = (user.totalRuns || 0) + 1;
      
      // Update Perfect Runs
      if ((mistakes || 0) === 0) {
        user.perfectRuns = (user.perfectRuns || 0) + 1;
      }

      // Update Streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastRun = user.lastRunDate ? new Date(user.lastRunDate) : null;
      if (lastRun) lastRun.setHours(0, 0, 0, 0);
      
      if (!lastRun) {
        user.currentStreak = 1;
      } else {
        const diffTime = Math.abs(today - lastRun);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays === 1) {
          user.currentStreak += 1;
        } else if (diffDays > 1) {
          user.currentStreak = 1;
        }
      }
      user.lastRunDate = new Date();

      // PB Logic
      const bestIndex = user.bests.findIndex(b => b.cityId === cityId && b.routeId === lineId);
      if (bestIndex === -1) {
        user.bests.push({ cityId, routeId: lineId, timeMs, accuracy, cpm, mistakes });
      } else if (timeMs < user.bests[bestIndex].timeMs) {
        user.bests[bestIndex].timeMs = timeMs;
        user.bests[bestIndex].accuracy = accuracy;
        user.bests[bestIndex].cpm = cpm;
        user.bests[bestIndex].mistakes = mistakes;
      }
      
      // Evaluate new stamps
      newStampsEarned = evaluateStamps(user, { timeMs, accuracy, cpm, mistakes: mistakes || 0 }, globalRank, routeLength);
      if (newStampsEarned.length > 0) {
        if (!user.stamps) user.stamps = [];
        user.stamps.push(...newStampsEarned);
      }

      await user.save();
    }

    res.status(201).json({ message: "Run saved", run, rank: globalRank, updatedBests: user?.bests, newStampsEarned });
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

    // Update total run count and bests
    const user = await User.findById(userId);
    if (user) {
      user.totalRuns = (user.totalRuns || 0) + capped.length;
      
      capped.forEach(r => {
        const bestIndex = user.bests.findIndex(b => b.cityId === r.cityId && b.routeId === r.lineId);
        if (bestIndex === -1) {
          user.bests.push({ cityId: r.cityId, routeId: r.lineId, timeMs: r.timeMs, accuracy: r.accuracy, cpm: r.cpm, mistakes: r.mistakes || 0, createdAt: r.playedAt || new Date() });
        } else if (r.timeMs < user.bests[bestIndex].timeMs) {
          user.bests[bestIndex].timeMs = r.timeMs;
          user.bests[bestIndex].accuracy = r.accuracy;
          user.bests[bestIndex].cpm = r.cpm;
          user.bests[bestIndex].mistakes = r.mistakes || 0;
          user.bests[bestIndex].createdAt = r.playedAt || new Date();
        }
      });

      await user.save();
    }

    res.status(201).json({
      message: `${capped.length} guest runs synced`,
      count: capped.length,
      updatedBests: user?.bests
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

// GET /api/runs/leaderboard/:cityId/:lineId — Public leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { cityId, lineId } = req.params;
    
    const leaderboard = await Run.aggregate([
      { $match: { cityId, lineId } },
      { $sort: { timeMs: 1 } },
      { $group: {
          _id: "$user",
          timeMs: { $first: "$timeMs" },
          cpm: { $first: "$cpm" },
          accuracy: { $first: "$accuracy" },
          date: { $first: "$createdAt" }
      }},
      { $sort: { timeMs: 1 } },
      { $limit: 10 },
      { $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
      }},
      { $unwind: "$userInfo" },
      { $project: {
          _id: 0,
          userId: "$_id",
          name: "$userInfo.name",
          picture: "$userInfo.picture",
          timeMs: 1,
          cpm: 1,
          accuracy: 1,
          date: 1
      }}
    ]);

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Server error" });
  }
};
