const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  dealName: { type: String, required: true },
  customerName: { type: String, required: true },
  dealValue: { type: Number, required: true },
  closeDate: { type: Date, required: true },
  dealType: {
    type: String,
    enum: ['New Business', 'Expansion', 'Renewal', 'Upsell'],
    required: true
  },
  dealStatus: {
    type: String,
    enum: ['New Lead', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Closed'],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  createdAt: { type: Date, default: Date.now },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Deal', dealSchema);
