const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Sequelize } = require('sequelize');
const { Op } = Sequelize;
const { Facility } = require('../models');
const { authenticateToken } = require('./auth');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

// Admin routes - authentication disabled for admin panel access
// router.use(authenticateToken);

/**
 * Get all facilities (cached for 5 minutes to reduce database queries)
 */
router.get('/', async (req, res) => {
  try {
    logger.info('📥 GET /facilities request received');
    const cacheKey = 'facilities:all';
    let facilities = cache.get(cacheKey);
    
    if (!facilities) {
      logger.info('💾 Cache miss - fetching from database');
      facilities = await Facility.findAll({
        order: [['name', 'ASC']]
      });
      // Cache for 5 minutes (facilities rarely change)
      cache.set(cacheKey, facilities, 5 * 60 * 1000);
      logger.info(`💾 Cached ${facilities.length} facilities`);
    } else {
      logger.info(`💾 Cache hit - returning ${facilities.length} cached facilities`);
    }
    
    // Set cache headers for client-side caching
    // Note: Cache-Control header is set but may cause CORS issues if not in allowed headers
    res.set('Cache-Control', 'private, max-age=300'); // 5 minutes
    logger.info(`✅ Returning ${facilities.length} facilities`);
    res.json({ success: true, facilities });
  } catch (error) {
    logger.error('❌ Error fetching facilities:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to fetch facilities', message: error.message });
  }
});

/**
 * Create a facility
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

    // Check if facility already exists
    let facility = await Facility.findOne({ where: { name } });
    if (facility) {
      return res.json({ success: true, facility });
    }

    facility = await Facility.create({ name });
    // Clear cache when new facility is created
    cache.clear('facilities:all');
    res.status(201).json({ success: true, facility });
  } catch (error) {
    logger.error('Error creating facility:', error);
    res.status(500).json({ error: 'Failed to create facility' });
  }
});

/**
 * Update a facility
 */
router.put('/:id', [
  body('name').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name } = req.body;

    const facility = await Facility.findByPk(id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    // Check if name already exists (excluding current facility)
    const existing = await Facility.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (existing) {
      return res.status(400).json({ error: 'Facility with this name already exists' });
    }

    await facility.update({ name });
    // Clear cache when facility is updated
    cache.clear('facilities:all');
    res.json({ success: true, facility });
  } catch (error) {
    logger.error('Error updating facility:', error);
    res.status(500).json({ error: 'Failed to update facility' });
  }
});

/**
 * Delete a facility
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const facility = await Facility.findByPk(id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    // Check if facility is system-defined (prevent deletion)
    if (facility.isSystemDefined) {
      return res.status(400).json({ error: 'Cannot delete system-defined facility' });
    }

    await facility.destroy();
    // Clear cache when facility is deleted
    cache.clear('facilities:all');
    res.json({ success: true, message: 'Facility deleted successfully' });
  } catch (error) {
    logger.error('Error deleting facility:', error);
    res.status(500).json({ error: 'Failed to delete facility' });
  }
});

module.exports = router;

