# AdNet Security Hardening - Manual Implementation Guide

## What Has Been Done ✅

1. **Security Packages Installed**
   - `express-validator` - Input validation
   - `express-rate-limit` - Rate limiting
   - `helmet` - Security headers
   - `winston` - Logging

2. **Middleware Files Created**
   - `/middleware/validation.js` - Complete input validation system
   - `/middleware/rateLimiter.js` - Multiple rate limiting tiers
   - `/middleware/errorHandler.js` - Centralized error handling + logging

3. **Session Secret Generated**
   - Strong 64-character secret: `40cd3c699a1eeec2df996d233d6069d3c705a16b3a7601731268d7a285f19cae`

## What Needs To Be Done ⚠️

### Step 1: Update `.env` File

Add these lines to your `.env` file:

```env
# Security Configuration
SESSION_SECRET=40cd3c699a1eeec2df996d233d6069d3c705a16b3a7601731268d7a285f19cae
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**For production**, change `NODE_ENV=production`

### Step 2: Update `server.js`

#### 2.1 Add Imports (After line ~81 where you have `const session = require("express-session")`)

```javascript
// Security middleware
const helmet = require('helmet');
const { strictLimiter, standardLimiter, lenientLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler, logger } = require('./middleware/errorHandler');
const { validators, handleValidationErrors } = require('./middleware/validation');
```

#### 2.2 Add Security Middleware (After Express app initialization, before routes)

```javascript
//  ==============================================================================
// SECURITY MIDDLEWARE CONFIGURATION
// ==============================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Set to true with proper CSP config in production  
  crossOriginEmbedderPolicy: false // Allow embedding for EJS templates
}));

// CORS configuration - replace existing app.use(cors())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### 2.3 Update Session Configuration (Replace existing session config ~line 101-107)

**OLD (REMOVE THIS):**
```javascript
app.use(session({
    secret: "nelly",  // ❌ WEAK
    resave: false,
    saveUninitialized: true,  // ❌ INSECURE
    store:MongoStore.create({mongoUrl: process.env.MONGODB_CONNECTION}),
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }  // ❌ INSECURE
}));
```

**NEW (REPLACE WITH):**
```javascript
// Session configuration with security hardening
app.use(session({
    secret: process.env.SESSION_SECRET || '40cd3c699a1eeec2df996d233d6069d3c705a16b3a7601731268d7a285f19cae',
    resave: false,
    saveUninitialized: false,  // ✅ Don't save empty sessions
    store: MongoStore.create({mongoUrl: process.env.MONGODB_CONNECTION}),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',  // ✅ HTTPS in production
      httpOnly: true,  // ✅ Prevent XSS
      sameSite: 'strict',  // ✅ CSRF protection
      maxAge: 1000 * 60 * 60 * 24
    },
    name: 'sessionId'  // ✅ Hide default session name
}));
```

#### 2.4 Update Database Logging (Replace console.log with logger ~line 97)

**OLD:**
```javascript
mongoose.connect(process.env.MONGODB_CONNECTION).then(()=>{console.log("Database Connected")}).catch((err)=>{console.log(err)});
```

**NEW:**
```javascript
mongoose.connect(process.env.MONGODB_CONNECTION).then(()=>{logger.info("Database Connected")}).catch((err)=>{logger.error(err)});
```

#### 2.5 Add Rate Limiting to Auth Routes

Find where you have:
```javascript
app.use("/api/auth", authRoutes);
```

**Replace with:**
```javascript
app.use("/api/auth", strictLimiter, authRoutes);  // ✅ Rate limit auth endpoints
```

#### 2.6 Add Error Handlers (At the END of server.js, just before `app.listen()`)

```javascript
// ==============================================================================
// ERROR HANDLERS (Must be AFTER all routes)
// ==============================================================================

// 404 handler
app.use(not FoundHandler);

// Global error handler
app.use(errorHandler);
```

#### 2.7 Remove Duplicate/Redundant Middleware

**Remove these lines if present:**
```javascript
app.use(bodyparser.urlencoded({ extended: true }))  // ❌ Remove (redundant)
app.use(bodyparser.json())  // ❌ Remove (redundant)
app.use(cors())  // ❌ Remove if you have it twice
```

**Keep only:**
```javascript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

### Step 3: Add Validation to Critical Routes (Examples)

#### Example: Validate `/Businessinfo` route

**Before:**
```javascript
app.get("/Businessinfo", async (req, res) => {
  const userId = req.query.id;  // ❌ No validation
  ...
});
```

**After:**
```javascript
app.get("/Businessinfo", [
  validators.userId(),  // ✅ Validate ID
  handleValidationErrors
], async (req, res) => {
  const userId = req.query.id;
  ...
});
```

#### Example: Validate POST routes (like login)

```javascript
app.post("/login", [
  validators.email(),
  body('password').notEmpty(),
  handleValidationErrors,
  strictLimiter  // Rate limit
], async (req, res) => {
  // login logic
});
```

### Step 4: Update auditController.js

In `/controllers/auditController.js`, update error responses to NOT expose internal details:

**Before:**
```javascript
res.status(500).json({ success: false, message: `Server Error during audit: ${error.name}` });
```

**After:**
```javascript
logger.error('Audit error:', error);  // Log server-side
res.status(500).json({ success: false, message: 'An error occurred during audit' });  // Generic message
```

### Step 5: Clean Up package.json

Remove duplicate dependencies:

```bash
npm uninstall bcrypt body-parser
```

Keep `bcryptjs` (already have it), remove `bcrypt`.
Remove `body-parser` (built into Express 4.16+).

### Step 6: Create logs directory

```bash
mkdir logs
```

The winston logger will write to `logs/error.log` and `logs/combined.log`.

## Testing Checklist

After implementation:

- [ ] Server starts without errors
- [ ] Login still works
- [ ] Rate limiting prevents >5 login attempts in 15 min
- [ ] Invalid IDs return 400 errors (not 500)
- [  ] Session cookies have `httpOnly`, `sameSite` flags
- [ ] HTTPS redirect works in production

## Security Improvements Summary

| Issue | Before | After | Impact |
|-------|--------|-------|--------|
| Session Secret | "nelly" (weak) | 64-char random | HIGH 🔴 |
| Cookie Security | `secure: false` | `secure: true` in prod | HIGH 🔴 |
| Input Validation | None | express-validator | HIGH 🔴 |
| Rate Limiting | None | 5 attempts/15min | MEDIUM 🟡 |
| Security Headers | None | Helmet.js | MEDIUM 🟡 |
| Error Exposure | Details leaked | Generic messages | MEDIUM 🟡 |
| Logging | console.log | Winston | LOW 🟢 |

## Next Steps (Optional)

1. **Add CSRF tokens** for form submissions
2. **Enable CSP** (Content Security Policy) in Helmet
3. **Add 2FA** for admin accounts
4. **Database encryption** at rest
5. **Regular security audits** with `npm audit`

---

**CRITICAL**: Test in development before deploying to production!
