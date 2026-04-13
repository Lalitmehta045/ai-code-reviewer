<div align="center">
  <h1>🚀 AI Code Reviewer (SaaS Edition)</h1>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  </p>

  <p><strong>Ship Perfect Code, 10x Faster with AI.</strong></p>
  <p>Automate your code reviews with human-like precision. Catch bugs, optimize performance, and enforce best practices instantly before you merge.</p>

  <p>
    <a href="https://github.com/Lalitmehta045/ai-code-reviewer/issues">Report Bug</a>
    ·
    <a href="https://github.com/Lalitmehta045/ai-code-reviewer/issues">Request Feature</a>
  </p>
</div>

<hr />

## ✨ Key Features

- **🧠 Intelligent Code Analysis**: Powered by state-of-the-art AI to scan, review, and suggest optimizations for your code across multiple languages.
- **💻 Integrated Monaco Editor**: A true developer experience with a built-in VS Code-style editor featuring syntax highlighting and automatic theme formatting.
- **📄 Professional PDF Export**: Instantly download professional PDF reports of your AI code reviews with fully preserved markdown and dark-theme syntax highlighting.
- **🔐 Secure Authentication**: Full user authentication system (JWT, Express, MongoDB) to track and protect your review history.
- **🎨 Premium Dark UI**: A glassmorphic, responsive, and visually stunning SaaS interface built with Tailwind CSS v4.

## 🛠️ Technology Stack

**Frontend Architecture:**
- React 18 & Vite
- Tailwind CSS v4 (Glassmorphism & Neon UI)
- Monaco Editor (`@monaco-editor/react`)
- Markdown Rendering (`react-markdown`, `rehype-highlight`)
- High-Fidelity PDF Generation (`html-to-image`, `jspdf`)

**Backend API & Database:**
- Node.js & Express
- MongoDB (Mongoose)
- Google Gemini AI API Integration
- JWT Authentication & Bcrypt

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas or local MongoDB instance
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lalitmehta045/ai-code-reviewer.git
   cd ai-code-reviewer
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup**
   Open a new terminal session and set up the client:
   ```bash
   cd client
   npm install
   ```
   Create a `.env` file in the `client` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
   Start the Vite frontend:
   ```bash
   npm run dev
   ```

## 📸 Screenshots

*(You can add screenshots of your premium landing page, Monaco editor, and PDF download feature here!)*

## 👨‍💻 Developer

**Lalit Mehta**
- GitHub: [@Lalitmehta045](https://github.com/Lalitmehta045)
- Repository: [AI Code Reviewer](https://github.com/Lalitmehta045/ai-code-reviewer)

## 📜 License

This project is licensed under the MIT License. Feel free to use and contribute!
