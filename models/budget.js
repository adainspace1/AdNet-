const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: String,
  amount: Number, // ✅ remaining
  initialAmount: Number, // ✅ original budgeted amount
  spent: { type: Number, default: 0 }
});


const budgetSchema = new mongoose.Schema({
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  currentamount: { type: Number, required: true },
  categoryName: {type: String, required: true},
  startDate: { type: Date, required: true },
  endDate: Date, // if not recurring
  recurrence: {
    type: String,
    enum: ['none', 'weekly', 'monthly', 'yearly'],
    default: 'none'
  },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);
