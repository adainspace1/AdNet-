const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  feature: {
    type: String,
    required: true, // e.g. "inventory", "sales", "crm"
  },

  planType: {
    type: String,
    default: 'custom'
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  contractMonths: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
