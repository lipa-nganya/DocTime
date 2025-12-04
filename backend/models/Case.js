const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Case = sequelize.define('Case', {
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
    dateOfProcedure: {
      type: DataTypes.DATE,
      allowNull: false
    },
    patientName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    inpatientNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    patientAge: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    facilityId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'facilities',
        key: 'id'
      }
    },
    payerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'payers',
        key: 'id'
      }
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    procedureId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'procedures',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    paymentStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Pending',
      validate: {
        isIn: [['Pending', 'Paid', 'Partially Paid', 'Pro Bono', 'Cancelled']]
      }
    },
    additionalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Upcoming',
      validate: {
        isIn: [['Upcoming', 'Completed', 'Cancelled', 'Referred', 'Invoiced', 'Paid']]
      }
    },
    isReferred: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    referredToId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isAutoCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'cases',
    timestamps: true
  });

  Case.associate = (models) => {
    Case.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Case.belongsTo(models.User, { foreignKey: 'referredToId', as: 'referredTo' });
    Case.belongsTo(models.Facility, { foreignKey: 'facilityId', as: 'facility' });
    Case.belongsTo(models.Payer, { foreignKey: 'payerId', as: 'payer' });
    Case.belongsTo(models.Procedure, { foreignKey: 'procedureId', as: 'procedure' }); // Keep for backward compatibility
    Case.belongsToMany(models.Procedure, {
      through: models.CaseProcedure,
      foreignKey: 'caseId',
      as: 'procedures'
    });
    Case.belongsToMany(models.TeamMember, {
      through: models.CaseTeamMember,
      foreignKey: 'caseId',
      as: 'teamMembers'
    });
    Case.hasOne(models.Referral, { foreignKey: 'caseId', as: 'referral' });
  };

  return Case;
};

