/**
 * Check which Stacks tables exist in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStacksTables() {
  console.log('🔍 Checking Stacks tables in database...\n');

  try {
    // Check what tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'Stacks%'
      ORDER BY tablename
    `;

    console.log('📊 Found Stacks tables:');
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`);
    });

    // Try to access each model
    console.log('\n🔍 Testing Prisma client access:\n');

    const models = ['stacksProject', 'stacksEpoch', 'stacksEpic', 'stacksStory'];
    
    for (const model of models) {
      try {
        // @ts-ignore - Dynamic access
        const result = await prisma[model].findMany({ take: 0 });
        console.log(`✅ ${model}: Accessible (${result.length} records)`);
      } catch (error: any) {
        if (error.message?.includes('does not exist')) {
          console.log(`❌ ${model}: Not available in Prisma client`);
        } else {
          console.log(`⚠️  ${model}: Error - ${error.message}`);
        }
      }
    }

    // Check actual table names vs Prisma model names
    console.log('\n📋 Database vs Prisma Client Mapping:');
    console.log('  Database tables use PascalCase (StacksEpoch)');
    console.log('  Prisma client uses camelCase (stacksEpoch)');
    console.log('  Schema defines: StacksEpoch (should generate stacksEpoch)');

  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStacksTables();

