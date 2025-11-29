const express = require('express');
const router = express.Router();
const { User, Case, Referral, Role, TeamMember, Settings, Facility, Payer } = require('../models');
const { authenticateToken } = require('./auth');
const { Op } = require('sequelize');

// Admin routes (in production, add admin role check)
// Temporarily disable auth for local development - add back in production
// router.use(authenticateToken);

/**
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'phoneNumber', 'role', 'otherRole', 'lastLoginAt', 'createdAt', 'signupOTP'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
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
 */
router.get('/ongoing-cases', async (req, res) => {
  try {
    const cases = await Case.findAll({
      where: {
        status: {
          [Op.in]: ['Upcoming', 'Referred']
        },
        dateOfProcedure: {
          [Op.gte]: new Date()
        }
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'phoneNumber', 'role'] },
        { model: require('../models').Facility, as: 'facility' },
        { model: require('../models').Procedure, as: 'procedure' }
      ],
      order: [['dateOfProcedure', 'ASC']]
    });

    res.json({ success: true, cases });
  } catch (error) {
    console.error('Error fetching ongoing cases:', error);
    res.status(500).json({ error: 'Failed to fetch ongoing cases' });
  }
});

/**
 * Update case (admin)
 */
router.put('/cases/:id', async (req, res) => {
  try {
    const caseItem = await Case.findByPk(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ error: 'Case not found' });
    }

    await caseItem.update(req.body);

    // Send push notification (implement notification service)
    const user = await User.findByPk(caseItem.userId);
    if (user && user.pushToken) {
      // TODO: Send push notification
      console.log(`Case ${caseItem.id} updated by admin. Notify user ${user.phoneNumber}`);
    }

    res.json({ success: true, case: caseItem });
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
 * Get all facilities (admin)
 */
router.get('/facilities', async (req, res) => {
  try {
    const facilities = await Facility.findAll({
      order: [['name', 'ASC']]
    });
    res.json({ success: true, facilities });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});

/**
 * Create a facility (admin)
 */
router.post('/facilities', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Facility name is required' });
    }

    // Check if facility already exists
    let facility = await Facility.findOne({ where: { name: name.trim() } });
    if (facility) {
      return res.json({ success: true, facility, message: 'Facility already exists' });
    }

    facility = await Facility.create({ name: name.trim() });
    res.status(201).json({ success: true, facility });
  } catch (error) {
    console.error('Error creating facility:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Facility with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create facility' });
  }
});

/**
 * Delete a facility (admin)
 */
router.delete('/facilities/:id', async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    // Check if facility is used in any cases
    const caseCount = await Case.count({ where: { facilityId: facility.id } });
    if (caseCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete facility. It is used in ${caseCount} case(s).` 
      });
    }

    await facility.destroy();
    res.json({ success: true, message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Error deleting facility:', error);
    res.status(500).json({ error: 'Failed to delete facility' });
  }
});

/**
 * Get all payers (admin)
 */
router.get('/payers', async (req, res) => {
  try {
    const payers = await Payer.findAll({
      order: [['name', 'ASC']]
    });
    res.json({ success: true, payers });
  } catch (error) {
    console.error('Error fetching payers:', error);
    res.status(500).json({ error: 'Failed to fetch payers' });
  }
});

/**
 * Create a payer (admin)
 */
router.post('/payers', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Payer name is required' });
    }

    // Check if payer already exists
    let payer = await Payer.findOne({ where: { name: name.trim() } });
    if (payer) {
      return res.json({ success: true, payer, message: 'Payer already exists' });
    }

    payer = await Payer.create({ name: name.trim() });
    res.status(201).json({ success: true, payer });
  } catch (error) {
    console.error('Error creating payer:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Payer with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create payer' });
  }
});

/**
 * Delete a payer (admin)
 */
router.delete('/payers/:id', async (req, res) => {
  try {
    const payer = await Payer.findByPk(req.params.id);
    if (!payer) {
      return res.status(404).json({ error: 'Payer not found' });
    }

    // Check if payer is used in any cases
    const caseCount = await Case.count({ where: { payerId: payer.id } });
    if (caseCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete payer. It is used in ${caseCount} case(s).` 
      });
    }

    await payer.destroy();
    res.json({ success: true, message: 'Payer deleted successfully' });
  } catch (error) {
    console.error('Error deleting payer:', error);
    res.status(500).json({ error: 'Failed to delete payer' });
  }
});

module.exports = router;

