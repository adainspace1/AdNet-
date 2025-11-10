const Assets = require("../models/Asset");
const Liabilities = require("../models/Liquidity");
const Deal = require("../models/Deal");
const CashFlow = require("../models/CashFlow");

const getFinanceSummary = async (req, res) => {
    console.log("Fetching finance summary...");
  try {
    // 🧮 1️⃣ Total Assets
    const totalAssetsAgg = await Assets.aggregate([
      { $group: { _id: null, total: { $sum: "$value" } } }
    ]);
    const totalAssets = totalAssetsAgg[0]?.total || 0;

    // 🧮 2️⃣ Total Liabilities
    const totalLiabilitiesAgg = await Liabilities.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalLiabilities = totalLiabilitiesAgg[0]?.total || 0;

    // 🧮 3️⃣ Active Covenants (Deals)
    const activeCovenants = await Deal.countDocuments({ status: "active" });

    // 🧮 4️⃣ Financial Health Score
    // Example logic → adjust to your formula later
    const ratio = totalLiabilities > 0 ? (totalAssets / totalLiabilities) : 1;
    let healthScore = Math.min(Math.round(ratio * 50 + activeCovenants * 5), 100);

    res.json({
      totalAssets,
      totalLiabilities,
      activeCovenants,
      financialHealth: healthScore
    });
  } catch (err) {
    console.error("Error fetching finance summary:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



  module.exports =
{

    getFinanceSummary

};