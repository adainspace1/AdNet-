const Tax = require("../models/Tax");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const cloudinary = require("../cloudinary");
const streamifier  = require("streamifier");
const multer = require('multer');
const bodyparser = require('body-parser');
const mongoose = require("mongoose");


const Company = require("../models/company");
const Sale = require('../models/sale');
const Expense = require('../models/expense');



const handleImageUpload = (file) => {
  return new Promise((resolve, reject) => {
    // Detect file type
    const isPDF = file.mimetype === "application/pdf";

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: isPDF ? "raw" : "auto", // 👈 force PDFs as raw
        folder: "Adnet",
      },
      (error, result) => {
        if (error) {
          reject(new Error("Error uploading to Cloudinary: " + error.message));
        } else {
          resolve(result.secure_url); // return only URL
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};


// Add a new tax record
exports.addTaxRecord = async (req, res) => {
  try {
    const { userId, taxType, companyname, amount, filingDate, paymentMethod, status, notes } = req.body;
    
    console.log("Received tax data:", req.body, req.files);

    // Handle receipt upload
    const receipt = req.files?.receipt?.[0] || null;
    const receiptUrl = await handleImageUpload(receipt);

    // Create new tax record
    const tax = await Tax.create({
      userId,
      taxType,
      companyname,
      amount,
      filingDate,
      paymentMethod,
      status,
      notes,        // just store it as-is
      receiptUrl: receiptUrl || null,
    });

    console.log("Created new tax record:", tax);

    res.redirect("/taxation");
  } catch (err) {
    console.error("Add Tax Error:", err);
    res.status(500).json({ message: err.message });
  }
};


// 📋 Get all tax records by userId
exports.getAllTaxes = async (req, res) => {
  try {
    const userId = req.session.user._id; // 🧩 From your auth middleware (JWT/session)
    const taxes = await Tax.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json(taxes);
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.log("the error", err)
  }
};



// controllers/taxController.js
exports.getFilteredTaxes = async (req, res) => {
  try {
    const { companyname, taxType, status } = req.query;

    // Build dynamic query
    const filter = {};
    if (companyname) filter.companyname = { $regex: companyname, $options: 'i' };
    if (taxType) filter.taxType = taxType;
    if (status) filter.status = status;

    const taxes = await Tax.find(filter).sort({ createdAt: -1 });

    // Always return JSON for the frontend
    res.json(taxes);

  } catch (err) {
    console.error("Error fetching filtered taxes:", err);
    res.status(500).json({ message: "Server error" });
  }
};




// 📊 Get Tax Summary by User
exports.getTaxSummary = async (req, res) => {
  try {
    let userId = null;

    if (req.session.user) {
      userId = req.session.user._id;
    } else if (req.session.worker) {
      userId = req.session.worker.adminId;
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🧾 Fetch all taxes belonging to the user
    const taxes = await Tax.find({ userId });

    const totalPaid = taxes
      .filter(t => t.status === "Paid")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalPending = taxes
      .filter(t => t.status === "Pending")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const upcomingDeadlines = taxes.filter(t => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      const now = new Date();
      const diff = (deadline - now) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 7; // upcoming in next 7 days
    }).length;

    // ✅ Compliance Score = (paid / total) * 100
    const complianceScore =
      taxes.length > 0
        ? Math.round((taxes.filter(t => t.status === "Paid").length / taxes.length) * 100)
        : 0;

    res.status(200).json({
      totalPaid,
      totalPending,
      upcomingDeadlines,
      complianceScore,
    });
  } catch (err) {
    console.error("❌ Error in getUserTaxSummary:", err);
    res.status(500).json({ message: err.message });
  }
};






// 📊 Get Statutory Compliance Summary
exports.getStatutorySummary = async (req, res) => {
  try {
    const userId = req.session.user
      ? req.session.user._id
      : req.session.worker?.adminId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = new Date();
    const taxes = await Tax.find({ userId });

    // ✅ Counters
    const total = taxes.length;
    const onTime = taxes.filter((t) => t.status === "Paid").length;
    const overdue = taxes.filter((t) => t.status === "Overdue").length;
    const upcoming = taxes.filter((t) => {
      const due = new Date(t.dueDate);
      const diff = (due - now) / (1000 * 60 * 60 * 24); // days left
      return diff > 0 && diff <= 14;
    }).length;

    // ✅ Compute Compliance Rate
    const complianceRate = total > 0 ? Math.round((onTime / total) * 100) : 0;
    const complianceStatus =
      complianceRate >= 80
        ? "Good Standing"
        : complianceRate >= 50
        ? "Needs Attention"
        : "Non-Compliant";

    res.json({
      complianceRate,
      complianceStatus,
      onTime,
      overdue,
      upcoming,
    });
  } catch (err) {
    console.error("⚠️ Error fetching statutory summary:", err);
    res.status(500).json({ message: "Server error" });
  }
};

















exports.generateComplianceReport = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.user?._id || req.session.worker?.adminId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // 🔹 1️⃣ Fetch tax records for compliance calculation
    const taxes = await Tax.find({ userId });
    const total = taxes.length;
    const onTime = taxes.filter(t => t.status === "Paid" && !t.isLate).length;
    const overdue = taxes.filter(t => t.status === "Pending" && new Date(t.dueDate) < new Date()).length;
    const upcoming = taxes.filter(t => t.status === "Pending" && new Date(t.dueDate) > new Date()).length;
    const complianceRate = total > 0 ? Math.round((onTime / total) * 100) : 0;

    // 🔹 2️⃣ Fetch total sales and total expenses (use recipientId not userId)
    const salesAgg = await Sale.aggregate([
      { $match: { recipientId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
    ]);

    const expenseAgg = await Expense.aggregate([
      { $match: { recipientId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }
    ]);

    const totalSales = salesAgg[0]?.totalSales || 0;
    const totalExpenses = expenseAgg[0]?.totalExpenses || 0;
    const profit = totalSales - totalExpenses;

    // 🔹 3️⃣ Tax calculation based on profit bands
    const taxBands = [
      { min: 0, max: 800000, rate: 0 },
      { min: 800001, max: 3000000, rate: 15 },
      { min: 3000001, max: 12000000, rate: 18 },
      { min: 12000001, max: 25000000, rate: 21 },
      { min: 25000001, max: 50000000, rate: 23 },
      { min: 50000001, max: Infinity, rate: 25 },
    ];

    const annualTaxable = Math.max(profit * 12, 0); // prevent negative values
    let remaining = annualTaxable;
    let annualTax = 0;

    for (const band of taxBands) {
      if (remaining <= 0) break;
      const bandLimit = band.max === Infinity ? remaining : Math.min(remaining, band.max - band.min);
      annualTax += (bandLimit * band.rate) / 100;
      remaining -= bandLimit;
    }

    const monthlyTax = Math.round(annualTax / 12);
    const taxToPay = Math.max(monthlyTax, 0);

    // 🔹 4️⃣ Alerts & Insights
    const alerts = [];
    if (overdue > 0) alerts.push({ message: `${overdue} overdue filing(s)`, type: "danger" });
    if (upcoming > 0) alerts.push({ message: `${upcoming} upcoming deadline(s)`, type: "warning" });

    const insights = [];
    if (complianceRate < 50) insights.push("Your compliance rate is low. Review pending filings immediately.");
    if (overdue > 0) insights.push("Clear overdue filings to avoid penalties.");
    if (complianceRate >= 80) insights.push("You're in good standing. Keep up timely submissions!");
    insights.push(`Estimated monthly tax payable: ₦${taxToPay.toLocaleString()}`);

    // 🔹 5️⃣ Send everything to frontend
    res.status(200).json({
      complianceRate,
      onTime,
      overdue,
      upcoming,
      totalSales,
      totalExpenses,
      profit,
      taxToPay,
      alerts,
      insights,
      lastAudit: new Date().toLocaleDateString("en-US"),
      standing: complianceRate >= 80 ? "Compliant" : "Needs Attention",
    });
  } catch (err) {
    console.error("⚠️ Error generating report:", err);
    res.status(500).json({ message: "Error generating compliance report" });
  }
};


