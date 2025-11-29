const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Facility } = require('../models');
const { authenticateToken } = require('./auth');

router.use(authenticateToken);

/**
 * Get all facilities
 */
router.get('/', async (req, res) => {
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
    res.status(201).json({ success: true, facility });
  } catch (error) {
    console.error('Error creating facility:', error);
    res.status(500).json({ error: 'Failed to create facility' });
  }
});

module.exports = router;

