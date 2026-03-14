const mongoose = require('mongoose');
const { Schema } = mongoose;

const MonoAccountSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bankName: { type: String },
  maskedAccount: { type: String },
  balance: { type: Number, default: 0 },
  status: { type: String, default: 'awaiting api' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MonoAccount', MonoAccountSchema);
