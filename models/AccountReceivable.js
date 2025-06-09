const mongoose = require("mongoose");

const accountReceivableSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  ramount: { type: Number, required: true },
  status: { type: String, enum: ["not paid", "partially paid", "paid"], default: "not paid" },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

module.exports = mongoose.model("AccountReceivable", accountReceivableSchema);
