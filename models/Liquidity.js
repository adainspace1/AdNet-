// models/Liquidity.js
const mongoose = require("mongoose");

const liquiditySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  cash: {
    type: Number,
    required: true
  },
  bank: {
    type: Number,
    required: true
  },
  liabilities: {
    type: Number,
    required: true
  },
  netLiquidity: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Liquidity", liquiditySchema);
