const mongoose = require("mongoose");

const appaymentSchema = new mongoose.Schema({
  accountPayableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccountsPayable",
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  paidAt: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
  },
  paidBy: {
    type: String, // or ObjectId to reference user
  }
});

module.exports = mongoose.model("APPayment", appaymentSchema);
