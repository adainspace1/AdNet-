// controllers/walletController.js
const Wallet = require('../models/Wallet');
const LinkedBank = require('../models/LinkedBank');
const WalletTransaction = require('../models/WalletTransaction');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));


// ENV config
const { PAYSTACK_SECRET_KEY } = process.env;

// Stubbed Paystack client — replace with real SDK/API later
const paystackClient = {
  async createWalletForUser(userId) {
    return { success: true, providerId: `ps_${userId}`, balance: 0 };
  },
  async getBalance(providerId) {
    return 0; // replace with real Paystack API call
  },
};

module.exports = {
  // GET /api/wallet/status
  async status(req, res) {
    try {
      const userId = req.session.user ? req.session.user._id : req.session.worker.adminId;
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return res.json({ hasWallet: false, provider: 'paystack', balance: null });
      }
      let balance = wallet.balance || 0;
      return res.json({ hasWallet: true, provider: wallet.provider, balance });
    } catch (err) {
      console.error('wallet status error', err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // POST /api/wallet/create
  async createWallet(req, res) {
    try {
      const userId = req.session.user ? req.session.user._id : req.session.worker.adminId;
      const result = await paystackClient.createWalletForUser(userId);
      if (!result || !result.success) {
        return res.json({ success: false, message: 'Provider failed to create wallet' });
      }

      const wallet = await Wallet.findOneAndUpdate(
        { userId },
        {
          userId,
          provider: 'paystack',
          providerId: result.providerId,
          balance: result.balance || 0,
        },
        { upsert: true, new: true }
      );

      return res.json({ success: true, wallet });
    } catch (err) {
      console.error('createWallet error', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // GET /api/banks/list
  async banksList(req, res) {
    try {
      const static = [
        { code: '044', name: 'Access Bank' },
        { code: '058', name: 'GTBank' },
        { code: '033', name: 'UBA' },
        { code: '057', name: 'Zenith Bank' },
        { code: '011', name: 'First Bank' },
        // add more as needed
      ];
      return res.json(static);
    } catch (err) {
      console.error('banksList error', err);
      res.status(500).json([]);
    }
  },

  // POST /api/banks/link
  async linkBank(req, res) {
    try {
      const userId = req.session.user ? req.session.user._id : req.session.worker.adminId;
      const { bank, accountNumber, bvn, pin, consent } = req.body;
      if (!consent) return res.json({ success: false, message: 'Consent required' });

      // Save linked bank directly (since OnePipe is removed)
      const linked = new LinkedBank({
        userId,
        bankCode: bank,
        bankName: bank, // map properly if you want
        accountNumber,
        accountName: null,
        providerId: null,
        balance: 0,
        metadata: { bank, accountNumber, bvn, pin },
      });
      await linked.save();
      return res.json({ success: true, linked });
    } catch (err) {
      console.error('linkBank error', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // GET /api/linked-banks
  async getLinkedBanks(req, res) {
    try {
      const userId = req.session.user ? req.session.user._id : req.session.worker.adminId;
      const banks = await LinkedBank.find({ userId }).sort({ createdAt: -1 }).lean();
      res.json(banks);
    } catch (err) {
      console.error('getLinkedBanks error', err);
      res.status(500).json([]);
    }
  },

  // Paystack webhook
  async paystackWebhook(req, res) {
    console.log('paystack webhook', req.body);
    res.json({ received: true });
  },

  // Manual reconcile runner
  async runReconcile(req, res) {
    try {
      const userId = req.session.user ? req.session.user._id : req.session.worker.adminId;
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) return res.status(400).json({ success: false, message: 'No wallet' });

      let providerBalance = 0;
      if (wallet.provider === 'paystack') providerBalance = await paystackClient.getBalance(wallet.providerId);

      const diff = (wallet.balance || 0) - (providerBalance || 0);
      res.json({ success: true, walletBalance: wallet.balance, providerBalance, diff });
    } catch (err) {
      console.error('reconcile error', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
};





module.exports.fundWallet = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { amount, reference } = req.body;

    if (!amount || !reference) {
      return res.status(400).json({ success: false, message: "Missing amount or reference" });
    }

    // ✅ Verify transaction with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // ✅ Credit wallet
    let wallet = await Wallet.findOne({ userId });
    wallet.balance += amount;
    await wallet.save();

    const tx = await WalletTransaction.create({
      userId,
      walletId: wallet._id,
      type: "credit",
      amount,
      description: "Funded via Paystack",
      reference,
      status: "success"
    });

    res.json({ success: true, wallet, transaction: tx });
  } catch (err) {
    console.error("fundWallet error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports.withdrawFunds = async (req, res) => {
      try {
        console.log("=== Withdraw request received ===");
        console.log("Request body:", req.body);

        const userId = req.session.user._id;
        console.log("User ID:", userId);

        const { amount, bank, account } = req.body;
        console.log("Withdrawal details -> Amount:", amount, "Bank Code:", bank, "Account:", account);

        // ✅ Validate input
        if (!amount || amount <= 0) {
          console.warn("❌ Invalid amount");
          return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
          console.warn("❌ Wallet not found for user:", userId);
          return res.status(404).json({ success: false, message: "Wallet not found" });
        }

        console.log("Wallet found -> Current balance:", wallet.balance);

        if (wallet.balance < amount) {
          console.warn("❌ Insufficient balance. Balance:", wallet.balance, "Requested:", amount);
          return res.json({ success: false, message: "Insufficient balance" });
        }

        // ✅ Create Transfer Recipient
        console.log("➡️ Creating Paystack transfer recipient...");
        const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "nuban",
            name: "User Wallet Withdrawal",
            account_number: account,
            bank_code: bank,
            currency: "NGN"
          })
        });

        const recipientData = await recipientRes.json();
        console.log("Paystack recipient response:", recipientData);

        if (!recipientData.status) {
          console.error("❌ Failed to create transfer recipient:", recipientData.message);
          return res.status(400).json({ success: false, message: recipientData.message || "Failed to create transfer recipient" });
        }

        const recipientCode = recipientData.data.recipient_code;
        console.log("✅ Recipient created successfully. Recipient code:", recipientCode);

        // ✅ Initiate Transfer
        console.log("➡️ Initiating Paystack transfer...");
        const transferRes = await fetch("https://api.paystack.co/transfer", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            source: "balance",
            reason: "Wallet withdrawal",
            amount: amount * 100, // in kobo
            recipient: recipientCode
          })
        });

        const transferData = await transferRes.json();
        console.log("Paystack transfer response:", transferData);

        if (!transferData.status) {
          console.error("❌ Transfer failed:", transferData.message);
          return res.status(400).json({ success: false, message: transferData.message || "Transfer failed to initiate" });
        }

        console.log("✅ Transfer initiated successfully. Reference:", transferData.data.reference);

        // ✅ Deduct from wallet immediately (optimistic update)
        wallet.balance -= parseFloat(amount);
        await wallet.save();
        console.log("Wallet updated -> New balance:", wallet.balance);

        // ✅ Save transaction
        const tx = await WalletTransaction.create({
          userId,
          walletId: wallet._id,
          type: "debit",
          amount: parseFloat(amount),
          description: `Withdrawal to ${bank} (${account})`,
          reference: transferData.data.reference,
          status: "pending" // mark pending until webhook confirms
        });

        console.log("✅ Transaction saved:", tx);

        res.json({ success: true, wallet, transaction: tx });

      } catch (err) {
        console.error("❌ withdrawFunds error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
      }
};


// in walletController.js
module.exports.paystackWebhook = async (req, res) => {
  const event = req.body.event;

  if (event === "transfer.success") {
    const reference = req.body.data.reference;
    await WalletTransaction.findOneAndUpdate({ reference }, { status: "success" });
  }

  if (event === "transfer.failed") {
    const reference = req.body.data.reference;
    const tx = await WalletTransaction.findOneAndUpdate({ reference }, { status: "failed" });

    // refund wallet balance
    if (tx) {
      const wallet = await Wallet.findById(tx.walletId);
      wallet.balance += tx.amount;
      await wallet.save();
    }
  }

  res.sendStatus(200);
};
