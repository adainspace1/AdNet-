const CustomPlan = require('../models/CustomPlan');
const Subscription = require('../models/Subscription');
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

            // EXCEPTION: Allowed Emails (Bypass Subscription Check)
            const allowedEmails = ["musa@gmail.com"];
            if (req.session.user.email && allowedEmails.includes(req.session.user.email)) {
                console.log(
                    `[AUTH] ${now} | PAGE: ${url} | TYPE: USER | ALLOWED (EMAIL BYPASS) | email: ${req.session.user.email}`
                );
                req.recipientId = userId;
                req.isWorker = false;
                req.isBypass = true; // Optional flag for debugging
                return next();
            }

            console.log(
                `[AUTH] ${now} | PAGE: ${url} | TYPE: USER | CHECKING SUBSCRIPTION...`
            );

            // Check if user has any active subscriptions (new Subscription model)
            console.log(`[SUBSCRIPTION CHECK] Searching new Subscription model for userId: ${userId}`);
            const subscriptionDoc = await Subscription.findOne({ userId });
            console.log(`[SUBSCRIPTION CHECK] New Subscription model result: ${subscriptionDoc ? 'Found' : 'Not found'}`);

            const nowDate = new Date();
            let subscriptions = [];

            if (subscriptionDoc && subscriptionDoc.subscriptions) {
                subscriptions = subscriptionDoc.subscriptions.filter(sub =>
                    sub.status === 'active' && sub.endDate > nowDate
                );
                console.log(`[SUBSCRIPTION CHECK] Filtered active subscriptions: Found ${subscriptions.length} active subscriptions`);
                subscriptions.forEach((sub, index) => {
                    console.log(`  ${index + 1}. Feature: ${sub.feature}, Status: ${sub.status}, EndDate: ${sub.endDate}`);
                });
            } else {
                console.log(`[SUBSCRIPTION CHECK] No subscription document or subscriptions array found`);
            }

            let subscriptionType = 'new';
            let customPlanSubscription = null;

            // If no active subscriptions in new model, check legacy CustomPlan model
            if (!subscriptions || subscriptions.length === 0) {
                console.log(`[SUBSCRIPTION CHECK] No active subscriptions in new model, searching legacy CustomPlan model for userId: ${userId}`);
                customPlanSubscription = await CustomPlan.findOne({ userId });
                console.log(`[SUBSCRIPTION CHECK] Legacy CustomPlan model result: ${customPlanSubscription ? 'Found' : 'Not found'}`);
                if (customPlanSubscription) {
                    console.log(`  CustomPlan ID: ${customPlanSubscription._id}, Status: ${customPlanSubscription.status}, Contract: ${customPlanSubscription.contract} months, PlanType: ${customPlanSubscription.planType}`);
                    console.log(`  Items array exists: ${customPlanSubscription.items ? 'Yes' : 'No'}, Is array: ${Array.isArray(customPlanSubscription.items) ? 'Yes' : 'No'}`);
                }
                if (customPlanSubscription && customPlanSubscription.status !== 'cancelled' && customPlanSubscription.items && Array.isArray(customPlanSubscription.items)) {
                    console.log(`[SUBSCRIPTION CHECK] Mapping CustomPlan items to subscription format`);
                    // Convert CustomPlan items to subscription-like format for compatibility
                    subscriptions = customPlanSubscription.items.map(item => ({
                        module: item.name.toLowerCase().replace(/\s+/g, ''),
                        planType: customPlanSubscription.planType || 'custom',
                        endDate: new Date(customPlanSubscription.createdAt.getTime() + (customPlanSubscription.contract * 30 * 24 * 60 * 60 * 1000)), // Approximate months to date
                        _id: customPlanSubscription._id,
                        isLegacy: true
                    }));
                    subscriptionType = 'legacy';
                    console.log(`[SUBSCRIPTION CHECK] Mapped ${subscriptions.length} items from legacy CustomPlan`);
                    subscriptions.forEach((sub, index) => {
                        console.log(`  ${index + 1}. Module: ${sub.module}, EndDate: ${sub.endDate}, IsLegacy: ${sub.isLegacy}`);
                    });
                } else {
                    console.log(`[SUBSCRIPTION CHECK] Legacy CustomPlan not usable (cancelled, no items, or not array)`);
                }
            }

            console.log(`[SUBSCRIPTION CHECK] Final subscriptions array: ${subscriptions.length} items`);
            if (subscriptions.length === 0) {
                console.log(
                    `[AUTH] ${now} | PAGE: ${url} | TYPE: USER | BLOCKED - NO ACTIVE SUBSCRIPTIONS | userId: ${userId}`
                );
                return res.redirect(`/not-subscribed-yet?id=${userId}`);
            }

            // Extract the page/module name from URL
            const pageSegments = url.split('/').filter(s => s);
            const requestedPage = pageSegments[0] || 'home';
            console.log(`[ACCESS CHECK] Requested page: ${requestedPage}, Full URL: ${url}`);

            // ========== API ROUTES HANDLING ==========
            // If this is an API route, check if user has access to the parent module
            const isApiRoute = requestedPage === 'api' || url.startsWith('/api/');
            let hasPageAccess = false;
            console.log(`[ACCESS CHECK] Is API route: ${isApiRoute}`);

            if (isApiRoute) {
                // For API routes, extract the actual module from the API path
                const apiSegments = url.split('/').filter(s => s);
                const apiModule = apiSegments[1] || apiSegments[2] || 'dashboard';
                console.log(`[ACCESS CHECK] API module extracted: ${apiModule}`);

                // Always allowed API routes for any subscribed user (basic dashboard functionality)
                const alwaysAllowedApiRoutes = [
                    '/api/userActivities',
                    '/api/activities',
                    '/api/dashboard',
                    '/api/profile',
                    '/api/notifications',
                    '/api/settings',
                    '/api/subscriptions'
                ];

                // Check if this is an always allowed API route
                const isAlwaysAllowed = alwaysAllowedApiRoutes.some(route => url.startsWith(route));
                console.log(`[ACCESS CHECK] Is always allowed API route: ${isAlwaysAllowed}`);

                if (isAlwaysAllowed && subscriptions.length > 0) {
                    hasPageAccess = true;
                    console.log(`├─ API Route: ${url} - ALWAYS ALLOWED for subscribed users`);
                } else {
                    // Check if user has subscription for this module
                    console.log(`[ACCESS CHECK] Checking subscription for API module: ${apiModule}, Subscription type: ${subscriptionType}`);
                    if (subscriptionType === 'new') {
                        hasPageAccess = subscriptions.some(sub =>
                            sub.feature.toLowerCase() === apiModule.toLowerCase() ||
                            apiModule.toLowerCase().includes(sub.feature.toLowerCase()) ||
                            sub.feature.toLowerCase().includes(apiModule.toLowerCase())
                        );
                        console.log(`[ACCESS CHECK] New subscription check result: ${hasPageAccess}`);
                    } else {
                        // Legacy CustomPlan - check items
                        hasPageAccess = subscriptions.some(sub =>
                            sub.module.toLowerCase().includes(apiModule.toLowerCase()) ||
                            apiModule.toLowerCase().includes(sub.module.toLowerCase())
                        );
                        console.log(`[ACCESS CHECK] Legacy subscription check result: ${hasPageAccess}`);
                    }

                    console.log(`├─ API Route Detected: ${url}`);
                    console.log(`├─ API Module: ${apiModule}`);
                    console.log(`├─ Subscription Type: ${subscriptionType}`);
                }
            } else {
                // Regular page access check
                console.log(`[ACCESS CHECK] Regular page access check for: ${requestedPage}, Subscription type: ${subscriptionType}`);
                if (subscriptionType === 'new') {
                    hasPageAccess = subscriptions.some(sub =>
                        sub.feature.toLowerCase().includes(requestedPage.toLowerCase()) ||
                        requestedPage.toLowerCase().includes(sub.feature.toLowerCase())
                    );
                    console.log(`[ACCESS CHECK] New subscription page check result: ${hasPageAccess}`);
                } else {
                    // Legacy CustomPlan - check items
                    hasPageAccess = subscriptions.some(sub =>
                        sub.module.toLowerCase().includes(requestedPage.toLowerCase()) ||
                        requestedPage.toLowerCase().includes(sub.module.toLowerCase())
                    );
                    console.log(`[ACCESS CHECK] Legacy subscription page check result: ${hasPageAccess}`);
                }
            }

            // Log detailed subscription info
            console.log(`\n[AUTH SUBSCRIPTION CHECK] ${now}`);
            console.log(`├─ Page Requested: ${requestedPage}`);
            console.log(`├─ Full URL: ${url}`);
            console.log(`├─ Route Type: ${isApiRoute ? 'API Route' : 'Page Route'}`);
            console.log(`├─ User ID: ${userId}`);
            console.log(`├─ User Name: ${req.session.user.name || 'Unknown'}`);
            console.log(`├─ User Email: ${req.session.user.email || 'Unknown'}`);
            console.log(`├─ Subscription Type: ${subscriptionType}`);

            if (subscriptionType === 'new') {
                console.log(`├─ Active Subscriptions: ${subscriptions.length}`);
                subscriptions.forEach((sub, index) => {
                    console.log(`│  ${index + 1}. ${sub.feature} - Expires: ${sub.endDate.toDateString()}`);
                });
            } else {
                console.log(`├─ Legacy CustomPlan ID: ${customPlanSubscription._id}`);
                console.log(`├─ Contract Length: ${customPlanSubscription.contract} months`);
                console.log(`├─ Plan Type: ${customPlanSubscription.planType}`);
                console.log(`├─ Subscribed Items: ${subscriptions.length}`);
                subscriptions.forEach((sub, index) => {
                    console.log(`│  ${index + 1}. ${sub.module} - Legacy Plan`);
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
            req.subscriptionType = subscriptionType;
            if (subscriptionType === 'new') {
                req.userSubscriptions = subscriptions;
            } else {
                req.userSubscription = customPlanSubscription;
                req.userSubscriptions = subscriptions; // Also provide the mapped format
            }
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
