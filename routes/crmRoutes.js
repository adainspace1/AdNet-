const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');





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



// Dashboard
router.get('/', ensureAuthenticated, crmController.getCRMDashboard);

// Actions
router.post('/lead', ensureAuthenticated, crmController.createLead);
router.post('/deal', ensureAuthenticated, crmController.createDeal);
router.post('/activity', ensureAuthenticated, crmController.createActivity);

module.exports = router;
