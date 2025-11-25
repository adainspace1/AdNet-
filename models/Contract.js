const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContractSchema = new Schema({
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    title: String,
    startDate: Date,
    endDate: Date,
    fileUrl: String,          // link to uploaded contract PDF
    notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Contract', ContractSchema);
