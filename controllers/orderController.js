const Order = require("../models/Order");
const Driver = require("../models/Driver");
const User = require("../models/User");
const Company = require("../models/company"); // Assuming you might need company info
const mongoose = require("mongoose");

// Helper to get logged-in user ID (Admin or Worker's Admin)
const getUserId = (req) => {
    if (req.session.user) return req.session.user._id;
    if (req.session.worker) return req.session.worker.adminId;
    return null;
};



// ==========================================
// 1. ORDER MANAGEMENT (Admin/Worker Side)
// ==========================================

// GET /order - Render Order Management Page
exports.getOrdersPage = async (req, res) => {
    try {
        const now = new Date();

        let recipientId = null;
        let companyinfo = null;

        if (req.session.user) {
            // Admin logged in
            recipientId = req.session.user._id;
            companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
        } else if (req.session.worker) {
            // Worker logged in
            recipientId = req.session.worker.adminId;
            companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
        } else {
            return res.redirect("/login");
        }

        const userId = recipientId;

        // Fetch orders for this admin
        const orders = await Order.find({ recipientId: userId }).sort({ createdAt: -1 });

        // Fetch products for the "Create Order" form (assuming you have an Inventory model)
        // You might need to import Inventory model if you want to populate the product dropdown dynamically
        // For now, passing empty array or you can fetch it if Inventory model is available
        const Inventory = require("../models/inventory");
        const products = await Inventory.find({ recipientId: userId });

        res.render("dashboard/order", {
            user: req.session.user,
            worker: req.session.worker || null,
            companyinfo,
            orders,
            products
        });
    } catch (err) {
        console.error("Error loading orders page:", err);
        res.status(500).send("Server Error");
    }
};

// POST /api/auth/createOrder - Create a new Order
exports.createOrder = async (req, res) => {
    try {
        const now = new Date();

        let recipientId = null;
        let companyinfo = null;

        if (req.session.user) {
            // Admin logged in
            recipientId = req.session.user._id;
            companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
        } else if (req.session.worker) {
            // Worker logged in
            recipientId = req.session.worker.adminId;
            companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
        } else {
            return res.redirect("/login");
        }

        const userId = recipientId;

        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const {
            buyername,
            buyeremail,
            productpassword,
            expectedDelivery,
            items, // Array of { productId, productName, quantity, unitPrice }
            itemsCost,
            subtotal,
            grandTotal,
            notes,
            delivery // { type, price, location, ... }
        } = req.body;

        // Basic validation
        if (!buyername || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const newOrder = new Order({
            recipientId: userId,
            buyername,
            buyeremail,
            productpassword,
            expectedDelivery,
            items,
            itemsCost,
            subtotal,
            grandTotal,
            notes,
            delivery,
            status: "pending"
        });

        await newOrder.save();

        // TODO: Generate QR Code if needed and save it
        // const qrCode = await generateQRCode(newOrder._id);
        // newOrder.qrCode = qrCode;
        // await newOrder.save();

        res.status(201).json({ success: true, message: "Order created successfully", order: newOrder });
    } catch (err) {
        console.error("Error creating order:", err);
        res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

// GET /order/:id - View Single Order Details
exports.getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).send("Order not found");

        // Render a view or return JSON
        // For now, let's assume we render the same order page but maybe with a modal open or a specific detail page
        // Or just return JSON if it's for an API
        res.render("dashboard/order-view", { order }); // You might need to create this view or reuse logic
    } catch (err) {
        console.error("Error fetching order:", err);
        res.status(500).send("Server Error");
    }
};


// ==========================================
// 3. DRIVER DASHBOARD (Driver Side)
// ==========================================

