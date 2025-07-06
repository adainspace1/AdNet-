const path = require('path')
const cors = require('cors')
const bodyparser = require('body-parser')
require('dotenv').config()
const express = require("express");
const app = express()
const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("./models/User");
const Inventory = require("./models/inventory");
const Sales = require("./models/sale");
const Expense = require('./models/expense');
const Production = require('./models/production');
const axios = require('axios');
const AccountsPayable = require('./models/AccountsPayable');
const AccountReceivable = require("./models/AccountReceivable");
const CashFlow = require('./models/CashFlow');
const Liquidity = require("./models/Liquidity");

const Personal = require('./models/personal');
const Payroll = require('./models/Payroll');


const Business = require("./models/business");
const Company = require("./models/company");
const BankInfo = require("./models/bank");
const Asset = require('./models/Asset');

const port=4000
const MongoStore = require("connect-mongo");
const ejs = require("ejs");
const session = require("express-session")

// app.use(express.urlencoded({ extended: true }))
// app.use(express.json())


const authRoutes = require("./routes/adminroutes");
const userRoutes = require("./routes/userroutes");
const production = require('./models/production');


app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_CONNECTION).then(()=>{console.log("Database Connected")}).catch((err)=>{console.log(err)});
app.use(express.json()); // For parsing JSON body


app.use(session({
    secret: "nelly",  // Change this to a strong secret key
    resave: false,  // Prevents session from saving on every request
    saveUninitialized: true,  // Prevents empty sessions from being stored
    store:MongoStore.create({mongoUrl: process.env.MONGODB_CONNECTION}),
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 24 hours session lifespan
}));





app.use(express.urlencoded({ extended: true })); // 🔥 This is critical for HTML form submissions
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'assets')));
app.set('views', path.join(__dirname, 'views'));
app.use (cors())
app.use(bodyparser.urlencoded({ extended: true }))
app.use(bodyparser.json())






app.use("/api/auth", authRoutes);
app.use("/user", userRoutes);





const requireLogin = async (req, res, next) => {
  if (!req.session.userId) {
    const redirectTo = encodeURIComponent(req.originalUrl); // e.g., /Dashboard
    return res.redirect(`/login?redirect=${redirectTo}`);
  }

  try {
    const user = await Personal.findById(req.session.userId);
    if (!user) {
      const redirectTo = encodeURIComponent(req.originalUrl);
      return res.redirect(`/login?redirect=${redirectTo}`);
    }

    req.user = user; // Attach user to req
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).send('Server error');
  }
};



app.get('/signup', (req,res) =>{
    res.render('dashboard/signup')
})


app.get('/login', (req, res) => {
  const redirect = req.query.redirect || '/';
  res.render('dashboard/login', { redirect }); // assuming you're using EJS
});





