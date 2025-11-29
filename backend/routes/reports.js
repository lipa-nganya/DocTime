const express = require('express');
const router = express.Router();
const { Case, Referral, Facility, Payer, TeamMember, CaseTeamMember, User } = require('../models');
const { authenticateToken } = require('./auth');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');

router.use(authenticateToken);

/**
 * Get case reports/analytics
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    // Completed cases count
    const completedCount = await Case.count({
      where: {
        userId,
        status: 'Completed',
        isReferred: false
      }
    });

    // Cancelled cases count
    const cancelledCount = await Case.count({
      where: {
        userId,
        status: 'Cancelled'
      }
    });

    // Referred cases count (cases user has referred to others)
    const referredCount = await Case.count({
      where: {
        userId,
        isReferred: true
      }
    });

    // Autocompleted cases count
    const autoCompletedCount = await Case.count({
      where: {
        userId,
        isAutoCompleted: true
      }
    });

    // Surgeons worked with
    const surgeonsWorkedWith = await Case.findAll({
      where: {
        userId,
        status: 'Completed'
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
        }
      }
    }) || 0;

    const uninvoicedAmount = await Case.sum('amount', {
      where: {
        userId,
        status: 'Completed',
        invoiceNumber: null
      }
    }) || 0;

    // Facilities analysis
    const facilitiesAnalysis = await Case.findAll({
      where: {
        userId,
        status: 'Completed'
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
    console.error('Error generating reports:', error);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

module.exports = router;

