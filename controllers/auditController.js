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
            switch (moduleName) {
                case 'inventory':
                    // date field is 'addedDate' in Inventory model
                    data = await Inventory.find({ recipientId }).lean();
                    return data.map(i => ({
                        name: i.itemName,
                        qty: i.currentquantity,
                        amount: i.scost * i.currentquantity, // Using selling cost (scost)
                        date: i.addedDate
                    }));
                case 'sales':
                    // date field is 'date' in Sale model
                    const sales = await Sale.find({
                        recipientId,
                        // Query for the 'date' field
                        date: queryDate.$gte ? queryDate : { $exists: true }
                    })
                    // --- FIX: Removed the failing .hint() to resolve MongoServerError ---
                    .lean();
                    // ---
                    return sales.flatMap(s => s.items.map(i => ({
                        name: i.itemName,
                        qty: i.quantity,
                        amount: i.amount,
                        date: s.date
                    })));
                case 'production':
                    // Production model not provided, assuming 'createdAt'
                    const prod = await Production.find({ recipientId, createdAt: queryDate.$gte ? queryDate : { $exists: true }}).lean();
                    return prod.map(p => ({ name: p.itemName, qty: parseFloat(p.quantity) || 0, amount: p.amount, date: p.createdAt }));
                case 'order':
                    // date field is 'createdAt' in Order model
                    const orders = await Order.find({ recipientId, createdAt: queryDate.$gte ? queryDate : { $exists: true }}).lean();
                    return orders.flatMap(o => o.items.map(i => ({
                        name: i.productName,
                        qty: i.quantity,
                        amount: i.unitPrice * i.quantity, // Amount calculation
                        date: o.createdAt
                    })));
                case 'expense':
                    // date field is 'dateOfExpense' in Expense model
                    const exp = await Expense.find({
                        recipientId,
                        // Query for the 'dateOfExpense' field
                        dateOfExpense: queryDate.$gte ? queryDate : { $exists: true }
                    }).lean();
                    // NOTE: Use category as 'name' for comparison with Budget
                    return exp.map(e => ({
                        name: e.category, // Changed from e.category + ' - ' + e.description
                        qty: 1,
                        amount: e.amount,
                        date: e.dateOfExpense,
                        description: e.description // Keep description for potential deep detail
                    }));
                case 'budget':
                    // Assuming Budget model has fields: recipientId, category, amount, startDate, endDate
                    const budgetQuery = { recipientId };
                    // If date range is provided, check if it overlaps with the budget's range
                    if (queryDate.$gte && queryDate.$lte) {
                        budgetQuery.startDate = { $lte: queryDate.$lte }; // Budget starts before or on end date
                        budgetQuery.endDate = { $gte: queryDate.$gte };   // Budget ends after or on start date
                    } else if (queryDate.$gte) {
                        // If only start date, get budgets that are currently active or start after
                        budgetQuery.endDate = { $gte: queryDate.$gte }; 
                    } else if (queryDate.$lte) {
                         // If only end date, get budgets that are currently active or end before
                        budgetQuery.startDate = { $lte: queryDate.$lte };
                    }
                    
                    // Fetch all budgets matching the recipient and date criteria
                    const budgets = await Budget.find(budgetQuery).lean();
                    
                    // Map Budget data: grouping by category and summing amounts
                    const budgetMap = {};
                    budgets.forEach(b => {
                        const key = b.category.toLowerCase();
                        if (!budgetMap[key]) {
                            budgetMap[key] = {
                                name: b.category,
                                qty: 1, // Quantity is not relevant here
                                amount: 0,
                                date: b.startDate // Use start date as reference
                            };
                        }
                        budgetMap[key].amount += b.amount;
                    });
                    
                    return Object.values(budgetMap);
                default: return [];
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
        const regexQuery = new RegExp('^'+sanitizedItemName+'$', "i");

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
// 3. SAVE SINGLE COMPARISON ITEM (Approval)
// ==========================================
exports.saveComparisonItem = async (req, res) => {
    try {
        // Expects data from the "View Detail" modal "Save for Review" button
        const { itemName, qtyReceived, qtySold, variance, notes } = req.body;
        
        const newItem = new ComparisonItem({
            itemName,
            qtyReceived,
            qtySold,
            variance,
            notes,
            approvalStatus: 'pending',
            riskScore: Math.abs(variance) > 1000 ? 'High' : 'Medium' // Simple logic
        });

        await newItem.save();
        res.json({ success: true, message: "Item saved for approval" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};