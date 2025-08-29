const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  analysisName: { type: String, default: 'Unnamed Analysis' },
  costOfDebtInputs: {
    riskFreeRate: { type: Number, required: true, min: 0 }, // Percentage
    creditSpread: { type: Number, required: true, min: 0 }, // Percentage
    afterTax: { type: Boolean, default: true }
  },
  costOfEquityInputs: {
    method: { type: String, required: true, enum: ['CAPM', 'DDM'] },
    capm: {
      riskFreeRate: { type: Number, min: 0 }, // Percentage
      beta: { type: Number, min: 0 },
      marketReturn: { type: Number, min: 0 } // Percentage
    },
    ddm: {
      dividendPerShare: { type: Number, min: 0 }, // Dollars
      currentPrice: { type: Number, min: 0 }, // Dollars
      growthRate: { type: Number, min: 0 } // Percentage
    }
  },
  results: {
    wacc: { type: Number, min: 0 }, // Percentage
    debtRatio: { type: Number, min: 0, max: 100 }, // Percentage
    taxShield: { type: Number, min: 0 }, // Millions
    costOfEquity: { type: Number, min: 0 }, // Percentage
    costOfDebt: { type: Number, min: 0 } // Percentage
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Analysis', analysisSchema);