const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { TeamMember, Role } = require('../models');
const { authenticateToken } = require('./auth');

router.use(authenticateToken);

/**
 * Get team members by role
 */
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    
    const where = {};
    if (role) {
      where.role = role;
    }

    const teamMembers = await TeamMember.findAll({
      where,
      order: [['name', 'ASC']]
    });
    
    res.json({ success: true, teamMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

/**
 * Create a team member
 */
router.post('/', [
  body('name').notEmpty(),
  body('role').isIn(['Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, role, otherRole, phoneNumber } = req.body;

    const teamMember = await TeamMember.create({
      userId: req.userId,
      name,
      role,
      otherRole: role === 'Other' ? otherRole : null,
      phoneNumber
    });

    res.status(201).json({ success: true, teamMember });
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ error: 'Failed to create team member' });
  }
});

/**
 * Get roles with team member names (for admin)
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

module.exports = router;

