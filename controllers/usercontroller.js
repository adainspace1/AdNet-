
const mongoose = require("mongoose");
const User = require("../models/User");
const Inventory = require('../models/inventory');
const Sale = require('../models/sale');
const Expense = require('../models/expense');
const Production = require('../models/production');
const AccountsPayable = require('../models/AccountsPayable');
const AccountReceivable = require("../models/AccountReceivable");
    const APPayment = require('../models/APPayment');
    const ARInvoice = require('../models/ARInvoice');
const Budget = require('../models/budget');
const Payroll = require('../models/Payroll');
const Asset = require('../models/Asset');

const Forecast = require("../models/Forecast");
const Deal = require('../models/Deal');

const cloudinary = require("../cloudinary");
const streamifier  = require("streamifier");




const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
require("dotenv").config();


const path = require("path");
const fs = require("fs");
const jwt = require('jsonwebtoken');
const multer = require('multer');
// const upload = multer({ dest: 'uploads/' });



const handleImageUpload = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto', // accepts image/pdf/video
        folder: 'Adnet',
      },
      (error, result) => {
        if (error) {
          reject(new Error('Error uploading to Cloudinary: ' + error.message));
        } else {
          resolve(result.secure_url); // return only URL
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};




// POST route
const forgotpassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.render("404dontex"); // Stop here if user not found
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.tokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `http://localhost:4900/reset-password/${token}`;

    // Send email
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        to: user.email,
        subject: "Password Reset",
        html: `Click here to reset your password: <a href="${resetLink}">${resetLink}</a>`
    });

    res.render("token-sent");
};


const resetpassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.send("Passwords do not match");
    }

    const user = await User.findOne({ resetToken: token, tokenExpiry: { $gt: Date.now() } });

    if (!user) return res.send("Token expired or invalid");

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.tokenExpiry = undefined;
    await user.save();

    res.render("login");
};







// Create new inventory item with dynamic fields

