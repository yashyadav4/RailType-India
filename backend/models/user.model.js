import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    googleId: {
      type: String,
      required: true,
      unique: true,
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
