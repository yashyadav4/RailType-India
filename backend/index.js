import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoutes from "./routers/userRoutes.js";
import runRoutes from "./routers/runRoutes.js";
dotenv.config({});
const app = express();

const port = process.env.PORT || process.env.port || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
  "http://localhost:5173",
  "https://barber-uneaten-dinner.ngrok-free.dev",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith(".ngrok-free.dev") ||
      origin.endsWith(".ngrok-free.app")
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback to allow during dev tunnels
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/runs", runRoutes);

app.get("/", (req, res) => {
  return res.status(200).send("API is running!");
});

app.get("/home", (req, res) => {
  return res.status(200).json({
    message: "from the home page",
  });
});

app.listen(port, () => {
  connectDB();
  console.log(`listning port ${port}`);
});
