const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LeaveRequestSchema = new Schema({
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: { type: String, enum: ['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid'], required: true },
    startDate: Date,
    endDate: Date,
    reason: String,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
