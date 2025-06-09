const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");
const bodyparser = require('body-parser')
const mongoose = require("mongoose");
const router = express.Router();
 const multer = require('multer');
const storage = multer.memoryStorage();


const upload = multer({ storage: storage }).fields([
    { name: 'directorDocs', maxCount: 1 },
    { name: 'investorDocs', maxCount: 1 },
      { name: 'adminDocs', maxCount: 1 },
    { name: 'ownerDocs', maxCount: 1 },
]);

const upload2 = multer({ storage: storage }).fields([
    { name: 'CACDocs', maxCount: 1 },
    { name: 'MOADocs', maxCount: 1 },
      { name: 'FOCDocs', maxCount: 1 },
    { name: 'shareholderAgreement', maxCount: 1 },
        { name: 'AddRegistrationDocs', maxCount: 1 },
]);


const {
    
    login,
    submitForm,
    submitBusiness,
    submitCompany,
    createBankInfo
 

  } = require("../controllers/admincontroller")
 



  router.post('/login', login);



    router.post('/submitform', submitForm);
    router.post('/submitBusiness', upload, submitBusiness);
      router.post('/submitCompany', upload2, submitCompany);
      router.post("/bank-info", createBankInfo);





// User Signup





  
module.exports = router;
