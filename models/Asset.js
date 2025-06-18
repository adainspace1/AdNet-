const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  product: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Maintenance', 'Retired'], required: true },
  serial: { type: String, required: true, unique: true },
  orderNo: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  cost: { type: Number, required: true },
  category: { type: String, required: true },
  manufacturer: { type: String },

  ledgerType: { type: String, required: true, enum: ['Fixed Assets Register', 'Fixed Asset Schedule', 'Fixed Asset Accounts'] },

  // For Schedule
  depreciationRate: { type: Number },
  usefulLife: { type: Number },

  // For Accounts
  glAccountCode: { type: String },
  costCenter: { type: String }
});

module.exports = mongoose.model('Asset', assetSchema);
