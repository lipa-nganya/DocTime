const express = require('express');
const router = express.Router();
const { User, Case, Referral, Role, TeamMember, Settings, Facility, Payer, Procedure, CaseTeamMember, CaseProcedure, ActivityLog } = require('../models');
const { authenticateToken } = require('./auth');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { logActivity, getIpAddress, getUserAgent } = require('../utils/activityLogger');

// Admin routes (in production, add admin role check)
// Temporarily disable auth for local development - add back in production
// router.use(authenticateToken);

/**
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'phoneNumber', 'role', 'otherRole', 'prefix', 'preferredName', 'lastLoginAt', 'createdAt', 'signupOTP'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Update user (admin only)
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { prefix, preferredName, role, otherRole } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};
    if (prefix !== undefined) updateData.prefix = prefix || null;
    if (preferredName !== undefined) updateData.preferredName = preferredName || null;
    if (role !== undefined) updateData.role = role || null;
    if (otherRole !== undefined) updateData.otherRole = otherRole || null;

    await user.update(updateData);

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * Get dashboard stats
 */
router.get('/dashboard', async (req, res) => {
  try {
    const completedCount = await Case.count({ where: { status: 'Completed' } });
    const cancelledCount = await Case.count({ where: { status: 'Cancelled' } });
    const referredCount = await Case.count({ where: { isReferred: true } });
    const ongoingCount = await Case.count({
      where: {
        status: {
          [Op.in]: ['Upcoming', 'Referred']
        }
      }
    });
    const totalUsers = await User.count();
    const activeUsers = await User.count({
      where: {
        lastLoginAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    res.json({
      success: true,
      dashboard: {
        completedCases: completedCount,
        cancelledCases: cancelledCount,
        referredCases: referredCount,
        ongoingCases: ongoingCount,
        totalUsers,
        activeUsers
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

/**
 * Get ongoing cases
 * Includes all cases with status 'Upcoming' or 'Referred', regardless of date
 */
router.get('/ongoing-cases', async (req, res) => {
  try {
    const cases = await Case.findAll({
      where: {
        status: {
          [Op.in]: ['Upcoming', 'Referred']
        }
        // Removed dateOfProcedure filter to show all ongoing cases regardless of date
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'phoneNumber', 'role', 'prefix', 'preferredName'], required: false },
        { model: Facility, as: 'facility', required: false },
        { model: Payer, as: 'payer', required: false },
        { model: Procedure, as: 'procedure', required: false }
        // Temporarily removed procedures and teamMembers associations due to column mapping issues
        // TODO: Fix belongsToMany associations for case_procedures and case_team_members tables
      ],
      order: [['dateOfProcedure', 'ASC']]
    });

    console.log(`📊 Found ${cases.length} ongoing cases`);
    res.json({ success: true, cases: cases || [] });
  } catch (error) {
    console.error('Error fetching ongoing cases:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch ongoing cases', message: error.message });
  }
});

/**
 * Get completed cases
 */
router.get('/completed-cases', async (req, res) => {
  try {
    const cases = await Case.findAll({
      where: {
        status: 'Completed'
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'phoneNumber', 'role', 'prefix', 'preferredName'], required: false },
        { model: Facility, as: 'facility', required: false },
        { model: Payer, as: 'payer', required: false },
        { model: Procedure, as: 'procedure', required: false }
        // Temporarily removed procedures and teamMembers associations due to column mapping issues
        // TODO: Fix belongsToMany associations for case_procedures and case_team_members tables
      ],
      order: [['dateOfProcedure', 'DESC']]
    });

    console.log(`📊 Found ${cases.length} completed cases`);
    res.json({ success: true, cases: cases || [] });
  } catch (error) {
    console.error('Error fetching completed cases:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch completed cases', message: error.message });
  }
});

/**
 * Get cancelled cases
 */
router.get('/cancelled-cases', async (req, res) => {
  try {
    const cases = await Case.findAll({
      where: {
        status: 'Cancelled'
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'phoneNumber', 'role', 'prefix', 'preferredName'], required: false },
        { model: Facility, as: 'facility', required: false },
        { model: Payer, as: 'payer', required: false },
        { model: Procedure, as: 'procedure', required: false }
        // Temporarily removed procedures and teamMembers associations due to column mapping issues
        // TODO: Fix belongsToMany associations for case_procedures and case_team_members tables
      ],
      order: [['dateOfProcedure', 'DESC']]
    });

    console.log(`📊 Found ${cases.length} cancelled cases`);
    res.json({ success: true, cases: cases || [] });
  } catch (error) {
    console.error('Error fetching cancelled cases:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch cancelled cases', message: error.message });
  }
});

