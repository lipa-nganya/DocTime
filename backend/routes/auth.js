const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { sendOTP } = require('../services/sms');

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

/**
 * Generate 4-digit OTP
 */
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Request OTP for signup/login
 */
router.post('/request-otp', [
  body('phoneNumber').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg || 'Invalid phone number' });
    }

    const { phoneNumber } = req.body;
    
    // Format phone number
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    formattedPhone = formattedPhone.replace(/\D/g, '');

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP (expires in 10 minutes)
    otpStore.set(formattedPhone, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    // Send OTP via SMS
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_SMS !== 'true';
    
    try {
      const smsResult = await sendOTP(formattedPhone, otp);
      
      // If SMS was actually sent (not local dev), don't return OTP in response
      if (smsResult && smsResult.localDev) {
        // Local dev mode: return OTP in response for testing
        console.log(`📱 DEV MODE: OTP for ${formattedPhone} is ${otp}`);
        return res.json({ 
          success: true, 
          message: 'OTP sent successfully (dev mode)',
          phoneNumber: formattedPhone,
          otp: otp // Include OTP in dev mode for testing
        });
      }
      
      // SMS sent successfully via Advanta API - don't expose OTP
      return res.json({ 
        success: true, 
        message: 'OTP sent successfully via SMS',
        phoneNumber: formattedPhone
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      // In development, still return success with OTP in response
      if (isDevMode) {
        console.log(`📱 DEV MODE: OTP for ${formattedPhone} is ${otp}`);
        return res.json({ 
          success: true, 
          message: 'OTP sent successfully (dev mode)',
          phoneNumber: formattedPhone,
          otp: otp // Include OTP in dev mode for testing
        });
      }
      // In production, don't expose OTP even on error
      throw error;
    }
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * Verify OTP and sign up
 */
router.post('/signup', [
  // Accept phone number in various formats (0712345678, +254712345678, 254712345678)
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((value) => {
      // Remove all non-digit characters except +
      const cleaned = value.replace(/[\s\-\(\)]/g, '');
      // Check if it's a valid Kenyan mobile format
      // Accepts: 0712345678, +254712345678, 254712345678, 712345678
      const kenyanMobileRegex = /^(\+?254|0)?7\d{8}$/;
      if (!kenyanMobileRegex.test(cleaned)) {
        throw new Error('Invalid Kenyan mobile phone number format');
      }
      return true;
    }),
  body('otp').isLength({ min: 4, max: 4 }).withMessage('OTP must be 4 digits'),
  body('pin').isLength({ min: 4, max: 6 }).withMessage('PIN must be between 4 and 6 digits'),
  // Role is optional during signup - will be set during onboarding
  body('role').optional().isIn(['Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other']).withMessage('Invalid role'),
  body('otherRole').optional({ nullable: true, checkFalsy: true }).custom((value) => {
    // Accept null, undefined, or a string
    if (value === null || value === undefined) return true;
    return typeof value === 'string';
  }).withMessage('otherRole must be a string or null')
], async (req, res) => {
  try {
    // Log incoming request data for debugging
    console.log('📥 Signup request received:', {
      phoneNumber: req.body.phoneNumber,
      otp: req.body.otp ? '****' : 'missing',
      pin: req.body.pin ? '****' : 'missing',
      role: req.body.role,
      otherRole: req.body.otherRole
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorArray = errors.array();
      console.error('❌ Validation errors:', JSON.stringify(errorArray, null, 2));
      console.error('❌ Full error details:', {
        count: errorArray.length,
        errors: errorArray.map(e => ({
          param: e.param,
          msg: e.msg,
          location: e.location,
          value: e.value
        }))
      });
      
      // Get the first error with proper field name
      const firstError = errorArray[0];
      const fieldName = firstError?.param || firstError?.path || 'unknown';
      const errorMessage = firstError?.msg || 'Invalid value';
      
      return res.status(400).json({ 
        error: errorMessage,
        field: fieldName,
        errors: errorArray 
      });
    }

    const { phoneNumber, otp, pin, role, otherRole } = req.body;
    
    // Format phone number
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    formattedPhone = formattedPhone.replace(/\D/g, '');

    // Verify OTP
    const storedOtp = otpStore.get(formattedPhone);
    if (!storedOtp) {
      console.error(`No OTP found for ${formattedPhone}`);
      return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new OTP.' });
    }
    
    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(formattedPhone);
      console.error(`OTP expired for ${formattedPhone}`);
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }
    
    if (storedOtp.otp !== otp) {
      console.error(`Invalid OTP for ${formattedPhone}. Expected: ${storedOtp.otp}, Got: ${otp}`);
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { phoneNumber: formattedPhone } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists. Please login instead.' });
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);

    // Create user
    // Role will be set during onboarding, use 'Surgeon' as default if not provided
    const user = await User.create({
      phoneNumber: formattedPhone,
      pinHash,
      role: role || 'Surgeon', // Default to Surgeon if not provided (will be updated in onboarding)
      otherRole: role === 'Other' ? otherRole : null,
      isVerified: true,
      signupOTP: otp // Store OTP for admin display
    });

    // Clear OTP
    otpStore.delete(formattedPhone);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        otherRole: user.otherRole
      }
    });
  } catch (error) {
    console.error('Error signing up:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      phoneNumber: req.body.phoneNumber
    });
    
    // Provide more specific error messages
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'User already exists. Please login instead.' });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to sign up. Please try again.' });
  }
});

