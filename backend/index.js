import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
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

// Enable proxy trust for reverse proxies / ngrok / cloud hosting (gets real client IP)
app.set("trust proxy", 1);

// ── Rate Limiting ──────────────────────────────────────────────────
// General API limiter: 120 requests per 1 minute per IP
// Accommodates fast typists playing short lines (e.g. 13s runs, 5-6 runs/min),
// quick retries, and multiple players on the same campus/hostel WiFi.
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute (2 req/sec)
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down slightly and try again." },
});

// Stricter limiter for auth endpoints: 30 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
});

// API Routes
app.use("/api/users/google", authLimiter);  // Strict limit on login
app.use("/api/users", apiLimiter, userRoutes);
app.use("/api/runs", apiLimiter, runRoutes);

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
