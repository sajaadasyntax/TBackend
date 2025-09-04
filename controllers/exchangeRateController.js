const { ExchangeRate } = require('../models');
const logger = require('../config/logger');

// @desc    Get all exchange rates for a user
// @route   GET /api/exchange-rates
exports.getExchangeRates = async (req, res) => {
  try {
    const exchangeRates = await ExchangeRate.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']]
    });

    logger.info('Exchange rates retrieved successfully', { userId: req.user.id, count: exchangeRates.length });
    res.json(exchangeRates);
  } catch (error) {
    logger.error('Error retrieving exchange rates', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get the latest exchange rate
// @route   GET /api/exchange-rates/latest
exports.getLatestExchangeRate = async (req, res) => {
  try {
    const exchangeRate = await ExchangeRate.findOne({
      where: { userId: req.user.id },
      order: [['date', 'DESC']]
    });

    if (!exchangeRate) {
      logger.warn('No exchange rates found', { userId: req.user.id });
      return res.status(404).json({ message: 'No exchange rates found' });
    }

    logger.info('Latest exchange rate retrieved successfully', { exchangeRateId: exchangeRate.id, userId: req.user.id });
    res.json(exchangeRate);
  } catch (error) {
    logger.error('Error retrieving latest exchange rate', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new exchange rate
// @route   POST /api/exchange-rates
exports.createExchangeRate = async (req, res) => {
  try {
    const { rate, date } = req.body;

    // Validate required fields
    if (!rate) {
      logger.warn('Missing required fields for exchange rate creation', { userId: req.user.id, body: req.body });
      return res.status(400).json({ message: 'Please provide a rate' });
    }

    // Get the latest exchange rate (if any)
    const existingRate = await ExchangeRate.findOne({
      where: { userId: req.user.id },
      order: [['date', 'DESC']]
    });

    // If there's an existing rate, update it instead of creating a new one
    if (existingRate) {
      await existingRate.update({
        rate,
        date: date || new Date()
      });

      logger.info('Exchange rate updated successfully', { exchangeRateId: existingRate.id, userId: req.user.id });
      return res.json(existingRate);
    }

    // If no existing rate, create a new one
    const exchangeRate = await ExchangeRate.create({
      rate,
      date: date || new Date(),
      userId: req.user.id
    });

    logger.info('Exchange rate created successfully', { exchangeRateId: exchangeRate.id, userId: req.user.id });
    res.status(201).json(exchangeRate);
  } catch (error) {
    logger.error('Error creating exchange rate', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an exchange rate
// @route   PUT /api/exchange-rates/:id
exports.updateExchangeRate = async (req, res) => {
  try {
    const { rate, date } = req.body;

    // Find the exchange rate
    const exchangeRate = await ExchangeRate.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!exchangeRate) {
      logger.warn('Exchange rate not found for update', { exchangeRateId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: 'Exchange rate not found' });
    }

    // Update the exchange rate
    await exchangeRate.update({
      rate: rate || exchangeRate.rate,
      date: date || exchangeRate.date
    });

    logger.info('Exchange rate updated successfully', { exchangeRateId: exchangeRate.id, userId: req.user.id });
    res.json(exchangeRate);
  } catch (error) {
    logger.error('Error updating exchange rate', { error: error.message, stack: error.stack, userId: req.user.id, exchangeRateId: req.params.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an exchange rate
// @route   DELETE /api/exchange-rates/:id
exports.deleteExchangeRate = async (req, res) => {
  try {
    const exchangeRate = await ExchangeRate.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!exchangeRate) {
      logger.warn('Exchange rate not found for deletion', { exchangeRateId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: 'Exchange rate not found' });
    }

    await exchangeRate.destroy();

    logger.info('Exchange rate deleted successfully', { exchangeRateId: req.params.id, userId: req.user.id });
    res.json({ message: 'Exchange rate removed' });
  } catch (error) {
    logger.error('Error deleting exchange rate', { error: error.message, stack: error.stack, userId: req.user.id, exchangeRateId: req.params.id });
    res.status(500).json({ message: 'Server error' });
  }
};
