const mongoose = require('mongoose');

const ARInvoiceSchema = new mongoose.Schema({
  receivableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountsReceivable',
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  note: String,
  paidAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ARInvoice', ARInvoiceSchema);
