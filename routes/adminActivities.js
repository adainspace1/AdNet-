const express = require("express");
const router = express.Router();
const Activity = require("../models/userActivity");
const { ensureAuthenticated } = require("../middleware/auth");

// Admin fetch recent worker activities
router.get("/activities", ensureAuthenticated, async (req, res) => {
  try {
    // only USER (admin) should hit this
    if (req.isWorker) {
      return res.status(403).json({ success: false });
    }

    const adminId = req.session.user._id;

    const activities = await Activity.find({ adminId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      activities,
    });
  } catch (err) {
    console.error("Fetch activities error:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
