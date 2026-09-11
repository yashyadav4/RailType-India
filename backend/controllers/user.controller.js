import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    // Fetch the user's profile directly from Google's servers
    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!googleRes.ok) {
      return res.status(401).json({ message: "Invalid Google Token" });
    }

    const payload = await googleRes.json();
    const { sub, name, email, picture } = payload;

    let user = await User.findOne({ googleId: sub });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = new User({
        name,
        email,
        googleId: sub,
        picture,
        badges: [],
        bests: [],
      });
      await user.save();
    }

    // THIS is where the JWT is signed
    const sessionToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Login successful",
      token: sessionToken,
      isNewUser,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        badges: user.badges,
        totalRuns: user.totalRuns || 0,
        stamps: Array.isArray(user.stamps) ? user.stamps : [],
        bests: user.bests || [],
      },
    });
  } catch (error) {
    console.error("Error in googleLogin:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("-googleId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { name: name.trim() },
      { returnDocument: "after" }
    ).select("-googleId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};
