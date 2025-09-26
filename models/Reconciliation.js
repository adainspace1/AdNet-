const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReconciliationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  transactionId: { type: Schema.Types.ObjectId, ref: "WalletTransaction" },
  invoiceId: { type: Schema.Types.ObjectId }, // could link to AP or AR
  matched: { type: Boolean, default: false },
  reason: { type: String }, // e.g. "amount mismatch", "missing invoice"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Reconciliation", ReconciliationSchema);
