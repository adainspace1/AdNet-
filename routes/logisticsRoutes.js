const express = require('express');
const router = express.Router();
const orderController = require('../controllers/logisticController');
const { ensureAuthenticated } = require('../middleware/auth');


// Logistics Dashboard
router.get('/', ensureAuthenticated, orderController.getLogisticsPage);

module.exports = router;
