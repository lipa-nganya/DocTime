const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Facility = sequelize.define('Facility', {
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
    tableName: 'facilities',
    timestamps: true
  });

  Facility.associate = (models) => {
    Facility.hasMany(models.Case, { foreignKey: 'facilityId', as: 'cases' });
  };

  return Facility;
};

