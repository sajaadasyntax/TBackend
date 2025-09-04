const express = require('express');
const { 
  getCustomers, 
  getCustomer, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Customer routes
router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
