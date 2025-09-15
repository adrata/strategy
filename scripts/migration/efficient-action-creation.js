const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 🎯 EFFICIENT ACTION CREATION SYSTEM
 * 
 * This script creates actions efficiently by:
 * 1. Processing records in small batches to avoid timeouts
 * 2. Focusing on core people/company relationships
 * 3. Using bulk operations where possible
 * 4. Properly linking actions to people/companies (not legacy account/contact)
 */

async function createEfficientActions() {
  console.log('🎯 EFFICIENT ACTION CREATION SYSTEM');
  console.log('===================================');
  
  try {
    // 1. First, let's check what we have
    await auditCurrentState();
    
    // 2. Create actions for people and companies first (core entities)
    console.log('\n👥 STEP 1: Creating actions for PEOPLE (core entity)');
    await createPeopleActions();
    
    console.log('\n🏢 STEP 2: Creating actions for COMPANIES (core entity)');
    await createCompanyActions();
    
    // 3. Create actions for leads/prospects/opportunities linked to people/companies
    console.log('\n📋 STEP 3: Creating actions for LEADS linked to people/companies');
    await createLeadActions();
    
    console.log('\n🎯 STEP 4: Creating actions for PROSPECTS linked to people/companies');
    await createProspectActions();
    
    console.log('\n💰 STEP 5: Creating actions for OPPORTUNITIES linked to people/companies');
    await createOpportunityActions();
    
    // 4. Update lastAction fields
    console.log('\n🔗 STEP 6: Updating lastAction fields');
    await updateLastActionFields();
    
    console.log('\n✅ EFFICIENT ACTION CREATION COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error in efficient action creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function auditCurrentState() {
  console.log('🔍 AUDITING CURRENT STATE...');
  
  const totalActions = await prisma.actions.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  console.log(`📊 Total existing actions: ${totalActions}`);
  
  const peopleCount = await prisma.people.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  const companiesCount = await prisma.companies.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  const leadsCount = await prisma.leads.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  
  console.log(`👥 People: ${peopleCount}`);
  console.log(`🏢 Companies: ${companiesCount}`);
  console.log(`📋 Leads: ${leadsCount}`);
}

async function createPeopleActions() {
  const BATCH_SIZE = 50;
  let offset = 0;
  let totalCreated = 0;
  
  while (true) {
    const people = await prisma.people.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { id: true, fullName: true, createdAt: true, updatedAt: true },
      skip: offset,
      take: BATCH_SIZE
    });
    
    if (people.length === 0) break;
    
    console.log(`  Processing people batch ${Math.floor(offset/BATCH_SIZE) + 1} (${people.length} records)...`);
    
    for (const person of people) {
      const actionId = `person_created_${person.id}`;
      
      try {
        await prisma.actions.create({
          data: {
            id: actionId,
            type: 'person_created',
            subject: `New person added: ${person.fullName || 'Unknown'}`,
            description: `System created new person record`,
            status: 'completed',
            priority: 'normal',
            personId: person.id,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            completedAt: person.createdAt,
            createdAt: person.createdAt,
            updatedAt: person.updatedAt,
            metadata: {
              actionSource: 'system',
              recordType: 'people',
              recordId: person.id,
              systemAction: true
            }
          }
        });
        totalCreated++;
      } catch (error) {
        if (error.code !== 'P2002') { // Ignore duplicate key errors
          console.error(`    ❌ Error creating action for person ${person.id}:`, error.message);
        }
      }
    }
    
    offset += BATCH_SIZE;
  }
  
  console.log(`  ✅ Created ${totalCreated} people actions`);
}