// Proxy endpoint for Free Currency API
app.get('/api/exchange-rate', async (req, res) => {
    try {
        const response = await axios.get('https://api.frankfurter.app/latest?from=USD&to=NGN');
        if (response.data && response.data.rates && response.data.rates.NGN) {
            res.json(response.data);
        } else {
            throw new Error('Invalid response from Frankfurter API');
        }
    } catch (error) {
        console.error('Error fetching exchange rate:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        // Fallback to a default rate if API fails
        res.status(200).json({
            rates: { NGN: 1500.50 }, // Default NGN rate (a
            // djust as needed)
            base: 'USD',
            date: new Date().toISOString().split('T')[0]
        });
    }
});





app.get("/", (req, res) => {
  res.render("index");
});
app.get("/Personal", (req, res) => {
  res.render("person");
});

app.get("/Businessinfo", async (req, res) => {
  try {
    const userId = req.query.id;
    console.log('Received userId:', userId);

    if (!userId) {
      console.log('No userId provided, redirecting to /Personal');
      return res.redirect("/Personal");
    }

    const user = await Personal.findById(userId);
    if (!user) {
      console.log(`No Personal user found for id: ${userId}, redirecting to /Personal`);
      return res.redirect("/Personal");
    }
    console.log(`Personal user found for id: ${userId}`);

    // Use correct field name here!
    const business = await Business.findOne({ reciepientId: userId });
    if (business) {
      console.log(`Business info found for userId: ${userId}, redirecting to /Company`);
      return res.redirect(`/Company?id=${userId}`);
    } else {
      console.log(`No Business info found for userId: ${userId}, rendering businessinfo page`);
    }

    res.render("businessinfo", { userId, user });

  } catch (err) {
    console.error('Error loading business info page:', err);
    res.status(500).send('Server error');
  }
});



// 2. Company step
app.get("/Company", async (req, res) => {
  try {
    const userId = req.query.id;
    console.log('Company step - Received userId:', userId);

    if (!userId) {
      console.log('Company step - No userId provided, redirecting to /Personal');
      return res.redirect("/Personal");
    }

    const user = await Personal.findById(userId);
    if (!user) {
      console.log(`Company step - No Personal user found for id: ${userId}, redirecting to /Personal`);
      return res.redirect("/Personal");
    }
    console.log(`Company step - Personal user found for id: ${userId}`);

    // Check if company info already exists (use correct field name!)
    const company = await Company.findOne({ reciepientId: userId });
    if (company) {
      console.log(`Company info found for userId: ${userId}, redirecting to /Bank`);
      return res.redirect(`/Bank?id=${userId}`);
    } else {
      console.log(`No Company info found for userId: ${userId}, rendering company page`);
    }

    res.render("company", { userId, user });

  } catch (err) {
    console.error('Error loading company page:', err);
    res.status(500).send('Server error');
  }
});

// 3. Bank step
app.get("/Bank", async (req, res) => {
  try {
    const userId = req.query.id;
    console.log('Bank step - Received userId:', userId);

    if (!userId) {
      console.log('Bank step - No userId provided, redirecting to /Personal');
      return res.redirect("/Personal");
    }

    const user = await Personal.findById(userId);
    if (!user) {
      console.log(`Bank step - No Personal user found for id: ${userId}, redirecting to /Personal`);
      return res.redirect("/Personal");
    }
    console.log(`Bank step - Personal user found for id: ${userId}`);

    // Check if bank info already exists (use correct field name!)
    const bank = await BankInfo.findOne({ reciepientId: userId });
    if (bank) {
      console.log(`Bank info found for userId: ${userId}, redirecting to /dashboard`);
      return res.redirect(`/Finished?id=${userId}`);
    } else {
      console.log(`No Bank info found for userId: ${userId}, rendering bank page`);
    }

    res.render("bank", { userId, user });

  } catch (err) {
    console.error('Error loading bank page:', err);
    res.status(500).send('Server error');
  }
});





app.get('/resolve-account', async (req, res) => {
  const { account_number, bank_code } = req.query;

  try {
    const response = await axios.get(`https://api.paystack.co/bank/resolve`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      params: {
        account_number,
        bank_code
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ status: false, message: "Failed to resolve account" });
  }
});







app.get("/Review", async (req, res) => {
  try {
    const userId = req.query.id;
    if (!userId) return res.redirect("/Personal");

    const user = await Personal.findById(userId);
    if (!user) return res.redirect("/Personal");

    res.render("review", { userId, user });
  } catch (err) {
    console.error('Error loading review page:', err);
    res.status(500).send('Server error');
  }
});

app.get("/Finished", async (req, res) => {
  try {
    const userId = req.query.id;
    if (!userId) return res.redirect("/Personal");

    const user = await Personal.findById(userId);
    if (!user) return res.redirect("/Personal");

    res.render("finish", { userId, user });
  } catch (err) {
    console.error('Error loading finish page:', err);
    res.status(500).send('Server error');
  }
});


app.get("/admin", (req, res) => {
  res.render("admin");
});
app.get("/roles", (req, res) => {
  res.render("roles");
});
app.get("/newsales", (req, res) => {
  res.render("newsales");
});
app.get("/addnewexpenses", (req, res) => {
  res.render("addnewexpenses");
});
app.get("/viewallexpenses", (req, res) => {
  res.render("viewallexpenses");
});
app.get("/salehistory", (req, res) => {
  res.render("salehistory");
});





app.get('/email-exists', (req, res) => {
  const email = req.query.email || '';
  res.render('dashboard/emailExists', { email });
});















app.get("/Dashboard", requireLogin, async (req, res) => {
  try {
    const userId = req.query.id || req.user._id;
    console.log("Dashboard - Looking for company info using ID:", userId);

    const inventoryItems = await Inventory.find({ recipientId: req.user._id });
    const companyinfo = await Company.findOne({ reciepientId: userId });


    const salesItems = await Sales.find({ recipientId: req.user._id });

     const expenses = await Expense.find({ recipientId: userId }).sort({ createdAt: -1 });

// Sum total inventory quantity
const totalInventory = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);

// Sum total sales quantity
const totalSales = salesItems.reduce((sum, sale) => sum + sale.quantity, 0);

// Calculate sales percent
const salesPercentage = totalInventory > 0
  ? Math.round((totalSales / totalInventory) * 100)
  : 0;

       // Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get today's sales
  const todaySales = await Sales.find({
  recipientId: req.user._id,
  date: { $gte: todayStart, $lte: todayEnd }
})
.sort({ date: -1 })       // sort by latest first
.limit(3);                // only get top 3



    // Filter expenses for today
    const todayExpenses = await Expense.find({
      recipientId: userId,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    })
    .sort({ date: -1 })       // sort by latest first
.limit(3);   




// Calculate today's total sales amount
const totalSalesAmountToday = todaySales.reduce((sum, sale) => sum + sale.amount, 0);

// Calculate today's total expenses amount
const totalExpenseAmountToday = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

// Gross Profit = sales - expenses
const grossProfitToday = totalSalesAmountToday - totalExpenseAmountToday;

// Gross Profit Percentage
const grossProfitPercentage = totalSalesAmountToday > 0
  ? Math.round((grossProfitToday / totalSalesAmountToday) * 100)
  : 0;

// Loss Percentage = (expenses / sales) * 100
const lossPercentage = totalSalesAmountToday > 0
  ? Math.round((totalExpenseAmountToday / totalSalesAmountToday) * 100)
  : 0;

  
console.log("Today's Expenses:", lossPercentage);



  // Step 1: Get sales from this week
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 6); // 7 days total including today

const weeklySales = await Sales.find({
  recipientId: req.user._id,
  date: { $gte: oneWeekAgo, $lte: new Date() }
});

// Step 2: Group sales by day of week (0=Sun, 1=Mon...)
const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Sunday to Saturday

weeklySales.forEach(sale => {
  const day = new Date(sale.date).getDay(); // getDay: 0 (Sun) to 6 (Sat)
  weeklyData[day] += sale.amount; // accumulate sales amount
});

// Step 3: Rearrange from Mon to Sun
const weeklySalesData = [
  weeklyData[1], // Mon
  weeklyData[2], // Tue
  weeklyData[3], // Wed
  weeklyData[4], // Thu
  weeklyData[5], // Fri
  weeklyData[6], // Sat
  weeklyData[0], // Sun
];


res.render('dashboard/dashboard', {
  user: req.user,
  inventory: inventoryItems,
  companyinfo,
  todayExpenses,
  todaySales,
  salesPercentage,
  grossProfitToday,
  totalSalesAmountToday,
  totalExpenseAmountToday,
  grossProfitPercentage,
  lossPercentage,
  weeklySalesData, 
});

  } catch (err) {
    console.error('Error loading dashboard page:', err);
    res.status(500).send('Server error');
  }
});







app.get('/Inventory', requireLogin, async (req, res) => {
  try {
    const inventoryItems = await Inventory.find({ recipientId: req.user._id });
    const salesItems = await Sales.find({ recipientId: req.user._id });

    // 1. Total Inventory Value (scost * currentquantity)
    const totalInventoryValue = inventoryItems.reduce((sum, item) => {
      return sum + (item.scost * item.currentquantity);
    }, 0);

    // 2. Total Items Count (sum of currentquantity)
    const totalItemsCount = inventoryItems.reduce((sum, item) => {
      return sum + item.currentquantity;
    }, 0);

// 3. Top Selling ItemName (from Sales)
const itemSalesMap = {};

salesItems.forEach(sale => {
  const name = sale.item;
  if (typeof name === 'string' && name.trim() !== '') {
    if (!itemSalesMap[name]) {
      itemSalesMap[name] = 0;
    }
    itemSalesMap[name] += sale.quantity;
  } else {
    console.warn("Missing or invalid itemName in sale:", sale);
  }
});

let topSellingItem = "N/A";
let maxSales = 0;
for (const [itemName, totalQty] of Object.entries(itemSalesMap)) {
  if (totalQty > maxSales) {
    maxSales = totalQty;
    topSellingItem = itemName;
  }
}


    res.render('dashboard/inventory', {
      user: req.user,
      inventory: inventoryItems,
      totalInventoryValue,
      totalItemsCount,
      topSellingItem
    });

  } catch (err) {
    console.error('Error loading inventory page:', err);
    res.status(500).send('Server error');
  }
});








