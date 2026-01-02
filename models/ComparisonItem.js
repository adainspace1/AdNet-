const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemName: { type: String, required: true },
  qtyReceived: { type: Number, default: 0 },
  qtySold: { type: Number, default: 0 },
  amountExpected: { type: Number, default: 0 },
  amountDisbursed: { type: Number, default: 0 },
  variance: { type: Number, default: 0 },
  qtyVariance: { type: Number, default: 0 },
  profitMargin: { type: Number, default: 0 },
  riskScore: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },

  // ⚡ New field for approval tracking
  approvalStatus: { type: String, enum: ['pending', 'approved', 'disapproved'], default: 'pending' },

  notes: String,
  fileUrl: String,
  evidence: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ComparisonItem', schema);
