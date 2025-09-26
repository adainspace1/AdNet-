// models/WalletTransaction.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const WalletTransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },

  // ✅ Add proper withdrawal fields
  bankCode: { type: String },       // e.g. "044"
  bankName: { type: String },       // e.g. "Access Bank"
  accountNumber: { type: String },  // e.g. "0123456789"

  reference: { type: String }, // e.g. Paystack reference
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
