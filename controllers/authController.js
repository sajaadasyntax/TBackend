const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRY
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { phoneNumber, firstName, lastName, password } = req.body;

    logger.info('User registration attempt', {
      phoneNumber: phoneNumber ? `${phoneNumber.substring(0, 3)}***` : 'undefined',
      firstName,
      lastName,
      ip: req.ip
    });

    // Check if user already exists
    const userExists = await User.findOne({ where: { phoneNumber } });
    
    if (userExists) {
      logger.warn('Registration failed - user already exists', { phoneNumber: `${phoneNumber.substring(0, 3)}***` });
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with automatic verification (temporarily disabled)
    const user = await User.create({
      phoneNumber,
      firstName,
      lastName,
      password,
      isVerified: true, // Automatically verify the user
      verificationCode: null,
      verificationCodeExpires: null
    });

    logger.info('User registered successfully (auto-verified)', {
      userId: user.id,
      phoneNumber: `${phoneNumber.substring(0, 3)}***`,
      firstName,
      lastName
    });

    // Generate token immediately since user is verified
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      token
    });
  } catch (error) {
    logger.error('Registration error', {
      error: error.message,
      stack: error.stack,
      phoneNumber: req.body.phoneNumber ? `${req.body.phoneNumber.substring(0, 3)}***` : 'undefined'
    });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify user phone number (temporarily disabled)
// @route   POST /api/auth/verify
// @access  Public
exports.verifyPhone = async (req, res) => {
  try {
    const { phoneNumber, verificationCode } = req.body;

    logger.info('Phone verification attempt (disabled)', {
      phoneNumber: phoneNumber ? `${phoneNumber.substring(0, 3)}***` : 'undefined',
      ip: req.ip
    });

    // Find user by phone number
    const user = await User.findOne({ where: { phoneNumber } });

    if (!user) {
      logger.warn('Phone verification failed - user not found', { phoneNumber: `${phoneNumber.substring(0, 3)}***` });
      return res.status(404).json({ message: 'User not found' });
    }

    // Temporarily skip verification and auto-verify user
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Generate token
    const token = generateToken(user.id);

    logger.info('Phone verification successful (auto-verified)', {
      userId: user.id,
      phoneNumber: `${phoneNumber.substring(0, 3)}***`
    });

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      token
    });
  } catch (error) {
    logger.error('Phone verification error', {
      error: error.message,
      stack: error.stack,
      phoneNumber: req.body.phoneNumber ? `${req.body.phoneNumber.substring(0, 3)}***` : 'undefined'
    });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    logger.info('Login attempt', {
      phoneNumber: phoneNumber ? `${phoneNumber.substring(0, 3)}***` : 'undefined',
      ip: req.ip
    });

    // Find user by phone number
    const user = await User.findOne({ where: { phoneNumber } });

    // Check if user exists and password matches
    if (!user || !(await user.comparePassword(password))) {
      logger.warn('Login failed - invalid credentials', { phoneNumber: `${phoneNumber.substring(0, 3)}***` });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Temporarily skip verification check and auto-verify user if not verified
    if (!user.isVerified) {
      logger.info('Auto-verifying user during login', {
        userId: user.id,
        phoneNumber: `${phoneNumber.substring(0, 3)}***`
      });
      
      user.isVerified = true;
      user.verificationCode = null;
      user.verificationCodeExpires = null;
      await user.save();
    }

    // Generate token
    const token = generateToken(user.id);

    logger.info('Login successful', {
      userId: user.id,
      phoneNumber: `${phoneNumber.substring(0, 3)}***`
    });

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      token
    });
  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      stack: error.stack,
      phoneNumber: req.body.phoneNumber ? `${req.body.phoneNumber.substring(0, 3)}***` : 'undefined'
    });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Resend verification code (temporarily disabled)
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    logger.info('Resend verification code attempt (disabled)', {
      phoneNumber: phoneNumber ? `${phoneNumber.substring(0, 3)}***` : 'undefined',
      ip: req.ip
    });

    // Find user by phone number
    const user = await User.findOne({ where: { phoneNumber } });

    if (!user) {
      logger.warn('Resend verification failed - user not found', { phoneNumber: `${phoneNumber.substring(0, 3)}***` });
      return res.status(404).json({ message: 'User not found' });
    }

    // Auto-verify user instead of sending verification code
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    logger.info('User auto-verified instead of sending verification code', {
      userId: user.id,
      phoneNumber: `${phoneNumber.substring(0, 3)}***`
    });

    res.json({
      message: 'User automatically verified',
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber
    });
  } catch (error) {
    logger.error('Resend verification error', {
      error: error.message,
      stack: error.stack,
      phoneNumber: req.body.phoneNumber ? `${req.body.phoneNumber.substring(0, 3)}***` : 'undefined'
    });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    logger.info('Profile access attempt', {
      userId: req.user.id,
      ip: req.ip
    });

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'createdAt']
    });

    if (!user) {
      logger.warn('Profile access failed - user not found', { userId: req.user.id });
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info('Profile accessed successfully', {
      userId: user.id,
      phoneNumber: `${user.phoneNumber.substring(0, 3)}***`
    });

    res.json(user);
  } catch (error) {
    logger.error('Profile access error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
