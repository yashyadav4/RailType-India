import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type:String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    picture: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    totalRuns: {
      type: Number,
      default: 0,
    },
    stamps: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        type: String,
      },
    ],

    bests: [
      {
        cityId: { type: String, required: true },
        routeId: { type: String, required: true }, // e.g., "yellow_line"
        timeMs: { type: Number, required: true },
        accuracy: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
