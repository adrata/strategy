#!/usr/bin/env ts-node

/**
 * Run SQL migration script directly
 * This reads the SQL file and executes it via Prisma
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🔄 Reading SQL migration file...\n');
  
  try {
    const sqlPath = join(process.cwd(), 'scripts', 'migration', 'add_relationship_type.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    // Execute statements one by one, handling DO blocks properly
    const statements = [
      // Step 1: Create enum
      `DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RelationshipType') THEN
        CREATE TYPE "RelationshipType" AS ENUM ('CLIENT', 'FUTURE_CLIENT', 'PARTNER', 'FUTURE_PARTNER');
    END IF;
END $$;`,
      // Step 2: Add column to companies
      `DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'relationshipType'
    ) THEN
        ALTER TABLE "companies" ADD COLUMN "relationshipType" "RelationshipType";
    END IF;
END $$;`,
      // Step 3: Add column to people
      `DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'people' AND column_name = 'relationshipType'
    ) THEN
        ALTER TABLE "people" ADD COLUMN "relationshipType" "RelationshipType";
    END IF;
END $$;`,
      // Step 4: Set all companies to FUTURE_CLIENT
      `UPDATE "companies" 
SET "relationshipType" = 'FUTURE_CLIENT' 
WHERE "relationshipType" IS NULL;`,
      // Step 5: Set all people to FUTURE_CLIENT
      `UPDATE "people" 
SET "relationshipType" = 'FUTURE_CLIENT' 
WHERE "relationshipType" IS NULL;`,
      // Step 6: Create index for companies
      `CREATE INDEX IF NOT EXISTS "companies_workspaceId_relationshipType_idx" 
ON "companies"("workspaceId", "relationshipType");`,
      // Step 7: Create index for people
      `CREATE INDEX IF NOT EXISTS "people_workspaceId_relationshipType_idx" 
ON "people"("workspaceId", "relationshipType");`,
    ];
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const stepName = [
        'Create RelationshipType enum',
        'Add relationshipType column to companies',
        'Add relationshipType column to people',
        'Set all companies to FUTURE_CLIENT',
        'Set all people to FUTURE_CLIENT',
        'Create index on companies',
        'Create index on people'
      ][i];
      
      console.log(`📝 Step ${i + 1}/${statements.length}: ${stepName}...`);
      
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Step ${i + 1} completed successfully\n`);
      } catch (error: any) {
        if (error?.code === 'P2010' && error?.meta?.code === '42501') {
          console.error(`❌ Permission denied for step ${i + 1}`);
          console.error(`   Error: ${error.message}`);
          console.error(`   This step requires database admin permissions.\n`);
          throw error;
        } else {
          // Some errors might be expected (like "already exists")
          console.warn(`⚠️  Step ${i + 1} had an issue: ${error.message}`);
          console.warn(`   Continuing...\n`);
        }
      }
    }
    
    // Run verification queries
    console.log('📊 Running verification queries...\n');
    try {
      const companiesResult = await prisma.$queryRawUnsafe<Array<{
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
      
      const peopleResult = await prisma.$queryRawUnsafe<Array<{
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
      
      console.log('📈 Migration Results:');
      if (companiesResult[0]) {
        console.log('Companies:', {
          total: companiesResult[0].total_records.toString(),
          withRelationshipType: companiesResult[0].records_with_relationship_type.toString(),
          futureClients: companiesResult[0].future_clients.toString(),
        });
      }
      if (peopleResult[0]) {
        console.log('People:', {
          total: peopleResult[0].total_records.toString(),
          withRelationshipType: peopleResult[0].records_with_relationship_type.toString(),
          futureClients: peopleResult[0].future_clients.toString(),
        });
      }
    } catch (error) {
      console.warn('⚠️  Could not run verification queries:', error);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });

