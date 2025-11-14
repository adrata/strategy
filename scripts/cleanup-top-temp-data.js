/**
 * Cleanup Top-Temp Data
 * Removes companies and people that are "TOP" or "top employees"
 * Keeps only the temp users (Victoria, Justin, Judy, Hilary)
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

// Temp users to keep
const TEMP_USERS = [
  { name: 'Victoria Leland', username: 'temp-victoria', email: 'temp-victoria@top-temp.com' },
  { name: 'Justin Bedard', username: 'temp-justin', email: 'temp-justin@top-temp.com' },
  { name: 'Judy Wigginton', username: 'temp-judy', email: 'temp-judy@top-temp.com' },
  { name: 'Hilary Tristan', username: 'temp-hilary', email: 'temp-hilary@top-temp.com' }
];

class TopTempCleanup {
  constructor() {
    this.workspace = null;
    this.stats = {
      companiesDeleted: 0,
      peopleDeleted: 0,
      companiesFound: [],
      peopleFound: []
    };
  }

  async execute() {
    try {
      console.log('🧹 CLEANING UP TOP-TEMP DATA\n');
      console.log('='.repeat(60));

      // Step 1: Get workspace
      await this.getWorkspace();

      // Step 2: Find and delete TOP companies
      await this.findAndDeleteTopCompanies();

      // Step 3: Find and delete people associated with TOP companies
      await this.findAndDeleteTopPeople();

      // Step 4: Find and delete people with "top employees" in their data
      await this.findAndDeleteTopEmployees();

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

  async findAndDeleteTopCompanies() {
    console.log('🏢 Finding TOP companies...\n');

    // Find companies with names matching "TOP" or "top employees" patterns
    const topCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null,
        OR: [
          { name: { equals: 'TOP', mode: 'insensitive' } },
          { name: { contains: 'top employees', mode: 'insensitive' } },
          { name: { contains: 'top employee', mode: 'insensitive' } },
          { name: { startsWith: 'TOP ', mode: 'insensitive' } },
          { name: { equals: 'Top', mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: {
            people: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    console.log(`   Found ${topCompanies.length} TOP companies to delete\n`);

    for (const company of topCompanies) {
      try {
        console.log(`   🗑️  Deleting company: ${company.name} (${company._count.people} people)`);
        this.stats.companiesFound.push({
          name: company.name,
          id: company.id,
          peopleCount: company._count.people
        });

        // Soft delete the company
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });

        this.stats.companiesDeleted++;
      } catch (error) {
        console.error(`   ❌ Error deleting company ${company.name}:`, error.message);
      }
    }

    console.log(`\n✅ Deleted ${this.stats.companiesDeleted} TOP companies\n`);
  }

  async findAndDeleteTopPeople() {
    console.log('👤 Finding people associated with TOP companies...\n');

    // First, get all TOP company IDs (including already deleted ones for completeness)
    const topCompanyIds = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspace.id,
        OR: [
          { name: { equals: 'TOP', mode: 'insensitive' } },
          { name: { contains: 'top employees', mode: 'insensitive' } },
          { name: { contains: 'top employee', mode: 'insensitive' } },
          { name: { startsWith: 'TOP ', mode: 'insensitive' } },
          { name: { equals: 'Top', mode: 'insensitive' } }
        ]
      },
      select: { id: true }
    });

    const topCompanyIdList = topCompanyIds.map(c => c.id);

    if (topCompanyIdList.length === 0) {
      console.log('   ℹ️  No TOP companies found, skipping people deletion\n');
      return;
    }

    // Find people associated with TOP companies
    const topPeople = await prisma.people.findMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null,
        companyId: { in: topCompanyIdList }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`   Found ${topPeople.length} people associated with TOP companies\n`);

    for (const person of topPeople) {
      try {
        console.log(`   🗑️  Deleting person: ${person.fullName} (${person.email}) - Company: ${person.company?.name || 'N/A'}`);
        this.stats.peopleFound.push({
          name: person.fullName,
          email: person.email,
          company: person.company?.name || 'N/A',
          id: person.id
        });

        // Soft delete the person
        await prisma.people.update({
          where: { id: person.id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });

        this.stats.peopleDeleted++;
      } catch (error) {
        console.error(`   ❌ Error deleting person ${person.fullName}:`, error.message);
      }
    }

    console.log(`\n✅ Deleted ${this.stats.peopleDeleted} people associated with TOP companies\n`);
  }

  async findAndDeleteTopEmployees() {
    console.log('👤 Finding people with "top employees" in their data...\n');

    // Find people with "top employees" or "top employee" in their name, email, or job title
    const topEmployeePeople = await prisma.people.findMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null,
        OR: [
          { fullName: { contains: 'top employees', mode: 'insensitive' } },
          { fullName: { contains: 'top employee', mode: 'insensitive' } },
          { email: { contains: 'top employees', mode: 'insensitive' } },
          { email: { contains: 'top employee', mode: 'insensitive' } },
          { jobTitle: { contains: 'top employees', mode: 'insensitive' } },
          { jobTitle: { contains: 'top employee', mode: 'insensitive' } },
          // Also check for people whose name is just "TOP"
          { fullName: { equals: 'TOP', mode: 'insensitive' } },
          { firstName: { equals: 'TOP', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`   Found ${topEmployeePeople.length} people with "top employees" in their data\n`);

    for (const person of topEmployeePeople) {
      try {
        // Skip if this person was already deleted in the previous step
        if (this.stats.peopleFound.some(p => p.id === person.id)) {
          continue;
        }

        console.log(`   🗑️  Deleting person: ${person.fullName} (${person.email}) - Title: ${person.jobTitle || 'N/A'}`);
        this.stats.peopleFound.push({
          name: person.fullName,
          email: person.email,
          company: person.company?.name || 'N/A',
          jobTitle: person.jobTitle || 'N/A',
          id: person.id
        });

        // Soft delete the person
        await prisma.people.update({
          where: { id: person.id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });

        this.stats.peopleDeleted++;
      } catch (error) {
        console.error(`   ❌ Error deleting person ${person.fullName}:`, error.message);
      }
    }

    console.log(`\n✅ Deleted ${this.stats.peopleDeleted} people with "top employees" data\n`);
  }

  printSummary() {
    console.log('='.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`Workspace: ${this.workspace.name} (${this.workspace.slug})`);
    console.log(`Companies deleted: ${this.stats.companiesDeleted}`);
    console.log(`People deleted: ${this.stats.peopleDeleted}`);
    console.log(`Total records deleted: ${this.stats.companiesDeleted + this.stats.peopleDeleted}`);

    if (this.stats.companiesFound.length > 0) {
      console.log(`\n🏢 Deleted Companies:`);
      this.stats.companiesFound.forEach((company, idx) => {
        console.log(`   ${idx + 1}. ${company.name} (${company.peopleCount} people)`);
      });
    }

    if (this.stats.peopleFound.length > 0 && this.stats.peopleFound.length <= 50) {
      console.log(`\n👤 Deleted People (showing first 50):`);
      this.stats.peopleFound.slice(0, 50).forEach((person, idx) => {
        console.log(`   ${idx + 1}. ${person.name} (${person.email}) - ${person.company}`);
      });
      if (this.stats.peopleFound.length > 50) {
        console.log(`   ... and ${this.stats.peopleFound.length - 50} more`);
      }
    } else if (this.stats.peopleFound.length > 50) {
      console.log(`\n👤 Deleted ${this.stats.peopleFound.length} people (too many to list)`);
    }

    console.log(`\n✅ Temp users preserved:`);
    TEMP_USERS.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    console.log('='.repeat(60));
    console.log('✅ Cleanup complete!\n');
  }
}

// Run the cleanup
if (require.main === module) {
  const cleanup = new TopTempCleanup();
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

module.exports = TopTempCleanup;

