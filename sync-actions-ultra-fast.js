const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncActionsUltraFast() {
  console.log('⚡ Ultra-Fast Action Model Sync');
  console.log('===============================');
  
  const startTime = Date.now();
  let totalUpdated = 0;
  
  try {
    // Step 1: Populate Last Actions (Ultra-Fast Batch Processing)
    console.log('\n📝 Step 1: Populating Last Actions (Ultra-Fast)...');
    totalUpdated += await populateLastActionsUltraFast();
    
    // Step 2: Generate Next Actions (Ultra-Fast Batch Processing)
    console.log('\n🤖 Step 2: Generating Next Actions (Ultra-Fast)...');
    totalUpdated += await generateNextActionsUltraFast();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n✅ Ultra-Fast Sync Complete!');
    console.log(`📊 Total entities updated: ${totalUpdated}`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    
  } catch (error) {
    console.error('❌ Error during ultra-fast sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function populateLastActionsUltraFast() {
  let totalUpdated = 0;
  
  // Process all entities in parallel using Promise.all()
  const promises = [];
  
  // Companies and People (with direct relations)
  promises.push(updateCompaniesLastActions());
  promises.push(updatePeopleLastActions());
  
  // Leads, Prospects, Opportunities (without direct relations)
  promises.push(updateLeadsLastActions());
  promises.push(updateProspectsLastActions());
  promises.push(updateOpportunitiesLastActions());
  
  const results = await Promise.all(promises);
  totalUpdated = results.reduce((sum, count) => sum + count, 0);
  
  return totalUpdated;
}

async function updateCompaniesLastActions() {
  console.log('    🏢 Processing companies...');
  
  // Get all companies with their latest action in one query
  const companiesWithActions = await prisma.companies.findMany({
    include: {
      actions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
  
  // Create batch updates
  const updates = companiesWithActions
    .filter(company => company.actions.length > 0)
    .map(company => {
      const lastAction = company.actions[0];
      return prisma.companies.update({
        where: { id: company.id },
        data: {
          lastAction: lastAction.type,
          lastActionDate: lastAction.createdAt
        }
      });
    });
  
  if (updates.length > 0) {
    await Promise.all(updates);
    console.log(`    ✅ Updated ${updates.length} companies`);
    return updates.length;
  }
  return 0;
}

async function updatePeopleLastActions() {
  console.log('    👥 Processing people...');
  
  const peopleWithActions = await prisma.people.findMany({
    include: {
      actions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
  
  const updates = peopleWithActions
    .filter(person => person.actions.length > 0)
    .map(person => {
      const lastAction = person.actions[0];
      return prisma.people.update({
        where: { id: person.id },
        data: {
          lastAction: lastAction.type,
          lastActionDate: lastAction.createdAt
        }
      });
    });
  
  if (updates.length > 0) {
    await Promise.all(updates);
    console.log(`    ✅ Updated ${updates.length} people`);
    return updates.length;
  }
  return 0;
}

async function updateLeadsLastActions() {
  console.log('    🎯 Processing leads...');
  
  // Get all leads
  const leads = await prisma.leads.findMany();
  
  // Process in batches of 1000 for memory efficiency
  const batchSize = 1000;
  let totalUpdated = 0;
  
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    
    const updates = await Promise.all(
      batch.map(async (lead) => {
        const lastAction = await prisma.actions.findFirst({
          where: { leadId: lead.id },
          orderBy: { createdAt: 'desc' }
        });
        
        if (lastAction) {
          return prisma.leads.update({
            where: { id: lead.id },
            data: { lastActionDate: lastAction.createdAt }
          });
        }
        return null;
      })
    );
    
    const validUpdates = updates.filter(Boolean);
    if (validUpdates.length > 0) {
      await Promise.all(validUpdates);
      totalUpdated += validUpdates.length;
    }
  }
  
  console.log(`    ✅ Updated ${totalUpdated} leads`);
  return totalUpdated;
}

async function updateProspectsLastActions() {
  console.log('    🔍 Processing prospects...');
  
  const prospects = await prisma.prospects.findMany();
  const batchSize = 1000;
  let totalUpdated = 0;
  
  for (let i = 0; i < prospects.length; i += batchSize) {
    const batch = prospects.slice(i, i + batchSize);
    
    const updates = await Promise.all(
      batch.map(async (prospect) => {
        const lastAction = await prisma.actions.findFirst({
          where: { prospectId: prospect.id },
          orderBy: { createdAt: 'desc' }
        });
        
        if (lastAction) {
          return prisma.prospects.update({
            where: { id: prospect.id },
            data: { lastActionDate: lastAction.createdAt }
          });
        }
        return null;
      })
    );
    
    const validUpdates = updates.filter(Boolean);
    if (validUpdates.length > 0) {
      await Promise.all(validUpdates);
      totalUpdated += validUpdates.length;
    }
  }
  
  console.log(`    ✅ Updated ${totalUpdated} prospects`);
  return totalUpdated;
}

async function updateOpportunitiesLastActions() {
  console.log('    💰 Processing opportunities...');
  
  const opportunities = await prisma.opportunities.findMany();
  
  const updates = await Promise.all(
    opportunities.map(async (opportunity) => {
      const lastAction = await prisma.actions.findFirst({
        where: { opportunityId: opportunity.id },
        orderBy: { createdAt: 'desc' }
      });
      
      if (lastAction) {
        return prisma.opportunities.update({
          where: { id: opportunity.id },
          data: { lastActivityDate: lastAction.createdAt }
        });
      }
      return null;
    })
  );
  
  const validUpdates = updates.filter(Boolean);
  if (validUpdates.length > 0) {
    await Promise.all(validUpdates);
    console.log(`    ✅ Updated ${validUpdates.length} opportunities`);
    return validUpdates.length;
  }
  return 0;
}

async function generateNextActionsUltraFast() {
  let totalUpdated = 0;
  
  // Process all entities in parallel
  const promises = [];
  promises.push(generateNextActionsForCompanies());
  promises.push(generateNextActionsForPeople());
  promises.push(generateNextActionsForLeads());
  promises.push(generateNextActionsForProspects());
  promises.push(generateNextActionsForOpportunities());
  
  const results = await Promise.all(promises);
  totalUpdated = results.reduce((sum, count) => sum + count, 0);
  
  return totalUpdated;
}

async function generateNextActionsForCompanies() {
  console.log('    🏢 Generating next actions for companies...');
  
  const companiesWithoutNextAction = await prisma.companies.findMany({
    where: { nextAction: null },
    take: 2000 // Process more at once
  });
  
  const updates = companiesWithoutNextAction.map(company => {
    const nextActionDate = new Date();
    nextActionDate.setDate(nextActionDate.getDate() + 3);
    
    return prisma.companies.update({
      where: { id: company.id },
      data: {
        nextAction: 'Follow up via email',
        nextActionDate: nextActionDate
      }
    });
  });
  
  if (updates.length > 0) {
    await Promise.all(updates);
    console.log(`    ✅ Generated next actions for ${updates.length} companies`);
    return updates.length;
  }
  return 0;
}

async function generateNextActionsForPeople() {
  console.log('    👥 Generating next actions for people...');
  
  const peopleWithoutNextAction = await prisma.people.findMany({
    where: { nextAction: null },
    take: 2000
  });
  
  const updates = peopleWithoutNextAction.map(person => {
    const nextActionDate = new Date();
    nextActionDate.setDate(nextActionDate.getDate() + 3);
    
    return prisma.people.update({
      where: { id: person.id },
      data: {
        nextAction: 'Follow up via email',
        nextActionDate: nextActionDate
      }
    });
  });
  
  if (updates.length > 0) {
    await Promise.all(updates);
    console.log(`    ✅ Generated next actions for ${updates.length} people`);
    return updates.length;
  }
  return 0;
}

async function generateNextActionsForLeads() {
  console.log('    🎯 Generating next actions for leads...');
  
  const leadsWithoutNextAction = await prisma.leads.findMany({
    where: { nextAction: null },
    take: 2000
  });
  
  const updates = leadsWithoutNextAction.map(lead => {
    const nextActionDate = new Date();
    nextActionDate.setDate(nextActionDate.getDate() + 2);
    
    return prisma.leads.update({
      where: { id: lead.id },
      data: {
        nextAction: 'Qualify lead via call',
        nextActionDate: nextActionDate
      }
    });
  });
  
  if (updates.length > 0) {
    await Promise.all(updates);
    console.log(`    ✅ Generated next actions for ${updates.length} leads`);
    return updates.length;
  }
  return 0;
}

async function generateNextActionsForProspects() {
  console.log('    🔍 Generating next actions for prospects...');
  
  const prospectsWithoutNextAction = await prisma.prospects.findMany({
    where: { nextAction: null },
    take: 2000
  });
  
  const updates = prospectsWithoutNextAction.map(prospect => {
    const nextActionDate = new Date();
    nextActionDate.setDate(nextActionDate.getDate() + 4);
    
    return prisma.prospects.update({
      where: { id: prospect.id },
      data: {
        nextAction: 'Send proposal',
        nextActionDate: nextActionDate
      }
    });
  });
  
  if (updates.length > 0) {
    await Promise.all(updates);
    console.log(`    ✅ Generated next actions for ${updates.length} prospects`);
    return updates.length;
  }
  return 0;
}

async function generateNextActionsForOpportunities() {
  console.log('    💰 Generating next actions for opportunities...');
  
  const opportunitiesWithoutNextAction = await prisma.opportunities.findMany({
    where: { nextActivityDate: null }
  });
  
  const updates = opportunitiesWithoutNextAction.map(opportunity => {
    const nextActivityDate = new Date();
    nextActivityDate.setDate(nextActivityDate.getDate() + 5);
    
    return prisma.opportunities.update({
      where: { id: opportunity.id },
      data: {
        nextActivityDate: nextActivityDate
      }
    });
  });
  
  if (updates.length > 0) {
    await Promise.all(updates);
    console.log(`    ✅ Generated next actions for ${updates.length} opportunities`);
    return updates.length;
  }
  return 0;
}

// Run the ultra-fast sync
syncActionsUltraFast();
