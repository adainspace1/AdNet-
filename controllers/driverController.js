const Driver = require("../models/Driver");
const cloudinary = require("cloudinary").v2;
const jwt = require('jsonwebtoken');
const streamifier = require("streamifier");
const bcrypt = require('bcrypt');
// Upload helper (your function)
const handleImageUpload = (file) => {
  return new Promise((resolve, reject) => {
    const isPDF = file.mimetype === "application/pdf";

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: isPDF ? "raw" : "auto",
        folder: "Adnet",
      },
      (error, result) => {
        if (error) {
          reject(new Error("Error uploading to Cloudinary: " + error.message));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};


// Register Driver

exports.registerDriver = async (req, res) => {
  try {
    console.log("Received files:", req.files);
    console.log("Received body:", req.body);

    const {
      fullName,
      email,
      phone,
      password,
      dob,
      vehicleMake,
      vehicleModel,
      vehicleColor,
      vehiclePlate,
      bankName,
      accountNumber,
      accountHolder
    } = req.body;

    // Validate required text fields
    if (
      !fullName ||
      !email ||
      !phone ||
      !password ||  // ✅ make password required
      !vehicleMake ||
      !vehicleModel ||
      !vehiclePlate ||
      !bankName ||
      !accountNumber ||
      !accountHolder
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required text fields" });
    }

    // ✅ hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Upload files
    const profilePicture = req.files.profilePicture
      ? await handleImageUpload(req.files.profilePicture[0])
      : null;
    const carImages = await Promise.all(
      ["front", "back", "left", "right", "dashboard"]
        .map((pos) =>
          req.files[`carImage_${pos}`]
            ? handleImageUpload(req.files[`carImage_${pos}`][0])
            : null
        )
        .filter((promise) => promise)
    );
    const licenseFront = req.files.licenseFront
      ? await handleImageUpload(req.files.licenseFront[0])
      : null;
    const licenseBack = req.files.licenseBack
      ? await handleImageUpload(req.files.licenseBack[0])
      : null;
    const registration = req.files.registration
      ? await handleImageUpload(req.files.registration[0])
      : null;
    const insurance = req.files.insurance
      ? await handleImageUpload(req.files.insurance[0])
      : null;
    const roadworthiness = req.files.roadworthiness
      ? await handleImageUpload(req.files.roadworthiness[0])
      : null;
    const kycDocument = req.files.kycDocument
      ? await handleImageUpload(req.files.kycDocument[0])
      : null;

    // Validate required files
    if (
      !profilePicture ||
      !licenseFront ||
      !licenseBack ||
      !registration ||
      !insurance ||
      !kycDocument ||
      carImages.length < 5
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required file uploads" });
    }

    // Save in DB with hashed password
    const driver = new Driver({
      fullName,
      email,
      phone,
      password: hashedPassword, // ✅ save hash, not raw password
      dob: dob ? new Date(dob) : null,
      profilePicture,
      vehicleMake,
      vehicleModel,
      vehicleColor,
      vehiclePlate,
      carImages,
      licenseFront,
      licenseBack,
      registration,
      insurance,
      roadworthiness,
      bankName,
      accountNumber,
      accountHolder,
      kycDocument,
      status: "Pending",
    });

    await driver.save();

    res
      .status(201)
      .json({ success: true, message: "Driver registered successfully", driver });
  } catch (err) {
    console.error("Driver registration error:", err);
    res.status(500).json({
      success: false,
      message: "Error registering driver",
      error: err.message,
    });
  }
};




// Login Controller
exports.loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find driver by email
    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // ✅ Store driver in session
    req.session.driver = {
      id: driver._id,
      fullName: driver.fullName,
      email: driver.email,
      status: driver.status,
      role: "driver",
    };

    // You can redirect or send JSON depending on your frontend
    return res.json({
      success: true,
      message: "Login successful",
      driver: req.session.driver,
    });
  } catch (err) {
    console.error("Driver login error:", err);
    res.status(500).json({ success: false, message: "Error logging in driver", error: err.message });
  }
};
