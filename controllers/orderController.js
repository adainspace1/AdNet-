const Order = require("../models/Order");
const Driver = require("../models/Driver");
const User = require("../models/User");
const Company = require("../models/company"); // Assuming you might need company info
const mongoose = require("mongoose");
const Inventory = require('../models/inventory');

const QRCode = require('qrcode');
const cloudinary = require("../cloudinary");
const streamifier = require("streamifier");

const handleImageUpload = (file) => {
    return new Promise((resolve, reject) => {
        const isPDF = file.mimetype === "application/pdf";
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: isPDF ? "raw" : "auto",
                folder: "Adnet",
            },
            (error, result) => {
                if (error) {
                    reject(new Error("Error uploading to Cloudinary: " + error.message));
                } else {
                    resolve(result.secure_url);
                }
            }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
    });
};

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



        // Get orders for this user/worker
        const allOrders = await Order.find({ recipientId })
            .populate("recipientId")
            .lean();

        // Separate orders by status
        const inTransitOrders = allOrders.filter(order => order.status === 'in_transit');
        const deliveredOrders = allOrders.filter(order => order.status === 'delivered');




        // KPI CALCULATIONS
        const totalOrders = allOrders.length;

        // Delivered on time (assuming you track deliveryDate & expectedDate)
        const onTimeOrders = allOrders.filter(order =>
            order.status === "delivered" && order.deliveredOnTime === true
        ).length;

        // In-transit
        const inTransitCount = inTransitOrders.length;

        // Delayed (any delivered but NOT on time)
        const delayedOrders = allOrders.filter(order =>
            order.status === "delivered" && order.deliveredOnTime === false
        ).length;



        res.render("dashboard/order", {
            user: req.session.user,
            worker: req.session.worker || null,
            companyinfo,
            inTransitOrders,
            deliveredOrders,
            orders,
            products,
            totalOrders,
            onTimeOrders,
            inTransitCount,
            delayedOrders,

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
            delivery, // { type, price, location, ... }
            refNumber
        } = req.body;

        // Upload proof of payment if exists
        let proofOfPaymentUrls = [];
        if (req.files && req.files.proofOfPayment) {
            const uploadPromises = req.files.proofOfPayment.map(file => handleImageUpload(file));
            proofOfPaymentUrls = await Promise.all(uploadPromises);
        }

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
            proofOfPayment: proofOfPaymentUrls,
            refNumber,
            status: "pending",
            confirm: true
        });

        await newOrder.save();

        console.log("Order created:", newOrder);

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
            confirm: true,  // <-- only show confirmed orders
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
        if (!req.session.driver) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { orderId } = req.body;
        const driverId = req.session.driver.id;

        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver not found" });
        }

        // Prevent taking multiple active orders
        if (driver.currentOrderId) {
            return res.status(400).json({ success: false, message: "You already have an active order" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Only pending orders can be accepted
        if (order.status !== "pending") {
            return res.status(400).json({ success: false, message: "Order already taken" });
        }

        // 🔥 Assign driver + Save driver info into order.delivery
        order.status = "in_transit";

        order.delivery = {
            type: driver.vehicleMake?.toLowerCase().includes("bike") ? "motorcycle" : "truck",
            driverId: driver._id,
            drivername: driver.fullName,
            driverPhone: driver.phone,
            vehicleNumber: driver.vehiclePlate,
            vehicleMake: driver.vehicleMake,
            vehicleModel: driver.vehicleModel,
            vehicleColor: driver.vehicleColor,
            price: order.delivery?.price || 0
        };

        await order.save();

        // Update driver status
        driver.currentOrderId = order._id;
        await driver.save();

        res.json({
            success: true,
            message: "Order accepted successfully",
            order
        });

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











exports.searchCompanies = async (req, res) => {
    try {
        const query = req.query.q || "";

        // Find companies
        const companies = await Company.find({
            companyName: { $regex: query, $options: "i" }
        })
            .select("companyName reciepientId _id")
            .limit(20)
            .lean();

        const result = companies.map(c => ({
            id: c._id,
            name: c.companyName,
            reciepientId: c.reciepientId
        }));

        return res.json(result);

    } catch (err) {
        console.error("Company search error:", err);
        return res.status(500).json([]);
    }
};




exports.usercreateOrder = async (req, res) => {
    console.log('Creating order with data:', req.body);
    try {
        const {
            recipientId,
            buyername,
            buyeremail,
            expectedDelivery,
            productpassword,
            items,
            itemsCost,
            subtotal,
            grandTotal,
            notes,
            delivery // <--- new
        } = req.body;


        if (!recipientId) {
            return res.status(400).json({ message: 'Recipient is required' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required' });
        }



        // Create a temporary ObjectId so we can embed the correct link
        const tempOrderId = new mongoose.Types.ObjectId();
        const qrFinalUrl = `https://adnet.vercel.app/order-placed/${encodeURIComponent(buyername)}/${tempOrderId}/`;

        // Generate QR code base64 string
        const qrCodeDataUrl = await QRCode.toDataURL(qrFinalUrl);

        // Create the order with QR code in DB
        const newOrder = new Order({
            _id: tempOrderId,
            recipientId,
            buyername,
            buyeremail,
            productpassword,
            expectedDelivery,
            items,
            itemsCost,
            subtotal,
            grandTotal,
            notes,
            delivery, // save delivery object
            qrCode: qrCodeDataUrl,
            confirm: false
        });


        await newOrder.save();
        console.log('New order created:', newOrder);

        // Build QR link
        const qrUrl = `https://adnet.vercel.app/order-placed/${encodeURIComponent(buyername)}/${newOrder?._id || 'temp'}/`;

        return res.json({ success: true, redirect: "/user/success-Order" });


    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error creating order' });
    }
};










exports.confirmOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const adminId = req.session.user?._id;

        if (!adminId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Find the order and make sure the admin owns it
        const order = await Order.findOne({ _id: orderId, recipientId: adminId });
        if (!order) return res.status(404).json({ error: "Order not found or not yours" });

        // Optional: Check stock before confirming
        for (const item of order.items) {
            const product = await Inventory.findById(item.productId);
            if (!product) return res.status(404).json({ error: `Product ${item.productName} not found` });
            if (product.currentquantity < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for ${item.productName}. Available: ${product.currentquantity}, Ordered: ${item.quantity}`
                });
            }
        }

        // Deduct stock
        for (const item of order.items) {
            const product = await Inventory.findById(item.productId);
            product.currentquantity -= item.quantity;
            await product.save();
        }

        // Update only the confirm field without triggering full validation
        await Order.findByIdAndUpdate(orderId, { confirm: true });

        res.redirect("/order")

    } catch (err) {
        console.error("Error confirming order:", err);
        res.status(500).json({ error: "Server error" });
    }
};

