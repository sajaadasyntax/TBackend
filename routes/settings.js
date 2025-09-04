const express = require('express');
const { 
  getSettings, 
  updateSettings 
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Settings routes
router.route('/')
  .get(getSettings)
  .put(updateSettings);

module.exports = router;
