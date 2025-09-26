// models/Invoice.js
const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // or "Worker", depending on who owns the invoice
    required: true
  },
  vendor: {
    type: String,
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: false // optional, can make true if invoice numbers are unique per vendor
  },
  dateIssued: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "NGN"
  },
  status: {
    type: String,
    enum: ["pending", "paid", "overdue"],
    default: "pending"
  },
  matched: {
    type: Boolean,
    default: false
  },
  matchedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
