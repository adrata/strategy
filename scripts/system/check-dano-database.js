#!/usr/bin/env node

/**
 * 🔍 CHECK DANO'S DATABASE DATA
 * Verifies what data exists for dano@retail-products.com user
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 
        "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require"
    }
  }
});

async function checkDanoData() {
  console.log("🔍 CHECKING DANO'S DATABASE DATA");
  console.log("=================================");

  try {
    await prisma.$connect();
    console.log("✅ Connected to database");

    // Find dano user
    const danoUser = await prisma.user.findUnique({
      where: { email: "dano@retail-products.com" }
    });

    if (!danoUser) {
      console.log("❌ Dano user not found");
      return;
    }

    console.log(`\n👤 Dano User: ${danoUser.name} (${danoUser.email})`);
    console.log(`   ID: ${danoUser.id}`);

    // Check leads assigned to dano
    const leads = await prisma.lead.findMany({
      where: { assignedUserId: danoUser.id }
    });
    console.log(`\n📊 Leads assigned to Dano: ${leads.length}`);
    if (leads.length > 0) {
      console.log("   First 5 leads:");
      leads.slice(0, 5).forEach(lead => {
        console.log(`   - ${lead.name} (${lead.company}) - ${lead.workspaceId}`);
      });
    }

    // Check opportunities assigned to dano
    const opportunities = await prisma.opportunity.findMany({
      where: { assignedUserId: danoUser.id }
    });
    console.log(`\n💼 Opportunities assigned to Dano: ${opportunities.length}`);
    if (opportunities.length > 0) {
      console.log("   First 5 opportunities:");
      opportunities.slice(0, 5).forEach(opp => {
        console.log(`   - ${opp.name} (${opp.company}) - ${opp.workspaceId}`);
      });
    }

    // Check data in dano's workspace
    const retailWorkspace = await prisma.workspace.findUnique({
      where: { id: "retailproductsolutions" }
    });

    let peopleInWorkspace = [];
    let leadsInWorkspace = [];
    let opportunitiesInWorkspace = [];

    if (retailWorkspace) {
      console.log(`\n🏢 Workspace found: ${retailWorkspace.name}`);
      
      peopleInWorkspace = await prisma.person.findMany({
        where: { workspaceId: retailWorkspace.id }
      });
      leadsInWorkspace = await prisma.lead.findMany({
        where: { workspaceId: retailWorkspace.id }
      });
      opportunitiesInWorkspace = await prisma.opportunity.findMany({
        where: { workspaceId: retailWorkspace.id }
      });
      
      console.log(`\n👥 People in retailproductsolutions workspace: ${peopleInWorkspace.length}`);
      if (peopleInWorkspace.length > 0) {
        console.log("   First 5 people:");
        peopleInWorkspace.slice(0, 5).forEach(person => {
          console.log(`   - ${person.name} (${person.title || 'No title'}) - ${person.company || 'No company'}`);
        });
      }

      console.log(`\n📊 Leads in retailproductsolutions workspace: ${leadsInWorkspace.length}`);
      if (leadsInWorkspace.length > 0) {
        console.log("   First 5 leads:");
        leadsInWorkspace.slice(0, 5).forEach(lead => {
          console.log(`   - ${lead.name} (${lead.company || 'No company'}) - assigned to: ${lead.assignedUserId || 'unassigned'}`);
        });
      }

      console.log(`\n💼 Opportunities in retailproductsolutions workspace: ${opportunitiesInWorkspace.length}`);
      if (opportunitiesInWorkspace.length > 0) {
        console.log("   First 5 opportunities:");
        opportunitiesInWorkspace.slice(0, 5).forEach(opp => {
          console.log(`   - ${opp.name} (${opp.company || 'No company'}) - assigned to: ${opp.assignedUserId || 'unassigned'}`);
        });
      }
    }

    // Check if dano has access to other workspaces (shouldn't have)
    const allWorkspaceMemberships = await prisma.workspaceMembership.findMany({
      where: { userId: danoUser.id },
      include: { workspace: true }
    });
    
    console.log(`\n🔗 Dano's workspace memberships: ${allWorkspaceMemberships.length}`);
    allWorkspaceMemberships.forEach(membership => {
      console.log(`   - ${membership.workspace.name} (${membership.workspace.id}) - Role: ${membership.role}`);
    });

    // Check leads/people in Adrata workspace (Dano should NOT see these)
    const adrataLeads = await prisma.lead.count({
      where: { workspaceId: "adrata" }
    });
    const adrataOpportunities = await prisma.opportunity.count({
      where: { workspaceId: "adrata" }
    });
    
    console.log(`\n🚫 Adrata workspace data (Dano should NOT see):`);
    console.log(`   - Leads: ${adrataLeads}`);
    console.log(`   - Opportunities: ${adrataOpportunities}`);

    console.log("\n📋 SUMMARY:");
    console.log(`✅ Dano user exists: ${danoUser.email}`);
    console.log(`📊 Assigned leads: ${leads.length}`);
    console.log(`💼 Assigned opportunities: ${opportunities.length}`);
    console.log(`👥 Workspace people: ${peopleInWorkspace.length}`);
    console.log(`📊 Workspace leads: ${leadsInWorkspace.length}`);
    console.log(`💼 Workspace opportunities: ${opportunitiesInWorkspace.length}`);
    
    if (leads.length > 0 || opportunities.length > 0) {
      console.log("\n⚠️  WARNING: Dano has assigned data - this may be causing the UI to show data!");
    }

  } catch (error) {
    console.error("❌ Error checking Dano's data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDanoData().catch(console.error);