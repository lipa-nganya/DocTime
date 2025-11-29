const { sequelize } = require('./models');
const { Procedure } = require('./models');

const procedures = [
  'ASD',
  'VSD',
  'MVR',
  'AVR',
  'DVR',
  'Oesophagectomy',
  'Gastrectomy',
  'CBT',
  'Chemoport Insertion',
  'Chemoport Removal',
  'AV Fistula',
  'Laser Varicose Veins',
  'PDA',
  'Thoracotomy',
  'Thoracotomy + Decortication',
  'Thoracotomy + Lobectomy',
  'Thoracotomy + Pneumonectomy',
  'Diagnostic VATS',
  'Diaphragmatic Hernia Repair',
  'Nissen\'s Fundoplication',
  'AAA repair',
  'AKA',
  'BKA',
  'Relook',
  'Varicose Veins',
  'Other'
];

async function seedProcedures() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🌱 Seeding procedures...');
    
    for (const procedureName of procedures) {
      const [procedure, created] = await Procedure.findOrCreate({
        where: { name: procedureName },
        defaults: { name: procedureName, isSystemDefined: true }
      });
      
      if (created) {
        console.log(`✅ Created: ${procedureName}`);
      } else {
        console.log(`⏭️  Already exists: ${procedureName}`);
      }
    }

    console.log('✅ Procedures seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding procedures:', error);
    process.exit(1);
  }
}

seedProcedures();

