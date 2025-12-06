#!/usr/bin/env node

/**
 * Import cases from CSV file
 * Only imports Date of Procedure and Patient Name
 * 
 * Usage: node import-cases-from-csv.js <csv-file-path> [user-phone-number]
 * Example: node import-cases-from-csv.js "/Users/maria/Downloads/PP Cases - Form Responses 1.csv" "254712345678"
 */

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || process.env.CLOUD_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL or CLOUD_DATABASE_URL environment variable is required');
  process.exit(1);
}

// Determine if we should use SSL
const shouldUseSsl = DATABASE_URL.includes('sslmode=require') || 
                     (DATABASE_URL.includes('amazonaws.com') || DATABASE_URL.includes('azure.com') || DATABASE_URL.includes('googleapis.com')) &&
                     !DATABASE_URL.includes('/cloudsql/');

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: shouldUseSsl ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

// Import models
const { User, Case } = require('./models');

async function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim());
  const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date of procedure'));
  const patientNameIndex = headers.findIndex(h => h.toLowerCase().includes('patient name'));

  if (dateIndex === -1 || patientNameIndex === -1) {
    throw new Error('CSV must contain "Date of Procedure" and "Patient Name" columns');
  }

  const cases = [];
  
  // Parse data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV with quoted fields that may contain commas
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value

    const dateStr = values[dateIndex]?.trim();
    const patientName = values[patientNameIndex]?.trim();

    if (!dateStr || !patientName) {
      console.warn(`⚠️  Skipping row ${i + 1}: missing date or patient name`);
      continue;
    }

    // Parse date (handle formats like "3/31/2025" or "3/31/2025 19:23:33")
    let dateOfProcedure;
    try {
      const dateParts = dateStr.split(/[/\s]/);
      if (dateParts.length >= 3) {
        // Format: MM/DD/YYYY or M/D/YYYY
        const month = parseInt(dateParts[0]) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[1]);
        const year = parseInt(dateParts[2]);
        dateOfProcedure = new Date(year, month, day);
      } else {
        dateOfProcedure = new Date(dateStr);
      }

      if (isNaN(dateOfProcedure.getTime())) {
        console.warn(`⚠️  Skipping row ${i + 1}: invalid date "${dateStr}"`);
        continue;
      }
    } catch (error) {
      console.warn(`⚠️  Skipping row ${i + 1}: date parsing error - ${error.message}`);
      continue;
    }

    cases.push({
      dateOfProcedure,
      patientName: patientName.replace(/^"|"$/g, ''), // Remove quotes if present
      rowNumber: i + 1
    });
  }

  return cases;
}

async function importCases(cases, userPhoneNumber) {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Find or get first user
    let user;
    if (userPhoneNumber) {
      // Format phone number
      let phone = userPhoneNumber.trim();
      if (phone.startsWith('0')) {
        phone = '254' + phone.substring(1);
      } else if (!phone.startsWith('254')) {
        phone = '254' + phone;
      }
      phone = phone.replace(/\D/g, '');

      user = await User.findOne({ where: { phoneNumber: phone } });
      if (!user) {
        throw new Error(`User with phone number ${userPhoneNumber} not found`);
      }
    } else {
      // Get first user
      user = await User.findOne({ order: [['createdAt', 'ASC']] });
      if (!user) {
        throw new Error('No users found in database. Please create a user first or provide a phone number.');
      }
    }

    console.log(`📋 Importing cases for user: ${user.phoneNumber} (${user.prefix || ''} ${user.preferredName || ''})`.trim());

    const results = {
      inserted: 0,
      skipped: 0,
      errors: 0,
      errorDetails: []
    };

    // Determine status based on date - auto-complete cases with past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const caseData of cases) {
      try {
        const procedureDate = new Date(caseData.dateOfProcedure);
        procedureDate.setHours(0, 0, 0, 0);
        
        // If date is in the past (before today), auto-complete the case
        const isDatePassed = procedureDate < today;
        const status = isDatePassed ? 'Completed' : 'Upcoming';

        // Check if case already exists (same patient name and date)
        const existing = await Case.findOne({
          where: {
            userId: user.id,
            patientName: caseData.patientName,
            dateOfProcedure: procedureDate
          }
        });

        if (existing) {
          console.log(`⏭️  Skipping row ${caseData.rowNumber}: Case already exists for "${caseData.patientName}" on ${procedureDate.toLocaleDateString()}`);
          results.skipped++;
          continue;
        }

        // Create case
        await Case.create({
          userId: user.id,
          dateOfProcedure: procedureDate,
          patientName: caseData.patientName,
          status: status,
          isAutoCompleted: isDatePassed,
          completedAt: isDatePassed ? new Date() : null,
          paymentStatus: 'Pending'
        });

        results.inserted++;
        console.log(`✅ Row ${caseData.rowNumber}: Created case for "${caseData.patientName}" (${procedureDate.toLocaleDateString()})`);
      } catch (error) {
        results.errors++;
        results.errorDetails.push({
          row: caseData.rowNumber,
          patientName: caseData.patientName,
          error: error.message
        });
        console.error(`❌ Row ${caseData.rowNumber}: Error - ${error.message}`);
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Inserted: ${results.inserted}`);
    console.log(`   ⏭️  Skipped: ${results.skipped}`);
    console.log(`   ❌ Errors: ${results.errors}`);

    if (results.errorDetails.length > 0) {
      console.log('\n❌ Error Details:');
      results.errorDetails.forEach(detail => {
        console.log(`   Row ${detail.row} (${detail.patientName}): ${detail.error}`);
      });
    }

    return results;
  } catch (error) {
    console.error('❌ Import error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node import-cases-from-csv.js <csv-file-path> [user-phone-number]');
    console.error('Example: node import-cases-from-csv.js "/path/to/file.csv" "254712345678"');
    process.exit(1);
  }

  const csvFilePath = args[0];
  const userPhoneNumber = args[1];

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: File not found: ${csvFilePath}`);
    process.exit(1);
  }

  try {
    console.log('📂 Parsing CSV file...');
    const cases = await parseCSV(csvFilePath);
    console.log(`✅ Parsed ${cases.length} cases from CSV\n`);

    if (cases.length === 0) {
      console.log('⚠️  No valid cases found in CSV file');
      process.exit(0);
    }

    console.log('📤 Starting import...\n');
    await importCases(cases, userPhoneNumber);
    
    console.log('\n✅ Import completed!');
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();

