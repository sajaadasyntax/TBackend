const express = require('express');
const router = express.Router();
const { register, verifyPhone, login, resendVerification, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/verify', verifyPhone);
router.post('/login', login);
router.post('/resend-verification', resendVerification);

// Protected routes
router.get('/profile', protect, getProfile);

module.exports = router;
