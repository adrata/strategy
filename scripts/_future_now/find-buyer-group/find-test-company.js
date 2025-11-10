const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const workspaceId = '01K9QAP09FHT6EAP1B4G2KP3D2';
    
    // Find a company with website/LinkedIn that's likely to have employees
    const companies = await prisma.$queryRaw`
      SELECT id, name, website, "linkedinUrl", industry, "employeeCount", "mainSellerId"
      FROM companies 
      WHERE "workspaceId" = ${workspaceId}
      AND "deletedAt" IS NULL
      AND (website IS NOT NULL OR "linkedinUrl" IS NOT NULL)
      AND name NOT LIKE '%CNM%'
      ORDER BY 
        CASE WHEN "employeeCount" IS NOT NULL AND "employeeCount" > 10 THEN 1 ELSE 2 END,
        CASE WHEN website IS NOT NULL THEN 1 ELSE 2 END
      LIMIT 5
    `;
    
    console.log('=== COMPANIES AVAILABLE FOR TESTING ===\n');
    companies.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name}`);
      console.log(`   Website: ${c.website || 'N/A'}`);
      console.log(`   LinkedIn: ${c.linkedinUrl || 'N/A'}`);
      console.log(`   Employees: ${c.employeeCount || 'Unknown'}`);
      console.log(`   Industry: ${c.industry || 'N/A'}`);
      console.log(`   ID: ${c.id}`);
      console.log('');
    });
    
    if (companies.length > 0) {
      const testCompany = companies[0];
      console.log('✅ RECOMMENDED TEST COMPANY:');
      console.log(`   Name: ${testCompany.name}`);
      console.log(`   Identifier: ${testCompany.website || testCompany.linkedinUrl || testCompany.name}`);
      console.log(`   Main Seller ID: ${testCompany.mainSellerId || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();