app.get('/Sales', requireLogin, async (req, res) => {
  try {
    const inventoryItems = await Inventory.find({ recipientId: req.user._id });
    const salesitem = await Sales.find({ recipientId: req.user._id });

    const oneinventoryItems = await Inventory.findOne({ recipientId: req.user._id });

    // Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get today's sales
    const todaySales = await Sales.find({
      recipientId: req.user._id,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    // Count and sum
    const totalSalesToday = todaySales.length;
    const totalAmountToday = todaySales.reduce((sum, sale) => sum + sale.amount, 0);

    res.render('dashboard/sales', {
      user: req.user,
      inventory: inventoryItems,
      salesitem,
      totalSalesToday,
      totalAmountToday,
      oneinventoryItems
    });
  } catch (err) {
    console.error('Error loading inventory page:', err);
    res.status(500).send('Server error');
  }
});





app.get('/Expenses', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const categories = ['Utilities', 'Supplies', 'Transport', 'Miscellaneous'];

    // Get all expenses
    const expenses = await Expense.find({ recipientId: userId }).sort({ createdAt: -1 });

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Filter expenses for today
    const todayExpenses = await Expense.find({
      recipientId: userId,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    // Count & total amount today
    const totalExpensesToday = todayExpenses.length;
    const totalAmountToday = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString();

    // Breakdown by category
    const categoryBreakdown = {};

    categories.forEach(category => {
      const filtered = todayExpenses.filter(exp => exp.category === category);
      const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
      categoryBreakdown[category] = total;
    });

    res.render('dashboard/expenses', {
      user: req.user,
      expenses,
      categories,
      todayExpenses,
      totalExpensesToday,
      totalAmountToday,
      categoryBreakdown
    });

  } catch (err) {
    console.error('Error loading expenses page:', err);
    res.status(500).send('Server error');
  }
});



















app.get("/Transaction", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.query;


      const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

    // Static production for now
    const todayProductions = await Production.find({ 
      recipientId: userId,
      createdAt: { $gte: start, $lte: end },
    });
    const today = new Date().toDateString();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaySales = await Sales.find({
      recipientId: userId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    const todayStartt = new Date();
    todayStartt.setHours(0, 0, 0, 0);
    const todayEndd = new Date();
    todayEndd.setHours(23, 59, 59, 999);

    const todayExpenses = await Expense.find({
      recipientId: userId,
      createdAt: { $gte: todayStartt, $lte: todayEndd }
    });



    const totalSales = todaySales.reduce((sum, s) => sum + s.amount, 0);
    const totalProduction = todayProductions.reduce((sum, s) => sum + s.amount, 0);
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalTransactions = todaySales.length + todayExpenses.length + todayProductions.length;

    res.render("dashboard/transaction", {
      sales: todaySales,
      expenses: todayExpenses,
      production: todayProductions,
      selectedType: type || null,
      totalSales,
      totalProduction,
      totalExpenses,
      totalTransactions
    });

  } catch (err) {
    console.error('Error loading transaction page:', err);
    res.status(500).send('Server error');
  }
});


// GET production page











app.get('/Production', requireLogin, async (req, res) => {
  try {

    const userId = req.user._id;


      const allProductions = await Production.find();
const uniqueCategories = [...new Set(allProductions.map(p => p.category.toLowerCase()))];




  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

    const productions = await Production.find({ 
      recipientId: userId,
      createdAt: { $gte: start, $lte: end },
    });

    console.log("Productions:", productions);

    const totalProductionAmount = productions.reduce((sum, sale) => sum + sale.amount, 0);

const sortedProductions = productions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const summary = {
  totalEntries: sortedProductions.length,
  totalCost: sortedProductions.reduce((sum, p) => sum + p.amount, 0),
  categories: [...new Set(sortedProductions.map(p => p.category))],
  all: sortedProductions
};




   // Create breakdown by category
    const categoryBreakdown = {};
    productions.forEach(p => {
      if (!categoryBreakdown[p.category]) {
        categoryBreakdown[p.category] = 0;
      }
      categoryBreakdown[p.category] += p.amount;
    });

  res.render('dashboard/production', 
    {
      user: req.user,
       summary,
       categoryBreakdown,
       sortedProductions,
       totalProductionAmount,
       allProductions,
       uniqueCategories
      });
  }
  catch (err) {
    console.error('Error loading production page:', err);
    res.status(500).send('Server error');
  }

});






















app.get('/Profit', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

       // Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get today's sales
    const sales = await Sales.find({
      recipientId: req.user._id,
      date: { $gte: todayStart, $lte: todayEnd }
    });
    console.log("Sales:", sales);

      
    const profit = sales.reduce((sum, sale) => sum + sale.amount, 0);

    console.log("profits", profit)

    const expenses = await Expense.find({ 
       recipientId: userId,
       createdAt: { $gte: start, $lte: end }
       });

    console.log("Expenses:", expenses);

        const expensesTotal = expenses.reduce((sum, sale) => sum + sale.amount, 0);

      

    const production = await Production.find({  recipientId: userId,
       createdAt: { $gte: start, $lte: end } 
      });

    const salesTotal = sales.reduce((sum, s) => sum + s.amount, 0);
    const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
    const productionTotal = production.reduce((sum, p) => sum + p.amount, 0);

    const loss = expensesTotal + productionTotal;




    const category = [];

// Combine sales
sales.forEach(s => {
  category.push({
    type: 'sales',
    amount: s.amount,
    date: s.date
  });
});

// Combine expenses
expenses.forEach(e => {
  category.push({
    type: 'expenses',
    amount: e.amount,
    date: e.createdAt
  });
});

// Combine production
production.forEach(p => {
  category.push({
    type: 'production',
    amount: p.amount,
    date: p.createdAt
  });
});


res.render('dashboard/profit', {
  user: req.user,
  salesTotal,
  expenseTotal,
  productionTotal,
  date: new Date().toDateString(),
  profit,
  sales,
  expenses,
  production,
  category, // send it to EJS
  loss
});

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});








app.get("/accountpayable", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;

    const accountPayables = await AccountsPayable.find({ recipientId: userId }).sort({ createdAt: -1 });

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    let totalOutstanding = 0;
    let overdueAmount = 0;
    let overdueCount = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let dueThisWeekAmount = 0;
    let dueThisWeekCount = 0;

    accountPayables.forEach(item => {
      totalOutstanding += item.ramount;

      const dueDate = new Date(item.dueDate);
      const status = item.status?.toLowerCase() || "not paid";

      if (status !== "paid") {
        if (dueDate < today) {
          overdueAmount += item.ramount;
          overdueCount++;
        } else {
          pendingAmount += item.ramount;
          pendingCount++;
        }

        if (dueDate >= today && dueDate <= nextWeek) {
          dueThisWeekAmount += item.ramount;
          dueThisWeekCount++;
        }
      }
    });

    res.render("dashboard/accountpayable", {
      user: req.user,
      accountPayables,
      summary: {
        totalOutstanding,
        overdueAmount,
        overdueCount,
        pendingAmount,
        pendingCount,
        dueThisWeekAmount,
        dueThisWeekCount
      }
    });

  } catch (err) {
    console.error("Error fetching account payables:", err);
    res.status(500).send("Server error");
  }
});









