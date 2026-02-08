const mongoose = require('mongoose');

const plcSchema = new mongoose.Schema({
    // PLC Info
    companyName: { type: String, required: true },
    tickerSymbol: { type: String }, // e.g., AAPL
    registrationNumber: { type: String, required: true },

    // Contact Person (Admin)
    adminFirstName: { type: String, required: true },
    adminLastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },

    // Registered Address
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },

    // Shareholder/Stock Info
    totalShares: { type: Number },
    sharePrice: { type: Number },

    // Plan/finance
    plan: { type: String, default: 'Enterprise Plus' },
    tier: { type: Number, default: 3 },

    creditLimit: { type: Number, default: 5000000 },
    usedCredit: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model('PLC', plcSchema);
