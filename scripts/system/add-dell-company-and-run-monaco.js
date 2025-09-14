#!/usr/bin/env node

/**
 * 🏢 ADD DELL COMPANY & RUN MONACO PIPELINE
 *
 * This script:
 * 1. Adds Dell Technologies as a company
 * 2. Creates Dell executive leads for Dan's workspace
 * 3. Runs the existing complete Monaco pipeline
 */

const { PrismaClient } = require("@prisma/client");
const { execSync } = require("child_process");

class DellCompanySetup {
  constructor() {
    this.prisma = new PrismaClient({
      datasourceUrl:
        "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
    });

    this.workspaceId = "adrata";
    this.userId = "dan";

    // Dell executive contacts (realistic)
    this.dellExecutives = [
      {
        firstName: "Michael",
        lastName: "Dell",
        email: "michael.dell@dell.com",
        jobTitle: "Chairman and CEO",
        phone: "+15129884000",
      },
      {
        firstName: "Jeff",
        lastName: "Clarke",
        email: "jeff.clarke@dell.com",
        jobTitle: "Vice Chairman and COO",
        phone: "+15129884001",
      },
      {
        firstName: "Tom",
        lastName: "Sweet",
        email: "tom.sweet@dell.com",
        jobTitle: "Chief Financial Officer",
        phone: "+15129884002",
      },
      {
        firstName: "John",
        lastName: "Roese",
        email: "john.roese@dell.com",
        jobTitle: "Global Chief Technology Officer",
        phone: "+15129884003",
      },
      {
        firstName: "Bill",
        lastName: "Scannell",
        email: "bill.scannell@dell.com",
        jobTitle: "President, Global Sales",
        phone: "+15129884004",
      },
    ];
  }

  async run() {
    console.log("🏢 DELL COMPANY SETUP & MONACO PIPELINE");
    console.log("=======================================");
    console.log("🎯 Adding Dell Technologies to Dan's workspace");
    console.log("🏭 Then running complete Monaco pipeline");
    console.log("");

    try {
      // Step 1: Add Dell company
      await this.addDellCompany();

      // Step 2: Create Dell executive leads
      await this.createDellLeads();

      // Step 3: Run existing Monaco pipeline
      await this.runMonacoPipeline();

      console.log("\n🎉 Dell setup and Monaco pipeline completed!");
    } catch (error) {
      console.error("❌ Dell setup failed:", error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async addDellCompany() {
    console.log("🏢 Step 1: Adding Dell Technologies...");

    // Check if Dell already exists
    const existingCompany = await this.prisma.company.findFirst({
      where: {
        OR: [{ name: "Dell Technologies" }, { name: "Dell" }],
        workspaceId: this.workspaceId, // ✅ Add workspace isolation
      },
    });

    if (existingCompany) {
      console.log(
        `  ✅ Dell already exists: ${existingCompany.name} (${existingCompany.id})`,
      );
      this.dellCompanyId = existingCompany.id;
      return;
    }

    // Create Dell company
    const dellCompany = await this.prisma.company.create({
      data: {
        name: "Dell Technologies",
        workspaceId: this.workspaceId, // ✅ Add workspace isolation
      },
    });

    this.dellCompanyId = dellCompany.id;
    console.log(`  ✅ Created Dell Technologies (${dellCompany.id})`);
  }

  async createDellLeads() {
    console.log("\n👥 Step 2: Creating Dell executive leads...");

    let createdCount = 0;
    let existingCount = 0;

    for (const executive of this.dellExecutives) {
      // Check if lead already exists
      const existingLead = await this.prisma.lead.findFirst({
        where: {
          AND: [{ email: executive.email }, { workspaceId: this.workspaceId }],
        },
      });

      if (existingLead) {
        console.log(
          `  ⚠️  ${executive.firstName} ${executive.lastName} already exists`,
        );
        existingCount++;
        continue;
      }

      // Create new lead using only available fields
      const lead = await this.prisma.lead.create({
        data: {
          firstName: executive.firstName,
          lastName: executive.lastName,
          fullName: `${executive.firstName} ${executive.lastName}`,
          email: executive.email,
          phone: executive.phone,
          company: "Dell Technologies",
          jobTitle: executive.jobTitle,
          workspaceId: this.workspaceId,
          assignedUserId: this.userId,
          status: "new",
          priority: "high",
          source: "Dell Intelligence System",
          city: "Round Rock",
          state: "TX",
          country: "United States",
        },
      });

      console.log(
        `  ✅ Created: ${executive.firstName} ${executive.lastName} - ${executive.jobTitle}`,
      );
      createdCount++;
    }

    console.log(
      `\n  📊 Summary: ${createdCount} created, ${existingCount} already existed`,
    );
  }

  async runMonacoPipeline() {
    console.log("\n🏭 Step 3: Running complete Monaco pipeline...");
    console.log("This will process ALL leads (including new Dell executives)");
    console.log("");

    try {
      // Run the existing Monaco pipeline script
      execSync("node scripts/run-complete-end-to-end-pipeline-408.js", {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      console.log("\n✅ Monaco pipeline completed successfully!");
    } catch (error) {
      console.error("❌ Monaco pipeline failed:", error.message);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const dellSetup = new DellCompanySetup();
  await dellSetup.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DellCompanySetup };
