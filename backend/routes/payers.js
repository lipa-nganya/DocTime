const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Payer } = require('../models');
const { authenticateToken } = require('./auth');

router.use(authenticateToken);

/**
 * Get all payers
 */
router.get('/', async (req, res) => {
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
    res.status(201).json({ success: true, payer });
  } catch (error) {
    console.error('Error creating payer:', error);
    res.status(500).json({ error: 'Failed to create payer' });
  }
});

module.exports = router;

