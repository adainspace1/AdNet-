const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { ensureAuthenticated } = require('../middleware/auth');

// ================== ORDER MANAGEMENT ROUTES ==================

const multer = require('multer');
const storage = multer.memoryStorage();
const uploadOrder = multer({ storage: storage }).fields([
    { name: 'proofOfPayment', maxCount: 5 }
]);

// Order Management Pages & Actions
router.get('/', ensureAuthenticated, orderController.getOrdersPage);
router.post('/api/auth/createOrder', uploadOrder, ensureAuthenticated, orderController.createOrder);
router.get('/order/:id', ensureAuthenticated, orderController.getOrderDetails);

router.get('/search-companies', orderController.searchCompanies);
router.post('/usercreateOrder', orderController.usercreateOrder);
router.post("/confirm/:orderId", orderController.confirmOrder);




module.exports = router;
