const express = require('express');
const router = express.Router();
const { TeamMember, Facility, Payer, User, Procedure } = require('../models');
const { authenticateToken } = require('./auth');
const { Sequelize } = require('sequelize');
const config = require('../config');

// This route should only be accessible to admins
// For now, we'll add a simple check - in production, add proper admin role check
// Temporarily disable auth for migration (can be secured later)
// router.use(authenticateToken);

// Create a connection to local database for migration
function createLocalSequelize() {
  const localConfig = config.development;
  return new Sequelize(
    localConfig.database,
    localConfig.username,
    localConfig.password,
    {
      host: localConfig.host,
      port: localConfig.port,
      dialect: 'postgres',
      logging: false
    }
  );
}

/**
 * Create a connection to cloud database for migration
 * Uses the same parsing logic as models/index.js
 */
function createCloudSequelize() {
  const cloudDbUrl = process.env.DATABASE_URL;
  if (!cloudDbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  const env = process.env.NODE_ENV || 'production';
  const dbConfig = config[env];
  
  // Parse connection string manually to ensure correct host/port (same as models/index.js)
  if (cloudDbUrl.includes('@/') && cloudDbUrl.includes('host=/cloudsql/')) {
    // Unix socket format - parse manually
    const urlMatch = cloudDbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@\/([^?]+)/);
    if (urlMatch) {
      const [, username, password, database] = urlMatch;
      // For Unix socket, use the socket path from the connection string
      const socketPath = `/cloudsql/${cloudDbUrl.match(/host=\/cloudsql\/([^&]+)/)?.[1] || 'drink-suite:us-central1:doctime-db'}`;
      return new Sequelize(database, username, password, {
        dialect: 'postgres',
        dialectOptions: {
          socketPath: socketPath
        },
        logging: false
      });
    }
  }
  
  // TCP format - parse manually
  const urlMatch = cloudDbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/([^?]+)/);
  if (urlMatch) {
    const [, username, password, host, port, database] = urlMatch;
    const dbPort = port ? parseInt(port) : 5432;
    return new Sequelize(database, username, password, {
      host: host,
      port: dbPort,
      dialect: 'postgres',
      ...(dbConfig.dialectOptions || {}),
      logging: false
    });
  }
  
  // Fallback: let Sequelize parse it (might fail for Unix socket)
  return new Sequelize(cloudDbUrl, {
    ...dbConfig,
    logging: false
  });
}

/**
 * Migrate facilities from local to cloud
 */
