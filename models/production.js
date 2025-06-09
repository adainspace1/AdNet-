const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
         recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
          },
          username: {
            type: String,
            required: true
          },
  category: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: String, required: true },
    unitPrice: { type: Number, required: true },
  amount: { type: Number, required: true },
  notes: { type: String, default: 'N/A' },
  time: { type: String }, // You can also derive this from createdAt
  profit: { type: Number, default: 0 }, // Add if not present
    fees: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Production', productionSchema);
