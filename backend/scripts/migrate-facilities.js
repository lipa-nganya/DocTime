/**
 * Migration script to copy facilities from local database to cloud database
 * 
 * Usage:
 *   LOCAL_DATABASE_URL=postgresql://user:pass@localhost:5432/doctime \
 *   CLOUD_DATABASE_URL=postgresql://user:pass@cloud-host:5432/doctime \
 *   node backend/scripts/migrate-facilities.js
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
const LocalFacility = localSequelize.define('Facility', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, {
  tableName: 'facilities',
  timestamps: true
});

// Define models for cloud
const CloudFacility = cloudSequelize.define('Facility', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, {
  tableName: 'facilities',
  timestamps: true
});

async function migrateFacilities() {
  try {
    console.log('🔌 Connecting to databases...');
    
    // Test connections
    await localSequelize.authenticate();
    console.log('✅ Connected to local database');
    
    await cloudSequelize.authenticate();
    console.log('✅ Connected to cloud database');
    
    // Fetch all facilities from local database
    console.log('\n📥 Fetching facilities from local database...');
    const localFacilities = await LocalFacility.findAll({
      order: [['name', 'ASC']]
    });
    
    console.log(`📊 Found ${localFacilities.length} facilities in local database`);
    
    if (localFacilities.length === 0) {
      console.log('ℹ️  No facilities to migrate');
      return;
    }
    
    // Migrate each facility
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    console.log('\n🚀 Starting migration...\n');
    
    for (const localFacility of localFacilities) {
      try {
        // Check if facility already exists in cloud (by name)
        const existingFacility = await CloudFacility.findOne({
          where: { name: localFacility.name }
        });
        
        if (existingFacility) {
          console.log(`⏭️  Skipping ${localFacility.name} - already exists in cloud`);
          skipCount++;
          continue;
        }
        
        // Create facility in cloud
        await CloudFacility.create({
          name: localFacility.name,
          isSystemDefined: localFacility.isSystemDefined || false
        });
        
        console.log(`✅ Migrated: ${localFacility.name}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating ${localFacility.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total processed: ${localFacilities.length}`);
    
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
migrateFacilities()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

