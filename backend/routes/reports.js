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
    
    // Get date filters from query parameters
    let startDate = null;
    let endDate = null;
    let startDateStr = null;
    let endDateStr = null;
    
    if (req.query.startDate) {
      startDateStr = req.query.startDate; // Format: YYYY-MM-DD
      // Create UTC date for start of day
      startDate = new Date(startDateStr + 'T00:00:00.000Z');
    }
    
    if (req.query.endDate) {
      endDateStr = req.query.endDate; // Format: YYYY-MM-DD
      // Create UTC date for end of day
      endDate = new Date(endDateStr + 'T23:59:59.999Z');
    }
    
    // If only one date is provided, use it for both start and end (single day filter)
    if (startDateStr && !endDateStr) {
      endDateStr = startDateStr;
      endDate = new Date(endDateStr + 'T23:59:59.999Z');
    }
    if (endDateStr && !startDateStr) {
      startDateStr = endDateStr;
      startDate = new Date(startDateStr + 'T00:00:00.000Z');
    }
    
    // Build date filter for where clause using date-only comparison
    const baseConditions = {
      userId,
      status: 'Completed',
      isReferred: false
    };
    
    const allConditions = [baseConditions];
    
    if (startDateStr || endDateStr) {
      // Use Sequelize's DATE function to compare date-only, ignoring time
      const dateConditions = [];
      if (startDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.gte,
            startDateStr
          )
        );
      }
      if (endDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.lte,
            endDateStr
          )
        );
      }
      if (dateConditions.length > 0) {
        allConditions.push(...dateConditions);
      }
    }
    
    const whereClause = allConditions.length > 1 ? { [Op.and]: allConditions } : baseConditions;
    
    console.log('📊 Reports date filter:', {
      startDateStr,
      endDateStr,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      whereClause: JSON.stringify(whereClause, null, 2)
    });

    // Completed cases count
    const completedCount = await Case.count({
      where: whereClause
    });

    // Cancelled cases count
    const cancelledBase = {
      userId,
      status: 'Cancelled'
    };
    const cancelledConditions = [cancelledBase];
    if (startDateStr || endDateStr) {
      const dateConditions = [];
      if (startDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.gte,
            startDateStr
          )
        );
      }
      if (endDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.lte,
            endDateStr
          )
        );
      }
      if (dateConditions.length > 0) {
        cancelledConditions.push(...dateConditions);
      }
    }
    const cancelledWhere = cancelledConditions.length > 1 ? { [Op.and]: cancelledConditions } : cancelledBase;
    const cancelledCount = await Case.count({
      where: cancelledWhere
    });

    // Referred cases count (cases user has referred to others)
    const referredWhere = {
      userId,
      isReferred: true
    };
    if (startDateStr || endDateStr) {
      const dateConditions = [];
      if (startDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.gte,
            startDateStr
          )
        );
      }
      if (endDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.lte,
            endDateStr
          )
        );
      }
      if (dateConditions.length > 0) {
        referredWhere[Op.and] = dateConditions;
      }
    }
    const referredCount = await Case.count({
      where: referredWhere
    });

    // Autocompleted cases count
    const autoCompletedWhere = {
      userId,
      isAutoCompleted: true
    };
    if (startDateStr || endDateStr) {
      const dateConditions = [];
      if (startDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.gte,
            startDateStr
          )
        );
      }
      if (endDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.lte,
            endDateStr
          )
        );
      }
      if (dateConditions.length > 0) {
        autoCompletedWhere[Op.and] = dateConditions;
      }
    }
    
    // Debug: Log autocompleted cases query
    console.log('🔍 Autocompleted cases query:', JSON.stringify(autoCompletedWhere, null, 2));
    const autoCompletedCount = await Case.count({
      where: autoCompletedWhere
    });
    
    // Debug: Also fetch some examples to verify
    const autoCompletedSamples = await Case.findAll({
      where: autoCompletedWhere,
      attributes: ['id', 'dateOfProcedure', 'patientName', 'status', 'isAutoCompleted'],
      limit: 5
    });
    console.log(`📊 Found ${autoCompletedCount} autocompleted cases (showing ${autoCompletedSamples.length} samples):`, 
      autoCompletedSamples.map(c => ({
        date: c.dateOfProcedure,
        patient: c.patientName,
        dateStr: c.dateOfProcedure ? new Date(c.dateOfProcedure).toISOString().split('T')[0] : null
      }))
    );

    // Surgeons worked with
    const surgeonsWhere = {
      userId,
      status: 'Completed'
    };
    if (startDateStr || endDateStr) {
      const dateConditions = [];
      if (startDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.gte,
            startDateStr
          )
        );
      }
      if (endDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.lte,
            endDateStr
          )
        );
      }
      if (dateConditions.length > 0) {
        surgeonsWhere[Op.and] = dateConditions;
      }
    }
    const surgeonsWorkedWith = await Case.findAll({
      where: surgeonsWhere,
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
    const invoicedWhere = {
      userId,
      status: 'Completed',
      invoiceNumber: {
        [Op.ne]: null
      }
    };
    if (startDateStr || endDateStr) {
      const dateConditions = [];
      if (startDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.gte,
            startDateStr
          )
        );
      }
      if (endDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.lte,
            endDateStr
          )
        );
      }
      if (dateConditions.length > 0) {
        invoicedWhere[Op.and] = dateConditions;
      }
    }
    const invoicedAmount = await Case.sum('amount', {
      where: invoicedWhere
    }) || 0;

    const uninvoicedWhere = {
      userId,
      status: 'Completed',
      invoiceNumber: null
    };
    if (startDateStr || endDateStr) {
      const dateConditions = [];
      if (startDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.gte,
            startDateStr
          )
        );
      }
      if (endDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.lte,
            endDateStr
          )
        );
      }
      if (dateConditions.length > 0) {
        uninvoicedWhere[Op.and] = dateConditions;
      }
    }
    const uninvoicedAmount = await Case.sum('amount', {
      where: uninvoicedWhere
    }) || 0;

    // Facilities analysis
    const facilitiesWhere = {
      userId,
      status: 'Completed'
    };
    if (startDateStr || endDateStr) {
      const dateConditions = [];
      if (startDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.gte,
            startDateStr
          )
        );
      }
      if (endDateStr) {
        dateConditions.push(
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
            Op.lte,
            endDateStr
          )
        );
      }
      if (dateConditions.length > 0) {
        facilitiesWhere[Op.and] = dateConditions;
      }
    }
    const facilitiesAnalysis = await Case.findAll({
      where: facilitiesWhere,
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

    // Upcoming cases - only if date filter is today or in the future
    let upcomingCases = null; // null means don't show, 0 means show with 0 count
    
    // Determine the report date (use endDate if available, otherwise startDate, otherwise null)
    const reportDateStr = endDateStr || startDateStr;
    
    if (reportDateStr) {
      // Parse the date string (YYYY-MM-DD) and compare dates only (ignore time)
      const reportDateParts = reportDateStr.split('-');
      const reportYear = parseInt(reportDateParts[0]);
      const reportMonth = parseInt(reportDateParts[1]) - 1; // Month is 0-indexed
      const reportDay = parseInt(reportDateParts[2]);
      
      // Get today's date in local timezone
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDay = today.getDate();
      
      // Create date objects for comparison (local timezone)
      const reportDate = new Date(reportYear, reportMonth, reportDay);
      const todayDate = new Date(todayYear, todayMonth, todayDay);
      
      // Only show upcoming cases if the report date is today or in the future
      if (reportDate >= todayDate) {
        const upcomingWhere = {
          userId,
          status: {
            [Op.in]: ['Upcoming', 'Referred']
          },
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn('DATE', Sequelize.col('dateOfProcedure')),
              Op.eq,
              reportDateStr
            )
          ]
        };
        
        upcomingCases = await Case.count({
          where: upcomingWhere
        });
        
        console.log(`📊 Upcoming cases count: ${upcomingCases} for date ${reportDateStr} (report date: ${reportDate.toISOString().split('T')[0]}, today: ${todayDate.toISOString().split('T')[0]}, is today or future: ${reportDate >= todayDate})`);
      } else {
        console.log(`📊 Skipping upcoming cases - report date ${reportDateStr} is in the past (report: ${reportDate.toISOString().split('T')[0]}, today: ${todayDate.toISOString().split('T')[0]})`);
      }
    } else {
      console.log(`📊 No date filter - skipping upcoming cases`);
    }

    res.json({
      success: true,
      reports: {
        completedCases: completedCount,
        cancelledCases: cancelledCount,
        referredCases: referredCount,
        autoCompletedCases: autoCompletedCount,
        upcomingCases: upcomingCases,
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

