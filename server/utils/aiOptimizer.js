const crypto = require("crypto");
const { GoogleGenAI } = require("@google/genai");
const redis = require("./redisClient");

// ─── Singleton AI client ──────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── In-flight deduplication map ─────────────────────────────────────────────
const inflight = new Map();

// ─── Constants parsed once at startup ────────────────────────────────────────
function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_TIMEOUT_MS  = parsePositiveInt(process.env.GEMINI_TIMEOUT_MS, 90000);
const DEFAULT_MAX_RETRIES = parsePositiveInt(process.env.GEMINI_MAX_RETRIES, 2);
const DEFAULT_MODEL       = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

// ─── L1 In-Memory LRU Cache (sits in front of Redis) ─────────────────────────
// Purpose: Zero-latency hit for hot/repeated requests (same code reviewed again).
// Eviction: LRU via insertion-order Map + manual cap.

const L1_MAX    = parsePositiveInt(process.env.L1_CACHE_MAX, 200);
const L1_TTL_MS = parsePositiveInt(process.env.L1_CACHE_TTL_MS, 60 * 60 * 1000); // 1 hour default

const l1Cache = new Map(); // key → { value, expiresAt }

function l1Get(key) {
  const entry = l1Cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { l1Cache.delete(key); return null; }
  // LRU: move to end
  l1Cache.delete(key);
  l1Cache.set(key, entry);
  return entry.value;
}

function l1Set(key, value, ttlMs = L1_TTL_MS) {
  if (l1Cache.size >= L1_MAX) {
    // Evict oldest (first entry in insertion order)
    l1Cache.delete(l1Cache.keys().next().value);
  }
  l1Cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// ─── Hashing helpers ──────────────────────────────────────────────────────────
function hashString(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ─── Redis (L2) cache helpers ─────────────────────────────────────────────────
async function readJsonCache(key) {
  // L1 hit — no Redis I/O at all
  const l1 = l1Get(key);
  if (l1 !== null) return l1;

  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Promote into L1 for next request
    l1Set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

async function writeJsonCache(key, ttlSec, value) {
  if (!ttlSec || ttlSec <= 0) return;
  // Write both levels concurrently — don't await either
  l1Set(key, value, Math.min(ttlSec * 1000, L1_TTL_MS));
  redis.setEx(key, ttlSec, JSON.stringify(value)).catch(() => {});
}

// ─── Gemini error classification ──────────────────────────────────────────────
function isRetryableGeminiError(error) {
  const status = error?.status || error?.code;
  const msg = String(error?.message || "").toLowerCase();
  return (
    status === 429 || status === 408 || status === 500 ||
    status === 502 || status === 503 || status === 504 ||
    msg.includes("timeout") || msg.includes("resource_exhausted") ||
    msg.includes("temporarily unavailable") || msg.includes("internal")
  );
}

function isQuotaError(error) {
  const status = error?.status || error?.code;
  const msg = String(error?.message || "").toLowerCase();
  return status === 429 || msg.includes("quota") || msg.includes("resource_exhausted");
}

// ─── Gemini: standard (buffered) call ─────────────────────────────────────────
async function generateGeminiText({
  model      = DEFAULT_MODEL,
  contents,
  config     = {},
  timeoutMs  = DEFAULT_TIMEOUT_MS,
  maxRetries = DEFAULT_MAX_RETRIES,
}) {
  // Enforce token budget to limit output size → faster response
  const mergedConfig = {
    maxOutputTokens: parsePositiveInt(process.env.GEMINI_MAX_OUTPUT_TOKENS, 2048),
    // Disable thinking budget for flash models — removes extra latency
    ...(model.includes("flash") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    ...config,
  };

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const ac    = new AbortController();
    const timer = setTimeout(() => ac.abort(new Error(`Gemini timed out after ${timeoutMs}ms`)), timeoutMs);

    try {
      const response = await ai.models.generateContent({
        model, contents, config: mergedConfig, signal: ac.signal,
      });
      const text = response?.text;
      if (typeof text !== "string" || !text.trim()) {
        throw new Error("Gemini returned an empty response.");
      }
      return text;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && isRetryableGeminiError(error)) {
        await new Promise(r => setTimeout(r, Math.min(1200, 300 * (2 ** attempt))));
      } else {
        break;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error("Gemini request failed.");
}

// ─── Gemini: SSE streaming call ───────────────────────────────────────────────
/**
 * Streams Gemini output directly into an Express SSE response.
 * The client receives chunks as they are generated — first token arrives in ~1s
 * instead of waiting for the full response (typically 10-30s for large prompts).
 *
 * Protocol (sent to client):
 *   data: {"chunk":"...text..."}   — incremental token chunk
 *   data: {"done":true}            — stream complete
 *   data: {"error":"..."}         — on failure
 */
async function streamGeminiToSSE({
  res,
  model   = DEFAULT_MODEL,
  contents,
  config  = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onChunk,   // optional: called with each text chunk (for assembling full response)
}) {
  const mergedConfig = {
    maxOutputTokens: parsePositiveInt(process.env.GEMINI_MAX_OUTPUT_TOKENS, 2048),
    ...(model.includes("flash") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    ...config,
  };

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  const ac    = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const stream = await ai.models.generateContentStream({
      model, contents, config: mergedConfig, signal: ac.signal,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const text = chunk?.text;
      if (typeof text === "string" && text) {
        fullText += text;
        if (onChunk) onChunk(text);
        res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return fullText;
  } catch (error) {
    if (!res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message || "Stream failed" })}\n\n`);
    }
    res.end();
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ─── In-flight coalescing ─────────────────────────────────────────────────────
async function withInFlight(key, operation) {
  if (inflight.has(key)) return inflight.get(key);
  const promise = operation().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

// ─── Two-level cache-or-compute ───────────────────────────────────────────────
async function getOrComputeJson({ cacheKey, ttlSec, compute }) {
  if (ttlSec > 0) {
    const cached = await readJsonCache(cacheKey); // L1 then L2
    if (cached !== null) return { value: cached, cached: true };
  }

  return withInFlight(cacheKey, async () => {
    // Double-check after acquiring inflight slot
    if (ttlSec > 0) {
      const cached = await readJsonCache(cacheKey);
      if (cached !== null) return { value: cached, cached: true };
    }

    const value = await compute();
    writeJsonCache(cacheKey, ttlSec, value); // fire-and-forget, writes L1+L2
    return { value, cached: false };
  });
}

module.exports = {
  hashString,
  hashBuffer,
  readJsonCache,
  writeJsonCache,
  getOrComputeJson,
  generateGeminiText,
  streamGeminiToSSE,
  isQuotaError,
};
