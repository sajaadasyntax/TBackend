const { Invoice, InvoiceItem, Customer, Product } = require('../models');
const logger = require('../config/logger');
const { sequelize } = require('../config/database');

// @desc    Get all invoices for a user
// @route   GET /api/invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone'] },
        { model: InvoiceItem }
      ],
      order: [['date', 'DESC']]
    });

    logger.info('Invoices retrieved successfully', { userId: req.user.id, count: invoices.length });
    res.json(invoices);
  } catch (error) {
    logger.error('Error retrieving invoices', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single invoice
// @route   GET /api/invoices/:id
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone', 'email', 'address'] },
        { model: InvoiceItem }
      ]
    });

    if (!invoice) {
      logger.warn('Invoice not found', { invoiceId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: 'Invoice not found' });
    }

    logger.info('Invoice retrieved successfully', { invoiceId: invoice.id, userId: req.user.id });
    res.json(invoice);
  } catch (error) {
    logger.error('Error retrieving invoice', { error: error.message, stack: error.stack, userId: req.user.id, invoiceId: req.params.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new invoice
// @route   POST /api/invoices
exports.createInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { 
      customerId, 
      items, 
      date, 
      status, 
      paymentStatus, 
      notes 
    } = req.body;

    // Validate required fields
    if (!customerId || !items || items.length === 0) {
      logger.warn('Missing required fields for invoice creation', { userId: req.user.id, body: req.body });
      return res.status(400).json({ message: 'Please provide customerId and items' });
    }

    // Check if customer exists
    const customer = await Customer.findOne({
      where: { 
        id: customerId,
        userId: req.user.id
      }
    });

    if (!customer) {
      logger.warn('Customer not found for invoice creation', { customerId, userId: req.user.id });
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Calculate invoice totals
    let totalUsd = 0;
    let totalOriginalSdg = 0;
    let totalCurrentSdg = 0;

    // Create the invoice
    const invoice = await Invoice.create({
      customerId,
      date: date || new Date(),
      status: status || 'issued',
      paymentStatus: paymentStatus || 'unpaid',
      notes: notes || '',
      totalUsd,
      totalOriginalSdg,
      totalCurrentSdg,
      profitLoss: 0,
      userId: req.user.id
    }, { transaction });

    // Process each item
    for (const item of items) {
      // Check if product exists and has enough quantity
      const product = await Product.findOne({
        where: { 
          id: item.productId,
          userId: req.user.id
        }
      });

      if (!product) {
        await transaction.rollback();
        logger.warn('Product not found for invoice item', { 
          productId: item.productId, 
          userId: req.user.id 
        });
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      if (product.remaining < item.quantity) {
        await transaction.rollback();
        logger.warn('Insufficient product quantity', { 
          productId: item.productId, 
          userId: req.user.id,
          requested: item.quantity,
          available: product.remaining
        });
        return res.status(400).json({ 
          message: `Insufficient quantity for product ${product.name}. Requested: ${item.quantity}, Available: ${product.remaining}` 
        });
      }

      // Calculate item values
      const itemTotalUsd = product.priceUsd * item.quantity;
      const itemOriginalSdg = product.priceSdg * item.quantity;
      const itemCurrentSdg = product.priceUsd * item.currentExchangeRate * item.quantity;

      // Update totals
      totalUsd += itemTotalUsd;
      totalOriginalSdg += itemOriginalSdg;
      totalCurrentSdg += itemCurrentSdg;

      // Create invoice item
      await InvoiceItem.create({
        invoiceId: invoice.id,
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        priceUsd: product.priceUsd,
        originalPriceSdg: product.priceSdg,
        currentPriceSdg: product.priceUsd * item.currentExchangeRate,
        exchangeRateAtPurchase: product.exchangeRate,
        currentExchangeRate: item.currentExchangeRate
      }, { transaction });

      // Update product remaining quantity
      product.remaining -= item.quantity;
      await product.save({ transaction });
    }

    // Update invoice totals
    invoice.totalUsd = totalUsd;
    invoice.totalOriginalSdg = totalOriginalSdg;
    invoice.totalCurrentSdg = totalCurrentSdg;
    invoice.profitLoss = totalCurrentSdg - totalOriginalSdg;
    await invoice.save({ transaction });

    await transaction.commit();

    // Fetch the complete invoice with items
    const completeInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone', 'email', 'address'] },
        { model: InvoiceItem }
      ]
    });

    logger.info('Invoice created successfully', { 
      invoiceId: invoice.id, 
      userId: req.user.id,
      customerId,
      itemCount: items.length,
      total: totalCurrentSdg
    });
    
    res.status(201).json(completeInvoice);
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating invoice', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an invoice
// @route   PUT /api/invoices/:id
exports.updateInvoice = async (req, res) => {
  try {
    const { status, paymentStatus, notes } = req.body;

    // Find the invoice
    const invoice = await Invoice.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!invoice) {
      logger.warn('Invoice not found for update', { invoiceId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Update the invoice
    await invoice.update({
      status: status || invoice.status,
      paymentStatus: paymentStatus || invoice.paymentStatus,
      notes: notes !== undefined ? notes : invoice.notes
    });

    logger.info('Invoice updated successfully', { invoiceId: invoice.id, userId: req.user.id });
    res.json(invoice);
  } catch (error) {
    logger.error('Error updating invoice', { error: error.message, stack: error.stack, userId: req.user.id, invoiceId: req.params.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
exports.deleteInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const invoice = await Invoice.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      },
      include: [{ model: InvoiceItem }]
    });

    if (!invoice) {
      logger.warn('Invoice not found for deletion', { invoiceId: req.params.id, userId: req.user.id });
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Return products to inventory
    for (const item of invoice.InvoiceItems) {
      const product = await Product.findByPk(item.productId);
      if (product) {
        product.remaining += item.quantity;
        await product.save({ transaction });
      }
    }

    // Delete invoice items and invoice
    await InvoiceItem.destroy({
      where: { invoiceId: invoice.id },
      transaction
    });

    await invoice.destroy({ transaction });
    await transaction.commit();

    logger.info('Invoice deleted successfully', { invoiceId: req.params.id, userId: req.user.id });
    res.json({ message: 'Invoice removed' });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting invoice', { error: error.message, stack: error.stack, userId: req.user.id, invoiceId: req.params.id });
    res.status(500).json({ message: 'Server error' });
  }
};
