// routes/auditRoutes.js
const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { ensureAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication to all audit routes
router.use(ensureAuthenticated);

// Automatic audit routes
router.post('/run', auditController.getAuditData);
router.get('/detail/:itemName', auditController.getAuditDetail);
router.post('/save-item', auditController.saveComparisonItem);

// Download routes
router.get('/download/pdf/:auditId', auditController.downloadAuditPDF);
router.get('/download/csv/:auditId', auditController.downloadAuditCSV);
router.get('/download/activity/pdf', auditController.downloadActivityPDF);
router.get('/download/activity/csv', auditController.downloadActivityCSV);

// Manual audit routes
router.post('/manual/create', auditController.createManualAudit);
router.get('/manual/transactions/:auditId', auditController.getManualAuditTransactions);
router.post('/manual/submit', upload.array('supportingFiles'), auditController.submitManualAudit);

// Audit list
router.get('/list', auditController.getAuditList);

module.exports = router;