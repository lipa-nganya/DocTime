const shouldUseSsl = (() => {
  if (process.env.DB_REQUIRE_SSL) {
    return process.env.DB_REQUIRE_SSL !== 'false';
  }
  const databaseUrl = process.env.DATABASE_URL || '';
  return !databaseUrl.includes('/cloudsql/');
})();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'doctime',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres'
  },
  'cloud-dev': {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: shouldUseSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : {},
    logging: console.log
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: (() => {
      const databaseUrl = process.env.DATABASE_URL || '';
      const isCloudSql = databaseUrl.includes('/cloudsql/');
      
      if (isCloudSql) {
        return {
          connectTimeout: 10000,
          statement_timeout: 5000,
          query_timeout: 5000
        };
      }
      
      return shouldUseSsl
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false
            },
            connectTimeout: 10000,
            statement_timeout: 5000,
            query_timeout: 5000
          }
        : {
            connectTimeout: 10000,
            statement_timeout: 5000,
            query_timeout: 5000
          };
    })(),
    pool: {
      max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 5,
      min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 1,
      acquire: 10000,
      idle: 10000,
      evict: 1000
    },
    logging: false
  }
};

