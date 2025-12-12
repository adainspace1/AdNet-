const CustomPlan = require('../models/CustomPlan');
const Personal = require('../models/personal'); // adjust path

// Create a new custom plan/order
exports.createCustomPlan = async (req, res) => {
    console.log("Received custom plan data:", req.body);
  try {
    // Get userId from request body instead of session
    const { userId, items, subtotal, total, contract, users, notes, monthlyCost } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    // Optional: check if Personal user exists
    const user = await Personal.findById(userId);
    if (!user) {
      console.log(`No Personal record found for userId: ${userId}, proceeding anyway.`);
    }

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }
    if (!contract || !users) {
      return res.status(400).json({
        success: false,
        message: 'Contract length and user count are required'
      });
    }

    // Create the custom plan order
    const customPlan = new CustomPlan({
      userId,
      items,
      subtotal: subtotal || 0,
      total: total || 0,
      contract: contract || 12,
      users: users || 1,
      monthlyCost: monthlyCost || 0,
      notes: notes || '',
      status: 'pending'
    });

    await customPlan.save();

    // Update the Personal model with plan info
    if (user) {
      user.plan = `Custom Plan - ${contract} months / ${users} users`;
      user.total = total || 0;
      await user.save();
    }

    // Send success with redirect info
    return res.status(201).json({
      success: true,
      message: 'Order submitted successfully',
      orderId: customPlan._id,
      redirect: '/login', // frontend can redirect here
      order: customPlan
    });

  } catch (error) {
    console.error('Error creating custom plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing your order',
      error: error.message
    });
  }
};


// Get all orders (admin)
exports.getAllCustomPlans = async (req, res) => {
  try {
    const plans = await CustomPlan.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    console.error('Error fetching custom plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get user's own orders
exports.getUserCustomPlans = async (req, res) => {
  try {
    const userId = req.session?.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User must be logged in'
      });
    }

    const plans = await CustomPlan.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your orders',
      error: error.message
    });
  }
};

// Get single custom plan
exports.getCustomPlanById = async (req, res) => {
  try {
    const plan = await CustomPlan.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Error fetching custom plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Update order status (admin)
exports.updateCustomPlanStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'reviewing', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: ' + validStatuses.join(', ')
      });
    }

    const plan = await CustomPlan.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      plan
    });
  } catch (error) {
    console.error('Error updating custom plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    });
  }
};

// Delete custom plan request
exports.deleteCustomPlan = async (req, res) => {
  try {
    const plan = await CustomPlan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting custom plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      error: error.message
    });
  }
};
