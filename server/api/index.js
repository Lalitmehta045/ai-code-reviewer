require("dotenv").config();
const connectDB = require("../config/db");
const app = require("../app");

// Connect to MongoDB (reuse connection in serverless)
let isConnected = false;
const ensureDbConnected = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

// Wrap app to ensure DB connection before handling requests
module.exports = async (req, res) => {
  await ensureDbConnected();
  return app(req, res);
};
