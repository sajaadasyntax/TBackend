const { Customer, Invoice } = require('../models');
const logger = require('../config/logger');

// @desc    Get all customers for a user
// @route   GET /api/customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      where: { userId: req.user.id },
      order: [['name', 'ASC']]
    });

    logger.info('Customers retrieved successfully', { userId: req.user.id, count: customers.length });
    res.json(customers);
  } catch (error) {
    logger.error('Error retrieving customers', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single customer
// @route   GET /api/customers/:id
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      },
      include: [{ model: Invoice }]
    });

    if (!customer) {
      logger.warn('Customer not found', { customerId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: 'Customer not found' });
    }

    logger.info('Customer retrieved successfully', { customerId: customer.id, userId: req.user.id });
    res.json(customer);
  } catch (error) {
    logger.error('Error retrieving customer', { error: error.message, stack: error.stack, userId: req.user.id, customerId: req.params.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new customer
// @route   POST /api/customers
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;

    // Validate required fields
    if (!name || !phone) {
      logger.warn('Missing required fields for customer creation', { userId: req.user.id, body: req.body });
      return res.status(400).json({ message: 'Please provide name and phone' });
    }

    // Create the customer
    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      notes,
      userId: req.user.id
    });

    logger.info('Customer created successfully', { customerId: customer.id, userId: req.user.id });
    res.status(201).json(customer);
  } catch (error) {
    logger.error('Error creating customer', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
exports.updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;

    // Find the customer
    const customer = await Customer.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!customer) {
      logger.warn('Customer not found for update', { customerId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Update the customer
    await customer.update({
      name: name || customer.name,
      phone: phone || customer.phone,
      email: email !== undefined ? email : customer.email,
      address: address !== undefined ? address : customer.address,
      notes: notes !== undefined ? notes : customer.notes
    });

    logger.info('Customer updated successfully', { customerId: customer.id, userId: req.user.id });
    res.json(customer);
  } catch (error) {
    logger.error('Error updating customer', { error: error.message, stack: error.stack, userId: req.user.id, customerId: req.params.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!customer) {
      logger.warn('Customer not found for deletion', { customerId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if customer has invoices
    const invoiceCount = await Invoice.count({
      where: { customerId: customer.id }
    });

    if (invoiceCount > 0) {
      logger.warn('Cannot delete customer with invoices', { customerId: req.params.id, userId: req.user.id, invoiceCount });
      return res.status(400).json({ message: 'Cannot delete customer with invoices' });
    }

    await customer.destroy();

    logger.info('Customer deleted successfully', { customerId: req.params.id, userId: req.user.id });
    res.json({ message: 'Customer removed' });
  } catch (error) {
    logger.error('Error deleting customer', { error: error.message, stack: error.stack, userId: req.user.id, customerId: req.params.id });
    res.status(500).json({ message: 'Server error' });
  }
};
