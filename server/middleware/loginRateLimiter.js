const redis = require("../utils/redisClient");

// ─── Config (read once per request, not at module level, to respect env changes) ──
function getWindow()      { return parseInt(process.env.RATE_LIMIT_WINDOW_SEC   || "60", 10); }
function getLimitIP()     { return parseInt(process.env.RATE_LIMIT_LOGIN_IP     || "50", 10); }
function getLimitEmail()  { return parseInt(process.env.RATE_LIMIT_LOGIN_EMAIL  || "10", 10); }

/**
 * Atomically increment a key and set its expiry in a single round-trip.
 *
 * Instead of the previous two serial calls (INCR then EXPIRE), we use the
 * Redis SET … EX … NX pattern:
 *   • On first touch: SET key 1 EX <window> NX  → OK
 *   • On subsequent touches: INCR (which keeps the existing TTL intact)
 *
 * This halves the number of Redis round-trips per key per request.
 */
async function bumpKey(key, windowSec) {
  // Try to initialise the key atomically (NX = only set if not exists)
  const initialised = await redis.setEx(key, windowSec, "1", { nx: true });
  if (initialised === "OK" || initialised === 1) {
    // Key was freshly created — count is 1 and TTL is already set
    return 1;
  }

  // Key already exists — increment and leave existing TTL untouched
  return redis.incr(key);
}

module.exports = async function loginRateLimiter(req, res, next) {
  try {
    const windowSec  = getWindow();
    const limitIP    = getLimitIP();
    const limitEmail = getLimitEmail();

    const ip       = req.ip || req.connection?.remoteAddress || "unknown";
    const rawEmail = req.body?.email ? String(req.body.email) : "";
    const email    = rawEmail.trim().toLowerCase();

    const ipKey    = `rl:login:ip:${ip}`;
    const emailKey = email ? `rl:login:email:${email}` : null;

    // ── Parallel: bump both counters simultaneously ────────────────────────────
    const [ipCount, emailCount] = await Promise.all([
      bumpKey(ipKey, windowSec),
      emailKey ? bumpKey(emailKey, windowSec) : Promise.resolve(0),
    ]);

    if (ipCount > limitIP) {
      const ttl = await redis.ttl(ipKey);
      if (ttl > 0) res.setHeader("Retry-After", String(ttl));
      return res.status(429).json({ success: false, message: "Too many attempts. Please try again later." });
    }

    if (emailKey && emailCount > limitEmail) {
      const ttl = await redis.ttl(emailKey);
      if (ttl > 0) res.setHeader("Retry-After", String(ttl));
      return res.status(429).json({ success: false, message: "Too many attempts. Please try again later." });
    }

    return next();
  } catch (err) {
    // Fail-open: never block legitimate logins due to Redis unavailability
    console.warn("[RateLimit] error:", err.message);
    return next();
  }
};
