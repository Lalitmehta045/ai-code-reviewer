const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const redis = require("./utils/redisClient");

// Import Routes
const authRoutes = require("./routes/auth.routes");
const reviewRoutes = require("./routes/review.routes");
const projectRoutes = require("./routes/project.routes");

const app = express();

// Global Middleware
const corsOptions = {
  origin: [
    "https://ai-code-analyzer-tool.vercel.app",
    "https://codeanalyzer.cloud",
    "https://www.codeanalyzer.cloud",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
  maxAge: parseInt(process.env.CORS_MAX_AGE_SEC || "600", 10)
};
app.use(cors(corsOptions));
app.disable("x-powered-by");
app.use(express.json());

// Health check endpoint for readiness/liveness and to enable warm-up probes
app.get("/health", async (req, res) => {
  const mongoState = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  let redisOk = false;
  try { redisOk = !!(await redis.ping()); } catch (_) { redisOk = false; }
  const mongoStatus = mongoState === 1 ? "up" : (mongoState === 2 ? "connecting" : "down");
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
    services: { mongo: mongoStatus, redis: redisOk ? "up" : "down" }
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/project", projectRoutes);

// Periodic warm-up to mitigate cold starts and keep connections hot (best-effort, non-blocking)
const WARMUP_INTERVAL_SEC = parseInt(process.env.HEALTH_WARMUP_INTERVAL_SEC || "300", 10);
try {
  setInterval(async () => {
    try { await redis.ping(); } catch (_) {}
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db?.admin) {
        await mongoose.connection.db.admin().command({ ping: 1 });
      }
    } catch (_) {}
  }, Math.max(60, WARMUP_INTERVAL_SEC) * 1000);
} catch (_) {}

// Export Express App
module.exports = app;
