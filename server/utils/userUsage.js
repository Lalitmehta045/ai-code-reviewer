const User = require("../models/user.model");

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();

// ─── Date utilities ───────────────────────────────────────────────────────────
function sameDay(dateA, dateB) {
  if (!dateA || !dateB) return false;
  return new Date(dateA).toDateString() === new Date(dateB).toDateString();
}

// ─── Field mapping ────────────────────────────────────────────────────────────
function getQuotaFields(type) {
  if (type === "analyze") {
    return { countField: "dailyAnalyzeCount", dateField: "lastAnalyzeDate" };
  }
  return { countField: "dailyReviewCount", dateField: "lastReviewDate" };
}

// ─── Usage snapshot ───────────────────────────────────────────────────────────
/**
 * Returns the current usage snapshot for a user.
 *
 * Optimization: If the stored date is from a previous day we reset the counter
 * using findOneAndUpdate (single round-trip) and return count=0 immediately,
 * without an extra read-then-write cycle.
 */
async function getUsageSnapshot(userId, type) {
  const { countField, dateField } = getQuotaFields(type);

  const user = await User.findById(userId)
    .select(`email ${countField} ${dateField}`)
    .lean();

  if (!user) return null;

  const isDeveloper = !!ADMIN_EMAIL && String(user.email || "").toLowerCase() === ADMIN_EMAIL;
  const now = new Date();
  const lastDate = user[dateField];

  // If still the same day, return the stored count immediately — no extra write.
  if (sameDay(now, lastDate)) {
    return { isDeveloper, currentCount: Number(user[countField] || 0) };
  }

  // Day has rolled over: reset asynchronously (fire-and-forget).
  // We don't await this — the actual increment happens in incrementUsage,
  // so the response is not delayed by this reset write.
  User.updateOne(
    { _id: userId },
    { $set: { [countField]: 0, [dateField]: now } }
  ).catch(err => console.warn("[Usage] day-reset write failed:", err.message));

  return { isDeveloper, currentCount: 0 };
}

// ─── Usage increment ──────────────────────────────────────────────────────────
/**
 * Increments both the count and refreshes the date in a single atomic write.
 * Uses $inc to avoid read-modify-write races.
 */
async function incrementUsage(userId, type) {
  const { countField, dateField } = getQuotaFields(type);
  await User.updateOne(
    { _id: userId },
    { $inc: { [countField]: 1 }, $set: { [dateField]: new Date() } }
  );
}

module.exports = { getUsageSnapshot, incrementUsage };
