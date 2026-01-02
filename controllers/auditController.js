// controllers/auditController.js

console.log("🔌 Loading Audit Controller...");

// LOG ALL IMPORTS
console.log("🧩 Loading Models & Dependencies...");

const ComparisonItem = require("../models/ComparisonItem"); console.log("✔ ComparisonItem Loaded");
const Audit = require("../models/AuditLog"); console.log("✔ AuditLog Loaded");
const Tax = require("../models/Tax"); console.log("✔ Tax Model Loaded");

const nodemailer = require("nodemailer"); console.log("✔ Nodemailer Loaded");
const bcrypt = require("bcryptjs"); console.log("✔ Bcrypt Loaded");
require("dotenv").config(); console.log("✔ Dotenv Loaded");
const jwt = require('jsonwebtoken'); console.log("✔ JWT Loaded");
const cloudinary = require("../cloudinary"); console.log("✔ Cloudinary Loaded");
const streamifier = require("streamifier"); console.log("✔ Streamifier Loaded");
const pdfkit = require('pdfkit');
const multer = require('multer'); console.log("✔ Multer Loaded");
const bodyparser = require('body-parser'); console.log("✔ Bodyparser Loaded");
const mongoose = require("mongoose"); console.log("✔ Mongoose Loaded");



const Production = require('../models/production');
const Order = require("../models/Order");
const Inventory = require("../models/inventory");
const Sale = require('../models/sale');
const Expense = require('../models/expense');
const Budget = require('../models/budget');







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



// controllers/auditController.js

console.log("🔌 Loading Audit Controller...");



// ... (Keep your imports and handleImageUpload function here) ...

// ==========================================
// 1. ANALYZE & SAVE AUDIT (The Main Engine)
// ==========================================
// NOTE: Ensure these models are correctly imported in your file
// const Inventory = require('../models/Inventory');
// const Sale = require('../models/Sale');
// const Production = require('../models/Production'); // (Not provided, assumed to exist)
// const Order = require('../models/Order');
// const Expense = require('../models/Expense');
// const Audit = require('../models/Audit'); // (Not provided, assumed to exist)

