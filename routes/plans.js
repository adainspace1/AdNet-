const express = require('express');
const router = express.Router();
const plansController = require('../controllers/plansController');

// POST /api/plans/create - Create new order (logged-in user)
router.post('/create', plansController.createCustomPlan);

// GET /api/plans/my-orders - Get current user's orders
router.get('/my-orders', plansController.getUserCustomPlans);

// GET /api/plans - Get all orders (admin only)
router.get('/', plansController.getAllCustomPlans);

// GET /api/plans/:id - Get single order
router.get('/:id', plansController.getCustomPlanById);

// PUT /api/plans/:id - Update order status (admin)
router.put('/:id', plansController.updateCustomPlanStatus);

// DELETE /api/plans/:id - Delete order
router.delete('/:id', plansController.deleteCustomPlan);

module.exports = router;