async function createCompanyActions() {
  const BATCH_SIZE = 50;
  let offset = 0;
  let totalCreated = 0;
  
  while (true) {
    const companies = await prisma.companies.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
      skip: offset,
      take: BATCH_SIZE
    });
    
    if (companies.length === 0) break;
    
    console.log(`  Processing companies batch ${Math.floor(offset/BATCH_SIZE) + 1} (${companies.length} records)...`);
    
    for (const company of companies) {
      const actionId = `company_created_${company.id}`;
      
      try {
        await prisma.actions.create({
          data: {
            id: actionId,
            type: 'company_created',
            subject: `New company added: ${company.name || 'Unknown'}`,
            description: `System created new company record`,
            status: 'completed',
            priority: 'normal',
            companyId: company.id,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            completedAt: company.createdAt,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
            metadata: {
              actionSource: 'system',
              recordType: 'companies',
              recordId: company.id,
              systemAction: true
            }
          }
        });
        totalCreated++;
      } catch (error) {
        if (error.code !== 'P2002') { // Ignore duplicate key errors
          console.error(`    ❌ Error creating action for company ${company.id}:`, error.message);
        }
      }
    }
    
    offset += BATCH_SIZE;
  }
  
  console.log(`  ✅ Created ${totalCreated} company actions`);
}

async function createLeadActions() {
  const BATCH_SIZE = 100;
  let offset = 0;
  let totalCreated = 0;
  
  while (true) {
    const leads = await prisma.leads.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { 
        id: true, 
        fullName: true, 
        personId: true, 
        companyId: true, 
        createdAt: true, 
        updatedAt: true 
      },
      skip: offset,
      take: BATCH_SIZE
    });
    
    if (leads.length === 0) break;
    
    console.log(`  Processing leads batch ${Math.floor(offset/BATCH_SIZE) + 1} (${leads.length} records)...`);
    
    for (const lead of leads) {
      const actionId = `lead_created_${lead.id}`;
      
      try {
        await prisma.actions.create({
          data: {
            id: actionId,
            type: 'lead_created',
            subject: `New lead added: ${lead.fullName || 'Unknown'}`,
            description: `System created new lead record`,
            status: 'completed',
            priority: 'normal',
            personId: lead.personId,
            companyId: lead.companyId,
            leadId: lead.id,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            completedAt: lead.createdAt,
            createdAt: lead.createdAt,
            updatedAt: lead.updatedAt,
            metadata: {
              actionSource: 'system',
              recordType: 'leads',
              recordId: lead.id,
              systemAction: true
            }
          }
        });
        totalCreated++;
      } catch (error) {
        if (error.code !== 'P2002') { // Ignore duplicate key errors
          console.error(`    ❌ Error creating action for lead ${lead.id}:`, error.message);
        }
      }
    }
    
    offset += BATCH_SIZE;
  }
  
  console.log(`  ✅ Created ${totalCreated} lead actions`);
}

async function createProspectActions() {
  const BATCH_SIZE = 100;
  let offset = 0;
  let totalCreated = 0;
  
  while (true) {
    const prospects = await prisma.prospects.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { 
        id: true, 
        fullName: true, 
        personId: true, 
        companyId: true, 
        createdAt: true, 
        updatedAt: true 
      },
      skip: offset,
      take: BATCH_SIZE
    });
    
    if (prospects.length === 0) break;
    
    console.log(`  Processing prospects batch ${Math.floor(offset/BATCH_SIZE) + 1} (${prospects.length} records)...`);
    
    for (const prospect of prospects) {
      const actionId = `prospect_created_${prospect.id}`;
      
      try {
        await prisma.actions.create({
          data: {
            id: actionId,
            type: 'prospect_created',
            subject: `New prospect added: ${prospect.fullName || 'Unknown'}`,
            description: `System created new prospect record`,
            status: 'completed',
            priority: 'normal',
            personId: prospect.personId,
            companyId: prospect.companyId,
            prospectId: prospect.id,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            completedAt: prospect.createdAt,
            createdAt: prospect.createdAt,
            updatedAt: prospect.updatedAt,
            metadata: {
              actionSource: 'system',
              recordType: 'prospects',
              recordId: prospect.id,
              systemAction: true
            }
          }
        });
        totalCreated++;
      } catch (error) {
        if (error.code !== 'P2002') { // Ignore duplicate key errors
          console.error(`    ❌ Error creating action for prospect ${prospect.id}:`, error.message);
        }
      }
    }
    
    offset += BATCH_SIZE;
  }
  
  console.log(`  ✅ Created ${totalCreated} prospect actions`);
}

