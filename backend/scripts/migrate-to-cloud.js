/**
 * Standalone migration script to copy data from local to cloud database
 * This script can be run independently without starting the backend server
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Local database connection
const localSequelize = new Sequelize(
  process.env.DB_NAME || 'doctime',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// Cloud database connection - use TCP with public IP
// Parse connection string to handle special characters in password
const cloudDbUrl = process.env.CLOUD_DATABASE_URL || 'postgresql://doctime_user:P+4ZlObSHiOmtuqJuyJah0JLT3kOV/t0Qk5OSr0wqfI=@34.27.171.24:5432/doctime';

// Parse the connection string
const urlMatch = cloudDbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/([^?]+)/);
if (!urlMatch) {
  throw new Error('Invalid Cloud Database URL format');
}

const [, username, password, host, port, database] = urlMatch;
const decodedPassword = decodeURIComponent(password);
const dbPort = port ? parseInt(port) : 5432;

const cloudSequelize = new Sequelize(
  database,
  username,
  decodedPassword,
  {
    host: host,
    port: dbPort,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
);

// Define models for local database
const LocalFacility = localSequelize.define('Facility', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, { tableName: 'facilities', timestamps: true });

const LocalPayer = localSequelize.define('Payer', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, { tableName: 'payers', timestamps: true });

const LocalUser = localSequelize.define('User', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  phoneNumber: { type: Sequelize.DataTypes.STRING }
}, { tableName: 'users', timestamps: true });

const LocalTeamMember = localSequelize.define('TeamMember', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  userId: { type: Sequelize.DataTypes.UUID },
  role: { type: Sequelize.DataTypes.STRING },
  otherRole: { type: Sequelize.DataTypes.STRING },
  name: { type: Sequelize.DataTypes.STRING },
  phoneNumber: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, { tableName: 'team_members', timestamps: true });

const LocalProcedure = localSequelize.define('Procedure', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, { tableName: 'procedures', timestamps: true });

LocalTeamMember.belongsTo(LocalUser, { foreignKey: 'userId', as: 'user' });

// Define models for cloud database
const CloudFacility = cloudSequelize.define('Facility', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, { tableName: 'facilities', timestamps: true });

const CloudPayer = cloudSequelize.define('Payer', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, { tableName: 'payers', timestamps: true });

const CloudUser = cloudSequelize.define('User', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  phoneNumber: { type: Sequelize.DataTypes.STRING }
}, { tableName: 'users', timestamps: true });

const CloudTeamMember = cloudSequelize.define('TeamMember', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  userId: { type: Sequelize.DataTypes.UUID },
  role: { type: Sequelize.DataTypes.STRING },
  otherRole: { type: Sequelize.DataTypes.STRING },
  name: { type: Sequelize.DataTypes.STRING },
  phoneNumber: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, { tableName: 'team_members', timestamps: true });

const CloudProcedure = cloudSequelize.define('Procedure', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, { tableName: 'procedures', timestamps: true });

async function migrateFacilities() {
  console.log('\n📋 Migrating Facilities...');
  const localFacilities = await LocalFacility.findAll({ order: [['name', 'ASC']] });
  console.log(`   Found ${localFacilities.length} facilities in local database`);
  
  const cloudFacilities = await CloudFacility.findAll();
  console.log(`   Cloud database currently has ${cloudFacilities.length} facilities`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const localFacility of localFacilities) {
    try {
      const existing = await CloudFacility.findOne({ where: { name: localFacility.name } });
      if (existing) {
        await existing.update({ isSystemDefined: localFacility.isSystemDefined || false });
        skipCount++;
        console.log(`   ⏭️  ${localFacility.name} (already exists)`);
      } else {
        await CloudFacility.create({
          name: localFacility.name,
          isSystemDefined: localFacility.isSystemDefined || false
        });
        successCount++;
        console.log(`   ✅ ${localFacility.name}`);
      }
    } catch (error) {
      console.error(`   ❌ ${localFacility.name}: ${error.message}`);
      errorCount++;
    }
  }
  
  const finalCount = await CloudFacility.count();
  console.log(`   📊 Final count: ${finalCount} facilities in cloud`);
  return { successCount, skipCount, errorCount, total: localFacilities.length };
}

async function migratePayers() {
  console.log('\n📋 Migrating Payers...');
  const localPayers = await LocalPayer.findAll({ order: [['name', 'ASC']] });
  console.log(`   Found ${localPayers.length} payers in local database`);
  
  const cloudPayers = await CloudPayer.findAll();
  console.log(`   Cloud database currently has ${cloudPayers.length} payers`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const localPayer of localPayers) {
    try {
      const existing = await CloudPayer.findOne({ where: { name: localPayer.name } });
      if (existing) {
        await existing.update({ isSystemDefined: localPayer.isSystemDefined || false });
        skipCount++;
        console.log(`   ⏭️  ${localPayer.name} (already exists)`);
      } else {
        await CloudPayer.create({
          name: localPayer.name,
          isSystemDefined: localPayer.isSystemDefined || false
        });
        successCount++;
        console.log(`   ✅ ${localPayer.name}`);
      }
    } catch (error) {
      console.error(`   ❌ ${localPayer.name}: ${error.message}`);
      errorCount++;
    }
  }
  
  const finalCount = await CloudPayer.count();
  console.log(`   📊 Final count: ${finalCount} payers in cloud`);
  return { successCount, skipCount, errorCount, total: localPayers.length };
}

async function migrateTeamMembers() {
  console.log('\n📋 Migrating Team Members...');
  const localTeamMembers = await LocalTeamMember.findAll({
    include: [{
      model: LocalUser,
      as: 'user',
      attributes: ['id', 'phoneNumber']
    }],
    order: [['name', 'ASC']]
  });
  console.log(`   Found ${localTeamMembers.length} team members in local database`);
  
  const cloudTeamMembers = await CloudTeamMember.findAll();
  console.log(`   Cloud database currently has ${cloudTeamMembers.length} team members`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const localMember of localTeamMembers) {
    try {
      let cloudUserId = null;
      
      if (localMember.user && localMember.user.phoneNumber) {
        const cloudUser = await CloudUser.findOne({
          where: { phoneNumber: localMember.user.phoneNumber }
        });
        if (cloudUser) {
          cloudUserId = cloudUser.id;
        }
      }
      
      if (!cloudUserId) {
        const firstCloudUser = await CloudUser.findOne({ order: [['createdAt', 'ASC']] });
        if (firstCloudUser) {
          cloudUserId = firstCloudUser.id;
          console.log(`   ⚠️  Using first available user for ${localMember.name}`);
        } else {
          console.error(`   ❌ No cloud user available for ${localMember.name}`);
          errorCount++;
          continue;
        }
      }
      
      const existing = await CloudTeamMember.findOne({
        where: {
          userId: cloudUserId,
          name: localMember.name,
          role: localMember.role
        }
      });
      
      if (existing) {
        await existing.update({
          otherRole: localMember.otherRole,
          phoneNumber: localMember.phoneNumber,
          isSystemDefined: localMember.isSystemDefined || false
        });
        skipCount++;
        console.log(`   ⏭️  ${localMember.name} (${localMember.role}) (already exists)`);
      } else {
        await CloudTeamMember.create({
          userId: cloudUserId,
          role: localMember.role,
          otherRole: localMember.otherRole,
          name: localMember.name,
          phoneNumber: localMember.phoneNumber,
          isSystemDefined: localMember.isSystemDefined || false
        });
        successCount++;
        console.log(`   ✅ ${localMember.name} (${localMember.role})`);
      }
    } catch (error) {
      console.error(`   ❌ ${localMember.name}: ${error.message}`);
      errorCount++;
    }
  }
  
  const finalCount = await CloudTeamMember.count();
  console.log(`   📊 Final count: ${finalCount} team members in cloud`);
  return { successCount, skipCount, errorCount, total: localTeamMembers.length };
}

async function main() {
  try {
    console.log('🔌 Connecting to databases...');
    await localSequelize.authenticate();
    console.log('✅ Connected to local database');
    
    await cloudSequelize.authenticate();
    console.log('✅ Connected to cloud database');
    
    console.log('\n🚀 Starting migration...\n');
    
async function migrateProcedures() {
  console.log('\n📋 Migrating Procedures...');
  const localProcedures = await LocalProcedure.findAll({ order: [['name', 'ASC']] });
  console.log(`   Found ${localProcedures.length} procedures in local database`);
  
  const cloudProcedures = await CloudProcedure.findAll();
  console.log(`   Cloud database currently has ${cloudProcedures.length} procedures`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const localProcedure of localProcedures) {
    try {
      const existing = await CloudProcedure.findOne({ where: { name: localProcedure.name } });
      if (existing) {
        await existing.update({ isSystemDefined: localProcedure.isSystemDefined || false });
        skipCount++;
        console.log(`   ⏭️  ${localProcedure.name} (already exists)`);
      } else {
        await CloudProcedure.create({
          name: localProcedure.name,
          isSystemDefined: localProcedure.isSystemDefined || false
        });
        successCount++;
        console.log(`   ✅ ${localProcedure.name}`);
      }
    } catch (error) {
      console.error(`   ❌ ${localProcedure.name}: ${error.message}`);
      errorCount++;
    }
  }
  
  const finalCount = await CloudProcedure.count();
  console.log(`   📊 Final count: ${finalCount} procedures in cloud`);
  return { successCount, skipCount, errorCount, total: localProcedures.length };
}

    const facilitiesResult = await migrateFacilities();
    const payersResult = await migratePayers();
    const proceduresResult = await migrateProcedures();
    const teamMembersResult = await migrateTeamMembers();
    
    console.log('\n✅ Migration completed!');
    console.log('\n📊 Summary:');
    console.log(`   Facilities: ${facilitiesResult.successCount} created, ${facilitiesResult.skipCount} skipped, ${facilitiesResult.errorCount} errors`);
    console.log(`   Payers: ${payersResult.successCount} created, ${payersResult.skipCount} skipped, ${payersResult.errorCount} errors`);
    console.log(`   Procedures: ${proceduresResult.successCount} created, ${proceduresResult.skipCount} skipped, ${proceduresResult.errorCount} errors`);
    console.log(`   Team Members: ${teamMembersResult.successCount} created, ${teamMembersResult.skipCount} skipped, ${teamMembersResult.errorCount} errors`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await localSequelize.close();
    await cloudSequelize.close();
  }
}

main();

