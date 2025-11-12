#!/usr/bin/env ts-node

/**
 * Safe migration script to add relationshipType field
 * Sets all existing companies and people to FUTURE_CLIENT
 * 
 * Usage: npx ts-node scripts/migration/run-add-relationship-type.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addRelationshipType() {
  console.log('🔄 Starting migration: Add relationshipType field...\n');

  try {
    // Step 1: Create enum if it doesn't exist
    console.log('📝 Step 1: Creating RelationshipType enum...');
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RelationshipType') THEN
              CREATE TYPE "RelationshipType" AS ENUM ('CLIENT', 'FUTURE_CLIENT', 'PARTNER', 'FUTURE_PARTNER');
          END IF;
      END $$;
    `);
    console.log('✅ RelationshipType enum created/verified\n');

    // Step 2: Add column to companies if it doesn't exist
    console.log('📝 Step 2: Adding relationshipType column to companies...');
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'companies' AND column_name = 'relationshipType'
          ) THEN
              ALTER TABLE "companies" ADD COLUMN "relationshipType" "RelationshipType";
          END IF;
      END $$;
    `);
    console.log('✅ Column added to companies table\n');

    // Step 3: Add column to people if it doesn't exist
    console.log('📝 Step 3: Adding relationshipType column to people...');
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'people' AND column_name = 'relationshipType'
          ) THEN
              ALTER TABLE "people" ADD COLUMN "relationshipType" "RelationshipType";
          END IF;
      END $$;
    `);
    console.log('✅ Column added to people table\n');

    // Step 4: Set all companies to FUTURE_CLIENT
    console.log('📝 Step 4: Setting all companies to FUTURE_CLIENT...');
    const companiesUpdated = await prisma.$executeRawUnsafe(`
      UPDATE "companies" 
      SET "relationshipType" = 'FUTURE_CLIENT' 
      WHERE "relationshipType" IS NULL;
    `);
    console.log(`✅ Updated ${companiesUpdated} companies\n`);

    // Step 5: Set all people to FUTURE_CLIENT
    console.log('📝 Step 5: Setting all people to FUTURE_CLIENT...');
    const peopleUpdated = await prisma.$executeRawUnsafe(`
      UPDATE "people" 
      SET "relationshipType" = 'FUTURE_CLIENT' 
      WHERE "relationshipType" IS NULL;
    `);
    console.log(`✅ Updated ${peopleUpdated} people\n`);

    // Step 6: Create indexes
    console.log('📝 Step 6: Creating indexes...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "companies_workspaceId_relationshipType_idx" 
      ON "companies"("workspaceId", "relationshipType");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "people_workspaceId_relationshipType_idx" 
      ON "people"("workspaceId", "relationshipType");
    `);
    console.log('✅ Indexes created\n');

    // Verify the changes
    console.log('📊 Verification:');
    const companiesStats = await prisma.$queryRawUnsafe<Array<{
      table_name: string;
      total_records: bigint;
      records_with_relationship_type: bigint;
      future_clients: bigint;
    }>>(`
      SELECT 
          'companies' as table_name,
          COUNT(*)::bigint as total_records,
          COUNT("relationshipType")::bigint as records_with_relationship_type,
          COUNT(CASE WHEN "relationshipType" = 'FUTURE_CLIENT' THEN 1 END)::bigint as future_clients
      FROM "companies";
    `);

    const peopleStats = await prisma.$queryRawUnsafe<Array<{
      table_name: string;
      total_records: bigint;
      records_with_relationship_type: bigint;
      future_clients: bigint;
    }>>(`
      SELECT 
          'people' as table_name,
          COUNT(*)::bigint as total_records,
          COUNT("relationshipType")::bigint as records_with_relationship_type,
          COUNT(CASE WHEN "relationshipType" = 'FUTURE_CLIENT' THEN 1 END)::bigint as future_clients
      FROM "people";
    `);

    console.log('\n📈 Migration Results:');
    console.log('Companies:', {
      total: companiesStats[0]?.total_records.toString(),
      withRelationshipType: companiesStats[0]?.records_with_relationship_type.toString(),
      futureClients: companiesStats[0]?.future_clients.toString(),
    });
    console.log('People:', {
      total: peopleStats[0]?.total_records.toString(),
      withRelationshipType: peopleStats[0]?.records_with_relationship_type.toString(),
      futureClients: peopleStats[0]?.future_clients.toString(),
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('💡 All companies and people are now set to FUTURE_CLIENT');
    console.log('💡 You can now update individual records to CLIENT, PARTNER, or FUTURE_PARTNER as needed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addRelationshipType()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });

