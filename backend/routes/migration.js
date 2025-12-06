const express = require('express');
const router = express.Router();
const { TeamMember, Facility, Payer, User, Procedure, Case, CaseTeamMember, CaseProcedure } = require('../models');
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

/**
 * Bulk import cases from CSV data
 * Accepts JSON array of case objects
 */
router.post('/bulk-import-cases', async (req, res) => {
  try {
    const { cases: casesData, userPhoneNumber } = req.body;
    
    if (!casesData || !Array.isArray(casesData)) {
      return res.status(400).json({ error: 'cases must be an array' });
    }
    
    if (!userPhoneNumber) {
      return res.status(400).json({ error: 'userPhoneNumber is required' });
    }
    
    // Convert phone number format if needed
    let phoneNumber = userPhoneNumber.trim();
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '254' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('254')) {
      phoneNumber = '254' + phoneNumber;
    }
    
    // Find user
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      return res.status(404).json({ error: `User with phone number ${userPhoneNumber} (${phoneNumber}) not found` });
    }
    
    // Helper functions
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      }
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };
    
    const parseAge = (ageStr) => {
      if (!ageStr || !ageStr.trim()) return null;
      const age = ageStr.trim().toLowerCase();
      if (age.includes('year') || age.includes('month')) {
        const yearMatch = age.match(/(\d+)\s*year/i);
        const monthMatch = age.match(/(\d+)\s*month/i);
        let totalMonths = 0;
        if (yearMatch) totalMonths += parseInt(yearMatch[1]) * 12;
        if (monthMatch) totalMonths += parseInt(monthMatch[1]);
        return Math.round(totalMonths / 12);
      }
      const num = parseFloat(age);
      return isNaN(num) ? null : Math.round(num);
    };
    
    const parseAmount = (amountStr) => {
      if (!amountStr || !amountStr.trim()) return null;
      const cleaned = amountStr.toString().replace(/,/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    };
    
    const parsePaymentStatus = (paidStr) => {
      if (!paidStr || !paidStr.trim()) return 'Pending';
      const paid = paidStr.trim().toLowerCase();
      if (paid.includes('paid') || paid.includes('cash')) return 'Paid';
      if (paid.includes('pro bono') || paid.includes('probono') || paid.includes('waived')) return 'Pro Bono';
      return 'Pending';
    };
    
    const getCaseStatus = (dateOfProcedure) => {
      if (!dateOfProcedure) return 'Upcoming';
      const procedureDate = new Date(dateOfProcedure);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      procedureDate.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      return procedureDate < endOfToday ? 'Completed' : 'Upcoming';
    };
    
    const results = {
      inserted: 0,
      skipped: 0,
      errors: 0,
      errorDetails: []
    };
    
    // Process each case
    for (let i = 0; i < casesData.length; i++) {
      const row = casesData[i];
      
      try {
        // Parse date
        const dateOfProcedure = parseDate(row['Date of Procedure']);
        if (!dateOfProcedure) {
          throw new Error('Invalid or missing date of procedure');
        }
        
        // Find or create facility
        let facility = null;
        if (row['Facility / Hospital']) {
          const [fac] = await Facility.findOrCreate({
            where: { name: row['Facility / Hospital'].trim() },
            defaults: { name: row['Facility / Hospital'].trim(), isSystemDefined: false }
          });
          facility = fac;
        }
        
        // Find or create payer
        let payer = null;
        if (row['Payer']) {
          const [pay] = await Payer.findOrCreate({
            where: { name: row['Payer'].trim() },
            defaults: { name: row['Payer'].trim(), isSystemDefined: false }
          });
          payer = pay;
        }
        
        // Find or create procedures
        const procedureNames = row['Procedure'] ? row['Procedure'].split(',').map(p => p.trim()).filter(p => p) : [];
        const procedures = [];
        for (const procName of procedureNames) {
          const [proc] = await Procedure.findOrCreate({
            where: { name: procName },
            defaults: { name: procName, isSystemDefined: false }
          });
          procedures.push(proc);
        }
        
        // Find or create team member
        let teamMember = null;
        if (row['Surgeon Name']) {
          const [tm] = await TeamMember.findOrCreate({
            where: {
              userId: user.id,
              name: row['Surgeon Name'].trim()
            },
            defaults: {
              userId: user.id,
              name: row['Surgeon Name'].trim(),
              role: 'Surgeon',
              isSystemDefined: false
            }
          });
          teamMember = tm;
        }
        
        const status = getCaseStatus(dateOfProcedure);
        const isDatePassed = status === 'Completed';
        
        // Create case
        const newCase = await Case.create({
          userId: user.id,
          dateOfProcedure: dateOfProcedure,
          patientName: row['Patient Name'] || 'Unknown',
          inpatientNumber: row['In-patient Number'] || null,
          patientAge: parseAge(row['Patient Age']),
          facilityId: facility?.id || null,
          payerId: payer?.id || null,
          invoiceNumber: row['Invoice Number'] || null,
          procedureId: procedures.length > 0 ? procedures[0].id : null,
          amount: parseAmount(row['Amount (without a comma)']),
          paymentStatus: parsePaymentStatus(row['Paid']),
          additionalNotes: row['Additional Notes/Comments'] || null,
          status: status,
          isAutoCompleted: isDatePassed,
          completedAt: isDatePassed ? dateOfProcedure : null
        });
        
        // Add procedures
        for (const procedure of procedures) {
          await CaseProcedure.create({
            caseId: newCase.id,
            procedureId: procedure.id
          });
        }
        
        // Add team member
        if (teamMember) {
          await CaseTeamMember.create({
            caseId: newCase.id,
            teamMemberId: teamMember.id
          });
        }
        
        results.inserted++;
      } catch (error) {
        results.errors++;
        results.errorDetails.push({
          row: i + 1,
          patientName: row['Patient Name'] || 'Unknown',
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Bulk case import completed',
      results
    });
  } catch (error) {
    console.error('Bulk case import error:', error);
    res.status(500).json({ error: 'Bulk case import failed', message: error.message });
  }
});

module.exports = router;

