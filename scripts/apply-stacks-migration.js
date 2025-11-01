const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyStacksMigration() {
  try {
    console.log('🔧 Applying stacks migration to add missing columns...\n');

    await prisma.$executeRawUnsafe('ALTER TABLE "StacksStory" ADD COLUMN IF NOT EXISTS "viewType" VARCHAR(20)');
    console.log('✅ Added viewType column to StacksStory');
    await prisma.$executeRawUnsafe('ALTER TABLE "StacksStory" ADD COLUMN IF NOT EXISTS "product" VARCHAR(50)');
    console.log('✅ Added product column to StacksStory');
    await prisma.$executeRawUnsafe('ALTER TABLE "StacksStory" ADD COLUMN IF NOT EXISTS "section" VARCHAR(50)');
    console.log('✅ Added section column to StacksStory');

    await prisma.$executeRawUnsafe('ALTER TABLE "StacksTask" ADD COLUMN IF NOT EXISTS "product" VARCHAR(50)');
    console.log('✅ Added product column to StacksTask');

    await prisma.$executeRawUnsafe('ALTER TABLE "StacksTask" ADD COLUMN IF NOT EXISTS "section" VARCHAR(50)');
    console.log('✅ Added section column to StacksTask');

    await prisma.$executeRawUnsafe('ALTER TABLE "StacksEpic" ADD COLUMN IF NOT EXISTS "product" VARCHAR(50)');
    console.log('✅ Added product column to StacksEpic');

    await prisma.$executeRawUnsafe('ALTER TABLE "StacksEpic" ADD COLUMN IF NOT EXISTS "section" VARCHAR(50)');
    console.log('✅ Added section column to StacksEpic');

    console.log('\n✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyStacksMigration();

