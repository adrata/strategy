#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Get TOP workspace
    const topWorkspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'TOP',
          mode: 'insensitive'
        }
      }
    });

    if (!topWorkspace) {
      console.log('❌ TOP workspace not found');
      return;
    }

    console.log(`✅ Found workspace: ${topWorkspace.name} (${topWorkspace.id})`);

    // Test basic counts
    const peopleCount = await prisma.people.count({
      where: { workspaceId: topWorkspace.id }
    });
    
    const leadsCount = await prisma.leads.count({
      where: { workspaceId: topWorkspace.id }
    });
    
    const prospectsCount = await prisma.prospects.count({
      where: { workspaceId: topWorkspace.id }
    });
    
    const companiesCount = await prisma.companies.count({
      where: { workspaceId: topWorkspace.id }
    });

    console.log(`\n📊 Basic Counts:`);
    console.log(`People: ${peopleCount}`);
    console.log(`Leads: ${leadsCount}`);
    console.log(`Prospects: ${prospectsCount}`);
    console.log(`Companies: ${companiesCount}`);

    // Test buyer group role counts
    const peopleWithRoles = await prisma.people.count({
      where: {
        workspaceId: topWorkspace.id,
        buyerGroupRole: { not: null }
      }
    });

    console.log(`\n👥 People with buyer group roles: ${peopleWithRoles}`);

    // Test enrichment sources
    const peopleWithEnrichment = await prisma.people.count({
      where: {
        workspaceId: topWorkspace.id,
        enrichmentSources: { isEmpty: false }
      }
    });

    console.log(`🔍 People with enrichment sources: ${peopleWithEnrichment}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
