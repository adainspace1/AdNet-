// HOW TO APPLY SUBSCRIPTION CHECKS TO YOUR ROUTES
// ==============================================

// Step 1: Import the middleware at the TOP of server.js
const { checkSubscription, checkPageAccess } = require('./middleware/subscriptionCheck');

// Step 2: Add routes that DON'T need subscription (PUBLIC)
// These work for EVERYONE - logged in or not
app.get('/dashboard', (req, res) => {
  // Anyone can view dashboard
  res.render('dashboard');
});

app.get('/', (req, res) => {
  // Home page - public
  res.render('index');
});

// Step 3: Add routes that NEED subscription (PROTECTED)
// These ONLY work if user is logged in AND has a subscription

// Option A: Just check if they have ANY subscription
app.get('/finance', checkSubscription, (req, res) => {
  // User must have SOME subscription
  res.render('finance');
});

// Option B: Check if they have access to SPECIFIC page
app.get('/audit', checkPageAccess, (req, res) => {
  // User must have 'audit' in their subscribed items
  res.render('audit');
});

// LOGGING OUTPUT EXAMPLE:
// ======================
// When someone accesses /finance, you'll see in console:
/*
[SUBSCRIPTION CHECK] 2025-12-12T10:30:45.123Z
├─ Page URL: /finance
├─ User ID: 507f1f77bcf86cd799439011
├─ User Name: John Doe
├─ User Email: john@example.com
├─ Subscription Check: ✓ SUBSCRIPTION FOUND
├─ Subscription ID: 507f1f77bcf86cd799439012
├─ Contract Length: 12 months
├─ Number of Users: 5
├─ Total Cost: ₦25,000,000
├─ Items Count: 8
├─ Subscription Status: pending
├─ Created At: 2025-12-10T15:20:30.000Z
├─ Subscribed Items:
│  1. Audit (₦5,000,000)
│  2. Finance (₦7,000,000)
│  3. HR (₦6,000,000)
│  4. Logistics (₦7,000,000)
└─ STATUS: ✓ ALLOWED - User has active subscription
*/

// WHAT EACH CHECK DOES:
// ====================

// checkSubscription:
// ✓ Checks if user is logged in
// ✓ Checks if they have ANY subscription in CustomPlan
// ✓ Logs all subscription details
// ❌ If no subscription → Redirect to /not-subscribed-yet

// checkPageAccess:
// ✓ Does everything checkSubscription does
// ✓ ALSO checks if specific page is in their items
// ✓ Logs which pages they have access to
// ❌ If page not found → Redirect to /add-subscription

// FIND PAGES BY SUBSCRIPTION:
// In your controller/route, access subscription data:

app.get('/finance', checkSubscription, (req, res) => {
  const subscription = req.userSubscription;
  
  // Get all pages they subscribed to
  const subscribedPages = subscription.items.map(item => item.name);
  console.log('User subscribed to:', subscribedPages);
  
  // Check specific page
  const hasAudit = subscription.items.some(item => 
    item.name.toLowerCase().includes('audit')
  );
  
  // Send to view
  res.render('finance', {
    subscription: subscription,
    subscribedPages: subscribedPages,
    hasAudit: hasAudit
  });
});
