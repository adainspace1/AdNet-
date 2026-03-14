// controllers/anchorController.js
const AnchorProfile = require('../models/AnchorProfile');
const AnchorTransaction = require('../models/AnchorTransaction');
const AnchorWebhookLog = require('../models/AnchorWebhookLog');
const anchorService = require('../services/anchorService');
const Company = require('../models/company');

// show signup page
exports.signupForm = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const profile = await AnchorProfile.findOne({ userId });
    // fetch company info for topnav
    let companyinfo = null;
    if (req.session.user) companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    else if (req.session.worker) companyinfo = await Company.findOne({ userId: req.session.worker.adminId });

    return res.render('wallet/anchor/signup', { profile, user: req.session.user, worker: req.session.worker, companyinfo, isVendor: req.isVendor || false });
  } catch (err) {
    console.error('anchor.signupForm error', err);
    res.status(500).send('Server error');
  }
};

exports.signup = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const {
      businessName,
      businessBvn,
      industry,
      registrationType,
      dateOfRegistration,
      description,
      website,
      contactEmailGeneral,
      contactEmailSupport,
      contactEmailDispute,
      contactPhone,
      mainCountry,
      mainState,
      mainAddressLine1,
      mainAddressLine2,
      mainCity,
      mainPostalCode,
      registeredCountry,
      registeredState,
      registeredAddressLine1,
      registeredAddressLine2,
      registeredCity,
      registeredPostalCode,
      addressCountry,
      addressState
    } = req.body;

    // Officers come as req.body.officers object with numeric keys
    const officers = req.body.officers ? Object.values(req.body.officers) : [];

    if (!businessName || !businessBvn) {
      return res.status(400).json({
        success: false,
        message: 'Business name and Business BVN are required'
      });
    }

    if (!/^\d{11}$/.test(businessBvn)) {
      return res.status(400).json({
        success: false,
        message: 'Business BVN must be exactly 11 digits'
      });
    }

    if (officers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one officer is required'
      });
    }

    // Validate officers
    for (let i = 0; i < officers.length; i++) {
      const officer = officers[i];
      if (!officer.bvn || !/^\d{11}$/.test(officer.bvn)) {
        return res.status(400).json({
          success: false,
          message: `Officer ${i + 1} must have a valid 11-digit BVN`
        });
      }
      if (!officer.firstName || !officer.lastName || !officer.email || !officer.phoneNumber) {
        return res.status(400).json({
          success: false,
          message: `Officer ${i + 1} must have complete name, email, and phone number`
        });
      }
    }

    // Build officers array
    const officersArray = officers.map(officer => ({
      role: officer.role,
      fullName: {
        firstName: officer.firstName,
        lastName: officer.lastName,
        middleName: officer.middleName,
        maidenName: officer.maidenName
      },
      nationality: officer.nationality || 'NG',
      address: {
        country: officer.country || 'NG',
        state: officer.state,
        addressLine_1: officer.addressLine1,
        addressLine_2: officer.addressLine2,
        city: officer.city,
        postalCode: officer.postalCode
      },
      dateOfBirth: new Date(officer.dateOfBirth),
      email: officer.email,
      phoneNumber: officer.phoneNumber,
      bvn: officer.bvn,
      title: officer.title,
      percentageOwned: parseFloat(officer.percentageOwned) || 0
    }));

    // 1️⃣ FIRST — Create Anchor Customer
    // Anchor expects `industry` at the top-level of attributes (not nested inside basicDetail)
    const normalizedDateOfRegistration = dateOfRegistration ? String(dateOfRegistration).split('T')[0] : null;

    const payload = {
      data: {
        type: "BusinessCustomer",
        attributes: {
          industry: industry,
          basicDetail: {
            businessName: businessName,
            businessBvn: businessBvn,
            registrationType: registrationType,
            country: "NG",
            dateOfRegistration: normalizedDateOfRegistration,
            description: description,
            website: website
          },
          contact: {
            email: {
              general: contactEmailGeneral,
              support: contactEmailSupport,
              dispute: contactEmailDispute
            },
            phoneNumber: contactPhone,
            address: {
              main: {
                country: mainCountry || "NG",
                state: mainState,
                addressLine_1: mainAddressLine1,
                addressLine_2: mainAddressLine2,
                city: mainCity,
                postalCode: mainPostalCode
              },
              registered: {
                country: registeredCountry || "NG",
                state: registeredState,
                addressLine_1: registeredAddressLine1,
                addressLine_2: registeredAddressLine2,
                city: registeredCity,
                postalCode: registeredPostalCode
              }
            }
          },
          address: {
            country: addressCountry || "NG",
            state: addressState
          },
          officers: officersArray
        }
      }
    };

    let anchorCustomerId;

    try {
      const result = await anchorService.createBusinessCustomer(payload);

      if (!result || !result.data || !result.data.id) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create Anchor customer'
        });
      }

      anchorCustomerId = result.data.id;

    } catch (apiErr) {
      console.error('Anchor signup failed:', apiErr.response?.data || apiErr.message);

      return res.status(400).json({
        success: false,
        message: 'Unable to create Anchor account. Please try again.'
      });
    }

    // 2️⃣ ONLY SAVE IF ANCHOR SUCCEEDS
    const profile = await AnchorProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        // Basic Detail
        businessName,
        businessBvn,
        industry,
        registrationType,
        dateOfRegistration: new Date(dateOfRegistration),
        description,
        website,
        // Contact
        contactEmail: {
          general: contactEmailGeneral,
          support: contactEmailSupport,
          dispute: contactEmailDispute
        },
        contactPhone,
        contactAddress: {
          main: {
            country: mainCountry || "NG",
            state: mainState,
            addressLine_1: mainAddressLine1,
            addressLine_2: mainAddressLine2,
            city: mainCity,
            postalCode: mainPostalCode
          },
          registered: {
            country: registeredCountry || "NG",
            state: registeredState,
            addressLine_1: registeredAddressLine1,
            addressLine_2: registeredAddressLine2,
            city: registeredCity,
            postalCode: registeredPostalCode
          }
        },
        // Address
        address: {
          country: addressCountry || "NG",
          state: addressState
        },
        // Officers
        officers: officersArray,
        // Anchor data
        anchorCustomerId,
        kycStatus: 'pending'
      },
      { upsert: true, new: true }
    );

    return res.redirect('/wallet/anchor/dashboard');

  } catch (err) {
    console.error('anchor.signup error', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// create deposit account
exports.createAccount = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const profile = await AnchorProfile.findOne({ userId });
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete signup first'
      });
    }

    // 🚫 Do NOT auto-create missing customer here
    if (!profile.anchorCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer not initialized. Please complete signup again.'
      });
    }

    // 🚫 Prevent duplicate deposit accounts
    if (profile.anchorAccountId) {
      return res.redirect('/wallet/anchor/dashboard');
    }

    const payload = {
      data: {
        type: "deposit-account",
        attributes: {
          currency: "NGN"
        }
      }
    };

    let result;

    try {
      result = await anchorService.createDepositAccount(
        profile.anchorCustomerId,
        payload
      );
    } catch (apiErr) {
      console.error(
        "Deposit account creation failed:",
        apiErr.response?.data || apiErr.message
      );

      return res.status(400).json({
        success: false,
        message: "Failed to create deposit account. Please try again."
      });
    }

    if (!result || !result.data || !result.data.id) {
      return res.status(400).json({
        success: false,
        message: "Invalid response from Anchor."
      });
    }

    // ✅ Only save AFTER Anchor success
    profile.anchorAccountId = result.data.id;
    profile.anchorAccountNumber =
      result.data.attributes?.account_number || "";

    await profile.save();

    return res.redirect('/wallet/anchor/dashboard');

  } catch (err) {
    console.error('anchor.createAccount error', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// fetch balance and render dashboard
exports.dashboard = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const profile = await AnchorProfile.findOne({ userId });
    let balance = null;
    let transactions = [];

    if (profile && profile.anchorAccountId) {
      try {
        const balRes = await anchorService.getAccountBalance(profile.anchorAccountId);
        balance = balRes.data ? balRes.data.balance : null;
      } catch (err) {
        console.warn('anchor.dashboard getBalance failed', err.message);
      }

      transactions = await AnchorTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }

    // fetch company info for topnav
    let companyinfo = null;
    if (req.session.user) companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    else if (req.session.worker) companyinfo = await Company.findOne({ userId: req.session.worker.adminId });

    return res.render('wallet/anchor/dashboard', { profile, balance, transactions, user: req.session.user, worker: req.session.worker, companyinfo, isVendor: req.isVendor || false });
  } catch (err) {
    console.error('anchor.dashboard error', err);
    res.status(500).send('Server error');
  }
};

