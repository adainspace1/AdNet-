const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  registerDriver,
  loginDriver,
  getDriverDashboard,
  acceptOrder,
  updateOrderStatus
} = require("../controllers/driverController");
const orderController = require('../controllers/orderController'); // Import orderController for dashboard/API

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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
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

// ================== DRIVER AUTH ROUTES ==================
// Route with Cloudinary upload handling
router.post("/register", upload, registerDriver); // Changed to /register to match plan/server.js usage
router.post("/login", loginDriver); // Changed to /login

// Render Login/Signup Pages (Simple renders)
router.get('/login', (req, res) => res.render('dashboard/driverdash/driverlogin'));
router.get('/signup', (req, res) => res.render('dashboard/driverdash/driversignup'));

// Render registration form
function driverAuth(req, res, next) {
  if (!req.session.driver) {
    return res.redirect('/driver/login');
  }
  next();
}

// ================== DRIVER DASHBOARD & API ROUTES ==================
// Note: These use orderController as per original server.js code
router.get('/driver-dash', driverAuth, orderController.getDriverDashboard);
router.post('/api/driver/accept-order', driverAuth, orderController.acceptOrder);
router.post('/api/driver/update-status', driverAuth, orderController.updateOrderStatus);
router.post('/api/driver/toggle-online', driverAuth, orderController.toggleOnline);
router.get('/api/driver/orders', driverAuth, orderController.getAvailableOrders);

module.exports = router;
