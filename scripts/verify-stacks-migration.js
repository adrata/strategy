#!/usr/bin/env node

/**
 * Verify Stacks Migration - Production Validation
 * 
 * This script verifies that all migration columns were successfully added
 * and that the production database is 100% ready.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyStacksMigration() {
  console.log('🔍 Verifying Stacks Migration - Production Database Validation\n');
  
  let allChecksPassed = true;
  
  try {
    // Check StacksStory table for viewType column
    console.log('1. Checking StacksStory.viewType column...');
    try {
      const testQuery = await prisma.$queryRawUnsafe(`
        SELECT "viewType" FROM "StacksStory" LIMIT 1;
      `);
      console.log('✅ StacksStory.viewType column exists');
    } catch (error) {
      if (error.code === 'P2022' || error.message?.includes('column "viewType" does not exist')) {
        console.log('❌ StacksStory.viewType column MISSING');
        allChecksPassed = false;
      } else {
        throw error;
      }
    }

    // Check StacksTask table for product and section columns
    console.log('\n2. Checking StacksTask.product column...');
    try {
      const testQuery = await prisma.$queryRawUnsafe(`
        SELECT "product" FROM "StacksTask" LIMIT 1;
      `);
      console.log('✅ StacksTask.product column exists');
    } catch (error) {
      if (error.code === 'P2022' || error.message?.includes('column "product" does not exist')) {
        console.log('❌ StacksTask.product column MISSING');
        allChecksPassed = false;
      } else {
        throw error;
      }
    }

    console.log('\n3. Checking StacksTask.section column...');
    try {
      const testQuery = await prisma.$queryRawUnsafe(`
        SELECT "section" FROM "StacksTask" LIMIT 1;
      `);
      console.log('✅ StacksTask.section column exists');
    } catch (error) {
      if (error.code === 'P2022' || error.message?.includes('column "section" does not exist')) {
        console.log('❌ StacksTask.section column MISSING');
        allChecksPassed = false;
      } else {
        throw error;
      }
    }

    // Check StacksEpic table for product and section columns
    console.log('\n4. Checking StacksEpic.product column...');
    try {
      const testQuery = await prisma.$queryRawUnsafe(`
        SELECT "product" FROM "StacksEpic" LIMIT 1;
      `);
      console.log('✅ StacksEpic.product column exists');
    } catch (error) {
      if (error.code === 'P2022' || error.message?.includes('column "product" does not exist')) {
        console.log('❌ StacksEpic.product column MISSING');
        allChecksPassed = false;
      } else {
        throw error;
      }
    }

    console.log('\n5. Checking StacksEpic.section column...');
    try {
      const testQuery = await prisma.$queryRawUnsafe(`
        SELECT "section" FROM "StacksEpic" LIMIT 1;
      `);
      console.log('✅ StacksEpic.section column exists');
    } catch (error) {
      if (error.code === 'P2022' || error.message?.includes('column "section" does not exist')) {
        console.log('❌ StacksEpic.section column MISSING');
        allChecksPassed = false;
      } else {
        throw error;
      }
    }

    // Test API-compatible queries
    console.log('\n6. Testing API-compatible queries...');
    try {
      const stories = await prisma.stacksStory.findMany({
        select: {
          id: true,
          title: true,
          product: true,
          section: true,
        },
        take: 1
      });
      console.log('✅ Stories query with product/section works');
    } catch (error) {
      console.log('❌ Stories query failed:', error.message);
      allChecksPassed = false;
    }

    try {
      const tasks = await prisma.stacksTask.findMany({
        select: {
          id: true,
          title: true,
          product: true,
          section: true,
        },
        take: 1
      });
      console.log('✅ Tasks query with product/section works');
    } catch (error) {
      console.log('❌ Tasks query failed:', error.message);
      allChecksPassed = false;
    }

    try {
      const epics = await prisma.stacksEpic.findMany({
        select: {
          id: true,
          title: true,
          product: true,
          section: true,
        },
        take: 1
      });
      console.log('✅ Epics query with product/section works');
    } catch (error) {
      console.log('❌ Epics query failed:', error.message);
      allChecksPassed = false;
    }

    // Final summary
    console.log('\n' + '='.repeat(50));
    if (allChecksPassed) {
      console.log('✅ ALL CHECKS PASSED - Production database is 100% ready!');
      console.log('='.repeat(50));
    } else {
      console.log('❌ SOME CHECKS FAILED - Please review the errors above');
      console.log('='.repeat(50));
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Verification script error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStacksMigration();

