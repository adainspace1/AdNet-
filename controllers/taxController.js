const Tax = require("../models/Tax");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const cloudinary = require("../cloudinary");
const streamifier  = require("streamifier");
const multer = require('multer');
const bodyparser = require('body-parser');


const Company = require("../models/company");



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










// controller
exports.getUserCompanies = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.user?._id || req.session.worker?.adminId;
    const companies = await Tax.distinct("companyname", { userId });
    res.json(companies);
  } catch (err) {
    console.error("Error fetching company list:", err);
    res.status(500).json([]);
  }
};




exports.generateComplianceReport = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.user?._id || req.session.worker?.adminId;
    const { company } = req.query;

    // always filter by userId, but company is optional
    const query = { userId };
    if (company && company !== "all") query.companyname = company;

    const taxes = await Tax.find(query);

    const total = taxes.length;
    const onTime = taxes.filter(t => t.status === "Paid" && !t.isLate).length;
    const overdue = taxes.filter(t => t.status === "Pending" && new Date(t.dueDate) < new Date()).length;
    const upcoming = taxes.filter(t => t.status === "Pending" && new Date(t.dueDate) > new Date()).length;

    const complianceRate = total > 0 ? Math.round((onTime / total) * 100) : 0;

    const alerts = [];
    if (overdue > 0) alerts.push({ message: `${overdue} overdue filing(s)`, type: "danger" });
    if (upcoming > 0) alerts.push({ message: `${upcoming} upcoming deadline(s)`, type: "warning" });

    const insights = [];
    if (complianceRate < 50) insights.push("Your compliance rate is low. Review pending filings immediately.");
    if (overdue > 0) insights.push("Clear overdue filings to avoid penalties.");
    if (complianceRate >= 80) insights.push("You're in good standing. Keep up timely submissions!");

    res.status(200).json({
      complianceRate,
      onTime,
      overdue,
      upcoming,
      alerts,
      insights,
      lastAudit: new Date().toLocaleDateString("en-US"),
      standing: complianceRate >= 80 ? "Compliant" : "Needs Attention",
    });
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ message: "Error generating compliance report" });
  }
};

