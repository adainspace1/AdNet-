const Vendor = require("../models/vendorreg");
const AddVendor = require("../models/AddVendor");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// controllers/vendorController.js
const Report = require("../models/Report");

const Personal = require("../models/personal");
const Company = require("../models/company");
const BankInfo = require("../models/bank");

const Businessinfo = require("../models/business");

const cloudinary = require("../cloudinary");
const streamifier  = require("streamifier");
const multer = require('multer');
const bodyparser = require('body-parser');

// ✅ Helper: Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "your_jwt_secret", {
    expiresIn: "7d",
  });
};


const handleImageUpload = (file) => {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const isPDF = file.mimetype === "application/pdf";

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: isPDF ? "raw" : "auto",
        folder: "Adnet",
      },
      (error, result) => {
        if (error) {
          reject(new Error("Error uploading to Cloudinary: " + error.message));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};



// 🧾 Vendor Signup
exports.signupVendor = async (req, res) => {
  try {
    console.log("📥 Signup request body:", req.body);

    const {
      name,
      companyName,
      email,
      password,
      confirmPassword,
      phone,
      address,
      description,
      category,
      registrationNumber,
      contactPersonName,
      contactPersonEmail,
      contactPersonPhone,
      bankName,
      accountNumber,
      paymentMethod,
      productCategories,
    } = req.body;

    // 🔍 Validate passwords
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    // 🔍 Check if vendor already exists
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor)
      return res.status(400).json({ message: "Email already in use" });

    // ✅ Create vendor
    const vendor = new Vendor({
      name,
      companyName,
      email,
      password, // gets hashed automatically
      phone,
      address,
      description,
      category,
      registrationNumber,
      productCategories: JSON.parse(productCategories || "[]"),

      contactPerson: {
        name: contactPersonName,
        email: contactPersonEmail,
        phone: contactPersonPhone,
      },

      bankInfo: {
        bankName,
        accountNumber,
        paymentMethod,
      },
    });

    await vendor.save();
    console.log("✅ Vendor saved successfully:", vendor);

    const token = generateToken(vendor._id);

    res.status(201).json({
      message: "Vendor registered successfully!",
      vendor,
      token,
    });
  } catch (err) {
    console.error("❌ Error in signupVendor:", err.message);
    res.status(500).json({ message: err.message });
  }
};



