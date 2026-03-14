const express = require('express');
const router = express.Router();
const anchorController = require('../controllers/anchorController');

// ensure user is authenticated middleware
function ensureAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/');
}

// onboarding
router.get('/signup', ensureAuth, anchorController.signupForm);
router.post('/signup', ensureAuth, anchorController.signup);

// create deposit account
router.post('/create-account', ensureAuth, anchorController.createAccount);

// dashboard & balance
router.get('/dashboard', ensureAuth, anchorController.dashboard);
router.get('/balance', ensureAuth, anchorController.dashboard); // alias

// send funds
router.get('/send', ensureAuth, anchorController.sendForm);
router.post('/send', ensureAuth, anchorController.send);

// transactions list
router.get('/transactions', ensureAuth, anchorController.transactions);

// webhook
router.post('/webhook', anchorController.webhook);

module.exports = router;
