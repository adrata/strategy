#!/usr/bin/env node

/**
 * Simple Last Action Population Script
 * 
 * This script populates lastAction fields for all entities based on their most recent actions.
 * It handles the current schema limitations and works with existing field structures.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Last Action Population...\n');
  
  try {
    // Step 1: Populate lastAction fields for companies and people (they have both fields)
    console.log('📊 Step 1: Populating lastAction fields for companies and people...');
    await populateCompaniesAndPeople();
    
    // Step 2: Populate lastActionDate for leads, prospects, and opportunities
    console.log('\n📊 Step 2: Populating lastActionDate for leads, prospects, and opportunities...');
    await populateLeadsProspectsOpportunities();
    
    // Step 3: Generate report
    console.log('\n📋 Step 3: Generating report...');
    await generateReport();
    
    console.log('\n✅ Last Action Population completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in Last Action Population:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Populate lastAction fields for companies and people (they have both fields)
 */
async function populateCompaniesAndPeople() {
  const entities = ['companies', 'people'];
  let totalUpdated = 0;
  
  for (const entity of entities) {
    console.log(`  📝 Processing ${entity}...`);
    
    // Get all entities with their most recent action
    const entitiesWithActions = await prisma[entity].findMany({
      include: {
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    // Update lastAction fields
    const updates = entitiesWithActions.map(entityRecord => {
      const lastAction = entityRecord.actions[0];
      if (lastAction) {
        return prisma[entity].update({
          where: { id: entityRecord.id },
          data: {
            lastAction: lastAction.type,
            lastActionDate: lastAction.createdAt
          }
        });
      }
      return null;
    }).filter(Boolean);
    
    if (updates.length > 0) {
      await Promise.all(updates);
      totalUpdated += updates.length;
      console.log(`    ✅ Updated ${updates.length} ${entity}`);
    }
  }
  
  console.log(`  ✅ Total entities updated: ${totalUpdated}`);
}

/**
 * Populate lastActionDate for leads, prospects, and opportunities
 */
async function populateLeadsProspectsOpportunities() {
  const entities = [
    { name: 'leads', field: 'leadId' },
    { name: 'prospects', field: 'prospectId' },
    { name: 'opportunities', field: 'opportunityId' }
  ];
  
  let totalUpdated = 0;
  
  for (const entity of entities) {
    console.log(`  📝 Processing ${entity.name}...`);
    
    // Get all entities
    const allEntities = await prisma[entity.name].findMany();
    
    // For each entity, find its most recent action
    const updates = [];
    
    for (const entityRecord of allEntities) {
      const lastAction = await prisma.actions.findFirst({
        where: {
          [entity.field]: entityRecord.id
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (lastAction) {
        const updateData = {};
        
        // Handle different field availability per entity type
        if (entity.name === 'leads') {
          updateData.lastAction = lastAction.type;
          updateData.lastActionDate = lastAction.createdAt;
        } else if (entity.name === 'prospects' || entity.name === 'opportunities') {
          updateData.lastActionDate = lastAction.createdAt;
        }
        
        updates.push(
          prisma[entity.name].update({
            where: { id: entityRecord.id },
            data: updateData
          })
        );
      }
    }
    
    if (updates.length > 0) {
      await Promise.all(updates);
      totalUpdated += updates.length;
      console.log(`    ✅ Updated ${updates.length} ${entity.name}`);
    }
  }
  
  console.log(`  ✅ Total entities updated: ${totalUpdated}`);
}

/**
 * Generate comprehensive report
 */
async function generateReport() {
  console.log('  📋 Generating comprehensive report...');
  
  // Get comprehensive statistics
  const totalActions = await prisma.actions.count();
  const totalCompanies = await prisma.company.count();
  const totalPeople = await prisma.person.count();
  const totalLeads = await prisma.lead.count();
  const totalProspects = await prisma.prospect.count();
  const totalOpportunities = await prisma.opportunity.count();
  
  // Get entities with lastAction data
  const entitiesWithLastAction = {
    companies: await prisma.company.count({ where: { lastAction: { not: null } } }),
    people: await prisma.person.count({ where: { lastAction: { not: null } } }),
    leads: await prisma.lead.count({ where: { lastAction: { not: null } } }),
    prospects: await prisma.prospect.count({ where: { lastActionDate: { not: null } } }),
    opportunities: await prisma.opportunity.count({ where: { lastActionDate: { not: null } } })
  };
  
  // Get entities with lastActionDate data
  const entitiesWithLastActionDate = {
    companies: await prisma.company.count({ where: { lastActionDate: { not: null } } }),
    people: await prisma.person.count({ where: { lastActionDate: { not: null } } }),
    leads: await prisma.lead.count({ where: { lastActionDate: { not: null } } }),
    prospects: await prisma.prospect.count({ where: { lastActionDate: { not: null } } }),
    opportunities: await prisma.opportunity.count({ where: { lastActionDate: { not: null } } })
  };
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalActions,
      totalEntities: totalCompanies + totalPeople + totalLeads + totalProspects + totalOpportunities,
      entitiesWithLastAction,
      entitiesWithLastActionDate
    },
    coverage: {
      lastActionCoverage: {
        companies: `${entitiesWithLastAction.companies}/${totalCompanies} (${Math.round(entitiesWithLastAction.companies/totalCompanies*100)}%)`,
        people: `${entitiesWithLastAction.people}/${totalPeople} (${Math.round(entitiesWithLastAction.people/totalPeople*100)}%)`,
        leads: `${entitiesWithLastAction.leads}/${totalLeads} (${Math.round(entitiesWithLastAction.leads/totalLeads*100)}%)`,
        prospects: `N/A (field not available)`,
        opportunities: `N/A (field not available)`
      },
      lastActionDateCoverage: {
        companies: `${entitiesWithLastActionDate.companies}/${totalCompanies} (${Math.round(entitiesWithLastActionDate.companies/totalCompanies*100)}%)`,
        people: `${entitiesWithLastActionDate.people}/${totalPeople} (${Math.round(entitiesWithLastActionDate.people/totalPeople*100)}%)`,
        leads: `${entitiesWithLastActionDate.leads}/${totalLeads} (${Math.round(entitiesWithLastActionDate.leads/totalLeads*100)}%)`,
        prospects: `${entitiesWithLastActionDate.prospects}/${totalProspects} (${Math.round(entitiesWithLastActionDate.prospects/totalProspects*100)}%)`,
        opportunities: `${entitiesWithLastActionDate.opportunities}/${totalOpportunities} (${Math.round(entitiesWithLastActionDate.opportunities/totalOpportunities*100)}%)`
      }
    }
  };
  
  console.log('\n📊 LAST ACTION POPULATION REPORT');
  console.log('=================================');
  console.log(`📅 Generated: ${report.timestamp}`);
  console.log(`📈 Total Actions: ${report.summary.totalActions}`);
  console.log(`🏢 Total Entities: ${report.summary.totalEntities}`);
  console.log('\n📊 LastAction Coverage:');
  for (const [entity, coverage] of Object.entries(report.coverage.lastActionCoverage)) {
    console.log(`  ${entity}: ${coverage}`);
  }
  console.log('\n📅 LastActionDate Coverage:');
  for (const [entity, coverage] of Object.entries(report.coverage.lastActionDateCoverage)) {
    console.log(`  ${entity}: ${coverage}`);
  }
  
  // Save report to file
  const fs = require('fs');
  const reportPath = 'last-action-population-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved to: ${reportPath}`);
}

// Run the last action population
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  populateCompaniesAndPeople,
  populateLeadsProspectsOpportunities,
  generateReport
};
