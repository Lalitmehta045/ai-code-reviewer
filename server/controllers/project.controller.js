const AdmZip = require("adm-zip");
const path = require("path");
const {
  hashBuffer,
  readJsonCache,
  writeJsonCache,
  getOrComputeJson,
  generateGeminiText,
  streamGeminiToSSE,
  isQuotaError,
} = require("../utils/aiOptimizer");
const { getUsageSnapshot, incrementUsage } = require("../utils/userUsage");

// ─── Config ───────────────────────────────────────────────────────────────────
function toPositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const ANALYZE_DAILY_LIMIT    = toPositiveInt(process.env.ANALYZE_DAILY_LIMIT,   3);
const ANALYZE_CACHE_TTL_SEC  = toPositiveInt(process.env.ANALYZE_CACHE_TTL_SEC, 21600);
const ANALYZE_PROMPT_VERSION = "v3";
const MAX_FILE_SIZE          = toPositiveInt(process.env.ANALYZE_MAX_FILE_SIZE,  40000);  // 40 KB per file
const MAX_TOTAL_SIZE         = toPositiveInt(process.env.ANALYZE_MAX_TOTAL_SIZE, 200000); // 200 KB total (was 300KB)

// ─── File-type sets (module-level: parsed once) ───────────────────────────────
const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".h",
  ".cs", ".go", ".rs", ".rb", ".php", ".html", ".css", ".scss",
  ".sass", ".less", ".vue", ".svelte", ".json", ".xml", ".yaml",
  ".yml", ".toml", ".md", ".sql", ".sh", ".bat", ".ps1",
  ".dockerfile", ".env.example", ".gitignore", ".eslintrc",
  ".prettierrc", ".babelrc", ".prisma", ".graphql", ".proto",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "__pycache__",
  "venv", ".venv", "vendor", "target", "bin", "obj", ".idea",
  ".vscode", "coverage", ".cache", ".parcel-cache",
]);

const SKIP_FILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
  "composer.lock", "Gemfile.lock", "Pipfile.lock",
]);

// ─── Priority score — key files analyzed first, filling the token budget ─────
const PRIORITY_FILENAMES = new Set([
  "index.js", "index.ts", "main.js", "main.ts", "app.js", "app.ts",
  "server.js", "server.ts", "package.json", "tsconfig.json",
  "Dockerfile", "docker-compose.yml", "README.md",
]);

function filePriority(filePath) {
  const base = path.basename(filePath);
  if (PRIORITY_FILENAMES.has(base)) return 0;
  if (base.endsWith(".config.js") || base.endsWith(".config.ts")) return 1;
  const ext = path.extname(base).toLowerCase();
  if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) return 2;
  if ([".py", ".go", ".rs", ".java"].includes(ext)) return 2;
  return 3;
}

// ─── Tighter system instruction ───────────────────────────────────────────────
const ANALYSIS_SYSTEM_INSTRUCTION =
  "Senior software engineer. Analyze the provided codebase. " +
  "Output valid Markdown only. Be specific and concise. " +
  "Reference only real files and functions from the code.";

// ─── ZIP extraction (async, event-loop-friendly) ──────────────────────────────
function extractAndReadFiles(zipBuffer) {
  return new Promise((resolve, reject) => {
    setImmediate(() => {
      try {
        const zip     = new AdmZip(zipBuffer);
        const entries = zip.getEntries();
        const files   = [];
        let totalSize = 0;

        for (const entry of entries) {
          if (entry.isDirectory) continue;

          const entryName = entry.entryName.replace(/\\/g, "/");
          const parts     = entryName.split("/");
          if (parts.some(p => SKIP_DIRS.has(p))) continue;

          const fileName = path.basename(entryName);
          const ext      = path.extname(fileName).toLowerCase();

          if (SKIP_FILES.has(fileName)) continue;

          const isCodeFile =
            CODE_EXTENSIONS.has(ext) ||
            fileName === "Dockerfile" || fileName === "Makefile" ||
            fileName === "Procfile"   ||
            fileName.endsWith(".config.js") || fileName.endsWith(".config.ts");

          if (!isCodeFile) continue;

          // Skip obviously oversized files early using declared size
          const declaredSize = Number(entry.header?.size || 0);
          if (declaredSize > MAX_FILE_SIZE) continue;

          const buf = entry.getData();
          if (!buf || buf.length === 0 || buf.length > MAX_FILE_SIZE) continue;
          if (totalSize + buf.length > MAX_TOTAL_SIZE) continue;

          const content = buf.toString("utf8");
          totalSize += buf.length;
          files.push({ path: entryName, content, priority: filePriority(entryName) });

          if (totalSize >= MAX_TOTAL_SIZE) break;
        }

        // Sort priority files first so the most important code fills the budget
        files.sort((a, b) => a.priority - b.priority);
        resolve(files);
      } catch (err) {
        reject(err);
      }
    });
  });
}

