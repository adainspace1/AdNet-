const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PayrollSchema = new Schema({
    period: { type: String, required: true }, // e.g. "2025-04" or "Weekly 12"
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    grossSalary: Number,
    tax: Number,
    pension: Number,
    allowances: Number,
    deductions: Number,
    netSalary: Number,
    status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Payroll', PayrollSchema);
