const redis = require("../utils/redisClient");

function getWindow() {
  return parseInt(process.env.RATE_LIMIT_WINDOW_SEC || "60", 10);
}
function getLimitIP() {
  return parseInt(process.env.RATE_LIMIT_LOGIN_IP || "50", 10);
}
function getLimitEmail() {
  return parseInt(process.env.RATE_LIMIT_LOGIN_EMAIL || "10", 10);
}

async function bumpKey(key, windowSec) {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSec);
  }
  return count;
}

module.exports = async function loginRateLimiter(req, res, next) {
  try {
    const windowSec = getWindow();
    const limitIP = getLimitIP();
    const limitEmail = getLimitEmail();

    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    const rawEmail = (req.body && req.body.email) ? String(req.body.email) : "";
    const email = rawEmail.trim().toLowerCase();

    // Rate limit by IP
    const ipKey = `rl:login:ip:${ip}`;
    const ipCount = await bumpKey(ipKey, windowSec);
    if (ipCount > limitIP) {
      const ttl = await redis.ttl(ipKey);
      if (ttl > 0) res.setHeader("Retry-After", String(ttl));
      return res.status(429).json({ success: false, message: "Too many attempts. Please try again later." });
    }

    // Rate limit by email if provided
    if (email) {
      const emailKey = `rl:login:email:${email}`;
      const emailCount = await bumpKey(emailKey, windowSec);
      if (emailCount > limitEmail) {
        const ttl = await redis.ttl(emailKey);
        if (ttl > 0) res.setHeader("Retry-After", String(ttl));
        return res.status(429).json({ success: false, message: "Too many attempts. Please try again later." });
      }
    }

    return next();
  } catch (err) {
    // Fail-open on limiter errors to avoid blocking logins if Redis is unavailable
    console.warn("[RateLimit] error:", err.message);
    return next();
  }
};
