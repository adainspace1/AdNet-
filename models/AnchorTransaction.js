const mongoose = require('mongoose');
const { Schema } = mongoose;

const AnchorTransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  anchorTransactionId: { type: String },
  type: { type: String, enum: ['credit', 'debit', 'transfer'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  reference: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AnchorTransaction', AnchorTransactionSchema);
