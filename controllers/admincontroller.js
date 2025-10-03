const User = require("../models/User");

const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const cloudinary = require("../cloudinary");
const streamifier  = require("streamifier");
const multer = require('multer');
const bodyparser = require('body-parser');

const Business = require("../models/business");
const Company = require("../models/company");
const BankInfo = require("../models/bank");

const Personal = require('../models/personal');








const handleImageUpload = (file) => {
  return new Promise((resolve, reject) => {
    // Detect file type
    const isPDF = file.mimetype === "application/pdf";

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: isPDF ? "raw" : "auto", // 👈 force PDFs as raw
        folder: "Adnet",
      },
      (error, result) => {
        if (error) {
          reject(new Error("Error uploading to Cloudinary: " + error.message));
        } else {
          resolve(result.secure_url); // return only URL
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};









const submitForm = async (req, res) => {
  console.log("Received personal data:", req.body);
  try {
    const {
      firstName, lastName, bio, portfolioUrl,
      email, phone, password,
      streetAddress, city, state, country, plan, zipCode
    } = req.body;

    // Check if email already exists
    const existingUser = await Personal.findOne({ email });

    if (existingUser) {
      // Check if password matches
      const isMatch = await bcrypt.compare(password, existingUser.password);

     if (existingUser) {
  const isMatch = await bcrypt.compare(password, existingUser.password);

  if (isMatch) {
    return res.redirect(`/Businessinfo?id=${existingUser._id}`);
  } else {
    return res.redirect(`/email-exists?email=${encodeURIComponent(email)}`);
  }
}

    }

    // If email does not exist, hash password and save new user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newEntry = new Personal({
      firstName,
      lastName,
      bio,
      portfolioUrl,
      email,
      phone,
      password: hashedPassword,
      streetAddress,
      city,
      state,
      country,
      plan,
      zipCode
    });

    const savedUser = await newEntry.save();

    // res.status(201).json({
    //   message: "User created successfully",
    //   userId: savedUser._id,
    //   // redirect: `/Businessinfo?id=${savedUser._id}` // originally: res.redirect(...)
    // });


    res.redirect(`/Businessinfo?id=${savedUser._id}`) 

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Submission failed",
      error: err.message
    });
  }
};








const submitBusiness = async (req, res) => {
  console.log("Received business data:", req.body);
  console.log("Received files:", req.files);

  try {
    const {
      reciepientId,
      businessName, businessType, businessAddress,
      contactName, contactEmail, contactPhone,
      directorName, directorPhone,
      investorName, investorPhone,
      adminName, adminPhone,
      ownerName, ownerPhone,
      regNumber, foundingDate
    } = req.body;

    // Upload files
    const directorDocs = req.files?.directorDocs?.[0] || null;
    const investorDocs = req.files?.investorDocs?.[0] || null;
    const adminDocs = req.files?.adminDocs?.[0] || null;
    const ownerDocs = req.files?.ownerDocs?.[0] || null;

    const image1Url = await handleImageUpload(directorDocs);
    const image2Url = await handleImageUpload(investorDocs);
    const image3Url = await handleImageUpload(adminDocs);
    const image4Url = await handleImageUpload(ownerDocs);

    const newBusiness = new Business({
      reciepientId,
      businessName,
      businessType,
      businessAddress,
      contactName,
      contactEmail,
      contactPhone,
      directorName,
      directorPhone,
      directorDocs: image1Url || null,
      investorName,
      investorPhone,
      investorDocs: image2Url || null,
      adminName,
      adminPhone,
      adminDocs: image3Url || null,
      ownerName,
      ownerPhone,
      ownerDocs: image4Url || null,
      regNumber,
      foundingDate
    });

    const savedBusiness = await newBusiness.save();

    console.log("what saved", savedBusiness)

    res.redirect(`/Company?id=${reciepientId}`); // or wherever you want to go next


    // // ✅ Return JSON response instead of redirecting
    // return res.status(201).json({
    //   message: "Business registered successfully",
    //   business: savedBusiness
    // });

  } catch (error) {
    console.error("Business submission error:", error);
    return res.status(500).json({
      message: "Failed to submit business",
      error: error.message
    });
  }
};







