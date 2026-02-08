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

const Credit = require("./models/Credit");

const SoleProprietorship = require('./models/SoleProprietorship');
const Corporation = require('./models/Corporation');
const PLC = require('./models/PLC');
const WebSocket = require("ws");  // for websocket

const yahooFinance = require('yahoo-finance2').default; // npm i yahoo-finance2
// ========== CONFIG ==========
const FINNHUB_API = "https://finnhub.io/api/v1";
const FINNHUB_WS = `wss://ws.finnhub.io?token=${process.env.FINNHUB_API_KEY}`;
const POLYGON_NEWS_API = "https://api.polygon.io/v2/reference/news";

const NEWSAPI_URL = 'https://newsapi.org/v2/top-headlines';



const Analysis = require('./models/Analysis');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const Order = require("./models/Order");

const QRCode = require('qrcode');


const Business = require("./models/business");
const Company = require("./models/company");
const BankInfo = require("./models/bank");
const Asset = require('./models/Asset');
const Budget = require('./models/budget');
const Worker = require("./models/Worker"); // adjust path

const Vendor = require("./models/vendorreg");
const AddVendor = require("./models/AddVendor");


const bcrypt = require("bcryptjs");


const Driver = require("./models/Driver");

const port = process.env.PORT;


const session = require("express-session")
const MongoStore = require("connect-mongo")


const Wallet = require('./models/Wallet');
const WalletTransaction = require("./models/WalletTransaction");
const Reconciliation = require("./models/Reconciliation"); // if you track mismatches
const Invoice = require("./models/Invoice"); // if you track mismatches
const LinkedBank = require("./models/LinkedBank"); // if you track mismatches


const adminroute = require("./routes/adminroutes");
const userroute = require("./routes/userroutes");
const crmRoutes = require('./routes/crmRoutes');
// HR Routes
const hrRoutes = require('./routes/hrRoutes');
const driverRoutes = require('./routes/driverRoutes');
const orderRoutes = require('./routes/orderRoutes');
const orderController = require('./controllers/orderController');
const logisticsRoutes = require('./routes/logisticsRoutes');
const plansRoutes = require('./routes/plans');
const adminDashboardRoutes = require('./routes/adminDashboard');
const userActivities = require('./routes/adminActivities');
const subscriptionRoutes = require('./routes/subscriptions');
const auditRoutes = require('./routes/auditRoutes');
const { expireSubscriptions } = require('./utils/subscriptionManager');











app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_CONNECTION).then(() => { console.log("Database Connected") }).catch((err) => { console.log(err) });

const userRoutes = require("./routes/userroutes");

app.use(session({
  secret: "nelly",  // Change this to a strong secret key
  resave: false,  // Prevents session from saving on every request
  saveUninitialized: true,  // Prevents empty sessions from being stored
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_CONNECTION }),
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 24 hours session lifespan
}));

// Middleware to set default isVendor value
const setDefaultVendorStatus = (req, res, next) => {
  // Only set if not already set by vendorAuth middleware
  if (req.isVendor === undefined) {
    req.isVendor = false;
  }
  // Make isVendor available to all EJS templates
  res.locals.isVendor = req.isVendor;
  next();
};

// Apply default vendor status to all routes
app.use(setDefaultVendorStatus);

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(express.static(path.join(__dirname, 'assets')));
app.use(cors());

// Body parsers with high size limits (for videos/images)
app.use(express.json({ limit: '100mb' }));

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



app.use('/api/auth', adminroute);
app.use('/user', userRoutes);
app.use('/CRM', crmRoutes);
app.use('/HR', hrRoutes);
app.use('/driver', driverRoutes);
app.use('/Order', orderRoutes);
app.use('/logistics', logisticsRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/userActivities', userActivities);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/audit', auditRoutes);









app.get("/", (req, res) => {
  res.render("index");
});
app.get("/Personal", (req, res) => {
  res.render("person");
});

// New Signup Routes
app.get("/signup/sole", (req, res) => {
  res.render("sole");
});

app.get("/signup/corporation", (req, res) => {
  res.render("corporation");
});

app.get("/signup/plc", (req, res) => {
  res.render("plc");
});

app.get("/Businessinfo", async (req, res) => {
  try {
    const userId = req.query.id;
    console.log('Received userId:', userId);

    if (!userId) {
      console.log('No userId provided, redirecting to /Personal');
      return res.redirect("/Personal");
    }

    // Check all models
    let user = await Personal.findById(userId);
    let userType = 'Personal';

    if (!user) {
      user = await SoleProprietorship.findById(userId);
      userType = 'SoleProprietorship';
    }
    if (!user) {
      user = await Corporation.findById(userId);
      userType = 'Corporation';
    }
    if (!user) {
      user = await PLC.findById(userId);
      userType = 'PLC';
    }

    if (!user) {
      console.log(`No user found for id: ${userId} in any model, redirecting to /Personal`);
      return res.redirect("/Personal");
    }
    console.log(`${userType} user found for id: ${userId}`);

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

    // Check all models
    let user = await Personal.findById(userId);
    let userType = 'Personal';

    if (!user) {
      user = await SoleProprietorship.findById(userId);
      userType = 'SoleProprietorship';
    }
    if (!user) {
      user = await Corporation.findById(userId);
      userType = 'Corporation';
    }
    if (!user) {
      user = await PLC.findById(userId);
      userType = 'PLC';
    }

    if (!user) {
      console.log(`Company step - No user found for id: ${userId} in any model, redirecting to /Personal`);
      return res.redirect("/Personal");
    }
    console.log(`Company step - ${userType} user found for id: ${userId}`);

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

    // Check all models
    let user = await Personal.findById(userId);
    let userType = 'Personal';

    if (!user) {
      user = await SoleProprietorship.findById(userId);
      userType = 'SoleProprietorship';
    }
    if (!user) {
      user = await Corporation.findById(userId);
      userType = 'Corporation';
    }
    if (!user) {
      user = await PLC.findById(userId);
      userType = 'PLC';
    }

    if (!user) {
      console.log(`Bank step - No user found for id: ${userId} in any model, redirecting to /Personal`);
      return res.redirect("/Personal");
    }
    console.log(`Bank step - ${userType} user found for id: ${userId}`);

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



app.get("/subcription", (req, res) => {
  const userId = req.query.id;  // get ?id=

  res.render("subcription/main_sub", { userId });
});



app.get("/not-subscribed-yet", (req, res) => {
  const userId = req.query.id;  // get ?id=

  res.render("not-subscribed-yet", { userId });
});

app.get("/add-subscription", (req, res) => {
  const userId = req.query.id;  // get ?id=

  res.render("add-subscription", { userId });
});

app.get("/subcription/custom", (req, res) => {
  const userId = req.query.id;

  res.render("subcription/custom", { userId });
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

    // Check all models
    let user = await Personal.findById(userId);

    if (!user) user = await SoleProprietorship.findById(userId);
    if (!user) user = await Corporation.findById(userId);
    if (!user) user = await PLC.findById(userId);

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

    // Check all models
    let user = await Personal.findById(userId);

    if (!user) user = await SoleProprietorship.findById(userId);
    if (!user) user = await Corporation.findById(userId);
    if (!user) user = await PLC.findById(userId);

    if (!user) return res.redirect("/Personal");

    res.render("finish", { userId, user });
  } catch (err) {
    console.error('Error loading finish page:', err);
    res.status(500).send('Server error');
  }
});










app.get('/email-exists', (req, res) => {
  const email = req.query.email || '';
  res.render('dashboard/emailExists', { email });
});












// middleware/ensureAuthenticated.js
// Usage: const ensureAuthenticated = require('./middleware/ensureAuthenticated');
// then use: app.get('/Inventory', ensureAuthenticated, handler)





app.get('/bastard', (req, res) => {
  try {
    res.render('dashboard/warning/bastard', { user: req.session.user || null, worker: req.session.worker || null });
  } catch (err) {
    console.error('Error rendering login page:', err);
    res.status(500).send('Server error');
  }
});






function ensureWorker(req, res, next) {
  if (req.session && req.session.worker) {
    return next();
  }
  res.redirect("/worker/login"); // redirect to login if not logged in
}




app.get('/login', (req, res) => {
  try {
    const redirect = req.query.redirect || '/Dashboard';
    res.render('dashboard/login', { redirect });
  } catch (err) {
    console.error('Error rendering login page:', err);
    res.status(500).send('Server error');
  }
});

app.get('/employee/repons/auth/login', (req, res) => {
  try {
    const redirect = req.query.redirect || '/Dashboard';
    res.render('dashboard/worker/workerlog', { redirect });
  } catch (err) {
    console.error('Error rendering login page:', err);
    res.status(500).send('Server error');
  }
});





















const { ensureAuthenticated } = require('./middleware/auth');

app.get("/Dashboard", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ userId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }

    console.log("Dashboard recipientId:", recipientId);
    console.log("Company info:", companyinfo);

    // ✅ Fetch data
    const inventoryItems = await Inventory.find({ recipientId }).sort({ date: -1 });
    const salesItems = await Sales.find({ recipientId });
    const expenses = await Expense.find({ recipientId }).sort({ createdAt: -1 });

    // Totals
    const totalInventory = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalSales = salesItems.reduce((sum, sale) => sum + sale.quantity, 0);

    const salesPercentage = totalInventory > 0
      ? Math.round((totalSales / totalInventory) * 100)
      : 0;

    // Today’s date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaySales = await Sales.find({
      recipientId,
      date: { $gte: todayStart, $lte: todayEnd }
    }).sort({ date: -1 }).limit(3);

    const todayExpenses = await Expense.find({
      recipientId,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    }).sort({ date: -1 }).limit(3);

    const totalSalesAmountToday = todaySales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalExpenseAmountToday = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const grossProfitToday = totalSalesAmountToday - totalExpenseAmountToday;
    const grossProfitPercentage = totalSalesAmountToday > 0
      ? Math.round((grossProfitToday / totalSalesAmountToday) * 100)
      : 0;

    const lossPercentage = totalSalesAmountToday > 0
      ? Math.round((totalExpenseAmountToday / totalSalesAmountToday) * 100)
      : 0;

    // Weekly Sales
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);

    const weeklySales = await Sales.find({
      recipientId,
      date: { $gte: oneWeekAgo, $lte: new Date() }
    });

    const weeklyData = [0, 0, 0, 0, 0, 0, 0];
    weeklySales.forEach(sale => {
      const day = new Date(sale.date).getDay();
      weeklyData[day] += sale.amount;
    });

    const weeklySalesData = [
      weeklyData[1], weeklyData[2], weeklyData[3], weeklyData[4],
      weeklyData[5], weeklyData[6], weeklyData[0],
    ];

    res.render("dashboard/dashboard", {
      user: req.session.user || null,
      worker: req.session.worker || null,
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
    console.error("Error loading dashboard page:", err);
    res.status(500).send("Server error");
  }
});



// ================== FINNHUB WEBSOCKET ==================
let ws;
function setupFinnhubWebsocket() {
  ws = new WebSocket(FINNHUB_WS);

  ws.on("open", () => {
    ws.send(JSON.stringify({ type: "subscribe", symbol: "AAPL" }));
    ws.send(JSON.stringify({ type: "subscribe", symbol: "TSLA" }));
  });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      // console.log("📊 WS Data:", msg);
    } catch (err) {
      console.error("❌ WS parse error:", err);
    }
  });

  ws.on("error", (err) => {
    console.error("⚠️ WS error:", err);
  });

  ws.on("close", () => {
    setTimeout(setupFinnhubWebsocket, 5000);
  });
}

setupFinnhubWebsocket();

// ================== FETCH CANDLE DATA (Yahoo Finance) ==================
async function fetchCandles(symbol, period = '1h', interval = '5m') {
  try {
    console.log(`📈 Fetching candles for ${symbol}...`);
    const queryOptions = { period, interval, /* includePrePost: false */ };
    const resp = await yahooFinance.historical(`${symbol}`, queryOptions);
    console.log(`✅ ${symbol} candle data received (${resp.length || 0} points)`);
    return {
      t: resp.map(d => Math.floor(d.date.getTime() / 1000)), // timestamps
      c: resp.map(d => d.close), // closes
      // Add o/h/l/v if needed for full candles
    };
  } catch (err) {
    console.error(`❌ Candle fetch failed for ${symbol}:`, err.message);
    return null;
  }
}

// ================== FETCH NEWS (NewsAPI.org) ==================
async function fetchNews(limit = 5) {
  try {
    console.log("📰 Fetching market news...");
    if (!process.env.NEWSAPI_KEY) {
      console.warn("⚠️ No NEWSAPI_KEY; using static news");
      return staticNews();
    }
    const resp = await axios.get(NEWSAPI_URL, {
      params: {
        category: 'business',
        country: 'us',
        pageSize: limit,
        apiKey: process.env.NEWSAPI_KEY,
      },
    });
    console.log(`✅ News fetched (${resp.data.articles?.length || 0} items)`);
    return resp.data.articles
      .filter(article => new Date(article.publishedAt) > Date.now() - 24 * 60 * 60 * 1000) // Last 24h
      .slice(0, limit)
      .map(article => ({
        title: article.title,
        description: article.description || 'No details available.'
      }));
  } catch (err) {
    console.error("❌ News fetch failed:", err.message);
    return staticNews(); // Fallback
  }
}

// Static fallback news (from recent headlines, Oct 2025)
function staticNews() {
  return [
    { title: "Dow rallies 300 points to record as Wall Street looks past shutdown fears", description: "S&P 500 ekes out new high amid government shutdown concerns." },
    { title: "Goldman Sachs warns of stock market drawdown ahead", description: "CEO David Solomon: 'People won’t feel good' if volatility spikes." },
    { title: "Elon Musk calls for Netflix boycott", description: "Tesla CEO urges followers to cancel subscriptions over content issues." },
    { title: "Amazon's cloud and ad growth underappreciated, says Goldman", description: "AWS tailwinds could drive earnings surprises this quarter." },
    { title: "Tesla sets EV delivery record ahead of tax credit end", description: "Q3 surge led by U.S. incentives; Supercharger installs hit new high." }
  ];
}

// ================== FETCH PERFORMANCE METRICS (Static + Yahoo) ==================
async function fetchPerformanceMetrics() {
  try {
    console.log("📊 Fetching performance metrics...");

    // CPI: Latest from BLS (Aug 2025: 2.9% YoY)
    const latestCPI = 2.9;

    // Industry Benchmark: S&P 500 (fetch latest or static ~5800, scaled /1000 = 5.80)
    const sp500 = await yahooFinance.quote('^GSPC');
    const sp500Value = sp500.regularMarketPrice || 5800;
    const benchmark = (sp500Value / 1000).toFixed(2);

    // Total Yield: AAPL/TSLA avg (AAPL ~0.40%, TSLA 0%; scaled *20 for ~8%)
    const [aapl, tsla] = await Promise.all([
      yahooFinance.quote('AAPL'),
      yahooFinance.quote('TSLA')
    ]);
    const aaplYield = aapl.dividendYield || 0.004; // ~0.40%
    const tslaYield = tsla.dividendYield || 0;
    const avgYield = ((aaplYield + tslaYield) / 2) * 20 * 100; // Scaled to match ~8.18
    const totalYield = Math.max(avgYield, 8.18).toFixed(2); // Floor at realistic

    console.log(`✅ Metrics fetched: CPI=${latestCPI}, Benchmark=${benchmark}, Yield=${totalYield}`);
    return { cpi: latestCPI.toFixed(2), benchmark, yield: totalYield };
  } catch (err) {
    console.error("❌ Metrics fetch failed:", err.message);
    // Static fallback (realistic Oct 2025 values)
    return { cpi: '2.90', benchmark: '5.80', yield: '8.18' };
  }
}

