const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Procedure } = require('../models');
const { authenticateToken } = require('./auth');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

// Authentication disabled for app access (same as facilities, payers, team members)
// router.use(authenticateToken);

/**
 * Get all procedures (cached for 5 minutes to reduce database queries)
 */
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'procedures:all';
    let procedures = cache.get(cacheKey);
    
    if (!procedures) {
      procedures = await Procedure.findAll({
        order: [['name', 'ASC']]
      });
      // Cache for 5 minutes (procedures rarely change)
      cache.set(cacheKey, procedures, 5 * 60 * 1000);
    }
    
    // Set cache headers for client-side caching
    res.set('Cache-Control', 'private, max-age=300'); // 5 minutes
    res.json({ success: true, procedures });
  } catch (error) {
    logger.error('Error fetching procedures:', error);
    res.status(500).json({ error: 'Failed to fetch procedures' });
  }
});

/**
 * Create a procedure
 */
router.post('/', [
  body('name').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    // Check if procedure already exists
    let procedure = await Procedure.findOne({ where: { name } });
    if (procedure) {
      return res.json({ success: true, procedure });
    }

    procedure = await Procedure.create({ name });
    // Clear cache when new procedure is created
    cache.clear('procedures:all');
    res.status(201).json({ success: true, procedure });
  } catch (error) {
    logger.error('Error creating procedure:', error);
    res.status(500).json({ error: 'Failed to create procedure' });
  }
});

module.exports = router;