async function createOpportunityActions() {
  const BATCH_SIZE = 100;
  let offset = 0;
  let totalCreated = 0;
  
  while (true) {
    const opportunities = await prisma.opportunities.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { 
        id: true, 
        name: true, 
        personId: true, 
        companyId: true, 
        createdAt: true, 
        updatedAt: true 
      },
      skip: offset,
      take: BATCH_SIZE
    });
    
    if (opportunities.length === 0) break;
    
    console.log(`  Processing opportunities batch ${Math.floor(offset/BATCH_SIZE) + 1} (${opportunities.length} records)...`);
    
    for (const opportunity of opportunities) {
      const actionId = `opportunity_created_${opportunity.id}`;
      
      try {
        await prisma.actions.create({
          data: {
            id: actionId,
            type: 'opportunity_created',
            subject: `New opportunity created: ${opportunity.name || 'Unknown'}`,
            description: `System created new opportunity record`,
            status: 'completed',
            priority: 'normal',
            personId: opportunity.personId,
            companyId: opportunity.companyId,
            opportunityId: opportunity.id,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            completedAt: opportunity.createdAt,
            createdAt: opportunity.createdAt,
            updatedAt: opportunity.updatedAt,
            metadata: {
              actionSource: 'system',
              recordType: 'opportunities',
              recordId: opportunity.id,
              systemAction: true
            }
          }
        });
        totalCreated++;
      } catch (error) {
        if (error.code !== 'P2002') { // Ignore duplicate key errors
          console.error(`    ❌ Error creating action for opportunity ${opportunity.id}:`, error.message);
        }
      }
    }
    
    offset += BATCH_SIZE;
  }
  
  console.log(`  ✅ Created ${totalCreated} opportunity actions`);
}

async function updateLastActionFields() {
  console.log('  Updating lastAction fields for all records...');
  
  // Update people lastAction fields
  const peopleWithActions = await prisma.people.findMany({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
    select: { id: true }
  });
  
  let peopleUpdated = 0;
  for (const person of peopleWithActions) {
    const recentAction = await prisma.actions.findFirst({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        personId: person.id
      },
      orderBy: { createdAt: 'desc' },
      select: { subject: true, createdAt: true, status: true }
    });
    
    if (recentAction) {
      try {
        await prisma.people.update({
          where: { id: person.id },
          data: {
            lastAction: recentAction.subject,
            lastActionDate: recentAction.createdAt,
            actionStatus: recentAction.status
          }
        });
        peopleUpdated++;
      } catch (error) {
        console.error(`    ❌ Error updating lastAction for person ${person.id}:`, error.message);
      }
    }
  }
  
  console.log(`  ✅ Updated lastAction for ${peopleUpdated} people`);
  
  // Update companies lastAction fields
  const companiesWithActions = await prisma.companies.findMany({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
    select: { id: true }
  });
  
  let companiesUpdated = 0;
  for (const company of companiesWithActions) {
    const recentAction = await prisma.actions.findFirst({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        companyId: company.id
      },
      orderBy: { createdAt: 'desc' },
      select: { subject: true, createdAt: true, status: true }
    });
    
    if (recentAction) {
      try {
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            lastAction: recentAction.subject,
            lastActionDate: recentAction.createdAt,
            actionStatus: recentAction.status
          }
        });
        companiesUpdated++;
      } catch (error) {
        console.error(`    ❌ Error updating lastAction for company ${company.id}:`, error.message);
      }
    }
  }
  
  console.log(`  ✅ Updated lastAction for ${companiesUpdated} companies`);
}

// Run the efficient action creation
createEfficientActions();
