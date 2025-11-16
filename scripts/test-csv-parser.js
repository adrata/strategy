const fs = require('fs');
const csv = require('csv-parser');

const results = [];

fs.createReadStream('top-li-2.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (results.length < 5) {
      console.log('Row keys:', Object.keys(row));
      console.log('Row data:', row);
      console.log('Company Name:', row['Company Name']);
      console.log('LinkedIn URL:', row['LinkedIn URL']);
      console.log('Has LinkedIn:', row['LinkedIn URL'] && row['LinkedIn URL'].trim() !== '');
      console.log('---');
    }
    results.push(row);
  })
  .on('end', () => {
    const withLinkedIn = results.filter(r => r['LinkedIn URL'] && r['LinkedIn URL'].trim() !== '');
    console.log(`\nTotal rows: ${results.length}`);
    console.log(`Rows with LinkedIn: ${withLinkedIn.length}`);
  });