// ─── Prompt builder (compressed, token-efficient) ─────────────────────────────
/**
 * Strips blank lines and trailing whitespace from each file's content before
 * injecting into the prompt. Reduces tokens by ~20% for most codebases.
 */
function compressContent(content) {
  return content
    .split("\n")
    .map(l => l.trimEnd())
    .filter((l, i, a) => {
      if (l.trim()) return true;
      const prev = (a[i - 1] || "").trim();
      const next = (a[i + 1] || "").trim();
      return prev && next;
    })
    .join("\n");
}

function buildAnalysisPrompt(files) {
  const fileTree    = files.map(f => f.path).join("\n");
  const codeContent = files
    .map(f => `### ${f.path}\n\`\`\`\n${compressContent(f.content)}\n\`\`\``)
    .join("\n\n");

  return {
    fileTree,
    prompt: `Analyze this codebase. Generate a structured interview-ready report.

FILE TREE:
${fileTree}

SOURCE CODE (${files.length} files):
${codeContent}

OUTPUT — Markdown with ALL of these sections:
1. Executive Summary — table: project name, type, language, purpose, files analyzed
2. Technology Stack — table: category, technology, version if known, purpose
3. Architecture & Data Flow — overview + key design patterns + request flow
4. Key Files & Modules — table: file, responsibility (10-15 rows)
5. API Endpoints — table: method, endpoint, auth, description
6. Code Quality — strengths & weaknesses, mini security table, performance notes
7. Interview Q&A — 5 basic / 5 intermediate / 5 advanced with answers
8. Technical Deep-Dives — 5 concepts with implementation details from this code
9. Suggested Improvements — table: priority, change, impact
10. Quick Revision Cheat Sheet

Rules: Only reference real files/functions. No invented APIs. Use tables.`,
  };
}

// ─── Shared guard ─────────────────────────────────────────────────────────────
async function checkAccess(req, res) {
  if (!req.file?.buffer) {
    res.status(400).json({ success: false, message: "Please upload a ZIP file" });
    return null;
  }

  const userId   = req.user.id;
  const zipHash  = hashBuffer(req.file.buffer);
  const cacheKey = `ai:project:${ANALYZE_PROMPT_VERSION}:${zipHash}`;

  const [usage, cachedResult] = await Promise.all([
    getUsageSnapshot(userId, "analyze"),
    ANALYZE_CACHE_TTL_SEC > 0 ? readJsonCache(cacheKey) : Promise.resolve(null),
  ]);

  if (!usage) {
    res.status(404).json({ success: false, message: "User not found" });
    return null;
  }

  if (usage.currentCount >= ANALYZE_DAILY_LIMIT && !usage.isDeveloper) {
    res.status(429).json({
      success: false,
      message: `Daily limit of ${ANALYZE_DAILY_LIMIT} project analyses reached. Please come back tomorrow!`,
    });
    return null;
  }

  return { userId, cacheKey, usage, cachedResult };
}

