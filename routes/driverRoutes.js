const express = require("express");
const router = express.Router();
const multer = require("multer");
const { 
    registerDriver,
    loginDriver
 } = require("../controllers/driverController");

// Use memoryStorage so files stay in memory for Cloudinary upload
const storage = multer.memoryStorage();

// File filter: allow only images & PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only image and PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
}).fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "carImage_front", maxCount: 1 },
  { name: "carImage_back", maxCount: 1 },
  { name: "carImage_left", maxCount: 1 },
  { name: "carImage_right", maxCount: 1 },
  { name: "carImage_dashboard", maxCount: 1 },
  { name: "licenseFront", maxCount: 1 },
  { name: "licenseBack", maxCount: 1 },
  { name: "registration", maxCount: 1 },
  { name: "insurance", maxCount: 1 },
  { name: "roadworthiness", maxCount: 1 },
  { name: "kycDocument", maxCount: 1 },
]);

// Route with Cloudinary upload handling
router.post("/register-driver", upload, registerDriver);

router.post("/login-driver", loginDriver);

module.exports = router;