exports.getAuditData = async (req, res) => {
  try {
    const { primary, secondary, startDate, endDate } = req.body;

    // FIX: Ensure recipientId is correctly sourced
    const recipientId = req.session.user._id;

    // --- DEBUG LOGS: INPUTS ---
    console.log('--- STARTING AUDIT ---');
    console.log(`Input Modules: Primary=${primary}, Secondary=${secondary || 'None'}`);
    console.log(`Date Range: ${startDate} to ${endDate}`);
    console.log(`Recipient ID: ${recipientId}`);
    // --------------------------

    const queryDate = {};
    if (startDate && endDate) {
      queryDate.$gte = new Date(startDate);
      queryDate.$lte = new Date(endDate);
    }

    const fetchData = async (moduleName) => {
      let data = [];
      try {
        switch (moduleName) {
          case 'inventory':
            data = await Inventory.find({ recipientId }).lean();
            return data.map(i => ({
              name: i.itemName || '[Unnamed Item]',
              qty: parseFloat(i.currentquantity) || 0,
              amount: (parseFloat(i.scost) || 0) * (parseFloat(i.currentquantity) || 0),
              date: i.addedDate
            }));

          case 'sales':
            const sales = await Sale.find({
              recipientId,
              date: queryDate.$gte ? queryDate : { $exists: true }
            }).lean();

            return sales.flatMap(s => {
              if (!s.items || !Array.isArray(s.items)) return [];
              return s.items.map(i => ({
                name: i.itemName || '[Unnamed Product]',
                qty: parseFloat(i.quantity) || 0,
                amount: parseFloat(i.amount) || 0,
                date: s.date
              }));
            });

          case 'production':
            const prod = await Production.find({
              recipientId,
              createdAt: queryDate.$gte ? queryDate : { $exists: true }
            }).lean();
            return prod.map(p => ({
              name: p.itemName || '[Unnamed Product]',
              qty: parseFloat(p.quantity) || 0,
              amount: parseFloat(p.amount) || 0,
              date: p.createdAt
            }));

          case 'order':
            const orders = await Order.find({
              recipientId,
              createdAt: queryDate.$gte ? queryDate : { $exists: true }
            }).lean();
            return orders.flatMap(o => {
              if (!o.items || !Array.isArray(o.items)) return [];
              return o.items.map(i => ({
                name: i.productName || '[Unnamed Order Item]',
                qty: parseFloat(i.quantity) || 0,
                amount: (parseFloat(i.unitPrice) || 0) * (parseFloat(i.quantity) || 0),
                date: o.createdAt
              }));
            });

          case 'expense':
            const exp = await Expense.find({
              recipientId,
              dateOfExpense: queryDate.$gte ? queryDate : { $exists: true }
            }).lean();
            return exp.map(e => ({
              name: e.category || '[Uncategorized Expense]',
              qty: 1,
              amount: parseFloat(e.amount) || 0,
              date: e.dateOfExpense,
              description: e.description
            }));

          case 'budget':
            const budgetQuery = { recipientId };
            if (queryDate.$gte && queryDate.$lte) {
              budgetQuery.startDate = { $lte: queryDate.$lte };
              budgetQuery.endDate = { $gte: queryDate.$gte };
            } else if (queryDate.$gte) {
              budgetQuery.endDate = { $gte: queryDate.$gte };
            } else if (queryDate.$lte) {
              budgetQuery.startDate = { $lte: queryDate.$lte };
            }

            const budgets = await Budget.find(budgetQuery).lean();
            const budgetMap = {};
            budgets.forEach(b => {
              const category = b.category || 'Uncategorized';
              const key = category.toLowerCase();
              if (!budgetMap[key]) {
                budgetMap[key] = {
                  name: category,
                  qty: 1,
                  amount: 0,
                  date: b.startDate
                };
              }
              budgetMap[key].amount += parseFloat(b.amount) || 0;
            });

            return Object.values(budgetMap);

          default: return [];
        }
      } catch (err) {
        console.error(`❌ Error fetching data for ${moduleName}:`, err);
        return [];
      }
    };

    const primaryRaw = await fetchData(primary);
    let secondaryRaw = [];

    if (secondary) {
      secondaryRaw = await fetchData(secondary);
    }

    // 1. Build auditMap (Aggregation Logic)
    const auditMap = {};

    // Aggregate Primary data
    primaryRaw.forEach(item => {
      // 🔥🔥 FIX: Check for item.name before calling toLowerCase() to prevent TypeError
      const key = item.name ? item.name.toLowerCase() : `_UNNAMED_ITEM_${Math.random()}`;

      if (!auditMap[key]) {
        auditMap[key] = {
          itemName: item.name || '[Unnamed Item]', // Use fallback name
          primaryQty: 0,
          primaryAmt: 0,
          secondaryQty: 0,
          secondaryAmt: 0,
        };
      }
      auditMap[key].primaryQty += item.qty;
      auditMap[key].primaryAmt += item.amount;
    });

    // Aggregate Secondary data
    secondaryRaw.forEach(item => {
      // 🔥🔥 FIX: Check for item.name before calling toLowerCase() to prevent TypeError
      const key = item.name ? item.name.toLowerCase() : `_UNNAMED_ITEM_${Math.random()}`;

      if (!auditMap[key]) {
        auditMap[key] = {
          itemName: item.name || '[Unnamed Item]',
          primaryQty: 0,
          primaryAmt: 0,
          secondaryQty: 0,
          secondaryAmt: 0,
        };
      }
      auditMap[key].secondaryQty += item.qty;
      auditMap[key].secondaryAmt += item.amount;
    });

    // 2. Calculate Results & Map to FRONTEND Schema
    const auditItems = Object.values(auditMap).map(row => {
      // Note: If secondary is 'None', secondaryQty/Amt will be 0
      const diffQty = row.primaryQty - row.secondaryQty;
      const diffAmt = row.primaryAmt - row.secondaryAmt;

      let status = 'Match';
      if (Math.abs(diffQty) > 0.001 || Math.abs(diffAmt) > 0.001) { // Use a small tolerance for floats
        status = 'Mismatch';
      }

      // --- Crucial Mapping for Frontend Table ---
      return {
        product: row.itemName, 			// Frontend expects 'product'
        primaryQty: row.primaryQty,
        secondaryQty: row.secondaryQty,
        primaryAmt: row.primaryAmt,
        secondaryAmt: row.secondaryAmt,
        diffAmt: diffAmt, 			// Frontend expects 'diffAmt'
        diffQty: diffQty,
        status: status,
        // These are used for stock discrepancy calculation only if primary=received, secondary=sold
        received: row.primaryQty,
        sold: row.secondaryQty
      };
    });

    // 3. Calculate Stats
    const stats = {
      totalItems: auditItems.length,
      mismatches: auditItems.filter(r => r.status === 'Mismatch').length,
      totalAmountDiff: auditItems.reduce((acc, curr) => acc + curr.diffAmt, 0),
      stockDiscrepancy: auditItems.reduce((acc, curr) => acc + (curr.received - curr.sold), 0)
    };

    // --- DEBUG LOG: Stats Check ---
    console.log(`Stats Calculated: Mismatches=${stats.mismatches}, Total Diff=₦${stats.totalAmountDiff.toFixed(2)}`);
    // ------------------------------

    // 4. Save to DB (AuditLog)
    const newAudit = new Audit({
      recipient: recipientId,
      mode: secondary ? 'comparison' : 'single',
      primaryModule: primary,
      secondaryModule: secondary,
      items: auditItems,
      stats: stats,
      date: new Date()
    });

    await newAudit.save();
    console.log(`✅ Audit Session Saved: ${newAudit._id}`);

    // 5. Send Response - Send the correctly mapped auditItems
    res.json({ success: true, results: auditItems, stats: stats, auditId: newAudit._id });

  } catch (error) {
    // --- CRITICAL DEBUG LOG ---
    console.error('🔥🔥 FATAL AUDIT ERROR 🔥🔥:', error.name, error.message);
    // --------------------------
    res.status(500).json({ success: false, message: `Server Error during audit: ${error.name}` });
  }
};


