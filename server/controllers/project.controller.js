const { GoogleGenAI } = require("@google/genai");
const AdmZip = require("adm-zip");
const path = require("path");
const fs = require("fs");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// File extensions to analyze
const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".h",
  ".cs", ".go", ".rs", ".rb", ".php", ".html", ".css", ".scss",
  ".sass", ".less", ".vue", ".svelte", ".json", ".xml", ".yaml",
  ".yml", ".toml", ".md", ".sql", ".sh", ".bat", ".ps1",
  ".dockerfile", ".env.example", ".gitignore", ".eslintrc",
  ".prettierrc", ".babelrc", ".webpack.config.js", ".vite.config.js",
  ".tsconfig.json", ".prisma", ".graphql", ".proto"
]);

// Files/dirs to skip
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "__pycache__",
  "venv", ".venv", "vendor", "target", "bin", "obj", ".idea",
  ".vscode", "coverage", ".cache", ".parcel-cache"
]);

const SKIP_FILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
  "composer.lock", "Gemfile.lock", "Pipfile.lock"
]);

const MAX_FILE_SIZE = 50000; // 50KB per file
const MAX_TOTAL_SIZE = 300000; // 300KB total content to send to AI

function extractAndReadFiles(zipBuffer) {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const files = [];
  let totalSize = 0;

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const entryName = entry.entryName.replace(/\\/g, "/");
    const parts = entryName.split("/");

    // Skip unwanted directories
    if (parts.some(p => SKIP_DIRS.has(p))) continue;

    const fileName = path.basename(entryName);
    const ext = path.extname(fileName).toLowerCase();

    // Skip unwanted files
    if (SKIP_FILES.has(fileName)) continue;

    // Only process code files or known config files
    const isCodeFile = CODE_EXTENSIONS.has(ext) ||
      fileName === "Dockerfile" ||
      fileName === "Makefile" ||
      fileName === "Procfile" ||
      fileName.endsWith(".config.js") ||
      fileName.endsWith(".config.ts");

    if (!isCodeFile) continue;

    const content = entry.getData().toString("utf8");

    if (content.length > MAX_FILE_SIZE) continue;
    if (totalSize + content.length > MAX_TOTAL_SIZE) break;

    totalSize += content.length;
    files.push({ path: entryName, content });
  }

  return files;
}

function buildFileTree(files) {
  const tree = [];
  for (const f of files) {
    tree.push(f.path);
  }
  return tree.join("\n");
}

