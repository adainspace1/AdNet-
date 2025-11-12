const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema(
  {
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
    taxType: {
      type: String,
      enum: ["VAT", "PAYE", "Corporate Income Tax", "Withholding Tax", "Other"],
      required: true,
    },
    companyname: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    filingDate: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "Paystack", "Manual"],
      required: true,
    },
    receiptUrl: {
      type: String, // Cloudinary or file path
      default: "",
    },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Overdue"],
      default: "Pending",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tax", taxSchema);
