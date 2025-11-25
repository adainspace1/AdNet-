const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmployeeSchema = new Schema({
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    phone: String,
    kycDocs: [String],
    bankDetails: {
        accountNumber: String,
        bankName: String,
        routingNumber: String,
    },
    taxTier: String,
    benefits: [String],
    role: String,
    permissions: [String],
    contract: { type: Schema.Types.ObjectId, ref: 'Contract' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Employee', EmployeeSchema);
