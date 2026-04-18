const express = require("express");
const multer = require("multer");
const {
  analyzeProject,
  analyzeProjectStream,
} = require("../controllers/project.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Multer — memory storage, no disk write
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === "application/zip" ||
      file.mimetype === "application/x-zip-compressed" ||
      file.mimetype === "application/x-zip" ||
      file.originalname.endsWith(".zip");
    ok ? cb(null, true) : cb(new Error("Only ZIP files are allowed"), false);
  },
});

router.use(authMiddleware);

// POST /api/project/analyze        — buffered (complete response)
router.post("/analyze", upload.single("projectFile"), analyzeProject);

// POST /api/project/analyze/stream — SSE streaming (first token in ~1-2s)
router.post("/analyze/stream", upload.single("projectFile"), analyzeProjectStream);

module.exports = router;
