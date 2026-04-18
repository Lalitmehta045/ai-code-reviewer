const jwt = require("jsonwebtoken");

/**
 * In-process JWT decode cache.
 *
 * jwt.verify() is a synchronous, CPU-bound operation (HMAC-SHA256).
 * For authenticated endpoints that receive many requests per second from the
 * same session, caching the decoded payload avoids repeating the crypto work.
 *
 * Cache eviction: entries stored until the token's own `exp` claim, checked
 * on every access.  Map is bounded by active tokens (typically O(users)).
 */
const tokenCache = new Map();
const TOKEN_CACHE_MAX = 5000; // Safety cap to avoid unbounded growth

function getCached(token) {
  const entry = tokenCache.get(token);
  if (!entry) return null;
  // Evict if token has expired (exp is Unix seconds)
  if (entry.exp && Math.floor(Date.now() / 1000) >= entry.exp) {
    tokenCache.delete(token);
    return null;
  }
  return entry.decoded;
}

function setCache(token, decoded) {
  if (tokenCache.size >= TOKEN_CACHE_MAX) {
    // Evict the oldest entry (first inserted) to keep memory bounded
    tokenCache.delete(tokenCache.keys().next().value);
  }
  tokenCache.set(token, { decoded, exp: decoded.exp });
}

// ─── Auth middleware ──────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ success: false, message: "No token, authorization denied" });
  }

  // Fast-path: return cached decoded payload without crypto work
  const cached = getCached(token);
  if (cached) {
    req.user = cached;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret");
    setCache(token, decoded);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Token is not valid" });
  }
};

module.exports = authMiddleware;
