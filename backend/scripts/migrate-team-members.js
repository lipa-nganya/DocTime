/**
 * Migration script to copy team members from local database to cloud database
 * 
 * Usage:
 *   LOCAL_DATABASE_URL=postgresql://user:pass@localhost:5432/doctime \
 *   CLOUD_DATABASE_URL=postgresql://user:pass@cloud-host:5432/doctime \
 *   node backend/scripts/migrate-team-members.js
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
const LocalUser = localSequelize.define('User', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  phoneNumber: { type: Sequelize.DataTypes.STRING },
  role: { type: Sequelize.DataTypes.STRING },
  otherRole: { type: Sequelize.DataTypes.STRING },
  prefix: { type: Sequelize.DataTypes.STRING },
  preferredName: { type: Sequelize.DataTypes.STRING }
}, {
  tableName: 'users',
  timestamps: true
});

const LocalTeamMember = localSequelize.define('TeamMember', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  userId: { type: Sequelize.DataTypes.UUID },
  role: { type: Sequelize.DataTypes.STRING },
  otherRole: { type: Sequelize.DataTypes.STRING },
  name: { type: Sequelize.DataTypes.STRING },
  phoneNumber: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, {
  tableName: 'team_members',
  timestamps: true
});

// Define models for cloud
const CloudUser = cloudSequelize.define('User', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  phoneNumber: { type: Sequelize.DataTypes.STRING },
  role: { type: Sequelize.DataTypes.STRING },
  otherRole: { type: Sequelize.DataTypes.STRING },
  prefix: { type: Sequelize.DataTypes.STRING },
  preferredName: { type: Sequelize.DataTypes.STRING }
}, {
  tableName: 'users',
  timestamps: true
});

const CloudTeamMember = cloudSequelize.define('TeamMember', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  userId: { type: Sequelize.DataTypes.UUID },
  role: { type: Sequelize.DataTypes.STRING },
  otherRole: { type: Sequelize.DataTypes.STRING },
  name: { type: Sequelize.DataTypes.STRING },
  phoneNumber: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, {
  tableName: 'team_members',
  timestamps: true
});

// Associate models
LocalTeamMember.belongsTo(LocalUser, { foreignKey: 'userId', as: 'user' });
CloudTeamMember.belongsTo(CloudUser, { foreignKey: 'userId', as: 'user' });

async function migrateTeamMembers() {
  try {
    console.log('🔌 Connecting to databases...');
    
    // Test connections
    await localSequelize.authenticate();
    console.log('✅ Connected to local database');
    
    await cloudSequelize.authenticate();
    console.log('✅ Connected to cloud database');
    
    // Fetch all team members from local database with their users
    console.log('\n📥 Fetching team members from local database...');
    const localTeamMembers = await LocalTeamMember.findAll({
      include: [{
        model: LocalUser,
        as: 'user',
        attributes: ['id', 'phoneNumber', 'role', 'otherRole', 'prefix', 'preferredName']
      }],
      order: [['name', 'ASC']]
    });
    
    console.log(`📊 Found ${localTeamMembers.length} team members in local database`);
    
    if (localTeamMembers.length === 0) {
      console.log('ℹ️  No team members to migrate');
      return;
    }
    
    // Migrate each team member
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    console.log('\n🚀 Starting migration...\n');
    
    for (const localMember of localTeamMembers) {
      try {
        // Find the corresponding user in cloud database by phoneNumber
        let cloudUserId = null;
        
        if (localMember.user && localMember.user.phoneNumber) {
          const cloudUser = await CloudUser.findOne({
            where: { phoneNumber: localMember.user.phoneNumber }
          });
          
          if (cloudUser) {
            cloudUserId = cloudUser.id;
            console.log(`✅ Found cloud user for ${localMember.user.phoneNumber}`);
          } else {
            console.log(`⚠️  User ${localMember.user.phoneNumber} not found in cloud, will use first available user or create placeholder`);
            // Try to find any user in cloud, or we'll need to handle this case
            const firstCloudUser = await CloudUser.findOne({ order: [['createdAt', 'ASC']] });
            if (firstCloudUser) {
              cloudUserId = firstCloudUser.id;
              console.log(`   Using first available user: ${firstCloudUser.phoneNumber}`);
            }
          }
        } else {
          // No user associated, try to find any user in cloud
          const firstCloudUser = await CloudUser.findOne({ order: [['createdAt', 'ASC']] });
          if (firstCloudUser) {
            cloudUserId = firstCloudUser.id;
            console.log(`   No local user found, using first available cloud user: ${firstCloudUser.phoneNumber}`);
          }
        }
        
        if (!cloudUserId) {
          console.log(`❌ No cloud user available for team member: ${localMember.name}`);
          errorCount++;
          continue;
        }
        
        // Check if team member already exists in cloud (by name and role for same user)
        const existingMember = await CloudTeamMember.findOne({
          where: {
            userId: cloudUserId,
            name: localMember.name,
            role: localMember.role
          }
        });
        
        if (existingMember) {
          console.log(`⏭️  Skipping ${localMember.name} (${localMember.role}) - already exists in cloud`);
          skipCount++;
          continue;
        }
        
        // Create team member in cloud
        await CloudTeamMember.create({
          userId: cloudUserId,
          role: localMember.role,
          otherRole: localMember.otherRole,
          name: localMember.name,
          phoneNumber: localMember.phoneNumber,
          isSystemDefined: localMember.isSystemDefined || false
        });
        
        console.log(`✅ Migrated: ${localMember.name} (${localMember.role})`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating ${localMember.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total processed: ${localTeamMembers.length}`);
    
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
migrateTeamMembers()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

