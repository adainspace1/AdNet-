const mongoose = require('mongoose');

const accountsPayableSchema = new mongoose.Schema({
    recipientId: { type: String, required: true },
    username: { type: String, required: true },
  vendorName: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  ramount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AccountsPayable', accountsPayableSchema);