// ==========================================
// 2. GET ITEM DETAILS (For the Modal)
// ==========================================
exports.getAuditDetail = async (req, res) => {
  try {
    const { itemName } = req.params; // Passed via URL
    const recipientId = req.session.user._id;

    // Sanitize item name for robust lookup (in case of spaces/special chars)
    const sanitizedItemName = itemName.trim();
    const regexQuery = new RegExp('^' + sanitizedItemName + '$', "i");

    console.log(`🔍 Fetching details for: ${sanitizedItemName}`);

    // Run parallel queries to find traces of this item across ALL models
    const [invData, salesData, prodData, orderData, expenseData, budgetData] = await Promise.all([
      // Query for Product-based Models (using itemName/productName field)
      Inventory.findOne({ recipientId, itemName: regexQuery }).lean(),
      Sale.find({ recipientId, "items.itemName": regexQuery }).lean(),
      Production.find({ recipientId, itemName: regexQuery }).lean(),
      Order.find({ recipientId, "items.productName": regexQuery }).lean(),

      // Query for Category/Finance-based Models (using category field)
      Expense.find({ recipientId, category: regexQuery }).lean(),
      Budget.find({ recipientId, category: regexQuery }).lean()
    ]);

    // Construct Timeline
    let timeline = [];

    // 1. PRODUCT-BASED TIMELINE (Inventory, Production, Sales, Order)
    if (prodData) prodData.forEach(p => timeline.push({
      type: 'Production',
      date: p.createdAt,
      qty: p.quantity,
      info: `Produced/Added (Cost: ₦${p.amount?.toLocaleString() || 0})`
    }));

    if (salesData) salesData.forEach(s => {
      // Find the specific item within the sale transaction
      const specificItem = s.items.find(i => i.itemName.toLowerCase() === sanitizedItemName.toLowerCase());
      if (specificItem) {
        timeline.push({
          type: 'Sale',
          date: s.date,
          qty: -specificItem.quantity, // Negative QTY for item movement out
          info: `Sold to ${s.custormername} (Value: ₦${specificItem.amount?.toLocaleString() || 0})`
        });
      }
    });

    if (orderData) orderData.forEach(o => {
      // Find the specific item within the order transaction
      const specificItem = o.items.find(i => i.productName.toLowerCase() === sanitizedItemName.toLowerCase());
      if (specificItem) {
        timeline.push({
          type: 'Order',
          date: o.createdAt,
          qty: specificItem.quantity, // Positive QTY for item movement in (received order)
          info: `Order Status: ${o.status}`
        });
      }
    });

    // 2. FINANCE-BASED TIMELINE (Expense, Budget)
    // Note: For Expense/Budget, we use QTY=1/-1 to leverage the frontend's status color logic (positive=green, negative=red)
    if (expenseData) expenseData.forEach(e => timeline.push({
      type: 'Spent',
      date: e.dateOfExpense,
      qty: -1, // Use -1 to trigger red color (spent money)
      info: `₦${e.amount.toLocaleString()} - ${e.description} (Category: ${e.category})`
    }));

    if (budgetData) budgetData.forEach(b => timeline.push({
      type: 'Budgeted',
      date: b.startDate,
      qty: 1, // Use +1 to trigger green color (allocated money)
      info: `₦${b.amount.toLocaleString()} Allocated for period ${new Date(b.startDate).toLocaleDateString()} - ${new Date(b.endDate).toLocaleDateString()}`
    }));

    // Sort timeline by date (newest first)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Format Inventory Data for Frontend
    const inventoryCurrent = invData ? invData.currentquantity : 'N/A';
    const inventoryValue = invData ? (invData.scost * invData.currentquantity) : 0;

    res.json({
      success: true,
      inventoryCurrent: inventoryCurrent,
      inventoryValue: inventoryValue,
      timeline: timeline
    });

  } catch (error) {
    console.error("Detail Error", error);
    res.status(500).json({ success: false, message: "Could not fetch details" });
  }
};

