// models/AuditLog.js
const mongoose = require("mongoose");

const auditItemSchema = new mongoose.Schema({
  product: String,
  primaryQty: Number,
  secondaryQty: Number,
  primaryAmt: Number,
  secondaryAmt: Number,
  diffAmt: Number,
  diffQty: Number,
  status: String,
  received: Number,
  sold: Number
});

const auditSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mode: String, // 'comparison' or 'manual'
  primaryModule: String,
  secondaryModule: String,
  items: [auditItemSchema],
  stats: {
    totalItems: Number,
    mismatches: Number,
    totalAmountDiff: Number,
    stockDiscrepancy: Number
  },
  date: { type: Date, default: Date.now },
  // Manual audit fields
  auditId: String,
  accountName: String,
  dateFrom: Date,
  dateTo: Date,
  overallComments: String,
  supportingFiles: [String],
  auditCompleted: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['pending', 'confirmed', 'reported'], default: 'pending' },
  verifiedAt: Date
});

module.exports = mongoose.model("Audit", auditSchema);
