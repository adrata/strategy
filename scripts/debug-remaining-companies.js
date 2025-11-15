/**
 * 🔍 DEBUG: Remaining Companies
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

(async () => {
  const companies = ['Actelant', 'GAC Enterprises, LLC', 'Central Electric Power Cooperative', 'XIT RURAL TELEPHONE'];
  
  for (const companyName of companies) {
    const company = await prisma.companies.findFirst({
      where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID, name: companyName },
      select: { id: true, name: true }
    });
    
    if (!company) continue;
    
    console.log(`\n${companyName} (${company.id}):`);
    
    // Find people with COMPLETED actions (what the audit finds)
    const peopleWithActions = await prisma.people.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        companyId: company.id,
        deletedAt: null,
        actions: {
          some: {
            deletedAt: null,
            status: 'COMPLETED'
          }
        }
      },
      select: {
        id: true,
        fullName: true,
        companyId: true
      }
    });
    
    console.log(`  People with COMPLETED actions: ${peopleWithActions.length}`);
    
    for (const person of peopleWithActions) {
      console.log(`    ${person.fullName} (${person.id}):`);
      
      // Check what actions exist
      const actions = await prisma.actions.findMany({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          personId: person.id,
          deletedAt: null,
          status: 'COMPLETED',
          OR: [
            { companyId: null },
            { companyId: { not: company.id } }
          ]
        },
        select: {
          id: true,
          type: true,
          companyId: true
        }
      });
      
      console.log(`      Actions to fix: ${actions.length}`);
      if (actions.length > 0) {
        actions.forEach(a => {
          console.log(`        - ${a.type}: companyId = ${a.companyId || 'null'}`);
        });
        
        // Try to update
        const result = await prisma.actions.updateMany({
          where: {
            id: { in: actions.map(a => a.id) }
          },
          data: {
            companyId: company.id
          }
        });
        
        console.log(`      ✅ Updated ${result.count} actions`);
      }
    }
  }
  
  await prisma.$disconnect();
})();

