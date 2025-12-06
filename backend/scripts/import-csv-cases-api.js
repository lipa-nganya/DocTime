const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://doctime-backend-910510650031.us-central1.run.app/api';
const USER_PHONE_NUMBER = process.argv[3] || '0727893741';

// Helper functions (same as in the API endpoint)
function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// Main import function
async function importCases(csvFilePath, userPhoneNumber) {
  try {
    console.log(`📖 Reading CSV file: ${csvFilePath}...`);
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
    console.log(`\n📤 Sending to API: ${API_BASE_URL}/migration/bulk-import-cases`);
    console.log(`👤 User phone number: ${userPhoneNumber}\n`);
    
    // Send to API
    const response = await axios.post(
      `${API_BASE_URL}/migration/bulk-import-cases`,
      {
        cases: cases,
        userPhoneNumber: userPhoneNumber
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes timeout
      }
    );
    
    const results = response.data.results;
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Import Summary:');
    console.log(`  ✅ Successfully imported: ${results.inserted} cases`);
    console.log(`  ⏭️  Skipped: ${results.skipped} cases`);
    console.log(`  ❌ Failed: ${results.errors} cases`);
    
    if (results.errorDetails && results.errorDetails.length > 0) {
      console.log('\n❌ Errors:');
      results.errorDetails.forEach(err => {
        console.log(`  - Row ${err.row} (${err.patientName}): ${err.error}`);
      });
    }
    
    console.log('='.repeat(50));
    console.log('\n✅ Import completed!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    throw error;
  }
}

// Run import
const csvFilePath = process.argv[2] || '/Users/maria/Downloads/PP Cases - Form Responses 1.csv';

if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ CSV file not found: ${csvFilePath}`);
  process.exit(1);
}

importCases(csvFilePath, USER_PHONE_NUMBER)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });

