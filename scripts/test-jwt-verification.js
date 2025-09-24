#!/usr/bin/env node

/**
 * 🔍 Test JWT Verification
 * 
 * This script tests JWT token creation and verification to identify
 * the mismatch between production and local environments.
 */

const jwt = require('jsonwebtoken');

console.log('🔍 Testing JWT Token Creation and Verification...');

// Simulate the JWT token that should be created during sign-in
const tokenPayload = {
  userId: '01K1VBYZMWTCT09FWEKBDMCXZM', // Dan's user ID
  email: 'dan@adrata.com',
  name: 'Dan',
  workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', // TOP Engineering Plus workspace
  activeWorkspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
  platform: 'web',
  deviceId: 'web-device-123',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
};

console.log('📋 Token payload:', tokenPayload);

// Test with different secrets (matching the API route logic)
const secrets = [
  process.env.NEXTAUTH_SECRET || 'dev-secret-key-change-in-production',
  process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  'dev-secret-key-change-in-production',
  'fallback-secret'
];

console.log('\n🔐 Testing JWT Creation and Verification:');

secrets.forEach((secret, index) => {
  try {
    // Create token
    const token = jwt.sign(tokenPayload, secret);
    console.log(`\n✅ Secret ${index + 1}: Token created successfully`);
    console.log(`   Secret: ${secret.substring(0, 20)}...`);
    console.log(`   Token: ${token.substring(0, 50)}...`);
    
    // Try to verify with the same secret
    const decoded = jwt.verify(token, secret);
    console.log(`   ✅ Verification successful with same secret`);
    console.log(`   Workspace ID: ${decoded.workspaceId}`);
    console.log(`   User ID: ${decoded.userId}`);
    console.log(`   Email: ${decoded.email}`);
    
    // Try to verify with other secrets (cross-verification)
    secrets.forEach((otherSecret, otherIndex) => {
      if (otherIndex !== index) {
        try {
          const crossDecoded = jwt.verify(token, otherSecret);
          console.log(`   ⚠️  WARNING: Token verified with different secret ${otherIndex + 1}!`);
        } catch (crossError) {
          // This is expected - token should only verify with its own secret
        }
      }
    });
    
  } catch (error) {
    console.log(`❌ Secret ${index + 1}: ${error.message}`);
  }
});

console.log('\n🎯 Key Findings:');
console.log('1. Check if production JWT_SECRET matches local JWT_SECRET');
console.log('2. Verify that the API route uses the same secret for verification');
console.log('3. Ensure the JWT token contains the correct workspace and user IDs');
console.log('4. Check if there are any token expiration issues');
