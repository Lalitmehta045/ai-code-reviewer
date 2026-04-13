const express = require("express");
const { registerUser, loginUser } = require("../controllers/auth.controller");
const router = express.Router();

// Route: POST /api/auth/register
router.post("/register", registerUser);

// Route: POST /api/auth/login
router.post("/login", loginUser);

module.exports = router;
