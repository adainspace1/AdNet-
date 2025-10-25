// models/Report.js
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "AddVendor" },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fullname: { type: String, required: true },
  email: { type: String, required: true },
  reason: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", reportSchema);
