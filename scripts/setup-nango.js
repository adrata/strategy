#!/usr/bin/env node

/**
 * Nango Setup Script
 * Helps configure Nango environment variables for Grand Central
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🔧 Nango Setup for Grand Central');
  console.log('================================\n');

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env.local');
  const envExists = fs.existsSync(envPath);
  
  let envContent = '';
  if (envExists) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Found existing .env.local file');
  } else {
    console.log('📝 Creating new .env.local file');
  }

  // Check current Nango configuration
  const hasSecretKey = envContent.includes('NANGO_SECRET_KEY');
  const hasPublicKey = envContent.includes('NANGO_PUBLIC_KEY');
  const hasHost = envContent.includes('NANGO_HOST');

  console.log('\nCurrent Nango Configuration:');
  console.log(`- Secret Key: ${hasSecretKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`- Public Key: ${hasPublicKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`- Host: ${hasHost ? '✅ Set' : '❌ Missing'}`);

  if (hasSecretKey && hasPublicKey) {
    console.log('\n✅ Nango appears to be configured!');
    rl.close();
    return;
  }

  console.log('\n📋 Nango Setup Instructions:');
  console.log('1. Go to https://nango.dev and create an account');
  console.log('2. Navigate to your dashboard → Environment Settings');
  console.log('3. Copy your Secret Key and Public Key\n');

  // Get Nango credentials
  const secretKey = await question('Enter your Nango Secret Key (or press Enter to skip): ');
  const publicKey = await question('Enter your Nango Public Key (or press Enter to skip): ');
  const host = await question('Enter Nango Host (default: https://api.nango.dev): ') || 'https://api.nango.dev';

  // Build new environment content
  let newEnvContent = envContent;
  
  if (secretKey && !hasSecretKey) {
    newEnvContent += `\n# Nango Configuration\nNANGO_SECRET_KEY=${secretKey}\n`;
  }
  
  if (publicKey && !hasPublicKey) {
    newEnvContent += `NANGO_PUBLIC_KEY=${publicKey}\n`;
  }
  
  if (!hasHost) {
    newEnvContent += `NANGO_HOST=${host}\n`;
  }

  // Write the file
  fs.writeFileSync(envPath, newEnvContent);
  console.log(`\n✅ Environment variables saved to ${envPath}`);

  console.log('\n🚀 Next Steps:');
  console.log('1. Restart your development server (npm run dev)');
  console.log('2. Go to http://localhost:3000/adrata/grand-central');
  console.log('3. Click "Check Setup Status" to verify configuration');
  console.log('4. Start adding integrations!');

  console.log('\n📚 For more help, see: docs/guides/GRAND_CENTRAL_NANGO_SETUP.md');

  rl.close();
}

main().catch(console.error);
