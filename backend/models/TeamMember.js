const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TeamMember = sequelize.define('TeamMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other']]
      }
    },
    otherRole: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isSystemDefined: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'team_members',
    timestamps: true
  });

  TeamMember.associate = (models) => {
    TeamMember.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    TeamMember.belongsToMany(models.Case, {
      through: models.CaseTeamMember,
      foreignKey: 'teamMemberId',
      as: 'cases'
    });
  };

  return TeamMember;
};

