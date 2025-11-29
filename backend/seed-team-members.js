const { sequelize } = require('./models');
const { TeamMember, User } = require('./models');

// Get the first user as the owner (or create a system user)
async function getSystemUser() {
  let user = await User.findOne();
  if (!user) {
    // Create a system user for team members
    user = await User.create({
      phoneNumber: '254700000000',
      pinHash: '$2a$10$dummyhash',
      role: 'Surgeon',
      isVerified: true
    });
  }
  return user;
}

const teamMembers = [
  { name: 'Dr Muhinga', role: 'Surgeon' },
  { name: 'Dr. Mutie', role: 'Surgeon' },
  { name: 'Cath Lab', role: 'Other', otherRole: 'Cath Lab' },
  { name: 'Dr Oburu', role: 'Surgeon' },
  { name: 'Dr John Bosco', role: 'Surgeon' },
  { name: 'Dr Ayo', role: 'Surgeon' },
  { name: 'Dr Dindi', role: 'Surgeon' },
  { name: 'Mater Cardiac Team', role: 'Other', otherRole: 'Cardiac Team' },
  { name: 'Dr Mwai', role: 'Surgeon' },
  { name: 'Dr Njihia', role: 'Surgeon' },
  { name: 'Dr Aketch', role: 'Surgeon' },
  { name: 'Prof Joey', role: 'Surgeon' },
  { name: 'Dr Makori', role: 'Surgeon' },
  { name: 'Dr Kiptoon', role: 'Surgeon' },
  { name: 'Dr Nderitu', role: 'Surgeon' },
  { name: 'Dr Kipingor', role: 'Surgeon' }
];

async function seedTeamMembers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    const systemUser = await getSystemUser();
    console.log(`✅ Using system user: ${systemUser.phoneNumber}`);

    console.log('🌱 Seeding team members...');
    
    for (const memberData of teamMembers) {
      const [member, created] = await TeamMember.findOrCreate({
        where: { 
          name: memberData.name,
          userId: systemUser.id
        },
        defaults: { 
          ...memberData,
          userId: systemUser.id,
          isSystemDefined: true
        }
      });
      
      if (created) {
        console.log(`✅ Created: ${memberData.name} (${memberData.role})`);
      } else {
        console.log(`⏭️  Already exists: ${memberData.name}`);
      }
    }

    console.log('✅ Team members seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding team members:', error);
    process.exit(1);
  }
}

seedTeamMembers();

