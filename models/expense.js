const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
      recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
      },
      username: {
        type: String,
        required: true
      },
        department: { type: String, required: true },
          dateOfExpense: { type: Date, required: true },
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  time: {
    type: String,
    default: () => new Date().toLocaleTimeString()
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', expenseSchema);


