const fs = require('fs');
const csv = require('csv-parser');

async function checkCsvStructure() {
  try {
    console.log('🔍 CHECKING CSV STRUCTURE FOR BETTER LINKING');
    console.log('='.repeat(60));
    console.log('');
    
    const csvFiles = [
      '/Users/rosssylvester/Desktop/new-New/Notes_Contacts_2025_09_06.csv',
      '/Users/rosssylvester/Desktop/new-New/Notes_Accounts_2025_09_06.csv',
      '/Users/rosssylvester/Desktop/new-New/Notes_Leads_2025_09_06.csv',
      '/Users/rosssylvester/Desktop/new-New/Notes_Deals_2025_09_06.csv'
    ];
    
    for (const filePath of csvFiles) {
      if (fs.existsSync(filePath)) {
        console.log(`📁 ${filePath.split('/').pop()}:`);
        console.log('-'.repeat(40));
        
        const records = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
              records.push(row);
            })
            .on('end', resolve)
            .on('error', reject);
        });
        
        if (records.length > 0) {
          console.log(`   Total records: ${records.length}`);
          console.log('   Column names:');
          Object.keys(records[0]).forEach((key, index) => {
            console.log(`      ${index + 1}. ${key}`);
          });
          
          console.log('   Sample record:');
          const sample = records[0];
          Object.entries(sample).forEach(([key, value]) => {
            if (value && value.toString().length > 0) {
              console.log(`      ${key}: ${value.toString().substring(0, 100)}${value.toString().length > 100 ? '...' : ''}`);
            }
          });
          
          // Check for Parent ID patterns
          const parentIds = records.map(r => r.Parent_ID).filter(id => id);
          const uniqueParentIds = [...new Set(parentIds)];
          console.log(`   Unique Parent IDs: ${uniqueParentIds.length}`);
          console.log(`   Sample Parent IDs: ${uniqueParentIds.slice(0, 5).join(', ')}`);
        }
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking CSV structure:', error);
  }
}

checkCsvStructure();
