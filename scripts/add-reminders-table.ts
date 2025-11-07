import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addRemindersTable() {
  try {
    console.log('Creating reminders table...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "reminders" (
        "id" VARCHAR(30) NOT NULL,
        "workspaceId" VARCHAR(30) NOT NULL,
        "userId" VARCHAR(30) NOT NULL,
        "entityType" VARCHAR(20) NOT NULL,
        "entityId" VARCHAR(30) NOT NULL,
        "reminderAt" TIMESTAMP(6) NOT NULL,
        "note" TEXT,
        "isCompleted" BOOLEAN NOT NULL DEFAULT false,
        "completedAt" TIMESTAMP(6),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log('Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "reminders_workspaceId_idx" ON "reminders"("workspaceId")',
      'CREATE INDEX IF NOT EXISTS "reminders_userId_idx" ON "reminders"("userId")',
      'CREATE INDEX IF NOT EXISTS "reminders_entityType_entityId_idx" ON "reminders"("entityType", "entityId")',
      'CREATE INDEX IF NOT EXISTS "reminders_reminderAt_idx" ON "reminders"("reminderAt")',
      'CREATE INDEX IF NOT EXISTS "reminders_isCompleted_idx" ON "reminders"("isCompleted")',
      'CREATE INDEX IF NOT EXISTS "reminders_workspaceId_reminderAt_idx" ON "reminders"("workspaceId", "reminderAt")',
      'CREATE INDEX IF NOT EXISTS "reminders_workspaceId_userId_isCompleted_idx" ON "reminders"("workspaceId", "userId", "isCompleted")',
      'CREATE INDEX IF NOT EXISTS "reminders_workspaceId_entityType_entityId_idx" ON "reminders"("workspaceId", "entityType", "entityId")',
    ];

    for (const indexSql of indexes) {
      await prisma.$executeRawUnsafe(indexSql);
    }

    console.log('Adding foreign key constraints...');
    
    // Check and add foreign keys
    const fkCheck = await prisma.$queryRawUnsafe(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'reminders' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name IN ('reminders_userId_fkey', 'reminders_workspaceId_fkey');
    `) as any[];

    const existingFks = fkCheck.map((row: any) => row.constraint_name);

    if (!existingFks.includes('reminders_userId_fkey')) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "reminders" 
        ADD CONSTRAINT "reminders_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('Added userId foreign key');
    }

    if (!existingFks.includes('reminders_workspaceId_fkey')) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "reminders" 
        ADD CONSTRAINT "reminders_workspaceId_fkey" 
        FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('Added workspaceId foreign key');
    }

    console.log('✅ Reminders table created successfully!');
  } catch (error) {
    console.error('❌ Error creating reminders table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addRemindersTable();

