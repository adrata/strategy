#!/usr/bin/env node

/**
 * Fix Ownership Transfer - Grant necessary privileges first
 * 
 * This script grants the necessary privileges so ownership can be transferred
 */

const { PrismaClient } = require('@prisma/client');

// Use the old owner credentials to grant privileges
const OLD_DATABASE_URL = 'postgresql://neondb_owner:npg_hsBrlzEb2G8Y@ep-patient-mountain-adnc9mz6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const NEW_OWNER = 'adrata_app_2025';

async function fixOwnershipTransfer() {
  console.log('🔧 FIXING OWNERSHIP TRANSFER');
  console.log('=============================\n');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: OLD_DATABASE_URL
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('✅ Connected as neondb_owner\n');

    // Step 1: Grant CREATEROLE to allow role operations
    console.log('1. Granting CREATEROLE privilege...');
    try {
      await prisma.$executeRawUnsafe(`ALTER USER ${NEW_OWNER} WITH CREATEROLE;`);
      console.log('   ✅ CREATEROLE granted');
    } catch (error) {
      console.log(`   ⚠️  CREATEROLE grant: ${error.message}`);
    }

    // Step 2: Grant the user to the current owner (allows SET ROLE)
    console.log('\n2. Granting user to current owner...');
    try {
      await prisma.$executeRawUnsafe(`GRANT ${NEW_OWNER} TO neondb_owner;`);
      console.log('   ✅ User granted to owner');
    } catch (error) {
      console.log(`   ⚠️  Grant user: ${error.message}`);
    }

    // Step 3: Try alternative - use ALTER DATABASE with explicit owner
    console.log('\n3. Attempting ownership transfer...');
    try {
      await prisma.$executeRawUnsafe(`ALTER DATABASE neondb OWNER TO ${NEW_OWNER};`);
      console.log('   ✅ Database ownership transferred!');
    } catch (error) {
      console.log(`   ❌ Transfer failed: ${error.message}`);
      throw error;
    }

    // Step 4: Grant all privileges
    console.log('\n4. Granting all privileges...');
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON DATABASE neondb TO ${NEW_OWNER};`);
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO ${NEW_OWNER};`);
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${NEW_OWNER};`);
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${NEW_OWNER};`);
    console.log('   ✅ All privileges granted');

    // Step 5: Set default privileges
    console.log('\n5. Setting default privileges...');
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${NEW_OWNER};`);
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${NEW_OWNER};`);
    console.log('   ✅ Default privileges set');

    console.log('\n✅ OWNERSHIP TRANSFER COMPLETE!');
    console.log(`\n📝 Database 'neondb' is now owned by '${NEW_OWNER}'`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Alternative: You may need to do this as a superuser in Neon Console');
    console.error('   Or contact Neon support to transfer ownership');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixOwnershipTransfer().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

