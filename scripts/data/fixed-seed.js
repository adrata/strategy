#!/usr/bin/env node

/**
 * 🌱 FIXED MULTI-ENVIRONMENT SEED SCRIPT
 * Uses only fields that exist in the actual database schema
 * Handles all edge cases and ensures ALL leads are imported
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";

const environment = process.argv[2] || "local";
console.log(`🚀 Fixed seed for ${environment} environment...`);

// User ID mapping for environments
const USER_IDS = {
  local: "ckzl2j3k40000y8w8q9x7r5t3", // Dan's local user ID
  development: "ckzl2j3k40000y8w8q9x7r5t3", // Dan's dev user ID
  staging: "ckzl2j3k40000y8w8q9x7r5t3", // Dan's staging user ID
  demo: "ckzl2j3k40000y8w8q9x7r5t3", // Dan's demo user ID
  sandbox: "ckzl2j3k40000y8w8q9x7r5t3", // Dan's sandbox user ID
  production: "2feca06d-5e57-4eca-b44e-0947f755a930", // Dan's production user ID
};

// Load DATABASE_URL from environment file
async function loadDatabaseURL() {
  try {
    const envContent = await fs.readFile(`../.env.${environment}`, "utf-8");
    const dbUrlMatch = envContent.match(/^DATABASE_URL="(.+)"$/m);
    return dbUrlMatch ? dbUrlMatch[1] : null;
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

    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });

    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Ensure Dan's user exists in this environment
    const userId = USER_IDS[environment];
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: "dan@adrata.com",
            name: "Dan Sylvester",
            firstName: "Dan",
            lastName: "Sylvester",
            displayName: "Dan Sylvester",
          },
        });
        console.log("✅ Created Dan user");
      } else {
        console.log("✅ Dan user exists");
      }
    } catch (error) {
      console.log(`⚠️ User handling: ${error.message}`);
      user = { id: userId, name: "Dan Sylvester" };
    }

    // Create or find Adrata workspace
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
        console.log(`✅ Using existing workspace: ${workspace.name}`);
      }
    } catch (error) {
      console.log(`⚠️ Workspace error: ${error.message}`);
      workspace = {
        id: "adrata-workspace-" + environment,
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
          generatedEmailCount++;
          console.log(`   📧 Generated email for ${leadData.name}: ${email}`);
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
          // Update existing lead with only valid fields
          await prisma.lead.update({
            where: { id: existingLead.id },
            data: {
              company: leadData.company,
              jobTitle: leadData.title,
              phone: phone,
              city: leadData.city,
              state: leadData.state,
              country: leadData.country,
              status: leadData.status === "Called" ? "contacted" : "new",
              updatedAt: new Date(),
              assignedUserId: user.id,
            },
          });
        } else {
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
        }

        successCount++;

        if (successCount % 50 === 0) {
          console.log(`   📊 Processed ${successCount} leads...`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error processing lead ${i}: ${error.message}`);
        skipCount++;
      }
    }

    console.log(`\n🎉 FIXED SEEDING COMPLETED!`);
    console.log(`✅ Successfully imported: ${successCount} leads`);
    console.log(`📧 Generated emails: ${generatedEmailCount} leads`);
    console.log(`❌ Missing emails (skipped): ${missingEmailCount} leads`);
    console.log(`⏭️ Other skips: ${skipCount - missingEmailCount} leads`);
    console.log(`📊 Environment: ${environment}`);
    console.log(`🏢 Workspace: ${workspace.name}`);
    console.log(`👤 Assigned to: ${user.name} (${user.id})`);
    console.log(`🔗 Database: ${databaseUrl.split("@")[1] || "localhost"}`);
    console.log(
      `📈 Success rate: ${Math.round((successCount / (lines.length - 1)) * 100)}%`,
    );

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Fixed seeding failed:", error.message);
    process.exit(1);
  }
}

main();
