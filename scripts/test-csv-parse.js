const fs = require('fs');

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  
  const companies = [];
  
  for (let idx = 0; idx < Math.min(10, dataLines.length); idx++) {
    const line = dataLines[idx];
    if (!line.trim()) continue;
    
    console.log(`\nProcessing line ${idx + 1}:`);
    console.log(`Raw line: ${JSON.stringify(line)}`);
    
    // Parse CSV line (handling quoted fields properly)
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add last field
    if (currentField !== '' || fields.length < 3) {
      fields.push(currentField.trim());
    }
    
    console.log(`Parsed ${fields.length} fields:`, fields);
    
    if (fields.length >= 3) {
      const name = fields[0].replace(/^"|"$/g, '').trim();
      const website = fields[1].replace(/^"|"$/g, '').trim();
      const linkedin = fields[2].replace(/^"|"$/g, '').trim();
      
      console.log(`  Name: "${name}"`);
      console.log(`  Website: "${website}"`);
      console.log(`  LinkedIn: "${linkedin}"`);
      console.log(`  LinkedIn length: ${linkedin.length}`);
      console.log(`  Has LinkedIn: ${linkedin && linkedin !== ''}`);
      
      if (name && linkedin && linkedin !== '') {
        companies.push({ name, website, linkedinUrl: linkedin });
        console.log(`  ✓ Added to companies list`);
      } else {
        console.log(`  ✗ Not added (name: ${!!name}, linkedin: ${!!linkedin && linkedin !== ''})`);
      }
    }
  }
  
  return companies;
}

const companies = parseCSV('top-li-2.csv');
console.log(`\nTotal companies with LinkedIn: ${companies.length}`);

