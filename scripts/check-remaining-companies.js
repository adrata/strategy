/**
 * 🔍 CHECK: Remaining Companies Status
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
    
    if (!company) {
      console.log(`\n${companyName}: Not found`);
      continue;
    }
    
    const person = await prisma.people.findFirst({
      where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID, companyId: company.id, deletedAt: null },
      select: { id: true, fullName: true }
    });
    
    if (!person) {
      console.log(`\n${companyName}: No people found`);
      continue;
    }
    
    const allActions = await prisma.actions.findMany({
      where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID, personId: person.id, deletedAt: null },
      select: { id: true, type: true, status: true, companyId: true }
    });
    
    const completedActions = allActions.filter(a => a.status === 'COMPLETED');
    const actionsWithCompany = completedActions.filter(a => a.companyId === company.id);
    const actionsWithoutCompany = completedActions.filter(a => !a.companyId || a.companyId !== company.id);
    
    console.log(`\n${companyName} (${person.fullName}):`);
    console.log(`  Total actions: ${allActions.length}`);
    console.log(`  COMPLETED actions: ${completedActions.length}`);
    console.log(`  With correct companyId: ${actionsWithCompany.length}`);
    console.log(`  Without/wrong companyId: ${actionsWithoutCompany.length}`);
    
    if (actionsWithoutCompany.length > 0) {
      console.log(`  Actions to fix:`);
      actionsWithoutCompany.forEach(a => {
        console.log(`    - ${a.type} (${a.status}) - companyId: ${a.companyId || 'null'}`);
      });
    }
  }
  
  await prisma.$disconnect();
})();
