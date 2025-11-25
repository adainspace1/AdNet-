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



const Driver = require("./models/Driver");


const Wallet = require('./models/Wallet');
const WalletTransaction = require("./models/WalletTransaction");
const Reconciliation = require("./models/Reconciliation"); // if you track mismatches
const Invoice = require("./models/Invoice"); // if you track mismatches
const LinkedBank = require("./models/LinkedBank"); // if you track mismatches





// services/paystackService.js
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


const bcrypt = require('bcrypt');
// Get from your env
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const port = 3900
const MongoStore = require("connect-mongo");
const ejs = require("ejs");
const session = require("express-session")

const vendorRoutes = require("./routes/vendorRoutes");
const authRoutes = require("./routes/adminroutes");
const userRoutes = require("./routes/userroutes");
const driverRoutes = require("./routes/driverRoutes");
const production = require('./models/production');

// Security middleware
const helmet = require('helmet');
const { strictLimiter, standardLimiter, lenientLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler, logger } = require('./middleware/errorHandler');
const { validators, handleValidationErrors } = require('./middleware/validation');


// ==================================================
// MIDDLEWARE CONFIGURATION
// ==================================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Set to true with proper CSP config in production
    crossOriginEmbedderPolicy: false // Allow embedding for EJS templates
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_CONNECTION).then(() => { logger.info("Database Connected") }).catch((err) => { logger.error(err) });

// Session configuration with security hardening
app.use(session({
    secret: process.env.SESSION_SECRET || '40cd3c699a1eeec2df996d233d6069d3c705a16b3a7601731268d7a285f19cae',
    resave: false,  // Prevents session from saving on every request
    saveUninitialized: false,  // Don't save empty sessions (security best practice)
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_CONNECTION }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
        httpOnly: true,  // Prevent XSS attacks
        sameSite: 'strict',  // CSRF protection
        maxAge: 1000 * 60 * 60 * 24  // 24 hours session lifespan
    },
    name: 'sessionId'  // Change default session cookie name for security through obscurity
}));

// View engine and static files
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'assets')));
app.set('views', path.join(__dirname, 'views'));


// ==================================================
// ROUTES
// ==================================================

app.use("/api/auth", authRoutes);
app.use("/api/driver", driverRoutes);
app.use("/user", userRoutes);
app.use("/api/vendors", vendorRoutes);