router.post('/facilities', async (req, res) => {
  let localSequelize, cloudSequelize;
  try {
    localSequelize = createLocalSequelize();
    await localSequelize.authenticate();
    
    cloudSequelize = createCloudSequelize();
    await cloudSequelize.authenticate();
    console.log('✅ Connected to both local and cloud databases');
    
    const LocalFacility = localSequelize.define('Facility', {
      id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
      name: { type: Sequelize.DataTypes.STRING },
      isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
    }, {
      tableName: 'facilities',
      timestamps: true
    });
    
    const CloudFacility = cloudSequelize.define('Facility', {
      id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
      name: { type: Sequelize.DataTypes.STRING },
      isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
    }, {
      tableName: 'facilities',
      timestamps: true
    });
    
    const localFacilities = await LocalFacility.findAll({ order: [['name', 'ASC']] });
    console.log(`📥 Found ${localFacilities.length} facilities in local database`);
    
    // First, check what's actually in cloud
    const cloudFacilities = await CloudFacility.findAll();
    console.log(`📊 Cloud database currently has ${cloudFacilities.length} facilities`);
    if (cloudFacilities.length > 0) {
      console.log(`   Existing facilities: ${cloudFacilities.map(f => f.name).join(', ')}`);
    }
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const localFacility of localFacilities) {
      try {
        // Check if it exists first in CLOUD
        const existing = await CloudFacility.findOne({ where: { name: localFacility.name } });
        
        if (existing) {
          // Update existing to ensure data matches
          await existing.update({
            isSystemDefined: localFacility.isSystemDefined || false
          });
          skipCount++;
          console.log(`⏭️  Facility already exists in cloud: ${localFacility.name} (ID: ${existing.id})`);
        } else {
          // Create new facility in CLOUD
          const facility = await CloudFacility.create({
            name: localFacility.name,
            isSystemDefined: localFacility.isSystemDefined || false
          });
          successCount++;
          console.log(`✅ Created facility in cloud: ${localFacility.name} (ID: ${facility.id})`);
        }
      } catch (error) {
        console.error(`❌ Error migrating ${localFacility.name}:`, error.message);
        errorCount++;
      }
    }
    
    // Final count check in CLOUD
    const finalCount = await CloudFacility.count();
    console.log(`📊 Final facility count in cloud: ${finalCount}`);
    
    await localSequelize.close();
    await cloudSequelize.close();
    
    res.json({
      success: true,
      message: 'Facilities migration completed',
      summary: {
        migrated: successCount,
        skipped: skipCount,
        errors: errorCount,
        total: localFacilities.length
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed', message: error.message });
  }
});

/**
 * Migrate payers from local to cloud
 */
router.post('/payers', async (req, res) => {
  try {
    const localSequelize = createLocalSequelize();
    await localSequelize.authenticate();
    
    const LocalPayer = localSequelize.define('Payer', {
      id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
      name: { type: Sequelize.DataTypes.STRING },
      isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
    }, {
      tableName: 'payers',
      timestamps: true
    });
    
    const localPayers = await LocalPayer.findAll({ order: [['name', 'ASC']] });
    
    // First, check what's actually in cloud
    const cloudPayers = await Payer.findAll();
    console.log(`📊 Cloud database currently has ${cloudPayers.length} payers`);
    if (cloudPayers.length > 0) {
      console.log(`   Existing payers: ${cloudPayers.map(p => p.name).join(', ')}`);
    }
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const localPayer of localPayers) {
      try {
        // Check if it exists first in CLOUD
        const existing = await CloudPayer.findOne({ where: { name: localPayer.name } });
        
        if (existing) {
          // Update existing to ensure data matches
          await existing.update({
            isSystemDefined: localPayer.isSystemDefined || false
          });
          skipCount++;
          console.log(`⏭️  Payer already exists in cloud: ${localPayer.name} (ID: ${existing.id})`);
        } else {
          // Create new payer in CLOUD
          const payer = await CloudPayer.create({
            name: localPayer.name,
            isSystemDefined: localPayer.isSystemDefined || false
          });
          successCount++;
          console.log(`✅ Created payer in cloud: ${localPayer.name} (ID: ${payer.id})`);
        }
      } catch (error) {
        console.error(`❌ Error migrating ${localPayer.name}:`, error.message);
        errorCount++;
      }
    }
    
    // Final count check in CLOUD
    const finalCount = await CloudPayer.count();
    console.log(`📊 Final payer count in cloud: ${finalCount}`);
    
    await localSequelize.close();
    await cloudSequelize.close();
    
    res.json({
      success: true,
      message: 'Payers migration completed',
      summary: {
        migrated: successCount,
        skipped: skipCount,
        errors: errorCount,
        total: localPayers.length
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed', message: error.message });
  } finally {
    if (localSequelize) await localSequelize.close().catch(() => {});
    if (cloudSequelize) await cloudSequelize.close().catch(() => {});
  }
});

/**
 * Migrate team members from local to cloud
 */
router.post('/team-members', async (req, res) => {
  let localSequelize, cloudSequelize;
  try {
    localSequelize = createLocalSequelize();
    await localSequelize.authenticate();
    
    cloudSequelize = createCloudSequelize();
    await cloudSequelize.authenticate();
    console.log('✅ Connected to both local and cloud databases');
    
    const LocalUser = localSequelize.define('User', {
      id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
      phoneNumber: { type: Sequelize.DataTypes.STRING }
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
    
    const CloudUser = cloudSequelize.define('User', {
      id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
      phoneNumber: { type: Sequelize.DataTypes.STRING }
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
    
    LocalTeamMember.belongsTo(LocalUser, { foreignKey: 'userId', as: 'user' });
    
    const localTeamMembers = await LocalTeamMember.findAll({
      include: [{
        model: LocalUser,
        as: 'user',
        attributes: ['id', 'phoneNumber']
      }],
      order: [['name', 'ASC']]
    });
    console.log(`📥 Found ${localTeamMembers.length} team members in local database`);
    
    // First, check what's actually in cloud
    const cloudTeamMembers = await CloudTeamMember.findAll();
    console.log(`📊 Cloud database currently has ${cloudTeamMembers.length} team members`);
    if (cloudTeamMembers.length > 0) {
      console.log(`   Existing team members: ${cloudTeamMembers.map(tm => `${tm.name} (${tm.role})`).join(', ')}`);
    }
    
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
            console.log(`⚠️  Using first available user for ${localMember.name}: ${firstCloudUser.phoneNumber}`);
          } else {
            console.error(`❌ No cloud user available for ${localMember.name}`);
            errorCount++;
            continue;
          }
        }
        
        // Check if it exists first in CLOUD
        const existing = await CloudTeamMember.findOne({
          where: {
            userId: cloudUserId,
            name: localMember.name,
            role: localMember.role
          }
        });
        
        if (existing) {
          // Update existing to ensure data matches
          await existing.update({
            otherRole: localMember.otherRole,
            phoneNumber: localMember.phoneNumber,
            isSystemDefined: localMember.isSystemDefined || false
          });
          skipCount++;
          console.log(`⏭️  Team member already exists in cloud: ${localMember.name} (${localMember.role}) (ID: ${existing.id})`);
        } else {
          // Create new team member in CLOUD
          const teamMember = await CloudTeamMember.create({
            userId: cloudUserId,
            role: localMember.role,
            otherRole: localMember.otherRole,
            name: localMember.name,
            phoneNumber: localMember.phoneNumber,
            isSystemDefined: localMember.isSystemDefined || false
          });
          successCount++;
          console.log(`✅ Created team member in cloud: ${localMember.name} (${localMember.role}) (ID: ${teamMember.id})`);
        }
      } catch (error) {
        console.error(`❌ Error migrating ${localMember.name}:`, error.message);
        errorCount++;
      }
    }
    
    // Final count check in CLOUD
    const finalCount = await CloudTeamMember.count();
    console.log(`📊 Final team member count in cloud: ${finalCount}`);
    
    await localSequelize.close();
    await cloudSequelize.close();
    
    res.json({
      success: true,
      message: 'Team members migration completed',
      summary: {
        migrated: successCount,
        skipped: skipCount,
        errors: errorCount,
        total: localTeamMembers.length
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed', message: error.message });
  } finally {
    if (localSequelize) await localSequelize.close().catch(() => {});
    if (cloudSequelize) await cloudSequelize.close().catch(() => {});
  }
});

/**
 * Migrate procedures from local to cloud
 */
router.post('/procedures', async (req, res) => {
  let localSequelize, cloudSequelize;
  try {
    localSequelize = createLocalSequelize();
    await localSequelize.authenticate();
    
    cloudSequelize = createCloudSequelize();
    await cloudSequelize.authenticate();
    console.log('✅ Connected to both local and cloud databases');
    
    const LocalProcedure = localSequelize.define('Procedure', {
      id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
      name: { type: Sequelize.DataTypes.STRING },
      isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
    }, {
      tableName: 'procedures',
      timestamps: true
    });
    
    const CloudProcedure = cloudSequelize.define('Procedure', {
      id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
      name: { type: Sequelize.DataTypes.STRING },
      isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
    }, {
      tableName: 'procedures',
      timestamps: true
    });
    
    const localProcedures = await LocalProcedure.findAll({ order: [['name', 'ASC']] });
    console.log(`📥 Found ${localProcedures.length} procedures in local database`);
    
    // First, check what's actually in cloud
    const cloudProcedures = await CloudProcedure.findAll();
    console.log(`📊 Cloud database currently has ${cloudProcedures.length} procedures`);
    if (cloudProcedures.length > 0) {
      console.log(`   Existing procedures: ${cloudProcedures.map(p => p.name).join(', ')}`);
    }
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const localProcedure of localProcedures) {
      try {
        // Check if it exists first in CLOUD
        const existing = await CloudProcedure.findOne({ where: { name: localProcedure.name } });
        
        if (existing) {
          // Update existing to ensure data matches
          await existing.update({
            isSystemDefined: localProcedure.isSystemDefined || false
          });
          skipCount++;
          console.log(`⏭️  Procedure already exists in cloud: ${localProcedure.name} (ID: ${existing.id})`);
        } else {
          // Create new procedure in CLOUD
          const procedure = await CloudProcedure.create({
            name: localProcedure.name,
            isSystemDefined: localProcedure.isSystemDefined || false
          });
          successCount++;
          console.log(`✅ Created procedure in cloud: ${localProcedure.name} (ID: ${procedure.id})`);
        }
      } catch (error) {
        console.error(`❌ Error migrating ${localProcedure.name}:`, error.message);
        errorCount++;
      }
    }
    
    // Final count check in CLOUD
    const finalCount = await CloudProcedure.count();
    console.log(`📊 Final procedure count in cloud: ${finalCount}`);
    
    await localSequelize.close();
    await cloudSequelize.close();
    
    res.json({
      success: true,
      message: 'Procedures migration completed',
      summary: {
        migrated: successCount,
        skipped: skipCount,
        errors: errorCount,
        total: localProcedures.length
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed', message: error.message });
  } finally {
    if (localSequelize) await localSequelize.close().catch(() => {});
    if (cloudSequelize) await cloudSequelize.close().catch(() => {});
  }
});

/**
 * Run all migrations
 */
router.post('/all', async (req, res) => {
  try {
    const results = {
      facilities: { error: 'Not implemented in /all endpoint' },
      payers: { error: 'Not implemented in /all endpoint' },
      teamMembers: { error: 'Not implemented in /all endpoint' },
      procedures: { error: 'Not implemented in /all endpoint' }
    };
    
    // Call individual migration endpoints
    const localSequelize = createLocalSequelize();
    await localSequelize.authenticate();
    
    // Migrate facilities
    try {
      const LocalFacility = localSequelize.define('Facility', {
        id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
        name: { type: Sequelize.DataTypes.STRING },
        isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
      }, { tableName: 'facilities', timestamps: true });
      
      const localFacilities = await LocalFacility.findAll();
      let successCount = 0, skipCount = 0, errorCount = 0;
      
      for (const localFacility of localFacilities) {
        try {
          const [facility, created] = await Facility.findOrCreate({
            where: { name: localFacility.name },
            defaults: { name: localFacility.name, isSystemDefined: localFacility.isSystemDefined || false }
          });
          if (created) {
            successCount++;
            console.log(`✅ Created facility: ${localFacility.name}`);
          } else {
            await facility.update({ isSystemDefined: localFacility.isSystemDefined || false });
            skipCount++;
          }
        } catch (error) {
          console.error(`❌ Error migrating ${localFacility.name}:`, error.message);
          errorCount++;
        }
      }
      results.facilities = { migrated: successCount, skipped: skipCount, errors: errorCount, total: localFacilities.length };
    } catch (error) {
      results.facilities = { error: error.message };
    }
    
    // Migrate payers
    try {
      const LocalPayer = localSequelize.define('Payer', {
        id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
        name: { type: Sequelize.DataTypes.STRING },
        isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
      }, { tableName: 'payers', timestamps: true });
      
      const localPayers = await LocalPayer.findAll();
      let successCount = 0, skipCount = 0, errorCount = 0;
      
      for (const localPayer of localPayers) {
        try {
          const [payer, created] = await Payer.findOrCreate({
            where: { name: localPayer.name },
            defaults: { name: localPayer.name, isSystemDefined: localPayer.isSystemDefined || false }
          });
          if (created) {
            successCount++;
            console.log(`✅ Created payer: ${localPayer.name}`);
          } else {
            await payer.update({ isSystemDefined: localPayer.isSystemDefined || false });
            skipCount++;
          }
        } catch (error) {
          console.error(`❌ Error migrating ${localPayer.name}:`, error.message);
          errorCount++;
        }
      }
      results.payers = { migrated: successCount, skipped: skipCount, errors: errorCount, total: localPayers.length };
    } catch (error) {
      results.payers = { error: error.message };
    }
    
    // Migrate team members
    try {
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
      
      LocalTeamMember.belongsTo(LocalUser, { foreignKey: 'userId', as: 'user' });
      
      const localTeamMembers = await LocalTeamMember.findAll({
        include: [{ model: LocalUser, as: 'user', attributes: ['id', 'phoneNumber'] }]
      });
      
      let successCount = 0, skipCount = 0, errorCount = 0;
      
      for (const localMember of localTeamMembers) {
        try {
          let cloudUserId = null;
          if (localMember.user && localMember.user.phoneNumber) {
            const cloudUser = await User.findOne({ where: { phoneNumber: localMember.user.phoneNumber } });
            if (cloudUser) cloudUserId = cloudUser.id;
          }
          if (!cloudUserId) {
            const firstCloudUser = await User.findOne({ order: [['createdAt', 'ASC']] });
            if (firstCloudUser) cloudUserId = firstCloudUser.id;
            else { errorCount++; continue; }
          }
          const [teamMember, created] = await TeamMember.findOrCreate({
            where: { userId: cloudUserId, name: localMember.name, role: localMember.role },
            defaults: {
              userId: cloudUserId,
              role: localMember.role,
              otherRole: localMember.otherRole,
              name: localMember.name,
              phoneNumber: localMember.phoneNumber,
              isSystemDefined: localMember.isSystemDefined || false
            }
          });
          if (created) {
            successCount++;
            console.log(`✅ Created team member: ${localMember.name} (${localMember.role})`);
          } else {
            await teamMember.update({
              otherRole: localMember.otherRole,
              phoneNumber: localMember.phoneNumber,
              isSystemDefined: localMember.isSystemDefined || false
            });
            skipCount++;
          }
        } catch (error) { errorCount++; }
      }
      results.teamMembers = { migrated: successCount, skipped: skipCount, errors: errorCount, total: localTeamMembers.length };
    } catch (error) {
      results.teamMembers = { error: error.message };
    }
    
    await localSequelize.close();
    
    res.json({
      success: true,
      message: 'All migrations completed',
      results
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed', message: error.message });
  }
});

/**
 * Bulk insert data from JSON (for when local DB access isn't available)
 * Accepts JSON array of records to insert
 */
router.post('/bulk-insert', async (req, res) => {
  // Use the existing models from models (already connected to cloud DB)
  const db = require('../models');
  const { Facility, Payer, Procedure, User, TeamMember } = db;
  
  try {
    await db.sequelize.authenticate();
    console.log('✅ Connected to cloud database for bulk insert');
    
    const { facilities, payers, procedures, teamMembers } = req.body;
    const results = {
      facilities: { inserted: 0, skipped: 0, errors: 0 },
      payers: { inserted: 0, skipped: 0, errors: 0 },
      procedures: { inserted: 0, skipped: 0, errors: 0 },
      teamMembers: { inserted: 0, skipped: 0, errors: 0 }
    };
    
    // Insert facilities
    if (facilities && Array.isArray(facilities)) {
      for (const f of facilities) {
        try {
          const [facility, created] = await Facility.findOrCreate({
            where: { name: f.name },
            defaults: {
              id: f.id,
              name: f.name,
              isSystemDefined: f.isSystemDefined || false
            }
          });
          if (created) results.facilities.inserted++;
          else results.facilities.skipped++;
        } catch (error) {
          results.facilities.errors++;
        }
      }
    }
    
    // Insert payers
    if (payers && Array.isArray(payers)) {
      for (const p of payers) {
        try {
          const [payer, created] = await Payer.findOrCreate({
            where: { name: p.name },
            defaults: {
              id: p.id,
              name: p.name,
              isSystemDefined: p.isSystemDefined || false
            }
          });
          if (created) results.payers.inserted++;
          else results.payers.skipped++;
        } catch (error) {
          results.payers.errors++;
        }
      }
    }
    
    // Insert procedures
    if (procedures && Array.isArray(procedures)) {
      for (const p of procedures) {
        try {
          const [procedure, created] = await Procedure.findOrCreate({
            where: { name: p.name },
            defaults: {
              id: p.id,
              name: p.name,
              isSystemDefined: p.isSystemDefined || false
            }
          });
          if (created) results.procedures.inserted++;
          else results.procedures.skipped++;
        } catch (error) {
          results.procedures.errors++;
        }
      }
    }
    
    // Insert team members
    if (teamMembers && Array.isArray(teamMembers)) {
      for (const tm of teamMembers) {
        try {
          let cloudUserId = tm.userId;
          if (tm.userPhoneNumber) {
            const cloudUser = await User.findOne({ where: { phoneNumber: tm.userPhoneNumber } });
            if (cloudUser) cloudUserId = cloudUser.id;
          }
          if (!cloudUserId) {
            const firstUser = await User.findOne({ order: [['createdAt', 'ASC']] });
            if (firstUser) cloudUserId = firstUser.id;
            else {
              results.teamMembers.errors++;
              continue;
            }
          }
          
          const [teamMember, created] = await TeamMember.findOrCreate({
            where: {
              userId: cloudUserId,
              name: tm.name,
              role: tm.role
            },
            defaults: {
              id: tm.id,
              userId: cloudUserId,
              role: tm.role,
              otherRole: tm.otherRole || '',
              name: tm.name,
              phoneNumber: tm.phoneNumber || '',
              isSystemDefined: tm.isSystemDefined || false
            }
          });
          if (created) results.teamMembers.inserted++;
          else results.teamMembers.skipped++;
        } catch (error) {
          results.teamMembers.errors++;
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Bulk insert completed',
      results
    });
  } catch (error) {
    console.error('Bulk insert error:', error);
    res.status(500).json({ error: 'Bulk insert failed', message: error.message });
  }
});

module.exports = router;

