const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncCompleteActionModel() {
  console.log('🚀 Starting Complete Action Model Sync');
  console.log('=====================================');
  
  let totalUpdated = 0;
  const startTime = Date.now();
  
  try {
    // Step 1: Populate Last Action Fields
    console.log('\n📝 Step 1: Populating Last Action Fields...');
    totalUpdated += await populateLastActionFields();
    
    // Step 2: Generate AI-Powered Next Actions
    console.log('\n🤖 Step 2: Generating AI-Powered Next Actions...');
    totalUpdated += await generateNextActions();
    
    // Step 3: Verify Action Model Integrity
    console.log('\n🔍 Step 3: Verifying Action Model Integrity...');
    await verifyActionModelIntegrity();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n✅ Complete Action Model Sync Finished!');
    console.log(`📊 Total entities updated: ${totalUpdated}`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function populateLastActionFields() {
  let totalUpdated = 0;
  
  // Process companies and people (they have direct relations)
  const entitiesWithRelations = ['companies', 'people'];
  
  for (const entity of entitiesWithRelations) {
    console.log(`    📝 Processing ${entity}...`);
    
    const entitiesWithActions = await prisma[entity].findMany({
      include: {
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    const updates = entitiesWithActions.map(entityRecord => {
      const lastAction = entityRecord.actions[0];
      if (lastAction) {
        const updateData = {};
        if (entity === 'companies' || entity === 'people') {
          updateData.lastAction = lastAction.type;
          updateData.lastActionDate = lastAction.createdAt;
        }
        return prisma[entity].update({
          where: { id: entityRecord.id },
          data: updateData
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
  
  // Process leads, prospects, and opportunities (they don't have direct relations)
  const entitiesWithoutRelations = ['leads', 'prospects', 'opportunities'];
  
  for (const entity of entitiesWithoutRelations) {
    console.log(`    📝 Processing ${entity}...`);
    
    const allEntities = await prisma[entity].findMany();
    
    const updates = [];
    
    for (const entityRecord of allEntities) {
      const fieldMap = {
        'leads': 'leadId',
        'prospects': 'prospectId',
        'opportunities': 'opportunityId'
      };
      
      const lastAction = await prisma.actions.findFirst({
        where: {
          [fieldMap[entity]]: entityRecord.id
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (lastAction) {
        const updateData = {};
        if (entity === 'leads') {
          updateData.lastActionDate = lastAction.createdAt;
        } else if (entity === 'prospects') {
          updateData.lastActionDate = lastAction.createdAt;
        } else if (entity === 'opportunities') {
          updateData.lastActivityDate = lastAction.createdAt;
        }
        
        updates.push(
          prisma[entity].update({
            where: { id: entityRecord.id },
            data: updateData
          })
        );
      }
    }
    
    if (updates.length > 0) {
      await Promise.all(updates);
      totalUpdated += updates.length;
      console.log(`    ✅ Updated ${updates.length} ${entity}`);
    }
  }
  
  return totalUpdated;
}

async function generateNextActions() {
  let totalUpdated = 0;
  
  // For now, we'll use a simple rule-based approach
  // In the future, this can be enhanced with AI generation
  
  const entities = ['companies', 'people', 'leads', 'prospects'];
  
  for (const entity of entities) {
    console.log(`    🤖 Generating next actions for ${entity}...`);
    
    const entitiesWithoutNextAction = await prisma[entity].findMany({
      where: {
        nextAction: null
      },
      take: 100 // Process in batches to avoid memory issues
    });
    
    const updates = entitiesWithoutNextAction.map(entityRecord => {
      // Simple rule-based next action generation
      let nextAction = 'Follow up via email';
      let nextActionDate = new Date();
      nextActionDate.setDate(nextActionDate.getDate() + 3); // 3 days from now
      
      // More sophisticated logic can be added here based on:
      // - Last action type
      // - Entity status
      // - Time since last contact
      // - Industry/company type
      
      const updateData = {
        nextAction: nextAction,
        nextActionDate: nextActionDate
      };
      
      return prisma[entity].update({
        where: { id: entityRecord.id },
        data: updateData
      });
    });
    
    if (updates.length > 0) {
      await Promise.all(updates);
      totalUpdated += updates.length;
      console.log(`    ✅ Generated next actions for ${updates.length} ${entity}`);
    }
  }
  
  // Handle opportunities separately (they use nextActivityDate)
  console.log(`    🤖 Generating next actions for opportunities...`);
  const opportunitiesWithoutNextAction = await prisma.opportunities.findMany({
    where: {
      nextActivityDate: null
    },
    take: 100
  });
  
  const opportunityUpdates = opportunitiesWithoutNextAction.map(opportunity => {
    const nextActivityDate = new Date();
    nextActivityDate.setDate(nextActivityDate.getDate() + 5); // 5 days from now
    
    return prisma.opportunities.update({
      where: { id: opportunity.id },
      data: {
        nextActivityDate: nextActivityDate
      }
    });
  });
  
  if (opportunityUpdates.length > 0) {
    await Promise.all(opportunityUpdates);
    totalUpdated += opportunityUpdates.length;
    console.log(`    ✅ Generated next actions for ${opportunityUpdates.length} opportunities`);
  }
  
  return totalUpdated;
}

async function verifyActionModelIntegrity() {
  console.log('    🔍 Checking action model integrity...');
  
  // Check for orphaned actions
  const orphanedActions = await prisma.actions.count({
    where: {
      AND: [
        { companyId: null },
        { personId: null },
        { leadId: null },
        { prospectId: null },
        { opportunityId: null }
      ]
    }
  });
  
  console.log(`    📊 Orphaned actions: ${orphanedActions}`);
  
  // Check action distribution
  const actionTypes = await prisma.actions.groupBy({
    by: ['type'],
    _count: {
      type: true
    },
    orderBy: {
      _count: {
        type: 'desc'
      }
    }
  });
  
  console.log('    📊 Action type distribution:');
  actionTypes.slice(0, 10).forEach(actionType => {
    console.log(`        ${actionType.type}: ${actionType._count.type}`);
  });
  
  // Check entities with actions vs without
  const companiesWithActions = await prisma.companies.count({
    where: {
      actions: {
        some: {}
      }
    }
  });
  
  const peopleWithActions = await prisma.people.count({
    where: {
      actions: {
        some: {}
      }
    }
  });
  
  console.log(`    📊 Companies with actions: ${companiesWithActions}`);
  console.log(`    📊 People with actions: ${peopleWithActions}`);
}

// Run the sync
syncCompleteActionModel();
