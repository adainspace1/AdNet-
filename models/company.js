// === models/Company.js ===
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  reciepientId: { type: mongoose.Schema.Types.ObjectId, ref: "Personal", required: true },
  companyName: { type: String, required: true },
  industry: { type: String, required: true },
  address: { type: String },
  businessStructure: { type: String, required: true },
  cacNumber: { type: String, required: true },
  incorporationDate: { type: Date, required: true },
  taxId: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  countryCode: { type: String, required: true },
  shareholderAgreement: { type: String },
  documents: [{ type: String }] // All uploaded files
});

module.exports = mongoose.model("Company", companySchema);