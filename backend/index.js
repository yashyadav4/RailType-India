import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
dotenv.config({});
const app = express();

const port = process.env.port || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

app.get("/home", (req, res) => {
  return res.status(200).json({
    message: "from the home page",
  });
});

app.listen(port, () => {
  connectDB();
  console.log(`listning port ${port}`);
});
