const express = require("express");
const multer = require("multer");
const { analyzeProject } = require("../controllers/project.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Configure multer for memory storage (no disk write)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/zip" ||
        file.mimetype === "application/x-zip-compressed" ||
        file.mimetype === "application/x-zip" ||
        file.originalname.endsWith(".zip")) {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP files are allowed"), false);
    }
  }
});

// Apply auth middleware
router.use(authMiddleware);

// POST /api/project/analyze
router.post("/analyze", upload.single("projectFile"), analyzeProject);

module.exports = router;
