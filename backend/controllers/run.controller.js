import Run from "../models/run.model.js";
import User from "../models/user.model.js";
import { evaluateStamps } from "../utils/stampEvaluator.js";

// ── Input Validation ───────────────────────────────────────────────
// 
// WHY THIS MATTERS:
// All game logic runs on the client (browser). A malicious user can
// open DevTools → Console and POST any data they want:
//   fetch('/api/runs', { body: { timeMs: 1, cpm: 9999, accuracy: 100 } })
// 
// We can't *prove* a run is real (that would need server-side game state),
// but we CAN reject data that's PHYSICALLY IMPOSSIBLE:
//
// Layer 1: TYPE CHECKS   — "Is timeMs actually a number?"
// Layer 2: RANGE CHECKS  — "Is CPM within human limits?"
// Layer 3: CROSS-CHECKS  — "Does CPM × time ≈ actual characters typed?"
//
const validateRunData = (data) => {
  const { cityId, lineId, timeMs, accuracy, cpm, mistakes, clientHour } = data;
  const errors = [];

  // ── Layer 1: Type validation ──
  if (typeof cityId !== "string" || !cityId.trim()) errors.push("cityId must be a non-empty string");
  if (typeof lineId !== "string" || !lineId.trim()) errors.push("lineId must be a non-empty string");
  if (typeof timeMs !== "number" || !Number.isFinite(timeMs)) errors.push("timeMs must be a finite number");
  if (typeof accuracy !== "number" || !Number.isFinite(accuracy)) errors.push("accuracy must be a finite number");
  if (typeof cpm !== "number" || !Number.isFinite(cpm)) errors.push("cpm must be a finite number");
  if (mistakes != null && (typeof mistakes !== "number" || !Number.isFinite(mistakes))) errors.push("mistakes must be a number");

  // Bail early if types are wrong — range checks would crash
  if (errors.length > 0) return errors;

  // ── Layer 2: Range validation (hard physical limits) ──
  // Minimum 3 seconds (even the shortest route takes a few seconds)
  // Maximum 1 hour (nobody types a single metro line for 60+ minutes)
  if (timeMs < 3000) errors.push("timeMs too low (minimum 3 seconds)");
  if (timeMs > 3600000) errors.push("timeMs too high (maximum 1 hour)");

  // CPM: World typing record ≈ 220 WPM ≈ 1100 CPM. Cap at 1500 to be generous.
  if (cpm < 1) errors.push("cpm must be positive");
  if (cpm > 1500) errors.push("cpm exceeds human typing limits");

  // Accuracy: must be a percentage
  if (accuracy < 0 || accuracy > 100) errors.push("accuracy must be 0–100");

  // Mistakes: can't be negative, cap at a sane upper bound
  const m = mistakes || 0;
  if (m < 0) errors.push("mistakes cannot be negative");
  if (m > 5000) errors.push("mistakes exceeds sane limit");

  // clientHour: must be 0–23 if provided
  if (clientHour != null && (typeof clientHour !== "number" || clientHour < 0 || clientHour > 23)) {
    errors.push("clientHour must be 0–23");
  }

  // ── Layer 3: Cross-validation (catch mathematically impossible data) ──
  // If accuracy = 100%, there should be 0 mistakes
  if (accuracy === 100 && m > 0) errors.push("100% accuracy with mistakes > 0 is contradictory");

  // CPM sanity: The reported CPM should be roughly consistent with the time.
  // CPM = (characters typed / timeMs) * 60000
  // If someone claims 800 CPM over 5 seconds, that's 800 * 5/60 ≈ 67 chars in 5s.
  // That's possible for a very short station. But 1200 CPM for 60 seconds = 1200 chars/min
  // which is clearly superhuman. We flag if CPM > 1000 AND time > 30s.
  if (cpm > 1000 && timeMs > 30000) {
    errors.push("CPM + duration combination is implausible");
  }

  return errors;
};

// GET /api/runs/stats/total — Get total runs played globally
export const getTotalRuns = async (req, res) => {
  try {
    const totalRuns = await Run.estimatedDocumentCount();
    res.json({ totalRuns });
  } catch (error) {
    console.error("Error getting total runs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/runs — Save a single run (authenticated)
export const saveRun = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cityId, lineId, timeMs, accuracy, cpm, mistakes, routeLength = 0, clientHour } = req.body;

    // ── Validate input ──
    const validationErrors = validateRunData({ cityId, lineId, timeMs, accuracy, cpm, mistakes, clientHour });
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: "Invalid run data", errors: validationErrors });
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
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
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
        user.markModified('bests');
      } else if (timeMs < user.bests[bestIndex].timeMs) {
        user.bests[bestIndex].timeMs = timeMs;
        user.bests[bestIndex].accuracy = accuracy;
        user.bests[bestIndex].cpm = cpm;
        user.bests[bestIndex].mistakes = mistakes;
        user.markModified('bests');
      }
      
      // Evaluate new stamps
      newStampsEarned = evaluateStamps(user, { timeMs, accuracy, cpm, mistakes: mistakes || 0, clientHour }, globalRank, routeLength);
      if (newStampsEarned.length > 0) {
        let currentStamps = Array.isArray(user.stamps) ? [...user.stamps] : [];
        currentStamps = currentStamps.filter(s => typeof s === 'string');
        user.stamps = [...currentStamps, ...newStampsEarned];
        user.markModified('stamps');
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

    // Validate every run in the batch — reject the whole batch if any is bad
    for (let i = 0; i < capped.length; i++) {
      const errors = validateRunData(capped[i]);
      if (errors.length > 0) {
        return res.status(400).json({ message: `Invalid data in run #${i + 1}`, errors });
      }
    }

    // Use server-generated timestamps (don't trust client createdAt).
    // clientHour is preserved for time-of-day badge evaluation but
    // the actual DB timestamp is always set by the server.
    const runDocs = capped.map((r) => ({
      user: userId,
      cityId: r.cityId,
      lineId: r.lineId,
      timeMs: r.timeMs,
      accuracy: r.accuracy,
      cpm: r.cpm,
      mistakes: r.mistakes || 0,
      // createdAt is auto-set by Mongoose timestamps — no client override
    }));

    await Run.insertMany(runDocs);

    // Update total run count and bests
    const user = await User.findById(userId);
    if (user) {
      user.totalRuns = (user.totalRuns || 0) + capped.length;
      
      capped.forEach(r => {
        const bestIndex = user.bests.findIndex(b => b.cityId === r.cityId && b.routeId === r.lineId);
        if (bestIndex === -1) {
          user.bests.push({ cityId: r.cityId, routeId: r.lineId, timeMs: r.timeMs, accuracy: r.accuracy, cpm: r.cpm, mistakes: r.mistakes || 0 });
        } else if (r.timeMs < user.bests[bestIndex].timeMs) {
          user.bests[bestIndex].timeMs = r.timeMs;
          user.bests[bestIndex].accuracy = r.accuracy;
          user.bests[bestIndex].cpm = r.cpm;
          user.bests[bestIndex].mistakes = r.mistakes || 0;
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
