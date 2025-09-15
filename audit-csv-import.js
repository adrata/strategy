const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

// Configuration
const RETAIL_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const CSV_FILE = 'Contacts_2025_09_15.csv';

async function auditCsvImport() {
  try {
    console.log('🔍 AUDITING CSV IMPORT');
    console.log('='.repeat(50));
    console.log('📋 Checking if we missed anyone from the CSV import');
    console.log('='.repeat(50));
    
    // Step 1: Parse CSV file
    console.log('\n📊 PARSING CSV FILE');
    console.log('='.repeat(30));
    
    const csvData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on('data', (row) => {
          // Only process rows with valid email and name
          if (row.Email && row.Email.trim() && row['First Name'] && row['Last Name']) {
            csvData.push({
              email: row.Email.trim().toLowerCase(),
              firstName: row['First Name'].trim(),
              lastName: row['Last Name'].trim(),
              fullName: `${row['First Name'].trim()} ${row['Last Name'].trim()}`,
              company: row['Account Name'] ? row['Account Name'].trim() : null,
              title: row.Title ? row.Title.trim() : null,
              department: row.Department ? row.Department.trim() : null,
              phone: row.Phone ? row.Phone.trim() : null
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📄 Total valid records in CSV: ${csvData.length}`);
    
    // Step 2: Get database records
    console.log('\n🗄️  GETTING DATABASE RECORDS');
    console.log('='.repeat(40));
    
    const dbPeople = await prisma.people.findMany({
      where: { workspaceId: RETAIL_WORKSPACE_ID },
      select: {
        id: true,
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
        company: {
          select: { name: true }
        }
      }
    });
    
    console.log(`🗄️  Total people in database: ${dbPeople.length}`);
    
    // Step 3: Create lookup maps
    console.log('\n🔍 CREATING LOOKUP MAPS');
    console.log('='.repeat(40));
    
    const dbEmailMap = new Map();
    const dbNameMap = new Map();
    
    dbPeople.forEach(person => {
      if (person.email) {
        dbEmailMap.set(person.email.toLowerCase(), person);
      }
      // Also create name-based lookup for cases where email might differ
      const fullName = person.fullName?.toLowerCase();
      if (fullName) {
        dbNameMap.set(fullName, person);
      }
    });
    
    console.log(`📧 Database emails indexed: ${dbEmailMap.size}`);
    console.log(`👤 Database names indexed: ${dbNameMap.size}`);
    
    // Step 4: Find missing records
    console.log('\n❌ FINDING MISSING RECORDS');
    console.log('='.repeat(40));
    
    const missingByEmail = [];
    const missingByName = [];
    const foundRecords = [];
    
    csvData.forEach(csvRecord => {
      const foundByEmail = dbEmailMap.get(csvRecord.email);
      const foundByName = dbNameMap.get(csvRecord.fullName.toLowerCase());
      
      if (foundByEmail) {
        foundRecords.push({
          csv: csvRecord,
          db: foundByEmail,
          matchType: 'email'
        });
      } else if (foundByName) {
        foundRecords.push({
          csv: csvRecord,
          db: foundByName,
          matchType: 'name'
        });
      } else {
        // Check if it's a name match but different email
        const nameMatch = Array.from(dbNameMap.values()).find(dbPerson => 
          dbPerson.fullName?.toLowerCase() === csvRecord.fullName.toLowerCase()
        );
        
        if (nameMatch) {
          missingByEmail.push({
            csv: csvRecord,
            db: nameMatch,
            reason: 'Email mismatch'
          });
        } else {
          missingByName.push(csvRecord);
        }
      }
    });
    
    console.log(`✅ Found by email: ${foundRecords.filter(r => r.matchType === 'email').length}`);
    console.log(`✅ Found by name: ${foundRecords.filter(r => r.matchType === 'name').length}`);
    console.log(`⚠️  Email mismatches: ${missingByEmail.length}`);
    console.log(`❌ Completely missing: ${missingByName.length}`);
    
    // Step 5: Show missing records
    if (missingByName.length > 0) {
      console.log('\n❌ COMPLETELY MISSING RECORDS');
      console.log('='.repeat(50));
      missingByName.slice(0, 10).forEach((record, index) => {
        console.log(`${index + 1}. ${record.fullName}`);
        console.log(`   📧 Email: ${record.email}`);
        console.log(`   🏢 Company: ${record.company || 'N/A'}`);
        console.log(`   💼 Title: ${record.title || 'N/A'}`);
        console.log('');
      });
      
      if (missingByName.length > 10) {
        console.log(`... and ${missingByName.length - 10} more missing records`);
      }
    }
    
    if (missingByEmail.length > 0) {
      console.log('\n⚠️  EMAIL MISMATCHES');
      console.log('='.repeat(40));
      missingByEmail.slice(0, 5).forEach((record, index) => {
        console.log(`${index + 1}. ${record.csv.fullName}`);
        console.log(`   📧 CSV Email: ${record.csv.email}`);
        console.log(`   📧 DB Email: ${record.db.email}`);
        console.log(`   🏢 Company: ${record.csv.company || 'N/A'}`);
        console.log('');
      });
      
      if (missingByEmail.length > 5) {
        console.log(`... and ${missingByEmail.length - 5} more email mismatches`);
      }
    }
    
    // Step 6: Check for extra records in database
    console.log('\n➕ EXTRA RECORDS IN DATABASE');
    console.log('='.repeat(40));
    
    const csvEmails = new Set(csvData.map(r => r.email));
    const csvNames = new Set(csvData.map(r => r.fullName.toLowerCase()));
    
    const extraRecords = dbPeople.filter(dbPerson => {
      const emailMatch = dbPerson.email && csvEmails.has(dbPerson.email.toLowerCase());
      const nameMatch = dbPerson.fullName && csvNames.has(dbPerson.fullName.toLowerCase());
      return !emailMatch && !nameMatch;
    });
    
    console.log(`➕ Extra records in database: ${extraRecords.length}`);
    
    if (extraRecords.length > 0) {
      console.log('\n📋 Sample extra records:');
      extraRecords.slice(0, 5).forEach((record, index) => {
        console.log(`${index + 1}. ${record.fullName}`);
        console.log(`   📧 Email: ${record.email}`);
        console.log(`   🏢 Company: ${record.company?.name || 'N/A'}`);
        console.log('');
      });
    }
    
    // Step 7: Final assessment
    console.log('\n🎯 FINAL ASSESSMENT');
    console.log('='.repeat(40));
    
    const totalCsvRecords = csvData.length;
    const totalFound = foundRecords.length;
    const totalMissing = missingByName.length;
    const coverageRate = ((totalFound / totalCsvRecords) * 100).toFixed(1);
    
    console.log(`📊 CSV Import Coverage: ${coverageRate}%`);
    console.log(`✅ Successfully imported: ${totalFound}/${totalCsvRecords}`);
    console.log(`❌ Missing from import: ${totalMissing}`);
    console.log(`➕ Extra in database: ${extraRecords.length}`);
    
    if (totalMissing === 0) {
      console.log('\n🎉 PERFECT! All CSV records were successfully imported!');
    } else {
      console.log(`\n⚠️  ${totalMissing} records from CSV are missing from the database`);
    }
    
    // Step 8: Summary by company
    console.log('\n🏢 COMPANY BREAKDOWN');
    console.log('='.repeat(40));
    
    const companyStats = {};
    csvData.forEach(record => {
      const company = record.company || 'Unknown Company';
      if (!companyStats[company]) {
        companyStats[company] = { total: 0, found: 0, missing: 0 };
      }
      companyStats[company].total++;
      
      const found = foundRecords.find(f => f.csv.email === record.email);
      if (found) {
        companyStats[company].found++;
      } else {
        companyStats[company].missing++;
      }
    });
    
    // Show top companies with missing records
    const companiesWithMissing = Object.entries(companyStats)
      .filter(([_, stats]) => stats.missing > 0)
      .sort((a, b) => b[1].missing - a[1].missing)
      .slice(0, 10);
    
    if (companiesWithMissing.length > 0) {
      console.log('\n🏢 Companies with missing records:');
      companiesWithMissing.forEach(([company, stats]) => {
        const rate = ((stats.found / stats.total) * 100).toFixed(1);
        console.log(`   ${company}: ${stats.found}/${stats.total} (${rate}%) - ${stats.missing} missing`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error auditing CSV import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditCsvImport();
