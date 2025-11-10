#!/usr/bin/env node

/**
 * Transfer Database Ownership Script
 * 
 * Transfers ownership of the database from old user to new user
 * Run this after credential rotation to complete the ownership transfer
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

  // Allow custom connection string via environment variable or use default
  const databaseUrl = process.env.OWNER_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable is required');
    console.log('\nSet DATABASE_URL in your .env file or as an environment variable');
    console.log('Or use OWNER_DATABASE_URL to connect as the current owner (neondb_owner)');
    rl.close();
    process.exit(1);
  }
  
  if (process.env.OWNER_DATABASE_URL) {
    console.log('📝 Using OWNER_DATABASE_URL to connect as current owner');
  }

  // Extract current user from connection string
  const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):/);
  const currentUser = urlMatch ? urlMatch[1] : null;

  console.log('📋 Current Connection Info:');
  console.log(`   User: ${currentUser || 'unknown'}`);
  console.log(`   Database: neondb\n`);

  // Allow username from command line argument or prompt
  const newOwnerArg = process.argv[2];
  let newOwnerTrimmed;
  
  if (newOwnerArg) {
    newOwnerTrimmed = newOwnerArg.trim();
    console.log(`📝 Using new owner from command line: ${newOwnerTrimmed}`);
  } else {
    const newOwner = await question('Enter the new owner username (e.g., adrata_app_2025): ');
    newOwnerTrimmed = newOwner.trim();
  }

  if (!newOwnerTrimmed) {
    console.error('❌ ERROR: Username is required');
    console.log('\nUsage: node scripts/security/transfer-database-ownership.js <new_owner_username>');
    rl.close();
    process.exit(1);
  }

  // Skip confirmation if run from command line with argument
  if (!newOwnerArg) {
    console.log(`\n⚠️  WARNING: This will transfer ownership of 'neondb' to '${newOwnerTrimmed}'`);
    const confirm = await question('Are you sure? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Operation cancelled');
      rl.close();
      process.exit(0);
    }
  } else {
    console.log(`\n⚠️  WARNING: This will transfer ownership of 'neondb' to '${newOwnerTrimmed}'`);
  }

  console.log('\n🔄 Transferring ownership...\n');

  // Use Prisma to execute raw SQL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    // First, ensure the new owner role exists and grant necessary privileges
    console.log(`\n1. Ensuring new owner role exists and has necessary privileges...`);
    try {
      // Try to grant CREATEROLE to current user if needed (may fail, that's ok)
      await prisma.$executeRawUnsafe(`ALTER USER ${currentUser} WITH CREATEROLE;`);
      console.log('   ✅ Granted CREATEROLE to current user');
    } catch (e) {
      console.log('   ⚠️  Could not grant CREATEROLE (may already have it or insufficient privileges)');
    }

    // Transfer database ownership
    console.log(`\n2. Transferring database ownership to ${newOwnerTrimmed}...`);
    await prisma.$executeRawUnsafe(`ALTER DATABASE neondb OWNER TO ${newOwnerTrimmed};`);
    console.log('   ✅ Database ownership transferred');

    // Grant all privileges
    console.log(`\n3. Granting all privileges to ${newOwnerTrimmed}...`);
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON DATABASE neondb TO ${newOwnerTrimmed};`);
    console.log('   ✅ Database privileges granted');

    // Grant schema privileges
    console.log(`\n4. Granting schema privileges...`);
    await prisma.$executeRawUnsafe(`GRANT ALL ON SCHEMA public TO ${newOwnerTrimmed};`);
    console.log('   ✅ Schema privileges granted');

    // Grant table privileges
    console.log(`\n5. Granting table privileges...`);
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${newOwnerTrimmed};`);
    console.log('   ✅ Table privileges granted');

    // Grant sequence privileges
    console.log(`\n6. Granting sequence privileges...`);
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${newOwnerTrimmed};`);
    console.log('   ✅ Sequence privileges granted');

    // Set default privileges for future objects
    console.log(`\n7. Setting default privileges for future objects...`);
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${newOwnerTrimmed};`);
    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${newOwnerTrimmed};`);
    console.log('   ✅ Default privileges set');

    console.log('\n✅ OWNERSHIP TRANSFER COMPLETE!');
    console.log(`\n📝 Summary:`);
    console.log(`   - Database: neondb`);
    console.log(`   - New owner: ${newOwnerTrimmed}`);
    console.log(`   - All privileges granted`);
    console.log(`\n💡 You can now safely delete the old user (neondb_owner) if desired`);

  } catch (error) {
    console.error('\n❌ Error transferring ownership:');
    console.error(`   ${error.message}`);
    console.error(`\n💡 Troubleshooting:`);
    console.error(`   1. Ensure you're connected as a user with sufficient privileges`);
    console.error(`   2. Verify the new owner username is correct`);
    console.error(`   3. Check that the new user exists in Neon Console`);
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

