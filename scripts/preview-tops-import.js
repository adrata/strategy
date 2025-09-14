const fs = require('fs');

async function previewTopsImport() {
  try {
    console.log('🔍 PREVIEWING TOPS CAPSULE CRM IMPORT\n');
    
    const csvFilePath = 'tops.csv';
    
    if (!fs.existsSync(csvFilePath)) {
      console.log(`❌ CSV file not found: ${csvFilePath}`);
      return;
    }

    console.log('📊 ANALYZING CAPSULE CRM DATA STRUCTURE...\n');
    
    // Read the file content
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const lines = fileContent.split('\n');
    
    // Parse header
    const header = lines[0].split('\t');
    console.log('📋 CSV HEADERS:');
    header.forEach((col, index) => {
      console.log(`   ${index}: ${col}`);
    });
    console.log('');

    const dataStructure = {
      totalRecords: 0,
      personRecords: 0,
      organizationRecords: 0,
      uniqueOrganizations: new Set(),
      uniquePeople: new Set(),
      owners: new Set(),
      sources: new Set(),
      tags: new Set(),
      regions: new Set(),
      industries: new Set(),
      jobTitles: new Set()
    };

    const sampleRecords = [];
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = lines[i].split('\t');
      const record = {};
      
      // Map values to headers
      header.forEach((col, index) => {
        record[col] = values[index] || '';
      });
      
      dataStructure.totalRecords++;
      
      if (record.Type === 'Person') {
        dataStructure.personRecords++;
        if (record['First Name'] && record['Last Name']) {
          dataStructure.uniquePeople.add(`${record['First Name']} ${record['Last Name']}`);
        }
        if (record['Job Title']) {
          dataStructure.jobTitles.add(record['Job Title']);
        }
      } else if (record.Type === 'Organization') {
        dataStructure.organizationRecords++;
        if (record.Name) {
          dataStructure.uniqueOrganizations.add(record.Name);
        }
      }
      
      if (record.Owner) dataStructure.owners.add(record.Owner);
      if (record.Source) dataStructure.sources.add(record.Source);
      if (record.Tags) dataStructure.tags.add(record.Tags);
      if (record.Region) dataStructure.regions.add(record.Region);
      
      // Collect sample records for preview
      if (sampleRecords.length < 10) {
        sampleRecords.push(record);
      }
    }

    console.log('📋 DATA STRUCTURE ANALYSIS:');
    console.log(`   📊 Total Records: ${dataStructure.totalRecords}`);
    console.log(`   👥 Person Records: ${dataStructure.personRecords}`);
    console.log(`   🏢 Organization Records: ${dataStructure.organizationRecords}`);
    console.log(`   🏢 Unique Organizations: ${dataStructure.uniqueOrganizations.size}`);
    console.log(`   👤 Unique People: ${dataStructure.uniquePeople.size}`);
    console.log('');

    console.log('👑 OWNERS (Sales Team):');
    Array.from(dataStructure.owners).forEach(owner => {
      console.log(`   • ${owner}`);
    });
    console.log('');

    console.log('🏷️  SOURCES (Lead Sources):');
    Array.from(dataStructure.sources).slice(0, 10).forEach(source => {
      console.log(`   • ${source}`);
    });
    if (dataStructure.sources.size > 10) {
      console.log(`   ... and ${dataStructure.sources.size - 10} more`);
    }
    console.log('');

    console.log('🏷️  TAGS (Categories):');
    Array.from(dataStructure.tags).slice(0, 10).forEach(tag => {
      console.log(`   • ${tag}`);
    });
    if (dataStructure.tags.size > 10) {
      console.log(`   ... and ${dataStructure.tags.size - 10} more`);
    }
    console.log('');

    console.log('🌍 REGIONS (Geographic):');
    Array.from(dataStructure.regions).slice(0, 10).forEach(region => {
      console.log(`   • ${region}`);
    });
    if (dataStructure.regions.size > 10) {
      console.log(`   ... and ${dataStructure.regions.size - 10} more`);
    }
    console.log('');

    console.log('💼 JOB TITLES (Sample):');
    Array.from(dataStructure.jobTitles).slice(0, 15).forEach(title => {
      console.log(`   • ${title}`);
    });
    if (dataStructure.jobTitles.size > 15) {
      console.log(`   ... and ${dataStructure.jobTitles.size - 15} more`);
    }
    console.log('');

    console.log('🏢 ORGANIZATIONS (Sample):');
    Array.from(dataStructure.uniqueOrganizations).slice(0, 15).forEach(org => {
      console.log(`   • ${org}`);
    });
    if (dataStructure.uniqueOrganizations.size > 15) {
      console.log(`   ... and ${dataStructure.uniqueOrganizations.size - 15} more`);
    }
    console.log('');

    console.log('👥 PEOPLE (Sample):');
    Array.from(dataStructure.uniquePeople).slice(0, 15).forEach(person => {
      console.log(`   • ${person}`);
    });
    if (dataStructure.uniquePeople.size > 15) {
      console.log(`   ... and ${dataStructure.uniquePeople.size - 15} more`);
    }
    console.log('');

    console.log('📋 SAMPLE RECORDS:');
    sampleRecords.forEach((record, index) => {
      console.log(`\n   ${index + 1}. ${record.Type}: ${record.Name || `${record['First Name']} ${record['Last Name']}`}`);
      if (record['Job Title']) console.log(`      Job Title: ${record['Job Title']}`);
      if (record.Organization) console.log(`      Organization: ${record.Organization}`);
      if (record.Email) console.log(`      Email: ${record.Email}`);
      if (record['Phone Number']) console.log(`      Phone: ${record['Phone Number']}`);
      if (record.Owner) console.log(`      Owner: ${record.Owner}`);
      if (record.Source) console.log(`      Source: ${record.Source}`);
      if (record.Tags) console.log(`      Tags: ${record.Tags}`);
    });
    console.log('');

    console.log('🔄 IMPORT MAPPING:');
    console.log('   📊 Organizations → Accounts (Utilities/Energy industry)');
    console.log('   👥 People → Contacts (with job titles and phone/email)');
    console.log('   🎯 Qualified People → Leads (those with job titles + organizations)');
    console.log('   👑 Owners → Assigned Users (based on name/email matching)');
    console.log('   🏷️  Sources → Lead source tracking');
    console.log('   🏷️  Tags → Notes and categorization');
    console.log('   🌍 Regions → Geographic data for targeting');
    console.log('');

    console.log('🎯 EXPECTED IMPORT RESULTS:');
    console.log(`   • ${dataStructure.uniqueOrganizations.size} new accounts`);
    console.log(`   • ${dataStructure.uniquePeople.size} new contacts`);
    console.log(`   • ~${Math.floor(dataStructure.uniquePeople.size * 0.8)} new leads (estimated)`);
    console.log(`   • All data properly linked and categorized`);
    console.log('');

    console.log('💡 NEXT STEPS AFTER IMPORT:');
    console.log('   1. Run buyer group intelligence on utility accounts');
    console.log('   2. Generate deep insights for energy industry prospects');
    console.log('   3. Create value reports for utility decision makers');
    console.log('   4. Track engagement and conversion through the pipeline');
    console.log('');

    console.log('🚀 READY TO IMPORT!');
    console.log('   Run: node scripts/import-tops-capsule-crm.js');

  } catch (error) {
    console.error('❌ Error during preview:', error);
  }
}

// Run the preview
if (require.main === module) {
  previewTopsImport();
}

module.exports = { previewTopsImport };
