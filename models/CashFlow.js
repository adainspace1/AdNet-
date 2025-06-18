const mongoose = require('mongoose');

const cashFlowSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  operatingActivities: {
    netIncome: { type: Number, default: 0 },
    depreciation: { type: Number, default: 0 },
    changeInWorkingCapital: { type: Number, default: 0 },
    netCashFromOperating: { type: Number, default: 0 }
  },
  investingActivities: {
    purchaseOfEquipment: { type: Number, default: 0 },
    investmentIncome: { type: Number, default: 0 },
    netCashFromInvesting: { type: Number, default: 0 }
  },
  financingActivities: {
    loanReceived: { type: Number, default: 0 },
    dividendsPaid: { type: Number, default: 0 },
    netCashFromFinancing: { type: Number, default: 0 }
  },
  netIncreaseInCash: { type: Number, default: 0 },
  cashBalanceSummary: {
    cashAtBeginning: { type: Number, default: 0 },
    cashAtEnd: { type: Number, default: 0 }
  },
  nonCashTransactions: { type: Number, default: 0 },
  notes: { type: String, default: 'All amounts are stated in USD' }
});

module.exports = mongoose.model('CashFlow', cashFlowSchema);