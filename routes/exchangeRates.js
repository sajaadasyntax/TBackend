const express = require('express');
const { 
  getExchangeRates, 
  getLatestExchangeRate, 
  createExchangeRate, 
  updateExchangeRate, 
  deleteExchangeRate 
} = require('../controllers/exchangeRateController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Exchange rate routes
router.route('/')
  .get(getExchangeRates)
  .post(createExchangeRate);

router.get('/latest', getLatestExchangeRate);

router.route('/:id')
  .put(updateExchangeRate)
  .delete(deleteExchangeRate);

module.exports = router;