const createInventory = async (req, res) => {
  try {
    const {
      recipientId,
      username,
      itemName,
      quantity,
      currentquantity,
      category,
      bcost,
      scost,
      supplier
    } = req.body;

    console.log("Received inventory data:", req.body);

    // Basic validation
    if ( !recipientId || !username || !itemName || !quantity || !currentquantity || !category || !bcost || !scost) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields.'
      });
    }

    const newItem = new Inventory({
      itemName,
      quantity,
      currentquantity,
      category,
      bcost,
      scost,
      supplier,
      recipientId,   // Add recipientId from logged in user
      username   // Add username from logged in user
    });

    console.log("New inventory item:", newItem);

    await newItem.save();

    const returnUrl = req.headers.referer || "/";
    return res.redirect(returnUrl);

  } catch (error) {
    console.error("Error adding inventory:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};







// Handle new sale submission
const createSale = async (req, res) => {
  try {
    const {
      recipientId,
      username,
      item,
      unitPrice,
      itemId,
      quantity,
      amount,
      paymentMethod,
      custormername,
      discription
    } = req.body;

    console.log("Received sale data:", req.body);

    if (!recipientId || !username || !unitPrice || !item  || !itemId || !quantity || !amount || !custormername || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }


const inventoryItem = await Inventory.findOne({
  recipientId,
  _id: itemId, // Use the unique ID now
});


if (!inventoryItem) {
  return res.status(404).json({ error: 'Item not found in inventory' });
}

// ✅ Ensure currentquantity is a valid number
const currentQty = Number(inventoryItem.currentquantity);
const quantityNumber = Number(quantity);

console.log("Inventory currentquantity:", inventoryItem.currentquantity);
console.log("Converted currentQty:", currentQty);
console.log("Quantity requested:", quantityNumber);

if (isNaN(currentQty)) {
  return res.status(500).json({ error: 'Inventory currentquantity is invalid (NaN)' });
}

if (currentQty < quantityNumber) {
  return res.status(400).json({ error: 'Insufficient stock available' });
}

// 🧮 Deduct the quantity
inventoryItem.currentquantity = currentQty - quantityNumber;
await inventoryItem.save();


    // ✅ 4. Save the sale
    const newSale = new Sale({
      recipientId,
      username,
      item,
      unitPrice,
      quantity,
      amount,
      paymentMethod,
      custormername,
      discription
    });

    await newSale.save();

    // ✅ 5. Redirect back
    const returnUrl = req.headers.referer || "/";
    return res.redirect(returnUrl);

  } catch (error) {
    console.error('Error saving sale:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};








// ✅ Updated Expense Save Controller - Deduct from budget and hide if depleted
const saveExpense = async (req, res) => {
  console.log("body field", req.body);

  try {
    const { recipientId, username, category, amount, description } = req.body;

    if (!category || !amount || !recipientId || !username) {
      return res.status(400).send('Category and amount are required.');
    }

  // Find the matching budget by title
    const budget = await Budget.findOne({ recipientId, title: category });

    console.log("the budget", budget);

    if (!budget) {
      return res.status(404).send("No valid budget title found to deduct from.");
    }

    // Convert amount to number
    const expenseAmount = Number(amount);

    // Check if enough money is available
    if (budget.currentamount < expenseAmount) {
      return res.send(`<script>alert("Amount is more than what's available in '${category}' budget."); window.history.back();</script>`);
    }

    // Deduct the amount from currentamount
    budget.currentamount -= expenseAmount;
    await budget.save();
 

    console.log("Updated budget after expense:", budget);

    // Save the expense
    const newExpense = new Expense({
      recipientId,
      username,
      category,
      amount: expenseAmount,
      description
    });

    console.log("New expense to save:", newExpense);
    await newExpense.save();

    const returnUrl = req.headers.referer || "/";
    return res.redirect(returnUrl);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error while saving expense.');
  }
};



// Show all expenses
const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    const categories = ['Utilities', 'Supplies', 'Transport', 'Miscellaneous'];

    res.render('expenses', { expenses, categories });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading expenses.');
  }
};






const production = async (req, res) => {

  console.log("product", req.body)
  try {


  const { recipientId, username, category, itemName, quantity, unitPrice, amount, notes } = req.body;
  const time = new Date().toLocaleTimeString();
  console.log("Received production data:", req.body);

  if (!category  || !itemName || !quantity || !unitPrice || !amount) {
    return res.status(400).send('Category and amount are required.');
  }

      const newProduction = new Production({
        recipientId,
        username,
      category, 
      itemName,
        quantity, 
        unitPrice, // Assuming unitPrice is not provided in the form
      amount,
       notes, 
       time 
    });


  await newProduction.save();
  

   // ✅ 5. Redirect back
    const returnUrl = req.headers.referer || "/";
    return res.redirect(returnUrl);

} catch (err) {
    console.error(err);
    res.status(500).send('Server error while saving production.');
  }

}











const AccountPayable = async (req, res) => {

  console.log("product", req.body)
   try {
    const { recipientId, username, vendorName, invoiceNumber, amount, ramount, dueDate, status, notes } = req.body;

    const newAP = new AccountsPayable({
      recipientId,
      username,
      vendorName,
      invoiceNumber,
      amount,
      ramount,
      dueDate,
      status,
      notes
    });

    await newAP.save();
    
        const returnUrl = req.headers.referer || "/";
    return res.redirect(returnUrl);

  } catch (error) {
    console.error('Error creating account payable:', error);
    res.status(500).send('Server Error');
  }



}




const payAccountPayable = async (req, res) => {
  console.log("Payment request body:", req.body); 
  try {
    const { id, amountPaid, note } = req.body;

    const payable = await AccountsPayable.findById(id);
    if (!payable) {
      return res.status(404).send("Account Payable record not found.");
    }

    const payment = parseFloat(amountPaid);
    const oldRamount = payable.ramount;
    const newRamount = oldRamount - payment;

    let newStatus = "unpaid";
    if (newRamount === 0) {
      newStatus = "paid";
    } else if (newRamount < oldRamount) {
      newStatus = "partial";
    }

    payable.ramount = newRamount;
    payable.status = newStatus;
    payable.notes = (payable.notes || "") + `\nPayment of ₦${payment} noted: ${note || "No note"} - ${new Date().toLocaleString()}`;

    await payable.save();

// inside your payAccountPayable controller
await APPayment.create({
  accountPayableId: payable._id,
  amountPaid: payment,
  note,
  paidBy: req.user?.username || "system"
});


    res.redirect(req.headers.referer || "/");

  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).send("Server Error");
  }
};

module.exports = { payAccountPayable };







const accountreceivable = async (req, res) => {
  try {
    const { customerName, invoiceNumber, dueDate, amount, ramount, status, recipientId } = req.body;

    const newReceivable = new AccountReceivable({
      customerName,
      invoiceNumber,
      dueDate,
      amount,
      ramount,
      status,
      recipientId
    });

    await newReceivable.save();

    res.redirect("/accountreceivable"); // or wherever your table view is
  } catch (err) {
    console.error("Error saving account receivable:", err);
    res.status(500).send("Failed to save receivable");
  }
};




const payReceivable = async (req, res) => {
  try {
    const { id, amountPaid, note } = req.body;

    const receivable = await AccountReceivable.findById(id);
    if (!receivable) {
      return res.status(404).send("Receivable not found.");
    }

    const payment = parseFloat(amountPaid);
    if (payment > receivable.ramount) {
      return res.status(400).send("Payment exceeds remaining amount.");
    }

    // Save payment record
    const newInvoice = new ARInvoice({
      receivableId: id,
      amountPaid: payment,
      note
    });
    await newInvoice.save();

    // Update receivable
    const oldRamount = receivable.ramount;
    const newRamount = oldRamount - payment;

    let newStatus = "unpaid";
    if (newRamount === 0) newStatus = "paid";
    else if (newRamount < oldRamount) newStatus = "partially paid";

    receivable.ramount = newRamount;
    receivable.status = newStatus;
    receivable.notes = (receivable.notes || "") + `\nPayment of ₦${payment} noted: ${note || "No note"} - ${new Date().toLocaleString()}`;

    await receivable.save();

    res.redirect(req.headers.referer || "/");

  } catch (error) {
    console.error("Error processing AR payment:", error);
    res.status(500).send("Server Error");
  }
};








const createPayroll = async (req, res) => {
    try {
        const newPayroll = new Payroll(req.body);
        await newPayroll.save();
        res.redirect('/payroll'); // change to your desired route
    } catch (error) {
        console.error('Error creating payroll:', error);
        res.status(500).send('Server Error');
    }
};



const editpayroll = async (req, res) => {
  try {
    const updateData = req.body;
    const payrollId = req.params.id;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).send("No data provided for update");
    }

    await Payroll.findByIdAndUpdate(payrollId, updateData);
    res.redirect("/payroll");
  } catch (err) {
    console.error("Error updating payroll:", err);
    if (err.name === "ValidationError") {
      res.status(400).send("Validation error");
    } else {
      res.status(500).send("Server error");
    }
  }
};








