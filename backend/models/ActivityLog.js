const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who performed the action. Null for system actions.'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Action type (e.g., CREATE_CASE, UPDATE_CASE, LOGIN, REFER_CASE, etc.)'
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Type of entity affected (e.g., Case, User, Referral, etc.)'
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID of the entity affected'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Human-readable description of the action'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional data about the action (e.g., old values, new values, etc.)'
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'IP address of the user who performed the action'
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User agent string'
    }
  }, {
    tableName: 'activity_logs',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['action']
      },
      {
        fields: ['entityType', 'entityId']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return ActivityLog;
};

