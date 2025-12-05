const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Sequelize } = require('sequelize');
const { Op } = Sequelize;
const { Payer } = require('../models');
const { authenticateToken } = require('./auth');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

router.use(authenticateToken);

/**
 * Get all payers (cached for 5 minutes to reduce database queries)
 */
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'payers:all';
    let payers = cache.get(cacheKey);
    
    if (!payers) {
      payers = await Payer.findAll({
        order: [['name', 'ASC']]
      });
      // Cache for 5 minutes (payers rarely change)
      cache.set(cacheKey, payers, 5 * 60 * 1000);
    }
    
    // Set cache headers for client-side caching
    res.set('Cache-Control', 'private, max-age=300'); // 5 minutes
    res.json({ success: true, payers });
  } catch (error) {
    logger.error('Error fetching payers:', error);
    res.status(500).json({ error: 'Failed to fetch payers' });
  }
});

/**
 * Create a payer
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

    // Check if payer already exists
    let payer = await Payer.findOne({ where: { name } });
    if (payer) {
      return res.json({ success: true, payer });
    }

    payer = await Payer.create({ name });
    // Clear cache when new payer is created
    cache.clear('payers:all');
    res.status(201).json({ success: true, payer });
  } catch (error) {
    logger.error('Error creating payer:', error);
    res.status(500).json({ error: 'Failed to create payer' });
  }
});

/**
 * Update a payer
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

    const payer = await Payer.findByPk(id);
    if (!payer) {
      return res.status(404).json({ error: 'Payer not found' });
    }

    // Check if name already exists (excluding current payer)
    const existing = await Payer.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (existing) {
      return res.status(400).json({ error: 'Payer with this name already exists' });
    }

    await payer.update({ name });
    // Clear cache when payer is updated
    cache.clear('payers:all');
    res.json({ success: true, payer });
  } catch (error) {
    logger.error('Error updating payer:', error);
    res.status(500).json({ error: 'Failed to update payer' });
  }
});

/**
 * Delete a payer
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const payer = await Payer.findByPk(id);
    if (!payer) {
      return res.status(404).json({ error: 'Payer not found' });
    }

    // Check if payer is system-defined (prevent deletion)
    if (payer.isSystemDefined) {
      return res.status(400).json({ error: 'Cannot delete system-defined payer' });
    }

    await payer.destroy();
    // Clear cache when payer is deleted
    cache.clear('payers:all');
    res.json({ success: true, message: 'Payer deleted successfully' });
  } catch (error) {
    logger.error('Error deleting payer:', error);
    res.status(500).json({ error: 'Failed to delete payer' });
  }
});

module.exports = router;

