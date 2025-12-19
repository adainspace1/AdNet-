// models/Activity.js
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Worker",
  },

  workerUsername: String,
  role: String,
  accessLevel: String,

  page: String,
  action: {
    type: String,
    enum: ["ALLOWED", "BLOCKED"],
    required: true,
  },

  ip: String,
  userAgent: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("userActivity", activitySchema);