// GET /driver-dash - Render Driver Dashboard
exports.getDriverDashboard = async (req, res) => {
    try {
        if (!req.session.driver) {
            return res.redirect("/driver/login"); // Assuming you have a driver login route
        }

        const driverId = req.session.driver.id;
        const driver = await Driver.findById(driverId);

        // Fetch "Available" orders (e.g., pending orders that need delivery)
        // In a real app, you might filter by location or assign specific orders
        // For now, let's fetch all "pending" orders that have a delivery type set
        const availableOrders = await Order.find({
            status: "pending",
            "delivery.type": { $in: ["motorcycle", "truck", "waybill"] } // Only delivery orders
        }).limit(10);

        // Fetch "My Active" orders (orders assigned to this driver)
        // We need to add a `driverId` field to the Order model to track assignment
        // For now, let's assume we just show available ones or we need to update schema

        // TODO: Add `driverId` to Order schema if not present. 
        // Checking Order.js... it doesn't have driverId. We should probably add it.
        // For now, I will assume we might filter by some other means or just show available.

        // Let's assume we show available orders for them to "Accept"

        res.render("dashboard/driverdash/dashboard", {
            driver,
            availableOrders
        });
    } catch (err) {
        console.error("Error loading driver dashboard:", err);
        res.status(500).send("Server Error");
    }
};

// POST /api/driver/toggle-online
exports.toggleOnline = async (req, res) => {
    try {
        if (!req.session.driver) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { isOnline, lat, lng } = req.body;
        const driver = await Driver.findById(req.session.driver.id);

        if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

        driver.isOnline = isOnline;
        if (lat && lng) {
            driver.location = { lat, lng, lastUpdated: new Date() };
        }

        await driver.save();
        res.json({ success: true, isOnline: driver.isOnline });
    } catch (err) {
        console.error("Error toggling online status:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// GET /api/driver/orders - Driver can pull available orders
exports.getAvailableOrders = async (req, res) => {
    console.log("🚚 [DRIVER SEARCH] Starting order search...");

    try {
        if (!req.session.driver) {
            console.warn("⛔ [DRIVER SEARCH] Unauthorized access attempt");

            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const driverDeliveryTypes = ["motorcycle", "truck", "waybill"];

        console.log("🔍 [DRIVER SEARCH] Looking for pending orders with types:", driverDeliveryTypes);

        const orders = await Order.find({
            status: "pending",
            "delivery.type": { $in: driverDeliveryTypes }
        })
            .sort({ createdAt: -1 })
            .limit(30);

        console.log(`✅ [DRIVER SEARCH] Found ${orders.length} orders`);

        return res.json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (err) {
        console.error("🔥 [DRIVER SEARCH ERROR] Something broke:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// POST /api/driver/accept-order - Driver accepts an order
exports.acceptOrder = async (req, res) => {
    try {
        if (!req.session.driver) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { orderId } = req.body;
        const driverId = req.session.driver.id;

        const driver = await Driver.findById(driverId);
        if (driver.currentOrderId) {
            return res.status(400).json({ success: false, message: "You already have an active order" });
        }

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        if (order.status !== "pending") {
            return res.status(400).json({ success: false, message: "Order already taken" });
        }

        // Assign driver
        order.status = "in_transit";
        // order.driverId = driverId; // Add this to Order schema if you want strict linking
        await order.save();

        driver.currentOrderId = order._id;
        await driver.save();

        res.json({ success: true, message: "Order accepted", order });
    } catch (err) {
        console.error("Error accepting order:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// POST /api/driver/update-status - Driver updates order status
exports.updateOrderStatus = async (req, res) => {
    try {
        if (!req.session.driver) return res.status(401).json({ success: false, message: "Unauthorized" });

        const { orderId, status } = req.body; // status: 'delivered', 'delayed', etc.
        const driverId = req.session.driver.id;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        order.status = status;
        if (status === 'delivered') {
            order.deliveryDate = new Date();

            // Free up the driver
            const driver = await Driver.findById(driverId);
            if (driver) {
                driver.currentOrderId = null;
                await driver.save();
            }
        }

        await order.save();

        res.json({ success: true, message: "Order status updated", order });
    } catch (err) {
        console.error("Error updating status:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
