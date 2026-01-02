const Subscription = require('../models/Subscription');

// Map routes to features
const pageFeatureMap = {
  inventory: 'inventory',
  sales: 'sales',
  crm: 'crm',
  profit: 'profit',
  logistics: 'logistics',
  hr: 'hr',
  audit: 'audit',
  finance: 'finance'
};

// Middleware to check subscription status (General check)
const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id;
    if (!userId) return res.redirect('/not-subscribed-yet');

    // Find the user's single subscription document
    const subscriptionDoc = await Subscription.findOne({ userId });

    if (!subscriptionDoc || !subscriptionDoc.subscriptions || subscriptionDoc.subscriptions.length === 0) {
      return res.redirect('/not-subscribed-yet');
    }

    // Filter active subscriptions locally
    const activeSubscriptions = subscriptionDoc.subscriptions.filter(sub =>
      sub.status === 'active' && sub.endDate > new Date()
    );

    if (activeSubscriptions.length === 0) {
      return res.redirect('/not-subscribed-yet');
    }

    // Attach all subscriptions to request for use in controllers
    req.userSubscriptions = activeSubscriptions;
    next();

  } catch (error) {
    console.error('[SUBSCRIPTION ERROR]', error);
    return res.redirect('/not-subscribed-yet');
  }
};

// Middleware to check if user has access to specific page
const checkPageAccess = async (req, res, next) => {
  try {
    const userId = req.session?.user?._id;
    if (!userId) return res.redirect('/not-subscribed-yet');

    // Get the page name from URL params/query
    const requestedPage = (req.params.page || req.query.page || '').toLowerCase();

    // Map URL to feature name
    const feature = pageFeatureMap[requestedPage] || requestedPage;

    // Find the user's subscription document (ONCE)
    const subscriptionDoc = await Subscription.findOne({ userId });

    if (!subscriptionDoc) {
      return res.redirect('/add-subscription');
    }

    // Find active subscription for the specific feature
    const activeFeatureSub = subscriptionDoc.subscriptions.find(sub =>
      sub.feature === feature && sub.status === 'active' && sub.endDate > new Date()
    );

    if (!activeFeatureSub) {
      return res.redirect('/add-subscription');
    }

    // Attach the specific subscription to request
    req.userSubscription = activeFeatureSub;
    next();

  } catch (error) {
    console.error('[PAGE ACCESS ERROR]', error);
    return res.redirect('/add-subscription');
  }
};

module.exports = {
  checkSubscription,
  checkPageAccess
};
