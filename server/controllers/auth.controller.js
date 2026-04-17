let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch (e) {
  bcrypt = require("bcryptjs");
}
const jwt = require("jsonwebtoken");
const passport = require("../config/passport");
const redis = require("../utils/redisClient");
const User = require("../models/user.model");

const signJwt = (userId) => (
  jwt.sign({ id: String(userId) }, process.env.JWT_SECRET || "supersecret", { expiresIn: "1d" })
);

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email
});

const buildFrontendRedirectUrl = (params = {}) => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }

  const callbackPath = process.env.GOOGLE_FRONTEND_CALLBACK_PATH || "/auth/google/callback";
  const redirectUrl = new URL(callbackPath, frontendUrl.endsWith("/") ? frontendUrl : `${frontendUrl}/`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      redirectUrl.searchParams.set(key, String(value));
    }
  });

  return redirectUrl.toString();
};

const tryBuildFrontendRedirectUrl = (params = {}) => {
  try {
    return buildFrontendRedirectUrl(params);
  } catch (error) {
    console.error("Frontend redirect URL build failed:", error.message);
    return null;
  }
};

const isGoogleOAuthConfigured = () => (
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
);

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

    const token = signJwt(user._id);

    res.status(201).json({
      success: true,
      token,
      user: serializeUser(user)
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
    if (!user.password) {
      return res.status(400).json({ success: false, message: "Use Google sign-in for this account" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = signJwt(user._id);

    res.json({
      success: true,
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const googleAuthStart = (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({ success: false, message: "Google OAuth is not configured" });
  }

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false
  })(req, res, next);
};

const googleAuthCallback = (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({ success: false, message: "Google OAuth is not configured" });
  }

  passport.authenticate("google", { session: false }, (error, user) => {
    if (error || !user) {
      const oauthError = error?.message || "No user returned from Google OAuth";
      console.error("Google OAuth callback failed:", oauthError);

      const errorRedirect = tryBuildFrontendRedirectUrl({
        error: "google_auth_failed"
      });
      if (errorRedirect) {
        return res.redirect(errorRedirect);
      }

      return res.status(401).json({
        success: false,
        message: "Google authentication failed",
        error: process.env.NODE_ENV === "production" ? undefined : oauthError
      });
    }

    try {
      const token = signJwt(user._id);
      const successRedirect = tryBuildFrontendRedirectUrl({ token });

      if (successRedirect) {
        return res.redirect(successRedirect);
      }

      return res.status(200).json({
        success: true,
        token,
        user: serializeUser(user),
        message: "Google authentication succeeded but FRONTEND_URL is not configured, so redirect was skipped"
      });
    } catch (callbackError) {
      console.error("Google OAuth callback post-auth failure:", callbackError.message);
      return res.status(500).json({ success: false, message: "Google authentication failed" });
    }
  })(req, res, next);
};

module.exports = {
  registerUser,
  loginUser,
  googleAuthStart,
  googleAuthCallback
};
