// models/LinkedBank.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const LinkedBankSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  bankCode: { type: String },
  bankName: { type: String },
  accountNumber: { type: String },
  accountName: { type: String },
  providerId: { type: String }, // provider link id
  balance: { type: Number, default: 0 },
  transactions: { type: Array, default: [] }, // optional cached txs
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LinkedBank', LinkedBankSchema);
