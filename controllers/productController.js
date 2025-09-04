const { Product } = require('../models');
const logger = require('../config/logger');

// @desc    Get all products for a user
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    logger.info('Products retrieved successfully', { userId: req.user.id, count: products.length });
    res.json(products);
  } catch (error) {
    logger.error('Error retrieving products', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!product) {
      logger.warn('Product not found', { productId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: 'Product not found' });
    }

    logger.info('Product retrieved successfully', { productId: product.id, userId: req.user.id });
    res.json(product);
  } catch (error) {
    logger.error('Error retrieving product', { error: error.message, stack: error.stack, userId: req.user.id, productId: req.params.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new product
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      quantity, 
      priceSdg, 
      priceUsd, 
      purchaseDate, 
      exchangeRate 
    } = req.body;

    // Validate required fields
    if (!name || !quantity || !priceSdg || !priceUsd || !exchangeRate) {
      logger.warn('Missing required fields for product creation', { userId: req.user.id, body: req.body });
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create the product
    const product = await Product.create({
      name,
      description,
      quantity,
      remaining: quantity, // Initially, remaining = quantity
      priceSdg,
      priceUsd,
      purchaseDate: purchaseDate || new Date(),
      exchangeRate,
      userId: req.user.id
    });

    logger.info('Product created successfully', { productId: product.id, userId: req.user.id });
    res.status(201).json(product);
  } catch (error) {
    logger.error('Error creating product', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      quantity, 
      priceSdg, 
      priceUsd, 
      purchaseDate, 
      exchangeRate 
    } = req.body;

    // Find the product
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!product) {
      logger.warn('Product not found for update', { productId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate the difference in quantity to adjust remaining
    const quantityDiff = quantity - product.quantity;
    const newRemaining = Math.max(0, product.remaining + quantityDiff);

    // Update the product
    await product.update({
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      quantity: quantity || product.quantity,
      remaining: newRemaining,
      priceSdg: priceSdg || product.priceSdg,
      priceUsd: priceUsd || product.priceUsd,
      purchaseDate: purchaseDate || product.purchaseDate,
      exchangeRate: exchangeRate || product.exchangeRate
    });

    logger.info('Product updated successfully', { productId: product.id, userId: req.user.id });
    res.json(product);
  } catch (error) {
    logger.error('Error updating product', { error: error.message, stack: error.stack, userId: req.user.id, productId: req.params.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!product) {
      logger.warn('Product not found for deletion', { productId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.destroy();

    logger.info('Product deleted successfully', { productId: req.params.id, userId: req.user.id });
    res.json({ message: 'Product removed' });
  } catch (error) {
    logger.error('Error deleting product', { error: error.message, stack: error.stack, userId: req.user.id, productId: req.params.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Withdraw product quantity
// @route   POST /api/products/:id/withdraw
exports.withdrawProduct = async (req, res) => {
  try {
    const { quantity, currentExchangeRate } = req.body;

    if (!quantity || !currentExchangeRate) {
      logger.warn('Missing required fields for product withdrawal', { userId: req.user.id, body: req.body });
      return res.status(400).json({ message: 'Please provide quantity and current exchange rate' });
    }

    const product = await Product.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!product) {
      logger.warn('Product not found for withdrawal', { productId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.remaining < quantity) {
      logger.warn('Insufficient quantity for withdrawal', { 
        productId: req.params.id, 
        userId: req.user.id,
        requested: quantity,
        available: product.remaining
      });
      return res.status(400).json({ 
        message: `Cannot withdraw ${quantity} units. Only ${product.remaining} remaining.` 
      });
    }

    // Calculate withdrawal details
    const withdrawnQuantity = parseInt(quantity);
    const originalPriceSdg = product.priceSdg;
    const currentPriceSdg = product.priceUsd * currentExchangeRate;
    
    // Update product remaining quantity
    product.remaining -= withdrawnQuantity;
    await product.save();

    const withdrawalResult = {
      product: product,
      withdrawnQuantity,
      originalPriceSdg,
      currentPriceSdg,
      priceDifference: currentPriceSdg - originalPriceSdg,
      exchangeRateAtPurchase: product.exchangeRate,
      currentExchangeRate
    };

    logger.info('Product withdrawn successfully', { 
      productId: product.id, 
      userId: req.user.id,
      quantity: withdrawnQuantity,
      remaining: product.remaining
    });
    
    res.json(withdrawalResult);
  } catch (error) {
    logger.error('Error withdrawing product', { error: error.message, stack: error.stack, userId: req.user.id, productId: req.params.id });
    res.status(500).json({ message: 'Server error' });
  }
};
