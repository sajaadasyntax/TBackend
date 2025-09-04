const { Settings } = require('../models');
const logger = require('../config/logger');

// @desc    Get settings for a user
// @route   GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({
      where: { userId: req.user.id }
    });

    if (!settings) {
      // Create default settings if none exists
      settings = await Settings.create({
        language: 'en',
        darkMode: false,
        onboardingComplete: false,
        preferences: {},
        userId: req.user.id
      });
      
      logger.info('Default settings created', { userId: req.user.id, settingsId: settings.id });
    } else {
      logger.info('Settings retrieved successfully', { userId: req.user.id, settingsId: settings.id });
    }

    res.json(settings);
  } catch (error) {
    logger.error('Error retrieving settings', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
exports.updateSettings = async (req, res) => {
  try {
    const { 
      language, 
      darkMode, 
      onboardingComplete, 
      preferences 
    } = req.body;

    let settings = await Settings.findOne({
      where: { userId: req.user.id }
    });

    if (!settings) {
      // Create settings if none exists
      settings = await Settings.create({
        language: language || 'en',
        darkMode: darkMode !== undefined ? darkMode : false,
        onboardingComplete: onboardingComplete !== undefined ? onboardingComplete : false,
        preferences: preferences || {},
        userId: req.user.id
      });
      
      logger.info('Settings created', { userId: req.user.id, settingsId: settings.id });
    } else {
      // Update existing settings
      await settings.update({
        language: language !== undefined ? language : settings.language,
        darkMode: darkMode !== undefined ? darkMode : settings.darkMode,
        onboardingComplete: onboardingComplete !== undefined ? onboardingComplete : settings.onboardingComplete,
        preferences: preferences !== undefined ? { ...settings.preferences, ...preferences } : settings.preferences
      });
      
      logger.info('Settings updated successfully', { userId: req.user.id, settingsId: settings.id });
    }

    res.json(settings);
  } catch (error) {
    logger.error('Error updating settings', { error: error.message, stack: error.stack, userId: req.user.id });
    res.status(500).json({ message: 'Server error' });
  }
};
