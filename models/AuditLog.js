// models/Audit.js
const mongoose = require("mongoose");

const auditItemSchema = new mongoose.Schema({
  product: String,
  received: Number,
  sold: Number,
  expected: Number,
  actual: Number,
  diff: Number,
  status: String,
  notes: String,
  files: [String],
});

const auditSchema = new mongoose.Schema({
  mode: String, // auto / manual
  items: [auditItemSchema],
  stats: {
    total: Number,
    mismatches: Number,
    amountDiff: Number,
    stockDiff: Number,
  },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Audit", auditSchema);
