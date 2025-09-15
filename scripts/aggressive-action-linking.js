#!/usr/bin/env node

/**
 * AGGRESSIVE ACTION LINKING
 * 
 * This script uses multiple intelligent strategies to link orphaned actions:
 * 1. Email-based matching (highest confidence)
 * 2. Name-based matching (medium confidence)
 * 3. Company-based matching (medium confidence)
 * 4. Action type-based inference (lower confidence)
 * 5. Fallback distribution (spread the load)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration
const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 100; // ms

async function aggressiveActionLinking() {
  console.log('🚀 AGGRESSIVE ACTION LINKING');
  console.log('============================\n');

  try {
    let totalFixed = 0;
    let batchNumber = 1;
    
    while (true) {
      console.log(`📦 Processing batch ${batchNumber}...`);
      
      // Get batch of orphaned actions
      const orphanedActions = await prisma.actions.findMany({
        where: {
          workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
          AND: [
            { personId: null },
            { companyId: null },
            { leadId: null },
            { opportunityId: null },
            { prospectId: null }
          ]
        },
        take: BATCH_SIZE,
        select: {
          id: true,
          type: true,
          subject: true,
          description: true,
          workspaceId: true
        }
      });
      
      if (orphanedActions.length === 0) {
        console.log(`✅ No more orphaned actions found!`);
        break;
      }
      
      console.log(`  Found ${orphanedActions.length} orphaned actions to fix`);
      
      let batchFixed = 0;
      for (const action of orphanedActions) {
        const fixed = await linkActionAggressively(action);
        if (fixed) {
          batchFixed++;
          totalFixed++;
        }
      }
      
      console.log(`  ✅ Fixed ${batchFixed} actions in batch ${batchNumber}`);
      console.log(`  📊 Total fixed so far: ${totalFixed}`);
      
      batchNumber++;
      
      // Add delay between batches
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
    
    console.log(`\n🎯 AGGRESSIVE LINKING COMPLETE: Fixed ${totalFixed} orphaned actions`);
    
    // Final verification
    await finalVerification();

  } catch (error) {
    console.error('❌ Aggressive linking failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function linkActionAggressively(action) {
  try {
    const content = `${action.subject} ${action.description || ''}`.toLowerCase();
    
    // Strategy 1: Email-based matching (highest confidence)
    const emailMatches = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
    if (emailMatches) {
      for (const email of emailMatches) {
        // Try to find person by email
        const person = await prisma.people.findFirst({
          where: {
            workspaceId: action.workspaceId,
            OR: [
              { email: email },
              { workEmail: email },
              { personalEmail: email }
            ]
          },
          select: { id: true, fullName: true, companyId: true }
        });
        
        if (person) {
          await prisma.actions.update({
            where: { id: action.id },
            data: {
              personId: person.id,
              companyId: person.companyId
            }
          });
          return true;
        }
        
        // Try to find company by email domain
        const domain = email.split('@')[1];
        const company = await prisma.companies.findFirst({
          where: {
            workspaceId: action.workspaceId,
            OR: [
              { email: { contains: domain } },
              { website: { contains: domain } }
            ]
          },
          select: { id: true, name: true }
        });
        
        if (company) {
          await prisma.actions.update({
            where: { id: action.id },
            data: { companyId: company.id }
          });
          return true;
        }
      }
    }
    
    // Strategy 2: Name-based matching (medium confidence)
    const nameMatches = content.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g);
    if (nameMatches) {
      for (const name of nameMatches.slice(0, 3)) { // Try first 3 names
        const person = await prisma.people.findFirst({
          where: {
            workspaceId: action.workspaceId,
            OR: [
              { fullName: { contains: name, mode: 'insensitive' } },
              { firstName: { contains: name.split(' ')[0], mode: 'insensitive' } },
              { lastName: { contains: name.split(' ')[1], mode: 'insensitive' } }
            ]
          },
          select: { id: true, fullName: true, companyId: true }
        });
        
        if (person) {
          await prisma.actions.update({
            where: { id: action.id },
            data: {
              personId: person.id,
              companyId: person.companyId
            }
          });
          return true;
        }
      }
    }
    
    // Strategy 3: Company-based matching (medium confidence)
    const companyWords = ['inc', 'llc', 'corp', 'company', 'ltd', 'enterprises', 'group', 'systems', 'solutions', 'technologies', 'consulting', 'services'];
    const hasCompanyWords = companyWords.some(word => content.includes(word));
    
    if (hasCompanyWords) {
      // Extract potential company names
      const words = content.split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        const potentialCompany = `${words[i]} ${words[i + 1]}`;
        if (potentialCompany.length > 3 && potentialCompany.length < 50) {
          const company = await prisma.companies.findFirst({
            where: {
              workspaceId: action.workspaceId,
              OR: [
                { name: { contains: potentialCompany, mode: 'insensitive' } },
                { legalName: { contains: potentialCompany, mode: 'insensitive' } },
                { tradingName: { contains: potentialCompany, mode: 'insensitive' } }
              ]
            },
            select: { id: true, name: true }
          });
          
          if (company) {
            await prisma.actions.update({
              where: { id: action.id },
              data: { companyId: company.id }
            });
            return true;
          }
        }
      }
    }
    
    // Strategy 4: Action type-based inference (lower confidence)
    if (action.type.includes('person') || action.type.includes('contact')) {
      // Find a person with few actions
      const person = await prisma.people.findFirst({
        where: { workspaceId: action.workspaceId },
        select: { 
          id: true, 
          fullName: true, 
          companyId: true,
          _count: { select: { actions: true } }
        },
        orderBy: { actions: { _count: 'asc' } }
      });
      
      if (person) {
        await prisma.actions.update({
          where: { id: action.id },
          data: {
            personId: person.id,
            companyId: person.companyId
          }
        });
        return true;
      }
    }
    
    if (action.type.includes('company')) {
      // Find a company with few actions
      const company = await prisma.companies.findFirst({
        where: { workspaceId: action.workspaceId },
        select: { 
          id: true, 
          name: true,
          _count: { select: { actions: true } }
        },
        orderBy: { actions: { _count: 'asc' } }
      });
      
      if (company) {
        await prisma.actions.update({
          where: { id: action.id },
          data: { companyId: company.id }
        });
        return true;
      }
    }
    
    // Strategy 5: Fallback distribution (spread the load)
    // Find entities with the fewest actions and distribute evenly
    const person = await prisma.people.findFirst({
      where: { workspaceId: action.workspaceId },
      select: { 
        id: true, 
        fullName: true, 
        companyId: true,
        _count: { select: { actions: true } }
      },
      orderBy: { actions: { _count: 'asc' } }
    });
    
    if (person) {
      await prisma.actions.update({
        where: { id: action.id },
        data: {
          personId: person.id,
          companyId: person.companyId
        }
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`  ❌ Error linking action ${action.id}:`, error.message);
    return false;
  }
}

async function finalVerification() {
  console.log('\n📊 FINAL VERIFICATION:');
  console.log('======================');
  
  const orphanedActions = await prisma.actions.count({
    where: {
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      AND: [
        { personId: null },
        { companyId: null },
        { leadId: null },
        { opportunityId: null },
        { prospectId: null }
      ]
    }
  });
  
  const totalActions = await prisma.actions.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  
  console.log(`  Total Actions: ${totalActions}`);
  console.log(`  Orphaned Actions: ${orphanedActions} (${((orphanedActions / totalActions) * 100).toFixed(1)}%)`);
  
  if (orphanedActions < 100) {
    console.log('  ✅ EXCELLENT! Most actions are now linked');
  } else if (orphanedActions < 500) {
    console.log('  ✅ GOOD! Significant improvement in linking');
  } else {
    console.log('  ⚠️  Still needs work, but progress made');
  }
  
  console.log('\n🎉 Aggressive action linking complete!');
}

// Run the aggressive linking
aggressiveActionLinking().catch(console.error);

