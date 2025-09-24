#!/usr/bin/env node

/**
 * 🔍 Debug Production Authentication
 * 
 * This script helps debug why production authentication isn't working
 * by checking JWT token structure and workspace context resolution.
 */

const jwt = require('jsonwebtoken');

console.log('🔍 Debugging Production Authentication...');

// Test JWT token structure
const testToken = {
  workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', // TOP Engineering Plus workspace
  userId: '01K1VBYZMWTCT09FWEKBDMCXZM', // Dan's user ID
  email: 'dan@adrata.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};

console.log('📋 Test JWT payload:', testToken);

// Test with different secrets
const secrets = [
  'm6WJ60Bdbq1vYI/Fq0u2C2qKdOx5psjB', // Local JWT_SECRET
  'a/hdT3DqJ8CdRUCO9J1p0qKiG2zHud6Y5k7I4FKix7M=', // Local NEXTAUTH_SECRET
  'dev-secret-key-change-in-production', // Fallback secret
  'fallback-secret' // Another fallback
];

secrets.forEach((secret, index) => {
  try {
    const token = jwt.sign(testToken, secret);
    console.log(`✅ Secret ${index + 1} (${secret.substring(0, 10)}...): Token created successfully`);
    
    // Try to verify
    const decoded = jwt.verify(token, secret);
    console.log(`   ✅ Verification successful:`, {
      workspaceId: decoded.workspaceId,
      userId: decoded.userId,
      email: decoded.email
    });
  } catch (error) {
    console.log(`❌ Secret ${index + 1} (${secret.substring(0, 10)}...): ${error.message}`);
  }
});

console.log('\n🎯 Next Steps:');
console.log('1. Check what JWT secret is actually being used in production');
console.log('2. Ensure the JWT token contains the correct workspace and user IDs');
console.log('3. Verify that the API is using the same secret to verify tokens');
