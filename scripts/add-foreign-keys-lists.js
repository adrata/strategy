const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addForeignKeys() {
  try {
    console.log('Adding foreign key constraints to lists table...');
    
    // Try to add foreign keys using a simpler approach
    // First check if constraints already exist
    const existingConstraints = await prisma.$queryRawUnsafe(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conname IN ('lists_userId_fkey', 'lists_workspaceId_fkey')
    `);
    
    console.log('Existing constraints:', existingConstraints);
    
    // Try adding foreign keys one at a time
    try {
      // Check if userId foreign key exists
      const userIdExists = await prisma.$queryRawUnsafe(`
        SELECT 1 FROM pg_constraint WHERE conname = 'lists_userId_fkey'
      `);
      
      if (!userIdExists || (Array.isArray(userIdExists) && userIdExists.length === 0)) {
        console.log('Adding userId foreign key...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "lists" 
          ADD CONSTRAINT "lists_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
        `);
        console.log('✅ Added userId foreign key');
      } else {
        console.log('✅ userId foreign key already exists');
      }
    } catch (error) {
      console.log('⚠️  Could not add userId foreign key:', error.message);
    }
    
    try {
      // Check if workspaceId foreign key exists
      const workspaceIdExists = await prisma.$queryRawUnsafe(`
        SELECT 1 FROM pg_constraint WHERE conname = 'lists_workspaceId_fkey'
      `);
      
      if (!workspaceIdExists || (Array.isArray(workspaceIdExists) && workspaceIdExists.length === 0)) {
        console.log('Adding workspaceId foreign key...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "lists" 
          ADD CONSTRAINT "lists_workspaceId_fkey" 
          FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE;
        `);
        console.log('✅ Added workspaceId foreign key');
      } else {
        console.log('✅ workspaceId foreign key already exists');
      }
    } catch (error) {
      console.log('⚠️  Could not add workspaceId foreign key:', error.message);
    }
    
    console.log('\n🎉 Foreign key addition attempt complete!');
    console.log('Note: If foreign keys could not be added due to permissions,');
    console.log('the application will still work correctly. Foreign keys are for data integrity only.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addForeignKeys();

