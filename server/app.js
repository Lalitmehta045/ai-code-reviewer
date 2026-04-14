const express = require("express");
const cors = require("cors");

// Import Routes
const authRoutes = require("./routes/auth.routes");
const reviewRoutes = require("./routes/review.routes");
const projectRoutes = require("./routes/project.routes");

const app = express();

// Global Middleware
app.use(cors({
  origin: [
    "https://ai-code-analyzer-tool.vercel.app",
    "https://codeanalyzer.cloud",
    "https://www.codeanalyzer.cloud",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/project", projectRoutes);

// Export Express App
module.exports = app;
