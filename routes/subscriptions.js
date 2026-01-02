const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

// Subscribe to a module
router.post('/subscribe', subscriptionController.subscribeToModule);

// Get current user's subscriptions
router.get('/user', subscriptionController.getUserSubscriptions);

// Get specific user's subscriptions (admin)
router.get('/user/:userId', subscriptionController.getUserSubscriptions);

// Check module access
router.get('/check/:userId/:module', subscriptionController.checkModuleAccess);

// Extend subscription
router.put('/extend', subscriptionController.extendSubscription);

// Cancel subscription
router.put('/cancel/:subscriptionId', subscriptionController.cancelSubscription);

// Get all subscriptions (admin)
router.get('/', subscriptionController.getAllSubscriptions);

module.exports = router;