app.get("/accountreceivable", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;

    const receivables = await AccountReceivable.find({ recipientId: userId }).sort({ createdAt: -1 });

    // Calculate summary values
    const totalReceivables = receivables.reduce((sum, r) => sum + r.ramount, 0);
const collectedAmount = receivables
  .filter(r => r.status === "paid" || r.status === "partially paid")
  .reduce((sum, r) => {
    const paid = r.amountPaid != null ? r.amountPaid : (r.status === "paid" ? r.ramount : 0);
    return sum + paid;
  }, 0);

    const overdueAmount = receivables
      .filter(r => new Date(r.dueDate) < new Date() && r.status !== "paid")
      .reduce((sum, r) => sum + (r.ramount - (r.amountPaid || 0)), 0);

    res.render("dashboard/accountrecievable", {
      user: req.user,
      receivables,
      summary: {
        totalReceivables,
        collectedAmount,
        overdueAmount,
      }
    });
  } catch (err) {
    console.error("Error fetching receivables:", err);
    res.status(500).send("Server error");
  }
});







app.get("/pricedeterminant", requireLogin, async (req, res) => {
  try{
    
     const userId = req.user._id;

          const allProductions = await Production.find();
const uniqueCategories = [...new Set(allProductions.map(p => p.category.toLowerCase()))];




  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

    const productions = await Production.find({ 
      recipientId: userId,
      createdAt: { $gte: start, $lte: end },
    });

    console.log("Productions:", productions);

    const totalProductionAmount = productions.reduce((sum, sale) => sum + sale.amount, 0);

const sortedProductions = productions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const summary = {
  totalEntries: sortedProductions.length,
  totalCost: sortedProductions.reduce((sum, p) => sum + p.amount, 0),
  categories: [...new Set(sortedProductions.map(p => p.category))],
  all: sortedProductions
};

  res.render("dashboard/pricedetermination", {
    user: req.user,
    allProductions,
    uniqueCategories,
    summary,
    sortedProductions,
    totalProductionAmount,
    productions
  });
  } catch (err){
    res.render("cannot find lalalala")
  }
});








