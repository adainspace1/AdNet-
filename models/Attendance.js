const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    clockIn: Date,
    clockOut: Date,
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half‑Day'], default: 'Present' },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
