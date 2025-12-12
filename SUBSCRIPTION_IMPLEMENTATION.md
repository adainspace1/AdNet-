// SUBSCRIPTION ACCESS CONTROL IMPLEMENTATION GUIDE
// ================================================

// Step 1: Add this to the top of your server.js (after other requires)
const { checkSubscription, checkPageAccess } = require('./middleware/subscriptionCheck');

// Step 2: Add these routes to handle the subscription pages
app.get('/not-subscribed-yet', (req, res) => {
  res.render('not-subscribed-yet');
});

app.get('/add-subscription', (req, res) => {
  res.render('add-subscription');
});

// Step 3: Apply middleware to protected routes
// ============================================

// Example 1: Require subscription for entire dashboard
app.get('/dashboard', checkSubscription, (req, res) => {
  // User has subscription, proceed to dashboard
  res.render('dashboard');
});

// Example 2: Check if specific page is in subscription
// This checks if user is trying to access a page they didn't subscribe to
app.get('/finance', checkPageAccess, (req, res) => {
  // Verify the Finance page is in their subscription items
  res.render('finance');
});

// Example 3: Check multiple pages
const protectedPages = ['finance', 'audit', 'hr', 'logistics', 'crm'];

protectedPages.forEach(page => {
  app.get(`/${page}`, checkPageAccess, (req, res) => {
    res.render(page);
  });
});

// Example 4: Check subscription before API calls
app.post('/api/some-endpoint', checkSubscription, (req, res) => {
  // Only logged-in users with subscription can access
  // req.userSubscription contains their subscription object
  res.json({ success: true, data: req.userSubscription });
});

// WHAT THE MIDDLEWARE DOES:
// ========================

// checkSubscription middleware:
// 1. Checks if user is logged in (req.session.user._id)
// 2. Queries CustomPlan model for userId match
// 3. If NO subscription found → redirects to /not-subscribed-yet
// 4. If subscription found → attaches to req.userSubscription and continues

// checkPageAccess middleware:
// 1. Does all checkSubscription checks
// 2. Gets the page name from req.params.page or req.query.page
// 3. Searches subscription.items for matching page name
// 4. If page NOT in items → redirects to /add-subscription
// 5. If page IS in items → allows access

// ACCESSING SUBSCRIPTION DATA IN CONTROLLERS:
// ===========================================

// In any route protected by checkSubscription or checkPageAccess:
app.get('/example', checkSubscription, (req, res) => {
  const userSubscription = req.userSubscription;
  
  console.log('User ID:', req.session.user._id);
  console.log('Subscription items:', userSubscription.items);
  console.log('Contract length:', userSubscription.contract);
  console.log('Number of users:', userSubscription.users);
  console.log('Total cost:', userSubscription.total);
  console.log('Status:', userSubscription.status);
  
  res.json({ subscription: userSubscription });
});

// EXAMPLE USAGE IN EXISTING ROUTES:
// =================================

// If you already have a route like:
// app.get('/finance', (req, res) => { res.render('finance'); });

// Change it to:
// app.get('/finance', checkPageAccess, (req, res) => { res.render('finance'); });

// That's it! Now it will:
// 1. Check if user is logged in
// 2. Check if they have a subscription
// 3. Check if 'finance' is in their subscribed items
// 4. Either show page or redirect to appropriate error page
