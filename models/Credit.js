const mongoose = require("mongoose");

const creditSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  amount: { type: Number, required: true },
  currentBalance: { type: Number, default: 0 },
  dueDate: { type: Date, required: true },
  notes: String,
  hasInterest: { type: Boolean, default: false },
  interestRate: { type: Number, default: 0 },
  interestType: { type: String, enum: ["daily", "monthly", "yearly", null] },
  paymentType: { type: String, enum: ["full", "installment"], required: true }, // ✅ new
  isRepaid: { type: Boolean, default: false }, // ✅ new
  personalId: { type: mongoose.Schema.Types.ObjectId, ref: "Personal" }, // ✅ linked to personal
  lastInterestApplied: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Credit", creditSchema);
