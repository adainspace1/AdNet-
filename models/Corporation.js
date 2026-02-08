const mongoose = require('mongoose');

const corporationSchema = new mongoose.Schema({
    // Corporate Info
    corporationName: { type: String, required: true },
    registrationNumber: { type: String, required: true }, // Tax ID or Reg No
    incorporationDate: { type: Date },

    // Contact Person (Admin)
    adminFirstName: { type: String, required: true },
    adminLastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },

    // Headquarters Address
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },

    // Additional Corp Fields
    industry: { type: String },
    website: { type: String },

    // Plan/finance
    plan: { type: String, default: 'Enterprise' },
    tier: { type: Number, default: 3 },

    creditLimit: { type: Number, default: 1000000 },
    usedCredit: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model('Corporation', corporationSchema);
