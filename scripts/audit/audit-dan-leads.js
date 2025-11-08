#!/usr/bin/env node

/**
 * 📊 AUDIT DAN'S LEADS IN ADRATA WORKSPACE
 * 
 * This script audits how many leads are in Dan's database for workspace adrata.
 * It provides a comprehensive breakdown of leads by status, priority, and other metrics.
 */

const { PrismaClient } = require("@prisma/client");

// Use production database URL from environment or default
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

async function auditDanLeads() {
  console.log("📊 AUDITING DAN'S LEADS IN ADRATA WORKSPACE");
  console.log("===========================================");
  console.log("");

  try {
    // Step 1: Find Dan user - prioritize dan@adrata.com
    console.log("👤 Step 1: Finding Dan user...");
    let danUser = await prisma.users.findFirst({
      where: {
        email: "dan@adrata.com",
      },
    });

    // If not found, try other variations
    if (!danUser) {
      danUser = await prisma.users.findFirst({
        where: {
          OR: [
            { id: "dan" },
            { firstName: "dan" },
            { name: { contains: "dan", mode: "insensitive" } },
          ],
        },
      });
    }

    // If still not found, try broader search
    if (!danUser) {
      console.log("   Trying broader search for Dan...");
      const allDanUsers = await prisma.users.findMany({
        where: {
          OR: [
            { email: { contains: "dan", mode: "insensitive" } },
            { firstName: { contains: "dan", mode: "insensitive" } },
            { lastName: { contains: "dan", mode: "insensitive" } },
            { name: { contains: "dan", mode: "insensitive" } },
          ],
        },
        take: 10,
      });

      if (allDanUsers.length > 0) {
        console.log(`   Found ${allDanUsers.length} potential Dan users:`);
        allDanUsers.forEach((u, i) => {
          console.log(`   ${i + 1}. ${u.email || u.name} (ID: ${u.id})`);
        });
        // Prefer dan@adrata.com if available
        danUser = allDanUsers.find(u => u.email === "dan@adrata.com") || allDanUsers[0];
      }
    }

    if (!danUser) {
      throw new Error("❌ Dan user not found in database");
    }

    console.log(`✅ Using Dan user: ${danUser.email || danUser.name} (ID: ${danUser.id})`);

    // Step 2: Find Adrata workspace
    console.log("\n🏢 Step 2: Finding Adrata workspace...");
    const adrataWorkspace = await prisma.workspaces.findFirst({
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
      throw new Error("❌ Adrata workspace not found in database");
    }

    console.log(`✅ Found Adrata workspace: ${adrataWorkspace.name} (ID: ${adrataWorkspace.id})`);

    // Also check all users in workspace
    console.log("\n👥 Checking all users in Adrata workspace...");
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
          },
        },
      },
      take: 20,
    });
    console.log(`   Found ${workspaceUsers.length} workspace users`);
    workspaceUsers.slice(0, 5).forEach((wu) => {
      console.log(`   - ${wu.user.email || wu.user.name} (ID: ${wu.user.id})`);
    });

    // Step 3: Count leads - check both leads table and people table
    console.log("\n📋 Step 3: Counting leads...");
    
    let totalLeads = 0;
    let totalPeopleLeads = 0;
    let leadsByStatus = {};
    let leadsByPriority = {};
    let leadsDetails = [];
    let peopleLeadsByStatus = {};
    let peopleLeadsByPriority = {};

    // Check if leads table exists and query it
    try {
      console.log("   Checking leads table...");
      const leadsCount = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM leads
        WHERE "workspaceId" = ${adrataWorkspace.id}
        AND "assignedUserId" = ${danUser.id}
      `;

      if (Array.isArray(leadsCount) && leadsCount.length > 0) {
        totalLeads = leadsCount[0].count || 0;
        console.log(`   ✅ Found ${totalLeads} leads in leads table`);

        // Get breakdown by status
        const statusBreakdown = await prisma.$queryRaw`
          SELECT status, COUNT(*)::int as count
          FROM leads
          WHERE "workspaceId" = ${adrataWorkspace.id}
          AND "assignedUserId" = ${danUser.id}
          GROUP BY status
          ORDER BY count DESC
        `;

        statusBreakdown.forEach((row) => {
          leadsByStatus[row.status] = row.count;
        });

        // Get breakdown by priority
        const priorityBreakdown = await prisma.$queryRaw`
          SELECT priority, COUNT(*)::int as count
          FROM leads
          WHERE "workspaceId" = ${adrataWorkspace.id}
          AND "assignedUserId" = ${danUser.id}
          GROUP BY priority
          ORDER BY count DESC
        `;

        priorityBreakdown.forEach((row) => {
          leadsByPriority[row.priority] = row.count;
        });

        // Get sample leads
        leadsDetails = await prisma.$queryRaw`
          SELECT 
            id,
            "firstName",
            "lastName",
            "fullName",
            email,
            company,
            "jobTitle",
            status,
            priority,
            source,
            "createdAt"
          FROM leads
          WHERE "workspaceId" = ${adrataWorkspace.id}
          AND "assignedUserId" = ${danUser.id}
          ORDER BY "createdAt" DESC
          LIMIT 10
        `;
      }
    } catch (error) {
      console.log(`   ⚠️  Leads table not found or error: ${error.message}`);
      console.log("   (This is okay - leads might be stored in people table)");
    }

    // Also check people table for leads (status = 'LEAD')
    try {
      console.log("   Checking people table for leads...");
      
      // First, check total people assigned to Dan
      const totalPeopleCount = await prisma.people.count({
        where: {
          workspaceId: adrataWorkspace.id,
          mainSellerId: danUser.id,
          deletedAt: null,
        },
      });
      
      console.log(`   📊 Total people assigned to Dan: ${totalPeopleCount}`);

      const peopleLeadsCount = await prisma.people.count({
        where: {
          workspaceId: adrataWorkspace.id,
          mainSellerId: danUser.id,
          status: "LEAD",
          deletedAt: null,
        },
      });

      totalPeopleLeads = peopleLeadsCount;
      console.log(`   ✅ Found ${totalPeopleLeads} leads in people table (status=LEAD)`);
      
      if (totalPeopleCount > 0 && totalPeopleLeads === 0) {
        console.log(`   ⚠️  Note: Dan has ${totalPeopleCount} people records, but none with status=LEAD`);
        console.log(`   Checking status breakdown...`);
      }

      // Get breakdown by status (all statuses for Dan's people)
      const allPeopleStatuses = await prisma.people.groupBy({
        by: ["status"],
        where: {
          workspaceId: adrataWorkspace.id,
          mainSellerId: danUser.id,
          deletedAt: null,
        },
        _count: true,
      });

      console.log(`   Status breakdown for Dan's people:`);
      allPeopleStatuses.forEach((row) => {
        peopleLeadsByStatus[row.status || "null"] = row._count;
        console.log(`     - ${row.status || "null"}: ${row._count}`);
      });
      
      // Also check total people in workspace (regardless of mainSellerId)
      const totalWorkspacePeople = await prisma.people.count({
        where: {
          workspaceId: adrataWorkspace.id,
          deletedAt: null,
        },
      });
      console.log(`\n   📊 Total people in Adrata workspace (all users): ${totalWorkspacePeople}`);
      
      const workspaceLeads = await prisma.people.count({
        where: {
          workspaceId: adrataWorkspace.id,
          status: "LEAD",
          deletedAt: null,
        },
      });
      console.log(`   📊 Total leads in Adrata workspace (all users, status=LEAD): ${workspaceLeads}`);

      // Get breakdown by priority
      const allPeoplePriorities = await prisma.people.groupBy({
        by: ["priority"],
        where: {
          workspaceId: adrataWorkspace.id,
          mainSellerId: danUser.id,
          deletedAt: null,
        },
        _count: true,
      });

      allPeoplePriorities.forEach((row) => {
        peopleLeadsByPriority[row.priority || "null"] = row._count;
      });

      // Get sample people leads
      const samplePeopleLeads = await prisma.people.findMany({
        where: {
          workspaceId: adrataWorkspace.id,
          mainSellerId: danUser.id,
          status: "LEAD",
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          jobTitle: true,
          status: true,
          priority: true,
          createdAt: true,
          company: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Format sample people leads to match leads format
      leadsDetails = samplePeopleLeads.map((person) => ({
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        fullName: person.fullName,
        email: person.email,
        company: person.company?.name || null,
        jobTitle: person.jobTitle,
        status: person.status,
        priority: person.priority,
        createdAt: person.createdAt,
      }));
    } catch (error) {
      console.log(`   ⚠️  Error querying people table: ${error.message}`);
    }

    // Step 4: Display results
    console.log("\n📊 AUDIT RESULTS");
    console.log("================");
    
    const grandTotal = totalLeads + totalPeopleLeads;
    console.log(`\n✅ Total Leads: ${grandTotal}`);
    if (totalLeads > 0) {
      console.log(`   - From leads table: ${totalLeads}`);
    }
    if (totalPeopleLeads > 0) {
      console.log(`   - From people table (status=LEAD): ${totalPeopleLeads}`);
    }

    // Show status breakdown (from leads table if available, otherwise from people)
    const statusData = Object.keys(leadsByStatus).length > 0 ? leadsByStatus : peopleLeadsByStatus;
    if (Object.keys(statusData).length > 0) {
      console.log("\n📈 Breakdown by Status:");
      const totalForStatus = Object.keys(leadsByStatus).length > 0 ? totalLeads : totalPeopleLeads;
      Object.entries(statusData)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
          const percentage = totalForStatus > 0 ? ((count / totalForStatus) * 100).toFixed(1) : 0;
          console.log(`   ${status || "null"}: ${count} (${percentage}%)`);
        });
    }

    // Show priority breakdown
    const priorityData = Object.keys(leadsByPriority).length > 0 ? leadsByPriority : peopleLeadsByPriority;
    if (Object.keys(priorityData).length > 0) {
      console.log("\n🎯 Breakdown by Priority:");
      const totalForPriority = Object.keys(leadsByPriority).length > 0 ? totalLeads : totalPeopleLeads;
      Object.entries(priorityData)
        .sort((a, b) => b[1] - a[1])
        .forEach(([priority, count]) => {
          const percentage = totalForPriority > 0 ? ((count / totalForPriority) * 100).toFixed(1) : 0;
          console.log(`   ${priority || "null"}: ${count} (${percentage}%)`);
        });
    }

    if (leadsDetails.length > 0) {
      console.log("\n📋 Sample Leads (10 most recent):");
      leadsDetails.forEach((lead, index) => {
        console.log(`\n   ${index + 1}. ${lead.fullName || `${lead.firstName} ${lead.lastName}`}`);
        console.log(`      Company: ${lead.company || "N/A"}`);
        console.log(`      Title: ${lead.jobTitle || "N/A"}`);
        console.log(`      Email: ${lead.email || "N/A"}`);
        console.log(`      Status: ${lead.status || "N/A"}`);
        console.log(`      Priority: ${lead.priority || "N/A"}`);
        console.log(`      Source: ${lead.source || "N/A"}`);
        console.log(`      Created: ${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "N/A"}`);
      });
    }

    // Additional statistics from people table
    console.log("\n📊 Additional Statistics:");
    
    try {
      if (totalPeopleLeads > 0) {
        const peopleStats = await prisma.people.aggregate({
          where: {
            workspaceId: adrataWorkspace.id,
            mainSellerId: danUser.id,
            status: "LEAD",
            deletedAt: null,
          },
          _count: {
            id: true,
            email: true,
            phone: true,
            companyId: true,
          },
          _min: {
            createdAt: true,
          },
          _max: {
            createdAt: true,
          },
        });

        const uniqueCompanies = await prisma.people.groupBy({
          by: ["companyId"],
          where: {
            workspaceId: adrataWorkspace.id,
            mainSellerId: danUser.id,
            status: "LEAD",
            deletedAt: null,
          },
        });

        console.log(`   Unique Companies: ${uniqueCompanies.filter(c => c.companyId).length}`);
        console.log(`   Leads with Email: ${peopleStats._count.email || 0} (${totalPeopleLeads > 0 ? ((peopleStats._count.email / totalPeopleLeads) * 100).toFixed(1) : 0}%)`);
        console.log(`   Leads with Phone: ${peopleStats._count.phone || 0} (${totalPeopleLeads > 0 ? ((peopleStats._count.phone / totalPeopleLeads) * 100).toFixed(1) : 0}%)`);
        if (peopleStats._min.createdAt) {
          console.log(`   Oldest Lead: ${new Date(peopleStats._min.createdAt).toLocaleDateString()}`);
        }
        if (peopleStats._max.createdAt) {
          console.log(`   Newest Lead: ${new Date(peopleStats._max.createdAt).toLocaleDateString()}`);
        }
      } else if (totalLeads > 0) {
        // Try to get stats from leads table
        try {
          const stats = await prisma.$queryRaw`
            SELECT 
              COUNT(*)::int as total,
              COUNT(DISTINCT company)::int as unique_companies,
              COUNT(CASE WHEN email IS NOT NULL THEN 1 END)::int as with_email,
              COUNT(CASE WHEN phone IS NOT NULL THEN 1 END)::int as with_phone,
              MIN("createdAt") as oldest_lead,
              MAX("createdAt") as newest_lead
            FROM leads
            WHERE "workspaceId" = ${adrataWorkspace.id}
            AND "assignedUserId" = ${danUser.id}
          `;

          if (stats && stats.length > 0) {
            const s = stats[0];
            console.log(`   Unique Companies: ${s.unique_companies || 0}`);
            console.log(`   Leads with Email: ${s.with_email || 0} (${totalLeads > 0 ? ((s.with_email / totalLeads) * 100).toFixed(1) : 0}%)`);
            console.log(`   Leads with Phone: ${s.with_phone || 0} (${totalLeads > 0 ? ((s.with_phone / totalLeads) * 100).toFixed(1) : 0}%)`);
            if (s.oldest_lead) {
              console.log(`   Oldest Lead: ${new Date(s.oldest_lead).toLocaleDateString()}`);
            }
            if (s.newest_lead) {
              console.log(`   Newest Lead: ${new Date(s.newest_lead).toLocaleDateString()}`);
            }
          }
        } catch (leadsStatsError) {
          console.log("   ⚠️  Could not fetch additional statistics from leads table");
        }
      }
    } catch (statsError) {
      console.log("   ⚠️  Could not fetch additional statistics");
    }

    // Step 5: Check for unassigned people and breakdown by user
    console.log("\n👥 Step 5: Checking people assignments...");
    
    try {
      // Count unassigned people (no mainSellerId)
      const unassignedCount = await prisma.people.count({
        where: {
          workspaceId: adrataWorkspace.id,
          mainSellerId: null,
          deletedAt: null,
        },
      });
      
      console.log(`\n📊 Unassigned People: ${unassignedCount}`);
      
      if (unassignedCount > 0) {
        const unassignedPeople = await prisma.people.findMany({
          where: {
            workspaceId: adrataWorkspace.id,
            mainSellerId: null,
            deletedAt: null,
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            company: {
              select: {
                name: true,
              },
            },
            status: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        });
        
        console.log("\n   Sample unassigned people:");
        unassignedPeople.forEach((person, index) => {
          console.log(`   ${index + 1}. ${person.fullName}`);
          console.log(`      Company: ${person.company?.name || "N/A"}`);
          console.log(`      Email: ${person.email || "N/A"}`);
          console.log(`      Status: ${person.status || "N/A"}`);
        });
      }
      
      // Breakdown by mainSellerId
      console.log("\n📊 People Breakdown by Assigned User:");
      const peopleBySeller = await prisma.people.groupBy({
        by: ["mainSellerId"],
        where: {
          workspaceId: adrataWorkspace.id,
          deletedAt: null,
        },
        _count: true,
      });
      
      // Get user details for each mainSellerId
      for (const group of peopleBySeller) {
        if (group.mainSellerId) {
          const seller = await prisma.users.findUnique({
            where: { id: group.mainSellerId },
            select: { email: true, name: true, firstName: true },
          });
          
          const sellerName = seller?.email || seller?.name || seller?.firstName || group.mainSellerId;
          console.log(`   ${sellerName}: ${group._count} people`);
          
          // Get status breakdown for this seller
          const statusBreakdown = await prisma.people.groupBy({
            by: ["status"],
            where: {
              workspaceId: adrataWorkspace.id,
              mainSellerId: group.mainSellerId,
              deletedAt: null,
            },
            _count: true,
          });
          
          statusBreakdown.forEach((status) => {
            console.log(`     - ${status.status || "null"}: ${status._count}`);
          });
        } else {
          console.log(`   Unassigned: ${group._count} people`);
        }
      }
      
      // Specifically check Ross
      const rossUser = await prisma.users.findFirst({
        where: {
          OR: [
            { email: "ross@adrata.com" },
            { email: { contains: "ross", mode: "insensitive" } },
            { firstName: { contains: "ross", mode: "insensitive" } },
          ],
        },
      });
      
      if (rossUser) {
        const rossPeopleCount = await prisma.people.count({
          where: {
            workspaceId: adrataWorkspace.id,
            mainSellerId: rossUser.id,
            deletedAt: null,
          },
        });
        
        console.log(`\n👤 Ross's People Count: ${rossPeopleCount}`);
        
        if (rossPeopleCount > 0) {
          const rossPeople = await prisma.people.findMany({
            where: {
              workspaceId: adrataWorkspace.id,
              mainSellerId: rossUser.id,
              deletedAt: null,
            },
            select: {
              id: true,
              fullName: true,
              email: true,
              status: true,
              company: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          });
          
          console.log("   Ross's people:");
          rossPeople.forEach((person, index) => {
            console.log(`   ${index + 1}. ${person.fullName} (${person.status || "N/A"}) - ${person.company?.name || "No company"}`);
          });
        }
      }
      
      // Check for Justin
      console.log(`\n👤 Checking for Justin...`);
      const justinUser = await prisma.users.findFirst({
        where: {
          OR: [
            { email: { contains: "justin", mode: "insensitive" } },
            { firstName: { contains: "justin", mode: "insensitive" } },
            { lastName: { contains: "justin", mode: "insensitive" } },
            { name: { contains: "justin", mode: "insensitive" } },
          ],
        },
      });
      
      if (justinUser) {
        console.log(`   ✅ Found Justin: ${justinUser.email || justinUser.name} (ID: ${justinUser.id})`);
        
        const justinPeopleCount = await prisma.people.count({
          where: {
            workspaceId: adrataWorkspace.id,
            mainSellerId: justinUser.id,
            deletedAt: null,
          },
        });
        
        console.log(`\n👤 Justin's People Count: ${justinPeopleCount}`);
        
        if (justinPeopleCount > 0) {
          const justinPeople = await prisma.people.findMany({
            where: {
              workspaceId: adrataWorkspace.id,
              mainSellerId: justinUser.id,
              deletedAt: null,
            },
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              status: true,
              priority: true,
              jobTitle: true,
              company: {
                select: {
                  name: true,
                },
              },
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          });
          
          console.log("\n   Justin's people:");
          justinPeople.forEach((person, index) => {
            console.log(`\n   ${index + 1}. ${person.fullName}`);
            console.log(`      Company: ${person.company?.name || "N/A"}`);
            console.log(`      Title: ${person.jobTitle || "N/A"}`);
            console.log(`      Email: ${person.email || "N/A"}`);
            console.log(`      Phone: ${person.phone || "N/A"}`);
            console.log(`      Status: ${person.status || "N/A"}`);
            console.log(`      Priority: ${person.priority || "N/A"}`);
            console.log(`      Created: ${person.createdAt ? new Date(person.createdAt).toLocaleDateString() : "N/A"}`);
          });
          
          // Get status breakdown
          const justinStatusBreakdown = await prisma.people.groupBy({
            by: ["status"],
            where: {
              workspaceId: adrataWorkspace.id,
              mainSellerId: justinUser.id,
              deletedAt: null,
            },
            _count: true,
          });
          
          console.log("\n   Status breakdown:");
          justinStatusBreakdown.forEach((status) => {
            console.log(`     - ${status.status || "null"}: ${status._count}`);
          });
        } else {
          console.log("   ⚠️  Justin has no people assigned in this workspace");
        }
      } else {
        console.log("   ⚠️  Justin user not found in database");
      }
      
    } catch (assignmentError) {
      console.log("   ⚠️  Could not fetch assignment breakdown:", assignmentError.message);
    }

    console.log("\n✅ Audit complete!");

  } catch (error) {
    console.error("\n❌ Error during audit:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditDanLeads()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

