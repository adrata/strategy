const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const workspaceId = '01K9QAP09FHT6EAP1B4G2KP3D2';
    
    // Check companies without LinkedIn URLs
    const companiesWithoutLinkedIn = await prisma.$queryRaw`
      SELECT id, name, website, "linkedinUrl", "mainSellerId"
      FROM companies 
      WHERE "workspaceId" = ${workspaceId}
      AND "deletedAt" IS NULL
      AND ("linkedinUrl" IS NULL OR "linkedinUrl" = '')
      AND website IS NOT NULL
      ORDER BY name
      LIMIT 10
    `;
    
    console.log('=== COMPANIES WITHOUT LINKEDIN URLs ===\n');
    console.log(`Found ${companiesWithoutLinkedIn.length} companies without LinkedIn URLs\n`);
    
    companiesWithoutLinkedIn.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name}`);
      console.log(`   Website: ${c.website}`);
      console.log(`   ID: ${c.id}`);
      console.log('');
    });
    
    // Check companies WITH LinkedIn URLs
    const companiesWithLinkedIn = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM companies 
      WHERE "workspaceId" = ${workspaceId}
      AND "deletedAt" IS NULL
      AND "linkedinUrl" IS NOT NULL
      AND "linkedinUrl" != ''
    `;
    
    console.log(`\nCompanies WITH LinkedIn: ${companiesWithLinkedIn[0].count}`);
    console.log(`Companies WITHOUT LinkedIn: ${companiesWithoutLinkedIn.length}+`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();

