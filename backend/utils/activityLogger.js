const { ActivityLog } = require('../models');

/**
 * Log user activity
 * @param {Object} options - Logging options
 * @param {string} options.userId - User ID who performed the action
 * @param {string} options.action - Action type (e.g., 'CREATE_CASE', 'UPDATE_CASE', 'LOGIN', etc.)
 * @param {string} options.entityType - Type of entity (e.g., 'Case', 'User', 'Referral')
 * @param {string} options.entityId - ID of the entity affected
 * @param {string} options.description - Human-readable description
 * @param {Object} options.metadata - Additional metadata
 * @param {string} options.ipAddress - IP address
 * @param {string} options.userAgent - User agent string
 */
async function logActivity(options) {
  try {
    const {
      userId = null,
      action,
      entityType = null,
      entityId = null,
      description = null,
      metadata = null,
      ipAddress = null,
      userAgent = null
    } = options;

    if (!action) {
      console.warn('Activity log: action is required');
      return;
    }

    await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      description,
      metadata,
      ipAddress,
      userAgent
    });
  } catch (error) {
    // Don't throw errors - logging should not break the application
    console.error('Error logging activity:', error);
  }
}

/**
 * Helper function to get IP address from request
 */
function getIpAddress(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         null;
}

/**
 * Helper function to get user agent from request
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || null;
}

module.exports = {
  logActivity,
  getIpAddress,
  getUserAgent
};

