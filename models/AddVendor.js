const mongoose = require("mongoose");

const addVendorSchema = new mongoose.Schema(
  {
    UserId: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Construction", "Logistics", "Supply", "Maintenance"],
      required: true,
    },
    contactInfo: {
      type: String,
      required: true,
      trim: true,
      // You can later split this into structured fields (name, email, phone)
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    bankInfo: {
      type: String,
      required: true,
      trim: true,
      // You could also split into bankName + accountNumber if needed
    },
    tier3Verified: {
      type: Boolean,
      default: false,
    },
    uploadedDocs: [
      {
        type: String, // cloudinary URLs
      },
    ],
   
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor", // or "User" depending on who’s creating it
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AddVendor", addVendorSchema);
