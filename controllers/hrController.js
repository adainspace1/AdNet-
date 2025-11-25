const Employee = require("../models/Employee");
const Worker = require("../models/Worker");
const Contract = require("../models/Contract");
const Payroll = require("../models/Payroll");
const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");
const Company = require("../models/company");
const bcrypt = require("bcryptjs");

// Helper to get logged-in user or worker
function getUserId(req) {
    if (req.session.user) return req.session.user._id;        // Admin
    if (req.session.worker) return req.session.worker.adminId; // Worker → use admin
    return null;
}

// --------------------- DASHBOARD ---------------------
exports.getHRDashboard = async (req, res) => {
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


        // Fetch Employees (HR Records) created by this admin
        const employees = await Employee.find({ createdBy: userId }).sort({ createdAt: -1 });

        // Fetch Workers (System Users) linked to this admin
        const workers = await Worker.find({ adminId: userId }).sort({ createdAt: -1 });



        const stats = {
            totalEmployees: employees.length,
            activeContracts: await Contract.countDocuments({
                employee: { $in: employees.map(e => e._id) },
                endDate: { $gt: new Date() }
            }),
            payrollRuns: await Payroll.countDocuments({
                employee: { $in: employees.map(e => e._id) }
            }),
            pendingLeaves: await LeaveRequest.countDocuments({
                employee: { $in: employees.map(e => e._id) },
                status: 'Pending'
            })
        };

        res.render("dashboard/wisdom/HR", {
            user: req.session.user,
            worker: req.session.worker || null,
            companyinfo,
            employees,
            workers,
            stats,
            currentTab: 'dashboard'
        });
    } catch (err) {
        console.error("Error loading HR dashboard:", err);
        res.status(500).send("Server error");
    }
};

// --------------------- CREATE EMPLOYEE (HR Record) ---------------------
exports.createEmployee = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.redirect("/login");

        const { firstName, lastName, email, phone, role, department } = req.body;

        // Check if employee already exists
        const existingEmployee = await Employee.findOne({ email, createdBy: userId });
        if (existingEmployee) {
            return res.status(400).send("Employee with this email already exists");
        }

        const newEmployee = new Employee({
            firstName,
            lastName,
            email,
            phone,
            role,
            department, // Ensure schema has this or remove if not
            createdBy: userId
        });

        await newEmployee.save();
        res.redirect("/HR");
    } catch (err) {
        console.error("Error creating employee:", err);
        res.status(500).send("Error creating employee");
    }
};

// --------------------- CREATE WORKER (System User) ---------------------
exports.createWorker = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.redirect("/login");

        const { name, email, role, password } = req.body;

        // Check if worker already exists
        const existingWorker = await Worker.findOne({ email });
        if (existingWorker) {
            return res.status(400).send("System user with this email already exists");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate username (simple logic)
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

        const newWorker = new Worker({
            adminId: userId,
            name,
            email,
            username,
            password: hashedPassword,
            roles: [{ role: role, accessLevel: 'basic' }]
        });

        await newWorker.save();
        res.redirect("/HR");
    } catch (err) {
        console.error("Error creating worker:", err);
        res.status(500).send("Error creating system user");
    }
};

// --------------------- CREATE CONTRACT ---------------------
exports.createContract = async (req, res) => {
    try {
        const { employeeId, title, startDate, endDate, notes } = req.body;

        const employee = await Employee.findById(employeeId);
        if (!employee) return res.status(404).send('Employee not found');

        const contract = new Contract({
            employee: employeeId,
            title,
            startDate,
            endDate,
            notes
        });
        await contract.save();
        res.redirect('/HR');
    } catch (err) {
        console.error("Error creating contract:", err);
        res.status(500).send('Error creating contract');
    }
};

// --------------------- CREATE PAYROLL ---------------------
exports.createPayroll = async (req, res) => {
    try {
        const { employeeId, period, grossSalary } = req.body;

        const employee = await Employee.findById(employeeId);
        if (!employee) return res.status(404).send('Employee not found');

        // Simple calculation logic
        const tax = grossSalary * 0.1;
        const pension = grossSalary * 0.08;
        const netSalary = grossSalary - tax - pension;

        const payroll = new Payroll({
            employee: employeeId,
            period,
            grossSalary,
            tax,
            pension,
            netSalary,
            status: 'Pending'
        });
        await payroll.save();
        res.redirect('/HR');
    } catch (err) {
        console.error("Error creating payroll:", err);
        res.status(500).send('Error creating payroll');
    }
};

// --------------------- CREATE ATTENDANCE ---------------------
exports.createAttendance = async (req, res) => {
    try {
        const { employeeId, date, clockIn, clockOut, status } = req.body;

        const employee = await Employee.findById(employeeId);
        if (!employee) return res.status(404).send('Employee not found');

        const attendance = new Attendance({
            employee: employeeId,
            date,
            clockIn,
            clockOut,
            status
        });
        await attendance.save();
        res.redirect('/HR');
    } catch (err) {
        console.error("Error creating attendance:", err);
        res.status(500).send('Error creating attendance');
    }
};

// --------------------- CREATE LEAVE REQUEST ---------------------
exports.createLeaveRequest = async (req, res) => {
    try {
        const { employeeId, type, startDate, endDate, reason } = req.body;

        const employee = await Employee.findById(employeeId);
        if (!employee) return res.status(404).send('Employee not found');

        const leaveRequest = new LeaveRequest({
            employee: employeeId,
            type,
            startDate,
            endDate,
            reason
        });
        await leaveRequest.save();
        res.redirect('/HR');
    } catch (err) {
        console.error("Error creating leave request:", err);
        res.status(500).send('Error creating leave request');
    }
};
