const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  username: {
    type: String,
    required: true
  },
  items: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true
      },
      itemName: {
        type: String,
        required: true
      },
      unitPrice: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      amount: {
        type: Number,
        required: true
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  custormername: {
    type: String,
    required: true
  },
  discription: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', saleSchema);
