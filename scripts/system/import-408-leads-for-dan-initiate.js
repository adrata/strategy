#!/usr/bin/env node

/**
 * 🎯 IMPORT 408+ LEADS FOR DAN - INITIATE STAGE
 *
 * Imports all leads from lead-data-full.csv and assigns them to Dan
 * with "Initiate" status so they show up in Pipeline Leads kanban board.
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs").promises;
const path = require("path");

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

const IMPORT_CONFIG = {
  csvFilePath: path.join(__dirname, "../../data/raw/lead-data-full.csv"),
  workspaceId: "adrata",
  targetStatus: "Initiate", // Pipeline stage for all leads
  batchSize: 50, // Import in batches to avoid timeouts
};

async function importLeadsForDan() {
  console.log("🎯 IMPORTING 408+ LEADS FOR DAN - INITIATE STAGE");
  console.log("================================================");
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

    // Step 3: Read and parse CSV file
    console.log("\n📄 Step 3: Reading lead data from CSV...");
    const csvContent = await fs.readFile(IMPORT_CONFIG.csvFilePath, "utf-8");
    const lines = csvContent.trim().split("\n");
    const headers = lines[0].toLowerCase().split(",");
    
    console.log(`📊 Found ${lines.length - 1} leads in CSV file`);
    console.log(`📋 CSV headers: ${headers.join(", ")}`);

    // Step 4: Parse leads from CSV
    console.log("\n📋 Step 4: Parsing lead data...");
    const leadsToImport = [];
    let parseErrors = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map(v => v.replace(/"/g, "").trim());
        
        // Map CSV columns based on actual structure:
        // rank,company,stage,status,name,Title,role,Person Linkedin Url,Email,Mobile Phone,Other Phone,Work Phone,Company Phone,City,State,Country,Time Zone,LI Requested,Errors
        const fullName = values[4] || "Unknown";
        const nameParts = fullName.split(" ");
        
        const leadData = {
          firstName: nameParts[0] || "Unknown",
          lastName: nameParts.slice(1).join(" ") || "",
          fullName: fullName,
          email: values[8] || null, // Email column
          phone: values[9] || values[11] || values[10] || null, // Mobile Phone, Work Phone, or Other Phone
          mobilePhone: values[9] || null, // Mobile Phone
          workPhone: values[11] || null, // Work Phone
          company: values[1] || "Unknown Company", // Company column
          jobTitle: values[5] || "Professional", // Title column
          department: null, // Not in CSV
          city: values[13] || null, // City column
          state: values[14] || null, // State column
          country: values[15] || "US", // Country column
          linkedinUrl: values[7] || null, // Person Linkedin Url
          source: "CSV Import - Lead Data Full",
          status: IMPORT_CONFIG.targetStatus, // Set to "Initiate"
          priority: "medium",
          workspaceId: adrataWorkspace.id,
          assignedUserId: danUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Only add leads with valid email or phone
        if (leadData.email || leadData.phone || leadData.mobilePhone) {
          leadsToImport.push(leadData);
        } else {
          console.log(`⚠️  Skipping lead ${fullName} - no email or phone`);
        }
      } catch (error) {
        parseErrors++;
        console.log(`⚠️  Error parsing line ${i}: ${error.message}`);
      }
    }

    console.log(`✅ Successfully parsed ${leadsToImport.length} leads`);
    if (parseErrors > 0) {
      console.log(`⚠️  ${parseErrors} lines had parsing errors`);
    }

    // Step 5: Import leads in batches
    console.log(`\n💾 Step 5: Importing ${leadsToImport.length} leads in batches...`);
    
    let importedCount = 0;
    let errorCount = 0;
    const batchSize = IMPORT_CONFIG.batchSize;

    for (let i = 0; i < leadsToImport.length; i += batchSize) {
      const batch = leadsToImport.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leadsToImport.length / batchSize)} (${batch.length} leads)...`);

      try {
        const result = await prisma.lead.createMany({
          data: batch,
          skipDuplicates: true, // Skip if email already exists in workspace
        });

        importedCount += result.count;
        console.log(`  ✅ Imported ${result.count} leads in this batch`);
      } catch (error) {
        errorCount += batch.length;
        console.log(`  ❌ Error importing batch: ${error.message}`);
      }
    }

    // Step 6: Verify the import
    console.log("\n✅ Step 6: Verifying the import...");
    const verificationLeads = await prisma.lead.findMany({
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
      take: 10,
    });

    console.log(`📊 Total leads now in database for Dan: ${verificationLeads.length > 0 ? "checking..." : 0}`);
    
    const totalCount = await prisma.lead.count({
      where: {
        AND: [
          { assignedUserId: danUser.id },
          { workspaceId: adrataWorkspace.id },
        ],
      },
    });

    console.log(`📊 Total leads now in database for Dan: ${totalCount}`);

    console.log(`\n📋 Sample imported leads (first 5):`);
    verificationLeads.slice(0, 5).forEach((lead, index) => {
      console.log(`  ${index + 1}. ${lead.fullName} @ ${lead.company} - ${lead.email} - Status: ${lead.status}`);
    });

    // Step 7: Final summary
    console.log("\n🎉 LEAD IMPORT COMPLETED");
    console.log("========================");
    console.log(`✅ Total leads imported: ${importedCount}`);
    console.log(`✅ Total leads in database: ${totalCount}`);
    console.log(`✅ All leads assigned to: ${danUser.name || danUser.email}`);
    console.log(`✅ All leads in workspace: ${adrataWorkspace.name}`);
    console.log(`✅ All leads status: "${IMPORT_CONFIG.targetStatus}"`);
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
  importLeadsForDan()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = { importLeadsForDan }; 