/**
 * Login with phone and PIN
 */
router.post('/login', [
  body('phoneNumber').isMobilePhone('en-KE'),
  body('pin').isLength({ min: 4, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, pin } = req.body;
    
    // Format phone number
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    formattedPhone = formattedPhone.replace(/\D/g, '');

    // Find user
    const user = await User.findOne({ where: { phoneNumber: formattedPhone } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid phone number or PIN' });
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, user.pinHash);
    if (!isValidPin) {
      return res.status(401).json({ error: 'Invalid phone number or PIN' });
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        otherRole: user.otherRole,
        biometricEnabled: user.biometricEnabled
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * Update user profile
 */
router.put('/profile', authenticateToken, [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .withMessage('First name must be a string')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name cannot be empty'),
  body('prefix')
    .notEmpty()
    .withMessage('Prefix is required')
    .isIn(['Mr', 'Miss', 'Dr', 'Mrs'])
    .withMessage('Prefix must be one of: Mr, Miss, Dr, Mrs'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other'])
    .withMessage('Invalid role'),
  body('otherRole')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Other role must be a string')
    .trim()
], async (req, res) => {
  try {
    console.log('📝 Profile update request:', {
      userId: req.userId,
      firstName: req.body.firstName,
      prefix: req.body.prefix,
      role: req.body.role,
      otherRole: req.body.otherRole,
      bodyKeys: Object.keys(req.body)
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        error: errors.array()[0]?.msg || 'Validation failed',
        errors: errors.array() 
      });
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      console.error('❌ User not found:', req.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {
      firstName: req.body.firstName.trim(),
      prefix: req.body.prefix,
      role: req.body.role,
      otherRole: req.body.role === 'Other' ? (req.body.otherRole?.trim() || null) : null
    };

    console.log('📝 Updating user with:', updateData);
    
    try {
      await user.update(updateData);
      // Reload user to get updated data
      await user.reload();
      console.log('✅ User updated successfully:', {
        id: user.id,
        firstName: user.firstName,
        prefix: user.prefix,
        role: user.role
      });
    } catch (updateError) {
      console.error('❌ Error during user.update():', updateError);
      console.error('❌ Update error details:', {
        message: updateError.message,
        name: updateError.name,
        errors: updateError.errors
      });
      throw updateError;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        prefix: user.prefix,
        role: user.role,
        otherRole: user.otherRole
      }
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      userId: req.userId
    });
    
    // Provide more specific error messages
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: error.errors.map(e => e.message).join(', ') 
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Verify token (for biometric login)
 */
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    await user.update({ lastLoginAt: new Date() });

    res.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        otherRole: user.otherRole
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * Middleware to verify JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    next();
  });
}

/**
 * Request PIN reset OTP
 */
router.post('/request-reset-pin', authenticateToken, [
  body('phoneNumber').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { phoneNumber } = req.body;
    
    // Format phone number
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    formattedPhone = formattedPhone.replace(/\D/g, '');

    // Verify user exists
    const user = await User.findOne({ where: { phoneNumber: formattedPhone } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP (expires in 10 minutes)
    otpStore.set(formattedPhone + '_reset', {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    // Send OTP via SMS if enabled
    const Settings = require('../models').Settings;
    const smsSetting = await Settings.findOne({ where: { key: 'ENABLE_SMS' } });
    const enableSms = smsSetting?.value === 'true' || process.env.ENABLE_SMS === 'true';

    if (enableSms) {
      try {
        await sendOTP(formattedPhone, otp);
      } catch (smsError) {
        console.error('Failed to send SMS:', smsError);
        // Still return success with OTP in dev mode
        if (process.env.NODE_ENV === 'development') {
          return res.json({ success: true, otp, message: 'OTP sent (dev mode)' });
        }
        return res.status(500).json({ error: 'Failed to send OTP' });
      }
    }

    // In dev mode or if SMS is disabled, return OTP
    if (!enableSms || process.env.NODE_ENV === 'development') {
      return res.json({ success: true, otp, message: 'OTP generated (dev mode)' });
    }

    res.json({ success: true, message: 'OTP sent to your phone' });
  } catch (error) {
    console.error('Error requesting PIN reset:', error);
    res.status(500).json({ error: 'Failed to request PIN reset' });
  }
});

/**
 * Reset PIN
 */
router.post('/reset-pin', authenticateToken, [
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('otp').isLength({ min: 4, max: 4 }).withMessage('OTP must be 4 digits'),
  body('newPin').isLength({ min: 4, max: 6 }).withMessage('PIN must be between 4 and 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { phoneNumber, otp, newPin } = req.body;
    
    // Format phone number
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    formattedPhone = formattedPhone.replace(/\D/g, '');

    // Verify OTP
    const storedOtp = otpStore.get(formattedPhone + '_reset');
    if (!storedOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new OTP.' });
    }

    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(formattedPhone + '_reset');
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    // Find user
    const user = await User.findOne({ where: { phoneNumber: formattedPhone } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new PIN
    const pinHash = await bcrypt.hash(newPin, 10);

    // Update PIN
    await user.update({ pinHash });

    // Clear OTP
    otpStore.delete(formattedPhone + '_reset');

    res.json({ success: true, message: 'PIN reset successfully' });
  } catch (error) {
    console.error('Error resetting PIN:', error);
    res.status(500).json({ error: 'Failed to reset PIN' });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;

