// utils/logWorkerActivity.js
const Activity = require("../models/userActivity");

const logWorkerActivity = async ({
  req,
  worker,
  page,
  action,
}) => {
  try {
    await Activity.create({
      adminId: worker.adminId,
      workerId: worker._id,
      workerUsername: worker.username,
      role: worker.role,
      accessLevel: worker.accessLevel,
      page,
      action,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error("[ACTIVITY LOG ERROR]", err.message);
  }
};

module.exports = logWorkerActivity;
