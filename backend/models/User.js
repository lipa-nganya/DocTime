const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^254\d{9}$/
      }
    },
    pinHash: {
      type: DataTypes.STRING,
      allowNull: false
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
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    prefix: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['Mr', 'Miss', 'Dr', 'Mrs', null]]
      }
    },
    biometricEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    pushToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    signupOTP: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'OTP used during signup (for admin display)'
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  User.associate = (models) => {
    User.hasMany(models.Case, { foreignKey: 'userId', as: 'cases' });
    User.hasMany(models.Case, { foreignKey: 'referredToId', as: 'referredCases' });
    User.hasMany(models.Referral, { foreignKey: 'referrerId', as: 'sentReferrals' });
    User.hasMany(models.Referral, { foreignKey: 'refereeId', as: 'receivedReferrals' });
  };

  return User;
};

