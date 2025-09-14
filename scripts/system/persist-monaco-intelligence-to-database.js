#!/usr/bin/env node

/**
 * 🗄️ PERSIST MONACO INTELLIGENCE TO DATABASE
 *
 * Takes the Monaco pipeline intelligence data from JSON files
 * and persists it to the database records for permanent storage.
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs").promises;
const path = require("path");

class MonacoIntelligencePersister {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = "adrata";
    this.userId = "dan";
    this.results = {
      leadsUpdated: 0,
      personsCreated: 0,
      companiesCreated: 0,
      enrichmentRecorded: 0,
      errors: [],
    };
  }

  async run() {
    console.log("🗄️ PERSISTING MONACO INTELLIGENCE TO DATABASE");
    console.log("==============================================");
    console.log(`🎯 Target: Save all 408 leads' intelligence to database`);
    console.log("");

    try {
      // Step 1: Load intelligence data
      const intelligenceData = await this.loadIntelligenceData();

      // Step 2: Create/update database records
      await this.persistToDatabase(intelligenceData);

      // Step 3: Verify persistence
      await this.verifyPersistence();

      console.log(
        "\n🎉 Monaco intelligence successfully persisted to database!",
      );
    } catch (error) {
      console.error("❌ Failed to persist intelligence:", error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async loadIntelligenceData() {
    console.log("📂 Loading Monaco intelligence data...");

    const intelligencePath =
      "./monaco-enrichment-output/monaco-intelligence-complete.json";

    try {
      const intelligenceJson = await fs.readFile(intelligencePath, "utf8");
      const intelligence = JSON.parse(intelligenceJson);

      const leadIds = Object.keys(intelligence);
      console.log(`  ✅ Loaded intelligence for ${leadIds.length} leads`);

      return intelligence;
    } catch (error) {
      throw new Error(`Failed to load intelligence data: ${error.message}`);
    }
  }

  async persistToDatabase(intelligenceData) {
    console.log("\n🗄️ Persisting intelligence to database...");

    const leadIds = Object.keys(intelligenceData);
    const batchSize = 25;
    const totalBatches = Math.ceil(leadIds.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batch = leadIds.slice(
        batchIndex * batchSize,
        (batchIndex + 1) * batchSize,
      );
      const progress = Math.round(((batchIndex + 1) / totalBatches) * 100);

      console.log(
        `\n📦 Batch ${batchIndex + 1}/${totalBatches} (${progress}%) - Processing ${batch.length} leads...`,
      );

      for (const leadId of batch) {
        try {
          const intelligence = intelligenceData[leadId];
          await this.persistSingleLead(leadId, intelligence);
          this.results.leadsUpdated++;
        } catch (error) {
          console.error(`  ❌ Failed to persist ${leadId}: ${error.message}`);
          this.results.errors.push({ leadId, error: error.message });
        }
      }
    }

    console.log(`\n🎯 Persistence Complete:`);
    console.log(`  ✅ Leads Updated: ${this.results.leadsUpdated}`);
    console.log(`  👤 Persons Created: ${this.results.personsCreated}`);
    console.log(`  🏢 Companies Created: ${this.results.companiesCreated}`);
    console.log(`  ❌ Errors: ${this.results.errors.length}`);
  }

  async persistSingleLead(leadId, intelligence) {
    // First, get the existing lead
    const existingLead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    // Update the lead with enrichment data
    await this.updateLeadWithIntelligence(leadId, intelligence);

    // Create or update Person record
    await this.createOrUpdatePerson(leadId, intelligence, existingLead);

    // Create or update Company record (if we have access)
    await this.createOrUpdateCompany(intelligence);
  }

  async updateLeadWithIntelligence(leadId, intelligence) {
    // Prepare enrichment data for Lead table
    const enrichmentData = {
      // Add custom fields with Monaco intelligence
      customFields: {
        monacoEnrichment: {
          enrichedAt: intelligence.enrichedAt,
          scores: intelligence.scores,
          buyer: intelligence.buyer,
          opportunity: intelligence.opportunity,
          version: "2.0",
        },
      },

      // Update notes with intelligence summary
      notes: this.generateEnrichmentNotes(intelligence),

      // Update priority based on Monaco scoring
      priority: this.mapPriorityFromScores(intelligence.scores),

      // Update status if needed
      status: this.suggestStatusFromIntelligence(intelligence),

      updatedAt: new Date(),
    };

    await this.prisma.lead.update({
      where: { id: leadId },
      data: enrichmentData,
    });
  }

  async createOrUpdatePerson(leadId, intelligence, existingLead) {
    try {
      // Check if Person already exists
      let person = await this.prisma.person.findFirst({
        where: {
          workspaceId: this.workspaceId,
          email: existingLead.email,
        },
      });

      const personData = {
        workspaceId: this.workspaceId,
        firstName:
          existingLead.firstName || intelligence.person.name.split(" ")[0],
        lastName:
          existingLead.lastName ||
          intelligence.person.name.split(" ").slice(1).join(" "),
        fullName: intelligence.person.name,
        email: existingLead.email,
        phone: existingLead.phone,
        jobTitle: intelligence.person.title,
        company: intelligence.company.name,
        department: intelligence.person.department,

        // Monaco intelligence fields
        influence: intelligence.person.influence,
        seniority: intelligence.person.seniority,
        skills: intelligence.person.skills,
        painPoints: intelligence.person.painPoints,
        motivations: intelligence.person.motivations,

        // Buyer intelligence
        buyerRole: intelligence.buyer.role,
        decisionPower: intelligence.person.decisionPower,
        budget: intelligence.buyer.budget,
        timeline: intelligence.buyer.timeline,

        // Metadata
        dataSource: "monaco_enrichment",
        enrichmentScore: intelligence.scores.overall,
        lastEnriched: new Date(),
      };

      if (person) {
        // Update existing person
        await this.prisma.person.update({
          where: { id: person.id },
          data: personData,
        });
      } else {
        // Create new person
        person = await this.prisma.person.create({
          data: personData,
        });
        this.results.personsCreated++;
      }

      // Link lead to person
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { personId: person.id },
      });
    } catch (error) {
      console.warn(
        `  ⚠️ Could not create/update Person for ${leadId}: ${error.message}`,
      );
    }
  }

  async createOrUpdateCompany(intelligence) {
    try {
      // Check if Company table exists and is accessible
      const companyData = {
        workspaceId: this.workspaceId,
        name: intelligence.company.name,
        industry: intelligence.company.industry,
        size: intelligence.company.size,
        revenue: intelligence.company.revenue,
        techStack: intelligence.company.techStack,
        competitors: JSON.stringify(intelligence.company.competitors),
        marketPosition: intelligence.company.marketPosition,
        dataSource: "monaco_enrichment",
        lastEnriched: new Date(),
      };

      // Try to find existing company
      let company = await this.prisma.company.findFirst({
        where: {
          workspaceId: this.workspaceId,
          name: intelligence.company.name,
        },
      });

      if (company) {
        await this.prisma.company.update({
          where: { id: company.id },
          data: companyData,
        });
      } else {
        await this.prisma.company.create({
          data: companyData,
        });
        this.results.companiesCreated++;
      }
    } catch (error) {
      // Company table might not be accessible, skip silently
      console.warn(`  ⚠️ Could not create/update Company: ${error.message}`);
    }
  }

  generateEnrichmentNotes(intelligence) {
    const notes = [];

    notes.push(
      `🧠 MONACO INTELLIGENCE (${new Date().toISOString().split("T")[0]})`,
    );
    notes.push(
      `📊 Overall Score: ${intelligence.scores.overall}% | Priority: ${intelligence.scores.priority}`,
    );
    notes.push(
      `👤 ${intelligence.person.seniority} | Influence: ${Math.round(intelligence.person.influence * 100)}%`,
    );
    notes.push(
      `🏢 ${intelligence.company.industry} | Size: ${intelligence.company.size}`,
    );
    notes.push(
      `💰 Budget: ${intelligence.buyer.budget} | Timeline: ${intelligence.buyer.timeline}`,
    );
    notes.push(`🎯 Approach: ${intelligence.opportunity.approach}`);
    notes.push(`🔍 Pain Points: ${intelligence.person.painPoints}`);
    notes.push(
      `💡 Next Actions: ${intelligence.opportunity.nextActions.join(", ")}`,
    );

    return notes.join("\n");
  }

  mapPriorityFromScores(scores) {
    switch (scores.priority) {
      case "Critical":
        return "high";
      case "High":
        return "high";
      case "Medium":
        return "medium";
      case "Low":
        return "low";
      default:
        return "medium";
    }
  }

  suggestStatusFromIntelligence(intelligence) {
    // Suggest status based on scores and intelligence
    if (intelligence.scores.overall > 70) return "qualified";
    if (intelligence.scores.overall > 50) return "contacted";
    return "new";
  }

  async verifyPersistence() {
    console.log("\n🔍 Verifying data persistence...");

    try {
      // Check updated leads
      const enrichedLeads = await this.prisma.lead.count({
        where: {
          workspaceId: this.workspaceId,
          customFields: {
            path: ["monacoEnrichment"],
            not: null,
          },
        },
      });

      // Check created persons
      const monacoPersons = await this.prisma.person.count({
        where: {
          workspaceId: this.workspaceId,
          dataSource: "monaco_enrichment",
        },
      });

      console.log(`  ✅ Leads with Monaco enrichment: ${enrichedLeads}`);
      console.log(`  ✅ Persons from Monaco: ${monacoPersons}`);

      // Sample verification
      const sampleLead = await this.prisma.lead.findFirst({
        where: {
          workspaceId: this.workspaceId,
          customFields: {
            path: ["monacoEnrichment"],
            not: null,
          },
        },
        include: {
          Person: true,
        },
      });

      if (sampleLead) {
        console.log(`\n📋 Sample enriched lead: ${sampleLead.fullName}`);
        console.log(`  🎯 Priority: ${sampleLead.priority}`);
        console.log(
          `  📊 Monaco Score: ${sampleLead.customFields?.monacoEnrichment?.scores?.overall || "N/A"}`,
        );
        console.log(`  👤 Linked Person: ${sampleLead.Person ? "Yes" : "No"}`);
      }
    } catch (error) {
      console.warn(`⚠️ Verification limited: ${error.message}`);
    }
  }
}

// Execute the persistence
async function main() {
  try {
    const persister = new MonacoIntelligencePersister();
    await persister.run();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ MONACO INTELLIGENCE PERSISTENCE FAILED");
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MonacoIntelligencePersister;
