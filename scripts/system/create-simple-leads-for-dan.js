#!/usr/bin/env node

/**
 * 🎯 CREATE SIMPLE LEADS FOR DAN - INITIATE STAGE
 *
 * Creates 408 basic leads for Dan with "Initiate" status to show up in Pipeline Leads.
 * Uses simple, database-compatible data to avoid column length issues.
 */

const { PrismaClient } = require("@prisma/client");

// Production database configuration
const PRODUCTION_DATABASE_URL =
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: PRODUCTION_DATABASE_URL,
    },
  },
});

const LEAD_CONFIG = {
  targetCount: 408,
  targetStatus: "Initiate",
  batchSize: 25,
};

// Sample companies and names for generating leads
const COMPANIES = [
  "Airtable", "Adobe", "Alteryx", "Amplitude", "Anaplan", "Asana", "Atlassian", "BetterUp", "Box", "Braze",
  "Carta", "Cisco", "Confluent", "Coupa", "Datadog", "DocuSign", "Domo", "Finally", "Gainsight", "GitLab",
  "Greenhouse", "Guru", "Gusto", "HashiCorp", "HG Insights", "IBM", "Iterable", "Lattice", "LeadIQ", "Lucid",
  "Microsoft", "Miro", "Mixpanel", "Okta", "Procore", "Rippling", "Segment", "ServiceTitan", "Smartsheet",
  "Snowflake", "Snyk", "Splunk", "Talkdesk", "Twilio", "UIPath", "Wix", "Workday", "Zendesk", "Zoom"
];

const FIRST_NAMES = [
  "John", "Jane", "Michael", "Sarah", "David", "Lisa", "Chris", "Emily", "James", "Jessica",
  "Robert", "Ashley", "William", "Amanda", "Daniel", "Nicole", "Matthew", "Jennifer", "Andrew", "Rachel",
  "Brian", "Stephanie", "Kevin", "Lauren", "Ryan", "Melissa", "Mark", "Rebecca", "Steven", "Katherine",
  "Jason", "Amy", "Joshua", "Samantha", "Paul", "Anna", "Justin", "Laura", "Scott", "Michelle"
];

const LAST_NAMES = [
  "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez",
  "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
  "Thompson", "White", "Harris", "Sanchez", "Clark", "Lewis", "Robinson", "Walker", "Young", "Hall",
  "Allen", "King", "Wright", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson"
];

const JOB_TITLES = [
  "Sales Manager", "Account Executive", "VP Sales", "Director Sales", "Senior Sales Rep", "Sales Director",
  "Enterprise Sales", "Regional Manager", "Sales Lead", "Business Development", "Key Account Manager",
  "Strategic Accounts", "Inside Sales Rep", "Outside Sales", "Sales Specialist", "Revenue Manager",
  "Channel Manager", "Partner Manager", "Sales Operations", "Chief Revenue Officer"
];

const CITIES = [
  "New York", "San Francisco", "Los Angeles", "Chicago", "Boston", "Seattle", "Austin", "Denver",
  "Atlanta", "Philadelphia", "Phoenix", "San Diego", "Dallas", "Houston", "Miami", "Portland",
  "Minneapolis", "Detroit", "Nashville", "Charlotte", "Tampa", "Orlando", "Columbus", "Indianapolis"
];

const STATES = [
  "NY", "CA", "IL", "MA", "WA", "TX", "CO", "GA", "PA", "AZ", "FL", "OR", "MN", "MI", "TN", "NC"
];

function generateEmail(firstName, lastName, company) {
  const cleanFirst = firstName.toLowerCase();
  const cleanLast = lastName.toLowerCase();
  const cleanCompany = company.toLowerCase().replace(/\s+/g, "");
  return `${cleanFirst}.${cleanLast}@${cleanCompany}.com`;
}

function generatePhone() {
  const area = Math.floor(Math.random() * 800) + 200;
  const first = Math.floor(Math.random() * 800) + 200;
  const last = Math.floor(Math.random() * 9000) + 1000;
  return `+1 ${area}-${first}-${last}`;
}

function generateLead(index) {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
  const jobTitle = JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const state = STATES[Math.floor(Math.random() * STATES.length)];

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: generateEmail(firstName, lastName, company),
    phone: generatePhone(),
    company,
    jobTitle,
    city,
    state,
    country: "US",
    status: LEAD_CONFIG.targetStatus,
    priority: "medium",
    source: "Generated Data",
  };
}

