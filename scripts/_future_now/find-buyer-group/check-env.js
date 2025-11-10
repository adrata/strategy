require('dotenv').config();

const required = ['CORESIGNAL_API_KEY', 'DATABASE_URL'];
const optional = ['ANTHROPIC_API_KEY', 'ZEROBOUNCE_API_KEY', 'MYEMAILVERIFIER_API_KEY', 'PROSPEO_API_KEY', 'PERPLEXITY_API_KEY', 'PEOPLE_DATA_LABS_API_KEY'];

console.log('Required Environment Variables:');
required.forEach(k => {
  const value = process.env[k];
  console.log(`  ${k}: ${value ? 'SET ✓' : 'MISSING ✗'}`);
});

console.log('\nOptional Environment Variables:');
optional.forEach(k => {
  const value = process.env[k];
  console.log(`  ${k}: ${value ? 'SET ✓' : 'not set'}`);
});

if (!process.env.CORESIGNAL_API_KEY || !process.env.DATABASE_URL) {
  console.log('\n❌ Missing required environment variables!');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set');
}