const analyzeProject = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a ZIP file" });
    }

    const files = extractAndReadFiles(req.file.buffer);

    if (files.length === 0) {
      return res.status(400).json({ success: false, message: "No code files found in the ZIP. Make sure it contains source code." });
    }

    const fileTree = buildFileTree(files);

    // Build code content for AI
    let codeContent = "";
    for (const file of files) {
      codeContent += `\n--- FILE: ${file.path} ---\n${file.content}\n`;
    }

    const prompt = `Analyze this project codebase and produce a professional-grade interview preparation report.

===== PROJECT FILE TREE =====
${fileTree}

===== SOURCE CODE =====
${codeContent}

Generate the report in **EXACT** Markdown format below. Follow every formatting rule precisely.

---

# Project Analysis Report

---

## 1. Executive Summary

| Field | Detail |
|-------|--------|
| **Project Name** | _(infer from package.json, config, or root folder)_ |
| **Project Type** | _(e.g., Full-Stack Web App, REST API, CLI Tool, Library)_ |
| **Description** | _(2-3 sentence summary of what the project does)_ |
| **Primary Language** | _(e.g., JavaScript / TypeScript / Python)_ |
| **Total Files Analyzed** | ${files.length} |

---

## 2. Technology Stack

Present as a **table**. Include version numbers when available from package.json or config files. Only include categories that apply.

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Runtime | e.g. Node.js | — | Server runtime |
| Framework | e.g. Express.js | v5.2.1 | HTTP framework |
| Database | e.g. MongoDB | — | Data persistence |
| ORM/ODM | e.g. Mongoose | v9.4.1 | MongoDB object modeling |
| Frontend | e.g. React | v18.3.1 | UI library |
| Styling | e.g. TailwindCSS | v4.2.2 | Utility-first CSS |
| Build Tool | e.g. Vite | v8.0.8 | Dev server & bundler |
| Auth | e.g. JWT | — | Token authentication |
| Testing | e.g. Jest | — | Unit testing |
| DevOps | e.g. Vercel | — | Deployment |
| _...add more rows as needed_ | | | |

---

## 3. Architecture & Design Patterns

### 3.1 Architecture Overview
> Describe the high-level architecture in 3-4 sentences (e.g., MVC, client-server, monorepo, microservices).

### 3.2 Folder Structure Breakdown

\`\`\`
Reproduce a clean, simplified tree of the project structure with annotations:
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-level pages
│   │   └── context/     # React Context providers
├── server/          # Express backend
│   ├── controllers/     # Route handlers / business logic
│   ├── routes/          # API route definitions
│   ├── middleware/       # Auth & other middleware
│   ├── models/          # Mongoose schemas
│   └── config/          # DB & env configuration
\`\`\`

### 3.3 Design Patterns Detected

| Pattern | Where Used | Example |
|---------|-----------|---------|
| e.g. MVC | Server-side | \`controllers/\`, \`models/\`, \`routes/\` |
| e.g. Context API | Client-side | \`AuthContext.jsx\` for global state |
| _...add more_ | | |

### 3.4 Data Flow
Describe request → response flow in numbered steps:
1. Client sends request → ...
2. ...

---

## 4. Key Files & Modules

| File Path | Responsibility | Key Exports / Functions |
|-----------|---------------|----------------------|
| e.g. \`server/app.js\` | Express app setup, middleware, route mounting | \`app\` |
| e.g. \`server/controllers/auth.controller.js\` | Login/signup logic | \`login\`, \`signup\` |
| _...list 10-15 most important files_ | | |

---

## 5. API Endpoints (if applicable)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | \`/api/auth/login\` | No | User login |
| POST | \`/api/auth/signup\` | No | User registration |
| _...list all endpoints_ | | | |

---

## 6. Code Quality Assessment

### 6.1 Strengths
- _(list 4-5 specific strengths with file references)_

### 6.2 Areas for Improvement
- _(list 4-5 specific weaknesses with file references)_

### 6.3 Security Analysis

| Risk | Severity | Location | Recommendation |
|------|----------|----------|----------------|
| e.g. Hardcoded secret | High | \`.env\` / \`config.js\` | Use env variables with rotation |
| _...list all found_ | | | |

### 6.4 Performance Considerations
- _(list specific performance observations)_

---

## 7. Interview Questions & Answers

### 7.1 Basic Level

> **Q1:** _[Question directly about this project]_
>
> **Answer:** _[Detailed answer referencing specific files/functions from the codebase. Include short code snippets where helpful.]_

> **Q2:** ...
_(Generate exactly 5 Q&A pairs)_

### 7.2 Intermediate Level

> **Q1:** _[Deeper question about architecture decisions, patterns, or implementation details]_
>
> **Answer:** _[Thorough answer with code references]_

_(Generate exactly 5 Q&A pairs)_

### 7.3 Advanced Level

> **Q1:** _[Complex question about scalability, edge cases, security, or system design choices]_
>
> **Answer:** _[Expert-level answer with code examples and trade-off analysis]_

_(Generate exactly 5 Q&A pairs)_

---

## 8. Technical Deep-Dives

For each major concept used in the project, provide:

### 8.1 [Concept Name, e.g. JWT Authentication]
- **What it is:** _(1-2 sentences)_
- **How it's implemented here:** _(reference specific files and code)_
- **Why this approach:** _(trade-offs and alternatives)_
- **Common interview follow-ups:** _(2-3 likely follow-up questions)_

_(Repeat for 5-6 key concepts)_

---

## 9. Suggested Improvements

| # | Improvement | Priority | Impact | Implementation Hint |
|---|------------|----------|--------|-------------------|
| 1 | e.g. Add input validation | High | Security | Use Joi or Zod schemas |
| 2 | ... | | | |
| _...list 6-8 improvements_ | | | | |

---

## 10. Quick Revision Cheat Sheet

> Use this section for last-minute interview prep — read it 10 minutes before your interview.

- **Project in one line:** _[single sentence description]_
- **Tech stack keywords:** _[comma-separated list of all technologies]_
- **Architecture:** _[one-liner, e.g., "Client-Server MVC with React frontend and Express REST API"]_
- **Auth flow:** _[brief]_
- **Database:** _[what DB + ODM/ORM + key models]_
- **Key endpoints:** _[list top 3-4]_
- **Top 3 things interviewer will ask:**
  1. ...
  2. ...
  3. ...
- **Your "go-to" impressive talking point:** _[one specific thing in the code you can explain in depth]_

---

**RULES:**
1. Be 100% specific to THIS project — reference actual file names, function names, variable names, and real code from the uploaded codebase.
2. Never invent or assume files/code that don't exist in the uploaded project.
3. Use proper Markdown tables (with alignment), blockquotes for Q&A, and fenced code blocks with language tags.
4. Keep the report professional, clean, and scannable — like a senior engineer wrote it.
5. Every answer in Q&A must reference at least one specific file or function from the project.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: `You are a principal software engineer at a top tech company who also conducts technical interviews. You write with authority, precision, and clarity. Your reports are known for being exceptionally well-structured and actionable.

FORMAT RULES:
- Use Markdown tables wherever data is tabular — never use bullet lists for structured data.
- Use blockquote (>) format for all Q&A pairs.
- Use fenced code blocks with correct language tags for all code snippets.
- Use horizontal rules (---) between major sections.
- Keep headings numbered (1, 2, 3...) for professional document structure.
- Bold all important terms on first use.
- Be concise but thorough — no filler, no fluff.`
      }
    });

    const aiResponseText = response.text;

    res.json({
      success: true,
      data: aiResponseText,
      fileCount: files.length,
      fileTree: fileTree
    });

  } catch (error) {
    console.error("Project Analysis Error:", error);

    // Clean up uploaded file on error
    res.status(500).json({
      success: false,
      message: error.message || "Error analyzing project. Please try again."
    });
  }
};

module.exports = { analyzeProject };
