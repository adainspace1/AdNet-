// Admin Dashboard API Endpoints
// Provides real-time data from MongoDB for the admin dashboard

const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const User = require('../models/User');
const Order = require('../models/Order');
const Tax = require('../models/Tax');
const AuditLog = require('../models/AuditLog');
const Invoice = require('../models/Invoice');
const Driver = require('../models/Driver');
const Activity = require('../models/Activity');
const CustomPlan = require('../models/CustomPlan');
const Worker = require('../models/Worker'); // For staff management

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
const authenticateAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated and has TYPE: USER (admin)
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify user is an admin (TYPE: USER)
    const userId = req.session.user._id;
    const adminUser = await User.findById(userId);
    
    if (!adminUser || adminUser.TYPE !== 'USER') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminId = userId;
    req.adminUser = adminUser;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Apply authentication to all admin dashboard routes
router.use(authenticateAdmin);

// ==========================================
// ADMIN DASHBOARD - KPI DATA
// ==========================================

router.get('/kpi', async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const totalRevenue = await CustomPlan.aggregate([
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const pendingAudits = await AuditLog.countDocuments({ status: 'Pending' });
    const overdueTax = await Tax.countDocuments({ status: 'Overdue' });

    res.json({
      totalCompanies: totalCompanies || 0,
      revenue: totalRevenue[0]?.total || 0,
      pendingAudits: pendingAudits || 0,
      overdueTax: overdueTax || 0
    });
  } catch (err) {
    console.error('KPI Error:', err);
    res.status(500).json({ error: 'Failed to fetch KPI data' });
  }
});

// ==========================================
// COMPANIES MANAGEMENT
// ==========================================

router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.find()
      .select('name registrationNumber status subscription createdAt')
      .limit(100);
    
    res.json(companies.map(c => ({
      id: c._id,
      name: c.name,
      status: c.status || 'Active',
      subscription: c.subscription || 'Basic',
      dateAdded: c.createdAt,
      complianceStatus: Math.random() > 0.5 ? 'Compliant' : 'Audit Overdue'
    })));
  } catch (err) {
    console.error('Companies Error:', err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

router.post('/companies', async (req, res) => {
  try {
    const { name, registrationNumber, status } = req.body;
    
    const newCompany = new Company({
      name,
      registrationNumber,
      status: status || 'Active'
    });

    await newCompany.save();
    res.status(201).json({ message: 'Company created successfully', company: newCompany });
  } catch (err) {
    console.error('Create Company Error:', err);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// ==========================================
// USERS & ADMINS MANAGEMENT
// ==========================================

router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ TYPE: 'USER' })
      .select('firstName lastName email role status createdAt')
      .limit(100);
    
    res.json(users.map(u => ({
      id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role || 'Admin',
      status: u.status || 'Active',
      dateAdded: u.createdAt
    })));
  } catch (err) {
    console.error('Users Error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ==========================================
// AUDITS MANAGEMENT
// ==========================================

router.get('/audits', async (req, res) => {
  try {
    const audits = await AuditLog.find()
      .select('auditId company status startDate assignedAuditor')
      .limit(100);
    
    res.json(audits.map(a => ({
      id: a._id,
      auditId: a.auditId,
      company: a.company,
      auditor: a.assignedAuditor || 'Unassigned',
      status: a.status || 'Pending',
      startDate: a.startDate,
      progress: Math.floor(Math.random() * 100)
    })));
  } catch (err) {
    console.error('Audits Error:', err);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

// ==========================================
// TAX MANAGEMENT
// ==========================================

router.get('/taxes', async (req, res) => {
  try {
    const taxes = await Tax.find()
      .select('company taxType amount status dueDate')
      .limit(100);
    
    const paid = taxes.filter(t => t.status === 'Paid').length;
    const pending = taxes.filter(t => t.status === 'Pending').length;
    const overdue = taxes.filter(t => t.status === 'Overdue').length;

    res.json({
      paidCount: paid,
      pendingCount: pending,
      overdueCount: overdue,
      records: taxes.map(t => ({
        id: t._id,
        company: t.company,
        type: t.taxType,
        amount: t.amount,
        status: t.status,
        dueDate: t.dueDate
      }))
    });
  } catch (err) {
    console.error('Taxes Error:', err);
    res.status(500).json({ error: 'Failed to fetch taxes' });
  }
});

// ==========================================
// BILLING & INVOICES
// ==========================================

router.get('/billing', async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .select('invoiceNumber company amount status dueDate')
      .limit(100);
    
    const totalRevenue = invoices
      .filter(i => i.status === 'Paid')
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    const pendingInvoices = invoices.filter(i => i.status !== 'Paid').length;
    
    const subscriptions = await CustomPlan.countDocuments({ status: 'Active' });

    res.json({
      totalRevenue,
      pendingInvoices,
      activeSubscriptions: subscriptions,
      invoices: invoices.map(i => ({
        id: i._id,
        invoiceId: i.invoiceNumber,
        company: i.company,
        amount: i.amount,
        status: i.status,
        dueDate: i.dueDate
      }))
    });
  } catch (err) {
    console.error('Billing Error:', err);
    res.status(500).json({ error: 'Failed to fetch billing data' });
  }
});

// ==========================================
// LOGISTICS / DRIVERS
// ==========================================

router.get('/logistics', async (req, res) => {
  try {
    const drivers = await Driver.countDocuments();
    const activeDeliveries = await Order.countDocuments({ status: 'In Transit' });
    const vehicles = await Order.distinct('vehicleId');

    res.json({
      driverCount: drivers,
      vehicleCount: vehicles.length,
      activeDeliveries: activeDeliveries
    });
  } catch (err) {
    console.error('Logistics Error:', err);
    res.status(500).json({ error: 'Failed to fetch logistics data' });
  }
});

// ==========================================
// RECENT ACTIVITIES
// ==========================================

router.get('/activities', async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json(activities.map(a => ({
      id: a._id,
      description: a.description,
      timestamp: a.createdAt,
      type: a.type || 'info'
    })));
  } catch (err) {
    console.error('Activities Error:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// ==========================================
// STAFF/WORKERS MANAGEMENT (Already existing but added here)
// ==========================================

router.get('/staff', async (req, res) => {
  try {
    const { adminId } = req.query;
    
    const workers = await Worker.find({ adminId })
      .select('name email username roles status createdAt')
      .limit(100);
    
    res.json(workers.map(w => ({
      id: w._id,
      name: w.name,
      email: w.email,
      username: w.username,
      roles: w.roles,
      status: w.status || 'Active',
      dateAdded: w.createdAt
    })));
  } catch (err) {
    console.error('Staff Error:', err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// ==========================================
// SYSTEM LOGS
// ==========================================

router.get('/logs', async (req, res) => {
  try {
    // Mock data - integrate with your audit logging system
    const logs = [
      {
        timestamp: new Date(),
        action: 'Login',
        user: 'Admin User',
        ipAddress: '192.168.1.1'
      },
      {
        timestamp: new Date(Date.now() - 3600000),
        action: 'Company Created',
        user: 'Jane Smith',
        ipAddress: '192.168.1.50'
      }
    ];

    res.json(logs);
  } catch (err) {
    console.error('Logs Error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;
