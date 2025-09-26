// models/Wallet.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const WalletSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  provider: { type: String, enum: ['paystack','onepipe'], required: true },
  providerId: { type: String, required: true }, // id at provider side
  balance: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wallet', WalletSchema);
