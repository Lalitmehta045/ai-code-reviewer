const express = require("express");
const {
  generateReview,
  generateReviewStream,
  getUserHistory,
} = require("../controllers/review.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Auth applied to all review routes
router.use(authMiddleware);

// GET  /api/reviews         — paginated review history
router.get("/", getUserHistory);

// POST /api/reviews         — buffered (full response at once)
router.post("/", generateReview);

// POST /api/reviews/stream  — SSE streaming (first token in ~1s)
router.post("/stream", generateReviewStream);

module.exports = router;
