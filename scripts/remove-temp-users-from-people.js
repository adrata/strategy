/**
 * Remove Temp Users from People Table
 * These users (Victoria, Justin, Judy, Hilary) should only exist as users, not as people records
 * This prevents them from showing up in speedrun and other prospect views
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const WORKSPACE_SLUG = 'top-temp';
const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

// Temp users - these should NOT have people records
const TEMP_USER_EMAILS = [
  'temp-victoria@top-temp.com',
  'temp-justin@top-temp.com',
  'temp-judy@top-temp.com',
  'temp-hilary@top-temp.com'
];

class RemoveTempUsersFromPeople {
  constructor() {
    this.workspace = null;
    this.stats = {
      peopleFound: [],
      peopleDeleted: 0,
      usersVerified: []
    };
  }

  async execute() {
    try {
      console.log('🧹 REMOVING TEMP USERS FROM PEOPLE TABLE\n');
      console.log('='.repeat(60));

      // Step 1: Get workspace
      await this.getWorkspace();

      // Step 2: Verify temp users exist in users table
      await this.verifyTempUsers();

      // Step 3: Find and delete people records for temp users
      await this.findAndDeletePeopleRecords();

      // Summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async getWorkspace() {
    console.log('\n🏢 Getting workspace...');
    this.workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!this.workspace) {
      // Fallback to ID lookup
      this.workspace = await prisma.workspaces.findUnique({
        where: { id: TOP_TEMP_WORKSPACE_ID }
      });
    }

    if (!this.workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    console.log(`✅ Found workspace: ${this.workspace.name} (${this.workspace.id})\n`);
  }

  async verifyTempUsers() {
    console.log('👥 Verifying temp users exist in users table...\n');

    for (const email of TEMP_USER_EMAILS) {
      const user = await prisma.users.findUnique({
        where: { email: email },
        select: {
          id: true,
          name: true,
          email: true,
          username: true
        }
      });

      if (user) {
        this.stats.usersVerified.push(user);
        console.log(`   ✅ Found user: ${user.name} (${user.email})`);
      } else {
        console.log(`   ⚠️  User not found: ${email}`);
      }
    }

    console.log(`\n✅ Verified ${this.stats.usersVerified.length} temp users\n`);
  }

  async findAndDeletePeopleRecords() {
    console.log('👤 Finding people records for temp users...\n');

    // Find all people records with temp user emails
    const peopleRecords = await prisma.people.findMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null,
        OR: [
          { email: { in: TEMP_USER_EMAILS, mode: 'insensitive' } },
          { workEmail: { in: TEMP_USER_EMAILS, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`   Found ${peopleRecords.length} people records for temp users\n`);

    if (peopleRecords.length === 0) {
      console.log('   ℹ️  No people records found - temp users are already clean!\n');
      return;
    }

    for (const person of peopleRecords) {
      try {
        console.log(`   🗑️  Deleting people record: ${person.fullName} (${person.email || person.workEmail}) - Company: ${person.company?.name || 'N/A'}`);
        this.stats.peopleFound.push({
          name: person.fullName,
          email: person.email || person.workEmail,
          company: person.company?.name || 'N/A',
          id: person.id
        });

        // Soft delete the people record
        await prisma.people.update({
          where: { id: person.id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });

        this.stats.peopleDeleted++;
      } catch (error) {
        console.error(`   ❌ Error deleting people record ${person.fullName}:`, error.message);
      }
    }

    console.log(`\n✅ Deleted ${this.stats.peopleDeleted} people records for temp users\n`);
  }

  printSummary() {
    console.log('='.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`Workspace: ${this.workspace.name} (${this.workspace.slug})`);
    console.log(`Temp users verified: ${this.stats.usersVerified.length}`);
    console.log(`People records deleted: ${this.stats.peopleDeleted}`);

    if (this.stats.usersVerified.length > 0) {
      console.log(`\n✅ Temp Users (preserved as users only):`);
      this.stats.usersVerified.forEach((user, idx) => {
        console.log(`   ${idx + 1}. ${user.name} (${user.email})`);
      });
    }

    if (this.stats.peopleFound.length > 0) {
      console.log(`\n🗑️  Deleted People Records:`);
      this.stats.peopleFound.forEach((person, idx) => {
        console.log(`   ${idx + 1}. ${person.name} (${person.email}) - ${person.company}`);
      });
    }

    console.log(`\n✅ Temp users now exist ONLY as users, not as people records`);
    console.log(`   They will NOT appear in speedrun or prospect views`);
    console.log('='.repeat(60));
    console.log('✅ Cleanup complete!\n');
  }
}

// Run the cleanup
if (require.main === module) {
  const cleanup = new RemoveTempUsersFromPeople();
  cleanup.execute()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = RemoveTempUsersFromPeople;

