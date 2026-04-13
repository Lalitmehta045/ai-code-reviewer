const { GoogleGenAI } = require("@google/genai");
const Review = require("../models/review.model");
const User = require("../models/user.model");

// Initialize Google AI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// GET user history
const getUserHistory = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error("Fetch History Error:", error.message);
    res.status(500).json({ success: false, message: "Server error fetching history" });
  }
};

const generateReview = async (req, res) => {
  try {
    const { code, language } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ success: false, message: "Code is required" });
    }

    // Rate limiting logic
    const user = await User.findById(userId);
    const today = new Date().toDateString();
    const lastReviewDate = new Date(user.lastReviewDate).toDateString();

    if (today !== lastReviewDate) {
      user.dailyReviewCount = 0;
      user.lastReviewDate = new Date();
    }

    const isDeveloper = user.email === (process.env.ADMIN_EMAIL);

    if (user.dailyReviewCount >= 5 && !isDeveloper) {
      return res.status(429).json({ success: false, message: "Daily limit of 5 reviews reached. Please come back tomorrow!" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `Please review this code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      config: {
        systemInstruction: `You are an expert code reviewer. Provide your review in highly structured Markdown format. Use these exact headings:

### 🐛 Bugs & Issues
### 💡 Improvements & Best Practices
### 🛠️ Optimized Code
### 📖 Explanation

IMPORTANT: Format your response clearly using Markdown. Wrap code in language-specific code blocks. Use lists, bold text, and formatting where appropriate.`
      }
    });

    const aiResponseText = response.text;

    // Save to Database
    const newReview = new Review({
      userId,
      code,
      language: language || "javascript",
      aiResponse: aiResponseText
    });
    
    await newReview.save();

    user.dailyReviewCount += 1;
    await user.save();

    res.json({
      success: true,
      data: aiResponseText,
      remaining: isDeveloper ? "Unlimited" : Math.max(0, 5 - user.dailyReviewCount)
    });

  } catch (error) {
    console.error("ERROR 👉", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  generateReview,
  getUserHistory
};
