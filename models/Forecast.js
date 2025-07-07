const mongoose = require("mongoose");

const forecastSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  nextMonth: Number,
  nextQuarter: Number,
  trendPercent: Number,
  cycleLength: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Forecast", forecastSchema);