// ==========================================
// 3. SAVE COMPARISON ITEM
// ==========================================
exports.saveComparisonItem = async (req, res) => {
  try {
    const recipientId = req.session.user._id;
    const {
      itemName,
      qtyReceived,
      qtySold,
      amountExpected,
      amountDisbursed,
      variance,
      qtyVariance,
      profitMargin,
      riskScore,
      notes,
      fileUrl,
      evidence
    } = req.body;

    // Create new comparison item
    const comparisonItem = new ComparisonItem({
      itemName,
      qtyReceived: qtyReceived || 0,
      qtySold: qtySold || 0,
      amountExpected: amountExpected || 0,
      amountDisbursed: amountDisbursed || 0,
      variance: variance || 0,
      qtyVariance: qtyVariance || 0,
      profitMargin: profitMargin || 0,
      riskScore: riskScore || 'Low',
      notes,
      fileUrl,
      evidence: evidence || [],
      recipientId // Add recipientId to link to user
    });

    await comparisonItem.save();

    console.log(`✅ Comparison item saved: ${itemName}`);
    res.json({
      success: true,
      message: 'Comparison item saved successfully',
      item: comparisonItem
    });

  } catch (error) {
    console.error("Save Comparison Error", error);
    res.status(500).json({ success: false, message: "Could not save comparison item" });
  }
};

// ==========================================
// 4. DOWNLOAD AUDIT AS PDF
// ==========================================
exports.downloadAuditPDF = async (req, res) => {
  try {
    const { auditId } = req.params;
    const audit = await Audit.findById(auditId).populate('recipient', 'name email');

    if (!audit) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=audit-${auditId}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Financial Audit Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Audit ID: ${auditId}`);
    doc.text(`Date: ${audit.date.toLocaleDateString()}`);
    doc.text(`Mode: ${audit.mode}`);
    if (audit.recipient) {
      doc.text(`Audited By: ${audit.recipient.name} (${audit.recipient.email})`);
    }
    doc.moveDown();

    // Modules
    if (audit.primaryModule) {
      doc.text(`Primary Module: ${audit.primaryModule}`);
    }
    if (audit.secondaryModule) {
      doc.text(`Secondary Module: ${audit.secondaryModule}`);
    }
    doc.moveDown();

    // Stats
    doc.fontSize(14).text('Audit Statistics:');
    doc.fontSize(12);
    doc.text(`Total Items: ${audit.stats.totalItems}`);
    doc.text(`Mismatches: ${audit.stats.mismatches}`);
    doc.text(`Total Amount Difference: ₦${audit.stats.totalAmountDiff.toLocaleString()}`);
    doc.text(`Stock Discrepancy: ${audit.stats.stockDiscrepancy}`);
    doc.moveDown();

    // Items table
    doc.fontSize(14).text('Audit Details:');
    doc.moveDown();

    audit.items.forEach((item, index) => {
      doc.fontSize(10);
      doc.text(`${index + 1}. ${item.product}`);
      doc.text(`   Primary: Qty ${item.primaryQty}, Amt ₦${item.primaryAmt.toLocaleString()}`);
      doc.text(`   Secondary: Qty ${item.secondaryQty}, Amt ₦${item.secondaryAmt.toLocaleString()}`);
      doc.text(`   Difference: Qty ${item.diffQty}, Amt ₦${item.diffAmt.toLocaleString()}`);
      doc.text(`   Status: ${item.status}`);
      doc.moveDown(0.5);
    });

    doc.end();

  } catch (error) {
    console.error('PDF Download Error:', error);
    res.status(500).json({ success: false, message: 'Error generating PDF' });
  }
};

// ==========================================
// 5. DOWNLOAD AUDIT AS CSV
// ==========================================
exports.downloadAuditCSV = async (req, res) => {
  try {
    const { auditId } = req.params;
    const audit = await Audit.findById(auditId);

    if (!audit) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-${auditId}.csv`);

    // CSV Header
    let csv = 'Product,Primary Qty,Primary Amount,Secondary Qty,Secondary Amount,Diff Qty,Diff Amount,Status\n';

    // CSV Data
    audit.items.forEach(item => {
      csv += `"${item.product}",${item.primaryQty},${item.primaryAmt},${item.secondaryQty},${item.secondaryAmt},${item.diffQty},${item.diffAmt},"${item.status}"\n`;
    });

    res.send(csv);

  } catch (error) {
    console.error('CSV Download Error:', error);
    res.status(500).json({ success: false, message: 'Error generating CSV' });
  }
};

