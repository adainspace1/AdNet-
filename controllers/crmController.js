const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Company = require("../models/company");

exports.getCRMDashboard = async (req, res) => {
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


        // Fetch Stats
        const totalLeads = await Lead.countDocuments({});
        const qualifiedLeads = await Lead.countDocuments({ status: 'Qualified' });
        const activeProposals = await Deal.countDocuments({ dealStatus: 'Proposal' });
        const negotiationDeals = await Deal.countDocuments({ dealStatus: 'Negotiation' });

        // Calculate Won Deals Value (YTD)
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const wonDeals = await Deal.find({
            dealStatus: 'Won',
            closeDate: { $gte: startOfYear }
        });
        const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.dealValue || 0), 0);

        // Fetch Pipeline Data (Deals by Stage)
        const pipeline = {
            newLeads: await Deal.find({ dealStatus: 'New Lead' }).limit(5).sort('-createdAt'),
            qualification: await Deal.find({ dealStatus: 'Qualification' }).limit(5).sort('-createdAt'),
            proposal: await Deal.find({ dealStatus: 'Proposal' }).limit(5).sort('-createdAt'),
            negotiation: await Deal.find({ dealStatus: 'Negotiation' }).limit(5).sort('-createdAt'),
        };

        // Fetch Recent Leads
        const recentLeads = await Lead.find({}).sort('-createdAt').limit(5);

        // Fetch Recent Activities
        const recentActivities = await Activity.find({})
            .sort('-createdAt')
            .limit(5)
            .populate('performedBy', 'name'); // Assuming User model has 'name'

        res.render('dashboard/wisdom/CRM', {
            user: req.session.user,
            worker: req.session.worker || null,
            companyinfo,
            stats: {
                totalLeads,
                qualifiedLeads,
                activeProposals,
                negotiationDeals,
                wonValue
            },
            pipeline,
            recentLeads,
            recentActivities
        });

    } catch (err) {
        console.error('CRM Dashboard Error:', err);
        res.status(500).send('Server Error');
    }
};

// Get logged-in user ID (admin or worker)
function getUserId(req) {
  if (req.session.user) return req.session.user._id;
  if (req.session.worker) return req.session.worker.adminId;
  return null;
}

exports.createLead = async (req, res) => {
  try {

    console.log("all", req.body)
    const userId = getUserId(req);
    if (!userId) return res.redirect("/login");

    const newLead = new Lead({
      ...req.body,
      createdBy: userId
    });

    await newLead.save();
    res.redirect("/crm");
  } catch (err) {
    console.error("Create Lead Error:", err);
    res.status(500).send("Error creating lead");
  }
};

exports.createDeal = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.redirect("/login");

    const newDeal = new Deal({
      ...req.body,
      recipientId: userId
    });

    await newDeal.save();
    res.redirect("/crm");
  } catch (err) {
    console.error("Create Deal Error:", err);
    res.status(500).send("Error creating deal");
  }
};

exports.createActivity = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.redirect("/login");

    const newActivity = new Activity({
      ...req.body,
      performedBy: userId
    });

    await newActivity.save();
    res.redirect("/crm");
  } catch (err) {
    console.error("Create Activity Error:", err);
    res.status(500).send("Error creating activity");
  }
};
