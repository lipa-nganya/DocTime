const { sequelize } = require('./models');
const { Payer } = require('./models');

const payers = [
  'Jubilee',
  'AoN',
  'KHA',
  'Mater',
  'Gertrudes',
  'MP Shah',
  'Karen',
  'GA',
  'Minet',
  'APA',
  'CIC',
  'KNH',
  'Coptic'
];

async function seedPayers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🌱 Seeding payers...');
    
    for (const payerName of payers) {
      const [payer, created] = await Payer.findOrCreate({
        where: { name: payerName },
        defaults: { name: payerName, isSystemDefined: true }
      });
      
      if (created) {
        console.log(`✅ Created: ${payerName}`);
      } else {
        console.log(`⏭️  Already exists: ${payerName}`);
      }
    }

    console.log('✅ Payers seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding payers:', error);
    process.exit(1);
  }
}

seedPayers();