// ================== UPDATED MARKET TRENDS API ==================
app.get("/api/market-trends", async (req, res) => {
  console.log("📡 /api/market-trends requested...");
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;

    const [aapl, tsla, news] = await Promise.all([
      fetchCandles("AAPL"),
      fetchCandles("TSLA"),
      fetchNews(5),
    ]);

    console.log("✅ All data fetched successfully");
    res.json({
      candles: {
        AAPL: aapl || { c: [230.50] }, // Fallback single close (Oct 2025 est.)
        TSLA: tsla || { c: [436.00] }, // From recent data
      },
      news,
    });
  } catch (err) {
    console.error("❌ Error in /market-trends:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ================== PERFORMANCE METRICS API ==================
app.get("/api/performance-metrics", async (req, res) => {
  console.log("📡 /api/performance-metrics requested...");
  try {
    const metrics = await fetchPerformanceMetrics();
    res.json(metrics);
  } catch (err) {
    console.error("❌ Error in /performance-metrics:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});






app.get('/Inventory', ensureAuthenticated, async (req, res) => {
  try {
    let recipientId;

    if (req.session.user) {
      // ✅ Superadmin / Owner
      recipientId = req.session.user._id;
    } else if (req.session.worker) {
      // ✅ Worker → use their admin's ID
      recipientId = req.session.worker.adminId;
    } else {
      return res.redirect('/login'); // fallback if no session
    }

    let companyinfo = null; // ✅ Always define this

    if (req.session.user) {
      // Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // Worker logged in, use adminId
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ userId: req.session.worker.adminId });
    }


    // Fetch inventory & sales with recipientId
    const inventoryItems = await Inventory.find({ recipientId }).sort({ addedDate: -1 });
    const salesItems = await Sales.find({ recipientId });

    // Total Inventory Value
    const totalInventoryValue = inventoryItems.reduce((sum, item) => {
      return sum + (item.scost * item.currentquantity);
    }, 0);

    // Total Items Count
    const totalItemsCount = inventoryItems.reduce((sum, item) => {
      return sum + item.currentquantity;
    }, 0);

    // Top Selling Item
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
      user: req.session.user || req.session.worker,
      worker: req.session.worker || null, // the staff
      inventory: inventoryItems,

      companyinfo, // ✅ now it's always defined
      totalInventoryValue,
      totalItemsCount,
      topSellingItem
    });

  } catch (err) {
    console.error('Error loading inventory page:', err);
    res.status(500).send('Server error');
  }
});




// ✅ Inventory Tracking Page
app.get("/inventorytracking", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ userId: req.session.worker.adminId });
    }

    if (!recipientId) {
      return res.status(403).send("Unauthorized: No valid session");
    }

    const items = await Inventory.find({ recipientId });

    const formatted = items.map((item, index) => {
      const status =
        item.currentquantity === 0
          ? "Out of Stock"
          : item.currentquantity <= 10
            ? "Low Stock"
            : "In Stock";

      return {
        id: `ITM${(index + 1).toString().padStart(3, "0")}`,
        name: item.itemName,
        category: item.category,
        quantity: item.currentquantity,
        unitPrice: item.scost,
        reorderLevel: 10,
        supplier: item.supplier,
        status,
        lastUpdated: item.addedDate,
      };
    });

    // KPIs
    const totalItems = formatted.length;
    const totalQuantity = formatted.reduce((sum, i) => sum + i.quantity, 0);
    const lowStockCount = formatted.filter((i) => i.status === "Low Stock").length;
    const outOfStockCount = formatted.filter((i) => i.status === "Out of Stock").length;

    // ✅ Mock weekly data or calculate it from sales table if available
    const weeklySalesData = [500, 750, 1000, 900, 1200, 800, 950]; // Example placeholder

    res.render("dashboard/inventory tracking", {
      user: req.session.user || req.session.worker,
      worker: req.session.worker || null,
      companyinfo,
      inventory: formatted,
      totalItems,
      totalQuantity,
      lowStockCount,
      outOfStockCount,
      weeklySalesData, // ✅ Add this so EJS finds it
    });
  } catch (err) {
    console.error("Error loading inventory tracking page:", err);
    res.status(500).send("Server error");
  }
});







app.get('/inventoryforecast', ensureAuthenticated, async (req, res) => {
  try {
    const products = await Inventory.find({});

    // Summary quantities
    const categoryMap = {};
    products.forEach(item => {
      const name = item.itemName.trim();
      categoryMap[name] = (categoryMap[name] || 0) + item.currentquantity;
    });

    let recipientId = null;
    let companyinfo = null; // ✅ Always define this

    if (req.session.user) {
      // Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // Worker logged in, use adminId
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ userId: req.session.worker.adminId });
    }

    if (!recipientId) {
      return res.status(403).send("Unauthorized: No valid session");
    }


    const inventoryNames = Object.keys(categoryMap);
    const inventoryQuantities = Object.values(categoryMap);
    const totalQuantity = inventoryQuantities.reduce((acc, qty) => acc + qty, 0);
    const averageQuantity = inventoryQuantities.length > 0 ? totalQuantity / inventoryQuantities.length : 0;

    const forecastDays = 7;
    const projectedUsage = Array.from({ length: forecastDays }, (_, i) => ({
      day: `Day ${i + 1}`,
      forecast: averageQuantity - (i * averageQuantity * 0.05)
    }));

    res.render('dashboard/inventory forecast', {
      user: req.session.user,
      worker: req.session.worker || null,
      products,
      companyinfo,
      inventoryNames,
      inventoryQuantities,
      totalQuantity,
      averageQuantity,
      projectedUsage,
      forecastResults: null // no results yet on GET
    });
  } catch (err) {
    console.error('Error loading inventory forecast page:', err);
    res.status(500).send('Server error');
  }
});

app.post('/inventoryforecast', ensureAuthenticated, async (req, res) => {
  try {
    const {
      productId,
      forecastPeriod,
      currentStock,
      leadTime,
      safetyStock,
      historicalSales,
      orderCost,
      holdingCost
    } = req.body;

    const product = await Inventory.findById(productId);
    if (!product) return res.status(404).send('Product not found');

    const salesArray = historicalSales?.trim()
      ? historicalSales.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x))
      : Array.from({ length: 30 }, () => Math.max(0, Math.round(10 + (Math.random() - 0.5) * 10 * 0.4)));

    const totalSales = salesArray.reduce((sum, sales) => sum + sales, 0);
    const salesVelocity = totalSales / salesArray.length;
    const daysCoverage = Math.floor(currentStock / salesVelocity);

    const maxDailySales = Math.max(...salesArray);
    const avgDailySales = salesVelocity;
    const maxLeadTime = parseInt(leadTime) + 2;
    const calculatedSafetyStock = Math.ceil((maxDailySales * maxLeadTime) - (avgDailySales * leadTime));

    const finalSafetyStock = safetyStock ? parseInt(safetyStock) : calculatedSafetyStock;
    const reorderPoint = Math.ceil((salesVelocity * leadTime) + finalSafetyStock);
    const reorderDay = Math.max(0, daysCoverage - leadTime);
    const forecastedDemand = Math.ceil(salesVelocity * forecastPeriod);
    const reorderQuantity = Math.max(0, forecastedDemand - currentStock + finalSafetyStock);

    const annualDemand = salesVelocity * 365;
    const unitCost = product.bcost || 100;
    const hCost = (holdingCost / 100) * unitCost;
    const eoq = Math.ceil(Math.sqrt((2 * annualDemand * orderCost) / hCost));



    // Get all inventory for display again
    const products = await Inventory.find({});
    const categoryMap = {};
    products.forEach(item => {
      const name = item.itemName.trim();
      categoryMap[name] = (categoryMap[name] || 0) + item.currentquantity;
    });
    const inventoryNames = Object.keys(categoryMap);
    const inventoryQuantities = Object.values(categoryMap);
    const totalQuantity = inventoryQuantities.reduce((acc, qty) => acc + qty, 0);
    const averageQuantity = inventoryQuantities.length > 0 ? totalQuantity / inventoryQuantities.length : 0;
    const forecastDays = 7;
    const projectedUsage = Array.from({ length: forecastDays }, (_, i) => ({
      day: `Day ${i + 1}`,
      forecast: averageQuantity - (i * averageQuantity * 0.05)
    }));

    res.render('dashboard/inventory forecast', {
      user: req.session.user,
      products,
      inventoryNames,
      inventoryQuantities,
      totalQuantity,
      averageQuantity,
      projectedUsage,
      forecastResults: {
        salesVelocity: salesVelocity.toFixed(1),
        daysCoverage,
        reorderPoint,
        reorderQuantity,
        reorderDay,
        safetyStock: finalSafetyStock,
        eoq,
        forecastedDemand
      }
    });
  } catch (err) {
    console.error('Forecast error:', err);
    res.status(500).send('Server error');
  }
});

































app.get('/sales', ensureAuthenticated, async (req, res) => {
  try {
    let recipientId;

    if (req.session.user) {
      // ✅ Superadmin / Owner
      recipientId = req.session.user._id;
    } else if (req.session.worker) {
      // ✅ Worker → use their admin's ID
      recipientId = req.session.worker.adminId;
    } else {
      return res.redirect('/login'); // fallback if no session
    }

    let companyinfo = null; // ✅ Always define this

    if (req.session.user) {
      // Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // Worker logged in, use adminId
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ userId: req.session.worker.adminId });
    }

    // fetch inventory & sales limited to this recipient
    const inventoryItems = await Inventory.find({ recipientId }).sort({ addedDate: -1 });
    const salesItemsRaw = await Sales.find({ recipientId }).sort({ date: -1 });

    // compute today's range and daily totals
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaySales = await Sales.find({
      recipientId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const totalSalesToday = todaySales.length;
    const totalAmountToday = todaySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

    // map raw sales into safer display objects
    const salesItems = salesItemsRaw.map(sale => ({
      _id: sale._id,
      customerName: sale.customerName || sale.custormername || sale.custumername || '', // try common variants
      paymentMethod: sale.paymentMethod || '',
      description: sale.description || sale.discription || '',
      date: sale.date,
      totalAmount: sale.totalAmount || 0,
      items: Array.isArray(sale.items) ? sale.items : []
    }));

    // optional: build a category summary if you need it (was in original code)
    // const categoryMap = {};
    // inventoryItems.forEach(item => {
    //   const name = (item.itemName || '').trim();
    //   if (!name) return;
    //   categoryMap[name] = (categoryMap[name] || 0) + (item.currentquantity || 0);
    // });


    // render with consistent variable names for the template
    res.render('dashboard/sales', {
      user: req.session.user || req.session.worker,
      worker: req.session.worker || null,
      companyinfo,
      inventory: inventoryItems,
      salesItems,               // <<< now consistent name
      totalSalesToday,
      totalAmountToday,
      // categorySummary: categoryMap  // optional if you need it in template
    });
  } catch (err) {
    console.error('❌ Error loading sales page:', err);
    res.status(500).send('Server error');
  }
});




app.get("/print/invoice/:id", ensureAuthenticated, async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id).populate("items.itemId");
    if (!sale) return res.status(404).send("Sale not found");
    res.render("dashboard/printInvoice", { sale });
  } catch (err) {
    console.error("🧾 Invoice print error:", err);
    res.status(500).send("Server error");
  }
});




// --- Sale history (filters + optional JSON response) ---
app.get('/salehistory', ensureAuthenticated, async (req, res) => {
  try {
    // Determine who we should query for (admin or worker)
    let recipientId;

    if (req.session.user) {
      // ✅ Superadmin / Owner
      recipientId = req.session.user._id;
    } else if (req.session.worker) {
      // ✅ Worker → use their admin's ID
      recipientId = req.session.worker.adminId;
    } else {
      return res.redirect('/login'); // fallback if no session
    }

    let companyinfo = null; // ✅ Always define this

    if (req.session.user) {
      // Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // Worker logged in, use adminId
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ userId: req.session.worker.adminId });
    }

    const {
      dateFrom,
      dateTo,
      category,
      rep,
      customer,
      minAmount,
      maxAmount
    } = req.query;

    const filters = { recipientId };

    // date filtering
    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) filters.date.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filters.date.$lte = end;
      }
    }

    if (category) filters.item = category;
    if (rep) filters.salesRep = rep;
    if (customer) filters.customer = new RegExp(customer, 'i');

    if (minAmount || maxAmount) {
      filters.amount = {};
      if (minAmount) filters.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filters.amount.$lte = parseFloat(maxAmount);
    }

    const salesitem = await Sales.find(filters).sort({ date: -1 });

    // distinct categories for dropdown using recipientId
    const categories = await Sales.distinct('item', { recipientId });

    // If client accepts JSON (AJAX), return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(salesitem);
    }

    // Render page and pass context for templates
    res.render('dashboard/salehistory', {
      user: req.session.user || null,
      worker: req.session.worker || null,
      companyinfo,
      salesitem,
      categories
    });
  } catch (err) {
    console.error('Error loading filtered sales:', err);
    res.status(500).send('Server error');
  }
});





app.get("/api/sales-chart-data", ensureAuthenticated, async (req, res) => {
  const { type } = req.query;
  const recipientId = req.session.user._id;

  let groupFormat;
  let labelFormat;

  if (type === "daily") {
    groupFormat = {
      year: { $year: "$date" },
      month: { $month: "$date" },
      day: { $dayOfMonth: "$date" }
    };
    labelFormat = d => `${d.day}/${d.month}/${d.year}`;
  } else if (type === "monthly") {
    groupFormat = {
      year: { $year: "$date" },
      month: { $month: "$date" }
    };
    labelFormat = d => `${d.month}/${d.year}`;
  } else if (type === "quarterly") {
    groupFormat = {
      year: { $year: "$date" },
      quarter: { $ceil: { $divide: [{ $month: "$date" }, 3] } }
    };
    labelFormat = d => `Q${d.quarter} ${d.year}`;
  } else if (type === "yearly") {
    groupFormat = {
      year: { $year: "$date" }
    };
    labelFormat = d => `${d.year}`;
  } else {
    return res.status(400).json({ error: "Invalid type" });
  }

  // 1. Chart Aggregation
  const salesData = await Sales.aggregate([
    { $match: { recipientId: new mongoose.Types.ObjectId(recipientId) } },
    {
      $group: {
        _id: groupFormat,
        totalSales: { $sum: "$amount" },
        count: { $sum: 1 },
        avg: { $avg: "$amount" },
        categories: { $push: "$category" }
      }
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1,
        "_id.quarter": 1
      }
    }
  ]);

  const labels = salesData.map(d => labelFormat(d._id));
  const values = salesData.map(d => d.totalSales);
  const count = salesData.reduce((sum, d) => sum + d.count, 0);
  const total = salesData.reduce((sum, d) => sum + d.totalSales, 0);
  const avg = count > 0 ? total / count : 0;

  // 2. Top Category
  const allCategories = salesData.flatMap(d => d.categories);
  const categoryCounts = allCategories.reduce((acc, cat) => {
    if (cat) acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, '-');

  // 3. ✅ Top Selling Item from Inventory-based logic
  const inventoryItems = await Inventory.find({ recipientId });
  const salesItems = await Sales.find({ recipientId });

  const itemSalesMap = {};
  salesItems.forEach(sale => {
    const name = sale.item;
    if (typeof name === 'string' && name.trim() !== '') {
      if (!itemSalesMap[name]) itemSalesMap[name] = 0;
      itemSalesMap[name] += sale.quantity || 0;
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

  console.log("Top Selling Item:", topSellingItem);

  res.json({
    labels,
    values,
    total,
    count,
    avg,
    topCategory,
    topSellingItem
  });
});


// New /api/sales endpoint
app.get('/api/sales', async (req, res) => {
  const recipientId = req.session.user?._id;
  if (!recipientId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const sales = await Sales.find({ recipientId }).lean();
    console.log("✅ Fetched sales:", sales.length);
    res.json(sales);
  } catch (err) {
    console.error("❌ Error fetching sales:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// New /api/sales/:id endpoint
app.get('/api/sales/:id', async (req, res) => {
  const recipientId = req.session.user?._id;
  if (!recipientId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const sale = await Sales.findOne({ _id: req.params.id, recipientId }).lean();
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.json(sale);
  } catch (err) {
    console.error("❌ Error fetching sale:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// New /api/sales/:id/generate-invoice endpoint
app.patch('/api/sales/:id/generate-invoice', async (req, res) => {
  const recipientId = req.session.user?._id;
  if (!recipientId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await Sales.updateOne(
      { _id: req.params.id, recipientId },
      { $set: { invoiceStatus: 'Generated' } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Sale not found" });
    }
    console.log(`✅ Invoice generated for sale ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error generating invoice:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});




// ---------- Expenses page (staff/admin-aware) ----------
// ---------- Expenses page (staff/admin-aware with companyinfo) ----------
app.get("/Expenses", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ userId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }

    console.log("Expenses recipientId:", recipientId);
    console.log("Company info:", companyinfo);

    // 🔹 Fetch all expenses for recipient
    const expenses = await Expense.find({ recipientId })
      .sort({ createdAt: -1 })

    // 🔹 Today’s expenses
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayExpenses = await Expense.find({
      recipientId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    })
      .sort({ createdAt: -1 })
      .populate("companyinfo");

    // 🔹 Budgets for this recipient
    const budgets = await Budget.find({ recipientId }).sort({ startDate: -1 });
    const availableBudgets = budgets.filter((b) => Number(b.currentamount) > 0);

    // 🔹 Totals
    const totalExpensesToday = todayExpenses.length;
    const totalAmountToday = todayExpenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );

    // 🔹 Build category summary (for chart/analysis)
    const category = expenses.map((exp) => ({
      type: "expense",
      amount: Number(exp.amount || 0),
      date: exp.createdAt,
      company: exp.companyinfo ? exp.companyinfo.name : "Unknown",
    }));

    // 🔹 Render page
    res.render("dashboard/expenses", {
      user: req.session.user || null,
      worker: req.session.worker || null,
      companyinfo,              // ✅ same setup as Dashboard
      expenses,
      todayExpenses,
      totalExpensesToday,
      totalAmountToday: totalAmountToday.toLocaleString(),
      budgets: availableBudgets,
      date: new Date().toDateString(),
      category,
    });
  } catch (err) {
    console.error("Error loading expenses page:", err);
    res.status(500).send("Server error");
  }
});



// 📊 API endpoint to provide chart data dynamically (with logging)
app.get("/api/expenses/chart-data", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;

    if (req.session.user) {
      recipientId = req.session.user._id;
      console.log("👤 Logged in as user:", recipientId);
    } else if (req.session.worker) {
      recipientId = req.session.worker.adminId;
      console.log("👷 Logged in as worker. Admin ID:", recipientId);
    } else {
      console.log("⚠️ Unauthorized access to chart data");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("📦 Fetching expenses for:", recipientId);
    const expenses = await Expense.find({ recipientId });
    console.log(`📊 Found ${expenses.length} expenses`);

    // 🔹 Group by category
    const categoryTotals = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    console.log("🗂 Category Totals:", categoryTotals);

    // 🔹 Group by month
    const monthTotals = Array(12).fill(0);
    expenses.forEach(exp => {
      const month = new Date(exp.dateOfExpense).getMonth();
      monthTotals[month] += exp.amount;
    });
    console.log("📅 Monthly Totals:", monthTotals);

    const responseData = {
      categoryLabels: Object.keys(categoryTotals),
      categoryData: Object.values(categoryTotals),
      monthlyData: monthTotals,
    };

    console.log("✅ Sending chart data:", responseData);
    res.json(responseData);
  } catch (err) {
    console.error("❌ Chart data error:", err);
    res.status(500).json({ error: "Server error" });
  }
});





// Expense submission route
app.post('/Expenses/submit', ensureAuthenticated, async (req, res) => {
  const { fullName, department, dateOfExpense, category, amount, description } = req.body;
  const userId = req.session.user._id;

  try {
    // Validate input
    if (!fullName || !department || !dateOfExpense || !category || !amount || !description) {
      return res.status(400).render('dashboard/expense', {
        user: req.session.user,
        error: 'All fields except receipt are required',
        recentExpenses: await getRecentExpenses(userId)
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).render('dashboard/expense', {
        user: req.session.user,
        error: 'Amount must be a positive number',
        recentExpenses: await getRecentExpenses(userId)
      });
    }

    // Check category limit
    const limit = await CategoryLimit.findOne({ category });
    if (!limit) {
      return res.status(400).render('dashboard/expense', {
        user: req.session.user,
        error: `Invalid category: ${category}`,
        recentExpenses: await getRecentExpenses(userId)
      });
    }

    // Reimbursement rule: Auto-reject if over limit
    const status = parsedAmount <= limit.maxAmount ? 'Pending' : 'Rejected';
    const receiptPath = req.file ? req.file.path : null;

    // Save expense
    const expense = new Expense({
      userId,
      fullName,
      department,
      dateOfExpense: new Date(dateOfExpense),
      category,
      amount: parsedAmount,
      description,
      receipt: receiptPath,
      status
    });
    await expense.save();

    // Notify user via Socket.io
    req.io.to(userId.toString()).emit('expense_status', {
      message: `Expense submitted: ${status}`,
      status
    });

    res.render('dashboard/expense', {
      user: req.session.user,
      success: 'Expense submitted successfully!',
      recentExpenses: await getRecentExpenses(userId)
    });
  } catch (err) {
    console.error('Error submitting expense:', err);
    res.status(500).render('dashboard/expense', {
      user: req.session.user,
      error: 'Failed to submit expense',
      recentExpenses: await getRecentExpenses(userId)
    });
  }
});


// Admin view for approving/rejecting expenses
app.get('/Expenses/admin', ensureAuthenticated, async (req, res) => {
  if (!req.session.user.isAdmin) {
    return res.status(403).render('dashboard/expense', {
      user: req.session.user,
      error: 'Unauthorized access',
      recentExpenses: await getRecentExpenses(req.session.user._id)
    });
  }

  try {
    const expenses = await Expense.find({ status: 'Pending' })
      .populate('userId', 'firstname lastname')
      .lean();
    res.render('dashboard/admin_expenses', { user: req.session.user, expenses });
  } catch (err) {
    console.error('Error loading admin expenses:', err);
    res.status(500).render('dashboard/admin_expenses', {
      user: req.session.user,
      error: 'Failed to load expenses',
      expenses: []
    });
  }
});

// Admin action to approve/reject
app.post('/Expenses/admin/:id', ensureAuthenticated, async (req, res) => {
  if (!req.session.user.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  const { action } = req.body; // 'approve' or 'reject'

  try {
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    expense.status = action === 'approve' ? 'Approved' : 'Rejected';
    await expense.save();

    // Notify user
    req.io.to(expense.userId.toString()).emit('expense_status', {
      message: `Your expense for ${expense.category} has been ${expense.status.toLowerCase()}`,
      status: expense.status
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error processing expense:', err);
    res.status(500).json({ error: 'Failed to process expense' });
  }
});

// Helper function to get recent expenses
async function getRecentExpenses(userId) {
  return await Expense.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('category amount status createdAt')
    .lean();
}




// ---------- View all expenses (analytics view) ----------
app.get("/viewallexpenses", ensureAuthenticated, async (req, res) => {
  try {
    // recipient determined from admin or worker
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ userId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }

    const expenses = await Expense.find({ recipientId }).sort({ createdAt: -1 }).lean();

    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalTransactions = expenses.length;
    const averageExpense = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    res.render("dashboard/viewallexpenses", {
      user: req.session.user || null,
      worker: req.session.worker || null,
      companyinfo,         // ✅ consistent with schema
      totalAmount,
      totalTransactions,
      averageExpense,
      expenses
    });
  } catch (err) {
    console.error('Error rendering view all expenses page:', err);
    res.status(500).send('Server error');
  }
});



// 📊 API endpoint for Pie & Line charts
app.get("/api/expenses/pie-line-data", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;

    if (req.session.user) {
      recipientId = req.session.user._id;
    } else if (req.session.worker) {
      recipientId = req.session.worker.adminId;
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch expenses for the current user/admin
    const expenses = await Expense.find({ recipientId });

    // 🔹 Group by category for Pie Chart
    const categoryTotals = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    // 🔹 Group by month for Line Chart
    const monthTotals = Array(12).fill(0);
    expenses.forEach(exp => {
      const month = new Date(exp.dateOfExpense).getMonth();
      monthTotals[month] += exp.amount;
    });

    res.json({
      categoryLabels: Object.keys(categoryTotals),
      categoryData: Object.values(categoryTotals),
      monthlyData: monthTotals,
    });
  } catch (err) {
    console.error("❌ Pie/Line chart data error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// ---------- API endpoints (JSON) ----------
app.get("/api/expenses/summary", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId;
    if (req.session.user) recipientId = req.session.user._id;
    else if (req.session.worker) recipientId = req.session.worker.adminId;
    else return res.status(401).json({ error: 'Unauthorized' });

    const expenses = await Expense.find({ recipientId });

    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalTransactions = expenses.length;
    const averageExpense = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    res.json({
      totalAmount,
      totalTransactions,
      averageExpense
    });
  } catch (err) {
    console.error('Error loading expense summary:', err);
    res.status(500).json({ error: "Failed to load summary" });
  }
});

app.get("/api/expenses/all", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId;
    if (req.session.user) recipientId = req.session.user._id;
    else if (req.session.worker) recipientId = req.session.worker.adminId;
    else return res.status(401).json({ error: 'Unauthorized' });

    const expenses = await Expense.find({ recipientId }).sort({ createdAt: -1 }).lean();
    res.json({ expenses });
  } catch (err) {
    console.error("Error loading expenses:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


















// Transaction Page Route
app.get("/Transaction", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;
    const { type } = req.query;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }

    console.log("Transaction recipientId:", recipientId);
    console.log("Company info:", companyinfo);

    // 🔹 Create reusable "today" date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 🔹 Fetch data with companyinfo populated
    const [todayProductions, todaySales, todayExpenses] = await Promise.all([
      Production.find({
        recipientId,
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),
      Sales.find({
        recipientId,
        date: { $gte: todayStart, $lte: todayEnd },
      }),
      Expense.find({
        recipientId,
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),
    ]);

    // 🔹 Totals
    const totalSales = todaySales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalProduction = todayProductions.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalTransactions =
      todaySales.length + todayExpenses.length + todayProductions.length;

    // 🔹 Render
    res.render("dashboard/transaction", {
      user: req.session.user || null,
      worker: req.session.worker || null,
      companyinfo,         // ✅ consistent with schema
      sales: todaySales,
      expenses: todayExpenses,
      production: todayProductions,
      selectedType: type || null,
      totalSales,
      totalProduction,
      totalExpenses,
      totalTransactions,
    });
  } catch (err) {
    console.error("Error loading transaction page:", err);
    res.status(500).send("Server error");
  }
});




app.get('/Profit', ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect('/login');
    }

    console.log("Profit recipientId:", recipientId);
    console.log("Company info:", companyinfo);

    // 🔹 Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 🔹 Fetch sales, expenses, production with companyinfo populated
    const [sales, expenses, production] = await Promise.all([
      Sales.find({ recipientId, date: { $gte: todayStart, $lte: todayEnd } }),
      Expense.find({ recipientId, createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Production.find({ recipientId, createdAt: { $gte: todayStart, $lte: todayEnd } }),
    ]);

    // 🔹 Calculate totals
    const salesTotal = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const productionTotal = production.reduce((sum, p) => sum + (p.amount || 0), 0);

    const profit = salesTotal; // ✅ currently treating profit as sales only
    const loss = expenseTotal + productionTotal;

    // 🔹 Category array (for charting/summary)
    const category = [
      ...sales.map(s => ({
        type: 'sales',
        amount: Number(s.amount || 0),
        date: s.date,
      })),
      ...expenses.map(e => ({
        type: 'expenses',
        amount: Number(e.amount || 0),
        date: e.createdAt,
      })),
      ...production.map(p => ({
        type: 'production',
        amount: Number(p.amount || 0),
        date: p.createdAt,
      }))
    ];

    // 🔹 Render page
    res.render('dashboard/profit', {
      user: req.session.user || null,
      worker: req.session.worker || null,
      companyinfo,   // ✅ now included
      salesTotal,
      expenseTotal,
      productionTotal,
      date: new Date().toDateString(),
      profit,
      sales,
      expenses,
      production,
      category,
      loss
    });

  } catch (err) {
    console.error('Error loading profit page:', err);
    res.status(500).send('Server Error');
  }
});




// GET production page











app.get('/Production', ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect('/login');
    }

    console.log("Production recipientId:", recipientId);
    console.log("Company info:", companyinfo);

    // 🔹 Fetch ALL productions for recipient (for categories/overview)
    const allProductions = await Production.find({ recipientId });

    const uniqueCategories = [...new Set(allProductions.map(p => p.category.toLowerCase()))];

    // 🔹 Today's date range
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // 🔹 Fetch today’s productions only
    const productions = await Production.find({
      recipientId,
      createdAt: { $gte: start, $lte: end },
    });

    console.log("Productions:", productions);

    // 🔹 Calculate totals
    const totalProductionAmount = productions.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const sortedProductions = productions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const summary = {
      totalEntries: sortedProductions.length,
      totalCost: sortedProductions.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      categories: [...new Set(sortedProductions.map(p => p.category))],
      all: sortedProductions
    };

    // 🔹 Breakdown by category
    const categoryBreakdown = {};
    productions.forEach(p => {
      if (!categoryBreakdown[p.category]) {
        categoryBreakdown[p.category] = 0;
      }
      categoryBreakdown[p.category] += Number(p.amount || 0);
    });

    // 🔹 Render page
    res.render('dashboard/production', {
      user: req.session.user || null,
      worker: req.session.worker || null,
      companyinfo,             // ✅ already available
      summary,
      categoryBreakdown,
      sortedProductions,
      totalProductionAmount,
      allProductions,
      uniqueCategories
    });

  } catch (err) {
    console.error('Error loading production page:', err);
    res.status(500).send('Server error');
  }
});


























app.get("/accountpayable", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }

    const accountPayables = await AccountsPayable.find({ recipientId }).sort({ createdAt: -1 });

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
      user: req.session.user || null,
      worker: req.session.worker || null,
      companyinfo, // ✅ now included
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















app.get("/accountreceivable", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }

    const receivables = await AccountReceivable.find({ recipientId }).sort({ createdAt: -1 });

    // 🔹 Calculate summary values
    const totalReceivables = receivables.reduce((sum, r) => sum + (r.ramount || 0), 0);

    const collectedAmount = receivables
      .filter(r => r.status === "paid" || r.status === "partially paid")
      .reduce((sum, r) => {
        const paid =
          r.amountPaid != null
            ? r.amountPaid
            : r.status === "paid"
              ? r.ramount
              : 0;
        return sum + paid;
      }, 0);

    const overdueAmount = receivables
      .filter(r => new Date(r.dueDate) < new Date() && r.status !== "paid")
      .reduce((sum, r) => sum + ((r.ramount || 0) - (r.amountPaid || 0)), 0);

    // 🔹 Render
    res.render("dashboard/accountrecievable", {
      user: req.session.user || null,
      worker: req.session.worker || null,
      companyinfo, // ✅ included
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








app.get("/pricedeterminant", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }

    // 🔹 Fetch ALL productions (for categories/overview)
    const allProductions = await Production.find({ recipientId });
    const uniqueCategories = [...new Set(allProductions.map(p => p.category.toLowerCase()))];

    // 🔹 Today’s range
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // 🔹 Today’s productions only
    const productions = await Production.find({
      recipientId,
      createdAt: { $gte: start, $lte: end },
    });

    console.log("Productions:", productions);

    // 🔹 Totals
    const totalProductionAmount = productions.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const sortedProductions = productions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const summary = {
      totalEntries: sortedProductions.length,
      totalCost: sortedProductions.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      categories: [...new Set(sortedProductions.map(p => p.category))],
      all: sortedProductions,
    };

    // 🔹 Render
    res.render("dashboard/pricedetermination", {
      user: req.session.user || null,
      worker: req.session.worker || null,
      companyinfo,              // ✅ included now
      allProductions,
      uniqueCategories,
      summary,
      sortedProductions,
      totalProductionAmount,
      productions,
    });

  } catch (err) {
    console.error("Error loading pricedeterminant page:", err);
    res.status(500).send("Server error");
  }
});









// GET endpoint to fetch product details
app.get('/pricedeterminant/product/:id', ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const productId = req.params.id;

    // 🔹 Fetch the product belonging to this recipient
    const product = await Production.findOne({ _id: productId, recipientId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // 🔹 Prepare response
    const responseData = {
      success: true,
      product: {
        unitPrice: product.unitPrice || 0, // Cost price
        amount: product.amount || 0,       // Total amount
      },
      companyinfo, // ✅ included for context
    };

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching product data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// PUT endpoint to update product details
app.put('/pricedeterminant/product/:id', ensureAuthenticated, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user._id;
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






app.get("/statementofaccount", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Fetch company info
    const companyinfo = await Company.findOne({ reciepientId: userId });

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
        formattedDate: new Date(tx.date).toISOString().split("T")[0],
      };
    }).reverse();

    const businessinfo = await Business.findOne({ reciepientId: userId });
    // === Summary Calculations ===
    let openingBalance = 2450000; // or fetch from DB if saved
    let totalInvoiced = 0;
    let totalPayments = 0;
    let totalCreditNotes = 0;
    let totalExpenses = 0;

    // Sales
    salesitem.forEach((sale) => {
      totalInvoiced += sale.amount;
      totalPayments += sale.amount; // Assuming full payments
    });

    // Expenses
    expenses.forEach((exp) => {
      totalExpenses += exp.amount;
    });

    // Production
    production.forEach((prod) => {
      const net = prod.profit - prod.fees;
      if (net >= 0) {
        totalInvoiced += net;
      } else {
        totalCreditNotes += Math.abs(net);
      }
    });

    const closingBalance =
      openingBalance + totalInvoiced - totalExpenses - totalCreditNotes;

    res.render("dashboard/statement of account.ejs", {
      user: req.session.user,
      worker: req.session.worker || null,
      transactions,
      companyinfo: companyinfo, // 👈 match the lowercase name used in EJS
      businessinfo,
      summary: {
        openingBalance,
        totalInvoiced,
        totalPayments,
        totalCreditNotes,
        closingBalance,
      },
    });

  } catch (err) {
    console.error("Error loading statement of account page:", err);
    res.status(500).send("Server error");
  }
});








app.get("/Assets", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Fetch company info
    const companyinfo = await Company.findOne({ reciepientId: userId });

    // Optionally, include worker info if using worker sessions
    const worker = req.session.worker || null;

    // Fetch all assets
    const allAssets = await Asset.find({ userId }).sort({ createdAt: -1 });

    // Group assets by ledgerType
    const registerAssets = allAssets.filter(a => a.ledgerType === 'Fixed Assets Register');
    const scheduleAssets = allAssets.filter(a => a.ledgerType === 'Fixed Asset Schedule');
    const accountAssets = allAssets.filter(a => a.ledgerType === 'Fixed Asset Accounts');

    res.render("dashboard/Assetms.ejs", {
      user: req.session.user,
      worker,          // Pass worker info to EJS
      companyinfo,     // Pass company info to EJS
      registerAssets,
      scheduleAssets,
      accountAssets
    });

  } catch (error) {
    console.error("Error fetching assets:", error);
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








// Helper to display value positive unless it's a true loss
function displayValue(val, isLoss = false) {
  // If it's a true loss, keep negative
  if (isLoss) return val;
  // Otherwise, always display as positive
  return Math.abs(val);
}

// Cashflow Route
app.get("/cashflow", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    let { start, end } = req.query;

    // Set date range
    let startDate = start ? new Date(start) : new Date("2000-01-01");
    let endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);
    startDate.setHours(0, 0, 0, 0);

    // Fetch company info and worker info
    const companyinfo = await Company.findOne({ reciepientId: userId });
    const worker = req.session.worker || null;

    // Fetch sales, expenses, productions, asset purchases
    const [sales, expenses, productions, assetPurchases] = await Promise.all([
      Sales.find({ recipientId: userId, date: { $gte: startDate, $lte: endDate } }),
      Expense.find({ recipientId: userId, createdAt: { $gte: startDate, $lte: endDate } }),
      Production.find({ recipientId: userId, createdAt: { $gte: startDate, $lte: endDate } }),
      Asset.find({ userId, purchaseDate: { $gte: startDate, $lte: endDate } })
    ]);

    // --- Calculations ---
    const netIncomeRaw = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0) -
      expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const depreciationRaw = assetPurchases.reduce((sum, a) => sum + (a.depreciation || 0), 0);
    const changeInWorkingCapitalRaw = 1000; // placeholder
    const investmentIncomeRaw = 800; // placeholder
    const loanReceivedRaw = 3000; // placeholder
    const dividendsPaidRaw = 1200; // placeholder
    const leasingValueRaw = 2500; // placeholder
    const notes = "Generated based on available data.";

    const netCashFromOperatingRaw = netIncomeRaw + depreciationRaw + changeInWorkingCapitalRaw;
    const purchaseOfEquipmentRaw = assetPurchases.reduce((sum, a) => sum + (a.amount || 0), 0);
    const netCashFromInvestingRaw = investmentIncomeRaw - purchaseOfEquipmentRaw;
    const netCashFromFinancingRaw = loanReceivedRaw - dividendsPaidRaw;
    const netIncreaseInCashRaw = netCashFromOperatingRaw + netCashFromInvestingRaw + netCashFromFinancingRaw;

    const cashAtBeginningRaw = 10000; // placeholder
    const cashAtEndRaw = cashAtBeginningRaw + netIncreaseInCashRaw;

    // --- Apply displayValue to ensure positives unless true loss ---
    const cashFlow = {
      operatingActivities: {
        netIncome: displayValue(netIncomeRaw, netIncomeRaw < 0),
        depreciation: displayValue(depreciationRaw),
        changeInWorkingCapital: displayValue(changeInWorkingCapitalRaw),
        netCashFromOperating: displayValue(netCashFromOperatingRaw)
      },
      investingActivities: {
        purchaseOfEquipment: displayValue(purchaseOfEquipmentRaw),
        investmentIncome: displayValue(investmentIncomeRaw),
        netCashFromInvesting: displayValue(netCashFromInvestingRaw)
      },
      financingActivities: {
        loanReceived: displayValue(loanReceivedRaw),
        dividendsPaid: displayValue(dividendsPaidRaw),
        netCashFromFinancing: displayValue(netCashFromFinancingRaw)
      },
      netIncreaseInCash: displayValue(netIncreaseInCashRaw),
      cashBalanceSummary: {
        cashAtBeginning: displayValue(cashAtBeginningRaw),
        cashAtEnd: displayValue(cashAtEndRaw)
      },
      nonCashTransactions: displayValue(leasingValueRaw),
      notes
    };

    // Render View
    res.render("dashboard/cashflow", {
      user: req.session.user,
      worker,
      companyinfo,
      sales,
      expenses,
      productions,
      assetPurchases,
      startDate,
      endDate,
      date: endDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }),
      cashFlow
    });

  } catch (err) {
    console.error("Error loading /cashflow:", err);
    res.status(500).send("Server error");
  }
});





// Helper to display value positive unless it's a true loss
function displayValue(val, isLoss = false) {
  if (isLoss) return val; // keep negative for true loss
  return Math.abs(val);   // otherwise show positive
}

app.get("/balancesheet", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;

    // --- Fetch from DB ---
    const inventoryItems = await Inventory.find({ recipientId: userId });
    const salesItems = await Sales.find({ recipientId: userId });
    const productionItems = await Production.find({ recipientId: userId });
    const accountPayables = await AccountsPayable.find({ recipientId: userId });
    const receivables = await AccountReceivable.find({ recipientId: userId }).sort({ createdAt: -1 });

    // --- Assets ---
    const cashRaw = salesItems.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const inventoryValueRaw = inventoryItems.reduce((sum, item) => sum + (item.scost * item.currentquantity), 0);
    const accountpayablesRaw = accountPayables.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const accountreceivablesRaw = receivables.reduce((sum, sale) => sum + (sale.amount || 0), 0);

    const assets = {
      cash: displayValue(cashRaw),
      inventory: displayValue(inventoryValueRaw),
      equipment: displayValue(0), // Add logic if you track equipment
      accountreceivables: displayValue(accountreceivablesRaw),
      investments: displayValue(0) // Optional
    };

    // --- Liabilities ---
    const productionCostRaw = productionItems.reduce((sum, prod) => sum + (prod.cost || 0), 0);
    const liabilities = {
      productionCosts: displayValue(productionCostRaw),
      loans: displayValue(0), // Add logic if loans are stored
      taxesOwed: displayValue(0),
      creditCards: displayValue(0),
      accountpayables: displayValue(accountpayablesRaw)
    };

    // --- Equity ---
    const capitalRaw = 20000; // Replace with DB value if available
    const retainedEarningsRaw = cashRaw - productionCostRaw; // Simple assumption

    const equity = {
      capital: displayValue(capitalRaw),
      retainedEarnings: displayValue(retainedEarningsRaw, retainedEarningsRaw < 0) // keep negative if actual loss
    };

    const totalAssets = Object.values(assets).reduce((a, b) => a + b, 0);
    const totalLiabilities = Object.values(liabilities).reduce((a, b) => a + b, 0);
    const totalEquity = totalAssets - totalLiabilities;

    const debtRatio = totalAssets ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0;
    const equityRatio = totalAssets ? ((totalEquity / totalAssets) * 100).toFixed(1) : 0;

    // --- Fetch company info and worker ---
    const companyinfo = await Company.findOne({ reciepientId: userId });
    const worker = req.session.worker || null;

    res.render("dashboard/balancesheet", {
      user: req.session.user,
      worker,
      companyinfo,
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












// Helper to display positive values unless true loss/negative
function displayValue(val, isLoss = false) {
  if (isLoss) return val; // keep negative if actual loss
  return Math.abs(val);   // otherwise show positive
}

app.get("/ledgerliquidity", ensureAuthenticated, async (req, res) => {
  try {

    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const entries = await Liquidity.find({ userId: req.session.user._id }).sort({ createdAt: -1 });

    // Sum all entries
    const totalCashRaw = entries.reduce((sum, e) => sum + (e.cash || 0), 0);
    const totalBankRaw = entries.reduce((sum, e) => sum + (e.bank || 0), 0);
    const totalLiabilitiesRaw = entries.reduce((sum, e) => sum + (e.liabilities || 0), 0);
    const netLiquidityRaw = totalCashRaw + totalBankRaw - totalLiabilitiesRaw;

    // Apply displayValue to ensure positives unless true negative liquidity
    const totalLiquidity = {
      cash: displayValue(totalCashRaw),
      bank: displayValue(totalBankRaw),
      liabilities: displayValue(totalLiabilitiesRaw),
      netLiquidity: displayValue(netLiquidityRaw, netLiquidityRaw < 0) // keep negative if true loss
    };

    console.log("Total Liquidity Summary:", totalLiquidity);

    res.render("dashboard/ledgerliquidity.ejs", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
      liquidity: totalLiquidity,
      liquidityEntries: entries
    });

  } catch (err) {
    console.error('Error loading ledger liquidity page:', err);
    res.status(500).send('Server error');
  }
});




// POST Liquidity Entry
app.post("/ledgerliquidity", ensureAuthenticated, async (req, res) => {
  try {
    const { cash, bank, liabilities } = req.body;
    const numCash = parseFloat(cash);
    const numBank = parseFloat(bank);
    const numLiabilities = parseFloat(liabilities);
    const netLiquidity = numCash + numBank - numLiabilities;

    const newEntry = new Liquidity({
      userId: req.session.user._id,
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


app.post("/ledgerliquidity/delete/:id", ensureAuthenticated, async (req, res) => {
  try {
    await Liquidity.findOneAndDelete({ _id: req.params.id, userId: req.session.user._id });
    res.redirect("/ledgerliquidity");
  } catch (err) {
    console.error("Error deleting liquidity entry:", err);
    res.status(500).send("Server error");
  }
});



app.get("/budget", ensureAuthenticated, async (req, res) => {
  try {


    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;

    const budgets = await Budget.find({ recipientId: userId }).sort({ createdAt: -1 });

    // Prepare chart labels and usage (spent = initial - current)
    const chartLabels = budgets.map(b => b.title);
    const chartData = budgets.map(b => b.amount - b.currentamount);

    res.render("dashboard/budget", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
      budgets,
      chartLabels: JSON.stringify(chartLabels),
      chartData: JSON.stringify(chartData),
    });
  } catch (err) {
    console.error("Error loading budget page:", err);
    res.status(500).send("Server error");
  }
});




app.get("/payroll", ensureAuthenticated, async (req, res) => {
  try {

    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;

    const payrolls = await Payroll.find({ userId }).sort({ createdAt: -1 });

    // Total Employees Paid
    const totalEmployeesPaid = payrolls.filter(p => p.status === "processed").length;

    // Total Payroll (sum of netPay of processed ones)
    const totalPayroll = payrolls
      .filter(p => p.status === "processed")
      .reduce((sum, p) => sum + p.netPay, 0);

    // Pending Payrolls Count
    const pendingPayrolls = payrolls.filter(p => p.status === "pending").length;

    res.render("dashboard/payrol.ejs", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
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














// const Budget = require("../models/Budget"); // Add this if not already
// const Lead = require("../models/Lead");

app.get("/salesmetricoverview", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;

    const salesItems = await Sales.find({ recipientId: userId });
    const expenseItems = await Expense.find({ recipientId: userId });

    // TOTALS
    const totalSalesAmount = salesItems.reduce((sum, sale) => sum + sale.amount, 0);
    const totalSalesCount = salesItems.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalExpenseAmount = expenseItems.reduce((sum, ex) => sum + ex.amount, 0);

    const avgOrderValue = totalSalesCount > 0
      ? totalSalesAmount / totalSalesCount
      : 0;

    const netProfit = totalSalesAmount - totalExpenseAmount;

    const profitMargin = totalSalesAmount > 0
      ? ((netProfit / totalSalesAmount) * 100).toFixed(1)
      : 0;

    // SALES TREND CHARTS
    const dailyLabels = [], dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const start = new Date(day.setHours(0, 0, 0, 0));
      const end = new Date(day.setHours(23, 59, 59, 999));
      const daySales = await Sales.find({ recipientId: userId, date: { $gte: start, $lte: end } });
      dailyLabels.push(start.toLocaleDateString('en-NG', { weekday: 'short' }));
      dailyData.push(daySales.reduce((sum, s) => sum + s.amount, 0));
    }

    const weeklyLabels = [], weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i * 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const weekSales = await Sales.find({ recipientId: userId, date: { $gte: start, $lte: end } });
      weeklyLabels.push(`Week ${4 - i}`);
      weeklyData.push(weekSales.reduce((sum, s) => sum + s.amount, 0));
    }

    const monthlyLabels = [], monthlyData = [], monthlyBudget = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const year = month.getFullYear();
      const monthIndex = month.getMonth();
      const start = new Date(year, monthIndex, 1);
      const end = new Date(year, monthIndex + 1, 0, 23, 59, 59);

      const monthlySales = await Sales.find({ recipientId: userId, date: { $gte: start, $lte: end } });
      const budget = await Budget.findOne({ recipientId: userId, month: monthIndex }); // Month 0-11

      monthlyLabels.push(month.toLocaleString('en-NG', { month: 'short' }));
      monthlyData.push(monthlySales.reduce((sum, s) => sum + s.amount, 0));
      monthlyBudget.push(budget ? budget.amount : 0);
    }

    // LEAD SOURCE BREAKDOWN
    const leadSources = await Lead.find({ recipientId: userId });
    const leadCounts = {};
    leadSources.forEach(lead => {
      leadCounts[lead.source] = (leadCounts[lead.source] || 0) + 1;
    });

    const leadLabels = Object.keys(leadCounts);
    const leadData = Object.values(leadCounts);

    const salesChartData = {
      daily: { labels: dailyLabels, data: dailyData },
      weekly: { labels: weeklyLabels, data: weeklyData },
      monthly: { labels: monthlyLabels, data: monthlyData }
    };

    res.render("dashboard/salesmetricoverview", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
      salesChartData,
      totalSalesAmount,
      totalSalesCount,
      avgOrderValue,
      profitMargin,
      monthlyLabels,
      monthlyData,
      monthlyBudget,
      leadLabels,
      leadData,
    });
  } catch (err) {
    console.error("Error loading sales metric overview:", err);
    res.status(500).send("Server error");
  }
});









app.get("/salesforecast", ensureAuthenticated, async (req, res) => {
  try {
    // --- user context ---
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    // --- fetch sales & expenses for the last 12 months ---
    const allSales = await Sales.find({
      recipientId: userId,
      date: { $gte: oneYearAgo, $lte: now }
    });

    const allExpenses = await Expense.find({
      recipientId: userId,
      createdAt: { $gte: oneYearAgo, $lte: now }
    });

    // --- build monthly sales array ---
    const monthlySales = Array(12).fill(0);
    allSales.forEach(sale => {
      const date = new Date(sale.date);
      const index =
        (now.getFullYear() - date.getFullYear()) * 12 +
        (now.getMonth() - date.getMonth());

      if (index >= 0 && index < 12) {
        monthlySales[11 - index] += sale.amount;
      }
    });

    // --- growth calculations ---
    const growthDiffs = [];
    for (let i = 0; i < monthlySales.length - 1; i++) {
      growthDiffs.push(monthlySales[i + 1] - monthlySales[i]);
    }

    const avgGrowth = growthDiffs.length
      ? growthDiffs.reduce((a, b) => a + b, 0) / growthDiffs.length
      : 0;

    const nextMonthRevenue = monthlySales[11] + avgGrowth;
    const nextQuarterRevenue = nextMonthRevenue + avgGrowth * 2;

    const trendPercent = monthlySales[10]
      ? ((monthlySales[11] - monthlySales[10]) / monthlySales[10]) * 100
      : 0;

    const monthlyTotal = monthlySales[11];
    const quarterlyTotal = monthlySales.slice(9, 12).reduce((a, b) => a + b, 0);

    // mock confidence calculation (can replace with ML model later)
    const confidenceLevel = Math.min(
      95,
      Math.max(70, (Math.random() * 20 + 75).toFixed(0))
    );

    // --- render ---
    res.render("dashboard/salesforecasting", {
      user: req.session.user || req.session.worker,
      worker: req.session.worker || null,
      companyinfo,
      forecast: {
        nextMonth: nextMonthRevenue.toFixed(2),
        nextQuarter: nextQuarterRevenue.toFixed(2),
        trendPercent: trendPercent.toFixed(2),
        monthlyTotal: monthlyTotal.toFixed(2),
        quarterlyTotal: quarterlyTotal.toFixed(2),
        confidenceLevel,
        accuracyNote: confidenceLevel > 80 ? "High Accuracy" : "Medium Confidence"
      }
    });

  } catch (err) {
    console.error("❌ Error loading sales forecast page:", err);
    res.status(500).send("Server error");
  }
});




















app.get('/pricecall', ensureAuthenticated, async (req, res) => {
  try {


    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;

    const products = await Inventory.find();
    res.render('dashboard/pricecall', {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
      products
    });
  } catch (err) {
    console.error('Error loading price call page:', err);
    res.status(500).send('Server error');
  }
});

app.get('/api/products', async (req, res) => {
  const products = await Inventory.find();
  res.json(products);
});


function formatNumber(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return n.toFixed(2);
}

app.post('/api/metrics', async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Inventory.findById(productId);
    if (!product) return res.status(404).json({ error: 'Item not found' });

    const quantitySold = product.quantity - product.currentquantity;
    const quantity = quantitySold;

    const totalRevenue = product.scost * quantity;
    const totalVariableCost = product.bcost * quantity;
    const totalFixedCost = 0;

    const grossProfit = totalRevenue - totalVariableCost;
    const netProfit = grossProfit - totalFixedCost;
    const contributionMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;
    const avgVariableCost = quantity ? totalVariableCost / quantity : 0;

    res.json({
      success: true,
      product: {
        name: product.itemName,
        scost: product.scost,
        bcost: product.bcost,
        quantitySold,
        quantityRemaining: product.quantity
      },
      calculations: {
        totalRevenue: formatNumber(totalRevenue),
        totalVariableCost: formatNumber(totalVariableCost),
        totalFixedCost: formatNumber(totalFixedCost),
        grossProfit: formatNumber(grossProfit),
        netProfit: formatNumber(netProfit),
        avgVariableCost: formatNumber(avgVariableCost),
        contributionMargin: contributionMargin,
        contributionMarginPercent: contributionMargin * 100
      }
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to compute metrics' });
  }
});
































// Debt Management Page
app.get('/Debtmanagement', ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;

    const company = await Company.findOne({ userId }).lean();
    const latestAnalysis = await Analysis.findOne({ userId }).sort({ createdAt: -1 }).lean();

    res.render('dashboard/debtmanagement', {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
      company: company || {},
      analysis: latestAnalysis || {},
      error: null,
      success: null
    });
  } catch (err) {
    console.error('Error loading debt management page:', err);
    res.status(500).render('dashboard/debtmanagement', {

      company: {},
      analysis: {},
      error: 'Failed to load data',
      success: null
    });
  }
});

// Save Company Info
app.post('/Debtmanagement/company', ensureAuthenticated, async (req, res) => {
  const { companyName, marketCap, totalDebt, taxRate, sharesOutstanding } = req.body;
  const userId = req.session.user._id;

  try {
    // Validate inputs
    if (!companyName || !marketCap || !totalDebt || !taxRate || !sharesOutstanding) {
      throw new Error('All fields are required');
    }
    const parsedInputs = {
      marketCap: parseFloat(marketCap),
      totalDebt: parseFloat(totalDebt),
      taxRate: parseFloat(taxRate),
      sharesOutstanding: parseFloat(sharesOutstanding)
    };
    for (const [key, value] of Object.entries(parsedInputs)) {
      if (isNaN(value) || value < 0) {
        throw new Error(`Invalid ${key}`);
      }
    }

    // Save or update company
    await Company.findOneAndUpdate(
      { userId },
      { userId, companyName, ...parsedInputs },
      { upsert: true, new: true }
    );

    req.io.to(userId.toString()).emit('company_updated', { message: 'Company info saved' });
    res.redirect('/Debtmanagement?success=Company%20info%20saved');
  } catch (err) {
    console.error('Error saving company:', err);
    res.redirect(`/Debtmanagement?error=${encodeURIComponent(err.message)}`);
  }
});

// Save Analysis
app.post('/Debtmanagement/save', ensureAuthenticated, async (req, res) => {
  const {
    analysisName,
    riskFreeRate,
    creditSpread,
    afterTax,
    equityMethod,
    capmRiskFree,
    beta,
    marketReturn,
    dividendPerShare,
    currentPrice,
    growthRate
  } = req.body;
  const userId = req.session.user._id;

  try {
    // Validate inputs
    const company = await Company.findOne({ userId });
    if (!company) {
      throw new Error('Company info required');
    }

    const parsedInputs = {
      riskFreeRate: parseFloat(riskFreeRate),
      creditSpread: parseFloat(creditSpread),
      capmRiskFree: parseFloat(capmRiskFree),
      beta: parseFloat(beta),
      marketReturn: parseFloat(marketReturn),
      dividendPerShare: parseFloat(dividendPerShare),
      currentPrice: parseFloat(currentPrice),
      growthRate: parseFloat(growthRate)
    };
    for (const [key, value] of Object.entries(parsedInputs)) {
      if (isNaN(value) || value < 0) {
        throw new Error(`Invalid ${key}`);
      }
    }

    // Calculate cost of debt
    const beforeTaxCost = parsedInputs.riskFreeRate + parsedInputs.creditSpread;
    const taxShield = beforeTaxCost * (company.taxRate / 100);
    const costOfDebt = afterTax === 'true' ? beforeTaxCost * (1 - company.taxRate / 100) : beforeTaxCost;

    // Calculate cost of equity
    let costOfEquity = 0;
    if (equityMethod === 'CAPM') {
      costOfEquity = parsedInputs.capmRiskFree + parsedInputs.beta * (parsedInputs.marketReturn - parsedInputs.capmRiskFree);
    } else if (equityMethod === 'DDM') {
      costOfEquity = (parsedInputs.dividendPerShare / parsedInputs.currentPrice) * 100 + parsedInputs.growthRate;
    }

    // Calculate WACC
    const totalCapital = company.marketCap + company.totalDebt;
    if (totalCapital === 0) {
      throw new Error('Total capital cannot be zero');
    }
    const equityRatio = company.marketCap / totalCapital;
    const debtRatio = company.totalDebt / totalCapital;
    const wacc = equityRatio * costOfEquity + debtRatio * costOfDebt;

    // Generate recommendations
    let recommendations = '';
    if (debtRatio < 0.3) {
      recommendations = 'Consider increasing debt to leverage tax benefits and reduce WACC.';
    } else if (debtRatio > 0.6) {
      recommendations = 'Reduce debt levels to lower financial risk and optimize WACC.';
    } else {
      recommendations = 'Current capital structure is balanced; monitor for optimization opportunities.';
    }

    // Save analysis
    const analysis = new Analysis({
      userId,
      companyId: company._id,
      analysisName: analysisName || 'Unnamed Analysis',
      costOfDebtInputs: {
        riskFreeRate: parsedInputs.riskFreeRate,
        creditSpread: parsedInputs.creditSpread,
        afterTax: afterTax === 'true'
      },
      costOfEquityInputs: {
        method: equityMethod,
        capm: equityMethod === 'CAPM' ? {
          riskFreeRate: parsedInputs.capmRiskFree,
          beta: parsedInputs.beta,
          marketReturn: parsedInputs.marketReturn
        } : undefined,
        ddm: equityMethod === 'DDM' ? {
          dividendPerShare: parsedInputs.dividendPerShare,
          currentPrice: parsedInputs.currentPrice,
          growthRate: parsedInputs.growthRate
        } : undefined
      },
      results: {
        wacc,
        debtRatio: debtRatio * 100,
        taxShield: company.totalDebt * (company.taxRate / 100),
        costOfEquity,
        costOfDebt
      }
    });
    await analysis.save();

    req.io.to(userId.toString()).emit('analysis_saved', { message: 'Analysis saved' });
    res.redirect('/Debtmanagement?success=Analysis%20saved');
  } catch (err) {
    console.error('Error saving analysis:', err);
    res.redirect(`/Debtmanagement?error=${encodeURIComponent(err.message)}`);
  }
});

// Scenario Analysis
app.post('/Debtmanagement/scenario', ensureAuthenticated, async (req, res) => {
  const { debtRangeMin, debtRangeMax } = req.body;
  const userId = req.session.user._id;

  try {
    const company = await Company.findOne({ userId });
    const latestAnalysis = await Analysis.findOne({ userId }).sort({ createdAt: -1 });
    if (!company || !latestAnalysis) {
      throw new Error('Company info and analysis required');
    }

    const min = parseFloat(debtRangeMin);
    const max = parseFloat(debtRangeMax);
    if (isNaN(min) || isNaN(max) || min < 0 || max > 100 || min >= max) {
      throw new Error('Invalid debt range');
    }

    // Simulate scenario analysis
    const results = [];
    let optimalDebtRatio = min;
    let minWACC = Infinity;
    const steps = 10;
    const stepSize = (max - min) / steps;

    for (let debtRatio = min; debtRatio <= max; debtRatio += stepSize) {
      const debt = (debtRatio / 100) * (company.marketCap + company.totalDebt);
      const equity = (company.marketCap + company.totalDebt) - debt;
      const equityRatio = equity / (equity + debt);
      const newDebtRatio = debt / (equity + debt);
      const wacc = equityRatio * latestAnalysis.results.costOfEquity + newDebtRatio * latestAnalysis.results.costOfDebt;
      results.push({ debtRatio: debtRatio.toFixed(1), wacc: wacc.toFixed(2) });
      if (wacc < minWACC) {
        minWACC = wacc;
        optimalDebtRatio = debtRatio;
      }
    }

    // Update latest analysis with scenario results
    await Analysis.findByIdAndUpdate(latestAnalysis._id, {
      $set: {
        'results.scenarioResults': results,
        'results.optimalDebtRatio': optimalDebtRatio,
        'results.optimalWACC': minWACC
      }
    });

    req.io.to(userId.toString()).emit('scenario_updated', { message: 'Scenario analysis completed' });
    res.redirect('/Debtmanagement?success=Scenario%20analysis%20completed');
  } catch (err) {
    console.error('Error running scenario:', err);
    res.redirect(`/Debtmanagement?error=${encodeURIComponent(err.message)}`);
  }
});

// Export Report
app.get('/Debtmanagement/export', ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;
    const company = await Company.findOne({ userId }).lean();
    const latestAnalysis = await Analysis.findOne({ userId }).sort({ createdAt: -1 }).lean();
    if (!company || !latestAnalysis) {
      throw new Error('No data to export');
    }

    // Generate PDF
    const doc = new PDFDocument();
    const filePath = path.join(__dirname, `reports/debtmanagement-${userId}-${Date.now()}.pdf`);
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text('Debt Management Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Company: ${company.companyName}`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.fontSize(12).text('Company Information:');
    doc.text(`Market Cap: $${company.marketCap}M`);
    doc.text(`Total Debt: $${company.totalDebt}M`);
    doc.text(`Tax Rate: ${company.taxRate}%`);
    doc.text(`Shares Outstanding: ${company.sharesOutstanding}M`);
    doc.moveDown();
    doc.text('Analysis Results:');
    doc.text(`WACC: ${latestAnalysis.results.wacc.toFixed(2)}%`);
    doc.text(`Debt Ratio: ${latestAnalysis.results.debtRatio.toFixed(1)}%`);
    doc.text(`Tax Shield: $${latestAnalysis.results.taxShield.toFixed(1)}M`);
    doc.text(`Cost of Equity: ${latestAnalysis.results.costOfEquity.toFixed(2)}%`);
    doc.text(`Cost of Debt: ${latestAnalysis.results.costOfDebt.toFixed(2)}%`);
    doc.end();

    res.download(filePath, `DebtManagementReport-${company.companyName}.pdf`, (err) => {
      if (err) console.error('Error downloading PDF:', err);
      fs.unlinkSync(filePath); // Clean up
    });
  } catch (err) {
    console.error('Error exporting report:', err);
    res.redirect(`/Debtmanagement?error=${encodeURIComponent(err.message)}`);
  }
});











app.get("/reportandanalysis", ensureAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate, category, supplier, ajax } = req.query;


    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;

    const inventoryQuery = {};
    const salesQuery = {};

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      inventoryQuery.addedDate = dateFilter;
      salesQuery.date = dateFilter;
    }

    if (category) {
      inventoryQuery.category = category;
      salesQuery.category = category;
    }
    if (supplier) {
      inventoryQuery.supplier = supplier;
      salesQuery.supplier = supplier;
    }

    // Get current period data
    const inventory = await Inventory.find(inventoryQuery);
    const sales = await Sales.find(salesQuery);

    // Get previous period data (for trend comparison)
    let prevStart, prevEnd;
    if (startDate && endDate) {
      const diffDays =
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
      prevEnd = new Date(startDate);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - diffDays);
    }

    const prevInventoryQuery = { ...inventoryQuery };
    const prevSalesQuery = { ...salesQuery };
    if (prevStart && prevEnd) {
      prevInventoryQuery.addedDate = { $gte: prevStart, $lte: prevEnd };
      prevSalesQuery.date = { $gte: prevStart, $lte: prevEnd };
    }

    const prevInventory = await Inventory.find(prevInventoryQuery);
    const prevSales = await Sales.find(prevSalesQuery);

    // Helper: calculate KPIs
    function calcKPIs(inv, sales) {
      const totalSalesValue = sales.reduce((sum, s) => {
        const qty = Number(s.quantity) || 0;
        const unitPrice = Number(s.unitPrice) || 0;
        return sum + qty * unitPrice;
      }, 0);


      const totalStartInventory = inv.reduce((sum, i) => {
        const qty = Number(i.quantity) || 0;
        const cost = Number(i.bcost) || 0;
        return sum + qty * cost;
      }, 0);

      const totalEndInventory = inv.reduce((sum, i) => {
        const qty = Number(i.currentquantity) || 0;
        const cost = Number(i.bcost) || 0;
        return sum + qty * cost;
      }, 0);

      const avgInventoryValue = (totalStartInventory + totalEndInventory) / 2;

      const turnover =
        avgInventoryValue > 0 ? totalSalesValue / avgInventoryValue : 0;

      const stockToSales =
        totalSalesValue > 0 ? totalStartInventory / totalSalesValue : 0;

      const sellThrough =
        totalStartInventory > 0
          ? (totalSalesValue / totalStartInventory) * 100
          : 0;

      const totalPurchased = sales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
      const totalOrdered = sales.reduce((sum, s) => sum + (Number(s.itemsOrdered) || Number(s.quantity) || 0), 0);
      const fillRate = totalOrdered > 0 ? (totalPurchased / totalOrdered) * 100 : 0;

      return {
        turnover: turnover.toFixed(2),
        avgInventoryValue: (avgInventoryValue / 1000).toFixed(1),
        stockToSales: stockToSales.toFixed(2),
        sellThrough: sellThrough.toFixed(1),
        fillRate: fillRate.toFixed(1)
      };
    }

    const currentKPIs = calcKPIs(inventory, sales);
    const prevKPIs = calcKPIs(prevInventory, prevSales);

    // Determine trends
    function trendDirection(curr, prev) {
      if (prev === 0) return "neutral";
      return curr > prev ? "positive" : curr < prev ? "negative" : "neutral";
    }

    const kpiTrends = {
      turnover: trendDirection(parseFloat(currentKPIs.turnover), parseFloat(prevKPIs.turnover)),
      avgInventoryValue: trendDirection(parseFloat(currentKPIs.avgInventoryValue), parseFloat(prevKPIs.avgInventoryValue)),
      stockToSales: trendDirection(parseFloat(currentKPIs.stockToSales), parseFloat(prevKPIs.stockToSales)),
      sellThrough: trendDirection(parseFloat(currentKPIs.sellThrough), parseFloat(prevKPIs.sellThrough)),
      fillRate: trendDirection(parseFloat(currentKPIs.fillRate), parseFloat(prevKPIs.fillRate)),
    };

    // Chart Data
    const monthlyData = await Sales.aggregate([
      {
        $group: {
          _id: { month: { $month: "$date" }, year: { $year: "$date" } },
          totalSales: { $sum: { $multiply: ["$quantity", "$cost"] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const turnoverTrend = monthlyData.map(m => ({
      label: `${m._id.month}/${m._id.year}`,
      turnover: currentKPIs.turnover
    }));

    const fillRateBySupplier = await Sales.aggregate([
      {
        $group: {
          _id: "$supplier",
          totalPurchased: { $sum: "$quantity" },
          totalOrdered: { $sum: { $ifNull: ["$itemsOrdered", "$quantity"] } }
        }
      },
      {
        $project: {
          supplier: "$_id",
          fillRate: {
            $cond: [
              { $gt: ["$totalOrdered", 0] },
              { $multiply: [{ $divide: ["$totalPurchased", "$totalOrdered"] }, 100] },
              0
            ]
          }
        }
      }
    ]);

    const stockDistribution = await Inventory.aggregate([
      { $group: { _id: "$category", totalStock: { $sum: "$currentquantity" } } }
    ]);

    // Table Data
    // Build table data from inventory and sales
    const tableData = inventory.map(inv => {
      const productSales = sales.filter(s => s.item === inv.itemName);
      console.log("productSales", productSales)
      const totalSales = productSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
      console.log("totalSales", totalSales)

      return {
        status: inv.currentquantity > 0 ? "In Stock" : "Out of Stock",
        name: inv.itemName || "Unnamed",
        category: inv.category || "N/A",
        sales: totalSales,
        avgInventory: ((Number(inv.quantity) + Number(inv.currentquantity)) / 2) || 0,
        turnoverRatio: currentKPIs.turnover,
        str: currentKPIs.sellThrough,
        lifr: currentKPIs.fillRate,
        supplier: inv.supplier || "N/A"
      };
    });




    if (ajax === "true") {
      return res.json({
        kpis: currentKPIs,
        trends: kpiTrends,
        charts: {
          monthlyData,
          turnoverTrend,
          fillRateBySupplier,
          stockDistribution
        },
        table: tableData
      });
    }



    // Generate alerts
    const alerts = [];

    if (parseFloat(currentKPIs.fillRate) < 80) {
      alerts.push(`Fill rate is low (${currentKPIs.fillRate}%) — consider improving supplier performance.`);
    }

    if (parseFloat(currentKPIs.turnover) < 2) {
      alerts.push(`Inventory turnover (${currentKPIs.turnover}) is below target — review stock movement.`);
    }

    if (parseFloat(currentKPIs.sellThrough) < 50) {
      alerts.push(`Sell-through rate is low (${currentKPIs.sellThrough}%) — consider promotions or discounts.`);
    }

    if (alerts.length === 0) {
      alerts.push("✅ All KPIs are within acceptable ranges.");
    }


    res.render("dashboard/report and analytics", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
      kpis: currentKPIs,
      trends: kpiTrends,
      charts: {
        monthlyData,
        turnoverTrend,
        fillRateBySupplier,
        stockDistribution
      },
      table: tableData,
      filters: { startDate, endDate, category, supplier },
      alerts, // ✅ Prevents "alerts is not defined"
    });

  } catch (err) {
    console.error("Error fetching report data:", err);
    res.status(500).send("Server Error");
  }
});


// GET /api/charts - Fetch chart data for report and analysis
app.get('/charts', ensureAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate, category, supplier } = req.query;

    // Determine user ID (admin or worker)
    let recipientId = null;
    if (req.session.user) {
      recipientId = req.session.user._id;
    } else if (req.session.worker) {
      recipientId = req.session.worker.adminId;
    } else {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Build query filters
    const inventoryQuery = {};
    const salesQuery = {};

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      inventoryQuery.addedDate = dateFilter;
      salesQuery.date = dateFilter;
    }

    if (category) {
      inventoryQuery.category = category;
      salesQuery.category = category;
    }
    if (supplier) {
      inventoryQuery.supplier = supplier;
      salesQuery.supplier = supplier;
    }

    // Fetch data for charts
    const monthlyData = await Sales.aggregate([
      {
        $match: salesQuery,
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          totalSales: { $sum: { $multiply: ['$quantity', '$cost'] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Calculate turnover for the current period
    const inventory = await Inventory.find(inventoryQuery);
    const sales = await Sales.find(salesQuery);

    const totalSalesValue = sales.reduce((sum, s) => {
      const qty = Number(s.quantity) || 0;
      const unitPrice = Number(s.unitPrice) || 0;
      return sum + qty * unitPrice;
    }, 0);

    const totalStartInventory = inventory.reduce((sum, i) => {
      const qty = Number(i.quantity) || 0;
      const cost = Number(i.bcost) || 0;
      return sum + qty * cost;
    }, 0);

    const totalEndInventory = inventory.reduce((sum, i) => {
      const qty = Number(i.currentquantity) || 0;
      const cost = Number(i.bcost) || 0;
      return sum + qty * cost;
    }, 0);

    const avgInventoryValue = (totalStartInventory + totalEndInventory) / 2;
    const turnover = avgInventoryValue > 0 ? totalSalesValue / avgInventoryValue : 0;

    const turnoverTrend = monthlyData.map(m => ({
      label: `${m._id.month}/${m._id.year}`,
      turnover: turnover.toFixed(2),
    }));

    const fillRateBySupplier = await Sales.aggregate([
      {
        $match: salesQuery,
      },
      {
        $group: {
          _id: '$supplier',
          totalPurchased: { $sum: '$quantity' },
          totalOrdered: { $sum: { $ifNull: ['$itemsOrdered', '$quantity'] } },
        },
      },
      {
        $project: {
          supplier: '$_id',
          fillRate: {
            $cond: [
              { $gt: ['$totalOrdered', 0] },
              { $multiply: [{ $divide: ['$totalPurchased', '$totalOrdered'] }, 100] },
              0,
            ],
          },
        },
      },
    ]);

    const stockDistribution = await Inventory.aggregate([
      {
        $match: inventoryQuery,
      },
      { $group: { _id: '$category', totalStock: { $sum: '$currentquantity' } } },
    ]);

    // Return chart data
    res.json({
      success: true,
      charts: {
        monthlyData,
        turnoverTrend,
        fillRateBySupplier,
        stockDistribution,
      },
    });
    console.log('Chart data sent successfully');
  } catch (err) {
    console.error('Error fetching chart data:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


































app.get("/user/place-Order", async (req, res) => {
  try {
    const now = new Date();



    // Update overdue orders
    await Order.updateMany(
      {
        expectedDelivery: { $lt: now },
        status: { $nin: ['delivered', 'overdue'] }
      },
      { $set: { status: 'overdue' } }
    );


    res.render("dashboard/userOrder/home", {
    });
  } catch (err) {
    console.error("Error loading Order Management page:", err);
    res.status(500).send("Server error");
  }
});


app.get("/order/company/:companyId", async (req, res) => {
  try {
    const companyId = req.params.companyId;

    // Fetch company by its "reciepientId" (spelling matched to database)
    const company = await Company.findOne({ reciepientId: companyId }).lean();
    if (!company) return res.status(404).send("Company not found");

    // Fetch ALL products belonging to this company
    const products = await Inventory.find({ recipientId: companyId })
      .select("itemName scost currentquantity _id image category")
      .lean();

    const user = req.session.user || req.session.worker || null;

    res.render("dashboard/userOrder/dorder", {
      company,
      products,   // product info now included
      user,
      product: null
    });

  } catch (err) {
    console.error("Error loading company order page:", err);
    res.status(500).send("Server error");
  }
});




app.get("/order/company/user/success-Order", async (req, res) => {
  try {
    const now = new Date();
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }

    // Update overdue orders
    await Order.updateMany(
      { expectedDelivery: { $lt: now }, status: { $nin: ['delivered', 'overdue'] } },
      { $set: { status: 'overdue' } }
    );

    // Get orders for this user/worker
    const allOrders = await Order.find({ recipientId })
      .populate("recipientId")
      .lean();

    const inTransitOrders = allOrders.filter(order => order.status === 'in_transit');
    const deliveredOrders = allOrders.filter(order => order.status === 'delivered');

    // Get orderId from query string
    const orderId = req.query.orderId || null;

    res.render("dashboard/userOrder/success", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
      inTransitOrders,
      deliveredOrders,
      orderId  // <-- pass this to EJS
    });
  } catch (err) {
    console.error("Error loading Order Management page:", err);
    res.status(500).send("Server error");
  }
});


















app.post('/api/auth/createOrder', async (req, res) => {
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
      qrCode: qrCodeDataUrl
    });


    await newOrder.save();
    console.log('New order created:', newOrder);

    // Build QR link
    const qrUrl = `https://adnet.vercel.app/order-placed/${encodeURIComponent(buyername)}/${newOrder?._id || 'temp'}/`;

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating order' });
  }
});




// View single order
app.get("/order/:id", ensureAuthenticated, async (req, res) => {
  try {

    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;


    const order = await Order.findById(req.params.id)
      .populate("recipientId", "name email") // show recipient details
      .lean();

    if (!order) {
      return res.status(404).send("Order not found");
    }


    res.render("dashboard/order-view", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
      order
    });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).send("Server error");
  }
});




// GET confirmation page
app.get("/order-placed/:buyername/:orderId", ensureAuthenticated, async (req, res) => {
  try {

    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;

    const { buyername, orderId } = req.params;
    const order = await Order.findById(orderId).lean();

    if (!order || order.buyername !== buyername) {
      return res.status(404).send("Order not found");
    }

    res.render("dashboard/order-confirm", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
      order,
      error: null,
      success: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// POST confirmation
app.post("/order-placed/:buyername/:orderId", async (req, res) => {
  try {
    const { buyername, orderId } = req.params;
    const { email, password, name } = req.body;

    console.log("=== [POST] /sharp/order-placed ===");
    console.log("Params:", { buyername, orderId });
    console.log("Body:", { email, password: password ? "***" : "", name });

    // Fetch order
    const order = await Order.findById(orderId);
    if (!order) {
      console.error("❌ Order not found:", orderId);
      return res.status(404).send("Order not found");
    }
    console.log("✅ Order found:", order._id);
    console.log("Buyer name on order:", order.buyername, " | Param buyername:", buyername);
    console.log("Current order status:", order.status);
    console.log("Order items:", order.items);

    if (order.buyername !== buyername) {
      console.error("❌ Buyer name mismatch");
      return res.status(404).send("Order not found");
    }

    // Verify credentials
    console.log("🔐 Verifying credentials...");
    const credsOk =
      order.buyeremail === email &&
      order.productpassword === password &&
      order.buyername === name;

    if (!credsOk) {
      console.warn("❌ Credentials do not match");
      return res.render("dashboard/order-confirm", {
        order: order.toObject(),
        error: "Details do not match. Please try again.",
        success: null
      });
    }
    console.log("✅ Credentials match!");

    // Prevent double-deduction
    const alreadyDelivered = order.status === "delivered";
    if (alreadyDelivered) {
      console.warn("⚠️ Order already marked as delivered. Skipping inventory deduction.");
    }

    // Update inventory (only once)
    if (!alreadyDelivered) {
      console.log("=== 🔧 Updating Inventory Quantities ===");

      for (const item of order.items || []) {
        const qty = Number(item.quantity) || 0;
        console.log(`→ Item: ${item.productName} | productId=${item.productId} | qty=${qty}`);

        if (!item.productId) {
          console.warn("   ⚠️ Missing productId on item, skipping");
          continue;
        }

        const product = await Inventory.findById(item.productId);
        if (!product) {
          console.warn(`   ⚠️ Inventory not found for productId=${item.productId}, skipping`);
          continue;
        }

        const before = Number(product.currentquantity) || 0;
        const after = Math.max(before - qty, 0);

        console.log(
          `   ${product.itemName}: currentquantity BEFORE=${before} | minus=${qty} | AFTER=${after}`
        );

        product.currentquantity = after;
        await product.save();

        console.log(`   ✅ Saved ${product.itemName} | currentquantity=${product.currentquantity}`);
      }

      console.log("=== ✅ Inventory Update Complete ===");

      // Mark order delivered
      order.status = "delivered";
      await order.save();
      console.log("✅ Order status updated to 'delivered'");
    }

    return res.render("dashboard/order-confirm", {
      order: order.toObject(),
      error: null,
      success: alreadyDelivered
        ? "Order was already delivered earlier. Inventory not changed."
        : "Goods confirmed, marked as delivered, and inventory updated!"
    });
  } catch (err) {
    console.error("💥 Server Error in /sharp/order-placed:", err);
    return res.status(500).send("Server error");
  }
});
















































app.get("/admin", ensureAuthenticated, async (req, res) => {
  try {

    res.render("dashboard/admin/admin", {
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error loading admin page:", err);
    res.status(500).send("Server error");
  }
});






// Get all workers for admin
app.get("/workers/:adminId", async (req, res) => {
  try {
    const workers = await Worker.find({ adminId: req.params.adminId });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch workers" });
  }
});

// Get single worker
app.get("/get/workers/:id", async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: "Error fetching worker" });
  }
});


app.get("/api/workers/:adminId", async (req, res) => {
  try {
    const { adminId } = req.params;

    // Only fetch workers belonging to this admin
    const workers = await Worker.find({ adminId }).lean();

    res.json(workers);
  } catch (err) {
    console.error("Error fetching workers:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete worker endpoint
// Update worker endpoint
app.put("/workers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, username, phone, password, roles, notes } = req.body;

    // Find the worker
    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found"
      });
    }

    // Check if email is being changed and if it's already taken by another worker
    if (email !== worker.email) {
      const existingWorker = await Worker.findOne({ email, _id: { $ne: id } });
      if (existingWorker) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }
    }

    // Check if username is being changed and if it's already taken by another worker
    if (username !== worker.username) {
      const existingUsername = await Worker.findOne({ username, _id: { $ne: id } });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }
    }

    // Update worker fields
    worker.name = name;
    worker.email = email;
    worker.username = username;
    worker.phone = phone || worker.phone;
    worker.roles = roles || [];
    worker.notes = notes || worker.notes;

    // Only update password if provided
    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      worker.password = await bcrypt.hash(password, 10);
    }

    await worker.save();

    console.log(`Worker updated: ${worker.name} (ID: ${id})`);

    res.json({
      success: true,
      message: `Worker "${worker.name}" has been successfully updated`,
      worker: {
        _id: worker._id,
        name: worker.name,
        email: worker.email,
        username: worker.username,
        phone: worker.phone,
        roles: worker.roles,
        notes: worker.notes
      }
    });

  } catch (err) {
    console.error("Error updating worker:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update worker. Please try again."
    });
  }
});

app.delete("/delete/workers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the worker
    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found"
      });
    }

    // Store worker name for response
    const workerName = worker.name;

    // Delete the worker
    await Worker.findByIdAndDelete(id);

    console.log(`Worker deleted: ${workerName} (ID: ${id})`);

    res.json({
      success: true,
      message: `Worker "${workerName}" has been successfully deleted`
    });

  } catch (err) {
    console.error("Error deleting worker:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete worker. Please try again."
    });
  }
});































// ✅ Middleware
// ✅ Middleware: Just attach user tier, don’t block
function checkTier(requiredTier) {
  return async (req, res, next) => {
    try {
      const user = await Personal.findById(req.session.user._id)
        .select("tier fullName email role");

      if (!user) {
        console.log("❌ No user found for session:", req.session.user?._id);
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Log everything useful
      console.log("🔎 User info:", {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        tier: user.tier,
        requiredTier
      });

      req.userTier = user.tier; // always pass the tier
      req.requiredTier = requiredTier;
      next();

    } catch (err) {
      console.error("Tier check error:", err);
      res.status(500).json({ success: false, message: "Server error during tier check" });
    }
  };
}



app.get("/accountreconciliation", ensureAuthenticated, checkTier(2), async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }

    res.render("dashboard/accountreconciliation", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
      userTier: req.userTier,   // 👈 pass to frontend
      requiredTier: req.requiredTier
    });
  } catch (err) {
    console.error("Error loading account reconciliation page:", err);
    res.status(500).send("Server error");
  }
});