/**
 * Create a case for a user (admin only)
 */
router.post('/cases', async (req, res) => {
  try {
    const {
      userId,
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
      additionalNotes,
      status
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (!dateOfProcedure) {
      return res.status(400).json({ error: 'Date of procedure is required' });
    }
    if (!patientName) {
      return res.status(400).json({ error: 'Patient name is required' });
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Support both procedureIds array and procedureId single value (backward compatibility)
    const finalProcedureIds = procedureIds.length > 0 ? procedureIds : (procedureId ? [procedureId] : []);

    // Find facility
    let facility = null;
    if (facilityId) {
      facility = await Facility.findByPk(facilityId);
    }

    // Determine status - auto-complete cases with past dates
    const procedureDate = new Date(dateOfProcedure);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    procedureDate.setHours(0, 0, 0, 0);
    
    // If date is in the past (before today), auto-complete the case
    const isDatePassed = procedureDate < today;
    
    // Always auto-complete cases with past dates, regardless of status parameter
    let caseStatus = status;
    if (isDatePassed) {
      caseStatus = 'Completed'; // Force Completed status for past dates
    } else if (!caseStatus) {
      caseStatus = 'Upcoming'; // Default to Upcoming for future dates
    }

    // Create case
    const newCase = await Case.create({
      userId: userId,
      dateOfProcedure: new Date(dateOfProcedure),
      patientName,
      inpatientNumber,
      patientAge: patientAge ? parseInt(patientAge) : null,
      facilityId: facility?.id || null,
      payerId: payerId || null,
      invoiceNumber,
      procedureId: finalProcedureIds.length > 0 ? finalProcedureIds[0] : null,
      amount: amount ? parseFloat(amount) : null,
      paymentStatus: paymentStatus || 'Pending',
      additionalNotes,
      status: caseStatus,
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

    // Fetch created case with relations
    const caseWithRelations = await Case.findByPk(newCase.id, {
      include: [
        { model: Facility, as: 'facility' },
        { model: Payer, as: 'payer' },
        { model: Procedure, as: 'procedure' },
        { 
          model: TeamMember, 
          as: 'teamMembers',
          through: { attributes: [] }
        },
        { model: User, as: 'user', attributes: ['id', 'phoneNumber', 'prefix', 'preferredName'] }
      ]
    });

    // Log activity
    await logActivity({
      userId: userId,
      action: 'CREATE_CASE_ADMIN',
      entityType: 'Case',
      entityId: newCase.id,
      description: `Admin created case for patient "${patientName}"`,
      metadata: {
        caseId: newCase.id,
        patientName,
        createdBy: 'admin'
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    res.status(201).json({
      success: true,
      case: caseWithRelations
    });
  } catch (error) {
    console.error('Error creating case (admin):', error);
    res.status(500).json({ error: 'Failed to create case', message: error.message });
  }
});

/**
 * Move cases to another user (admin only)
 */
router.post('/cases/move', async (req, res) => {
  try {
    const { caseIds, targetUserId } = req.body;

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return res.status(400).json({ error: 'Case IDs are required' });
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    // Verify target user exists
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Update all cases
    const result = await Case.update(
      { userId: targetUserId },
      {
        where: {
          id: {
            [Op.in]: caseIds
          }
        }
      }
    );

    console.log(`✅ Moved ${result[0]} case(s) to user ${targetUserId}`);

    res.json({
      success: true,
      message: `Successfully moved ${result[0]} case(s) to user ${targetUser.phoneNumber}`,
      movedCount: result[0]
    });
  } catch (error) {
    console.error('Error moving cases:', error);
    res.status(500).json({ error: 'Failed to move cases' });
  }
});

/**
 * Bulk delete cases (admin)
 */
router.delete('/cases/bulk', async (req, res) => {
  try {
    const { caseIds } = req.body;

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return res.status(400).json({ error: 'Case IDs are required' });
    }

    // Find cases to get patient names for logging
    const casesToDelete = await Case.findAll({
      where: {
        id: {
          [Op.in]: caseIds
        }
      },
      attributes: ['id', 'patientName', 'userId']
    });

    if (casesToDelete.length === 0) {
      return res.status(404).json({ error: 'No cases found to delete' });
    }

    // Delete all cases
    const deletedCount = await Case.destroy({
      where: {
        id: {
          [Op.in]: caseIds
        }
      }
    });

    // Log activity for each deleted case
    for (const caseItem of casesToDelete) {
      await logActivity({
        userId: caseItem.userId,
        action: 'DELETE_CASE',
        entityType: 'Case',
        entityId: caseItem.id,
        description: `Admin deleted case for patient "${caseItem.patientName}"`,
        metadata: {
          caseId: caseItem.id,
          patientName: caseItem.patientName,
          deletedBy: 'admin',
          bulkDelete: true
        },
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req)
      });
    }

    console.log(`✅ Deleted ${deletedCount} case(s)`);

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} case(s)`,
      deletedCount
    });
  } catch (error) {
    console.error('Error deleting cases:', error);
    res.status(500).json({ error: 'Failed to delete cases' });
  }
});

/**
 * Update case (admin)
 */
router.put('/cases/:id', async (req, res) => {
  try {
    const caseItem = await Case.findByPk(req.params.id, {
      include: [
        { model: Facility, as: 'facility' },
        { model: Payer, as: 'payer' },
        { model: Procedure, as: 'procedure' },
        { 
          model: TeamMember, 
          as: 'teamMembers',
          through: { attributes: [] }
        },
        { 
          model: Procedure, 
          as: 'procedures',
          through: { attributes: [] }
        }
      ]
    });
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const {
      facilityId,
      payerId,
      procedureIds = [],
      teamMemberIds = [],
      invoiceNumber,
      ...otherFields
    } = req.body;

    const updateData = { ...otherFields };
    
    // Handle date conversion
    if (updateData.dateOfProcedure) {
      updateData.dateOfProcedure = new Date(updateData.dateOfProcedure);
    }

    // Handle numeric conversions
    if (updateData.patientAge) {
      updateData.patientAge = parseInt(updateData.patientAge);
    }
    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount);
    }

    // Update facility, payer, invoice number
    if (facilityId !== undefined) {
      updateData.facilityId = facilityId || null;
    }
    if (payerId !== undefined) {
      updateData.payerId = payerId || null;
    }
    if (invoiceNumber !== undefined) {
      updateData.invoiceNumber = invoiceNumber || null;
    }

    // Support both procedureIds array and procedureId single value (backward compatibility)
    const finalProcedureIds = procedureIds.length > 0 ? procedureIds : (otherFields.procedureId ? [otherFields.procedureId] : []);
    if (finalProcedureIds.length > 0) {
      updateData.procedureId = finalProcedureIds[0]; // Keep first procedure for backward compatibility
    }

    const oldData = { ...caseItem.toJSON() };
    await caseItem.update(updateData);

    // Update team member associations
    if (teamMemberIds !== undefined) {
      await CaseTeamMember.destroy({ where: { caseId: caseItem.id } });
      if (teamMemberIds.length > 0) {
        for (const teamMemberId of teamMemberIds) {
          await CaseTeamMember.create({
            caseId: caseItem.id,
            teamMemberId
          });
        }
      }
    }

    // Update procedure associations
    if (finalProcedureIds.length > 0) {
      await CaseProcedure.destroy({ where: { caseId: caseItem.id } });
      for (const procId of finalProcedureIds) {
        await CaseProcedure.create({
          caseId: caseItem.id,
          procedureId: procId
        });
      }
    }

    // Reload case with associations
    const updatedCase = await Case.findByPk(caseItem.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'phoneNumber', 'role', 'prefix', 'preferredName'] },
        { model: Facility, as: 'facility' },
        { model: Payer, as: 'payer' },
        { model: Procedure, as: 'procedure' },
        { 
          model: TeamMember, 
          as: 'teamMembers',
          through: { attributes: [] }
        },
        { 
          model: Procedure, 
          as: 'procedures',
          through: { attributes: [] }
        }
      ]
    });

    // Log activity (admin update)
    await logActivity({
      userId: req.userId || null, // Admin might not have userId, use null if not available
      action: 'UPDATE_CASE_ADMIN',
      entityType: 'Case',
      entityId: caseItem.id,
      description: `Admin updated case for patient "${caseItem.patientName}"`,
      metadata: {
        caseId: caseItem.id,
        oldData,
        newData: { ...updateData, procedureIds: finalProcedureIds, teamMemberIds },
        updatedBy: 'admin'
      },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req)
    });

    // Send push notification (implement notification service)
    const user = await User.findByPk(caseItem.userId);
    if (user && user.pushToken) {
      // TODO: Send push notification
      console.log(`Case ${caseItem.id} updated by admin. Notify user ${user.phoneNumber}`);
    }

    res.json({ success: true, case: updatedCase });
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

/**
 * Get all referrals
 */
router.get('/referrals', async (req, res) => {
  try {
    const referrals = await Referral.findAll({
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

/**
 * Manage roles and team member names
 */
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['name', 'ASC']]
    });
    res.json({ success: true, roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

router.post('/roles/:roleName/team-members', async (req, res) => {
  try {
    const { roleName } = req.params;
    const { names } = req.body;

    let role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      role = await Role.create({ name: roleName, teamMemberNames: [] });
    }

    const currentNames = role.teamMemberNames || [];
    const newNames = Array.isArray(names) ? names : [names];
    const updatedNames = [...new Set([...currentNames, ...newNames])];

    await role.update({ teamMemberNames: updatedNames });

    res.json({ success: true, role });
  } catch (error) {
    console.error('Error updating role team members:', error);
    res.status(500).json({ error: 'Failed to update role team members' });
  }
});

/**
 * Update team members for a role (used for removing members)
 */
router.put('/roles/:roleId/team-members', async (req, res) => {
  try {
    const { roleId } = req.params;
    const { names } = req.body;

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const updatedNames = Array.isArray(names) ? names : [];

    await role.update({ teamMemberNames: updatedNames });

    res.json({ success: true, role });
  } catch (error) {
    console.error('Error updating role team members:', error);
    res.status(500).json({ error: 'Failed to update role team members' });
  }
});

/**
 * Delete a role
 */
router.delete('/roles/:roleId', async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    await role.destroy();

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

/**
 * Get settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.findAll({
      order: [['key', 'ASC']]
    });
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * Update setting
 */
router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    let setting = await Settings.findOne({ where: { key } });
    if (!setting) {
      setting = await Settings.create({ key, value, description });
    } else {
      await setting.update({ value, description });
    }

    res.json({ success: true, setting });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

/**
 * Get reports for a specific user (admin)
 */
router.get('/reports/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get date filters from query parameters
    let startDate = null;
    let endDate = null;
    
    if (req.query.startDate) {
      // Parse date string (format: YYYY-MM-DD) and create date in local timezone
      const dateParts = req.query.startDate.split('-');
      startDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      startDate.setHours(0, 0, 0, 0); // Start of day
    }
    
    if (req.query.endDate) {
      // Parse date string (format: YYYY-MM-DD) and create date in local timezone
      const dateParts = req.query.endDate.split('-');
      endDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      endDate.setHours(23, 59, 59, 999); // End of day
    }
    
    // If only one date is provided, use it for both start and end (single day filter)
    if (startDate && !endDate) {
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    }
    if (endDate && !startDate) {
      startDate = new Date(endDate);
      startDate.setHours(0, 0, 0, 0);
    }
    
    // If both dates are the same, ensure we capture the entire day
    if (startDate && endDate) {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      if (startDateStr === endDateStr) {
        // Same day - ensure full day range
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }
    }
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.dateOfProcedure = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.dateOfProcedure[Op.gte] = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.dateOfProcedure[Op.lte] = end;
      }
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Completed cases count
    const completedCount = await Case.count({
      where: {
        userId,
        status: 'Completed',
        isReferred: false,
        ...dateFilter
      }
    });

    // Cancelled cases count
    const cancelledCount = await Case.count({
      where: {
        userId,
        status: 'Cancelled',
        ...dateFilter
      }
    });

    // Referred cases count
    const referredCount = await Case.count({
      where: {
        userId,
        isReferred: true,
        ...dateFilter
      }
    });

    // Autocompleted cases count
    const autoCompletedCount = await Case.count({
      where: {
        userId,
        isAutoCompleted: true,
        ...dateFilter
      }
    });

    // Surgeons worked with
    const surgeonsWorkedWith = await Case.findAll({
      where: {
        userId,
        status: 'Completed',
        ...dateFilter
      },
      include: [
        {
          model: TeamMember,
          as: 'teamMembers',
          where: {
            role: 'Surgeon'
          },
          through: { attributes: [] },
          required: false
        }
      ]
    });

    const surgeonCounts = {};
    surgeonsWorkedWith.forEach(caseItem => {
      caseItem.teamMembers.forEach(member => {
        surgeonCounts[member.id] = (surgeonCounts[member.id] || 0) + 1;
      });
    });

    const surgeons = await TeamMember.findAll({
      where: {
        id: Object.keys(surgeonCounts),
        role: 'Surgeon'
      }
    });

    const surgeonsAnalysis = surgeons.map(surgeon => ({
      id: surgeon.id,
      name: surgeon.name,
      casesCount: surgeonCounts[surgeon.id]
    }));

    // Total invoiced/uninvoiced amount
    const invoicedAmount = await Case.sum('amount', {
      where: {
        userId,
        status: 'Completed',
        invoiceNumber: {
          [Op.ne]: null
        },
        ...dateFilter
      }
    }) || 0;

    const uninvoicedAmount = await Case.sum('amount', {
      where: {
        userId,
        status: 'Completed',
        invoiceNumber: null,
        ...dateFilter
      }
    }) || 0;

    // Facilities analysis
    const facilitiesAnalysis = await Case.findAll({
      where: {
        userId,
        status: 'Completed',
        ...dateFilter
      },
      include: [
        {
          model: Facility,
          as: 'facility',
          required: false
        }
      ],
      attributes: [
        'facilityId',
        [Sequelize.fn('COUNT', Sequelize.col('Case.id')), 'casesCount'],
        [Sequelize.fn('SUM', Sequelize.col('Case.amount')), 'totalAmount']
      ],
      group: ['facilityId', 'facility.id', 'facility.name'],
      raw: false
    });

    const facilities = facilitiesAnalysis.map(item => ({
      facilityId: item.facilityId,
      facilityName: item.facility?.name || 'Unknown',
      casesCount: parseInt(item.get('casesCount') || 0),
      totalAmount: parseFloat(item.get('totalAmount') || 0)
    }));

    res.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        otherRole: user.otherRole,
        prefix: user.prefix,
        preferredName: user.preferredName
      },
      reports: {
        completedCases: completedCount,
        cancelledCases: cancelledCount,
        referredCases: referredCount,
        autoCompletedCases: autoCompletedCount,
        surgeonsAnalysis,
        invoicedAmount: parseFloat(invoicedAmount) || 0,
        uninvoicedAmount: parseFloat(uninvoicedAmount) || 0,
        facilitiesAnalysis: facilities
      }
    });
  } catch (error) {
    console.error('Error generating admin reports:', error);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

/**
 * Get activity logs with optional date filtering
 */
router.get('/logs', async (req, res) => {
  try {
    const { startDate, endDate, userId, action } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      
      if (startDate) {
        // Parse date string (format: YYYY-MM-DD) and create date in local timezone
        const dateParts = startDate.split('-');
        const start = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        start.setHours(0, 0, 0, 0); // Start of day
        dateFilter.createdAt[Op.gte] = start;
      }
      
      if (endDate) {
        // Parse date string (format: YYYY-MM-DD) and create date in local timezone
        const dateParts = endDate.split('-');
        const end = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        end.setHours(23, 59, 59, 999); // End of day
        dateFilter.createdAt[Op.lte] = end;
      }
      
      // If both dates are the same, ensure we capture the entire day
      if (startDate && endDate && startDate === endDate) {
        const dateParts = startDate.split('-');
        const start = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt = {
          [Op.gte]: start,
          [Op.lte]: end
        };
      }
    }
    
    // Build user filter
    const userFilter = {};
    if (userId) {
      userFilter.userId = userId;
    }
    
    // Build action filter
    const actionFilter = {};
    if (action) {
      actionFilter.action = action;
    }
    
    // Combine all filters
    const whereClause = {
      ...dateFilter,
      ...userFilter,
      ...actionFilter
    };
    
    const logs = await ActivityLog.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'phoneNumber', 'role', 'prefix', 'preferredName'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 1000 // Limit to prevent performance issues
    });
    
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

module.exports = router;

