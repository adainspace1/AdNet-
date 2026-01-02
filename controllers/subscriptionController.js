const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Subscribe to a module
exports.subscribeToModule = async (req, res) => {
  try {
    const { userId, module, durationMonths } = req.body;

    if (!userId || !module || !durationMonths) {
      return res.status(400).json({
        success: false,
        message: 'userId, module, and durationMonths are required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find or create the user's subscription document
    let userSubDoc = await Subscription.findOne({ userId });

    if (!userSubDoc) {
      userSubDoc = new Subscription({ userId, subscriptions: [] });
    }

    // Check if user already has an active subscription for this feature
    const existingFeatureSub = userSubDoc.subscriptions.find(sub =>
      sub.feature === module && sub.status === 'active' && sub.endDate > new Date()
    );

    if (existingFeatureSub) {
      return res.status(400).json({
        success: false,
        message: `User already has an active subscription for ${module}`
      });
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Add new feature subscription
    userSubDoc.subscriptions.push({
      feature: module,
      startDate,
      endDate,
      contractMonths: durationMonths,
      status: 'active'
    });

    await userSubDoc.save();

    res.status(201).json({
      success: true,
      message: `Successfully subscribed to ${module} for ${durationMonths} months`,
      subscription: userSubDoc,
      redirect: `/Finished?id=${userId}`
    });

  } catch (error) {
    console.error('Error subscribing to module:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing subscription',
      error: error.message
    });
  }
};

// Get user's active subscriptions
exports.getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.params.userId || req.session?.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User must be logged in'
      });
    }

    const subscriptionDoc = await Subscription.findOne({ userId });

    res.status(200).json({
      success: true,
      subscriptions: subscriptionDoc ? subscriptionDoc.subscriptions.filter(s => s.status === 'active') : []
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
};

// Check if user has access to a module
exports.checkModuleAccess = async (req, res) => {
  try {
    const { userId, module } = req.params;

    if (!userId || !module) {
      return res.status(400).json({
        success: false,
        message: 'userId and module are required'
      });
    }

    const subscriptionDoc = await Subscription.findOne({ userId });

    const featureSub = subscriptionDoc ? subscriptionDoc.subscriptions.find(sub =>
      sub.feature === module && sub.status === 'active' && sub.endDate > new Date()
    ) : null;

    res.status(200).json({
      success: true,
      hasAccess: !!featureSub,
      subscription: featureSub || null
    });

  } catch (error) {
    console.error('Error checking module access:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking access',
      error: error.message
    });
  }
};

// Extend subscription
exports.extendSubscription = async (req, res) => {
  try {
    const { userId, module, additionalMonths } = req.body;

    if (!userId || !module || !additionalMonths) {
      return res.status(400).json({
        success: false,
        message: 'userId, module and additionalMonths are required'
      });
    }

    const subscriptionDoc = await Subscription.findOne({ userId });

    if (!subscriptionDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subscription document not found'
      });
    }

    const featureSub = subscriptionDoc.subscriptions.find(sub => sub.feature === module && sub.status === 'active');

    if (!featureSub) {
      return res.status(404).json({
        success: false,
        message: `Active subscription for ${module} not found`
      });
    }

    // Extend end date
    const newEndDate = new Date(featureSub.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + additionalMonths);

    featureSub.endDate = newEndDate;
    featureSub.contractMonths += additionalMonths;

    await subscriptionDoc.save();

    res.status(200).json({
      success: true,
      message: `Subscription for ${module} extended by ${additionalMonths} months`,
      subscription: featureSub
    });

  } catch (error) {
    console.error('Error extending subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error extending subscription',
      error: error.message
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.session?.user?._id;
    const { module } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const subscriptionDoc = await Subscription.findOne({ userId });

    if (!subscriptionDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subscription document not found'
      });
    }

    const featureSub = subscriptionDoc.subscriptions.find(sub => sub.feature === module && sub.status === 'active');

    if (!featureSub) {
      return res.status(404).json({
        success: false,
        message: `Active subscription for ${module} not found`
      });
    }

    featureSub.status = 'cancelled';
    await subscriptionDoc.save();

    res.status(200).json({
      success: true,
      message: `Subscription for ${module} cancelled`,
      subscription: featureSub
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};

// Get all subscriptions (admin)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('userId', 'username email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions
    });

  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
};
