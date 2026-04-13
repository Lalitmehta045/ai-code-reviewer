const express = require("express");
const { generateReview, getUserHistory } = require("../controllers/review.controller");
const authMiddleware = require("../middleware/auth.middleware");
const router = express.Router();

// Apply auth middleware to all review routes
router.use(authMiddleware);

// Route: GET /api/reviews
router.get("/", getUserHistory);

// Route: POST /api/reviews
router.post("/", generateReview);

module.exports = router;
