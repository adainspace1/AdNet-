const CustomPlan = require('../models/CustomPlan');
const Personal = require('../models/personal'); // adjust path
const Subscription = require('../models/Subscription');

// Helper function to calculate end date
const calculateEndDate = (start, months) => {
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return end;
};

// Create a new custom plan/order
exports.createCustomPlan = async (req, res) => {
  try {
    const { userId, items, contract } = req.body;

    if (!userId || !items?.length) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }

    const startDate = new Date();

    // Find or create the user's subscription document
    let userSubDoc = await Subscription.findOne({ userId });

    if (!userSubDoc) {
      userSubDoc = new Subscription({ userId, subscriptions: [] });
    }

    for (const item of items) {
      const featureKey = item.name.toLowerCase(); // inventory, sales, etc
      const endDate = calculateEndDate(startDate, contract);

      // Check if user already has this feature active in the array
      const existingFeatureIndex = userSubDoc.subscriptions.findIndex(sub =>
        sub.feature === featureKey && sub.status === 'active'
      );

      if (existingFeatureIndex !== -1) {
        // Update existing active subscription for this feature
        userSubDoc.subscriptions[existingFeatureIndex].endDate = endDate;
        userSubDoc.subscriptions[existingFeatureIndex].contractMonths = contract;
      } else {
        // Add new timeline to the array
        userSubDoc.subscriptions.push({
          feature: featureKey,
          contractMonths: contract,
          startDate,
          endDate,
          status: 'active'
        });
      }
    }

    await userSubDoc.save();

    return res.status(201).json({
      success: true,
      message: 'Subscriptions added successfully',
      subscription: userSubDoc,
      redirect: `/Finished?id=${userId}`
    });

  } catch (err) {
    console.error('Error creating custom plan:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
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
