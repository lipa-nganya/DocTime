const { sequelize } = require('./models');
const { Facility } = require('./models');

const facilities = [
  'Coptic',
  'Nairobi Hospital',
  'Mater',
  'Gertrudes',
  'Karen Hospital',
  'MP Shah',
  'KNH'
];

async function seedFacilities() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🌱 Seeding facilities...');
    
    for (const facilityName of facilities) {
      const [facility, created] = await Facility.findOrCreate({
        where: { name: facilityName },
        defaults: { name: facilityName, isSystemDefined: true }
      });
      
      if (created) {
        console.log(`✅ Created: ${facilityName}`);
      } else {
        console.log(`⏭️  Already exists: ${facilityName}`);
      }
    }

    console.log('✅ Facilities seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding facilities:', error);
    process.exit(1);
  }
}

seedFacilities();

