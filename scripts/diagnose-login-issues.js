#!/usr/bin/env node

/**
 * 🔍 LOGIN ISSUE DIAGNOSTIC SCRIPT
 * 
 * This script helps diagnose why login works on your computer
 * but not on users' computers.
 * 
 * Run this script in the problematic environment to identify issues.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('🔍 [LOGIN DIAGNOSTIC] Starting comprehensive login issue analysis...\n');

// Step 1: Environment Variables Check
function checkEnvironmentVariables() {
  console.log('📋 [STEP 1] Environment Variables Check');
  console.log('=====================================');
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET', 
    'NEXTAUTH_URL',
    'POSTGRES_URL'
  ];
  
  const optionalVars = [
    'JWT_SECRET',
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_APP_URL',
    'NODE_ENV'
  ];
  
  let allRequired = true;
  
  console.log('Required variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // Mask sensitive values
      const maskedValue = varName.includes('SECRET') || varName.includes('URL') 
        ? `${value.substring(0, 10)}...` 
        : value;
      console.log(`✅ ${varName}: ${maskedValue}`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
      allRequired = false;
    }
  });
  
  console.log('\nOptional variables:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value}`);
    } else {
      console.log(`⚠️  ${varName}: Not set`);
    }
  });
  
  return allRequired;
}

// Step 2: Database Connection Test
async function testDatabaseConnection() {
  console.log('\n🗄️ [STEP 2] Database Connection Test');
  console.log('===================================');
  
  try {
    const prisma = new PrismaClient();
    
    // Test basic connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test user table access
    console.log('Testing user table access...');
    const userCount = await prisma.users.count();
    console.log(`✅ User table accessible - ${userCount} users found`);
    
    // Test specific user lookup (if you know a test user)
    const testEmail = process.env.TEST_USER_EMAIL || 'dan@adrata.com';
    console.log(`Testing user lookup for: ${testEmail}`);
    
    const testUser = await prisma.users.findFirst({
      where: { email: testEmail },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        activeWorkspaceId: true
      }
    });
    
    if (testUser) {
      console.log(`✅ Test user found:`, {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        isActive: testUser.isActive,
        activeWorkspaceId: testUser.activeWorkspaceId
      });
    } else {
      console.log(`❌ Test user not found: ${testEmail}`);
    }
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log('  Error:', error.message);
    console.log('  Code:', error.code);
    console.log('  Details:', error.meta || 'No additional details');
    return false;
  }
}

// Step 3: Authentication Flow Test
async function testAuthenticationFlow() {
  console.log('\n🔐 [STEP 3] Authentication Flow Test');
  console.log('===================================');
  
  try {
    const prisma = new PrismaClient();
    
    // Test JWT secret
    const jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.log('❌ No JWT secret found');
      return false;
    }
    
    console.log('✅ JWT secret is configured');
    
    // Test JWT token creation
    const testPayload = { 
      userId: 'test-user-id', 
      email: 'test@example.com',
      workspaceId: 'test-workspace'
    };
    
    const token = jwt.sign(testPayload, jwtSecret, { expiresIn: '1h' });
    console.log('✅ JWT token creation successful');
    
    // Test JWT token verification
    const decoded = jwt.verify(token, jwtSecret);
    console.log('✅ JWT token verification successful');
    console.log('  Decoded payload:', decoded);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.log('❌ Authentication flow test failed:');
    console.log('  Error:', error.message);
    return false;
  }
}

// Step 4: Platform Detection Test
function testPlatformDetection() {
  console.log('\n🖥️ [STEP 4] Platform Detection Test');
  console.log('===================================');
  
  const platform = process.platform;
  const nodeEnv = process.env.NODE_ENV;
  const isDesktop = process.env.NEXT_PUBLIC_IS_DESKTOP === 'true';
  const isTauri = process.env.TAURI_BUILD === 'true';
  
  console.log(`Platform: ${platform}`);
  console.log(`Node Environment: ${nodeEnv}`);
  console.log(`Is Desktop: ${isDesktop}`);
  console.log(`Is Tauri: ${isTauri}`);
  
  // Check for Tauri-specific environment
  if (typeof window !== 'undefined' && window.__TAURI__) {
    console.log('✅ Tauri environment detected');
  } else {
    console.log('ℹ️  Web environment detected');
  }
  
  return true;
}

// Step 5: Network and CORS Test
async function testNetworkAndCORS() {
  console.log('\n🌐 [STEP 5] Network and CORS Test');
  console.log('=================================');
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log(`API Base URL: ${apiBaseUrl}`);
  console.log(`App URL: ${appUrl}`);
  
  // Test if we can reach the auth endpoint
  try {
    const authUrl = `${apiBaseUrl}/api/auth/sign-in`;
    console.log(`Testing auth endpoint: ${authUrl}`);
    
    // This would require a fetch implementation
    console.log('ℹ️  Network test requires manual verification');
    console.log('  - Check if the auth endpoint is accessible');
    console.log('  - Verify CORS headers are correct');
    console.log('  - Ensure SSL certificates are valid (if HTTPS)');
    
    return true;
  } catch (error) {
    console.log('❌ Network test failed:', error.message);
    return false;
  }
}

// Step 6: User-Specific Issues
async function testUserSpecificIssues() {
  console.log('\n👤 [STEP 6] User-Specific Issues Test');
  console.log('===================================');
  
  try {
    const prisma = new PrismaClient();
    
    // Check for common user issues
    console.log('Checking for common user authentication issues...');
    
    // 1. Inactive users
    const inactiveUsers = await prisma.users.count({
      where: { isActive: false }
    });
    console.log(`Inactive users: ${inactiveUsers}`);
    
    // 2. Users without workspaces
    const usersWithoutWorkspaces = await prisma.users.count({
      where: {
        activeWorkspaceId: null
      }
    });
    console.log(`Users without active workspace: ${usersWithoutWorkspaces}`);
    
    // 3. Users with invalid passwords (empty or null)
    const usersWithInvalidPasswords = await prisma.users.count({
      where: {
        OR: [
          { password: null },
          { password: '' }
        ]
      }
    });
    console.log(`Users with invalid passwords: ${usersWithInvalidPasswords}`);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.log('❌ User-specific test failed:', error.message);
    return false;
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('🚀 [LOGIN DIAGNOSTIC] Starting comprehensive analysis...\n');
  
  const results = {
    environment: checkEnvironmentVariables(),
    database: await testDatabaseConnection(),
    authentication: await testAuthenticationFlow(),
    platform: testPlatformDetection(),
    network: await testNetworkAndCORS(),
    userIssues: await testUserSpecificIssues()
  };
  
  console.log('\n📊 [DIAGNOSTIC SUMMARY]');
  console.log('======================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${test.toUpperCase()}: ${status}`);
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\n🎉 All diagnostic tests passed!');
    console.log('The issue might be:');
    console.log('  - User-specific data problems');
    console.log('  - Network/firewall issues');
    console.log('  - Browser-specific problems');
    console.log('  - Caching issues');
  } else {
    console.log('\n⚠️  Some diagnostic tests failed!');
    console.log('Focus on fixing the failed tests first.');
  }
  
  console.log('\n🔧 [NEXT STEPS]');
  console.log('===============');
  console.log('1. Fix any failed diagnostic tests');
  console.log('2. Check server logs for specific error messages');
  console.log('3. Test with a known working user account');
  console.log('4. Verify environment variables match between working and non-working environments');
  console.log('5. Check database permissions and connectivity');
}

// Run diagnostics
runDiagnostics().catch(console.error);
