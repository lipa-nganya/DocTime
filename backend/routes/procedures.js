const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Procedure } = require('../models');
const { authenticateToken } = require('./auth');

router.use(authenticateToken);

/**
 * Get all procedures
 */
router.get('/', async (req, res) => {
  try {
    const procedures = await Procedure.findAll({
      order: [['name', 'ASC']]
    });
    res.json({ success: true, procedures });
  } catch (error) {
    console.error('Error fetching procedures:', error);
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
    res.status(201).json({ success: true, procedure });
  } catch (error) {
    console.error('Error creating procedure:', error);
    res.status(500).json({ error: 'Failed to create procedure' });
  }
});

module.exports = router;

