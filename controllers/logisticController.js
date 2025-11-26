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
// 2. LOGISTICS DASHBOARD (Admin/Worker Side)
// ==========================================

exports.getLogisticsPage = async (req, res) => {
    try {
        let recipientId = null;
        let companyinfo = null;

        if (req.session.user) {
            recipientId = req.session.user._id;
            companyinfo = await Company.findOne({ reciepientId: recipientId });
        } else if (req.session.worker) {
            recipientId = req.session.worker.adminId;
            companyinfo = await Company.findOne({ reciepientId: recipientId });
        } else {
            return res.redirect("/login");
        }

        // Fetch drivers that are Approved
        const drivers = await Driver.find(
            { status: "Pending" },
            "fullName profilePicture vehiclePlate isOnline location"
        );

        // Fetch active orders
        const activeOrders = await Order.find(
            { recipientId, status: { $in: ["pending", "in_transit", "delivered"] } },
            "status delivery buyername"
        ).sort({ createdAt: -1 });

        res.render("dashboard/wisdom/logistics", {
            user: req.session.user,
            worker: req.session.worker || null,
            companyinfo,
            orders: activeOrders,
            drivers
        });

    } catch (err) {
        console.error("Error loading logistics page:", err);
        res.status(500).send("Server Error");
    }
};

