const mongoose = require('mongoose');

const soleProprietorshipSchema = new mongoose.Schema({
    // Basic Personal/Business Info
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    businessName: { type: String, required: true },
    businessType: { type: String, default: 'Sole Proprietorship' },
    description: { type: String },

    // Contact
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },

    // Address
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },

    // Plan/finance
    plan: { type: String, default: 'Starter' },
    tier: { type: Number, default: 1 },

    // Credit/Wallet fields similar to Personal
    creditLimit: { type: Number, default: 200000 },
    usedCredit: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model('SoleProprietorship', soleProprietorshipSchema);
