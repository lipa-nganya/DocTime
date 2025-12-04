const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Case, Facility, Payer, Procedure, TeamMember, CaseTeamMember, CaseProcedure, User } = require('../models');
const { authenticateToken } = require('./auth');
const { Op } = require('sequelize');
const cron = require('node-cron');
const { logActivity, getIpAddress, getUserAgent } = require('../utils/activityLogger');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * Create a new case
 */
router.post('/', [
  body('dateOfProcedure').isISO8601(),
  body('patientName').notEmpty(),
  body('teamMemberIds').optional().isArray(),
  body('procedureIds').optional().isArray(),
  body('amount').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      dateOfProcedure,
      teamMemberIds = [],
      procedureIds = [],
      patientName,
      inpatientNumber,
      patientAge,
      facilityId,
      payerId,
      invoiceNumber,
      procedureId, // Keep for backward compatibility
      amount,
      paymentStatus,
      additionalNotes
    } = req.body;

    // Support both procedureIds array and procedureId single value (backward compatibility)
    const finalProcedureIds = procedureIds.length > 0 ? procedureIds : (procedureId ? [procedureId] : []);

    // Create or find facility
    let facility = null;
    if (facilityId) {
      facility = await Facility.findByPk(facilityId);
    }

    // Check if date has passed
    const procedureDate = new Date(dateOfProcedure);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    procedureDate.setHours(0, 0, 0, 0);
    
    const isDatePassed = procedureDate < today;
    const initialStatus = isDatePassed ? 'Completed' : 'Upcoming';

    // Create case
    const newCase = await Case.create({
      userId: req.userId,
      dateOfProcedure: new Date(dateOfProcedure),
      patientName,
      inpatientNumber,
      patientAge,
      facilityId: facility?.id || null,
      payerId: payerId || null,
      invoiceNumber,
      procedureId: finalProcedureIds.length > 0 ? finalProcedureIds[0] : null, // Keep first procedure for backward compatibility
      amount: amount ? parseFloat(amount) : null,
      paymentStatus: paymentStatus || 'Pending',
      additionalNotes,
      status: initialStatus,
      isAutoCompleted: isDatePassed,
      completedAt: isDatePassed ? new Date() : null
    });

    // Add team members
    if (teamMemberIds && teamMemberIds.length > 0) {
      for (const teamMemberId of teamMemberIds) {
        await CaseTeamMember.create({
          caseId: newCase.id,
          teamMemberId
        });
      }
    }

    // Add procedures
    if (finalProcedureIds && finalProcedureIds.length > 0) {
      for (const procId of finalProcedureIds) {
        await CaseProcedure.create({
          caseId: newCase.id,
          procedureId: procId
        });
      }
    }

    // Fetch case with relations
    const caseWithRelations = await Case.findByPk(newCase.id, {
      include: [
        { model: Facility, as: 'facility' },
        { model: Payer, as: 'payer' },
        { model: Procedure, as: 'procedure' }, // Keep for backward compatibility
        { 
          model: Procedure, 
          as: 'procedures',
          through: { attributes: [] }
        },
        { 
          model: TeamMember, 
          as: 'teamMembers',
          through: { attributes: [] }
        }
      ]
    });

    // Log activity
    await logActivity({
      userId: req.userId,
      action: 'CREATE_CASE',
      entityType: 'Case',
      entityId: newCase.id,
      description: `Created case for patient "${patientName}"`,
      metadata: {
        patientName,
        dateOfProcedure,
        facilityId,
        status: initialStatus,
        isAutoCompleted: isDatePassed
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      success: true,
      case: caseWithRelations,
      isAutoCompleted: isDatePassed
    });
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

/**
 * Get upcoming cases (next 5)
 */
router.get('/upcoming', async (req, res) => {
  try {
    const cases = await Case.findAll({
      where: {
        userId: req.userId,
        status: {
          [Op.in]: ['Upcoming', 'Referred']
        },
        dateOfProcedure: {
          [Op.gte]: new Date()
        }
      },
      include: [
        { model: Facility, as: 'facility' },
        { model: Payer, as: 'payer' },
        { model: Procedure, as: 'procedure' },
        { 
          model: TeamMember, 
          as: 'teamMembers',
          through: { attributes: [] }
        },
        { model: User, as: 'referredTo', attributes: ['id', 'phoneNumber', 'role'] }
      ],
      order: [['dateOfProcedure', 'ASC']],
      limit: 5
    });

    res.json({ success: true, cases });
  } catch (error) {
    console.error('Error fetching upcoming cases:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming cases' });
  }
});

/**
 * Get all upcoming cases (for admin)
 */
router.get('/upcoming/all', async (req, res) => {
  try {
    const cases = await Case.findAll({
      where: {
        userId: req.userId,
        status: {
          [Op.in]: ['Upcoming', 'Referred']
        }
      },
      include: [
        { model: Facility, as: 'facility' },
        { model: Payer, as: 'payer' },
        { model: Procedure, as: 'procedure' },
        { 
          model: TeamMember, 
          as: 'teamMembers',
          through: { attributes: [] }
        },
        { model: User, as: 'referredTo', attributes: ['id', 'phoneNumber', 'role'] }
      ],
      order: [['dateOfProcedure', 'ASC']]
    });

    res.json({ success: true, cases });
  } catch (error) {
    console.error('Error fetching all upcoming cases:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming cases' });
  }
});

