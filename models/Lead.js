const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: { type: String },
    phone: { type: String },
    company: { type: String },
    jobTitle: { type: String },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Qualified', 'Lost', 'Converted'],
        default: 'New'
    },
    source: {
        type: String,
        enum: ['Web Form', 'Referral', 'LinkedIn', 'Cold Call', 'Other'],
        default: 'Other'
    },
    score: { type: Number, default: 0 }, // Lead scoring (0-100)
    tags: [{ type: String }], // e.g., "Hot", "Tech", "Lagos"
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', leadSchema);
