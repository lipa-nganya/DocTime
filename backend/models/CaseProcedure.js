const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CaseProcedure = sequelize.define('CaseProcedure', {
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
    procedureId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'procedures',
        key: 'id'
      }
    }
  }, {
    tableName: 'case_procedures',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['caseId', 'procedureId']
      }
    ]
  });

  return CaseProcedure;
};