// ─── POST /api/project/analyze — buffered (non-streaming) ────────────────────
const analyzeProject = async (req, res) => {
  try {
    const ctx = await checkAccess(req, res);
    if (!ctx) return;

    const { userId, cacheKey, usage, cachedResult } = ctx;
    const updatedCount = usage.currentCount + 1;
    const remaining    = usage.isDeveloper ? "Unlimited" : Math.max(0, ANALYZE_DAILY_LIMIT - updatedCount);

    // ── Cache hit ──────────────────────────────────────────────────────────────
    if (cachedResult?.data && cachedResult?.fileTree) {
      incrementUsage(userId, "analyze").catch(e => console.warn("[Usage]", e.message));
      return res.json({
        success: true,
        data: cachedResult.data,
        fileCount: cachedResult.fileCount,
        fileTree: cachedResult.fileTree,
        remaining,
        cached: true,
      });
    }

    // ── Cache miss: extract → prompt → Gemini ─────────────────────────────────
    const { value: result, cached } = await getOrComputeJson({
      cacheKey,
      ttlSec: ANALYZE_CACHE_TTL_SEC,
      compute: async () => {
        const files = await extractAndReadFiles(req.file.buffer);
        if (files.length === 0) {
          const err = new Error("No code files found in the ZIP. Make sure it contains source code.");
          err.status = 400;
          throw err;
        }
        const { prompt, fileTree } = buildAnalysisPrompt(files);
        const aiResponse = await generateGeminiText({
          model: "gemini-2.5-flash-lite",
          contents: prompt,
          config: { systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION },
        });
        return { data: aiResponse, fileCount: files.length, fileTree };
      },
    });

    await incrementUsage(userId, "analyze");

    return res.json({
      success: true,
      data: result.data,
      fileCount: result.fileCount,
      fileTree: result.fileTree,
      remaining,
      cached,
    });
  } catch (error) {
    console.error("Project Analysis Error:", error);
    if (error?.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (isQuotaError(error)) {
      return res.status(429).json({
        success: false,
        message: "AI API quota exceeded. Please try with a smaller project or wait a few minutes.",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Error analyzing project. Please try again.",
    });
  }
};

// ─── POST /api/project/analyze/stream — SSE streaming ────────────────────────
/**
 * Starts sending the analysis report token-by-token immediately.
 * The user sees content in ~1-2s instead of waiting 20-60s for a full ZIP analysis.
 *
 * SSE protocol:
 *   data: {"cached":true,"data":"..."}    — instant cache hit
 *   data: {"fileTree":"...","fileCount":N} — preamble before streaming starts
 *   data: {"chunk":"..."}                 — incremental Markdown token
 *   data: {"done":true}                   — stream complete
 *   data: {"error":"..."}                — on failure
 */
const analyzeProjectStream = async (req, res) => {
  try {
    const ctx = await checkAccess(req, res);
    if (!ctx) return;

    const { userId, cacheKey, usage, cachedResult } = ctx;
    const updatedCount = usage.currentCount + 1;
    const remaining    = usage.isDeveloper ? "Unlimited" : String(Math.max(0, ANALYZE_DAILY_LIMIT - updatedCount));

    // ── Cache hit: flush immediately, no Gemini call ───────────────────────────
    if (cachedResult?.data && cachedResult?.fileTree) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      res.write(`data: ${JSON.stringify({
        cached: true,
        data: cachedResult.data,
        fileCount: cachedResult.fileCount,
        fileTree: cachedResult.fileTree,
        remaining,
      })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      incrementUsage(userId, "analyze").catch(e => console.warn("[Usage]", e.message));
      return;
    }

    // ── Cache miss: extract ZIP then stream Gemini ─────────────────────────────
    const files = await extractAndReadFiles(req.file.buffer);
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No code files found in the ZIP. Make sure it contains source code.",
      });
    }

    const { prompt, fileTree } = buildAnalysisPrompt(files);

    // Send the file tree preamble BEFORE streaming starts
    // so the client can render the sidebar/tree immediately
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ fileTree, fileCount: files.length, remaining })}\n\n`);

    let fullText = "";

    await streamGeminiToSSE({
      res,
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: { systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION },
      onChunk: (chunk) => { fullText += chunk; },
    });

    // Cache the full result + increment usage after stream ends
    if (fullText) {
      writeJsonCache(cacheKey, ANALYZE_CACHE_TTL_SEC, {
        data: fullText, fileCount: files.length, fileTree,
      });
    }
    incrementUsage(userId, "analyze").catch(e => console.warn("[Usage]", e.message));
  } catch (error) {
    console.error("Project Stream Error:", error);
    if (!res.headersSent) {
      if (error?.status === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (isQuotaError(error)) {
        return res.status(429).json({
          success: false,
          message: "AI API quota exceeded. Please try with a smaller project or wait.",
        });
      }
      return res.status(500).json({ success: false, message: error.message || "Analysis failed." });
    }
    // Headers already sent — write error event into SSE stream
    try {
      res.write(`data: ${JSON.stringify({ error: error.message || "Analysis failed." })}\n\n`);
      res.end();
    } catch {}
  }
};

module.exports = { analyzeProject, analyzeProjectStream };
