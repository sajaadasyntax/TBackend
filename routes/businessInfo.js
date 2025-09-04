const express = require('express');
const { 
  getBusinessInfo, 
  updateBusinessInfo 
} = require('../controllers/businessInfoController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Business info routes
router.route('/')
  .get(getBusinessInfo)
  .put(updateBusinessInfo);

module.exports = router;
