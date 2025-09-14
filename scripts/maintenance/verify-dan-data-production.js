#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";

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

async function main() {
  console.log("🔍 VERIFYING DAN'S DATA IN PRODUCTION");
  console.log("=====================================");

  try {
    // Step 1: Check for Adrata workspace
    console.log("\n📁 Step 1: Checking Adrata workspace...");
    const adrataWorkspace = await prisma.workspace.findFirst({
      where: {
        OR: [{ name: "Adrata" }, { slug: "adrata" }],
      },
    });

    if (adrataWorkspace) {
      console.log("✅ Adrata workspace exists:", {
        id: adrataWorkspace.id,
        name: adrataWorkspace.name,
        slug: adrataWorkspace.slug,
      });
    } else {
      console.log("❌ Adrata workspace does NOT exist");
    }

    // Step 2: Check for Dan user
    console.log("\n👤 Step 2: Checking Dan user...");
    const danUser = await prisma.user.findFirst({
      where: { email: "dan@adrata.com" },
    });

    if (danUser) {
      console.log("✅ Dan user exists:", {
        id: danUser.id,
        email: danUser.email,
        name: danUser.name,
        firstName: danUser.firstName,
        lastName: danUser.lastName,
      });
    } else {
      console.log("❌ Dan user does NOT exist");
    }

    if (!danUser) {
      console.log(
        "\n⚠️  Cannot proceed with data verification - Dan user not found",
      );
      return;
    }

    // Step 3: Check Dan's workspace memberships
    console.log("\n🔗 Step 3: Checking Dan's workspace memberships...");
    const memberships = await prisma.workspaceMembership.findMany({
      where: { userId: danUser.id },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    console.log(`📊 Dan is a member of ${memberships.length} workspaces:`);
    memberships.forEach((membership) => {
      console.log(
        `  - ${membership.workspace.name} (${membership.workspace.id}) - Role: ${membership.role}`,
      );
    });

    // Step 4: Check Dan's leads across all workspaces
    console.log("\n📋 Step 4: Checking Dan's leads across workspaces...");
    const danLeads = await prisma.lead.findMany({
      where: { assignedUserId: danUser.id },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
      },
    });

    console.log(`📊 Dan has ${danLeads.length} total leads`);

    if (danLeads.length > 0) {
      // Group by workspace
      const leadsByWorkspace = danLeads.reduce((acc, lead) => {
        const wsId = lead.workspaceId;
        const wsName = lead.workspace?.name || "Unknown";
        if (!acc[wsId]) {
          acc[wsId] = { name: wsName, leads: [] };
        }
        acc[wsId].leads.push(lead);
        return acc;
      }, {});

      console.log("\n📋 Leads by workspace:");
      Object.entries(leadsByWorkspace).forEach(([wsId, data]) => {
        const isAdrata = adrataWorkspace && wsId === adrataWorkspace.id;
        const indicator = isAdrata ? "✅" : "📦";
        console.log(
          `  ${indicator} ${data.name} (${wsId}): ${data.leads.length} leads`,
        );
      });
    }

    // Step 5: Check Dan's contacts across all workspaces
    console.log("\n👥 Step 5: Checking Dan's contacts across workspaces...");
    const danContacts = await prisma.contact.findMany({
      where: { assignedUserId: danUser.id },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
      },
    });

    console.log(`📊 Dan has ${danContacts.length} total contacts`);

    if (danContacts.length > 0) {
      // Group by workspace
      const contactsByWorkspace = danContacts.reduce((acc, contact) => {
        const wsId = contact.workspaceId;
        const wsName = contact.workspace?.name || "Unknown";
        if (!acc[wsId]) {
          acc[wsId] = { name: wsName, contacts: [] };
        }
        acc[wsId].contacts.push(contact);
        return acc;
      }, {});

      console.log("\n👥 Contacts by workspace:");
      Object.entries(contactsByWorkspace).forEach(([wsId, data]) => {
        const isAdrata = adrataWorkspace && wsId === adrataWorkspace.id;
        const indicator = isAdrata ? "✅" : "📦";
        console.log(
          `  ${indicator} ${data.name} (${wsId}): ${data.contacts.length} contacts`,
        );
      });
    }

    // Step 6: Check Dan's opportunities across all workspaces
    console.log(
      "\n💰 Step 6: Checking Dan's opportunities across workspaces...",
    );
    const danOpportunities = await prisma.opportunity.findMany({
      where: { assignedUserId: danUser.id },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
      },
    });

    console.log(`📊 Dan has ${danOpportunities.length} total opportunities`);

    if (danOpportunities.length > 0) {
      // Group by workspace
      const opportunitiesByWorkspace = danOpportunities.reduce(
        (acc, opportunity) => {
          const wsId = opportunity.workspaceId;
          const wsName = opportunity.workspace?.name || "Unknown";
          if (!acc[wsId]) {
            acc[wsId] = { name: wsName, opportunities: [] };
          }
          acc[wsId].opportunities.push(opportunity);
          return acc;
        },
        {},
      );

      console.log("\n💰 Opportunities by workspace:");
      Object.entries(opportunitiesByWorkspace).forEach(([wsId, data]) => {
        const isAdrata = adrataWorkspace && wsId === adrataWorkspace.id;
        const indicator = isAdrata ? "✅" : "📦";
        console.log(
          `  ${indicator} ${data.name} (${wsId}): ${data.opportunities.length} opportunities`,
        );
      });
    }

    // Step 7: Check Dan's accounts across all workspaces
    console.log("\n🏢 Step 7: Checking Dan's accounts across workspaces...");
    const danAccounts = await prisma.account.findMany({
      where: { assignedUserId: danUser.id },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
      },
    });

    console.log(`📊 Dan has ${danAccounts.length} total accounts`);

    if (danAccounts.length > 0) {
      // Group by workspace
      const accountsByWorkspace = danAccounts.reduce((acc, account) => {
        const wsId = account.workspaceId;
        const wsName = account.workspace?.name || "Unknown";
        if (!acc[wsId]) {
          acc[wsId] = { name: wsName, accounts: [] };
        }
        acc[wsId].accounts.push(account);
        return acc;
      }, {});

      console.log("\n🏢 Accounts by workspace:");
      Object.entries(accountsByWorkspace).forEach(([wsId, data]) => {
        const isAdrata = adrataWorkspace && wsId === adrataWorkspace.id;
        const indicator = isAdrata ? "✅" : "📦";
        console.log(
          `  ${indicator} ${data.name} (${wsId}): ${data.accounts.length} accounts`,
        );
      });
    }

    // Summary
    console.log("\n📊 SUMMARY:");
    console.log("===========");
    console.log(
      `✅ Adrata workspace: ${adrataWorkspace ? "EXISTS" : "MISSING"}`,
    );
    console.log(`✅ Dan user: ${danUser ? "EXISTS" : "MISSING"}`);
    console.log(`✅ Workspace memberships: ${memberships.length}`);
    console.log(`✅ Total leads: ${danLeads.length}`);
    console.log(`✅ Total contacts: ${danContacts.length}`);
    console.log(`✅ Total opportunities: ${danOpportunities.length}`);
    console.log(`✅ Total accounts: ${danAccounts.length}`);

    // Calculate data that needs to be moved
    const leadsToMove = danLeads.filter(
      (lead) => !adrataWorkspace || lead.workspaceId !== adrataWorkspace.id,
    ).length;
    const contactsToMove = danContacts.filter(
      (contact) =>
        !adrataWorkspace || contact.workspaceId !== adrataWorkspace.id,
    ).length;
    const opportunitiesToMove = danOpportunities.filter(
      (opp) => !adrataWorkspace || opp.workspaceId !== adrataWorkspace.id,
    ).length;
    const accountsToMove = danAccounts.filter(
      (account) =>
        !adrataWorkspace || account.workspaceId !== adrataWorkspace.id,
    ).length;

    if (
      leadsToMove > 0 ||
      contactsToMove > 0 ||
      opportunitiesToMove > 0 ||
      accountsToMove > 0
    ) {
      console.log("\n📦 DATA TO MIGRATE:");
      console.log("===================");
      console.log(`📋 Leads to move: ${leadsToMove}`);
      console.log(`👥 Contacts to move: ${contactsToMove}`);
      console.log(`💰 Opportunities to move: ${opportunitiesToMove}`);
      console.log(`🏢 Accounts to move: ${accountsToMove}`);
      console.log(
        "\n⚡ Run the setup script to migrate this data to Adrata workspace",
      );
    } else {
      console.log("\n✅ All data is already in the Adrata workspace!");
    }
  } catch (error) {
    console.error("❌ Error verifying Dan's data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
