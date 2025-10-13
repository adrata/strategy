const fs = require('fs');

// Read the file content using the read_file tool approach
// Since we can see the content with read_file, let's try to recreate it

console.log('🔄 Attempting to recreate alta-contacts.json file...');

// Let's try to read the file with different encodings
const encodings = ['utf8', 'utf16le', 'latin1', 'ascii'];

for (const encoding of encodings) {
  try {
    console.log(`\n📖 Trying encoding: ${encoding}`);
    const data = fs.readFileSync('alta-contacts.json', encoding);
    console.log(`   File size: ${data.length} characters`);
    
    if (data.length > 0) {
      console.log(`   First 100 chars: ${data.substring(0, 100)}`);
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(data);
        console.log(`   ✅ Successfully parsed JSON with ${parsed.length} records`);
        
        // Write it back with proper UTF-8 encoding
        fs.writeFileSync('alta-contacts-fixed.json', JSON.stringify(parsed, null, 2), 'utf8');
        console.log('   ✅ Created alta-contacts-fixed.json');
        break;
      } catch (parseError) {
        console.log(`   ❌ JSON parse error: ${parseError.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Read error: ${error.message}`);
  }
}

console.log('\n✅ File recreation attempt complete');