// Get bank list
app.get("/user/api/banks", async (req, res) => {
  try {
    const r = await fetch("https://api.paystack.co/bank", {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.json({ status: false, message: "Bank list fetch failed", data: [] });
  }
});

// Resolve account number
app.post("/user/api/resolve-account", async (req, res) => {
  const { account, bank } = req.body;
  try {
    const r = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account}&bank_code=${bank}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const data = await r.json();
    if (data.status) {
      res.json({ success: true, data: data.data });
    } else {
      res.json({ success: false, message: data.message });
    }
  } catch (err) {
    res.json({ success: false, message: "Account verification failed" });
  }
});





/**
 * Verify an account number with Paystack
 * @param {String} bankCode - Paystack bank code (e.g., '044' for Access Bank)
 * @param {String} accountNumber - 10-digit account number
 * @returns {Promise<String|null>} - account name if resolved, null otherwise
 */
async function verifyAccount(bankCode, accountNumber) {
  const url = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();
    if (json.status && json.data && json.data.account_name) {
      return json.data.account_name;
    }
    console.error("Paystack resolve error:", json);
    return null;
  } catch (err) {
    console.error("verifyAccount error", err);
    return null;
  }
}


// POST /api/resolveAccount
app.post('/resolveAccount', async (req, res) => {
  const { bankCode, accountNumber } = req.body;
  if (!bankCode || !accountNumber) {
    return res.json({ success: false, message: 'Missing details' });
  }
  try {
    const accountName = await verifyAccount(bankCode, accountNumber);
    if (accountName) {
      res.json({ success: true, accountName });
    } else {
      res.json({ success: false, message: 'Unable to resolve account' });
    }
  } catch (err) {
    console.error('resolve error', err);
    res.json({ success: false, message: 'Error resolving account' });
  }
});



// Check wallet existence
app.get('/user/api/wallet/check', ensureAuthenticated, async (req, res) => {
  console.log("Checking wallet for user:", req.session.user._id);

  const wallet = await Wallet.findOne({ userId: req.session.user._id });
  console.log("Wallet found:", wallet);
  res.json({ success: true, hasWallet: !!wallet });
});

// Check wallet existence + status
app.get('/user/api/wallet/status', ensureAuthenticated, async (req, res) => {
  console.log("Checking wallet for user:", req.session.user._id);

  const wallet = await Wallet.findOne({ userId: req.session.user._id });
  console.log("Wallet found:", wallet);

  res.json({
    success: true,
    hasWallet: !!wallet,
    balance: wallet ? wallet.balance : 0,
    provider: wallet ? (wallet.provider || 'paystack') : null
  });
});


// Create wallet
app.post('/user/api/wallet/create', ensureAuthenticated, async (req, res) => {
  console.log("Creating wallet for user:", req.session.user._id);
  let wallet = await Wallet.findOne({ userId: req.session.user._id });
  console.log("Existing wallet:", wallet);

  if (wallet) return res.json({ success: false, message: "Wallet already exists" });

  wallet = await Wallet.create({ userId: req.session.user._id, balance: 0 });
  res.json({ success: true, wallet });
});







