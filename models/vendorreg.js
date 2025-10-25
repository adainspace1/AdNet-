const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const vendorSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  companyName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  password: { type: String, required: true },

  // Vendor Type (Internal / External)
  vendorType: { type: String, enum: ["Internal", "External"], default: "External" },

  // Category (Construction, Logistics, etc.)
  category: { type: String },

  // Address + Description
  address: String,
  description: String,

  // Contact Person Info
  contactPerson: {
    name: String,
    email: String,
    phone: String,
  },

  // Registration Details (for admin use)
  registrationNumber: String,
  registrationDate: Date,

  // Bank Details
  bankInfo: {
    bankName: String,
    accountNumber: String,
    paymentMethod: { type: String, default: "Wire Transfer" },
    tier3Verified: { type: Boolean, default: false },
  },

  // Uploaded Docs
  uploadedDocs: [
    {
      type: {
        type: String, // e.g., "KYC", "Certificate", "Proof of Business"
      },
      fileUrl: String,
    },
  ],

  // Rating Info
  rating: {
    average: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },

  // Performance Metrics (Admin Data)
  performance: {
    transactions: { type: Number, default: 0 },
    disputes: { type: Number, default: 0 },
    onTimeDelivery: { type: Number, default: 0 }, // percentage
  },

  // Tags (optional labels like Cement, Transport, etc.)
  tags: [String],

  // Verification status
  status: {
    type: String,
    enum: ["Active", "Suspended", "Pending"],
    default: "Active",
  },

  // Who created/approved this vendor (admin ref)
  createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },


  
  reports: [
    {
      reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: String,
      date: { type: Date, default: Date.now },
    },
  ],
  banned: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
});

// 🔒 Hash password before saving
vendorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔐 Compare password
vendorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Vendor", vendorSchema);
