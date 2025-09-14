#!/usr/bin/env node

/**
 * Multi-Environment Lead Data Seeder for Adrata
 * Seeds all database environments with comprehensive lead data
 *
 * Usage:
 *   node import-all-environments.js              # Import to all environments
 *   node import-all-environments.js staging demo # Import to specific environments
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multi-environment configuration for all deployment targets
const ENVIRONMENTS = {
  development: {
    name: "Development",
    databaseUrl:
      process.env.DEV_DATABASE_URL ||
      "postgresql://rosssylvester:Themill08!@localhost:5432/magic",
    workspaceId: "c854dff0-27db-4e79-a47b-787b0618a353",
    userId: "6e90c006-12e3-4c4e-84fb-94cc2383585a",
    description: "Local development database",
  },
  staging: {
    name: "Staging",
    databaseUrl:
      process.env.STAGING_DATABASE_URL ||
      process.env.DEV_DATABASE_URL ||
      "postgresql://rosssylvester:Themill08!@localhost:5432/magic",
    workspaceId: "c854dff0-27db-4e79-a47b-787b0618a353",
    userId: "6e90c006-12e3-4c4e-84fb-94cc2383585a",
    description: "Pre-production staging environment",
  },
  demo: {
    name: "Demo",
    databaseUrl:
      process.env.DEMO_DATABASE_URL ||
      process.env.DEV_DATABASE_URL ||
      "postgresql://rosssylvester:Themill08!@localhost:5432/magic",
    workspaceId: "c854dff0-27db-4e79-a47b-787b0618a353",
    userId: "6e90c006-12e3-4c4e-84fb-94cc2383585a",
    description: "Client demo environment",
  },
  sandbox: {
    name: "Sandbox",
    databaseUrl:
      process.env.SANDBOX_DATABASE_URL ||
      process.env.DEV_DATABASE_URL ||
      "postgresql://rosssylvester:Themill08!@localhost:5432/magic",
    workspaceId: "c854dff0-27db-4e79-a47b-787b0618a353",
    userId: "6e90c006-12e3-4c4e-84fb-94cc2383585a",
    description: "Experimental sandbox environment",
  },
  production: {
    name: "Production",
    databaseUrl:
      process.env.PROD_DATABASE_URL ||
      "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require",
    workspaceId: "6c224ee0-2484-4af1-ab42-918e4546e0f0",
    userId: "2feca06d-5e57-4eca-b44e-0947f755a930",
    description: "Live production environment",
  },
};

// Get environments from command line arguments or default to all
const requestedEnvironments = process.argv.slice(2);
const environmentsToProcess =
  requestedEnvironments.length > 0
    ? requestedEnvironments.filter((env) => ENVIRONMENTS[env])
    : Object.keys(ENVIRONMENTS);

console.log(`🚀 Starting multi-environment lead import...`);
console.log(`📋 Target environments: ${environmentsToProcess.join(", ")}`);

// Smart qualification scoring algorithm (enhanced)
function calculateQualificationScore(lead) {
  let score = 0;

  // Base score for having essential contact info
  if (lead.email) score += 10;
  if (lead.phone) score += 5;
  if (lead.linkedinUrl) score += 5;

  // Role-based scoring (higher for decision makers)
  const roleKeywords = {
    cro: 25,
    "chief revenue": 25,
    "chief sales": 25,
    cso: 25,
    vp: 20,
    "vice president": 20,
    svp: 22,
    director: 15,
    "head of": 15,
    manager: 10,
    rep: 5,
    representative: 5,
    specialist: 5,
  };

  const roleText = (lead.role || "").toLowerCase();
  for (const [keyword, points] of Object.entries(roleKeywords)) {
    if (roleText.includes(keyword)) {
      score += points;
      break;
    }
  }

  // Title-based scoring
  const titleText = (lead.title || "").toLowerCase();
  for (const [keyword, points] of Object.entries(roleKeywords)) {
    if (titleText.includes(keyword)) {
      score += Math.floor(points * 0.7);
      break;
    }
  }

  // Enterprise company bonus
  const enterpriseCompanies = [
    "microsoft",
    "google",
    "amazon",
    "apple",
    "meta",
    "salesforce",
    "adobe",
    "workday",
    "snowflake",
    "datadog",
    "splunk",
    "okta",
    "atlassian",
    "asana",
    "box",
    "cisco",
    "twilio",
    "zoom",
  ];

  const companyName = (lead.company || "").toLowerCase();
  if (
    enterpriseCompanies.some((enterprise) => companyName.includes(enterprise))
  ) {
    score += 15;
  }

  // Activity/engagement bonus
  if (lead.status === "Intro call or demo booked or held") score += 20;
  else if (lead.status === "Called") score += 10;
  else if (lead.status === "Incorrect company/phone data") score -= 5;

  // Geography bonus (US/English speaking)
  const location = (lead.location || "").toLowerCase();
  if (location.includes("united states")) score += 5;

  return Math.min(Math.max(score, 0), 100);
}

// Determine buyer persona based on role and title
function determineBuyerPersona(lead) {
  const roleText = (lead.role || "").toLowerCase();
  const titleText = (lead.title || "").toLowerCase();
  const combinedText = `${roleText} ${titleText}`.toLowerCase();

  if (
    combinedText.match(
      /cro|chief revenue|chief sales|vp.*sales|vice president.*sales|svp.*sales/,
    )
  ) {
    return "Decision Maker";
  }

  if (
    combinedText.match(
      /director|head of|senior.*manager|strategic|enterprise.*sales|account.*executive/,
    )
  ) {
    return "Champion";
  }

  return "Stakeholder";
}

async function parseCSV(filePath) {
  console.log(`📖 Reading CSV file: ${filePath}`);

  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

  console.log(`📊 Found ${lines.length - 1} records`);

  const leads = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const lead = {};
    headers.forEach((header, index) => {
      lead[header] = values[index] || "";
    });

    leads.push(lead);
  }

  return leads;
}

async function transformLeadData(csvLeads) {
  console.log(`🔄 Transforming ${csvLeads.length} leads...`);

  const transformedLeads = csvLeads
    .map((csvLead) => {
      const hasName = csvLead.name || csvLead.Name;
      const hasEmail = csvLead.Email && csvLead.Email.includes("@");
      const hasCompany = csvLead.company;

      if (!hasName || (!hasEmail && !hasCompany)) {
        return null;
      }

      const locationParts = [
        csvLead.City,
        csvLead.State,
        csvLead.Country,
      ].filter(Boolean);
      const location = locationParts.join(", ");

      const transformed = {
        name: (csvLead.name || csvLead.Name).trim(),
        title: csvLead.Title || null,
        email: csvLead.Email || null,
        phone:
          csvLead["Mobile Phone"] ||
          csvLead["Work Phone"] ||
          csvLead["Other Phone"] ||
          null,
        company: csvLead.company || null,
        status: "Generate",
        source: "CSV Import - Lead Data Full",
        buyerGroupRole: determineBuyerPersona(csvLead),
        relationship: "Cold",
        notes: csvLead.status ? `Import Status: ${csvLead.status}` : null,

        personData: {
          firstName: (csvLead.name || csvLead.Name).split(" ")[0],
          lastName:
            (csvLead.name || csvLead.Name).split(" ").slice(1).join(" ") ||
            "Unknown",
          fullName: (csvLead.name || csvLead.Name).trim(),
          name: (csvLead.name || csvLead.Name).trim(),
          email: csvLead.Email || null,
          phone:
            csvLead["Mobile Phone"] ||
            csvLead["Work Phone"] ||
            csvLead["Other Phone"] ||
            null,
          title: csvLead.Title || null,
          role: csvLead.role || null,
          linkedinUrl: csvLead["Person Linkedin Url"] || null,
          location: location || null,
          timezone: csvLead["Time Zone"] || null,
          dataSource: "import",
          isVerified: false,
          gdprConsent: false,
        },
      };

      const qualificationScore = calculateQualificationScore({
        ...transformed,
        role: csvLead.role,
        linkedinUrl: csvLead["Person Linkedin Url"],
        location: location,
      });

      if (transformed.notes) {
        transformed.notes += ` | Qualification Score: ${qualificationScore}/100`;
      } else {
        transformed.notes = `Qualification Score: ${qualificationScore}/100`;
      }

      return { ...transformed, qualificationScore };
    })
    .filter(Boolean);

  transformedLeads.sort((a, b) => b.qualificationScore - a.qualificationScore);

  console.log(`✅ Validated and transformed ${transformedLeads.length} leads`);
  return transformedLeads;
}

async function importToEnvironment(environmentKey, leads) {
  const config = ENVIRONMENTS[environmentKey];
  console.log(`\n📥 Importing to ${config.name} environment...`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
  });

  try {
    await prisma.$connect();
    console.log(`✅ Connected to ${config.name} database`);

    // Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: config.workspaceId },
    });

    if (!workspace) {
      console.log(`⚠️ Workspace not found in ${config.name}, skipping...`);
      return { skipped: true, reason: "Workspace not found" };
    }

    let personCount = 0;
    let leadCount = 0;
    let errorCount = 0;

    const batchSize = 25; // Smaller batches for multi-environment processing
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);

      for (const lead of batch) {
        try {
          await prisma.$transaction(async (tx) => {
            let personId = null;

            if (lead.personData.email) {
              const existingPerson = await tx.person.findUnique({
                where: {
                  email_workspaceId: {
                    email: lead.personData.email,
                    workspaceId: config.workspaceId,
                  },
                },
              });

              if (existingPerson) {
                personId = existingPerson.id;
                await tx.person.update({
                  where: { id: existingPerson.id },
                  data: {
                    ...lead.personData,
                    updatedAt: new Date(),
                  },
                });
              } else {
                const person = await tx.person.create({
                  data: {
                    ...lead.personData,
                    workspaceId: config.workspaceId,
                    createdBy: config.userId,
                  },
                });
                personId = person.id;
                personCount++;
              }
            }

            const leadData = {
              name: lead.name,
              title: lead.title,
              email: lead.email,
              phone: lead.phone,
              company: lead.company,
              status: lead.status,
              source: lead.source,
              buyerGroupRole: lead.buyerGroupRole,
              relationship: lead.relationship,
              notes: lead.notes,
              workspaceId: config.workspaceId,
              createdBy: config.userId,
              assignedTo: config.userId,
              assignedAt: new Date(),
            };

            if (personId) {
              leadData.personId = personId;
            }

            if (lead.email) {
              const existingLead = await tx.lead.findUnique({
                where: {
                  email_workspaceId: {
                    email: lead.email,
                    workspaceId: config.workspaceId,
                  },
                },
              });

              if (existingLead) {
                await tx.lead.update({
                  where: { id: existingLead.id },
                  data: {
                    ...leadData,
                    updatedAt: new Date(),
                  },
                });
              } else {
                await tx.lead.create({ data: leadData });
                leadCount++;
              }
            } else {
              await tx.lead.create({ data: leadData });
              leadCount++;
            }
          });
        } catch (error) {
          errorCount++;
          if (errorCount <= 3) {
            // Only log first few errors
            console.error(`❌ Error in ${config.name}: ${error.message}`);
          }
        }
      }

      // Progress update
      const processed = Math.min(i + batchSize, leads.length);
      if (processed % 100 === 0 || processed === leads.length) {
        console.log(
          `   📊 ${config.name}: ${processed}/${leads.length} processed`,
        );
      }
    }

    return { personCount, leadCount, errorCount, skipped: false };
  } catch (error) {
    console.error(`❌ Failed to import to ${config.name}: ${error.message}`);
    return { skipped: true, reason: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    console.log("🔍 Validating environments...");

    // Validate requested environments
    const invalidEnvironments = environmentsToProcess.filter(
      (env) => !ENVIRONMENTS[env],
    );
    if (invalidEnvironments.length > 0) {
      throw new Error(
        `Invalid environments: ${invalidEnvironments.join(", ")}`,
      );
    }

    // Parse CSV data
    const csvPath = path.join(__dirname, "lead-data-full.csv");
    const csvLeads = await parseCSV(csvPath);

    // Transform data
    const transformedLeads = await transformLeadData(csvLeads);

    console.log(
      `\n🎯 Processing ${transformedLeads.length} leads across ${environmentsToProcess.length} environments...`,
    );

    // Import to each environment
    const results = {};
    for (const environmentKey of environmentsToProcess) {
      results[environmentKey] = await importToEnvironment(
        environmentKey,
        transformedLeads,
      );
    }

    // Generate summary report
    console.log("\n📊 MULTI-ENVIRONMENT IMPORT SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Leads Processed: ${transformedLeads.length}`);
    console.log(`Environments Targeted: ${environmentsToProcess.length}`);

    let totalPersons = 0;
    let totalLeads = 0;
    let totalErrors = 0;
    let skippedCount = 0;

    for (const [env, result] of Object.entries(results)) {
      const config = ENVIRONMENTS[env];
      if (result.skipped) {
        console.log(`\n❌ ${config.name}: SKIPPED (${result.reason})`);
        skippedCount++;
      } else {
        console.log(`\n✅ ${config.name}: SUCCESS`);
        console.log(`   People: ${result.personCount} created/updated`);
        console.log(`   Leads: ${result.leadCount} created/updated`);
        console.log(`   Errors: ${result.errorCount}`);

        totalPersons += result.personCount;
        totalLeads += result.leadCount;
        totalErrors += result.errorCount;
      }
    }

    console.log("\n🎉 OVERALL TOTALS:");
    console.log(
      `   Successful Environments: ${environmentsToProcess.length - skippedCount}/${environmentsToProcess.length}`,
    );
    console.log(`   Total People Created/Updated: ${totalPersons}`);
    console.log(`   Total Leads Created/Updated: ${totalLeads}`);
    console.log(`   Total Errors: ${totalErrors}`);

    // Quality analysis
    const avgScore =
      transformedLeads.reduce((sum, lead) => sum + lead.qualificationScore, 0) /
      transformedLeads.length;
    const highQualityLeads = transformedLeads.filter(
      (lead) => lead.qualificationScore >= 70,
    ).length;

    console.log("\n🎯 LEAD QUALITY ANALYSIS:");
    console.log(`   Average Qualification Score: ${avgScore.toFixed(1)}/100`);
    console.log(
      `   High Quality Leads (70+): ${highQualityLeads} (${((highQualityLeads / transformedLeads.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   Top Score: ${Math.max(...transformedLeads.map((l) => l.qualificationScore))}/100`,
    );

    console.log("\n✅ Multi-environment import completed!");
  } catch (error) {
    console.error("❌ Multi-environment import failed:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
