const mongoose = require("mongoose");
let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch (e) {
  bcrypt = require("bcryptjs");
}
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },
  password: {
    type: String,
    required: function requiredPassword() {
      return this.authProvider !== "google";
    },
    select: false
  },
  dailyReviewCount: {
    type: Number,
    default: 0
  },
  lastReviewDate: {
    type: Date,
    default: Date.now
  },
  dailyAnalyzeCount: {
    type: Number,
    default: 0
  },
  lastAnalyzeDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) return;
  const raw = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
  const rounds = Math.min(12, Math.max(10, Number.isFinite(raw) ? raw : 10));
  const salt = await bcrypt.genSalt(rounds);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET || "supersecret", {
    expiresIn: "1d"
  });
};

module.exports = mongoose.model("User", userSchema);
