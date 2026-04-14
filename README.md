<div align="center">

# AI Code Reviewer & Project Analyzer

### Ship Perfect Code. Ace Every Interview.

<p>
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite_8-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Google_Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render" />
</p>

<p>
  <a href="https://ai-code-analyzer-tool.vercel.app" target="_blank"><strong>🌐 Live Demo — Frontend</strong></a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="https://ai-code-reviewer-crgj.onrender.com" target="_blank"><strong>⚙️ Live API — Backend</strong></a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="https://github.com/Lalitmehta045/ai-code-reviewer/issues">🐛 Report Bug</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="https://github.com/Lalitmehta045/ai-code-reviewer/issues">💡 Request Feature</a>
</p>

</div>

---

## 📌 About The Project

**AI Code Reviewer** is a full-stack SaaS application that helps developers:

1. **Review Code Instantly** — Paste code in a VS Code-style editor, get AI-powered bug detection, optimization suggestions, and best practices review.
2. **Analyze Entire Projects** — Upload a project ZIP file and get a professional-grade report covering technologies, architecture, code quality, and **15 interview Q&A** tailored to your project.
3. **Download Interview Guides** — Export the analysis as a **PDF** or **Markdown** file for offline interview preparation.

> Built with **React 18**, **Express 5**, **MongoDB**, **Google Gemini AI**, and deployed on **Vercel**.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🧠 AI Code Review** | Paste code → get instant review with bug detection, improvements, optimized code & explanation |
| **📂 Project Analyzer** | Upload a ZIP → AI analyzes technologies, architecture, patterns, security, and generates interview Q&A |
| **📄 PDF & Markdown Export** | Download analysis reports as professional PDF or Markdown files |
| **💻 Monaco Editor** | VS Code-style code editor with syntax highlighting for 10+ languages |
| **🔐 JWT Authentication** | Secure signup/login with hashed passwords and token-based auth |
| **📊 Review History** | Track all your past code reviews with timestamps |
| **⚡ Rate Limiting** | 5 reviews/day and 3 project analyses/day per user (admin = unlimited) |
| **🎨 Premium Dark UI** | Glassmorphic, responsive SaaS interface with Tailwind CSS v4 |
| **🚀 Serverless Deployment** | Both frontend and backend deployed on Vercel |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3 | UI library |
| Vite | 8.0 | Build tool & dev server |
| Tailwind CSS | 4.2 | Utility-first styling |
| Monaco Editor | 4.7 | VS Code-style code editor |
| React Router | 7.14 | Client-side routing |
| react-markdown | 10.1 | Markdown rendering |
| rehype-highlight | 7.0 | Syntax highlighting |
| remark-gfm | 4.0 | GitHub Flavored Markdown (tables) |
| jsPDF | 4.2 | PDF generation |
| html-to-image | 1.11 | DOM to image conversion |
| Lucide React | 1.8 | Icon library |
| Axios | 1.15 | HTTP client |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 5.2 | HTTP framework |
| MongoDB | Atlas | Database |
| Mongoose | 9.4 | MongoDB ODM |
| Google Gemini AI | 1.49 | AI code analysis |
| JSON Web Token | 9.0 | Authentication |
| bcryptjs | 3.0 | Password hashing |
| Multer | latest | File upload handling |
| ADM-ZIP | latest | ZIP file extraction |

---

## 📁 Project Structure

```
ai-code-reviewer/
├── client/                        # React Frontend
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Navigation bar
│   │   │   ├── Footer.jsx         # Footer component
│   │   │   └── ProtectedRoute.jsx # Auth guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Authentication state
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── Login.jsx          # Login page
│   │   │   ├── Signup.jsx         # Signup page
│   │   │   ├── Dashboard.jsx      # Code review editor
│   │   │   ├── History.jsx        # Review history
│   │   │   └── ProjectAnalyzer.jsx # Project upload & analysis
│   │   ├── App.jsx                # Route definitions
│   │   └── main.jsx               # Entry point
│   ├── .env                       # Frontend env variables
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                        # Express Backend
│   ├── api/
│   │   └── index.js               # Vercel serverless entry
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js     # Login/Signup logic
│   │   ├── review.controller.js   # AI code review logic
│   │   └── project.controller.js  # Project analysis logic
│   ├── middleware/
│   │   └── auth.middleware.js     # JWT verification
│   ├── models/
│   │   ├── user.model.js          # User schema
│   │   └── review.model.js        # Review schema
│   ├── routes/
│   │   ├── auth.routes.js         # Auth endpoints
│   │   ├── review.routes.js       # Review endpoints
│   │   └── project.routes.js      # Project analysis endpoints
│   ├── app.js                     # Express app setup
│   ├── server.js                  # Local dev server
│   ├── package.json
│   └── vercel.json
│
├── vercel.json                    # Frontend Vercel config
└── README.md
```

---

## 🔗 API Endpoints

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| `POST` | `/api/auth/signup` | Public | Register new user |
| `POST` | `/api/auth/login` | Public | Login & get JWT token |
| `GET` | `/api/reviews` | JWT Required | Get user's review history |
| `POST` | `/api/reviews` | JWT Required | Submit code for AI review |
| `POST` | `/api/project/analyze` | JWT Required | Upload ZIP for project analysis |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB Atlas** account (free tier works)
- **Google Gemini API Key** → [Get one here](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository

```bash
git clone https://github.com/Lalitmehta045/ai-code-reviewer.git
cd ai-code-reviewer
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
ADMIN_EMAIL=your_admin_email@example.com
```

Start the server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the client:

```bash
npm run dev
```

### 4. Open in Browser

```
Frontend → http://localhost:5173
Backend  → http://localhost:5000
```

---

## 🌐 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| **Frontend** | Vercel | [ai-code-analyzer-tool.vercel.app](https://ai-code-analyzer-tool.vercel.app) |
| **Backend** | Render | [ai-code-reviewer-crgj.onrender.com](https://ai-code-reviewer-crgj.onrender.com) |

### Deploy Your Own

1. Fork this repository
2. Deploy `client/` on **Vercel** — set `VITE_API_URL` env variable
3. Deploy `server/` on **Render** — set all server env variables
4. Done!

---

## 🔒 Environment Variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `GEMINI_API_KEY` | Google Gemini AI API key |
| `ADMIN_EMAIL` | Admin email for unlimited access |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

---

## 👨‍💻 Developer

<div align="center">

**Lalit Mehta**

[![GitHub](https://img.shields.io/badge/GitHub-Lalitmehta045-181717?style=for-the-badge&logo=github)](https://github.com/Lalitmehta045)

</div>

---

## 📜 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute.

---

<div align="center">
  <p>
    <sub>Built with ❤️ by <a href="https://github.com/Lalitmehta045">Lalit Mehta</a></sub>
  </p>
  <p>
    <sub>If you found this helpful, consider giving it a ⭐</sub>
  </p>
</div>