/**
 * Update a case
 */
router.put('/:id', async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseItem = await Case.findByPk(caseId);

    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check if user owns the case or is referred to it
    if (caseItem.userId !== req.userId && caseItem.referredToId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to update this case' });
    }

    // Check if case is referred and not yet accepted
    if (caseItem.isReferred && caseItem.referredToId === req.userId) {
      const referral = await require('../models').Referral.findOne({
        where: { caseId: caseId, refereeId: req.userId }
      });
      if (referral && referral.status !== 'Accepted') {
        return res.status(400).json({ error: 'Case must be accepted before editing' });
      }
    }

    const updateData = { ...req.body };
    
    // Handle date conversion
    if (updateData.dateOfProcedure) {
      updateData.dateOfProcedure = new Date(updateData.dateOfProcedure);
    }

    // Handle team members
    if (updateData.teamMemberIds) {
      // Remove existing team members
      await CaseTeamMember.destroy({ where: { caseId } });
      
      // Add new team members
      for (const teamMemberId of updateData.teamMemberIds) {
        await CaseTeamMember.create({
          caseId,
          teamMemberId
        });
      }
      delete updateData.teamMemberIds;
    }

    const oldData = { ...caseItem.toJSON() };
    await caseItem.update(updateData);

    // Fetch updated case with relations
    const updatedCase = await Case.findByPk(caseId, {
      include: [
        { model: Facility, as: 'facility' },
        { model: Payer, as: 'payer' },
        { model: Procedure, as: 'procedure' },
        { 
          model: TeamMember, 
          as: 'teamMembers',
          through: { attributes: [] }
        }
      ]
    });

    // Log activity
    await logActivity({
      userId: req.userId,
      action: 'UPDATE_CASE',
      entityType: 'Case',
      entityId: caseId,
      description: `Updated case for patient "${caseItem.patientName}"`,
      metadata: {
        caseId,
        oldData,
        newData: updateData
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({ success: true, case: updatedCase });
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

/**
 * Complete a case
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseItem = await Case.findByPk(caseId);

    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization
    if (caseItem.userId !== req.userId && caseItem.referredToId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // If referred, check if accepted
    if (caseItem.isReferred && caseItem.referredToId === req.userId) {
      const referral = await require('../models').Referral.findOne({
        where: { caseId: caseId, refereeId: req.userId }
      });
      if (referral && referral.status !== 'Accepted') {
        return res.status(400).json({ error: 'Case must be accepted before completing' });
      }
    }

    await caseItem.update({
      status: 'Completed',
      completedAt: new Date()
    });

    // Log activity
    await logActivity({
      userId: req.userId,
      action: 'COMPLETE_CASE',
      entityType: 'Case',
      entityId: caseId,
      description: `Completed case for patient "${caseItem.patientName}"`,
      metadata: {
        caseId,
        patientName: caseItem.patientName
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({ success: true, case: caseItem });
  } catch (error) {
    console.error('Error completing case:', error);
    res.status(500).json({ error: 'Failed to complete case' });
  }
});

/**
 * Cancel a case
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseItem = await Case.findByPk(caseId);

    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Check authorization
    if (caseItem.userId !== req.userId && caseItem.referredToId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // If referred, check if accepted
    if (caseItem.isReferred && caseItem.referredToId === req.userId) {
      const referral = await require('../models').Referral.findOne({
        where: { caseId: caseId, refereeId: req.userId }
      });
      if (referral && referral.status !== 'Accepted') {
        return res.status(400).json({ error: 'Case must be accepted before cancelling' });
      }
    }

    await caseItem.update({
      status: 'Cancelled',
      cancelledAt: new Date()
    });

    // Log activity
    await logActivity({
      userId: req.userId,
      action: 'CANCEL_CASE',
      entityType: 'Case',
      entityId: caseId,
      description: `Cancelled case for patient "${caseItem.patientName}"`,
      metadata: {
        caseId,
        patientName: caseItem.patientName
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({ success: true, case: caseItem });
  } catch (error) {
    console.error('Error cancelling case:', error);
    res.status(500).json({ error: 'Failed to cancel case' });
  }
});

/**
 * Delete a case
 */
router.delete('/:id', async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseItem = await Case.findByPk(caseId);

    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Only owner can delete
    if (caseItem.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this case' });
    }

    // Delete team member associations
    await CaseTeamMember.destroy({ where: { caseId } });
    
    const patientName = caseItem.patientName;
    
    // Delete case
    await caseItem.destroy();

    // Log activity
    await logActivity({
      userId: req.userId,
      action: 'DELETE_CASE',
      entityType: 'Case',
      entityId: caseId,
      description: `Deleted case for patient "${patientName}"`,
      metadata: {
        caseId,
        patientName
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.json({ success: true, message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

/**
 * Restore a cancelled case
 */
router.post('/:id/restore', async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseItem = await Case.findByPk(caseId);

    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (caseItem.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (caseItem.status !== 'Cancelled') {
      return res.status(400).json({ error: 'Case is not cancelled' });
    }

    const newStatus = new Date(caseItem.dateOfProcedure) >= new Date() ? 'Upcoming' : 'Completed';
    
    await caseItem.update({
      status: newStatus,
      cancelledAt: null,
      completedAt: newStatus === 'Completed' ? new Date() : null
    });

    res.json({ success: true, case: caseItem });
  } catch (error) {
    console.error('Error restoring case:', error);
    res.status(500).json({ error: 'Failed to restore case' });
  }
});

/**
 * Get case history - completed
 */
router.get('/history/completed', async (req, res) => {
  try {
    const cases = await Case.findAll({
      where: {
        userId: req.userId,
        status: 'Completed',
        isReferred: false
      },
      include: [
        { model: Facility, as: 'facility' },
        { model: Payer, as: 'payer' },
        { model: Procedure, as: 'procedure' }
      ],
      order: [['dateOfProcedure', 'DESC']]
    });

    res.json({ success: true, cases });
  } catch (error) {
    console.error('Error fetching completed cases:', error);
    res.status(500).json({ error: 'Failed to fetch completed cases' });
  }
});

/**
 * Get case history - cancelled
 */
router.get('/history/cancelled', async (req, res) => {
  try {
    const cases = await Case.findAll({
      where: {
        userId: req.userId,
        status: 'Cancelled'
      },
      include: [
        { model: Facility, as: 'facility' },
        { model: Payer, as: 'payer' },
        { model: Procedure, as: 'procedure' }
      ],
      order: [['dateOfProcedure', 'DESC']]
    });

    res.json({ success: true, cases });
  } catch (error) {
    console.error('Error fetching cancelled cases:', error);
    res.status(500).json({ error: 'Failed to fetch cancelled cases' });
  }
});

/**
 * Get single case
 */
router.get('/:id', async (req, res) => {
  try {
    const caseItem = await Case.findByPk(req.params.id, {
      include: [
        { model: Facility, as: 'facility' },
        { model: Payer, as: 'payer' },
        { model: Procedure, as: 'procedure' },
        { 
          model: Procedure, 
          as: 'procedures',
          through: { attributes: [] }
        },
        { 
          model: TeamMember, 
          as: 'teamMembers',
          through: { attributes: [] }
        },
        { model: User, as: 'referredTo', attributes: ['id', 'phoneNumber', 'role'] }
      ]
    });

    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Get referral information if case is referred
    let referral = null;
    if (caseItem.isReferred) {
      const { Referral } = require('../models');
      referral = await Referral.findOne({
        where: { caseId: caseItem.id },
        include: [
          { model: User, as: 'referrer', attributes: ['id', 'phoneNumber', 'role'] },
          { model: User, as: 'referee', attributes: ['id', 'phoneNumber', 'role'] }
        ]
      });
    }

    const response = { success: true, case: caseItem };
    if (referral) {
      response.referral = referral;
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

/**
 * Auto-complete expired cases (cron job)
 */
async function autoCompleteExpiredCases() {
  try {
    const expiredCases = await Case.findAll({
      where: {
        status: 'Upcoming',
        dateOfProcedure: {
          [Op.lt]: new Date()
        }
      },
      include: [{ model: User, as: 'user' }]
    });

    for (const caseItem of expiredCases) {
      await caseItem.update({
        status: 'Completed',
        isAutoCompleted: true,
        completedAt: new Date()
      });

      // Send push notification (implement notification service)
      if (caseItem.user && caseItem.user.pushToken) {
        // TODO: Send push notification
        console.log(`Auto-completed case ${caseItem.id} for user ${caseItem.user.phoneNumber}`);
      }
    }
  } catch (error) {
    console.error('Error auto-completing cases:', error);
  }
}

// Run auto-complete check every hour
if (process.env.NODE_ENV === 'production') {
  cron.schedule('0 * * * *', autoCompleteExpiredCases);
}

module.exports = router;

