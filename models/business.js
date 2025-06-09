const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  reciepientId: { type: mongoose.Schema.Types.ObjectId, ref: "Personal", required: true },
  businessName: String,
  businessType: String,
  businessAddress: String,

  contactName: String,
  contactEmail: String,
  contactPhone: String,

  directorName: String,
  directorPhone: String,
  directorDocs: { type: String, default: "default.pdf" },

  investorName: String,
  investorPhone: String,
  investorDocs: { type: String, default: "default.pdf" },

  adminName: String,
  adminPhone: String,
  adminDocs: { type: String, default: "default.pdf" },

  ownerName: String,
  ownerPhone: String,
  ownerDocs: { type: String, default: "default.pdf" },

  regNumber: String,
  foundingDate: Date,
});

module.exports = mongoose.model("Business", businessSchema);
