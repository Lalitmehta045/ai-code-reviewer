const express = require("express");
const {
  registerUser,
  loginUser,
  googleAuthStart,
  googleAuthCallback
} = require("../controllers/auth.controller");
const loginRateLimiter = require("../middleware/loginRateLimiter");
const router = express.Router();

// Route: POST /api/auth/register
router.post("/register", registerUser);

// Route: POST /api/auth/login
router.post("/login", loginRateLimiter, loginUser);

// Route: GET /api/auth/google
router.get("/google", googleAuthStart);

// Route: GET /api/auth/google/callback
router.get("/google/callback", googleAuthCallback);

module.exports = router;
