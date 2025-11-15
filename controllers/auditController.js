// controllers/auditController.js

console.log("🔌 Loading Audit Controller...");

// LOG ALL IMPORTS
console.log("🧩 Loading Models & Dependencies...");

const ComparisonItem = require("../models/ComparisonItem");    console.log("✔ ComparisonItem Loaded");
const Audit = require("../models/AuditLog");                console.log("✔ AuditLog Loaded");
const Tax = require("../models/Tax");                          console.log("✔ Tax Model Loaded");

const nodemailer = require("nodemailer");                      console.log("✔ Nodemailer Loaded");
const bcrypt = require("bcryptjs");                            console.log("✔ Bcrypt Loaded");
require("dotenv").config();                                    console.log("✔ Dotenv Loaded");

const jwt = require('jsonwebtoken');                           console.log("✔ JWT Loaded");
const cloudinary = require("../cloudinary");                   console.log("✔ Cloudinary Loaded");
const streamifier = require("streamifier");                    console.log("✔ Streamifier Loaded");
const multer = require('multer');                              console.log("✔ Multer Loaded");
const bodyparser = require('body-parser');                     console.log("✔ Bodyparser Loaded");
const mongoose = require("mongoose");                          console.log("✔ Mongoose Loaded");

const Inventory = require("../models/inventory");              console.log("✔ Inventory Model Loaded");


const Expense = require('../models/expense');                     console.log("✔ Expense Model Loaded");

const Budget = require('../models/budget');

console.log("🚀 Audit Controller Ready\n\n");



const Sale = require('../models/sale'); // this is your "Payments"





