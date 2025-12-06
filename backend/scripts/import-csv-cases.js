const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Use the models/index.js which handles all the setup
const db = require('../models');
const { User, Case, Facility, Payer, Procedure, TeamMember, CaseTeamMember, CaseProcedure } = db;

// Helper function to parse date (handles M/D/YYYY format)
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle M/D/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0]) - 1; // Month is 0-indexed
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  
  // Try standard date parsing
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// Helper function to parse age (handles various formats)
function parseAge(ageStr) {
  if (!ageStr || ageStr.trim() === '') return null;
  
  const age = ageStr.trim().toLowerCase();
  
  // Handle "X years", "X months", "X year X months"
  if (age.includes('year') || age.includes('month')) {
    const yearMatch = age.match(/(\d+)\s*year/i);
    const monthMatch = age.match(/(\d+)\s*month/i);
    
    let totalMonths = 0;
    if (yearMatch) totalMonths += parseInt(yearMatch[1]) * 12;
    if (monthMatch) totalMonths += parseInt(monthMatch[1]);
    
    // Convert to years (approximate)
    return Math.round(totalMonths / 12);
  }
  
  // Try to parse as number
  const num = parseFloat(age);
  return isNaN(num) ? null : Math.round(num);
}

// Helper function to parse amount
function parseAmount(amountStr) {
  if (!amountStr || amountStr.trim() === '') return null;
  
  // Remove commas and parse
  const cleaned = amountStr.toString().replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Helper function to determine payment status
function parsePaymentStatus(paidStr) {
  if (!paidStr || paidStr.trim() === '') return 'Pending';
  
  const paid = paidStr.trim().toLowerCase();
  
  if (paid.includes('paid') || paid.includes('cash')) {
    return 'Paid';
  }
  if (paid.includes('pro bono') || paid.includes('probono') || paid.includes('waived')) {
    return 'Pro Bono';
  }
  
  return 'Pending';
}

// Helper function to determine case status based on date
function getCaseStatus(dateOfProcedure) {
  if (!dateOfProcedure) return 'Upcoming';
  
  const procedureDate = new Date(dateOfProcedure);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  procedureDate.setHours(0, 0, 0, 0);
  
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  
  return procedureDate < endOfToday ? 'Completed' : 'Upcoming';
}

// Helper function to find or create facility
async function findOrCreateFacility(name) {
  if (!name || name.trim() === '') return null;
  
  const cleanName = name.trim();
  const [facility] = await Facility.findOrCreate({
    where: { name: cleanName },
    defaults: { name: cleanName, isSystemDefined: false }
  });
  
  return facility;
}

// Helper function to find or create payer
async function findOrCreatePayer(name) {
  if (!name || name.trim() === '') return null;
  
  const cleanName = name.trim();
  const [payer] = await Payer.findOrCreate({
    where: { name: cleanName },
    defaults: { name: cleanName, isSystemDefined: false }
  });
  
  return payer;
}

// Helper function to find or create procedures (can be multiple, comma-separated)
async function findOrCreateProcedures(procedureStr) {
  if (!procedureStr || procedureStr.trim() === '') return [];
  
  const procedures = procedureStr.split(',').map(p => p.trim()).filter(p => p);
  const procedureRecords = [];
  
  for (const procName of procedures) {
    const [procedure] = await Procedure.findOrCreate({
      where: { name: procName },
      defaults: { name: procName, isSystemDefined: false }
    });
    procedureRecords.push(procedure);
  }
  
  return procedureRecords;
}

// Helper function to find or create team member
async function findOrCreateTeamMember(name, userId) {
  if (!name || name.trim() === '') return null;
  
  const cleanName = name.trim();
  const [teamMember] = await TeamMember.findOrCreate({
    where: {
      userId: userId,
      name: cleanName
    },
    defaults: {
      userId: userId,
      name: cleanName,
      role: 'Surgeon',
      isSystemDefined: false
    }
  });
  
  return teamMember;
}

// Main import function
async function importCases(csvFilePath, userPhoneNumber) {
  try {
    console.log('🔌 Connecting to database...');
    await db.sequelize.authenticate();
    console.log('✅ Connected to database');
    
    // Find user (convert phone number format if needed)
    console.log(`\n🔍 Finding user with phone number: ${userPhoneNumber}...`);
    
    // Convert local format (0727893741) to international format (254727893741)
    let phoneNumber = userPhoneNumber.trim();
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '254' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('254')) {
      phoneNumber = '254' + phoneNumber;
    }
    
    const user = await User.findOne({ where: { phoneNumber: phoneNumber } });
    
    if (!user) {
      throw new Error(`User with phone number ${userPhoneNumber} (${phoneNumber}) not found`);
    }
    
    console.log(`✅ Found user: ${user.phoneNumber} (ID: ${user.id})`);
    
    // Read and parse CSV
    console.log(`\n📖 Reading CSV file: ${csvFilePath}...`);
    const cases = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          cases.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`✅ Found ${cases.length} cases in CSV`);
    
    // Process each case
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < cases.length; i++) {
      const row = cases[i];
      const rowNum = i + 2; // +2 because CSV has header and is 1-indexed
      
      try {
        console.log(`\n📝 Processing row ${rowNum}/${cases.length}: ${row['Patient Name'] || 'Unknown'}`);
        
        // Parse date
        const dateOfProcedure = parseDate(row['Date of Procedure']);
        if (!dateOfProcedure) {
          throw new Error('Invalid or missing date of procedure');
        }
        
        // Parse patient age
        const patientAge = parseAge(row['Patient Age']);
        
        // Parse amount
        const amount = parseAmount(row['Amount (without a comma)']);
        
        // Parse payment status
        const paymentStatus = parsePaymentStatus(row['Paid']);
        
        // Determine case status
        const status = getCaseStatus(dateOfProcedure);
        const isDatePassed = status === 'Completed';
        
        // Find or create facility
        let facility = null;
        if (row['Facility / Hospital']) {
          facility = await findOrCreateFacility(row['Facility / Hospital']);
        }
        
        // Find or create payer
        let payer = null;
        if (row['Payer']) {
          payer = await findOrCreatePayer(row['Payer']);
        }
        
        // Find or create procedures
        const procedures = await findOrCreateProcedures(row['Procedure']);
        
        // Find or create team member (surgeon)
        let teamMember = null;
        if (row['Surgeon Name']) {
          teamMember = await findOrCreateTeamMember(row['Surgeon Name'], user.id);
        }
        
        // Create case
        const newCase = await Case.create({
          userId: user.id,
          dateOfProcedure: dateOfProcedure,
          patientName: row['Patient Name'] || 'Unknown',
          inpatientNumber: row['In-patient Number'] || null,
          patientAge: patientAge,
          facilityId: facility?.id || null,
          payerId: payer?.id || null,
          invoiceNumber: row['Invoice Number'] || null,
          procedureId: procedures.length > 0 ? procedures[0].id : null,
          amount: amount,
          paymentStatus: paymentStatus,
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
        
        successCount++;
        console.log(`  ✅ Created case for ${row['Patient Name']}`);
        
      } catch (error) {
        errorCount++;
        const errorMsg = `Row ${rowNum}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Import Summary:');
    console.log(`  ✅ Successfully imported: ${successCount} cases`);
    console.log(`  ❌ Failed: ${errorCount} cases`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => console.log(`  - ${err}`));
    }
    
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Run import
const csvFilePath = process.argv[2] || '/Users/maria/Downloads/PP Cases - Form Responses 1.csv';
const userPhoneNumber = process.argv[3] || '0727893741';

if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ CSV file not found: ${csvFilePath}`);
  process.exit(1);
}

importCases(csvFilePath, userPhoneNumber)
  .then(() => {
    console.log('\n✅ Import completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });

