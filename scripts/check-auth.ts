#!/usr/bin/env npx tsx

/**
 * 🔐 CHECK AUTHENTICATION
 * This script checks authentication configuration and validates setup
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

console.log('🔐 Checking Authentication Setup...');
console.log('===================================');

async function checkDatabaseConnection() {
  console.log('\n📊 Database Connection Check');
  console.log('----------------------------');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if User table exists and has data
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

function checkEnvironmentVariables() {
  console.log('\n🌍 Environment Variables Check');
  console.log('------------------------------');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const optionalEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'MICROSOFT_CLIENT_ID',
    'MICROSOFT_CLIENT_SECRET'
  ];
  
  let allRequired = true;
  
  console.log('Required variables:');
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allRequired = false;
    }
  });
  
  console.log('\nOptional variables:');
  optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`⚠️  ${varName}: Not set`);
    }
  });
  
  return allRequired;
}

function checkAuthConfiguration() {
  console.log('\n⚙️  Authentication Configuration Check');
  console.log('-------------------------------------');
  
  // Check if auth config files exist
  const authFiles = [
    'src/platform/auth/auth-config.ts',
    'src/platform/auth/auth-unified.ts',
    'src/app/api/auth/[...nextauth]/route.ts'
  ];
  
  let allFilesExist = true;
  
  authFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${filePath}: Exists`);
    } else {
      console.log(`❌ ${filePath}: Missing`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

async function checkUserAccess() {
  console.log('\n👤 User Access Check');
  console.log('-------------------');
  
  try {
    // Check for admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    console.log(`✅ Found ${adminUsers.length} admin users`);
    
    if (adminUsers.length > 0) {
      console.log('Admin users:');
      adminUsers.forEach(user => {
        console.log(`  • ${user.name || 'Unnamed'} (${user.email})`);
      });
    }
    
    // Check for regular users
    const regularUsers = await prisma.user.findMany({
      where: {
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    console.log(`✅ Found ${regularUsers.length} regular users`);
    
    return true;
  } catch (error) {
    console.log('❌ User access check failed:', error.message);
    return false;
  }
}

function checkSessionConfiguration() {
  console.log('\n🍪 Session Configuration Check');
  console.log('------------------------------');
  
  const sessionConfig = {
    secret: !!process.env.NEXTAUTH_SECRET,
    url: !!process.env.NEXTAUTH_URL,
    secureCookies: process.env.NODE_ENV === 'production'
  };
  
  console.log(`✅ Secret configured: ${sessionConfig.secret}`);
  console.log(`✅ URL configured: ${sessionConfig.url}`);
  console.log(`✅ Secure cookies: ${sessionConfig.secureCookies}`);
  
  if (process.env.NEXTAUTH_URL) {
    console.log(`   URL: ${process.env.NEXTAUTH_URL}`);
  }
  
  return sessionConfig.secret && sessionConfig.url;
}

async function generateAuthReport() {
  console.log('\n📋 Authentication Report');
  console.log('========================');
  
  const checks = {
    database: await checkDatabaseConnection(),
    environment: checkEnvironmentVariables(),
    configuration: checkAuthConfiguration(),
    users: await checkUserAccess(),
    sessions: checkSessionConfiguration()
  };
  
  const allPassed = Object.values(checks).every(check => check === true);
  
  console.log('\n📊 Summary:');
  console.log(`Database: ${checks.database ? '✅' : '❌'}`);
  console.log(`Environment: ${checks.environment ? '✅' : '❌'}`);
  console.log(`Configuration: ${checks.configuration ? '✅' : '❌'}`);
  console.log(`Users: ${checks.users ? '✅' : '❌'}`);
  console.log(`Sessions: ${checks.sessions ? '✅' : '❌'}`);
  
  if (allPassed) {
    console.log('\n🎉 All authentication checks passed!');
    console.log('Your authentication system is properly configured.');
  } else {
    console.log('\n⚠️  Some authentication checks failed.');
    console.log('Please review the issues above and fix them.');
  }
  
  return allPassed;
}

// Main execution
async function main() {
  try {
    const success = await generateAuthReport();
    
    if (success) {
      console.log('\n✅ Authentication check completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Authentication check found issues.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Authentication check failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
