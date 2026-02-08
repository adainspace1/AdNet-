const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  username: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  currentquantity: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  bcost: {
    type: Number,
    required: true,
    min: 0
  },
  scost: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    type: String,
    default: 'Unknown'
  },
  paymentSlip: {
    type: String,
    default: null
  },
  invoiceReceived: {
    type: String,
    default: null
  },
  addedDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Inventory', inventorySchema);
