#!/usr/bin/env node

console.log('🔍 Testing environment...');
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());

try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma client loaded successfully');
  
  const prisma = new PrismaClient();
  console.log('✅ Prisma client initialized');
  
  // Test database connection
  prisma.$connect().then(() => {
    console.log('✅ Database connection successful');
    return prisma.$disconnect();
  }).then(() => {
    console.log('✅ Database disconnected');
    console.log('🎉 Environment test completed successfully!');
  }).catch(error => {
    console.error('❌ Database connection failed:', error.message);
  });
  
} catch (error) {
  console.error('❌ Error loading Prisma:', error.message);
}

console.log('Environment test script completed.');
