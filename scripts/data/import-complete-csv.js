const fs = require("fs");
const csv = require("csv-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Configuration
const config = {
  workspaceId: "c854dff0-27db-4e79-a47b-787b0618a353",
  userId: "672c8186-d014-4322-b9f7-b81ba7254aa2",
  csvFile: "./lead-data-full.csv",
};

function mapStatus(csvStatus) {
  if (!csvStatus) return "New";

  const statusLower = csvStatus.toLowerCase();
  if (statusLower.includes("called")) return "Contacted";
  if (statusLower.includes("intro call") || statusLower.includes("demo"))
    return "Qualified";
  if (statusLower.includes("incorrect") || statusLower.includes("broken"))
    return "Lost";
  if (statusLower === "new") return "New";

  return "New";
}

function mapBuyerRole(role) {
  if (!role) return "Stakeholder";

  const roleLower = role.toLowerCase();
  if (roleLower.includes("champion")) return "Champion";
  if (
    roleLower.includes("decision maker") ||
    roleLower.includes("cro") ||
    roleLower.includes("cso")
  )
    return "Decision Maker";
  if (roleLower.includes("blocker")) return "Blocker";
  if (roleLower.includes("opener")) return "Opener";

  return "Stakeholder";
}

function normalizePhone(phone) {
  if (!phone) return null;

  // Clean the phone number
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Ensure it starts with +1 if it's a US number
  if (cleaned.length === 10) {
    cleaned = "+1" + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+")) {
    cleaned = "+1" + cleaned.slice(-10);
  }

  return cleaned;
}

function buildLocation(city, state, country) {
  const parts = [city, state, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

async function importCSVData() {
  console.log("🚀 Starting CSV import...");

  const leads = [];
  let lineNumber = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(config.csvFile)
      .pipe(csv())
      .on("data", (row) => {
        lineNumber++;

        // Skip empty rows or rows without a name
        if (!row.name || row.name.trim() === "") {
          console.log(`⚠️ Skipping line ${lineNumber}: No name provided`);
          return;
        }

        // Get the primary phone number
        const primaryPhone =
          row["Mobile Phone"] ||
          row["Work Phone"] ||
          row["Other Phone"] ||
          null;

        const lead = {
          // Basic info
          name: row.name.trim(),
          title: row.Title || null,
          email: row.Email || null,
          phone: normalizePhone(primaryPhone),
          company: row.company || null,

          // Status and classification
          status: mapStatus(row.status),
          source: "CSV Import - Lead Data Full",
          buyerGroupRole: mapBuyerRole(row.role),
          relationship: "Cold",

          // Additional fields
          notes:
            [
              row.status ? `Status: ${row.status}` : null,
              row.Errors ? `Errors: ${row.Errors}` : null,
              row["LI Requested"] === "Yes" ? "LinkedIn requested" : null,
            ]
              .filter(Boolean)
              .join("; ") || null,

          // LinkedIn URL (for enrichment)
          linkedinUrl: row["Person Linkedin Url"] || null,

          // Location data
          location: buildLocation(row.City, row.State, row.Country),

          // System fields
          workspaceId: config.workspaceId,
          createdBy: config.userId,
          assignedTo: config.userId,
        };

        leads.push(lead);
      })
      .on("end", async () => {
        console.log(`📊 Parsed ${leads.length} leads from CSV`);

        let imported = 0;
        let updated = 0;
        let errors = 0;

        for (const lead of leads) {
          try {
            if (lead.email) {
              // Try to update existing lead first
              const existing = await prisma.lead.findUnique({
                where: {
                  email_workspaceId: {
                    email: lead.email,
                    workspaceId: config.workspaceId,
                  },
                },
              });

              if (existing) {
                await prisma.lead.update({
                  where: { id: existing.id },
                  data: {
                    ...lead,
                    updatedAt: new Date(),
                  },
                });
                updated++;
              } else {
                await prisma.lead.create({ data: lead });
                imported++;
              }
            } else {
              // No email, create anyway
              await prisma.lead.create({ data: lead });
              imported++;
            }
          } catch (error) {
            console.error(`❌ Error importing ${lead.name}: ${error.message}`);
            errors++;
          }
        }

        console.log(`✅ Import complete:`);
        console.log(`  📥 Imported: ${imported} new leads`);
        console.log(`  🔄 Updated: ${updated} existing leads`);
        console.log(`  ❌ Errors: ${errors}`);

        resolve({ imported, updated, errors });
      })
      .on("error", reject);
  });
}

async function main() {
  try {
    await importCSVData();
  } catch (error) {
    console.error("💥 Import failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { importCSVData };
