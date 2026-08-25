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

export default mongoose.model("Run", runSchema);
