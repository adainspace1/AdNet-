const express = require('express');
const router = express.Router();
const monoController = require('../controllers/monoController');

// currently no real functionality, just scaffold
router.get('/', monoController.index);

module.exports = router;
