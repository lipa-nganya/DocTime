/**
 * Script to verify what data actually exists in the cloud database
 * This connects directly to Cloud SQL to check the actual data
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Cloud SQL connection details
const CLOUD_DB_URL = process.env.CLOUD_DATABASE_URL || process.env.DATABASE_URL;

if (!CLOUD_DB_URL) {
  console.error('❌ Error: CLOUD_DATABASE_URL or DATABASE_URL not set');
  process.exit(1);
}

// Parse connection string for Unix socket format
let sequelize;
if (CLOUD_DB_URL.includes('@/') && CLOUD_DB_URL.includes('host=/cloudsql/')) {
  // Unix socket format - convert to TCP for local connection
  const match = CLOUD_DB_URL.match(/postgresql:\/\/([^:]+):([^@]+)@\/([^?]+)/);
  if (match) {
    const [, username, password, database] = match;
    // Use TCP connection with public IP
    sequelize = new Sequelize(
      database,
      username,
      password,
      {
        host: '34.27.171.24',
        port: 5432,
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
  }
} else {
  // TCP format
  const match = CLOUD_DB_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/([^?]+)/);
  if (match) {
    const [, username, password, host, port, database] = match;
    sequelize = new Sequelize(
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
          }
        },
        logging: false
      }
    );
  }
}

// Define models
const Facility = sequelize.define('Facility', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, { tableName: 'facilities', timestamps: true });

const Payer = sequelize.define('Payer', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  name: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, { tableName: 'payers', timestamps: true });

const TeamMember = sequelize.define('TeamMember', {
  id: { type: Sequelize.DataTypes.UUID, primaryKey: true },
  userId: { type: Sequelize.DataTypes.UUID },
  role: { type: Sequelize.DataTypes.STRING },
  otherRole: { type: Sequelize.DataTypes.STRING },
  name: { type: Sequelize.DataTypes.STRING },
  phoneNumber: { type: Sequelize.DataTypes.STRING },
  isSystemDefined: { type: Sequelize.DataTypes.BOOLEAN }
}, { tableName: 'team_members', timestamps: true });

async function verifyData() {
  try {
    console.log('🔌 Connecting to cloud database...');
    await sequelize.authenticate();
    console.log('✅ Connected to cloud database\n');
    
    // Check facilities
    const facilities = await Facility.findAll({ order: [['name', 'ASC']] });
    console.log(`📋 Facilities (${facilities.length}):`);
    if (facilities.length === 0) {
      console.log('   ⚠️  No facilities found!');
    } else {
      facilities.forEach(f => console.log(`   - ${f.name}${f.isSystemDefined ? ' (system)' : ''}`));
    }
    
    // Check payers
    const payers = await Payer.findAll({ order: [['name', 'ASC']] });
    console.log(`\n📋 Payers (${payers.length}):`);
    if (payers.length === 0) {
      console.log('   ⚠️  No payers found!');
    } else {
      payers.forEach(p => console.log(`   - ${p.name}${p.isSystemDefined ? ' (system)' : ''}`));
    }
    
    // Check team members
    const teamMembers = await TeamMember.findAll({ order: [['name', 'ASC']] });
    console.log(`\n📋 Team Members (${teamMembers.length}):`);
    if (teamMembers.length === 0) {
      console.log('   ⚠️  No team members found!');
    } else {
      teamMembers.forEach(tm => console.log(`   - ${tm.name} (${tm.role})${tm.otherRole ? ` - ${tm.otherRole}` : ''}`));
    }
    
    console.log('\n✅ Verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

verifyData();

