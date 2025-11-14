// controllers/auditController.js

console.log("🔌 Loading Audit Controller...");

// LOG ALL IMPORTS
console.log("🧩 Loading Models & Dependencies...");

const ComparisonItem = require("../models/ComparisonItem");    console.log("✔ ComparisonItem Loaded");
const AuditLog = require("../models/AuditLog");                console.log("✔ AuditLog Loaded");
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
const Audit = require("../models/AuditLog");                      console.log("✔ Audit Model Loaded");

console.log("🚀 Audit Controller Ready\n\n");



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
    const items = await Inventory.find();
    console.log("🧮 Inventory Count:", items.length);

    if (!items.length) return res.json({ results: [], stats: {}, msg: "No inventory found" });

    // Fetch approval/disapproval for all items
    const cmpItems = await ComparisonItem.find({ itemName: { $in: items.map(i => i.itemName) } });
    const cmpMap = cmpItems.reduce((acc, c) => {
      acc[c.itemName] = c.approvalStatus; // ⚡ approvalStatus is the new field
      return acc;
    }, {});

    const results = items.map((i) => {
      const received = i.quantity || 0;
      const inStock = i.currentquantity || 0;
      const sold = Math.max(received - inStock, 0);
      const expected = received * (i.scost || 0);
      const actual = sold * (i.scost || 0);
      const diff = actual - expected;

      return {
        _id: i._id,
        product: i.itemName,
        received,
        sold,
        expected,
        actual,
        diff,
        status: diff === 0 ? "Match" : diff > 0 ? "Over" : "Short",
        approvalStatus: cmpMap[i.itemName] || "pending"
      };
    });

    const approvedCount = cmpItems.filter(c => c.approvalStatus === 'approved').length;
    const disapprovedCount = cmpItems.filter(c => c.approvalStatus === 'disapproved').length;

    const stats = {
      total: results.length,
      mismatches: results.filter(r => r.diff !== 0).length,
      amountDiff: results.reduce((a, c) => a + Math.abs(c.diff), 0),
      stockDiff: results.reduce((a, c) => a + Math.abs(c.received - c.sold), 0),
      approved: approvedCount,
      disapproved: disapprovedCount
    };

    console.log("📊 Audit Summary:", stats);

    await Audit.create({ mode: "auto", items: results, stats });

    console.log("💾 Auto Audit Saved to DB");
    return res.json({ results, stats });

  } catch (err) {
    console.log("❌ AUTO AUDIT ERROR:", err);
    res.status(500).json({ error: "Auto audit failed" });
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
    console.log("🧮 Calculated Diff:", diff);

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
    };

    console.log("📝 Final Manual Record:", record);

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

    console.log("💾 Manual Audit Saved to DB");

    res.json({ msg: "Manual audit saved", record });

  } catch (err) {
    console.log("❌ MANUAL AUDIT ERROR:", err);
    res.status(500).json({ error: "Manual audit failed" });
  }
};



// ---------------------------------------------
// APPROVE OR DISAPPROVE
// ---------------------------------------------
exports.auditAction = async (req, res) => {
  console.log("\n🚀 AUDIT ACTION TRIGGERED");
  console.log("📌 Params:", req.params);
  console.log("📩 Body:", req.body);

  try {
    const { id } = req.params; // inventory _id
    const { action, user } = req.body;
    const approvalStatus = action === "approve" ? "approved" : "disapproved";

    // 1️⃣ Get inventory detail
    const i = await Inventory.findById(id);
    if (!i) return res.status(404).json({ error: "Inventory not found" });

    const received = i.quantity || 0;
    const inStock = i.currentquantity || 0;
    const sold = Math.max(received - inStock, 0);
    const expected = received * (i.scost || 0);
    const actual = sold * (i.scost || 0);
    const diff = actual - expected;
    const status = diff === 0 ? "Match" : diff > 0 ? "Over" : "Short";

    // 2️⃣ Upsert into ComparisonItem
    const updatedItem = await ComparisonItem.findOneAndUpdate(
      { itemName: i.itemName }, // use unique field or inventory _id if you save it
      {
        itemName: i.itemName,
        qtyReceived: received,
        qtySold: sold,
        amountExpected: expected,
        amountDisbursed: actual,
        variance: diff,
        qtyVariance: received - sold,
        profitMargin: 0, // you can calculate if needed
        approvalStatus,   // ✅ track approve/disapprove
        notes: "",        // optional
        fileUrl: "",      // optional
      },
      { new: true, upsert: true } // create if it doesn’t exist
    );

    console.log("💾 ComparisonItem saved/updated:", updatedItem);

    res.json({ message: `Record ${approvalStatus}`, item: updatedItem });

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
