const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Referral = sequelize.define('Referral', {
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
    referrerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    refereeId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    refereePhoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Pending',
      validate: {
        isIn: [['Pending', 'Accepted', 'Declined']]
      }
    },
    declinedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    smsSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'referrals',
    timestamps: true
  });

  Referral.associate = (models) => {
    Referral.belongsTo(models.Case, { foreignKey: 'caseId', as: 'case' });
    Referral.belongsTo(models.User, { foreignKey: 'referrerId', as: 'referrer' });
    Referral.belongsTo(models.User, { foreignKey: 'refereeId', as: 'referee' });
  };

  return Referral;
};

