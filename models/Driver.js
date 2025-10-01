const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  // Step 1: Personal Info
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  dob: { type: Date },
  profilePicture: { type: String, required: true },

  // Step 2: Vehicle Info
  vehicleMake: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  vehicleColor: { type: String },
  vehiclePlate: { type: String, required: true },
  carImages: [{ type: String }], // array of image URLs

  // Step 3: Documents
  licenseFront: { type: String, required: true },
  licenseBack: { type: String, required: true },
  registration: { type: String, required: true },
  insurance: { type: String, required: true },
  roadworthiness: { type: String },

  // Step 4: Banking
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountHolder: { type: String, required: true },
  kycDocument: { type: String, required: true },

  // Meta
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
}, { timestamps: true });

module.exports = mongoose.model("Driver", driverSchema);