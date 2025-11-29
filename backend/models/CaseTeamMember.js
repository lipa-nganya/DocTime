const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CaseTeamMember = sequelize.define('CaseTeamMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    caseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cases',
        key: 'id'
      }
    },
    teamMemberId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'team_members',
        key: 'id'
      }
    }
  }, {
    tableName: 'case_team_members',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['caseId', 'teamMemberId']
      }
    ]
  });

  return CaseTeamMember;
};

