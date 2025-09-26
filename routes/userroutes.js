const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const multer = require('multer');
const storage = multer.memoryStorage();

const router = express.Router();

const bodyparser = require('body-parser')






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
     workerlogin
  } = require("../controllers/usercontroller")
 
    console.log(" two", payReceivable);


  router.post('/createinventory', createInventory);
    router.post('/createsales', createSale);
  router.post('/createexpenses',     saveExpense);
  router.post('/createproduction',     production);
    router.post('/createApayable',     AccountPayable);
        router.post('/PayApayable',     payAccountPayable);
        router.post('/createAreceivable',     accountreceivable);
                router.post('/PayAreceivable',     payReceivable);
router.post('/payroll', createPayroll);
router.post('/editpayroll/:id', editpayroll);

router.post('/Budgets/create', createBudget);

router.post('/forcastsales', forcastsales);

router.post('/createdeal', createdeal);

  router.post('/reset-password/:token', resetpassword);
  router.post('/forgot-password', forgotpassword);

// Create worker
router.post("/users", createWorker);

router.post("/workerlogin", workerlogin);







// User Signup



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

      // role → allowed paths
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

      // role → base path scope (worker admin-level must stay within scope)
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

      // Attach for downstream
      req.recipientId = adminId;
      req.isWorker = true;

      // Role missing
      if (!config) {
        console.warn(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | BLOCKED (unknown role) | workerId: ${workerId} | role: ${role}`);
        return res.redirect("/bastard");
      }

      // Worker with admin-level: allow only within their role's base path
      if (accessLevel === "admin") {
        if (basePath && urlLower.startsWith(basePath)) {
          console.log(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | ALLOWED (role-admin) | workerId: ${workerId} | adminId: ${adminId} | role: ${role} | accessLevel: ${accessLevel}`);
          return next();
        } else {
          console.warn(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | BLOCKED (outside role scope) | workerId: ${workerId} | adminId: ${adminId} | role: ${role} | accessLevel: ${accessLevel}`);
          return res.redirect("/bastard");
        }
      }

      // Basic/Max check
      const allowedPaths = config[accessLevel];
      if (allowedPaths && allowedPaths.some((path) => urlLower.startsWith(path))) {
        console.log(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | ALLOWED | workerId: ${workerId} | adminId: ${adminId} | role: ${role} | accessLevel: ${accessLevel}`);
        return next();
      }

      console.warn(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | BLOCKED (no permission) | workerId: ${workerId} | adminId: ${adminId} | role: ${role} | accessLevel: ${accessLevel}`);
      return res.redirect("/bastard");
    }

    // Nobody logged in → redirect accordingly
    const attemptedUrl = req.originalUrl;
    console.log(`[AUTH] ${now} | PAGE: ${attemptedUrl} | TYPE: GUEST | REDIRECT`);

    if (attemptedUrl && attemptedUrl.startsWith("/employee")) {
      // Worker login redirect
      return res.redirect(`/employee/repons/auth/login?redirect=${encodeURIComponent(attemptedUrl)}`);
    } else {
      // Normal login redirect
      return res.redirect(`/login?redirect=${encodeURIComponent(attemptedUrl)}`);
    }
  } catch (err) {
    console.error("Error in ensureAuthenticated middleware:", err);
    res.status(500).send("Server error");
  }
}

const WalletController = require('../controllers/walletController');

router.get('/api/wallet/status', ensureAuthenticated, WalletController.status);
router.post('/api/wallet/create', ensureAuthenticated, WalletController.createWallet);

router.get('/api/banks/list', ensureAuthenticated, WalletController.banksList);
router.post('/api/banks/link', ensureAuthenticated, WalletController.linkBank);
router.get('/api/linked-banks', ensureAuthenticated, WalletController.getLinkedBanks);

// webhooks (public, secure with verification)
router.post('/webhooks/paystack', WalletController.paystackWebhook);

// optional manual reconciliation route
router.post('/api/reconcile/run', ensureAuthenticated, WalletController.runReconcile);


router.post('/api/wallet/fund', ensureAuthenticated, WalletController.fundWallet);
router.post('/api/wallet/withdraw', ensureAuthenticated, WalletController.withdrawFunds);


  
module.exports = router;
