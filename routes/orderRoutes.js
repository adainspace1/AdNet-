const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { ensureAuthenticated } = require('../middleware/auth');

// ================== ORDER MANAGEMENT ROUTES ==================

// Order Management Pages & Actions
router.get('/', ensureAuthenticated, orderController.getOrdersPage);
router.post('/api/auth/createOrder', ensureAuthenticated, orderController.createOrder);
router.get('/order/:id', ensureAuthenticated, orderController.getOrderDetails);

router.get('/search-companies', orderController.searchCompanies);
router.post('/usercreateOrder',  orderController.usercreateOrder);
router.post("/confirm/:orderId",  orderController.confirmOrder);




module.exports = router;