const submitCompany = async (req, res) => {
  console.log("Received company data:", req.body);
  console.log("Received files:", req.files);

  try {
    const {
      reciepientId,
      companyName,
      industry,
      businessStructure,
      Address,
      cacNumber,
      incorporationDate,
      taxId,
      email,
      phone,
      countryCode
    } = req.body;

    // Extract files (or null if not sent)
    const cacDoc = req.files?.CACDocs?.[0] || null;
    const moaDoc = req.files?.MOADocs?.[0] || null;
    const focDoc = req.files?.FOCDocs?.[0] || null;
    const shareholderDoc = req.files?.shareholderAgreement?.[0] || null;
    const additionalDoc = req.files?.AddRegistrationDocs?.[0] || null;

    // Upload to Cloudinary
    const cacDocUrl = await handleImageUpload(cacDoc);
    const moaDocUrl = await handleImageUpload(moaDoc);
    const focDocUrl = await handleImageUpload(focDoc);
    const shareholderUrl = await handleImageUpload(shareholderDoc);
    const additionalUrl = await handleImageUpload(additionalDoc);

    const newCompany = new Company({
  reciepientId,
  companyName,
  industry,
  address: Address,  // lowercase fix to match schema
  businessStructure,
  cacNumber,
  incorporationDate,
  taxId,
  email,
  phone,
  countryCode,
  CACDocs: cacDocUrl || null,
  MOADocs: moaDocUrl || null,
  FOCDocs: focDocUrl || null,
  shareholderAgreement: shareholderUrl || null,
  AddRegistrationDocs: additionalUrl || null
});


    await newCompany.save();
    console.log("what saved", newCompany)

    // res.status(201).json({
    //   message: "Company information submitted successfully",
    //   companyId: newCompany._id,
    //   // redirect: `/Bank?id=${reciepientId}` // originally: res.redirect(...)
    // });

    res.redirect(`/Bank?id=${reciepientId}`)

  } catch (error) {
    console.error("Error submitting company info:", error);
    res.status(500).json({
      message: "Failed to submit company info",
      error: error.message
    });
  }
};








const createBankInfo = async (req, res) => {
  try {
    const {
      reciepientId,
      bankName,
      accountNumber,
      accountName,
      accountType,
      accountHolder,
      routingNumber
    } = req.body;

    // Store reciepientId in session as userId
    req.session.userId = reciepientId;

    const newBankInfo = new BankInfo({
      reciepientId,
      bankName,
      accountNumber,
      accountName,
      accountType,
      accountHolder,
      routingNumber
    });

    await newBankInfo.save();

    // res.status(201).json({
    //   message: "Bank information saved successfully.",
    //   bankId: newBankInfo._id,
    //   // redirect: `/Finished?id=${reciepientId}` // originally: res.redirect(...)
    // });

    res.redirect(`/Finished?id=${reciepientId}`)

  } catch (error) {
    console.error("Error saving bank info:", error);
    res.status(500).json({ error: "Failed to save bank information." });
  }
};




















const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔎 Check if user exists
    const user = await Personal.findOne({ email });
    if (!user) {
      console.log("Login failed: email not found", email);
      return res.redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`);
    }

    // 🔐 Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Login failed: password mismatch for", email);
      return res.redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`);
    }

    // ✅ Login successful
    console.log("Login successful for user:", user._id);

    // Put user in session (or JWT if you prefer API style)
    req.session.user = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

   // Redirect to dashboard or requested page
const redirectPath =
  req.body.redirect || // from hidden input in the form
  req.query.redirect || // from query string if it survived
  "/Dashboard";         // default

return res.redirect(redirectPath);

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send("Server error during login");
  }
};




























  module.exports =
{

    login,
        submitForm,
        submitBusiness,
        submitCompany,
        createBankInfo

};