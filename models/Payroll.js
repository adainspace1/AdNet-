const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    basicSalary: { type: Number, required: true },
    allowances: { type: Number, required: true },
    deductions: { type: Number, required: true },
    netPay: { type: Number, required: true },
    status: { type: String, enum: ['processed', 'pending'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Payroll', payrollSchema);
