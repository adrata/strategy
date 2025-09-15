#!/usr/bin/env node

/**
 * AUDIT ORPHANED ACTIONS
 * Quick analysis of orphaned actions to understand linking opportunities
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditOrphanedActions() {
  console.log('🔍 ORPHANED ACTIONS AUDIT');
  console.log('=========================\n');

  try {
    // Get sample of orphaned actions
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
      select: {
        id: true,
        type: true,
        subject: true,
        description: true,
        createdAt: true
      },
      take: 50
    });

    console.log(`📊 Found ${orphanedActions.length} orphaned actions to analyze:\n`);

    // Group by action type
    const actionTypes = {};
    orphanedActions.forEach(action => {
      if (!actionTypes[action.type]) {
        actionTypes[action.type] = [];
      }
      actionTypes[action.type].push(action);
    });

    // Analyze each action type
    for (const [type, actions] of Object.entries(actionTypes)) {
      console.log(`🎯 ${type.toUpperCase()} (${actions.length} actions):`);
      
      actions.slice(0, 5).forEach(action => {
        console.log(`  "${action.subject}"`);
        if (action.description) {
          console.log(`    Description: ${action.description.substring(0, 100)}...`);
        }
        
        // Extract potential linking clues
        const content = `${action.subject} ${action.description || ''}`.toLowerCase();
        const emailMatches = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
        const phoneMatches = content.match(/(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g);
        
        if (emailMatches) {
          console.log(`    📧 Emails: ${emailMatches.join(', ')}`);
        }
        if (phoneMatches) {
          console.log(`    📞 Phones: ${phoneMatches.join(', ')}`);
        }
        
        // Look for names (simple pattern)
        const nameMatches = content.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g);
        if (nameMatches) {
          console.log(`    👤 Names: ${nameMatches.slice(0, 3).join(', ')}`);
        }
        
        // Look for company indicators
        const companyWords = ['inc', 'llc', 'corp', 'company', 'ltd', 'enterprises', 'group', 'systems', 'solutions'];
        const hasCompanyWords = companyWords.some(word => content.includes(word));
        if (hasCompanyWords) {
          console.log(`    🏢 Company indicators found`);
        }
      });
      
      console.log('');
    }

    // Test linking strategies on a few examples
    console.log('🧪 TESTING LINKING STRATEGIES:');
    console.log('==============================');
    
    const testActions = orphanedActions.slice(0, 10);
    for (const action of testActions) {
      console.log(`\nTesting: "${action.subject}"`);
      
      // Strategy 1: Email matching
      const content = `${action.subject} ${action.description || ''}`;
      const emailMatches = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
      
      if (emailMatches) {
        for (const email of emailMatches) {
          const person = await prisma.people.findFirst({
            where: {
              workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
              OR: [
                { email: email },
                { workEmail: email },
                { personalEmail: email }
              ]
            },
            select: { id: true, fullName: true, companyId: true }
          });
          
          if (person) {
            console.log(`  ✅ Email match: ${email} -> ${person.fullName} (personId: ${person.id})`);
          } else {
            console.log(`  ❌ No person found for email: ${email}`);
          }
        }
      }
      
      // Strategy 2: Name matching
      const nameMatches = content.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g);
      if (nameMatches) {
        for (const name of nameMatches.slice(0, 2)) {
          const person = await prisma.people.findFirst({
            where: {
              workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
              fullName: { contains: name, mode: 'insensitive' }
            },
            select: { id: true, fullName: true, companyId: true }
          });
          
          if (person) {
            console.log(`  ✅ Name match: ${name} -> ${person.fullName} (personId: ${person.id})`);
          } else {
            console.log(`  ❌ No person found for name: ${name}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditOrphanedActions();