// GET endpoint to fetch product details
app.get('/pricedeterminant/product/:id', requireLogin, async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user._id;

        const product = await Production.findOne({ _id: productId, recipientId: userId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Prepare response data
        const responseData = {
            success: true,
            product: {
                unitPrice: product.unitPrice || 0, // Cost price
                amount: product.amount || 0,       // Total price (could be selling price or total including profit)
                // Add other fields if needed, e.g., fees if stored separately
            }
        };

        res.json(responseData);
    } catch (error) {
        console.error('Error fetching product data:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT endpoint to update product details
app.put('/pricedeterminant/product/:id', requireLogin, async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user._id;
        const { unitPrice, profit, fees, amount } = req.body; // Expecting updated values from frontend

        console.log("bosy", req.body)
        const product = await Production.findOne({ _id: productId, recipientId: userId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Update product fields
        product.unitPrice = unitPrice || product.unitPrice;
        product.amount = amount || product.amount;
        // Profit and fees could be derived or stored separately if needed
        if (profit !== undefined) product.profit = profit; // Add profit field to schema if not present
        if (fees !== undefined) product.fees = fees;       // Add fees field to schema if not present

        await product.save();

        // Prepare updated response
        const updatedData = {
            success: true,
            product: {
                unitPrice: product.unitPrice,
                amount: product.amount,
                profit: product.profit || 0,
                fees: product.fees || 0
            }
        };

        // Optionally send a signal to update the frontend (e.g., via WebSocket or refresh)
        res.json(updatedData);
    } catch (error) {
        console.error('Error updating product data:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});








app.get("/statementofaccount", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;

    const salesitem = await Sales.find({ recipientId: userId });
    const expenses = await Expense.find({ recipientId: userId });
    const production = await Production.find({ recipientId: userId });

    // Transform all into a single `transactions` array
    let transactions = [];

    salesitem.forEach((sale, i) => {
      transactions.push({
        date: sale.date,
        type: "Income",
        docNo: `SAL-${i + 1}`,
        description: `Sale of ${sale.item} to ${sale.custormername}`,
        debit: 0,
        credit: sale.amount,
      });
    });

    expenses.forEach((exp, i) => {
      transactions.push({
        date: exp.createdAt,
        type: "Expense",
        docNo: `EXP-${i + 1}`,
        description: `${exp.category}: ${exp.description}`,
        debit: exp.amount,
        credit: 0,
      });
    });

    production.forEach((prod, i) => {
      const net = prod.profit - prod.fees;
      if (net >= 0) {
        transactions.push({
          date: prod.createdAt,
          type: "Production Profit",
          docNo: `PRO-${i + 1}`,
          description: `Produced ${prod.itemName} (${prod.category})`,
          debit: 0,
          credit: net,
        });
      } else {
        transactions.push({
          date: prod.createdAt,
          type: "Production Loss",
          docNo: `PRO-${i + 1}`,
          description: `Loss on ${prod.itemName} (${prod.category})`,
          debit: Math.abs(net),
          credit: 0,
        });
      }
    });

    // Sort all by date (latest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Compute running balance
    let runningBalance = 0;
    transactions = transactions.reverse().map((tx) => {
      runningBalance += (tx.credit || 0) - (tx.debit || 0);
      return {
        ...tx,
        balance: runningBalance,
        formattedDate: new Date(tx.date).toISOString().split('T')[0],
      };
    }).reverse(); // Reverse again to restore descending order

    // Send to EJS
    const businessinfo = await Business.findOne({ reciepientId: userId });

    // === Summary Calculations ===
let openingBalance = 2450000; // or fetch from DB if saved

let totalInvoiced = 0;
let totalPayments = 0;
let totalCreditNotes = 0;
let totalExpenses = 0;

// Sales
salesitem.forEach(sale => {
  totalInvoiced += sale.amount;
  totalPayments += sale.amount; // Assuming full payments
});

// Expenses
expenses.forEach(exp => {
  totalExpenses += exp.amount;
});

// Production
production.forEach(prod => {
  const net = prod.profit - prod.fees;
  if (net >= 0) {
    totalInvoiced += net;
  } else {
    totalCreditNotes += Math.abs(net);
  }
});

const closingBalance = openingBalance + totalInvoiced - totalExpenses - totalCreditNotes;


    res.render('dashboard/statement of account.ejs', {
      user: req.user,
      transactions,
      businessinfo,
        summary: {
    openingBalance,
    totalInvoiced,
    totalPayments,
    totalCreditNotes,
    closingBalance
  }
    });

  } catch (err) {
    console.error('Error loading statement of account page:', err);
    res.status(500).send('Server error');
  }
});







app.get("/Assests", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;

    const allAssets = await Asset.find({ userId }).sort({ createdAt: -1 });

    // Group assets by ledgerType
    const registerAssets = allAssets.filter(a => a.ledgerType === 'Fixed Assets Register');
    const scheduleAssets = allAssets.filter(a => a.ledgerType === 'Fixed Asset Schedule');
    const accountAssets = allAssets.filter(a => a.ledgerType === 'Fixed Asset Accounts');

    res.render("dashboard/Assetms.ejs", { 
      user: req.user,
      registerAssets,
      scheduleAssets,
      accountAssets
    });

  } catch (error) {
    res.status(500).send('Error fetching assets: ' + error.message);
  }
});





app.post('/assets/add', async (req, res) => {
  try {
    const {
      id,
      userId,
      product,
      status,
      serial,
      orderNo,
      purchaseDate,
      cost,
      category,
      manufacturer,
      ledgerType,

      depreciationRate,
      usefulLife,
      glAccountCode,
      costCenter
    } = req.body;

    // Basic required fields
    if (!id || !userId || !product || !status || !serial || !orderNo || !purchaseDate || !cost || !category || !ledgerType) {
      return res.status(400).send('Missing required asset fields.');
    }

    // Additional checks based on ledgerType
    if (ledgerType === "Fixed Asset Schedule") {
      if (!depreciationRate || !usefulLife) {
        return res.status(400).send("Schedule: Depreciation rate and useful life are required.");
      }
    }

    if (ledgerType === "Fixed Asset Accounts") {
      if (!glAccountCode || !costCenter) {
        return res.status(400).send("Accounts: GL Account Code and Cost Center are required.");
      }
    }

    // Create asset object
    const assetData = {
      id: id.trim(),
      userId,
      product: product.trim(),
      status: status.trim(),
      serial: serial.trim(),
      orderNo: orderNo.trim(),
      purchaseDate: new Date(purchaseDate),
      cost: parseFloat(cost),
      category: category.trim(),
      manufacturer: manufacturer?.trim(),
      ledgerType: ledgerType.trim()
    };

    // Conditionally add optional fields
    if (ledgerType === "Fixed Asset Schedule") {
      assetData.depreciationRate = parseFloat(depreciationRate);
      assetData.usefulLife = parseInt(usefulLife);
    }

    if (ledgerType === "Fixed Asset Accounts") {
      assetData.glAccountCode = glAccountCode?.trim();
      assetData.costCenter = costCenter?.trim();
    }

    const asset = new Asset(assetData);
    console.log('Adding asset:', asset);
    await asset.save();

    res.redirect('/Assests');
  } catch (error) {
    console.error('Error adding asset:', error.message);
    res.status(500).send('Error adding asset: ' + error.message);
  }
});








app.get("/cashflow", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    let { start, end } = req.query;

    let startDate = start ? new Date(start) : new Date("2000-01-01");
    let endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);
    startDate.setHours(0, 0, 0, 0);

    const [sales, expenses, productions, assetPurchases] = await Promise.all([
      Sales.find({ recipientId: userId, date: { $gte: startDate, $lte: endDate } }),
      Expense.find({ recipientId: userId, createdAt: { $gte: startDate, $lte: endDate } }),
      Production.find({ recipientId: userId, createdAt: { $gte: startDate, $lte: endDate } }),
      Asset.find({ userId, purchaseDate: { $gte: startDate, $lte: endDate } })
    ]);

    // Mock Calculation (Replace with your actual logic)
    const netIncome = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) -
                      expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const depreciation = assetPurchases.reduce((sum, a) => sum + ((a.depreciation || 0)), 0);
    const changeInWorkingCapital = 1000; // Placeholder
    const investmentIncome = 800; // Placeholder
    const loanReceived = 3000; // Placeholder
    const dividendsPaid = 1200; // Placeholder
    const leasingValue = 2500; // Placeholder
    const notes = "Generated based on available data.";

    const netCashFromOperating = netIncome + depreciation + changeInWorkingCapital;
    const purchaseOfEquipment = assetPurchases.reduce((sum, a) => sum + (a.amount || 0), 0);
    const netCashFromInvesting = investmentIncome - purchaseOfEquipment;
    const netCashFromFinancing = loanReceived - dividendsPaid;
    const netIncreaseInCash = netCashFromOperating + netCashFromInvesting + netCashFromFinancing;

    const cashAtBeginning = 10000; // placeholder
    const cashAtEnd = cashAtBeginning + netIncreaseInCash;

    const cashFlow = {
      operatingActivities: {
        netIncome,
        depreciation,
        changeInWorkingCapital,
        netCashFromOperating
      },
      investingActivities: {
        purchaseOfEquipment,
        investmentIncome,
        netCashFromInvesting
      },
      financingActivities: {
        loanReceived,
        dividendsPaid,
        netCashFromFinancing
      },
      netIncreaseInCash,
      cashBalanceSummary: {
        cashAtBeginning,
        cashAtEnd
      },
      nonCashTransactions: leasingValue,
      notes
    };

    res.render("dashboard/cashflow", {
      user: req.user,
      sales,
      expenses,
      productions,
      assetPurchases,
      startDate,
      endDate,
      date: endDate.toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
      }),
      cashFlow // ✅ Send this to EJS
    });

  } catch (err) {
    console.error("Error loading /cashflow:", err);
    res.status(500).send("Server error");
  }
});






