const { Sequelize } = require('sequelize');
const config = require('../config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;

if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], {
    ...dbConfig,
    logging: dbConfig.logging || false
  });
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      ...dbConfig.dialectOptions,
      logging: dbConfig.logging || false
    }
  );
}

const db = {
  User: require('./User')(sequelize),
  Case: require('./Case')(sequelize),
  Referral: require('./Referral')(sequelize),
  Facility: require('./Facility')(sequelize),
  Payer: require('./Payer')(sequelize),
  Procedure: require('./Procedure')(sequelize),
  TeamMember: require('./TeamMember')(sequelize),
  CaseTeamMember: require('./CaseTeamMember')(sequelize),
  Role: require('./Role')(sequelize),
  Settings: require('./Settings')(sequelize),
  sequelize,
  Sequelize
};

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;

