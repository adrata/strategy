const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCompanyDisplay() {
  try {
    const NOTARY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';
    
    console.log('🔧 Fixing company display in prospects table...\n');
    
    // Get prospects with personId but no company name
    const prospectsToFix = await prisma.prospects.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        personId: { not: null },
        OR: [
          { company: null },
          { company: '' }
        ]
      },
      select: {
        id: true,
        fullName: true,
        personId: true
      },
      take: 10
    });
    
    console.log(`Found ${prospectsToFix.length} prospects to fix (showing first 10):`);
    
    let fixedCount = 0;
    
    for (const prospect of prospectsToFix) {
      // Get the person's company information
      const person = await prisma.people.findUnique({
        where: { id: prospect.personId },
        select: {
          companyId: true,
          company: {
            select: {
              name: true
            }
          }
        }
      });
      
      if (person?.company?.name) {
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: { 
            company: person.company.name,
            companyId: person.companyId
          }
        });
        fixedCount++;
        console.log(`✅ Fixed ${prospect.fullName} - Company: ${person.company.name}`);
      } else {
        console.log(`❌ No company found for ${prospect.fullName}`);
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} prospects with company names`);
    
    // Now let's fix all prospects systematically
    console.log(`\n🔧 Fixing all prospects systematically...`);
    
    const allProspectsToFix = await prisma.prospects.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        personId: { not: null },
        OR: [
          { company: null },
          { company: '' }
        ]
      },
      select: {
        id: true,
        personId: true
      }
    });
    
    let totalFixed = 0;
    
    for (const prospect of allProspectsToFix) {
      const person = await prisma.people.findUnique({
        where: { id: prospect.personId },
        select: {
          companyId: true,
          company: {
            select: {
              name: true
            }
          }
        }
      });
      
      if (person?.company?.name) {
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: { 
            company: person.company.name,
            companyId: person.companyId
          }
        });
        totalFixed++;
      }
    }
    
    console.log(`🎉 Total prospects fixed: ${totalFixed}`);
    
    // Final verification
    const finalCounts = await Promise.all([
      prisma.prospects.count({
        where: {
          workspaceId: NOTARY_WORKSPACE_ID,
          company: { not: null }
        }
      }),
      prisma.prospects.count({
        where: {
          workspaceId: NOTARY_WORKSPACE_ID,
          companyId: { not: null }
        }
      })
    ]);
    
    console.log(`\n📊 Final verification:`);
    console.log(`- Prospects with company names: ${finalCounts[0]}`);
    console.log(`- Prospects with companyId: ${finalCounts[1]}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixCompanyDisplay();