const forcastsales = async (req, res) => {
  try {
    const userId = req.user._id;

    // ... your existing forecasting logic here ...

    const forecastData = {
      userId,
      nextMonth,
      nextQuarter,
      trendPercent,
      cycleLength,
    };

    await Forecast.create(forecastData); // ✅ Store it

    res.render("dashboard/salesforecasting", {
      forecast: forecastData,
    });
  } catch (err) {
    console.error("Error loading sales forecast page:", err);
    res.status(500).send("Server error");
  }
};










const createdeal = async (req, res) => {
  try {
    const {
      dealName,
      customerName,
      dealValue,
      closeDate,
      dealType,
      dealStatus
    } = req.body;

    const newDeal = new Deal({
      dealName,
      customerName,
      dealValue,
      closeDate,
      dealType,
      dealStatus,
      recipientId: req.user._id
    });

    await newDeal.save();
    res.redirect('/crm'); // or wherever you want after saving
  } catch (err) {
    console.error('Error saving deal:', err);
    res.status(500).send('Internal Server Error');
  }
};















const createBudget = async (req, res) => {
  try {
    const {
      recipientId,
      title,
      amount,
      startDate,
      currentamount,
      categoryName,
      endDate,
      recurrence,
      notes
    } = req.body;




    const newBudget = await Budget.create({
      title,
      amount,
      startDate,
      endDate: endDate || null,
      recurrence,
      notes,
      currentamount,
      categoryName,
      recipientId
    });

    await newBudget.save();
    res.redirect('/budget');
  } catch (err) {
    console.error('Error creating budget:', err);
    res.status(500).send('Error creating budget.');
  }
};






  
  

  

  module.exports =
{


    resetpassword,
    forgotpassword,
    createInventory,
    createSale,
    saveExpense,
    production,
    AccountPayable,
    accountreceivable,
    payAccountPayable,
    payReceivable,
    createPayroll,
    getAllExpenses,
    editpayroll,
    forcastsales,
    createdeal,
    createBudget
};