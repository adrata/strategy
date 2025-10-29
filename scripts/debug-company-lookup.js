const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCompanyLookup() {
  try {
    console.log('🔍 Debugging company lookup...\n');
    
    const workspaceId = '01K7464TNANHQXPCZT1FYX205V';
    
    // Check the specific companies
    const companies = ['SketchUp', 'XMPro', 'Booksy'];
    
    for (const companyName of companies) {
      console.log(`\n🔍 Looking for: ${companyName}`);
      
      const company = await prisma.companies.findFirst({
        where: {
          name: {
            contains: companyName,
            mode: 'insensitive'
          }
        }
      });
      
      if (company) {
        console.log(`✅ Found: ${company.name}`);
        console.log(`   ID: ${company.id}`);
        console.log(`   Website: ${company.website}`);
        console.log(`   LinkedIn: ${company.linkedinUrl}`);
      } else {
        console.log(`❌ Not found: ${companyName}`);
      }
    }
    
    // Check what companies exist
    console.log(`\n📋 All companies in workspace:`);
    const allCompanies = await prisma.companies.findMany({
      where: { workspaceId },
      select: { id: true, name: true, website: true }
    });
    
    allCompanies.forEach(comp => {
      console.log(`  • ${comp.name} (${comp.website})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCompanyLookup();

