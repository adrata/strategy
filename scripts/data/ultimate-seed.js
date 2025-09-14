#!/usr/bin/env node

/**
 * 🌱 ULTIMATE MULTI-ENVIRONMENT SEED SCRIPT
 * Complete solution that creates users, workspaces, and imports ALL leads
 * Handles all edge cases and ensures proper foreign key relationships
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";

const environment = process.argv[2] || "local";
console.log(`🚀 Ultimate seed for ${environment} environment...`);

// User configuration for each environment
const USER_CONFIG = {
  local: {
    id: "dan-local-user-2025",
    email: "dan@adrata.com",
    name: "Dan Sylvester",
    firstName: "Dan",
    lastName: "Sylvester",
  },
  development: {
    id: "dan-dev-user-2025",
    email: "dan@adrata.com",
    name: "Dan Sylvester",
    firstName: "Dan",
    lastName: "Sylvester",
  },
  staging: {
    id: "dan-staging-user-2025",
    email: "dan@adrata.com",
    name: "Dan Sylvester",
    firstName: "Dan",
    lastName: "Sylvester",
  },
  demo: {
    id: "dan-demo-user-2025",
    email: "dan@adrata.com",
    name: "Dan Sylvester",
    firstName: "Dan",
    lastName: "Sylvester",
  },
  sandbox: {
    id: "dan-sandbox-user-2025",
    email: "dan@adrata.com",
    name: "Dan Sylvester",
    firstName: "Dan",
    lastName: "Sylvester",
  },
  production: {
    id: "2feca06d-5e57-4eca-b44e-0947f755a930",
    email: "dan@adrata.com",
    name: "Dan Sylvester",
    firstName: "Dan",
    lastName: "Sylvester",
  },
};

// Load DATABASE_URL from environment file
async function loadDatabaseURL() {
  try {
    const envContent = await fs.readFile(`../.env.${environment}`, "utf-8");
    const dbUrlMatch = envContent.match(/^DATABASE_URL="(.+)"$/m);
    if (dbUrlMatch) {
      let url = dbUrlMatch[1];
      // Force local to use adrata-local database
      if (environment === "local") {
        url =
          "postgresql://rosssylvester:Themill08!@localhost:5432/adrata-local";
      }
      return url;
    }
    return "postgresql://rosssylvester:Themill08!@localhost:5432/adrata-local";
  } catch (error) {
    return "postgresql://rosssylvester:Themill08!@localhost:5432/adrata-local";
  }
}

// Advanced CSV parser that handles commas within quotes
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim()); // Add the last field
  return result;
}

// Smart data cleaning and validation
function cleanAndValidate(data) {
  return {
    rank: data[0]?.replace(/"/g, "").trim() || "",
    company: data[1]?.replace(/"/g, "").trim() || "",
    stage: data[2]?.replace(/"/g, "").trim() || "Generate",
    status: data[3]?.replace(/"/g, "").trim() || "new",
    name: data[4]?.replace(/"/g, "").trim() || "",
    title: data[5]?.replace(/"/g, "").trim() || "",
    role: data[6]?.replace(/"/g, "").trim() || "",
    linkedinUrl: data[7]?.replace(/"/g, "").trim() || null,
    email: data[8]?.replace(/"/g, "").trim() || "",
    mobilePhone: data[9]?.replace(/"/g, "").trim() || null,
    otherPhone: data[10]?.replace(/"/g, "").trim() || null,
    workPhone: data[11]?.replace(/"/g, "").trim() || null,
    companyPhone: data[12]?.replace(/"/g, "").trim() || null,
    city: data[13]?.replace(/"/g, "").trim() || null,
    state: data[14]?.replace(/"/g, "").trim() || null,
    country: data[15]?.replace(/"/g, "").trim() || null,
    timeZone: data[16]?.replace(/"/g, "").trim() || null,
    liRequested: data[17]?.replace(/"/g, "").trim() || null,
    errors: data[18]?.replace(/"/g, "").trim() || null,
  };
}

// Generate email if missing
function generateEmail(name, company) {
  if (!name || !company) return null;

  const firstName = name.split(" ")[0].toLowerCase();
  const lastName = name.split(" ").slice(1).join("").toLowerCase();
  const cleanCompany = company
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 10);

  return `${firstName}.${lastName}@${cleanCompany}.com`;
}

// Map role to buyer persona
function mapBuyerPersona(role, title) {
  const combined = `${role} ${title}`.toLowerCase();

  if (
    combined.match(
      /cro|chief revenue|chief sales|vp.*sales|vice president.*sales/,
    )
  ) {
    return "Decision Maker";
  } else if (combined.match(/director|head of|senior.*manager|strategic/)) {
    return "Champion";
  } else {
    return "Stakeholder";
  }
}

async function main() {
  try {
    const databaseUrl = await loadDatabaseURL();
    console.log(`🔗 Connecting to ${environment} database...`);
    console.log(`🔗 Database URL: ${databaseUrl.replace(/:[^:@]*@/, ":***@")}`);

    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });

    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Get user configuration for this environment
    const userConfig = USER_CONFIG[environment];

    // Create or ensure Dan's user exists
    console.log("👤 Setting up user...");
    let user;
    try {
      // Try to find existing user
      user = await prisma.user.findUnique({
        where: { id: userConfig.id },
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            id: userConfig.id,
            email: userConfig.email,
            name: userConfig.name,
            firstName: userConfig.firstName,
            lastName: userConfig.lastName,
            displayName: userConfig.name,
          },
        });
        console.log(`✅ Created user: ${user.name} (${user.id})`);
      } else {
        console.log(`✅ Found existing user: ${user.name} (${user.id})`);
      }
    } catch (error) {
      console.log(`⚠️ User error: ${error.message}`);
      // Try alternative approach - find by email
      try {
        user = await prisma.user.findFirst({
          where: { email: userConfig.email },
        });
        if (!user) {
          throw new Error("No user found");
        }
        console.log(`✅ Found user by email: ${user.name} (${user.id})`);
      } catch (error2) {
        console.error("❌ Could not create or find user");
        process.exit(1);
      }
    }

    // Create or find Adrata workspace
    console.log("🏢 Setting up workspace...");
    let workspace;
    try {
      workspace = await prisma.workspace.findFirst({
        where: {
          OR: [
            { name: { contains: "Adrata" } },
            { slug: { contains: "adrata" } },
          ],
        },
      });

      if (!workspace) {
        workspace = await prisma.workspace.create({
          data: {
            name: `Adrata ${environment.charAt(0).toUpperCase() + environment.slice(1)}`,
            slug: `adrata-${environment}`,
            description: `Adrata workspace for ${environment} environment`,
          },
        });
        console.log(`✅ Created workspace: ${workspace.name}`);
      } else {
        console.log(`✅ Found existing workspace: ${workspace.name}`);
      }
    } catch (error) {
      console.log(`⚠️ Workspace error: ${error.message}`);
      // Create fallback workspace
      workspace = {
        id: `adrata-workspace-${environment}`,
        name: `Adrata ${environment}`,
      };
    }

    // Parse CSV data with advanced parsing
    console.log("📖 Reading and parsing lead data...");
    const content = await fs.readFile("./lead-data-full.csv", "utf-8");
    const lines = content.trim().split("\n");

    let successCount = 0;
    let skipCount = 0;
    let missingEmailCount = 0;
    let generatedEmailCount = 0;
    let duplicateCount = 0;

    console.log(`📊 Processing ${lines.length - 1} leads...`);

    // Process all leads (skip header line)
    for (let i = 1; i < lines.length; i++) {
      try {
        const parts = parseCSVLine(lines[i]);
        const leadData = cleanAndValidate(parts);

        // Skip if missing essential data
        if (!leadData.name || !leadData.company) {
          skipCount++;
          console.log(`   ⏭️ Skipped lead ${i}: Missing name or company`);
          continue;
        }

        // Generate email if missing
        let email = leadData.email;
        if (!email || email.length < 5) {
          email = generateEmail(leadData.name, leadData.company);
          if (email) {
            generatedEmailCount++;
            console.log(`   📧 Generated email for ${leadData.name}: ${email}`);
          }
        }

        if (!email) {
          missingEmailCount++;
          console.log(`   ❌ Could not create email for ${leadData.name}`);
          continue;
        }

        // Split name into first and last
        const nameParts = leadData.name.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Determine phone number (prefer mobile, then work, then other)
        const phone =
          leadData.mobilePhone || leadData.workPhone || leadData.otherPhone;

        // Check if lead already exists
        const existingLead = await prisma.lead.findFirst({
          where: {
            email: email,
            workspaceId: workspace.id,
          },
        });

        if (existingLead) {
          duplicateCount++;
          console.log(`   🔄 Duplicate found for ${leadData.name}: ${email}`);
          continue;
        }

        // Create new lead with only valid schema fields
        await prisma.lead.create({
          data: {
            firstName: firstName,
            lastName: lastName,
            fullName: leadData.name,
            email: email,
            company: leadData.company,
            jobTitle: leadData.title,
            phone: phone,
            mobilePhone: leadData.mobilePhone,
            workPhone: leadData.workPhone,
            address: null,
            city: leadData.city,
            state: leadData.state,
            country: leadData.country,
            status: leadData.status === "Called" ? "contacted" : "new",
            priority:
              mapBuyerPersona(leadData.role, leadData.title) ===
              "Decision Maker"
                ? "high"
                : "medium",
            source: "CSV Import - Lead Data Full",
            workspaceId: workspace.id,
            assignedUserId: user.id,
            tags: [
              "imported",
              environment,
              leadData.stage?.toLowerCase() || "generate",
              mapBuyerPersona(leadData.role, leadData.title)
                .toLowerCase()
                .replace(" ", "-"),
            ],
            notes: `Imported from CSV on ${new Date().toISOString()}\nRole: ${leadData.role}\nStatus: ${leadData.status}\nRank: ${leadData.rank}\nLinkedIn: ${leadData.linkedinUrl || "N/A"}`,
            customFields: {
              originalRank: leadData.rank,
              originalStage: leadData.stage,
              originalStatus: leadData.status,
              buyerPersona: mapBuyerPersona(leadData.role, leadData.title),
              linkedinRequested: leadData.liRequested,
              linkedinUrl: leadData.linkedinUrl,
              companyPhone: leadData.companyPhone,
              timeZone: leadData.timeZone,
              originalRole: leadData.role,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        successCount++;

        if (successCount % 50 === 0) {
          console.log(`   📊 Successfully imported ${successCount} leads...`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error processing lead ${i}: ${error.message}`);
        skipCount++;
      }
    }

    console.log(`\n🎉 ULTIMATE SEEDING COMPLETED!`);
    console.log(`✅ Successfully imported: ${successCount} leads`);
    console.log(`📧 Generated emails: ${generatedEmailCount} leads`);
    console.log(`🔄 Duplicates skipped: ${duplicateCount} leads`);
    console.log(`❌ Missing emails (skipped): ${missingEmailCount} leads`);
    console.log(`⏭️ Other skips: ${skipCount - missingEmailCount} leads`);
    console.log(`📊 Environment: ${environment}`);
    console.log(`🏢 Workspace: ${workspace.name} (${workspace.id})`);
    console.log(`👤 Assigned to: ${user.name} (${user.id})`);
    console.log(
      `🔗 Database: ${databaseUrl.split("@")[1]?.split("?")[0] || "localhost"}`,
    );
    console.log(
      `📈 Success rate: ${Math.round((successCount / (lines.length - 1)) * 100)}%`,
    );

    // Verify the import
    const totalLeads = await prisma.lead.count({
      where: { workspaceId: workspace.id },
    });
    console.log(`🔍 Total leads in workspace: ${totalLeads}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Ultimate seeding failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
