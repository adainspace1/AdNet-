const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const multer = require('multer');
const storage = multer.memoryStorage();

const router = express.Router();

const bodyparser = require('body-parser')






const {
 
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
     
  } = require("../controllers/usercontroller")
 
    console.log(" two", payReceivable);


  router.post('/createinventory', createInventory);
    router.post('/createsales', createSale);
  router.post('/createexpenses',     saveExpense);
  router.post('/createproduction',     production);
    router.post('/createApayable',     AccountPayable);
        router.post('/PayApayable',     payAccountPayable);
        router.post('/createAreceivable',     accountreceivable);
                router.post('/PayAreceivable',     payReceivable);


  router.post('/reset-password/:token', resetpassword);
  router.post('/forgot-password', forgotpassword);








// User Signup









  
module.exports = router;
