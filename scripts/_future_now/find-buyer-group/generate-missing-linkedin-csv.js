const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

(async () => {
  try {
    const workspaceId = '01K9QAP09FHT6EAP1B4G2KP3D2';
    
    // Get all companies without LinkedIn URLs
    const companies = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        website,
        "linkedinUrl",
        industry,
        "employeeCount",
        "mainSellerId",
        status,
        priority,
        "createdAt"
      FROM companies 
      WHERE "workspaceId" = ${workspaceId}
      AND "deletedAt" IS NULL
      AND ("linkedinUrl" IS NULL OR "linkedinUrl" = '')
      ORDER BY name
    `;
    
    console.log(`Found ${companies.length} companies without LinkedIn URLs`);
    
    // Get seller names for mainSellerId
    const sellerIds = [...new Set(companies.map(c => c.mainSellerId).filter(Boolean))];
    const sellers = sellerIds.length > 0 ? await prisma.$queryRaw`
      SELECT id, name, email
      FROM users
      WHERE id = ANY(${sellerIds})
    ` : [];
    
    const sellerMap = {};
    sellers.forEach(s => {
      sellerMap[s.id] = s.name || s.email;
    });
    
    // Create CSV
    const csvRows = [];
    csvRows.push('ID,Name,Website,LinkedIn URL,Industry,Employee Count,Main Seller,Status,Priority,Created At');
    
    companies.forEach(c => {
      const row = [
        c.id,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        c.website || '',
        c.linkedinUrl || '',
        c.industry || '',
        c.employeeCount || '',
        sellerMap[c.mainSellerId] || '',
        c.status || '',
        c.priority || '',
        c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : ''
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const outputPath = path.join(process.cwd(), 'companies-without-linkedin.csv');
    
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    
    console.log(`\n✅ CSV saved to: ${outputPath}`);
    console.log(`   Total companies: ${companies.length}`);
    console.log(`   With websites: ${companies.filter(c => c.website).length}`);
    console.log(`   Without websites: ${companies.filter(c => !c.website).length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
})();

