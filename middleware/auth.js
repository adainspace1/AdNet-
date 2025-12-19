const CustomPlan = require('../models/CustomPlan');
const logWorkerActivity = require("../utils/logWorkerActivity");


const ensureAuthenticated = async (req, res, next) => {
    try {
        const url = req.originalUrl || '';
        const urlLower = url.toLowerCase();
        const now = new Date().toISOString();

        // Case 1: Superadmin/Admin (full access) - TYPE: USER
        if (req.session && req.session.user) {
            const userId = req.session.user._id;
            
            // EXCEPTION: Dashboard and Admin pages are accessible without subscription check
            if (urlLower === '/dashboard' || urlLower.startsWith('/dashboard?') || 
                urlLower === '/admin' || urlLower.startsWith('/admin/') || urlLower.startsWith('/admin?')) {
                console.log(
                    `[AUTH] ${now} | PAGE: ${url} | TYPE: USER | ALLOWED (ADMIN AREA - NO SUB REQUIRED) | userId: ${userId}`
                );
                req.recipientId = userId;
                req.isWorker = false;
                return next();
            }
            
            console.log(
                `[AUTH] ${now} | PAGE: ${url} | TYPE: USER | CHECKING SUBSCRIPTION...`
            );

            // Check subscription for this user
            const subscription = await CustomPlan.findOne({ userId });

            if (!subscription) {
                console.log(
                    `[AUTH] ${now} | PAGE: ${url} | TYPE: USER | BLOCKED - NO SUBSCRIPTION | userId: ${userId}`
                );
                 return res.redirect(`/not-subscribed-yet?id=${userId}`);
            }

            // Extract the page/module name from URL
            const pageSegments = url.split('/').filter(s => s);
            const requestedPage = pageSegments[0] || 'home';

            // ========== API ROUTES HANDLING ==========
            // If this is an API route, check if user has access to the parent module
            const isApiRoute = requestedPage === 'api' || url.startsWith('/api/');
            let hasPageAccess = false;

            if (isApiRoute) {
                // For API routes, extract the actual module from the API path
                // e.g., /api/userActivities/activities -> check for 'activities' or 'user' access
                const apiSegments = url.split('/').filter(s => s);
                const apiModule = apiSegments[1] || apiSegments[2] || 'dashboard'; // fallback to dashboard
                
                // Always allowed API routes for any subscribed user (basic dashboard functionality)
                const alwaysAllowedApiRoutes = [
                    '/api/userActivities',
                    '/api/activities', 
                    '/api/dashboard',
                    '/api/profile',
                    '/api/notifications',
                    '/api/settings'
                ];

                // Check if this is an always allowed API route
                const isAlwaysAllowed = alwaysAllowedApiRoutes.some(route => url.startsWith(route));
                
                if (isAlwaysAllowed && subscription.items.length > 0) {
                    hasPageAccess = true;
                    console.log(`├─ API Route: ${url} - ALWAYS ALLOWED for subscribed users`);
                } else {
                    // Common API route mappings to subscription modules
                    const apiModuleMapping = {
                        'userActivities': ['dashboard', 'activities', 'user'],
                        'admin': ['dashboard', 'admin'],
                        'workers': ['dashboard', 'admin', 'hr'],
                        'companies': ['dashboard', 'admin'],
                        'kpi': ['dashboard', 'admin'],
                        'audits': ['audit', 'dashboard'],
                        'taxes': ['tax', 'taxation', 'dashboard'],
                        'billing': ['finance', 'billing', 'dashboard'],
                        'logistics': ['logistics', 'dashboard'],
                        'activities': ['dashboard', 'activities'],
                        'expenses': ['finance', 'expenses'],
                        'inventory': ['inventory'],
                        'sales': ['sales'],
                        'production': ['production']
                    };

                    const possibleModules = apiModuleMapping[apiModule] || [apiModule, 'dashboard'];
                    
                    // Check if user has access to any of the possible modules
                    hasPageAccess = subscription.items.some(item => 
                        possibleModules.some(module => 
                            item.name.toLowerCase().includes(module.toLowerCase()) ||
                            module.toLowerCase().includes(item.name.toLowerCase())
                        )
                    );

                    console.log(`├─ API Route Detected: ${url}`);
                    console.log(`├─ API Module: ${apiModule}`);
                    console.log(`├─ Checking Modules: ${possibleModules.join(', ')}`);
                }
            } else {
                // Regular page access check
                hasPageAccess = subscription.items.some(item => 
                  item.name.toLowerCase().includes(requestedPage.toLowerCase()) ||
                  requestedPage.toLowerCase().includes(item.name.toLowerCase())
                );
            }

            // Log detailed subscription info
            console.log(`\n[AUTH SUBSCRIPTION CHECK] ${now}`);
            console.log(`├─ Page Requested: ${requestedPage}`);
            console.log(`├─ Full URL: ${url}`);
            console.log(`├─ Route Type: ${isApiRoute ? 'API Route' : 'Page Route'}`);
            console.log(`├─ User ID: ${userId}`);
            console.log(`├─ User Name: ${req.session.user.name || 'Unknown'}`);
            console.log(`├─ User Email: ${req.session.user.email || 'Unknown'}`);
            console.log(`├─ Subscription ID: ${subscription._id}`);
            console.log(`├─ Contract Length: ${subscription.contract} months`);
            console.log(`├─ Number of Users: ${subscription.users}`);
            console.log(`├─ Total Cost: ₦${subscription.total}`);
            console.log(`├─ Subscription Status: ${subscription.status}`);
            console.log(`├─ Created: ${subscription.createdAt}`);
            console.log(`├─ Subscribed Items: ${subscription.items.length}`);
            if (subscription.items.length > 0) {
              subscription.items.forEach((item, index) => {
                const isMatch = item.name.toLowerCase().includes(requestedPage.toLowerCase()) || requestedPage.toLowerCase().includes(item.name.toLowerCase());
                console.log(`│  ${index + 1}. ${item.name} (₦${item.total}) ${isMatch ? '✓ MATCH' : ''}`);
              });
            }
            
            // If page not in subscription, redirect to add-subscription
            if (!hasPageAccess) {
              console.log(`├─ Page Access: ❌ NOT SUBSCRIBED`);
              console.log(`└─ STATUS: DENIED - Redirecting to /add-subscription\n`);
              return res.redirect(`/add-subscription?page=${requestedPage}&id=${userId}`);
            }

            console.log(`├─ Page Access: ✓ SUBSCRIBED`);
            console.log(`└─ STATUS: ✓ ALLOWED\n`);

            req.recipientId = userId;
            req.isWorker = false;
            req.userSubscription = subscription;
            return next();
        }

        // Case 2: Worker (role + accessLevel check)
        if (req.session && req.session.worker) {
            const worker = req.session.worker;
            const { _id: workerId, adminId, username } = worker;

            // ✅ normalized role from session
            const role = worker.role;
            const accessLevel = worker.accessLevel;


            // CHECK: Workers cannot access /admin
            if (urlLower === '/admin' || urlLower.startsWith('/admin/') || urlLower.startsWith('/admin?')) {

                    await logWorkerActivity({
                        req,
                        worker,
                        page: url,
                        action: "BLOCKED",
                    });

                    console.warn(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | BLOCKED (admin area) | workerId: ${workerId} | adminId: ${adminId} | role: ${role}`);
                    return res.redirect("/bastard");
                }


            // role → allowed paths
            const roleAccess = {
                inventory: {
                    basic: ["/inventory", "/api/inventory"],
                    max: ["/inventory", "/production", "/inventory/tracking", "/inventory/history", "/api/inventory", "/api/production"],
                },
                sales: {
                    basic: ["/sales", "/api/sales"],
                    max: ["/sales", "/sales/reports", "/salehistory", "/api/sales", "/api/reports"],
                },
                production: {
                    basic: ["/production", "/api/production"],
                    max: ["/production", "/production/logs", "/production/history", "/api/production"],
                },
                finance: {
                    basic: ["/expenses", "/api/expenses"],
                    max: ["/expenses", "/expenses/admin", "/viewallexpenses", "/api/expenses", "/api/finance"],
                },
                hr: {
                    basic: ["/hr", "/api/hr"],
                    max: ["/hr", "/hr/reports", "/hr/history", "/api/hr", "/api/workers"],
                },
                custom: {
                    basic: [],
                    max: [],
                },
            };

            // role → base path scope (worker admin-level must stay within scope)
            const roleBasePath = {
                inventory: "/inventory",
                sales: "/sales",
                production: "/production",
                finance: "/expenses",
                hr: "/hr",
                custom: "",
            };

            const config = roleAccess[role] || roleAccess["custom"];
            const basePath = roleBasePath[role] || "";

            // Attach for downstream
            req.recipientId = adminId;
            req.isWorker = true;

            // Role missing
            if (!config) {
                console.warn(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | BLOCKED (unknown role) | workerId: ${workerId} | role: ${role}`);
                return res.redirect("/bastard");
            }

            // Worker with admin-level: allow only within their role's base path
            if (accessLevel === "admin") {
                if (basePath && urlLower.startsWith(basePath)) {

                    await logWorkerActivity({
                        req,
                        worker,
                        page: url,
                        action: "ALLOWED",
                    });

                    console.log(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | ALLOWED (role-admin) | workerId: ${workerId} | adminId: ${adminId} | role: ${role} | accessLevel: ${accessLevel}`);
                    return next();
                } else {
                    await logWorkerActivity({
                        req,
                        worker,
                        page: url,
                        action: "BLOCKED",
                    });

                    console.warn(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | BLOCKED (outside role scope) | workerId: ${workerId} | adminId: ${adminId} | role: ${role} | accessLevel: ${accessLevel}`);
                    return res.redirect("/bastard");

                }
            }

            // Basic/Max check
            const allowedPaths = config[accessLevel];
            if (allowedPaths && allowedPaths.some((path) => urlLower.startsWith(path))) {

                await logWorkerActivity({
                    req,
                    worker,
                    page: url,
                    action: "ALLOWED",
                });

                console.log(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | ALLOWED | workerId: ${workerId} | adminId: ${adminId} | role: ${role} | accessLevel: ${accessLevel}`);
                return next();
            }


            await logWorkerActivity({
                req,
                worker,
                page: url,
                action: "BLOCKED",
            });

            console.warn(`[AUTH] ${now} | PAGE: ${url} | TYPE: WORKER | BLOCKED (no permission) | workerId: ${workerId} | adminId: ${adminId} | role: ${role} | accessLevel: ${accessLevel}`);
            return res.redirect("/bastard");

        }

        // Nobody logged in → redirect accordingly
        const attemptedUrl = req.originalUrl;
        console.log(`[AUTH] ${now} | PAGE: ${attemptedUrl} | TYPE: GUEST | REDIRECT`);

        if (req.session?.lastLoginOrigin === "vendor") {
            // redirect vendor to vendorAuth
            return res.redirect(`/vendorAuth?redirect=${encodeURIComponent(attemptedUrl)}`);
        } else if (attemptedUrl && attemptedUrl.startsWith("/employee")) {
            // worker redirect
            return res.redirect(`/employee/repons/auth/login?redirect=${encodeURIComponent(attemptedUrl)}`);
        } else {
            // default admin redirect
            return res.redirect(`/login?redirect=${encodeURIComponent(attemptedUrl)}`);
        }

    } catch (err) {
        console.error("Error in ensureAuthenticated middleware:", err);
        res.status(500).send("Server error");
    }
};

const ensureWorker = (req, res, next) => {
    if (req.session && req.session.worker) {
        return next();
    }
    res.redirect("/worker/login"); // redirect to login if not logged in
};

module.exports = { ensureAuthenticated, ensureWorker };
