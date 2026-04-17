let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch (e) {
  bcrypt = require("bcryptjs");
}
const jwt = require("jsonwebtoken");
const redis = require("../utils/redisClient");
const User = require("../models/user.model");

// Register a new user
const registerUser = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Normalize inputs early to maximize index hits and avoid duplicates with casing
    name = String(name).trim();
    email = String(email).trim().toLowerCase();

    // Single write: rely on unique index on email to prevent duplicates and avoid an extra read
    let user;
    try {
      user = await User.create({ name, email, password });
    } catch (err) {
      // Handle duplicate key error from unique index
      if (err && err.code === 11000) {
        return res.status(400).json({ success: false, message: "User already exists" });
      }
      throw err;
    }

    const token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET || "supersecret", { expiresIn: "1d" });

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Login existing user
const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Normalize to match indexed value
    email = String(email).trim().toLowerCase();

    // Negative cache check for unknown emails to avoid DB hit on repeated bad attempts
    const nxTtl = parseInt(process.env.NEGATIVE_CACHE_TTL_SEC || "30", 10);
    const nxKey = `nx:email:${email}`;
    try {
      const nx = await redis.get(nxKey);
      if (nx) {
        return res.status(400).json({ success: false, message: "Invalid credentials" });
      }
    } catch (e) {
      // If redis unavailable, continue normally
    }

    // Try positive cache for user lookup to avoid DB hit on repeat logins
    const userCacheTtl = parseInt(process.env.LOGIN_CACHE_TTL_SEC || "120", 10);
    const userCacheKey = `user:email:${email}`;
    let user = null;
    try {
      const cached = await redis.get(userCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed._id && parsed.password) {
          user = parsed;
        }
      }
    } catch (_) { /* ignore cache parse errors */ }

    // Fallback to DB if cache miss
    if (!user) {
      user = await User.findOne({ email })
        .select("+password name email")
        .lean()
        .exec();
      if (user) {
        try {
          const toCache = JSON.stringify({ _id: String(user._id), name: user.name, email: user.email, password: user.password });
          await redis.setEx(userCacheKey, userCacheTtl, toCache);
        } catch (_) { /* ignore cache set errors */ }
      }
    }
    if (!user) {
      // Set short-lived negative cache to reduce repeated lookups
      try { await redis.setEx(nxKey, nxTtl, "1", { nx: true }); } catch (e) {}
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET || "supersecret", { expiresIn: "1d" });

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { registerUser, loginUser };
