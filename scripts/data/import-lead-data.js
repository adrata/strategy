#!/usr/bin/env node

/**
 * Lead Data Import Script for Adrata CRM
 * Supports multi-environment deployment with separate databases
 *
 * Usage:
 *   node import-lead-data.js development    # Import to development database
 *   node import-lead-data.js staging        # Import to staging database
 *   node import-lead-data.js demo           # Import to demo database
 *   node import-lead-data.js sandbox        # Import to sandbox database
 *   node import-lead-data.js production     # Import to production database
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multi-environment configuration
const ENVIRONMENTS = {
  development: {
    name: "Development",
    workspaceId: "c854dff0-27db-4e79-a47b-787b0618a353",
    userId: "6e90c006-12e3-4c4e-84fb-94cc2383585a",
    description: "Local development environment",
  },
  staging: {
    name: "Staging",
    workspaceId: "c854dff0-27db-4e79-a47b-787b0618a353",
    userId: "6e90c006-12e3-4c4e-84fb-94cc2383585a",
    description: "Pre-production staging environment",
  },
  demo: {
    name: "Demo",
    workspaceId: "c854dff0-27db-4e79-a47b-787b0618a353",
    userId: "6e90c006-12e3-4c4e-84fb-94cc2383585a",
    description: "Client demonstration environment",
  },
  sandbox: {
    name: "Sandbox",
    workspaceId: "c854dff0-27db-4e79-a47b-787b0618a353",
    userId: "6e90c006-12e3-4c4e-84fb-94cc2383585a",
    description: "Experimental sandbox environment",
  },
  production: {
    name: "Production",
    workspaceId: "6c224ee0-2484-4af1-ab42-918e4546e0f0",
    userId: "2feca06d-5e57-4eca-b44e-0947f755a930",
    description: "Live production environment",
  },
};

// Get environment from command line argument
const environment = process.argv[2];
if (!environment || !ENVIRONMENTS[environment]) {
  console.error(
    "❌ Please specify environment: development, staging, demo, sandbox, or production",
  );
  console.error(
    "Usage: node import-lead-data.js [development|staging|demo|sandbox|production]",
  );
  process.exit(1);
}

const config = ENVIRONMENTS[environment];
console.log(`🚀 Starting import to ${config.name} environment...`);

// Load environment-specific DATABASE_URL
async function loadDatabaseURL() {
  try {
    const envFile = path.join(__dirname, `../.env.${environment}`);
    const envContent = await fs.readFile(envFile, "utf-8");
    const dbUrlMatch = envContent.match(/^DATABASE_URL="(.+)"$/m);

    if (!dbUrlMatch) {
      throw new Error(`DATABASE_URL not found in .env.${environment}`);
    }

    return dbUrlMatch[1];
  } catch (error) {
    console.error(
      `❌ Could not load DATABASE_URL for ${environment}:`,
      error.message,
    );
    console.error(
      `Make sure .env.${environment} exists and contains DATABASE_URL`,
    );
    process.exit(1);
  }
}

// Initialize Prisma with environment-specific database URL
async function initializePrisma() {
  const databaseUrl = await loadDatabaseURL();
  console.log(`🔗 Using database: ${databaseUrl.split("@")[1]}`); // Hide credentials

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

// Smart qualification scoring algorithm
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
      break; // Only apply highest matching role
    }
  }

  // Title-based scoring
  const titleText = (lead.title || "").toLowerCase();
  for (const [keyword, points] of Object.entries(roleKeywords)) {
    if (titleText.includes(keyword)) {
      score += Math.floor(points * 0.7); // Slightly lower weight for title vs role
      break;
    }
  }

  // Company size bonus (enterprise companies)
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
  const usStates = ["california", "new york", "texas", "florida", "illinois"];
  const location = (lead.location || "").toLowerCase();
  if (
    location.includes("united states") ||
    usStates.some((state) => location.includes(state))
  ) {
    score += 5;
  }

  return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
}

// Map stage from CSV to our CRM stages
function mapStage(csvStage) {
  const stageMap = {
    Generate: "Generate",
    Initiate: "Initiate",
    Educate: "Educate",
  };
  return stageMap[csvStage] || "Generate";
}

// Determine buyer persona based on role and title
function determineBuyerPersona(lead) {
  const roleText = (lead.role || "").toLowerCase();
  const titleText = (lead.title || "").toLowerCase();
  const combinedText = `${roleText} ${titleText}`.toLowerCase();

  // Decision Maker patterns
  if (
    combinedText.match(
      /cro|chief revenue|chief sales|vp.*sales|vice president.*sales|svp.*sales/,
    )
  ) {
    return "Decision Maker";
  }

  // Champion patterns (senior individual contributors and mid-level managers)
  if (
    combinedText.match(
      /director|head of|senior.*manager|strategic|enterprise.*sales|account.*executive/,
    )
  ) {
    return "Champion";
  }

  // Stakeholder patterns (everyone else in sales org)
  if (
    combinedText.match(/manager|representative|specialist|coordinator|analyst/)
  ) {
    return "Stakeholder";
  }

  // Default based on CSV role field
  return lead.role || "Stakeholder";
}

async function parseCSV(filePath) {
  console.log(`📖 Reading CSV file: ${filePath}`);

  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

  console.log(
    `📊 Found ${lines.length - 1} records with headers:`,
    headers.slice(0, 5),
    "...",
  );

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
    values.push(current.trim()); // Add the last value

    // Create lead object
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
    .map((csvLead, index) => {
      // Validate that we have minimum required data
      const hasName = csvLead.name || csvLead.Name;
      const hasEmail = csvLead.Email && csvLead.Email.includes("@");
      const hasCompany = csvLead.company;

      // Skip rows that don't have at least a name AND (email OR company)
      if (!hasName || (!hasEmail && !hasCompany)) {
        console.log(
          `⚠️  Skipping row ${index + 1}: Insufficient data (name: "${hasName}", email: "${csvLead.Email}", company: "${csvLead.company}")`,
        );
        return null;
      }

      // Build location string
      const locationParts = [
        csvLead.City,
        csvLead.State,
        csvLead.Country,
      ].filter(Boolean);
      const location = locationParts.join(", ");

      const transformed = {
        // Basic Info - no fallback to "Unknown Person" since we validated above
        name: (csvLead.name || csvLead.Name).trim(),
        title: csvLead.Title || null,
        email: csvLead.Email || null,
        phone:
          csvLead["Mobile Phone"] ||
          csvLead["Work Phone"] ||
          csvLead["Other Phone"] ||
          null,
        company: csvLead.company || null,

        // CRM Status
        status: mapStage(csvLead.stage || "Generate"),
        source: "CSV Import - Lead Data Full",

        // Classification
        buyerGroupRole: determineBuyerPersona(csvLead),
        relationship: "Cold", // Default for new imports

        // Additional fields
        notes: csvLead.status ? `Import Status: ${csvLead.status}` : null,

        // Person record data (for master person table)
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

      // Calculate qualification score
      const qualificationScore = calculateQualificationScore({
        ...transformed,
        role: csvLead.role,
        linkedinUrl: csvLead["Person Linkedin Url"],
        location: location,
      });

      // Add ranking note
      if (transformed.notes) {
        transformed.notes += ` | Qualification Score: ${qualificationScore}/100`;
      } else {
        transformed.notes = `Qualification Score: ${qualificationScore}/100`;
      }

      return { ...transformed, qualificationScore };
    })
    .filter(Boolean); // Remove null entries from skipped rows

  console.log(
    `✅ Validated and transformed ${transformedLeads.length} leads (skipped ${csvLeads.length - transformedLeads.length} invalid rows)`,
  );

  // Sort by qualification score (highest first)
  transformedLeads.sort((a, b) => b.qualificationScore - a.qualificationScore);

  return transformedLeads;
}

async function importLeads(leads) {
  console.log(`📥 Starting database import of ${leads.length} leads...`);

  let personCount = 0;
  let leadCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    console.log(
      `📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leads.length / batchSize)} (${batch.length} records)...`,
    );

    for (const lead of batch) {
      try {
        await prisma.$transaction(async (tx) => {
          let personId = null;

          // Create or find Person record first
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
              // Optionally update existing person with new data
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

          // Create Lead record
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

          // Check if lead already exists
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
            // No email, create anyway
            await tx.lead.create({ data: leadData });
            leadCount++;
          }
        });
      } catch (error) {
        errorCount++;
        errors.push({
          lead: lead.name,
          email: lead.email,
          error: error.message,
        });
        console.error(`❌ Error importing ${lead.name}: ${error.message}`);
      }
    }

    // Progress update
    const processed = Math.min(i + batchSize, leads.length);
    console.log(`✅ Processed ${processed}/${leads.length} records`);
  }

  return { personCount, leadCount, errorCount, errors };
}

async function generateReport(leads, results) {
  console.log("\n📊 IMPORT SUMMARY REPORT");
  console.log("=".repeat(50));
  console.log(`Environment: ${config.name}`);
  console.log(`Workspace ID: ${config.workspaceId}`);
  console.log(`User ID: ${config.userId}`);
  console.log(`Total Records Processed: ${leads.length}`);
  console.log(`People Created/Updated: ${results.personCount}`);
  console.log(`Leads Created/Updated: ${results.leadCount}`);
  console.log(`Errors: ${results.errorCount}`);

  if (results.errors.length > 0) {
    console.log("\n❌ ERRORS:");
    results.errors.slice(0, 10).forEach((error) => {
      console.log(`  • ${error.lead} (${error.email}): ${error.error}`);
    });
    if (results.errors.length > 10) {
      console.log(`  ... and ${results.errors.length - 10} more errors`);
    }
  }

  // Company analysis
  const companies = leads.reduce((acc, lead) => {
    const company = lead.company || "Unknown";
    acc[company] = (acc[company] || 0) + 1;
    return acc;
  }, {});

  const topCompanies = Object.entries(companies)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  console.log("\n🏢 TOP COMPANIES:");
  topCompanies.forEach(([company, count]) => {
    console.log(`  • ${company}: ${count} leads`);
  });

  // Qualification score analysis
  const avgScore =
    leads.reduce((sum, lead) => sum + lead.qualificationScore, 0) /
    leads.length;
  const highQualityLeads = leads.filter(
    (lead) => lead.qualificationScore >= 70,
  ).length;

  console.log("\n🎯 LEAD QUALITY ANALYSIS:");
  console.log(`  Average Qualification Score: ${avgScore.toFixed(1)}/100`);
  console.log(
    `  High Quality Leads (70+): ${highQualityLeads} (${((highQualityLeads / leads.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  Top Score: ${Math.max(...leads.map((l) => l.qualificationScore))}/100`,
  );

  console.log("\n✅ Import completed successfully!");
}

async function main() {
  try {
    console.log(`🔗 Connecting to ${config.name} database...`);

    // Test database connection
    const prisma = await initializePrisma();
    await prisma.$connect();
    console.log("✅ Database connection established");

    // Verify workspace and user exist
    const workspace = await prisma.workspace.findUnique({
      where: { id: config.workspaceId },
    });

    if (!workspace) {
      throw new Error(`Workspace ${config.workspaceId} not found`);
    }

    const user = await prisma.user.findUnique({
      where: { id: config.userId },
    });

    if (!user) {
      throw new Error(`User ${config.userId} not found`);
    }

    console.log(`✅ Verified workspace: ${workspace.name}`);
    console.log(`✅ Verified user: ${user.name || user.email}`);

    // Parse CSV data
    const csvPath = path.join(__dirname, "lead-data-full.csv");
    const csvLeads = await parseCSV(csvPath);

    // Transform data
    const transformedLeads = await transformLeadData(csvLeads);

    // Import to database
    const results = await importLeads(transformedLeads);

    // Generate report
    await generateReport(transformedLeads, results);
  } catch (error) {
    console.error("❌ Import failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
