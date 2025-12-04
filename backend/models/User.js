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
        is: /^254\d{9,10}$/ // Allow 9-10 digits after 254 to handle edge cases
      }
    },
    pinHash: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for users in signup process (before PIN is set)
      comment: 'Hashed PIN. Null for users who haven\'t completed signup yet.'
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for users who haven't completed onboarding
      validate: {
        isIn: [['Surgeon', 'Assistant Surgeon', 'Anaesthetist', 'Assistant Anaesthetist', 'Other']]
      },
      comment: 'User role. Null until set during onboarding.'
    },
    otherRole: {
      type: DataTypes.STRING,
      allowNull: true
    },
    prefix: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Prof.']]
      }
    },
    preferredName: {
      type: DataTypes.STRING,
      allowNull: true
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

