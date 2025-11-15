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


const Production = require('../models/production');
const Order = require("../models/Order");




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
  console.log("🧩 Modules Selected:", req.body);

  try {
    const payload = req.body;

    let results = {
      inventoryResults: [],
      expenseResults: [],
      paymentResults: [],
      withdrawalResults: [],
      salesResults: [],
      productionResults: [],
      ordersResults: []
    };

    let stats = {
      totalModulesRun: 0,
      totalIssues: 0,
      inventoryStats: null,
      expenseStats: null,
      paymentStats: null,
      withdrawalStats: null,
      salesStats: null,
      productionStats: null,
      ordersStats: null
    };

    // ================= INVENTORY =================
    if (payload.inventory) {
      stats.totalModulesRun++;

      const items = await Inventory.find() || [];
      const cmpItems = await ComparisonItem.find({
        itemName: { $in: items.map(i => i.itemName) }
      }) || [];

      const cmpMap = {};
      cmpItems.forEach(c => cmpMap[c.itemName] = c.approvalStatus || "pending");

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
        amountDiff: invResults.reduce((a, c) => a + Math.abs(c.diff), 0),
        stockDiff: invResults.reduce((a, c) => a + Math.abs(c.received - c.sold), 0),
        approved: cmpItems.filter(c => c.approvalStatus === "approved").length,
        disapproved: cmpItems.filter(c => c.approvalStatus === "disapproved").length
      };

      results.inventoryResults = invResults;
      stats.inventoryStats = invStats;
      stats.totalIssues += invStats.mismatches;
    }

    // ================= EXPENSE =================
    if (payload.expense || payload.budget) {
      stats.totalModulesRun++;

      const exp = await Expense.find() || [];
      const budgets = await Budget.find({ isActive: true }) || [];

      const budgetMap = {};
      budgets.forEach(b => {
        const key = (b.categoryName || "").trim().toLowerCase();
        budgetMap[key] = (budgetMap[key] || 0) + (b.amount || 0);
      });

      const spentMap = {};
      exp.forEach(e => {
        const key = (e.category || "").trim().toLowerCase();
        spentMap[key] = (spentMap[key] || 0) + (e.amount || 0);
      });

      const expResults = Object.keys(spentMap).map(key => {
        const spent = spentMap[key];
        const budgeted = budgetMap[key] || 0;
        const diff = spent - budgeted;

        return {
          name: key,
          budget: budgeted,
          spent,
          remaining: Math.max(budgeted - spent, 0),
          diff,
          status: diff === 0 ? "Match" : diff > 0 ? "Overspent" : "Under Budget"
        };
      });

      const expStats = {
        total: expResults.length,
        issues: expResults.filter(r => r.diff !== 0).length,
        amountDiff: expResults.reduce((a, c) => a + Math.abs(c.diff), 0)
      };

      results.expenseResults = expResults;
      stats.expenseStats = expStats;
      stats.totalIssues += expStats.issues;
    }

    // ================= PAYMENTS =================
    if (payload.payments || payload.receipts) {
      stats.totalModulesRun++;

      const pay = await Payment.find() || [];
      const payResults = pay.map(p => ({
        _id: p._id,
        name: p.payer || "Unknown",
        expected: p.expectedAmount || 0,
        received: p.amount || 0,
        diff: (p.amount || 0) - (p.expectedAmount || 0),
        status: p.amount === p.expectedAmount ? "Match" : p.amount > p.expectedAmount ? "Over" : "Short"
      }));

      const payStats = {
        total: payResults.length,
        issues: payResults.filter(r => r.diff !== 0).length
      };

      results.paymentResults = payResults;
      stats.paymentStats = payStats;
      stats.totalIssues += payStats.issues;
    }

    // ================= WITHDRAWALS =================
    if (payload.withdrawals || payload.records) {
      stats.totalModulesRun++;

      const w = await Withdrawal.find() || [];
      const wResults = w.map(r => ({
        _id: r._id,
        user: r.username || "Unknown",
        expected: r.expected || 0,
        actual: r.amount || 0,
        diff: (r.amount || 0) - (r.expected || 0),
        status: r.amount === r.expected ? "Match" : r.amount > r.expected ? "Over" : "Short"
      }));

      const wStats = {
        total: wResults.length,
        issues: wResults.filter(r => r.diff !== 0).length
      };

      results.withdrawalResults = wResults;
      stats.withdrawalStats = wStats;
      stats.totalIssues += wStats.issues;
    }

    // ================= SALES =================
    if (payload.sales || payload.receipts) {
      stats.totalModulesRun++;

      const s = await Sale.find() || [];
      const saleResults = s.map(rec => {
        const expected = rec.items?.reduce((a, c) => a + (c.amount || 0), 0) || 0;
        const received = rec.totalAmount || 0;
        const diff = received - expected;

        return {
          _id: rec._id,
          payer: rec.customerName || "Unknown",
          expected,
          received,
          diff,
          status: diff === 0 ? "Match" : diff > 0 ? "Overpaid" : "Underpaid"
        };
      });

      const saleStats = {
        total: saleResults.length,
        issues: saleResults.filter(r => r.diff !== 0).length
      };

      results.salesResults = saleResults;
      stats.salesStats = saleStats;
      stats.totalIssues += saleStats.issues;
    }

    // ================= PRODUCTION =================
    if (payload.production) {
      stats.totalModulesRun++;

      const p = await Production.find() || [];
      const prodResults = p.map(pr => ({
        _id: pr._id,
        name: pr.name || "Unknown",
        planned: pr.planned || 0,
        actual: pr.actual || 0,
        diff: (pr.actual || 0) - (pr.planned || 0),
        status: pr.actual === pr.planned ? "Match" : pr.actual > pr.planned ? "Over" : "Short"
      }));

      const prodStats = {
        total: prodResults.length,
        issues: prodResults.filter(r => r.diff !== 0).length
      };

      results.productionResults = prodResults;
      stats.productionStats = prodStats;
      stats.totalIssues += prodStats.issues;
    }

    // ================= ORDERS =================
    if (payload.orders) {
      stats.totalModulesRun++;

      const o = await Order.find() || [];
      const ordResults = o.map(ord => ({
        _id: ord._id,
        name: ord.productName,
        expectedQty: ord.expectedQty || 0,
        deliveredQty: ord.deliveredQty || 0,
        diff: (ord.deliveredQty || 0) - (ord.expectedQty || 0),
        status: ord.deliveredQty === ord.expectedQty ? "Match" : ord.deliveredQty > ord.expectedQty ? "Over" : "Short"
      }));

      const ordStats = {
        total: ordResults.length,
        issues: ordResults.filter(r => r.diff !== 0).length
      };

      results.ordersResults = ordResults;
      stats.ordersStats = ordStats;
      stats.totalIssues += ordStats.issues;
    }

    // FINAL: save
    await Audit.create({
      mode: "auto",
      modules: payload,
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
