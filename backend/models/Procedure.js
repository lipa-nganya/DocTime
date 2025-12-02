const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Procedure = sequelize.define('Procedure', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    isSystemDefined: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'procedures',
    timestamps: true
  });

  Procedure.associate = (models) => {
    Procedure.hasMany(models.Case, { foreignKey: 'procedureId', as: 'cases' });
  };

  return Procedure;
};

