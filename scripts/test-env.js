#!/usr/bin/env node

console.log('Testing environment variables...');
console.log('PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? 'SET' : 'NOT SET');
console.log('CORESIGNAL_API_KEY:', process.env.CORESIGNAL_API_KEY ? 'SET' : 'NOT SET');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET');

// Try to load from .env file
try {
  require('dotenv').config();
  console.log('\nAfter loading .env:');
  console.log('PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? 'SET' : 'NOT SET');
  console.log('CORESIGNAL_API_KEY:', process.env.CORESIGNAL_API_KEY ? 'SET' : 'NOT SET');
} catch (error) {
  console.log('dotenv not available or .env file not found');
}
