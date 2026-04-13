const express = require("express");
const cors = require("cors");

// Import Routes
const authRoutes = require("./routes/auth.routes");
const reviewRoutes = require("./routes/review.routes");

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);

// Export Express App
module.exports = app;