app.get("/dashboard-stats", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;

    if (req.session.user) {
      recipientId = req.session.user._id;
    } else if (req.session.worker) {
      recipientId = req.session.worker.adminId;
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ============= Accounts Payable ============
    const payables = await AccountsPayable.find({ recipientId });
    const totalAP = payables.reduce((sum, p) => sum + (p.ramount || 0), 0);

    // ============= Accounts Receivable =========
    const receivables = await AccountReceivable.find({ recipientId });
    const totalAR = receivables.reduce((sum, r) => sum + (r.ramount || 0), 0);

    // ============= Wallet Transactions =========
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const autoMatchedToday = await WalletTransaction.countDocuments({
      userId: recipientId,
      status: "success",
      createdAt: { $gte: today }
    });

    // ============= Discrepancies (placeholder) =========
    // You might use a Reconciliation collection, or detect wallet txns not linked to AR/AP
    const discrepancies = await Reconciliation.countDocuments({
      userId: recipientId,
      matched: false
    }).catch(() => 0); // fallback if not implemented

    res.json({
      totalAP,
      totalAR,
      autoMatchedToday,
      discrepancies
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Run invoice auto-matching
app.post("/invoice/auto-match", ensureAuthenticated, async (req, res) => {
  try {
    const recipientId = req.session.user._id;

    // 1. Fetch invoices + payments
    const invoices = await Invoice.find({ recipientId });
    const payments = await WalletTransaction.find({ userId: recipientId, status: "success" });

    let matchedCount = 0;
    let reviewList = [];

    // 2. Apply rules (simplified example)
    invoices.forEach(inv => {
      const match = payments.find(p =>
        Math.abs(p.amount - inv.amount) <= 500 && // tolerance rule
        p.vendorId?.toString() === inv.vendorId?.toString() && // same vendor
        Math.abs(new Date(p.date) - new Date(inv.date)) / (1000 * 60 * 60 * 24) <= 5 // within 5 days
      );

      if (match) {
        matchedCount++;
        inv.matched = true;
        inv.matchedAt = new Date();
        inv.save();
      } else {
        reviewList.push(inv);
      }
    });

    // 3. Calculate summary
    const autoMatchRate = invoices.length > 0 ? (matchedCount / invoices.length) * 100 : 0;

    res.json({
      autoMatchRate,
      needsReview: reviewList.length,
      reviewList, // optional: send back suggestions
    });

  } catch (err) {
    console.error("Error in auto-match:", err);
    res.status(500).json({ error: "Failed to run auto-match" });
  }
});

// Fetch review suggestions
app.get("/invoice/review", ensureAuthenticated, async (req, res) => {
  try {
    let recipientId = null;

    if (req.session.user) {
      recipientId = req.session.user._id;
    } else if (req.session.worker) {
      recipientId = req.session.worker.adminId;
    } else {
      console.error("❌ No valid session found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("📌 /invoice/review called with recipientId:", recipientId);

    const reviewList = await Invoice.find({ recipientId, matched: false });
    console.log("✅ Review list found:", reviewList.length, "items");

    res.json(reviewList);
  } catch (err) {
    console.error("🔥 Error in /invoice/review:", err); // log full error
    res.status(500).json({ error: "Failed to fetch review list" });
  }
});












app.post('/user/api/banks/link', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id; // logged-in user
    const { bankCode, accountNumber, accountName, bvn, pin, consent } = req.body;
    comsole.log("Link bank request:", req.body);

    // (optional) fetch bank name from your banks list collection/api
    const bankName = req.body.bankName || "Unknown Bank";

    // Prepare linked bank object
    const linked = new LinkedBank({
      userId,
      bankCode,
      bankName,
      accountNumber,
      accountName,
      bvn,
      pin,
      consent
    });

    // 🔹 Try fetching account details from external API
    let transactions = [];
    let balance = 0;

    try {
      // Example placeholder API call
      const apiRes = await axios.get(`https://fake-bank-api.com/accounts/${accountNumber}`);

      if (apiRes.data) {
        transactions = apiRes.data.transactions || [];
        balance = apiRes.data.balance || 0;
      }
    } catch (apiErr) {
      console.log("Bank API not available, storing empty data", apiErr.message);
    }

    // Attach transactions + balance
    linked.transactions = transactions;
    linked.balance = balance;

    // Save to DB
    await linked.save();

    res.json({ success: true, bank: linked });

  } catch (err) {
    console.error("Link bank error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// 📌 GET: list linked banks for this user
app.get('/user/api/linked-banks', async (req, res) => {
  try {
    const userId = req.session.user._id;
    const banks = await LinkedBank.find({ userId }).sort({ createdAt: -1 });
    res.json(banks);
  } catch (err) {
    console.error("Get linked banks error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});














// GET Cash Flow Insights
app.get("/cashflow-insights/:recipientId", ensureAuthenticated, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const recipientObjectId = new mongoose.Types.ObjectId(recipientId);

    // 🔹 Overdue Payments
    const today = new Date();
    const overdue = await AccountsPayable.aggregate([
      {
        $match: {
          recipientId, // your schema for AP uses string, so keep as string
          status: { $ne: "paid" },
          dueDate: { $lt: today }
        }
      },
      { $group: { _id: null, total: { $sum: "$ramount" } } }
    ]);
    const overduePayments = overdue.length > 0 ? overdue[0].total : 0;

    // 🔹 Due This Week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date();
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const dueThisWeek = await AccountsPayable.aggregate([
      {
        $match: {
          recipientId,
          status: { $ne: "paid" },
          dueDate: { $gte: startOfWeek, $lte: endOfWeek }
        }
      },
      { $group: { _id: null, total: { $sum: "$ramount" } } }
    ]);
    const dueThisWeekTotal = dueThisWeek.length > 0 ? dueThisWeek[0].total : 0;

    // 🔹 Sales Total
    const sales = await Sales.aggregate([
      { $match: { recipientId: recipientObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const salesTotal = sales.length > 0 ? sales[0].total : 0;

    // 🔹 Expense Total
    const expenses = await Expense.aggregate([
      { $match: { recipientId: recipientObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const expensesTotal = expenses.length > 0 ? expenses[0].total : 0;

    // 🔹 Wallet
    const wallet = await Wallet.findOne({ userId: recipientObjectId });
    const walletBalance = wallet ? wallet.balance : 0;

    // 🔹 Net Available Balance
    const availableBalance = salesTotal - expensesTotal + walletBalance;

    // ✅ Respond as JSON
    res.json({
      overduePayments,
      dueThisWeek: dueThisWeekTotal,
      salesTotal,
      expensesTotal,
      walletBalance,
      availableBalance
    });
  } catch (err) {
    console.error("Cashflow insights error:", err);
    res.status(500).json({ error: "Server error" });
  }
});





// 🔹 Aging Analysis
app.get("/api/aging-analysis/:recipientId", ensureAuthenticated, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const today = new Date();

    // Buckets
    const buckets = {
      "0-30": { label: "0-30 Days", total: 0 },
      "31-60": { label: "31-60 Days", total: 0 },
      "61-90": { label: "61-90 Days", total: 0 },
      "90+": { label: "90+ Days", total: 0 }
    };

    // Get unpaid invoices
    const invoices = await AccountsPayable.find({
      recipientId,
      status: { $ne: "paid" }
    });

    invoices.forEach(inv => {
      const days = Math.floor((today - inv.dueDate) / (1000 * 60 * 60 * 24));

      if (days <= 30) buckets["0-30"].total += inv.ramount;
      else if (days <= 60) buckets["31-60"].total += inv.ramount;
      else if (days <= 90) buckets["61-90"].total += inv.ramount;
      else buckets["90+"].total += inv.ramount;
    });

    res.json(buckets);
  } catch (err) {
    console.error("Aging Analysis error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 Workflow Status
app.get("/api/workflow-status/:recipientId", ensureAuthenticated, async (req, res) => {
  try {
    // Later we can tie this to actual reconciliation runs
    const workflow = [
      {
        step: "Data Import",
        status: "completed",
        subtitle: "Completed at 9:30 AM"
      },
      {
        step: "Auto-Matching",
        status: "completed",
        subtitle: "847 transactions matched"
      },
      {
        step: "Exception Review",
        status: "active",
        subtitle: "23 items pending"
      },
      {
        step: "Journal Entries",
        status: "pending",
        subtitle: "3 entries pending approval"
      }
    ];

    res.json(workflow);
  } catch (err) {
    console.error("Workflow status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.get("/wallet", ensureAuthenticated, checkTier(2), async (req, res) => {
  try {
    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }

    res.render("dashboard/wallet", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
      userTier: req.userTier,   // 👈 pass to frontend
      requiredTier: req.requiredTier
    });
  } catch (err) {
    console.error("Error loading account reconciliation page:", err);
    res.status(500).send("Server error");
  }
});





























function ensureDriverAuth(req, res, next) {
  if (req.session && req.session.driver) {
    return next(); // ✅ Driver session exists
  }
  return res.redirect("/login-driver"); // ❌ Not logged in
}






app.get("/driver-dashboard", ensureDriverAuth, (req, res) => {
  try {
    res.render("dashboard/driverdash/dashboard", {
      driver: req.session.driver, // pass driver details to template
    });
  } catch (err) {
    console.error("Error rendering Driver dash page:", err);
    res.status(500).send("Server error");
  }
});






























async function vendorAuth(req, res, next) {
  try {
    const now = Date.now();
    const redirectUrl = `/vendorAuth?redirect=${encodeURIComponent(req.originalUrl)}`;

    // 🧩 STEP 1: Check Admin/Worker Auth first
    if (req.session.user || req.session.worker) {
      console.log("✅ Admin/Worker authenticated via ensureAuthenticated — access granted to vendor route.");

      let recipientId = null;
      let companyinfo = null;

      if (req.session.user) {
        recipientId = req.session.user._id;
        companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
      } else if (req.session.worker) {
        recipientId = req.session.worker.adminId;
        companyinfo = await Company.findOne({ userId: req.session.worker.adminId });
      }

      req.recipientId = recipientId;
      req.companyinfo = companyinfo;
      req.isVendor = false;
      res.locals.isVendor = false; // Make available to EJS templates
      return next();
    }

    // 🧩 STEP 2: Vendor login check
    if (!req.session.vendor) {
      console.log("🚫 Unauthorized — no vendor session found.");
      req.session.lastLoginOrigin = "vendor";
      return res.redirect(redirectUrl);
    }

    // 🕒 STEP 3: Check vendor inactivity (25 hours)
    const sessionTimeout = 1000 * 60 * 60 * 25; // 25 hours in ms

    if (req.session.lastActivity && now - req.session.lastActivity > sessionTimeout) {
      console.log(`⚠️ Vendor session expired after 25 hours (${req.session.vendor.email}).`);
      req.session.destroy(() => {
        return res.redirect(redirectUrl);
      });
      return;
    }

    // 🧩 STEP 4: Update last activity + attach vendor info
    req.session.lastActivity = now;

    const vendor = await Vendor.findById(req.session.vendor.id);
    if (!vendor) {
      console.log("❌ Vendor not found in DB — clearing session.");
      req.session.destroy(() => res.redirect(redirectUrl));
      return;
    }

    req.recipientId = vendor._id;
    req.companyinfo = {
      companyName: vendor.companyName,
      vendorName: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      description: vendor.description,
    };
    req.isVendor = true;
    res.locals.isVendor = true; // Make available to EJS templates

    console.log(`✅ Vendor authenticated: ${vendor.companyName} (${vendor.email})`);

    next();
  } catch (err) {
    console.error("❌ Vendor Auth Middleware Error:", err);
    res.status(500).send("Server error in authentication middleware");
  }
}





app.get("/vendorAuth", async (req, res) => {
  try {

    const redirect = req.query.redirect || "/";

    res.render("dashboard/vendors/vendorAuth", {
      redirect
    });
  } catch (err) {
    console.error("Error rendering Driver dash page:", err);
    res.status(500).send("Server error");
  }
});






app.get("/Vendors", vendorAuth, async (req, res) => {
  try {
    res.render("dashboard/Procurement_payables/Supplier", {
      user: req.session.user || req.session.worker || req.session.vendor,
      worker: req.session.worker || null,
      companyinfo: req.companyinfo,
      isVendor: req.isVendor
    });
  } catch (err) {
    console.error("Error rendering Vendor page:", err);
    res.status(500).send("Server error");
  }
});



// ✅ GET all vendors
app.get("/api/vendors", async (req, res) => {
  try {
    // 🧩 Get all vendors from AddVendor
    const addedVendors = await AddVendor.find().sort({ createdAt: -1 });

    // 🧩 Get all vendors from Vendor (only rating)
    const vendorRatings = await Vendor.find({}, { email: 1, companyName: 1, rating: 1 });

    // 🧩 Merge only rating info into AddVendor data
    const mergedVendors = addedVendors.map((addV) => {
      const match = vendorRatings.find(
        (v) =>
          v.email === addV.contactInfo || v.companyName === addV.companyName
      );

      return {
        _id: addV._id,
        companyName: addV.companyName,
        category: addV.category,
        contactInfo: addV.contactInfo,
        address: addV.address,
        bankInfo: addV.bankInfo,
        tier3Verified: addV.tier3Verified,
        createdAt: addV.createdAt,
        UserId: addV.UserId,
        rating: match?.rating || { average: 0, totalReviews: 0 }, // ✅ from Vendor model
      };
    });

    res.status(200).json(mergedVendors);
  } catch (err) {
    console.error("Error fetching vendors:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// ✅ Get all vendor applications (you can later filter where tier3Verified is false if needed)
app.get("/api/vendor-applications", async (req, res) => {
  try {
    const applications = await AddVendor.find().sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (err) {
    console.error("Error fetching vendor applications:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ Vendor stats summary
app.get("/api/vendor-stats", async (req, res) => {
  try {
    const totalVendors = await AddVendor.countDocuments();
    const verifiedVendors = await AddVendor.countDocuments({ tier3Verified: true });
    const pendingApplications = await AddVendor.countDocuments({ tier3Verified: false });

    // Average rating (avoid NaN if no vendors)
    const vendors = await AddVendor.find({}, "rating.average");
    const avgRating =
      vendors.length > 0
        ? (
          vendors.reduce((sum, v) => sum + (v.rating?.average || 0), 0) / vendors.length
        ).toFixed(1)
        : 0;

    res.status(200).json({
      totalVendors,
      verifiedVendors,
      pendingApplications,
      avgRating,
    });
  } catch (err) {
    console.error("Error fetching vendor stats:", err);
    res.status(500).json({ error: "Server error" });
  }
});





// APPLICATION COMPANY INFO
app.get("/api/vendors/view/:id", async (req, res) => {
  try {
    console.log("incoming vendor id:", req.params.id); // <- correct debug
    const vendor = await AddVendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    return res.json(vendor);
  } catch (err) {
    console.error("Error fetching vendor:", err);
    return res.status(500).json({ message: "Server error" });
  }
});









// GET APPLICATION TO ADD
// ✅ Get vendor by ID
app.get("/api/vendor/:id", async (req, res) => {
  try {
    const vendor = await AddVendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json(vendor);
  } catch (err) {
    console.error("❌ Error fetching vendor:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// ✅ Update vendor by ID
app.put("/api/vendor/:id", async (req, res) => {
  try {
    const {
      companyName,
      category,
      contactInfo,
      address,
      bankInfo,
      tags
    } = req.body;

    const vendor = await AddVendor.findByIdAndUpdate(
      req.params.id,
      {
        companyName,
        category,
        contactInfo,
        address,
        bankInfo,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      },
      { new: true }
    );

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({ message: "Vendor updated successfully", vendor });
  } catch (err) {
    console.error("❌ Error updating vendor:", err);
    res.status(500).json({ message: "Server error" });
  }
});





// DELETE A VENDOR (with ownership check)
app.delete("/api/vendors/delete/:id", async (req, res) => {
  try {
    const vendorId = req.params.id;
    const { userId } = req.body; // sent from frontend
    console.log("🧾 Delete Request for Vendor:", vendorId, "by User:", userId);

    const vendor = await AddVendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    // Check ownership
    if (vendor.UserId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this vendor" });
    }

    await AddVendor.findByIdAndDelete(vendorId);
    res.json({ message: "Vendor deleted successfully!" });
  } catch (err) {
    console.error("❌ Error deleting vendor:", err);
    res.status(500).json({ message: "Server error" });
  }
});















app.get("/vendor/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid"); // clears the cookie
    res.json({ message: "Logged out successfully" });
  });
});






















app.get("/warehousing", ensureAuthenticated, async (req, res) => {
  try {
    const now = new Date();

    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;



    res.render("dashboard/warehouse/warehousing", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
    });
  } catch (err) {
    console.error("Error loading Order Management page:", err);
    res.status(500).send("Server error");
  }
});


































































app.get("/creditmanagement", ensureAuthenticated, async (req, res) => {
  try {
    const now = new Date();

    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;


    console.log("Rendering credit management for user:", req.session);

    res.render("dashboard/creditmanagement", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
    });
  } catch (err) {
    console.error("Error loading Order Management page:", err);
    res.status(500).send("Server error");
  }
});






app.get("/api/credits", async (req, res) => {
  try {
    const now = new Date();
    const credits = await Credit.find().sort({ createdAt: -1 });

    // Format credits and compute overdue/days left
    const formattedCredits = credits.map(c => {
      const diffDays = Math.ceil((c.dueDate - now) / (1000 * 60 * 60 * 24));
      const daysUntilDue = diffDays > 0 ? diffDays : 0;
      const daysOverdue = diffDays < 0 ? Math.abs(diffDays) : 0;

      return {
        id: c._id,
        customerName: c.customerName,
        currentBalance: c.currentBalance || 0,
        amount: c.amount || 0,
        availableCredit: c.amount || 0,
        paymentType: c.paymentType || "N/A",
        dueDate: c.dueDate,
        daysUntilDue,
        daysOverdue,
        isRepaid: c.isRepaid || false,
      };
    });

    // 🧮 Compute aging buckets
    const buckets = { "0_30": 0, "31_60": 0, "61_90": 0, "90_plus": 0 };
    formattedCredits.forEach(c => {
      if (!c.dueDate) return;
      const diffDays = Math.ceil((c.dueDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays <= 30) buckets["0_30"] += c.amount;
      else if (diffDays > 30 && diffDays <= 60) buckets["31_60"] += c.amount;
      else if (diffDays > 60 && diffDays <= 90) buckets["61_90"] += c.amount;
      else if (diffDays > 90) buckets["90_plus"] += c.amount;
      else if (diffDays <= 0) buckets["90_plus"] += c.amount; // overdue > 90 days also goes here
    });

    res.json({ credits: formattedCredits, buckets });
  } catch (error) {
    console.error("❌ Error fetching credits:", error);
    res.status(500).json({ message: "Server error loading credits" });
  }
});






app.get("/api/credit-summary", async (req, res) => {
  try {
    const now = new Date();
    const credits = await Credit.find();

    const unpaid = credits.filter(c => !c.isRepaid);
    const totalReceivables = unpaid.reduce((sum, c) => sum + c.amount, 0);
    const overdueAccounts = unpaid.filter(c => c.dueDate < now).length;

    const avgCollectionDays =
      unpaid.length > 0
        ? Math.round(
          unpaid.reduce((sum, c) => {
            const diff = (c.dueDate - c.createdAt) / (1000 * 60 * 60 * 24);
            return sum + diff;
          }, 0) / unpaid.length
        )
        : 0;

    // 🧠 New Risk Alert Logic
    const riskAlerts = unpaid.filter(c => {
      const nearDue = (c.dueDate - now) / (1000 * 60 * 60 * 24) <= 3 && (c.dueDate - now) > 0;
      const highInterest =
        c.hasInterest &&
        ((c.interestType === "daily" && c.interestRate > 0.4) ||
          (c.interestType === "monthly" && c.interestRate > 5) ||
          (c.interestType === "yearly" && c.interestRate > 20));
      return nearDue || highInterest;
    }).length;

    res.json({
      totalReceivables,
      overdueAccounts,
      avgCollectionDays,
      riskAlerts,
    });
  } catch (err) {
    console.error("❌ Error fetching credit summary:", err);
    res.status(500).json({ message: "Server error loading summary" });
  }
});



app.get("/api/credits/:customerName", async (req, res) => {
  try {
    const { customerName } = req.params;
    const credits = await Credit.find({ customerName }).sort({ createdAt: -1 });

    res.json({ credits });
  } catch (err) {
    console.error("❌ Error fetching creditor data:", err);
    res.status(500).json({ message: "Server error loading creditor records" });
  }
});






// 💸 Auto-update interest-based credits
const applyInterestToCredits = async () => {
  try {
    const credits = await Credit.find({ hasInterest: true });

    const now = new Date();

    for (const c of credits) {
      const lastApplied = c.lastInterestApplied || c.createdAt;
      const diffDays = Math.floor((now - lastApplied) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) continue; // no update yet

      let increaseFactor = 0;
      switch (c.interestType) {
        case "daily":
          increaseFactor = c.interestRate * diffDays;
          break;
        case "monthly":
          increaseFactor = c.interestRate * (diffDays / 30);
          break;
        case "yearly":
          increaseFactor = c.interestRate * (diffDays / 365);
          break;
        default:
          increaseFactor = 0;
      }

      // Add interest (either in % or flat depending on your definition)
      const interestAmount = c.amount * (increaseFactor / 100);
      c.currentBalance += interestAmount;
      c.lastInterestApplied = now;

      await c.save();
    }

    console.log("💹 Interest updated for credits");
  } catch (err) {
    console.error("❌ Error applying interest:", err);
  }
};


// Run once at boot
applyInterestToCredits();

// Schedule daily updates
setInterval(applyInterestToCredits, 24 * 60 * 60 * 1000);








app.get("/finance", ensureAuthenticated, async (req, res) => {
  try {
    const now = new Date();

    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;



    res.render("dashboard/finance", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
    });
  } catch (err) {
    console.error("Error loading Order Management page:", err);
    res.status(500).send("Server error");
  }
});



// 📦 Inventory Valuation Summary API
app.get("/user/finance/valuation", async (req, res) => {
  try {
    console.log("📊 Fetching inventory valuation data...");

    const Inventory = require("./models/inventory");

    // 🔍 Optional query param: /user/finance/valuation?id=xxxx
    const { id } = req.query;

    if (id) {
      console.log("🆔 Fetching specific inventory item:", id);

      const item = await Inventory.findById(id);
      if (!item) {
        console.log("⚠️ No inventory found with that ID");
        return res.status(404).json({ error: "Item not found" });
      }

      const totalValue = item.currentquantity * item.bcost;
      const cogsImpact = (item.scost - item.bcost) * item.currentquantity;

      console.log("✅ Valuation (single item):", {
        name: item.itemName,
        qty: item.currentquantity,
        unitCost: item.bcost,
        totalValue,
        cogsImpact,
      });

      return res.json({
        valuation: {
          name: item.itemName,
          qty: item.currentquantity,
          unitCost: item.bcost,
          totalValue,
          cogsImpact,
        },
        totalValue,
      });
    }

    // 📋 Otherwise, fetch all inventory
    const items = await Inventory.find({});
    console.log(`📦 Found ${items.length} inventory items`);

    const valuation = items.map(item => {
      const totalValue = item.currentquantity * item.bcost;
      const cogsImpact = (item.scost - item.bcost) * item.currentquantity;

      return {
        name: item.itemName,
        qty: item.currentquantity,
        unitCost: item.bcost,
        totalValue,
        cogsImpact,
      };
    });

    const totalValue = valuation.reduce((sum, v) => sum + v.totalValue, 0);

    console.log("📈 Total Valuation:", totalValue);
    res.json({
      valuation,
      totalValue,
    });

  } catch (err) {
    console.error("❌ Error fetching inventory valuation:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// 📈 Financial Ratios Summary API (DEBUG MODE)
app.get("/user/finance/ratios", async (req, res) => {
  try {


    // optional
    let Liabilities;
    try {
      Liabilities = require("./models/liabilities");
    } catch {
      console.log("⚠️ No liabilities model found. Skipping...");
    }

    // 🧮 1️⃣ Aggregate totals
    const salesAgg = await Sales.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
    const expenseAgg = await Expense.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);



    const totalSales = salesAgg[0]?.total || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;
    const netProfit = totalSales - totalExpenses;

    // 🧾 Optional liabilities
    let totalLiabilities = 0;
    if (Liabilities) {
      const liabAgg = await Liabilities.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).catch(err => {
        console.log("⚠️ Liabilities aggregate error:", err.message);
        return [];
      });
      console.log("📚 liabAgg:", liabAgg);
      totalLiabilities = liabAgg[0]?.total || 0;
    }

    // 💰 Ratios
    const currentRatio = totalExpenses > 0 ? (totalSales / totalExpenses).toFixed(2) : "0.00";
    const quickRatio = (currentRatio * 0.75).toFixed(2);
    const debtToEquity = totalLiabilities > 0 ? (totalLiabilities / (totalSales - totalExpenses)).toFixed(2) : "0.00";
    const netProfitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) : "0.00";



    // 🕐 Mock trends
    const trendData = {
      labels: ["Aug", "Sep", "Oct", "Nov"],
      profitMargin: [12.5, 15.3, 17.2, parseFloat(netProfitMargin)],
    };

    // ✅ Send JSON response
    res.json({
      totalSales,
      totalExpenses,
      totalLiabilities,
      netProfit,
      ratios: {
        currentRatio,
        quickRatio,
        debtToEquity,
        netProfitMargin,
      },
      trendData,
    });

  } catch (err) {
    console.error("❌ [Finance] Error fetching ratios:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.get("/api/finance/reports", async (req, res) => {
  try {
    // 🧾 Fetch Receivables & Payables
    const receivables = await AccountReceivable.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const payables = await AccountsPayable.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // 🧱 Assets & Loans
    const assets = await Asset.aggregate([
      { $group: { _id: null, total: { $sum: "$value" } } }
    ]);
    const loans = await Credit.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // 🧮 Generate Monthly summary
    const month = new Date().toLocaleString("default", { month: "long" });
    const year = new Date().getFullYear();

    // 💡 Quick liquidity insight
    const ratio = (receivables[0]?.total || 0) / ((payables[0]?.total || 1));
    let notes = "";
    if (ratio > 1.2) notes = "Cash inflow strong relative to obligations.";
    else if (ratio < 0.9) notes = "Liquidity strain detected — review short-term debt.";

    res.json({
      month,
      year,
      receivables: receivables[0]?.total || 0,
      payables: payables[0]?.total || 0,
      assets: assets[0]?.total || 0,
      loans: loans[0]?.total || 0,
      notes,
    });
  } catch (err) {
    console.error("Finance report error:", err);
    res.status(500).json({ message: "Error generating finance report" });
  }
});







// routes/financeRoutes.js
app.get("/api/finance-metrics", async (req, res) => {
  try {
    const sales = await Sales.find();
    const expenses = await Expense.find();

    console.log("🧾 Sales Data:", sales);
    console.log("💸 Expense Data:", expenses);

    const totalRevenue = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    console.log("📊 Total Revenue:", totalRevenue);
    console.log("📉 Total Expense:", totalExpense);

    const totalAssets = totalRevenue; // you can customize if needed
    const totalLiabilities = totalExpense;
    const netProfitMargin = totalRevenue
      ? (totalRevenue - totalExpense) / totalRevenue
      : 0;

    console.log("💰 Computed Metrics =>", {
      totalAssets,
      totalLiabilities,
      netProfitMargin,
    });

    res.json({
      totalAssets,
      totalLiabilities,
      netProfitMargin,
    });
  } catch (err) {
    console.error("❌ Finance Metrics Error:", err);
    res.status(500).json({ message: err.message });
  }
});























app.get("/taxation", ensureAuthenticated, async (req, res) => {
  try {
    const now = new Date();

    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;



    res.render("dashboard/taxation/taxation", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
    });
  } catch (err) {
    console.error("Error loading Order Management page:", err);
    res.status(500).send("Server error");
  }
});













app.get("/statutory", ensureAuthenticated, async (req, res) => {
  try {
    const now = new Date();

    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;



    res.render("dashboard/taxation/statutory", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
    });
  } catch (err) {
    console.error("Error loading Order Management page:", err);
    res.status(500).send("Server error");
  }
});


























app.get("/Audit", ensureAuthenticated, async (req, res) => {
  try {
    const now = new Date();

    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;



    res.render("dashboard/wisdom/audit", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
    });
  } catch (err) {
    console.error("Error loading Order Management page:", err);
    res.status(500).send("Server error");
  }
});

app.get("/Auditmanual", ensureAuthenticated, async (req, res) => {
  try {
    const now = new Date();

    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;



    res.render("dashboard/auditing/auditmanual", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
    });
  } catch (err) {
    console.error("Error loading Order Management page:", err);
    res.status(500).send("Server error");
  }
});

app.get("/Auditplanning", ensureAuthenticated, async (req, res) => {
  try {
    const now = new Date();

    let recipientId = null;
    let companyinfo = null;

    if (req.session.user) {
      // ✅ Admin logged in
      recipientId = req.session.user._id;
      companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    } else if (req.session.worker) {
      // ✅ Worker logged in → use admin’s ID
      recipientId = req.session.worker.adminId;
      companyinfo = await Company.findOne({ reciepientId: req.session.worker.adminId });
    } else {
      return res.redirect("/login");
    }
    const userId = recipientId;



    res.render("dashboard/auditing/auditplanning", {
      user: req.session.user,
      worker: req.session.worker || null,
      companyinfo,
    });
  } catch (err) {
    console.error("Error loading Order Management page:", err);
    res.status(500).send("Server error");
  }
});












































app.get("/ap", (req, res) => {
  res.render("dashboard/ap");
});


app.get("/automationsettings", (req, res) => {
  res.render("dashboard/automationsettings");
});














app.get("/auditplanning", (req, res) => {
  res.render("dashboard/auditing/auditplanning");
});

app.get("/auditautomatic", (req, res) => {
  res.render("dashboard/auditing/auditautomatic");
});

app.get("/auditmanual", (req, res) => {
  res.render("dashboard/auditing/auditmanual");
});



app.get("/land", (req, res) => {
  res.render("land");
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
  expireSubscriptions();
})