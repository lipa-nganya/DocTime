const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { sendOTP } = require('../services/sms');
const { logActivity, getIpAddress, getUserAgent } = require('../utils/activityLogger');

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
    
    // Format phone number - ensure it's exactly 12 digits (254 + 9 digits)
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/\D/g, '');
    
    // Remove leading 0 if present
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    // Remove 254 prefix if present, then add it back
    if (formattedPhone.startsWith('254')) {
      formattedPhone = formattedPhone.substring(3);
    }
    
    // Ensure we have exactly 9 digits, then add 254 prefix
    if (formattedPhone.length > 9) {
      formattedPhone = formattedPhone.substring(0, 9);
    }
    
    formattedPhone = '254' + formattedPhone;

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP (expires in 10 minutes)
    otpStore.set(formattedPhone, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    // Create or update user record for admin dashboard display
    // This allows admin to see users who are in the signup process
    try {
      const [user, created] = await User.findOrCreate({
        where: { phoneNumber: formattedPhone },
        defaults: {
          phoneNumber: formattedPhone,
          pinHash: null, // Will be set during actual signup
          role: null, // Will be set during onboarding
          isVerified: false,
          signupOTP: otp // Store OTP for admin display
        }
      });

      // If user already exists, update the OTP (unless they've already completed signup)
      if (!created) {
        // Only update OTP if user hasn't completed signup (no pinHash)
        if (!user.pinHash) {
          await user.update({ signupOTP: otp });
          console.log(`📝 OTP updated for user in signup process: ${formattedPhone}, OTP: ${otp}`);
        } else {
          console.log(`⚠️  User ${formattedPhone} already completed signup, not updating OTP`);
        }
      } else {
        console.log(`📝 User created for admin dashboard: ${formattedPhone}, OTP: ${otp}`);
      }
    } catch (userError) {
      console.error('Error creating/updating user for admin:', userError);
      // Don't fail the OTP request if user creation fails
    }

    // Send OTP via SMS
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_SMS !== 'true';
    
    try {
      const smsResult = await sendOTP(formattedPhone, otp);
      
      // Log activity (find user if exists)
      const user = await User.findOne({ where: { phoneNumber: formattedPhone } });
      await logActivity({
        userId: user?.id || null,
        action: 'REQUEST_OTP',
        entityType: 'User',
        entityId: user?.id || null,
        description: `OTP requested for phone number ${formattedPhone}`,
        metadata: {
          phoneNumber: formattedPhone,
          smsSent: !smsResult?.localDev
        },
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req)
      });
      
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
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('otp').isLength({ min: 4, max: 4 }),
  body('pin').isLength({ min: 4, max: 6 }),
  body('role').optional().isIn(['Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other']),
  body('otherRole').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, otp, pin, role, otherRole } = req.body;
    
    // Format phone number - ensure it's exactly 12 digits (254 + 9 digits)
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/\D/g, '');
    
    // Remove leading 0 if present
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    // Remove 254 prefix if present, then add it back
    if (formattedPhone.startsWith('254')) {
      formattedPhone = formattedPhone.substring(3);
    }
    
    // Ensure we have exactly 9 digits, then add 254 prefix
    if (formattedPhone.length > 9) {
      formattedPhone = formattedPhone.substring(0, 9);
    }
    
    formattedPhone = '254' + formattedPhone;

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

    // Check if user already exists and has completed signup (has pinHash)
    const existingUser = await User.findOne({ where: { phoneNumber: formattedPhone } });
    if (existingUser && existingUser.pinHash) {
      // User already completed signup - clear OTP and return appropriate error
      otpStore.delete(formattedPhone);
      return res.status(400).json({ error: 'User already exists. Please login instead.' });
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);

    // Find existing user (created during OTP request) or create new one
    let user = await User.findOne({ where: { phoneNumber: formattedPhone } });
    
    if (user) {
      // Update existing user with PIN (role will be set during onboarding)
      await user.update({
        pinHash,
        role: role || null, // Only set role if provided, otherwise null
        otherRole: role === 'Other' ? otherRole : null,
        isVerified: true,
        signupOTP: otp // Keep OTP for admin display
      });
    } else {
      // Create new user (shouldn't happen if OTP was requested, but handle it)
      user = await User.create({
        phoneNumber: formattedPhone,
        pinHash,
        role: role || null, // Only set role if provided, otherwise null
        otherRole: role === 'Other' ? otherRole : null,
        isVerified: true,
        signupOTP: otp // Store OTP for admin display
      });
    }

    // Clear OTP after successful signup
    otpStore.delete(formattedPhone);
    console.log(`✅ OTP cleared for ${formattedPhone} after successful signup`);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'SIGNUP',
      entityType: 'User',
      entityId: user.id,
      description: `User signed up with phone number ${formattedPhone}`,
      metadata: {
        phoneNumber: formattedPhone,
        role: role || null
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        otherRole: user.otherRole,
        prefix: user.prefix,
        preferredName: user.preferredName
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
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('pin').isLength({ min: 4, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, pin } = req.body;
    
    // Format phone number - ensure it's exactly 12 digits (254 + 9 digits)
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/\D/g, '');
    
    // Remove leading 0 if present
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    // Remove 254 prefix if present, then add it back
    if (formattedPhone.startsWith('254')) {
      formattedPhone = formattedPhone.substring(3);
    }
    
    // Ensure we have exactly 9 digits, then add 254 prefix
    if (formattedPhone.length > 9) {
      formattedPhone = formattedPhone.substring(0, 9);
    }
    
    formattedPhone = '254' + formattedPhone;

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

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      description: `User logged in with phone number ${formattedPhone}`,
      metadata: {
        phoneNumber: formattedPhone,
        loginMethod: 'PIN'
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        otherRole: user.otherRole,
        prefix: user.prefix,
        preferredName: user.preferredName,
        biometricEnabled: user.biometricEnabled
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
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
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { prefix, preferredName, role, otherRole } = req.body;
    const updateData = {};

    if (prefix !== undefined) updateData.prefix = prefix;
    if (preferredName !== undefined) updateData.preferredName = preferredName;
    if (role !== undefined) updateData.role = role;
    if (otherRole !== undefined) updateData.otherRole = otherRole;

    await user.update(updateData);

    res.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        otherRole: user.otherRole,
        prefix: user.prefix,
        preferredName: user.preferredName
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Get current user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'phoneNumber', 'role', 'otherRole', 'prefix', 'preferredName', 'biometricEnabled']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
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
 * Verify OTP (without completing signup)
 * This allows frontend to verify OTP before moving to PIN step
 */
router.post('/verify-otp', [
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('otp').isLength({ min: 4, max: 4 }).withMessage('OTP must be 4 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { phoneNumber, otp } = req.body;
    
    // Format phone number - ensure it's exactly 12 digits (254 + 9 digits)
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/\D/g, '');
    
    // Remove leading 0 if present
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    // Remove 254 prefix if present, then add it back
    if (formattedPhone.startsWith('254')) {
      formattedPhone = formattedPhone.substring(3);
    }
    
    // Ensure we have exactly 9 digits, then add 254 prefix
    if (formattedPhone.length > 9) {
      formattedPhone = formattedPhone.substring(0, 9);
    }
    
    formattedPhone = '254' + formattedPhone;

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

    // OTP is valid - don't clear it yet, will be cleared during signup
    res.json({ 
      success: true, 
      message: 'OTP verified successfully' 
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

/**
 * Request OTP for PIN reset
 */
router.post('/request-pin-reset-otp', [
  body('phoneNumber').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { phoneNumber } = req.body;
    
    // Format phone number
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    if (formattedPhone.startsWith('254')) {
      formattedPhone = formattedPhone.substring(3);
    }
    if (formattedPhone.length > 9) {
      formattedPhone = formattedPhone.substring(0, 9);
    }
    formattedPhone = '254' + formattedPhone;

    // Check if user exists and has completed signup
    const user = await User.findOne({ where: { phoneNumber: formattedPhone } });
    if (!user || !user.pinHash) {
      return res.status(404).json({ error: 'User not found or has not completed signup' });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with a special key for PIN reset (expires in 10 minutes)
    const resetKey = `pin-reset-${formattedPhone}`;
    otpStore.set(resetKey, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      phoneNumber: formattedPhone
    });

    // Send OTP via SMS
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_SMS !== 'true';
    
    try {
      const smsResult = await sendOTP(formattedPhone, otp);
      
      if (smsResult && smsResult.localDev) {
        console.log(`📱 DEV MODE: PIN Reset OTP for ${formattedPhone} is ${otp}`);
        return res.json({ 
          success: true, 
          message: 'OTP sent successfully (dev mode)',
          phoneNumber: formattedPhone,
          otp: otp
        });
      }
      
      return res.json({ 
        success: true, 
        message: 'OTP sent successfully via SMS',
        phoneNumber: formattedPhone
      });
    } catch (error) {
      console.error('Error sending PIN reset OTP:', error);
      if (isDevMode) {
        console.log(`📱 DEV MODE: PIN Reset OTP for ${formattedPhone} is ${otp}`);
        return res.json({ 
          success: true, 
          message: 'OTP sent successfully (dev mode)',
          phoneNumber: formattedPhone,
          otp: otp
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error requesting PIN reset OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * Reset PIN using OTP
 */
router.post('/reset-pin', [
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
    let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    if (formattedPhone.startsWith('254')) {
      formattedPhone = formattedPhone.substring(3);
    }
    if (formattedPhone.length > 9) {
      formattedPhone = formattedPhone.substring(0, 9);
    }
    formattedPhone = '254' + formattedPhone;

    // Verify OTP
    const resetKey = `pin-reset-${formattedPhone}`;
    const storedOtp = otpStore.get(resetKey);
    
    if (!storedOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new OTP.' });
    }
    
    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(resetKey);
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }
    
    if (storedOtp.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    // Find user
    const user = await User.findOne({ where: { phoneNumber: formattedPhone } });
    if (!user || !user.pinHash) {
      otpStore.delete(resetKey);
      return res.status(404).json({ error: 'User not found or has not completed signup' });
    }

    // Hash new PIN
    const pinHash = await bcrypt.hash(newPin, 10);

    // Update user PIN
    await user.update({ pinHash });

    // Clear OTP
    otpStore.delete(resetKey);

    res.json({
      success: true,
      message: 'PIN reset successfully'
    });
  } catch (error) {
    console.error('Error resetting PIN:', error);
    res.status(500).json({ error: 'Failed to reset PIN' });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;

