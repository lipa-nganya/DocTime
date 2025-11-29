const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Referral, Case, User } = require('../models');
const { authenticateToken } = require('./auth');
const { sendSMS } = require('../services/sms');
const { Op } = require('sequelize');

router.use(authenticateToken);

/**
 * Refer a case to another doctor
 */
router.post('/', [
  body('caseId').isUUID(),
  body('refereePhoneNumber').isMobilePhone('en-KE')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { caseId, refereePhoneNumber } = req.body;

    // Find case
    const caseItem = await Case.findByPk(caseId, {
      include: [
        { model: require('../models').Facility, as: 'facility' },
        { model: require('../models').Procedure, as: 'procedure' }
      ]
    });

    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseItem.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to refer this case' });
    }

    // Format phone number
    let formattedPhone = refereePhoneNumber.replace(/[\s\-\(\)]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    formattedPhone = formattedPhone.replace(/\D/g, '');

    // Check if referee exists
    let referee = await User.findOne({ where: { phoneNumber: formattedPhone } });
    let refereeId = referee ? referee.id : null;

    // Create referral
    const referral = await Referral.create({
      caseId,
      referrerId: req.userId,
      refereeId,
      refereePhoneNumber: formattedPhone,
      status: 'Pending'
    });

    // Update case
    await caseItem.update({
      isReferred: true,
      referredToId: refereeId,
      status: 'Referred'
    });

    // Send SMS to referee
    const referrer = await User.findByPk(req.userId);
    const appLink = process.env.EXPO_APP_LINK || 'https://expo.dev/@lipanganya/doctime';
    const message = `You have been referred a case by ${referrer.phoneNumber}. Patient: ${caseItem.patientName}, Date: ${new Date(caseItem.dateOfProcedure).toLocaleDateString()}, Facility: ${caseItem.facility?.name || 'N/A'}. Install app: ${appLink}`;

    try {
      await sendSMS(formattedPhone, message);
      await referral.update({ smsSent: true });
    } catch (error) {
      console.error('Error sending referral SMS:', error);
    }

    res.json({ success: true, referral });
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

/**
 * Accept a referral
 */
router.post('/:id/accept', async (req, res) => {
  try {
    const referral = await Referral.findByPk(req.params.id, {
      include: [{ model: Case, as: 'case' }]
    });

    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    // Check if user is the referee
    const currentUser = await User.findByPk(req.userId);
    if (referral.refereePhoneNumber !== currentUser.phoneNumber && referral.refereeId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update referral
    await referral.update({
      status: 'Accepted',
      acceptedAt: new Date(),
      refereeId: req.userId
    });

    // Update case
    await referral.case.update({
      referredToId: req.userId
    });

    // Send SMS to referrer
    const referrer = await User.findByPk(referral.referrerId);
    const message = `Your referral has been accepted by ${currentUser.phoneNumber}. Case: ${referral.case.patientName}`;

    try {
      await sendSMS(referrer.phoneNumber, message);
    } catch (error) {
      console.error('Error sending acceptance SMS:', error);
    }

    res.json({ success: true, referral });
  } catch (error) {
    console.error('Error accepting referral:', error);
    res.status(500).json({ error: 'Failed to accept referral' });
  }
});

/**
 * Decline a referral
 */
router.post('/:id/decline', async (req, res) => {
  try {
    const referral = await Referral.findByPk(req.params.id, {
      include: [{ model: Case, as: 'case' }]
    });

    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    // Check if user is the referee
    const currentUser = await User.findByPk(req.userId);
    if (referral.refereePhoneNumber !== currentUser.phoneNumber && referral.refereeId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update referral
    await referral.update({
      status: 'Declined',
      declinedAt: new Date()
    });

    // Update case - return to referrer
    await referral.case.update({
      isReferred: false,
      referredToId: null,
      status: 'Upcoming'
    });

    // Send SMS to referrer
    const referrer = await User.findByPk(referral.referrerId);
    const message = `Your referral has been declined by ${currentUser.phoneNumber}. Case: ${referral.case.patientName} has been returned to your queue.`;

    try {
      await sendSMS(referrer.phoneNumber, message);
    } catch (error) {
      console.error('Error sending decline SMS:', error);
    }

    res.json({ success: true, referral });
  } catch (error) {
    console.error('Error declining referral:', error);
    res.status(500).json({ error: 'Failed to decline referral' });
  }
});

/**
 * Get referrals for current user
 */
router.get('/', async (req, res) => {
  try {
    const referrals = await Referral.findAll({
      where: {
        [Op.or]: [
          { referrerId: req.userId },
          { refereeId: req.userId },
          { refereePhoneNumber: (await User.findByPk(req.userId)).phoneNumber }
        ]
      },
      include: [
        {
          model: Case,
          as: 'case',
          include: [
            { model: require('../models').Facility, as: 'facility' },
            { model: require('../models').Procedure, as: 'procedure' }
          ]
        },
        { model: User, as: 'referrer', attributes: ['id', 'phoneNumber', 'role'] },
        { model: User, as: 'referee', attributes: ['id', 'phoneNumber', 'role'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, referrals });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

module.exports = router;

