const { Sequelize } = require('sequelize');
const config = require('../config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;

if (dbConfig.use_env_variable) {
  const databaseUrl = process.env[dbConfig.use_env_variable] || '';
  
  // Log DATABASE_URL status (without exposing password)
  if (databaseUrl) {
    const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':***@');
    console.log(`📊 DATABASE_URL found: ${maskedUrl.substring(0, 80)}...`);
  } else {
    console.warn(`⚠️ Warning: ${dbConfig.use_env_variable} environment variable is not set.`);
  }
  
  // Check if DATABASE_URL is missing or is a placeholder value
  if (!databaseUrl || databaseUrl.includes('[YOUR_DB_URL]') || databaseUrl.includes('placeholder')) {
    console.warn(`⚠️ Warning: ${dbConfig.use_env_variable} environment variable is not properly set.`);
    console.warn('⚠️ Creating placeholder Sequelize instance. Database connection will be deferred.');
    // Create a minimal Sequelize instance with dummy connection so models can initialize
    // The actual connection will be established later when DATABASE_URL is available
    sequelize = new Sequelize('postgres://placeholder:placeholder@localhost:5432/placeholder', {
      ...dbConfig,
      logging: false,
      pool: { max: 1, min: 0, idle: 10000 } // Minimal pool for placeholder
    });
  } else {
    console.log('✅ Initializing Sequelize with DATABASE_URL...');
    
    // Check if this is a Unix socket connection (Cloud SQL)
    // Format: postgresql://user:pass@/database?host=/cloudsql/PROJECT:REGION:INSTANCE
    if (databaseUrl.includes('/cloudsql/') || (databaseUrl.includes('@/') && databaseUrl.includes('host='))) {
      // Extract Unix socket path from connection string
      const socketMatch = databaseUrl.match(/[?&]host=([^&]+)/);
      const userMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@/);
      const dbMatch = databaseUrl.match(/@\/([^?&]+)/);
      
      console.log('🔍 Parsing Unix socket URL:', {
        hasSocketMatch: !!socketMatch,
        hasUserMatch: !!userMatch,
        hasDbMatch: !!dbMatch,
        urlPreview: databaseUrl.substring(0, 60) + '...'
      });
      
      if (socketMatch && userMatch && dbMatch) {
        const socketPath = socketMatch[1];
        const username = userMatch[1];
        const password = userMatch[2];
        const database = dbMatch[1];
        
        console.log('🔌 Using Unix socket connection:', { 
          socketPath, 
          database, 
          username: username.substring(0, 10) + '...' 
        });
        
        sequelize = new Sequelize(database, username, password, {
          host: socketPath, // Unix socket path
          dialect: 'postgres',
          // CRITICAL: Do not set port - pg library detects Unix socket when host starts with / and port is undefined
          dialectOptions: {
            // No SSL for Unix socket connections
            connectTimeout: 10000,
            statement_timeout: 5000,
            query_timeout: 5000
          },
          pool: {
            max: 10,
            min: 2,
            acquire: 10000,
            idle: 10000,
            evict: 1000
          },
          logging: dbConfig.logging || false
        });
        
        // CRITICAL: Override Sequelize's default port=5432 for Unix sockets
        // Patch the connection manager to remove port
        const connectionManager = sequelize.connectionManager;
        if (connectionManager && connectionManager._connect) {
          const originalConnect = connectionManager._connect.bind(connectionManager);
          connectionManager._connect = function(config) {
            if (config && config.host && typeof config.host === 'string' && config.host.startsWith('/')) {
              // Remove port for Unix socket
              const { port, ...socketConfig } = config;
              return originalConnect(socketConfig);
            }
            return originalConnect(config);
          };
        }
      } else {
        // Fallback: try to let Sequelize parse it, but it will fail for Unix sockets
        console.log('⚠️ Could not parse Unix socket URL components, attempting direct connection string');
        console.log('⚠️ This may fail - Sequelize does not natively support Unix socket connection strings');
        sequelize = new Sequelize(databaseUrl, {
          ...dbConfig,
          pool: {
            max: 10,
            min: 2,
            acquire: 10000,
            idle: 10000,
            evict: 1000
          },
          dialectOptions: {
            ...(dbConfig.dialectOptions || {}),
            connectTimeout: 10000,
            statement_timeout: 5000,
            query_timeout: 5000
          }
        });
      }
    } else {
      // TCP connection - let Sequelize parse it
      sequelize = new Sequelize(databaseUrl, {
        ...dbConfig,
        pool: {
          max: 10,
          min: 2,
          acquire: 10000,
          idle: 10000,
          evict: 1000
        },
        dialectOptions: {
          ...(dbConfig.dialectOptions || {}),
          connectTimeout: 10000,
          statement_timeout: 5000,
          query_timeout: 5000
        }
      });
    }
  }
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
      logging: dbConfig.logging || false,
      // Optimize for production: reduce connection overhead
      ...(dbConfig.pool && { pool: dbConfig.pool })
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
  CaseProcedure: require('./CaseProcedure')(sequelize),
  Role: require('./Role')(sequelize),
  Settings: require('./Settings')(sequelize),
  ActivityLog: require('./ActivityLog')(sequelize),
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

