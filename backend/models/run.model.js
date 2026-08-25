import mongoose from "mongoose";

const runSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // This links directly to your User model!
      required: true,
    },
    cityId: {
      type: String,
      required: true, // e.g., "delhi"
    },
    lineId: {
      type: String,
      required: true, // e.g., "yellow_line"
    },
    timeMs: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      required: true,
    },
    cpm: {
      type: Number,
      required: true,
    },
    mistakes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Compound index to drastically speed up Leaderboard queries and Global Rank calculations
// Sorting by city, then line, then fastest time means MongoDB doesn't have to scan the whole collection.
runSchema.index({ cityId: 1, lineId: 1, timeMs: 1 });

// Compound index to drastically speed up finding a user's Run History
// Groups by user, then sorts their runs from newest to oldest so it can instantly grab the latest 100.
runSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Run", runSchema);