exports.loginVendor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await vendor.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    // ✅ Store session only, no JWT needed
    req.session.vendor = {
      id: vendor._id,
      email: vendor.email,
      name: vendor.name,
    };

    res.status(200).json({
      message: "Login successful",
      vendor,
      redirect: req.query.redirect || "/vendorAuth",
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// controllers/vendorController.js
exports.getVendorById = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("📩 Fetching vendor data for ID:", id);

    // 🧩 1️⃣ Try Vendor model (for vendor users)
    const vendor = await Vendor.findOne({
      $or: [{ _id: id }, { userId: id }],
    });

    if (vendor) {
      console.log("✅ Vendor record found for ID:", id);

      // 🏦 Try both recipientId and userId to find bank info
      const bankInfo =
        (await BankInfo.findOne({ recipientId: vendor._id })) ||
        (await BankInfo.findOne({ recipientId: vendor.userId })) ||
        (await BankInfo.findOne({ userId: vendor.userId }));

      console.log("🏦 Bank info found:", bankInfo ? "✅ Yes" : "❌ No");

      return res.json({
        type: "vendor",
        _id: vendor._id,
        companyName: vendor.companyName,
        category: vendor.category,
        address: vendor.address,
        contactPerson: vendor.contactPerson,
        rating: vendor.rating,
        tags: vendor.tags,
        bankInfo: bankInfo
          ? {
              bankName: bankInfo.bankName,
              accountNumber: bankInfo.accountNumber,
              accountName: bankInfo.accountName || "",
              accountType: bankInfo.accountType,
            }
          : null,
        createdAt: vendor.createdAt,
      });
    }

    // 🧩 2️⃣ Try Personal (for admin or other users)
    const personal = await Personal.findById(id);
    if (personal) {
      console.log("✅ Personal record found for ID:", id);

      const bankInfo =
        (await BankInfo.findOne({ recipientId: personal._id })) ||
        (await BankInfo.findOne({ userId: personal._id }));

      const businessinfo = await Businessinfo.findOne({ recipientId: personal._id });

      return res.json({
        type: "personal",
        fullName: `${personal.firstName} ${personal.lastName}`,
        email: personal.email,
        phone: personal.phone,
        bio: personal.bio || "",
        portfolioUrl: personal.portfolioUrl || "",
        address: `${personal.streetAddress}, ${personal.city}, ${personal.state}, ${personal.country}`,
        tier: personal.tier,
        plan: personal.plan,
        companyName: businessinfo?.businessName || "",
        bankInfo: bankInfo
          ? {
              bankName: bankInfo.bankName,
              accountNumber: bankInfo.accountNumber,
              accountName: bankInfo.accountName || "",
              accountType: bankInfo.accountType,
            }
          : null,
      });
    }

    console.log("❌ No Vendor or Personal record found for ID:", id);
    return res.status(404).json({ message: "Record not found" });
  } catch (err) {
    console.error("🔥 Error in getVendorById:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};














// ✅ POST /api/vendors
// ✅ POST /api/vendors
exports.addVendor = async (req, res) => {
  try {
    console.log("📸 Uploaded files:", req.files);

    const {
      UserId,
      companyName,
      vendorType,
      category,
      contactInfo,
      address,
      bankInfo,
      tier3Verify,
      rating,
      tags,
      createdBy
    } = req.body;

    // ✅ Handle file upload (check properly)
    let uploadedDocs = req.files?.uploadDocs?.[0] || null;
    let image1Url = null;

    if (uploadedDocs) {
      image1Url = await handleImageUpload(uploadedDocs);
      console.log("✅ Uploaded to Cloudinary:", image1Url);
    } else {
      console.log("⚠️ No file uploaded.");
    }

    // ✅ Create new vendor
    const vendor = new AddVendor({
      UserId,
      companyName,
      vendorType,
      category,
      contactInfo,
      address,
      bankInfo,
      tier3Verified: tier3Verify === "true",
      rating: { average: parseInt(rating) || 0 },
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      createdBy,
      uploadedDocs: image1Url || null,
    });

    await vendor.save();

    console.log("✅ New vendor created:", vendor);
    res.json({ message: "Vendor created successfully", vendor });
  } catch (err) {
    console.error("❌ Error creating vendor:", err);
    res.status(500).json({ message: "Server error while creating vendor" });
  }
};




exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const vendor = await AddVendor.findByIdAndUpdate(id, updates, { new: true });
    res.json({ message: "Vendor updated successfully", vendor });
  } catch (err) {
    console.error("❌ Error updating vendor:", err);
    res.status(500).json({ message: "Server error while updating vendor" });
  }
};















exports.reportVendor = async (req, res) => {
  try {
    console.log("📩 Incoming report info:", req.body);

    const { vendorId, reporterId, reason, email, fullname } = req.body;

    // 🧠 Log each field separately
    console.log("➡️ vendorId:", vendorId);
    console.log("➡️ reporterId:", reporterId);
    console.log("➡️ reason:", reason);
    console.log("➡️ fullname:", fullname);
    console.log("➡️ email:", email);

    // 🚨 Fix your if condition – it was wrong before
    if (!vendorId || !reporterId || !reason || !fullname || !email) {
      console.log("❌ Missing one or more required fields!");
      return res.status(400).json({ message: "Missing fields" });
    }

    // ✅ Add to Report model
    console.log("🧾 Creating new report document...");
    const newReport = new Report({ vendorId, reporterId, reason, email, fullname });
    await newReport.save();
    console.log("✅ Report saved successfully:", newReport._id);

    // ✅ Find vendor and update their report list
    console.log("🔍 Fetching vendor by ID...");
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      console.log("❌ Vendor not found!");
      return res.status(404).json({ message: "Vendor not found" });
    }

    console.log("✅ Vendor found:", vendor.companyName || vendor.name);

    // ✅ Push report to vendor’s internal report list
    vendor.reports.push({ reporterId, reason });
    console.log("📊 Vendor now has", vendor.reports.length, "reports");

    // ✅ Auto-ban after 3 reports
    if (vendor.reports.length >= 3) {
      vendor.banned = true;
      vendor.status = "Suspended"; // optional but clean
      console.log("🚫 Vendor banned after 3 reports");
    }

    await vendor.save();
    console.log("✅ Vendor updated successfully.");

    res.json({
      message: vendor.banned
        ? "Vendor has been banned after multiple reports."
        : "Report submitted successfully.",
      vendor,
    });
  } catch (err) {
    console.error("💥 Fatal error in reportVendor:", err);
    res.status(500).json({ message: "Server error while reporting vendor" });
  }
};













// POST /api/vendors/assign
exports.assignVendor = async (req, res) => {
  try {
    const { vendorId, userId } = req.body;

    // 🧠 Log both IDs to confirm what’s coming in
    console.log("📦 Assign Vendor Debug:");
    console.log("➡️ vendorId:", vendorId);
    console.log("➡️ userId:", userId);

    if (!vendorId || !userId) {
      return res.status(400).json({ message: "Missing vendor or user ID" });
    }

    const vendor = await AddVendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    vendor.assignedTo = userId;
    await vendor.save();

    res.json({ message: "Vendor successfully assigned!", vendor });
  } catch (err) {
    console.error("❌ Error assigning vendor:", err);
    res.status(500).json({ message: "Server error while assigning vendor" });
  }
};










exports.getVendorHistory = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const reports = await Report.find({ vendorId }).populate("reporterId", "name email");
    res.json({ reports });
  } catch (err) {
    console.error("❌ Error fetching vendor history:", err);
    res.status(500).json({ message: "Error fetching vendor history" });
  }
};