app.get("/balancesheet", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;

    // --- Fetch from DB ---
    const inventoryItems = await Inventory.find({ recipientId: userId });
    const salesItems = await Sales.find({ recipientId: userId });
    const productionItems = await Production.find({ recipientId: userId });

    const accountPayables = await AccountsPayable.find({ recipientId: userId });

     const receivables = await AccountReceivable.find({ recipientId: userId }).sort({ createdAt: -1 });

    // --- Assets ---
    const cash = salesItems.reduce((sum, sale) => sum + (sale.amount || 0), 0); // Assuming sales generate cash
    const inventoryValue = inventoryItems.reduce((sum, item) => sum + (item.scost * item.currentquantity), 0);

    const accountpayables = accountPayables.reduce((sum, sale) => sum + (sale.amount || 0), 0); // Assuming sales generate cash

        const accountreceivables = receivables.reduce((sum, sale) => sum + (sale.amount || 0), 0); // Assuming sales generate cash

    const assets = {
      cash,
      inventory: inventoryValue,
      equipment: 0, // Add logic if you track equipment
      accountreceivables, // Add logic if needed
      investments: 0 // Optional
    };

    // --- Liabilities ---
    const productionCost = productionItems.reduce((sum, prod) => sum + (prod.cost || 0), 0);
    const liabilities = {
      productionCosts: productionCost,
      loans: 0, // Add logic if loans are stored
      taxesOwed: 0,
      creditCards: 0,
      accountpayables
    };

    // --- Equity ---
    const capital = 20000; // Replace with DB value if available
    const retainedEarnings = cash - productionCost; // A simple assumption

    const equity = {
      capital,
      retainedEarnings
    };

const totalAssets = Object.values(assets).reduce((a, b) => a + b, 0);
const totalLiabilities = Object.values(liabilities).reduce((a, b) => a + b, 0);

// Calculate equity from assets and liabilities
const totalEquity = totalAssets - totalLiabilities;


    const debtRatio = totalAssets ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0;
    const equityRatio = totalAssets ? ((totalEquity / totalAssets) * 100).toFixed(1) : 0;

    res.render("dashboard/balancesheet", {
      user: req.user,
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      debtRatio,
      equityRatio
    });

  } catch (err) {
    console.error("Error loading /balancesheet:", err);
    res.status(500).send("Server error");
  }
});











