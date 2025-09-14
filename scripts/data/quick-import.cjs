const fs = require("fs");
const csv = require("csv-parser");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const config = {
  workspaceId: "c854dff0-27db-4e79-a47b-787b0618a353",
  userId: "672c8186-d014-4322-b9f7-b81ba7254aa2",
  csvFile: "./lead-data-full.csv",
};
function mapStatus(s) {
  if (!s) return "New";
  const sl = s.toLowerCase();
  if (sl.includes("called")) return "Contacted";
  if (sl.includes("intro") || sl.includes("demo")) return "Qualified";
  if (sl.includes("incorrect")) return "Lost";
  return "New";
}
function mapRole(r) {
  if (!r) return "Stakeholder";
  const rl = r.toLowerCase();
  if (rl.includes("champion")) return "Champion";
  if (rl.includes("decision") || rl.includes("cro")) return "Decision Maker";
  if (rl.includes("opener")) return "Opener";
  return "Stakeholder";
}
async function importData() {
  const leads = [];
  return new Promise((resolve) => {
    fs.createReadStream(config.csvFile)
      .pipe(csv())
      .on("data", (row) => {
        if (!row.name) return;
        leads.push({
          name: row.name.trim(),
          title: row.Title || null,
          email: row.Email || null,
          phone: row["Mobile Phone"] || row["Work Phone"] || null,
          company: row.company || null,
          status: mapStatus(row.status),
          source: "CSV Import",
          buyerGroupRole: mapRole(row.role),
          workspaceId: config.workspaceId,
          createdBy: config.userId,
          assignedTo: config.userId,
        });
      })
      .on("end", async () => {
        let imported = 0;
        for (const lead of leads) {
          try {
            await prisma.lead.create({ data: lead });
            imported++;
          } catch (e) {
            if (lead.email) {
              try {
                await prisma.lead.updateMany({
                  where: { email: lead.email, workspaceId: config.workspaceId },
                  data: lead,
                });
              } catch (err) {}
            }
          }
        }
        console.log(`Imported ${imported} leads`);
        resolve();
      });
  });
}
importData().then(() => prisma.$disconnect());
