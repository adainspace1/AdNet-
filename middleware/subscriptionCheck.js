const CustomPlan = require('../models/CustomPlan');

// Middleware to check subscription status
const checkSubscription = async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    const pageUrl = req.originalUrl;

    // Get userId from session
    const userId = req.session?.user?._id;
    const userName = req.session?.user?.name || 'Unknown';
    const userEmail = req.session?.user?.email || 'Unknown';

    console.log(`\n[SUBSCRIPTION CHECK] ${now}`);
    console.log(`├─ Page URL: ${pageUrl}`);
    console.log(`├─ User ID: ${userId || 'NOT LOGGED IN'}`);
    console.log(`├─ User Name: ${userName}`);
    console.log(`├─ User Email: ${userEmail}`);

    if (!userId) {
      console.log(`└─ ❌ STATUS: NOT LOGGED IN - Redirecting to /not-subscribed-yet\n`);
      return res.redirect('/not-subscribed-yet');
    }

    // Check if user has any subscription in CustomPlan
    const subscription = await CustomPlan.findOne({ userId });

    if (!subscription) {
      console.log(`├─ Subscription Check: ❌ NO SUBSCRIPTION FOUND`);
      console.log(`└─ STATUS: NO SUBSCRIPTION - Redirecting to /not-subscribed-yet\n`);
      return res.redirect('/not-subscribed-yet');
    }

    // Subscription exists, log details
    console.log(`├─ Subscription Check: ✓ SUBSCRIPTION FOUND`);
    console.log(`├─ Subscription ID: ${subscription._id}`);
    console.log(`├─ Contract Length: ${subscription.contract} months`);
    console.log(`├─ Number of Users: ${subscription.users}`);
    console.log(`├─ Total Cost: ₦${subscription.total}`);
    console.log(`├─ Items Count: ${subscription.items.length}`);
    console.log(`├─ Subscription Status: ${subscription.status}`);
    console.log(`├─ Created At: ${subscription.createdAt}`);
    
    if (subscription.items.length > 0) {
      console.log(`├─ Subscribed Items:`);
      subscription.items.forEach((item, index) => {
        console.log(`│  ${index + 1}. ${item.name} (₦${item.total})`);
      });
    }
    
    console.log(`└─ STATUS: ✓ ALLOWED - User has active subscription\n`);

    // Subscription exists, attach to request
    req.userSubscription = subscription;
    next();

  } catch (error) {
    console.error('\n[SUBSCRIPTION ERROR]', error);
    console.log(`└─ STATUS: ❌ ERROR - Redirecting to /not-subscribed-yet\n`);
    return res.redirect('/not-subscribed-yet');
  }
};

// Middleware to check if user has access to specific page
const checkPageAccess = async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    const pageUrl = req.originalUrl;

    const userId = req.session?.user?._id;
    const userName = req.session?.user?.name || 'Unknown';
    const userEmail = req.session?.user?.email || 'Unknown';

    // Get the page they're trying to access
    const requestedPage = req.params.page || req.query.page || 'Unknown Page';

    console.log(`\n[PAGE ACCESS CHECK] ${now}`);
    console.log(`├─ Page URL: ${pageUrl}`);
    console.log(`├─ Requested Page: ${requestedPage}`);
    console.log(`├─ User ID: ${userId || 'NOT LOGGED IN'}`);
    console.log(`├─ User Name: ${userName}`);
    console.log(`├─ User Email: ${userEmail}`);

    if (!userId) {
      console.log(`└─ STATUS: ❌ NOT LOGGED IN - Redirecting to /not-subscribed-yet\n`);
      return res.redirect('/not-subscribed-yet');
    }

    // Check if user has subscription
    const subscription = await CustomPlan.findOne({ userId });

    if (!subscription) {
      console.log(`├─ Subscription Status: ❌ NO SUBSCRIPTION`);
      console.log(`└─ STATUS: ❌ NO SUBSCRIPTION - Redirecting to /not-subscribed-yet\n`);
      return res.redirect('/not-subscribed-yet');
    }

    console.log(`├─ Subscription Status: ✓ FOUND`);
    console.log(`├─ Subscription ID: ${subscription._id}`);
    console.log(`├─ Contract Length: ${subscription.contract} months`);
    console.log(`├─ Total Items in Subscription: ${subscription.items.length}`);

    // Check if requested page is in their subscribed items
    if (requestedPage && requestedPage !== 'Unknown Page') {
      const hasAccess = subscription.items.some(item => 
        item.name.toLowerCase().includes(requestedPage.toLowerCase()) ||
        item.name.toLowerCase() === requestedPage.toLowerCase()
      );

      console.log(`├─ Checking Page Access...`);
      console.log(`├─ Subscribed Pages:`);
      subscription.items.forEach((item, index) => {
        const match = item.name.toLowerCase().includes(requestedPage.toLowerCase());
        console.log(`│  ${index + 1}. ${item.name} ${match ? '✓ MATCH' : ''}`);
      });

      if (!hasAccess) {
        console.log(`├─ Page Match: ❌ NOT FOUND`);
        console.log(`└─ STATUS: ❌ PAGE NOT IN SUBSCRIPTION - Redirecting to /add-subscription\n`);
        return res.redirect('/add-subscription');
      }

      console.log(`├─ Page Match: ✓ FOUND`);
    }

    console.log(`└─ STATUS: ✓ ALLOWED - User has access to this page\n`);

    // Attach subscription to request
    req.userSubscription = subscription;
    next();

  } catch (error) {
    console.error('\n[PAGE ACCESS ERROR]', error);
    console.log(`└─ STATUS: ❌ ERROR - Redirecting to /add-subscription\n`);
    return res.redirect('/add-subscription');
  }
};

module.exports = {
  checkSubscription,
  checkPageAccess
};
