// models/LinkedBank.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const LinkedBankSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  bankCode: { type: String },
  bankName: { type: String },
  accountNumber: { type: String },
  accountName: { type: String },
  bvn: { type: String },       // optional
  pin: { type: String },       // optional, careful about storing raw PINs
  consent: { type: Boolean },  // ✅ add consent flag
  providerId: { type: String },
  balance: { type: Number, default: 0 },
  transactions: { type: Array, default: [] },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('LinkedBank', LinkedBankSchema);
      