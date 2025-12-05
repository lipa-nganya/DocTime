/**
 * Migration script to copy payers from local database to cloud database
 * 
 * Usage:
 *   LOCAL_DATABASE_URL=postgresql://user:pass@localhost:5432/doctime \
 *   CLOUD_DATABASE_URL=postgresql://user:pass@cloud-host:5432/doctime \
 *   node backend/scripts/migrate-payers.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Get database URLs from environment
const LOCAL_DB_URL = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;
const CLOUD_DB_URL = process.env.CLOUD_DATABASE_URL;

if (!LOCAL_DB_URL) {
  console.error('❌ Error: LOCAL_DATABASE_URL or DATABASE_URL not set');
  process.exit(1);
}

if (!CLOUD_DB_URL) {
  console.error('❌ Error: CLOUD_DATABASE_URL not set');
  console.error('Set it with: export CLOUD_DATABASE_URL=postgresql://user:pass@host:5432/database');
  process.exit(1);
}

// Create Sequelize instances
const localSequelize = new Sequelize(LOCAL_DB_URL, {
  dialect: 'postgres',
  logging: false
});

// Parse cloud connection URL manually to handle special characters in password
// Format: postgresql://user:password@host:port/database?params
// Also handle Unix socket format: postgresql://user:password@/database?host=/cloudsql/...
let username, password, host, port, database;

if (CLOUD_DB_URL.includes('@/') && CLOUD_DB_URL.includes('host=/cloudsql/')) {
  // Unix socket format - extract for TCP conversion
  const unixMatch = CLOUD_DB_URL.match(/postgresql:\/\/([^:]+):([^@]+)@\/([^?]+)(\?.*)?/);
  if (!unixMatch) {
    throw new Error('Invalid CLOUD_DATABASE_URL format (Unix socket)');
  }
  [, username, password, database] = unixMatch;
  // Use TCP connection details
  host = '34.27.171.24';
  port = '5432';
  // URL decode password in case it's encoded
  password = decodeURIComponent(password);
} else {
  // TCP format
  const urlMatch = CLOUD_DB_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/([^?]+)(\?.*)?/);
  if (!urlMatch) {
    throw new Error('Invalid CLOUD_DATABASE_URL format');
  }
  [, username, password, host, port, database] = urlMatch;
  // URL decode password in case it's encoded
  password = decodeURIComponent(password);
}
const cloudSequelize = new Sequelize(
  database,
  username,
  password,
  {
    host: host,
    port: port ? parseInt(port) : 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 10000
    },
    logging: false,
    pool: {
      max: 1,
      min: 0,
      acquire: 10000,
      idle: 10000
    }
  }
);

// Define models for local
const LocalPayer = localSequelize.define('Payer', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, {
  tableName: 'payers',
  timestamps: true
});

// Define models for cloud
const CloudPayer = cloudSequelize.define('Payer', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, {
  tableName: 'payers',
  timestamps: true
});

async function migratePayers() {
  try {
    console.log('🔌 Connecting to databases...');
    
    // Test connections
    await localSequelize.authenticate();
    console.log('✅ Connected to local database');
    
    await cloudSequelize.authenticate();
    console.log('✅ Connected to cloud database');
    
    // Fetch all payers from local database
    console.log('\n📥 Fetching payers from local database...');
    const localPayers = await LocalPayer.findAll({
      order: [['name', 'ASC']]
    });
    
    console.log(`📊 Found ${localPayers.length} payers in local database`);
    
    if (localPayers.length === 0) {
      console.log('ℹ️  No payers to migrate');
      return;
    }
    
    // Migrate each payer
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    console.log('\n🚀 Starting migration...\n');
    
    for (const localPayer of localPayers) {
      try {
        // Check if payer already exists in cloud (by name)
        const existingPayer = await CloudPayer.findOne({
          where: { name: localPayer.name }
        });
        
        if (existingPayer) {
          console.log(`⏭️  Skipping ${localPayer.name} - already exists in cloud`);
          skipCount++;
          continue;
        }
        
        // Create payer in cloud
        await CloudPayer.create({
          name: localPayer.name,
          isSystemDefined: localPayer.isSystemDefined || false
        });
        
        console.log(`✅ Migrated: ${localPayer.name}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating ${localPayer.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total processed: ${localPayers.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await localSequelize.close();
    await cloudSequelize.close();
    console.log('\n🔌 Database connections closed');
  }
}

// Run migration
migratePayers()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

