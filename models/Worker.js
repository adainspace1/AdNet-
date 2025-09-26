const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // admin model
    required: true,
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  roles: [
    {
      role: {
        type: String,
        enum: ["inventory", "sales", "finance", "hr", "custom"],
        required: true,
      },
      accessLevel: {
        type: String,
        enum: ["basic", "max", "admin"],
        default: "basic",
      }
    }
  ],

  notes: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Worker", workerSchema);
