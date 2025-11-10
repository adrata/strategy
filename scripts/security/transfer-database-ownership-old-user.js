#!/usr/bin/env node

/**
 * Transfer Database Ownership Script (Using Old Owner Credentials)
 * 
 * This version connects as the old owner to transfer ownership to the new user
 * You'll need to provide the old owner's credentials
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function transferOwnership() {
  console.log('🔄 DATABASE OWNERSHIP TRANSFER');
  console.log('==============================\n');
  console.log('⚠️  This script connects as the OLD owner to transfer ownership\n');

  const oldUsername = await question('Old owner username (e.g., neondb_owner): ');
  const oldPassword = await question('Old owner password: ');
  const host = await question('Database host (default: ep-patient-mountain-adnc9mz6-pooler.c-2.us-east-1.aws.neon.tech): ') || 'ep-patient-mountain-adnc9mz6-pooler.c-2.us-east-1.aws.neon.tech';
  const database = 'neondb';
  const newOwner = await question('New owner username (e.g., adrata_app_2025): ');

  const oldUsernameTrimmed = oldUsername.trim();
  const oldPasswordTrimmed = oldPassword.trim();
  const newOwnerTrimmed = newOwner.trim();
  const hostTrimmed = host.trim();

  if (!oldUsernameTrimmed || !oldPasswordTrimmed || !newOwnerTrimmed) {
    console.error('❌ ERROR: All fields are required');
    rl.close();
    process.exit(1);
  }

  const oldDatabaseUrl = `postgresql://${oldUsernameTrimmed}:${oldPasswordTrimmed}@${hostTrimmed}/${database}?sslmode=require&channel_binding=require`;

  console.log(`\n⚠️  WARNING: This will transfer ownership of '${database}' from '${oldUsernameTrimmed}' to '${newOwnerTrimmed}'`);
  const confirm = await question('Are you sure? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('\n❌ Operation cancelled');
    rl.close();
    process.exit(0);
  }

  console.log('\n🔄 Transferring ownership...\n');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: oldDatabaseUrl
      }
    }
  });

  try {
    await prisma.$connect();
    console.log(`✅ Connected as ${oldUsernameTrimmed}`);

    // Transfer database ownership
    console.log(`\n1. Transferring database ownership to ${newOwnerTrimmed}...`);
    await prisma.$executeRawUnsafe(`ALTER DATABASE ${database} OWNER TO ${newOwnerTrimmed};`);
    console.log('   ✅ Database ownership transferred');

    // Grant all privileges
    console.log(`\n2. Granting all privileges to ${newOwnerTrimmed}...`);
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON DATABASE ${database} TO ${newOwnerTrimmed};`);
    console.log('   ✅ Database privileges granted');

    // Grant schema privileges
    console.log(`\n3. Granting schema privileges...`);
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO ${newOwnerTrimmed};`);
    console.log('   ✅ Schema privileges granted');

    // Grant table privileges
    console.log(`\n4. Granting table privileges...`);
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${newOwnerTrimmed};`);
    console.log('   ✅ Table privileges granted');

    // Grant sequence privileges
    console.log(`\n5. Granting sequence privileges...`);
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${newOwnerTrimmed};`);
    console.log('   ✅ Sequence privileges granted');

    // Set default privileges for future objects
    console.log(`\n6. Setting default privileges for future objects...`);
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${newOwnerTrimmed};`);
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${newOwnerTrimmed};`);
    console.log('   ✅ Default privileges set');

    console.log('\n✅ OWNERSHIP TRANSFER COMPLETE!');
    console.log(`\n📝 Summary:`);
    console.log(`   - Database: ${database}`);
    console.log(`   - Old owner: ${oldUsernameTrimmed}`);
    console.log(`   - New owner: ${newOwnerTrimmed}`);
    console.log(`   - All privileges granted`);
    console.log(`\n💡 You can now safely delete the old user (${oldUsernameTrimmed})`);

  } catch (error) {
    console.error('\n❌ Error transferring ownership:');
    console.error(`   ${error.message}`);
    console.error(`\n💡 Troubleshooting:`);
    console.error(`   1. Verify the old owner credentials are correct`);
    console.error(`   2. Ensure the new owner username exists: ${newOwnerTrimmed}`);
    console.error(`   3. Check that you have sufficient privileges`);
    console.error(`\n💡 Alternative: Do this manually in Neon Console SQL Editor as the admin/owner`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

transferOwnership().catch(error => {
  console.error('❌ Unexpected error:', error);
  rl.close();
  process.exit(1);
});