// ==========================================
// 6. CREATE MANUAL AUDIT
// ==========================================
exports.createManualAudit = async (req, res) => {
  try {
    const { auditId, accountName, dateFrom, dateTo } = req.body;
    const recipientId = req.session.user._id;

    // Check if audit ID already exists
    const existingAudit = await Audit.findOne({ auditId, recipient: recipientId });
    if (existingAudit) {
      return res.status(400).json({ success: false, message: 'Audit ID already exists' });
    }

    const manualAudit = new Audit({
      recipient: recipientId,
      mode: 'manual',
      auditId,
      accountName,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      items: [],
      stats: {
        totalItems: 0,
        mismatches: 0,
        totalAmountDiff: 0,
        stockDiscrepancy: 0
      }
    });

    await manualAudit.save();

    res.json({
      success: true,
      audit: manualAudit,
      message: 'Manual audit created successfully'
    });

  } catch (error) {
    console.error('Create Manual Audit Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. GET MANUAL AUDIT TRANSACTIONS
// ==========================================
exports.getManualAuditTransactions = async (req, res) => {
  try {
    const { auditId } = req.params;
    const recipientId = req.session.user._id;

    const audit = await Audit.findOne({ auditId, recipient: recipientId });
    if (!audit) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    const startDate = new Date(audit.dateFrom);
    const endDate = new Date(audit.dateTo);
    endDate.setHours(23, 59, 59, 999);

    let transactions = [];
    const accountType = audit.accountName;

    if (accountType.includes('Revenue') || accountType.includes('4001')) {
      // Fetch Sales
      const sales = await Sale.find({
        recipientId,
        date: { $gte: startDate, $lte: endDate }
      }).lean();

      transactions = sales.map(s => ({
        id: s._id.toString(),
        date: s.date.toISOString().split('T')[0],
        description: `Sale to ${s.custormername}: ${s.items.map(i => i.itemName).join(', ')}`,
        amount: s.totalAmount,
        status: 'pending',
        comments: s.discription || ''
      }));
    } else if (accountType.includes('Expense') || accountType.includes('5001')) {
      // Fetch Expenses
      const expenses = await Expense.find({
        recipientId,
        dateOfExpense: { $gte: startDate, $lte: endDate }
      }).lean();

      transactions = expenses.map(e => ({
        id: e._id.toString(),
        date: e.dateOfExpense.toISOString().split('T')[0],
        description: `${e.category}: ${e.description}`,
        amount: -e.amount,
        status: 'pending',
        comments: ''
      }));
    } else {
      // Default: Fetch combination for "Cash Account" or any other
      const [sales, expenses, productions] = await Promise.all([
        Sale.find({ recipientId, date: { $gte: startDate, $lte: endDate } }).lean(),
        Expense.find({ recipientId, dateOfExpense: { $gte: startDate, $lte: endDate } }).lean(),
        Production.find({ recipientId, createdAt: { $gte: startDate, $lte: endDate } }).lean()
      ]);

      const salesTx = sales.map(s => ({
        id: s._id.toString(),
        date: s.date.toISOString().split('T')[0],
        description: `Revenue: ${s.custormername}`,
        amount: s.totalAmount,
        status: 'pending',
        type: 'Sale'
      }));

      const expTx = expenses.map(e => ({
        id: e._id.toString(),
        date: e.dateOfExpense.toISOString().split('T')[0],
        description: `Expense: ${e.category}`,
        amount: -e.amount,
        status: 'pending',
        type: 'Expense'
      }));

      const prodTx = productions.map(p => ({
        id: p._id.toString(),
        date: p.createdAt.toISOString().split('T')[0],
        description: `Production: ${p.itemName}`,
        amount: -p.amount,
        status: 'pending',
        type: 'Production'
      }));

      transactions = [...salesTx, ...expTx, ...prodTx].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    res.json({ success: true, transactions });

  } catch (error) {
    console.error('Get Manual Audit Transactions Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper for Cloudinary uploads
const handleFileUpload = (file) => {
  return new Promise((resolve, reject) => {
    const isPDF = file.mimetype === "application/pdf";
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: isPDF ? "raw" : "auto",
        folder: "Adnet/Audits",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// ==========================================
// 8. SUBMIT MANUAL AUDIT
// ==========================================
exports.submitManualAudit = async (req, res) => {
  try {
    const { auditId, overallComments, auditCompleted, transactions } = req.body;
    const recipientId = req.session.user._id;

    // Parse transactions if they come as string (FormData)
    const parsedTransactions = typeof transactions === 'string' ? JSON.parse(transactions) : transactions;

    const audit = await Audit.findOne({ auditId, recipient: recipientId });
    if (!audit) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    // Handle file uploads if present
    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => handleFileUpload(file));
      uploadedFiles = await Promise.all(uploadPromises);
    }

    // Process transactions and create audit items
    const auditItems = parsedTransactions.map(transaction => ({
      product: transaction.description,
      primaryQty: 1,
      primaryAmt: transaction.amount,
      secondaryQty: 1,
      secondaryAmt: transaction.amount,
      diffAmt: 0,
      diffQty: 0,
      status: transaction.status === 'flagged' ? 'Mismatch' : 'Match'
    }));

    // Calculate stats
    const mismatches = auditItems.filter(item => item.status === 'Mismatch').length;
    const totalAmount = auditItems.reduce((sum, item) => sum + item.primaryAmt, 0);

    audit.items = auditItems;
    audit.stats = {
      totalItems: auditItems.length,
      mismatches,
      totalAmountDiff: 0,
      stockDiscrepancy: 0
    };
    audit.overallComments = overallComments;
    audit.auditCompleted = auditCompleted === 'true' || auditCompleted === true;

    if (uploadedFiles.length > 0) {
      audit.supportingFiles = [...audit.supportingFiles, ...uploadedFiles];
    }

    await audit.save();

    res.json({
      success: true,
      message: 'Manual audit submitted successfully',
      audit
    });

  } catch (error) {
    console.error('Submit Manual Audit Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 9. GET AUDIT LIST
// ==========================================
exports.getAuditList = async (req, res) => {
  try {
    const recipientId = req.session.user._id;
    const audits = await Audit.find({ recipient: recipientId })
      .sort({ date: -1 })
      .limit(20);

    res.json({ success: true, audits });

  } catch (error) {
    console.error('Get Audit List Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 10. DOWNLOAD SYSTEM ACTIVITY LOG (PDF)
// ==========================================
exports.downloadActivityPDF = async (req, res) => {
  try {
    const adminId = req.session.user._id;
    const UserActivity = require("../models/userActivity");
    const activities = await UserActivity.find({ adminId }).sort({ createdAt: -1 }).limit(100);

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=system-activities.pdf');

    doc.pipe(res);

    doc.fontSize(20).text('System Activity Logs', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
    doc.moveDown();

    activities.forEach((act, index) => {
      doc.fontSize(10);
      doc.text(`${index + 1}. [${act.createdAt.toLocaleString()}] ${act.workerUsername || 'Admin'} - ${act.page} - ${act.action}`);
      doc.text(`   IP: ${act.ip} | Role: ${act.role}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error('Activity PDF Download Error:', error);
    res.status(500).send('Error generating PDF');
  }
};

// ==========================================
// 11. DOWNLOAD SYSTEM ACTIVITY LOG (CSV)
// ==========================================
exports.downloadActivityCSV = async (req, res) => {
  try {
    const adminId = req.session.user._id;
    const UserActivity = require("../models/userActivity");
    const activities = await UserActivity.find({ adminId }).sort({ createdAt: -1 }).limit(200);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=system-activities.csv');

    let csv = 'Timestamp,User,Page,Action,IP,Role,Access Level\n';

    activities.forEach(act => {
      csv += `${act.createdAt.toISOString()},"${act.workerUsername || 'Admin'}","${act.page}","${act.action}","${act.ip}","${act.role}","${act.accessLevel}"\n`;
    });

    res.send(csv);
  } catch (error) {
    console.error('Activity CSV Download Error:', error);
    res.status(500).send('Error generating CSV');
  }
};