// show send form
exports.sendForm = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const profile = await AnchorProfile.findOne({ userId });
    let companyinfo = null;
    if (req.session.user) companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    else if (req.session.worker) companyinfo = await Company.findOne({ userId: req.session.worker.adminId });
    return res.render('wallet/anchor/send', { profile, user: req.session.user, worker: req.session.worker, companyinfo, isVendor: req.isVendor || false });
  } catch (err) {
    console.error('anchor.sendForm error', err);
    res.status(500).send('Server error');
  }
};

// handle send POST
exports.send = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { recipientAccount, bank, amount, description } = req.body;

    if (!recipientAccount || !bank || !amount) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const profile = await AnchorProfile.findOne({ userId });
    if (!profile || !profile.anchorAccountId) {
      return res.status(400).json({ success: false, message: 'No anchor account' });
    }

    const payload = {
      toAccount: recipientAccount,
      toBank: bank,
      amount,
      description
    };
    const apiRes = await anchorService.initiateTransfer(profile.anchorAccountId, payload);

    // log transaction
    const tx = await AnchorTransaction.create({
      userId,
      anchorTransactionId: apiRes.data ? apiRes.data.id : undefined,
      type: 'debit',
      amount,
      status: apiRes.data && apiRes.data.status ? apiRes.data.status : 'pending',
      reference: apiRes.data ? apiRes.data.reference : undefined,
      description: description || ''
    });

    // redirect to transactions page with simple query flag
    res.redirect('/wallet/anchor/transactions?sent=1');
  } catch (err) {
    console.error('anchor.send error', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// transactions list page
exports.transactions = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const txs = await AnchorTransaction.find({ userId }).sort({ createdAt: -1 }).lean();
    let companyinfo = null;
    if (req.session.user) companyinfo = await Company.findOne({ reciepientId: req.session.user._id });
    else if (req.session.worker) companyinfo = await Company.findOne({ userId: req.session.worker.adminId });
    res.render('wallet/anchor/transactions', { transactions: txs, sent: req.query.sent, user: req.session.user, worker: req.session.worker, companyinfo, isVendor: req.isVendor || false });
  } catch (err) {
    console.error('anchor.transactions error', err);
    res.status(500).send('Server error');
  }
};

// webhook handler
exports.webhook = async (req, res) => {
  try {
    const verified = anchorService.verifyWebhookSignature(req.headers, req.body);
    if (!verified) {
      console.warn('anchor.webhook signature failed');
      return res.status(400).send('invalid signature');
    }

    const event = req.body.event || req.body.type;

    // log raw payload
    await AnchorWebhookLog.create({ eventType: event, payload: req.body });

    // process events
    if (event === 'transaction.updated' || event === 'transfer.success' || event === 'transfer.failed') {
      const data = req.body.data || {};
      const ref = data.reference || data.id;
      if (ref) {
        let status = data.status || data.state || 'pending';
        await AnchorTransaction.findOneAndUpdate({ reference: ref }, { status });
      }
    }

    // future reconciliation trigger would go here
    res.json({ received: true });
  } catch (err) {
    console.error('anchor.webhook error', err);
    res.status(500).send('Server error');
  }
};
