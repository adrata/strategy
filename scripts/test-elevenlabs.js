#!/usr/bin/env node
/**
 * Quick test for ElevenLabs API
 */

const fs = require('fs');
const path = require('path');

// Try to load env
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
} catch (e) {
  console.log('dotenv not available, checking process.env directly');
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

console.log('=== ElevenLabs Test ===');
console.log('API Key found:', ELEVENLABS_API_KEY ? 'Yes (starts with ' + ELEVENLABS_API_KEY.substring(0, 4) + '...)' : 'NO');

if (!ELEVENLABS_API_KEY) {
  console.log('\nTo generate audio, you need to set ELEVENLABS_API_KEY in .env.local');
  console.log('Get your key from: https://elevenlabs.io');
  process.exit(1);
}

async function testAPI() {
  console.log('\nTesting API connection...');
  
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': ELEVENLABS_API_KEY }
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('Success! Found', data.voices.length, 'voices');
    console.log('\nFirst 5 voices:');
    data.voices.slice(0, 5).forEach(v => {
      console.log('  -', v.name, '(' + v.voice_id + ')');
    });
  } else {
    console.log('API Error:', response.status, await response.text());
  }
}

testAPI().catch(console.error);

