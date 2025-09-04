const { BusinessInfo } = require('../models');
const logger = require('../config/logger');

// @desc    Get business info for a user
// @route   GET /api/business-info
exports.getBusinessInfo = async (req, res) => {
  try {
    let businessInfo = await BusinessInfo.findOne({
      where: { userId: req.user.id }
    });

    if (!businessInfo) {
      // Create default business info if none exists
      businessInfo = await BusinessInfo.create({
        name: 'My Business',
        address: 'Business Address',
        phone: '+123456789',
        email: 'business@example.com',
        website: '',
        taxNumber: '',
        logo: null,
        additionalInfo: {},
        userId: req.user.id
      });
      
      logger.info('Default business info created', { userId: req.user.id, businessInfoId: businessInfo.id });
    } else {
      logger.info('Business info retrieved successfully', { userId: req.user.id, businessInfoId: businessInfo.id });
    }

    res.json(businessInfo);
  } catch (error) {
    logger.error('Error retrieving business info', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update business info
// @route   PUT /api/business-info
exports.updateBusinessInfo = async (req, res) => {
  try {
    const { 
      name, 
      address, 
      phone, 
      email, 
      website, 
      taxNumber, 
      logo, 
      additionalInfo 
    } = req.body;

    let businessInfo = await BusinessInfo.findOne({
      where: { userId: req.user.id }
    });

    if (!businessInfo) {
      // Create business info if none exists
      businessInfo = await BusinessInfo.create({
        name: name || 'My Business',
        address: address || 'Business Address',
        phone: phone || '+123456789',
        email: email || 'business@example.com',
        website: website || '',
        taxNumber: taxNumber || '',
        logo: logo || null,
        additionalInfo: additionalInfo || {},
        userId: req.user.id
      });
      
      logger.info('Business info created', { userId: req.user.id, businessInfoId: businessInfo.id });
    } else {
      // Update existing business info
      await businessInfo.update({
        name: name || businessInfo.name,
        address: address || businessInfo.address,
        phone: phone || businessInfo.phone,
        email: email || businessInfo.email,
        website: website !== undefined ? website : businessInfo.website,
        taxNumber: taxNumber !== undefined ? taxNumber : businessInfo.taxNumber,
        logo: logo !== undefined ? logo : businessInfo.logo,
        additionalInfo: additionalInfo || businessInfo.additionalInfo
      });
      
      logger.info('Business info updated successfully', { userId: req.user.id, businessInfoId: businessInfo.id });
    }

    res.json(businessInfo);
  } catch (error) {
    logger.error('Error updating business info', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};
