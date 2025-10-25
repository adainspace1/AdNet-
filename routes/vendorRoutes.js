const express = require("express");
const router = express.Router();
 const multer = require('multer');
const storage = multer.memoryStorage();
const { signupVendor, loginVendor, getVendorById, addVendor, reportVendor, assignVendor, updateVendor, getVendorHistory } = require("../controllers/vendorController");


const upload2 = multer({ storage: storage }).fields([
    { name: 'uploadDocs', maxCount: 1 },
]);


router.post("/add/vendor", upload2, addVendor);
router.post("/signup", signupVendor);
router.post("/login", loginVendor);
router.post("/report", reportVendor);
router.get("/:id", getVendorById);

router.get("/vendor/assign", assignVendor);

router.put("/update/:id", upload2, updateVendor);
router.get("/history/:vendorId", getVendorHistory);


module.exports = router;


