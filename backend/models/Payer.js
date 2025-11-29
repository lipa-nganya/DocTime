const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payer = sequelize.define('Payer', {
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
    tableName: 'payers',
    timestamps: true
  });

  Payer.associate = (models) => {
    Payer.hasMany(models.Case, { foreignKey: 'payerId', as: 'cases' });
  };

  return Payer;
};

