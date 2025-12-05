const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { TeamMember, Role } = require('../models');
const { authenticateToken } = require('./auth');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

router.use(authenticateToken);

/**
 * Get team members by role (cached for 5 minutes to reduce database queries)
 */
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    const cacheKey = `teamMembers:${role || 'all'}`;
    let teamMembers = cache.get(cacheKey);
    
    if (!teamMembers) {
      const where = {};
      if (role) {
        where.role = role;
      }

      teamMembers = await TeamMember.findAll({
        where,
        order: [['name', 'ASC']]
      });
      
      // Cache for 5 minutes (team members rarely change)
      cache.set(cacheKey, teamMembers, 5 * 60 * 1000);
    }
    
    // Set cache headers for client-side caching
    res.set('Cache-Control', 'private, max-age=300'); // 5 minutes
    res.json({ success: true, teamMembers });
  } catch (error) {
    logger.error('Error fetching team members:', error);
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

    // Clear cache when new team member is created
    cache.clear('teamMembers:all');
    if (teamMember.role) {
      cache.clear(`teamMembers:${teamMember.role}`);
    }
    res.status(201).json({ success: true, teamMember });
  } catch (error) {
    logger.error('Error creating team member:', error);
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
    logger.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

module.exports = router;