// ---------------------------------------------
// IMAGE UPLOAD LOGGER
// ---------------------------------------------
const handleImageUpload = (file) => {
  console.log("📸 handleImageUpload() called");
  console.log("👉 File received:", file ? file.originalname : "NO FILE");

  return new Promise((resolve, reject) => {
    if (!file) {
      console.log("⚠ No file passed to upload.");
      return resolve(null);
    }

    const isPDF = file.mimetype === "application/pdf";
    console.log(`📄 File is PDF? => ${isPDF}`);

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: isPDF ? "raw" : "auto",
        folder: "Adnet",
      },
      (error, result) => {
        if (error) {
          console.log("❌ Cloudinary Upload Error:", error);
          reject(new Error("Error uploading: " + error.message));
        } else {
          console.log("✅ Upload Successful:", result.secure_url);
          resolve(result.secure_url);
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};



// ---------------------------------------------
// AUTO AUDIT
// ---------------------------------------------
// AUTO AUDIT
exports.autoAudit = async (req, res) => {
  console.log("\n🚀 AUTO AUDIT REQUEST RECEIVED");

  try {
    const { inventory, expense, payments, withdrawals } = req.body;
    console.log("🧩 Modules Selected:", req.body);

    let results = {
      inventoryResults: [],
      expenseResults: [],
      paymentResults: [],
      withdrawalResults: []
    };

    let stats = {
      totalModulesRun: 0,
      totalIssues: 0,
      inventoryStats: null,
      expenseStats: null,
      paymentStats: null,
      withdrawalStats: null
    };

    // ================= 1️⃣ INVENTORY =================
    if (inventory) {
      stats.totalModulesRun++;

      const items = await Inventory.find() || [];
      console.log("📦 Inventory Count:", items.length);

      const cmpItems = await ComparisonItem.find({
        itemName: { $in: items.map(i => i.itemName) }
      }) || [];

      const cmpMap = cmpItems.reduce((acc, c) => {
        acc[c.itemName] = c.approvalStatus || "pending";
        return acc;
      }, {});

      const invResults = items.map(i => {
        const received = i.quantity || 0;
        const inStock = i.currentquantity || 0;
        const sold = Math.max(received - inStock, 0);
        const expected = received * (i.scost || 0);
        const actual = sold * (i.scost || 0);
        const diff = actual - expected;

        return {
          _id: i._id,
          product: i.itemName || "Unknown",
          received,
          sold,
          expected,
          actual,
          diff,
          status: diff === 0 ? "Match" : diff > 0 ? "Over" : "Short",
          approvalStatus: cmpMap[i.itemName] || "pending"
        };
      });

      const invStats = {
        total: invResults.length,
        mismatches: invResults.filter(r => r.diff !== 0).length,
        amountDiff: invResults.reduce((a, c) => a + Math.abs(c.diff || 0), 0),
        stockDiff: invResults.reduce((a, c) => a + Math.abs((c.received||0) - (c.sold||0)), 0),
        approved: cmpItems.filter(c => c.approvalStatus === 'approved').length,
        disapproved: cmpItems.filter(c => c.approvalStatus === 'disapproved').length
      };

      stats.inventoryStats = invStats;
      stats.totalIssues += invStats.mismatches;
      results.inventoryResults = invResults;
    }

    // ================= 2️⃣ EXPENSE =================
    if (expense) {
      stats.totalModulesRun++;

      const exp = await Expense.find() || [];
      const budgets = await Budget.find({ isActive: true }) || [];

      // safe mapping
      const budgetMap = {};
      budgets.forEach(b => {
        const catKey = (b.categoryName || "").trim().toLowerCase();
        if (!budgetMap[catKey]) budgetMap[catKey] = 0;
        budgetMap[catKey] += b.amount || 0;
      });

      const spentMap = {};
      exp.forEach(e => {
        const catKey = (e.category || "").trim().toLowerCase();
        if (!spentMap[catKey]) spentMap[catKey] = 0;
        spentMap[catKey] += e.amount || 0;
      });

      const expResults = Object.keys(spentMap).map(catKey => {
        const spent = spentMap[catKey] || 0;
        const budgeted = budgetMap[catKey] || 0;
        const remaining = Math.max(budgeted - spent, 0);
        const diff = spent - budgeted;

        return {
          name: catKey || "Unknown",
          budget: budgeted,
          spent,
          remaining,
          diff,
          status: diff === 0 ? "Match" : diff > 0 ? "Overspent" : "Under Budget"
        };
      });

      const expStats = {
        total: expResults.length,
        issues: expResults.filter(r => r.diff !== 0).length,
        amountDiff: expResults.reduce((a, c) => a + Math.abs(c.diff || 0), 0)
      };

      stats.expenseStats = expStats;
      stats.totalIssues += expStats.issues;
      results.expenseResults = expResults;
    }

    // ================= 3️⃣ PAYMENTS =================
    if (payments) {
      stats.totalModulesRun++;

      const sales = await Sale.find() || [];
      console.log("💵 Sales Records:", sales.length);

      const payResults = sales.map(s => {
        const received = s.totalAmount || 0;
        const expected = (s.items || []).reduce((acc, item) => acc + (item.amount || 0), 0);
        const diff = received - expected;

        return {
          payer: s.custormername || "Unknown",
          expected,
          received,
          diff,
          status: diff === 0 ? "Match" : diff > 0 ? "Overpaid" : "Underpaid"
        };
      });

      const payStats = {
        total: payResults.length,
        issues: payResults.filter(r => r.diff !== 0).length
      };

      stats.paymentStats = payStats;
      stats.totalIssues += payStats.issues;
      results.paymentResults = payResults;
    }

    // ================= 4️⃣ WITHDRAWALS =================
    if (withdrawals) {
      stats.totalModulesRun++;

      const w = await Expense.find({ category: /withdrawal/i }) || [];

      const withResults = w.map(wd => {
        const budgeted = 0;
        const actual = wd.amount || 0;
        const diff = actual - budgeted;

        return {
          account: wd.username || "Unknown",
          expected: budgeted,
          actual,
          diff,
          status: diff === 0 ? "Match" : diff > 0 ? "Over Withdrawal" : "Short Withdrawal"
        };
      });

      const wStats = {
        total: withResults.length,
        issues: withResults.filter(r => r.diff !== 0).length
      };

      stats.withdrawalStats = wStats;
      stats.totalIssues += wStats.issues;
      results.withdrawalResults = withResults;
    }

    // SAVE AUDIT
    await Audit.create({
      mode: "auto",
      modules: req.body,
      results,
      stats
    });

    console.log("💾 Auto Audit Saved to DB");
    return res.json({ results, stats });

  } catch (err) {
    console.error("❌ AUTO AUDIT ERROR:", err);
    return res.status(500).json({ error: "Auto audit failed" });
  }
};


// GET AUDIT DETAIL
exports.getAuditDetail = async (req, res) => {
  try {
    const id = req.params.id;

    const i = await Inventory.findById(id);
    if (!i) return res.status(404).json({ error: "Inventory item not found" });

    // Fetch comparison item by name (or inventory _id if you prefer)
    const cmp = await ComparisonItem.findOne({ itemName: i.itemName });
    const approvalStatus = cmp ? cmp.approvalStatus : "pending"; // ⚡ approvalStatus

    const received = i.quantity || 0;
    const inStock = i.currentquantity || 0;
    const sold = Math.max(received - inStock, 0);
    const expected = received * (i.scost || 0);
    const actual = sold * (i.scost || 0);
    const diff = actual - expected;
    const status = diff === 0 ? "Match" : diff > 0 ? "Over" : "Short";

    res.json({
      auditId: null,
      mode: "live",
      stats: {
        total: 1,
        mismatches: diff !== 0 ? 1 : 0,
        amountDiff: Math.abs(diff),
        stockDiff: Math.abs(received - sold),
        approved: approvalStatus === "approved" ? 1 : 0,
        disapproved: approvalStatus === "disapproved" ? 1 : 0
      },
      item: {
        _id: i._id,
        product: i.itemName,
        received,
        sold,
        expected,
        actual,
        diff,
        status,
        approvalStatus
      }
    });

  } catch (err) {
    console.log("❌ Error Loading Inventory Detail:", err);
    res.status(500).json({ error: "Failed to load detail" });
  }
};








// ---------------------------------------------
// MANUAL AUDIT
// ---------------------------------------------
exports.manualAudit = async (req, res) => {
  console.log("\n🚀 MANUAL AUDIT REQUEST RECEIVED");
  console.log("📥 Body:", req.body);

  try {
    const { product, received, sold, expected, actual, notes } = req.body;

    console.log("📦 Extracted Fields:", { product, received, sold, expected, actual });

    // FILE HANDLING
    const file = req.files?.[0];
    console.log("📁 File Found?", !!file);

    const fileUrl = await handleImageUpload(file);

  // DIFF
const diff = actual - expected;

// Accuracy Score
const score = expected ? ((expected - Math.abs(diff)) / expected) * 100 : 0;

const record = {
  product,
  received,
  sold,
  expected,
  actual,
  diff,
  status: diff === 0 ? "Match" : diff > 0 ? "Over" : "Short",
  notes,
  fileUrl: fileUrl || null,
  score: score.toFixed(2) // ✅ add this
};

// save to DB
await Audit.create({
  mode: "manual",
  items: [record],
  stats: {
    total: 1,
    mismatches: diff !== 0 ? 1 : 0,
    amountDiff: Math.abs(diff),
    stockDiff: Math.abs(received - sold),
  },
});

// return the record directly (not wrapped)
res.json(record);


  } catch (err) {
    console.log("❌ MANUAL AUDIT ERROR:", err);
    res.status(500).json({ error: "Manual audit failed" });
  }
};



// ---------------------------------------------
// APPROVE OR DISAPPROVE
// ---------------------------------------------
// UNIVERSAL AUDIT ACTION
// ---------------------------------------------
exports.auditAction = async (req, res) => {
  console.log("\n🚀 AUDIT ACTION TRIGGERED");
  console.log("📌 Params:", req.params);
  console.log("📩 Body:", req.body);

  try {
    const { id } = req.params;
    const { action, user, type } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Audit type is required" });
    }

    const approvalStatus = action === "approve" ? "approved" : "disapproved";

    // ---------------------------------------------
    // 1️⃣ PICK THE RIGHT MODEL BASED ON TYPE
    // ---------------------------------------------
    let record = null;

    switch (type) {
        case "inventory":
            record = await Inventory.findById(id);
            break;

        case "expense":
        case "withdrawal": // treat withdrawals as expenses
            record = await Expense.findById(id);
            break;

        case "sale":
        case "payment": // treat payments as sales
            record = await Sale.findById(id);
            break;

        default:
            return res.status(400).json({ error: "Invalid audit type" });
        }


    if (!record) {
      return res.status(404).json({ error: `${type} record not found` });
    }

    // ---------------------------------------------
    // 2️⃣ BUILD A UNIVERSAL CALCULATION ENGINE
    // (Inventory stays the same, others adapt)
    // ---------------------------------------------
    let received = 0;
    let sold = 0;
    let expected = 0;
    let actual = 0;

    if (type === "inventory") {
      received = record.quantity || 0;
      const inStock = record.currentquantity || 0;

      sold = Math.max(received - inStock, 0);
      expected = received * (record.scost || 0);
      actual = sold * (record.scost || 0);

    } else {
      // NON-INVENTORY ITEMS
      expected = record.expectedAmount || record.amount || 0;
      actual = record.actualAmount || record.amount || 0;

      received = record.received || 0;
      sold = record.sold || 0;
    }

    const diff = actual - expected;
    const status =
      diff === 0 ? "Match" : diff > 0 ? "Over" : "Short";

    // ---------------------------------------------
    // 3️⃣ UPSERT INTO ComparisonItem
    // ---------------------------------------------
    const updatedItem = await ComparisonItem.findOneAndUpdate(
      {
        // This ensures one item per unique real-world record
        itemName: record.itemName || record.title || record.name || `${type}-${id}`
      },
      {
        itemName: record.itemName || record.title || record.name || `${type}-${id}`,
        sourceType: type,                        // ⭐ new field
        sourceId: id,                             // ⭐ track where it came from
        qtyReceived: received,
        qtySold: sold,
        amountExpected: expected,
        amountDisbursed: actual,
        variance: diff,
        qtyVariance: received - sold,
        approvalStatus,
        notes: "",
        fileUrl: "",
      },
      { new: true, upsert: true }
    );

    console.log("💾 ComparisonItem saved/updated:", updatedItem);

    res.json({
      message: `Record ${approvalStatus}`,
      item: updatedItem
    });

  } catch (err) {
    console.log("❌ ACTION ERROR:", err);
    res.status(500).json({ error: "Unable to save/update record" });
  }
};



// ---------------------------------------------
// GET AUDIT DETAIL
// ---------------------------------------------
// exports.getAuditDetail = async (req, res) => {
//   console.log("\n🔎 GET AUDIT DETAIL", req.params.id);

//   try {
//     const item = await ComparisonItem.findById(req.params.id);
//     console.log("📄 Found:", item);

//     res.json(item);
//   } catch (err) {
//     console.log("❌ DETAIL ERROR:", err);
//     res.status(500).json({ error: "Could not load detail" });
//   }
// };