async function createSimpleLeadsForDan() {
  console.log("🎯 CREATING 408 SIMPLE LEADS FOR DAN - INITIATE STAGE");
  console.log("===================================================");
  console.log("");

  try {
    // Step 1: Find Dan user
    console.log("👤 Step 1: Finding Dan user...");
    const danUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: "dan@adrata.com" },
          { id: "dan" },
          { firstName: "dan" },
          { name: { contains: "dan", mode: "insensitive" } },
        ],
      },
    });

    if (!danUser) {
      throw new Error("❌ Dan user not found in production database");
    }

    console.log(`✅ Found Dan user: ${danUser.email || danUser.name} (ID: ${danUser.id})`);

    // Step 2: Find Adrata workspace
    console.log("\n🏢 Step 2: Finding Adrata workspace...");
    const adrataWorkspace = await prisma.workspace.findFirst({
      where: {
        OR: [
          { id: "adrata" },
          { slug: "adrata" },
          { name: "adrata" },
          { name: "Adrata" },
        ],
      },
    });

    if (!adrataWorkspace) {
      throw new Error("❌ Adrata workspace not found in production database");
    }

    console.log(`✅ Found Adrata workspace: ${adrataWorkspace.name} (ID: ${adrataWorkspace.id})`);

    // Step 3: Generate lead data
    console.log(`\n📋 Step 3: Generating ${LEAD_CONFIG.targetCount} leads...`);
    const leadsToCreate = [];

    for (let i = 0; i < LEAD_CONFIG.targetCount; i++) {
      const leadData = {
        ...generateLead(i),
        workspaceId: adrataWorkspace.id,
        assignedUserId: danUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      leadsToCreate.push(leadData);
    }

    console.log(`✅ Generated ${leadsToCreate.length} leads`);

    // Step 4: Create leads in batches
    console.log(`\n💾 Step 4: Creating ${leadsToCreate.length} leads in batches...`);
    
    let createdCount = 0;
    let errorCount = 0;
    const batchSize = LEAD_CONFIG.batchSize;

    for (let i = 0; i < leadsToCreate.length; i += batchSize) {
      const batch = leadsToCreate.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leadsToCreate.length / batchSize)} (${batch.length} leads)...`);

      try {
        const result = await prisma.lead.createMany({
          data: batch,
          skipDuplicates: true,
        });

        createdCount += result.count;
        console.log(`  ✅ Created ${result.count} leads in this batch`);
      } catch (error) {
        errorCount += batch.length;
        console.log(`  ❌ Error creating batch: ${error.message}`);
        
        // Try creating leads one by one to identify the issue
        for (const lead of batch) {
          try {
            await prisma.lead.create({ data: lead });
            createdCount++;
          } catch (singleError) {
            console.log(`    ❌ Failed to create lead ${lead.fullName}: ${singleError.message.substring(0, 100)}...`);
            errorCount++;
          }
        }
      }
    }

    // Step 5: Verify the creation
    console.log("\n✅ Step 5: Verifying the creation...");
    const totalCount = await prisma.lead.count({
      where: {
        AND: [
          { assignedUserId: danUser.id },
          { workspaceId: adrataWorkspace.id },
        ],
      },
    });

    const sampleLeads = await prisma.lead.findMany({
      where: {
        AND: [
          { assignedUserId: danUser.id },
          { workspaceId: adrataWorkspace.id },
        ],
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        email: true,
        status: true,
        jobTitle: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    console.log(`📊 Total leads now in database for Dan: ${totalCount}`);

    console.log(`\n📋 Sample created leads (first 5):`);
    sampleLeads.forEach((lead, index) => {
      console.log(`  ${index + 1}. ${lead.fullName} @ ${lead.company} - ${lead.email} - Status: ${lead.status}`);
    });

    // Step 6: Final summary
    console.log("\n🎉 LEAD CREATION COMPLETED");
    console.log("==========================");
    console.log(`✅ Total leads created: ${createdCount}`);
    console.log(`✅ Total leads in database: ${totalCount}`);
    console.log(`✅ All leads assigned to: ${danUser.name || danUser.email}`);
    console.log(`✅ All leads in workspace: ${adrataWorkspace.name}`);
    console.log(`✅ All leads status: "${LEAD_CONFIG.targetStatus}"`);
    console.log("");
    console.log("🚀 Your Pipeline Leads kanban board will now show:");
    console.log(`   - Generate: 0 leads`);
    console.log(`   - Initiate: ${totalCount} leads`);
    console.log(`   - Educate: 0 leads`);
    console.log("");
    console.log("Navigate to Pipeline > Leads to see your leads in the Initiate column!");

  } catch (error) {
    console.error("❌ SCRIPT FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the script
if (require.main === module) {
  createSimpleLeadsForDan()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = { createSimpleLeadsForDan }; 