// GET Liquidity Page
app.get("/ledgerliquidity", requireLogin, async (req, res) => {
  try {
    const entries = await Liquidity.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Sum all entries
    const totalCash = entries.reduce((sum, e) => sum + (e.cash || 0), 0);
    const totalBank = entries.reduce((sum, e) => sum + (e.bank || 0), 0);
    const totalLiabilities = entries.reduce((sum, e) => sum + (e.liabilities || 0), 0);
    const netLiquidity = totalCash + totalBank - totalLiabilities;

    const totalLiquidity = {
      cash: totalCash,
      bank: totalBank,
      liabilities: totalLiabilities,
      netLiquidity: netLiquidity
    };

    console.log("Total Liquidity Summary:", totalLiquidity);

    res.render("dashboard/ledgerliquidity.ejs", {
      user: req.user,
      liquidity: totalLiquidity,
      liquidityEntries: entries
    });
  } catch (err) {
    console.error('Error loading ledger liquidity page:', err);
    res.status(500).send('Server error');
  }
});




// POST Liquidity Entry
app.post("/ledgerliquidity", requireLogin, async (req, res) => {
  try {
    const { cash, bank, liabilities } = req.body;
    const numCash = parseFloat(cash);
    const numBank = parseFloat(bank);
    const numLiabilities = parseFloat(liabilities);
    const netLiquidity = numCash + numBank - numLiabilities;

    const newEntry = new Liquidity({
      userId: req.user._id,
      cash: numCash,
      bank: numBank,
      liabilities: numLiabilities,
      netLiquidity
    });

    await newEntry.save();

    res.redirect("/ledgerliquidity");
  } catch (err) {
    console.error("Error saving liquidity:", err);
    res.status(500).send("Server error");
  }
});
app.post("/ledgerliquidity/delete/:id", requireLogin, async (req, res) => {
  try {
    await Liquidity.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.redirect("/ledgerliquidity");
  } catch (err) {
    console.error("Error deleting liquidity entry:", err);
    res.status(500).send("Server error");
  }
});







app.get("/payroll", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const payrolls = await Payroll.find({ userId });

    // Total Employees Paid
    const totalEmployeesPaid = payrolls.filter(p => p.status === "processed").length;

    // Total Payroll (sum of netPay of processed ones)
    const totalPayroll = payrolls
      .filter(p => p.status === "processed")
      .reduce((sum, p) => sum + p.netPay, 0);

    // Pending Payrolls Count
    const pendingPayrolls = payrolls.filter(p => p.status === "pending").length;

    res.render("dashboard/payrol.ejs", {
      user: req.user,
      payrolls,
      totalEmployeesPaid,
      totalPayroll,
      pendingPayrolls,
    });
  } catch (err) {
    console.error("Error loading payroll page:", err);
    res.status(500).send("Server error");
  }
});






























































app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Could not log out');
    }

    res.clearCookie('connect.sid'); // Optional: clears session cookie
    res.redirect('/login'); // or res.redirect('/') if you prefer home
  });
});





app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`)
})