const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const multer = require('multer');
const storage = multer.memoryStorage();

const router = express.Router();
const bodyparser = require('body-parser');

const {
  resetpassword,
  forgotpassword,
  createInventory,
  createSale,
  saveExpense,
  production,
  AccountPayable,
  accountreceivable,
  payAccountPayable,
  payReceivable,
  createPayroll,
  editpayroll,
  forcastsales,
  createdeal,
  createBudget,
  createWorker,
  workerlogin,
  addCredit,
  repayCredit
} = require("../controllers/usercontroller");


const WalletController = require('../controllers/walletController');

// ===========================================
// AUTH MIDDLEWARE
// ===========================================
function ensureAuthenticated(req, res, next) {
  try {
    const url = req.originalUrl || '';
    const urlLower = url.toLowerCase();
    const now = new Date().toISOString();

    // Case 1: Superadmin/Admin (full access)
    if (req.session && req.session.user) {
      const userId = req.session.user._id;
      console.log(
        `[AUTH] ${now} | PAGE: ${url} | TYPE: USER | ALLOWED | userId: ${userId} | email: ${req.session.user.email || ''}`
      );

      req.recipientId = userId;
      req.isWorker = false;
      return next();
    }

    // Case 2: Worker (role + accessLevel check)
    if (req.session && req.session.worker) {
      const worker = req.session.worker;
      const { _id: workerId, adminId, role, accessLevel } = worker;

      const roleAccess = {
        inventory: {
          basic: ["/inventory"],
          max: ["/inventory", "/production", "/inventory/tracking", "/inventory/history"],
        },
        sales: {
          basic: ["/sales"],
          max: ["/sales", "/sales/reports", "/salehistory"],
        },
        production: {
          basic: ["/production"],
          max: ["/production", "/production/logs", "/production/history"],
        },
        finance: {
          basic: ["/expenses"],
          max: ["/expenses", "/expenses/admin", "/viewallexpenses", "/api/expenses"],
        },
        hr: {
          basic: ["/hr"],
          max: ["/hr", "/hr/reports", "/hr/history"],
        },
        custom: {
          basic: [],
          max: [],
        },
      };

      const roleBasePath = {
        inventory: "/inventory",
        sales: "/sales",
        production: "/production",
        finance: "/expenses",
        hr: "/hr",
        custom: "",
      };

      const config = roleAccess[role] || roleAccess["custom"];
      const basePath = roleBasePath[role] || "";

      req.recipientId = adminId;
      req.isWorker = true;

      if (!config) {
        console.warn(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | BLOCKED (unknown role) | workerId: ${workerId} | role: ${role}`);
        return res.redirect("/bastard");
      }

      if (accessLevel === "admin") {
        if (basePath && urlLower.startsWith(basePath)) {
          console.log(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | ALLOWED (role-admin) | workerId: ${workerId} | adminId: ${adminId} | role: ${role} | accessLevel: ${accessLevel}`);
          return next();
        } else {
          console.warn(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | BLOCKED (outside role scope) | workerId: ${workerId} | role: ${role}`);
          return res.redirect("/bastard");
        }
      }

      const allowedPaths = config[accessLevel];
      if (allowedPaths && allowedPaths.some((path) => urlLower.startsWith(path))) {
        console.log(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | ALLOWED | workerId: ${workerId} | role: ${role}`);
        return next();
      }

      console.warn(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | BLOCKED (no permission) | workerId: ${workerId} | role: ${role}`);
      return res.redirect("/bastard");
    }

    // No session → redirect
    const attemptedUrl = req.originalUrl;
    console.log(`[AUTH] ${now} | PAGE: ${attemptedUrl} | TYPE: GUEST | REDIRECT`);

    if (attemptedUrl && attemptedUrl.startsWith("/employee")) {
      return res.redirect(`/employee/repons/auth/login?redirect=${encodeURIComponent(attemptedUrl)}`);
    } else {
      return res.redirect(`/login?redirect=${encodeURIComponent(attemptedUrl)}`);
    }
  } catch (err) {
    console.error("Error in ensureAuthenticated middleware:", err);
    res.status(500).send("Server error");
  }
}

// ===========================================
// PROTECTED ROUTES (require login)
// ===========================================

router.post('/createinventory', ensureAuthenticated, createInventory);
router.post('/createsales', ensureAuthenticated, createSale);
router.post('/createexpenses', ensureAuthenticated, saveExpense);
router.post('/createproduction', ensureAuthenticated, production);
router.post('/createApayable', ensureAuthenticated, AccountPayable);
router.post('/PayApayable', ensureAuthenticated, payAccountPayable);
router.post('/createAreceivable', ensureAuthenticated, accountreceivable);
router.post('/PayAreceivable', ensureAuthenticated, payReceivable);
router.post('/payroll', ensureAuthenticated, createPayroll);
router.post('/editpayroll/:id', ensureAuthenticated, editpayroll);
router.post('/Budgets/create', ensureAuthenticated, createBudget);
router.post('/forcastsales', ensureAuthenticated, forcastsales);
router.post('/createdeal', ensureAuthenticated, createdeal);

// Worker Management
router.post("/users", ensureAuthenticated, createWorker); // Only admins should create workers
router.post("/workerlogin", workerlogin); // Public: login

// Credit Management
router.post('/addcredit', ensureAuthenticated, addCredit); // assuming this exists
router.post('/repayCredit', ensureAuthenticated, repayCredit); // assuming this exists

// Wallet Routes
router.get('/api/wallet/status', ensureAuthenticated, WalletController.status);
router.post('/api/wallet/create', ensureAuthenticated, WalletController.createWallet);
router.get('/api/banks/list', ensureAuthenticated, WalletController.banksList);
router.post('/api/banks/link', ensureAuthenticated, WalletController.linkBank);
router.get('/api/linked-banks', ensureAuthenticated, WalletController.getLinkedBanks);
router.post('/api/wallet/fund', ensureAuthenticated, WalletController.fundWallet);
router.post('/api/wallet/withdraw', ensureAuthenticated, WalletController.withdrawFunds);
router.post('/api/reconcile/run', ensureAuthenticated, WalletController.runReconcile);

// ===========================================
// PUBLIC ROUTES (no auth required)
// ===========================================

router.post('/reset-password/:token', resetpassword);
router.post('/forgot-password', forgotpassword);

// Webhook (must be public — verify signature in controller)
router.post('/webhooks/paystack', WalletController.paystackWebhook);

module.exports = router;