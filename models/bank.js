const mongoose = require("mongoose");

const bankInfoSchema = new mongoose.Schema({
     reciepientId: { type: mongoose.Schema.Types.ObjectId, ref: "bank", required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountName: { type: String }, // can be auto-filled later
  accountType: { type: String, required: true },
  accountHolder: { type: String, required: true },
  routingNumber: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BankInfo", bankInfoSchema);
