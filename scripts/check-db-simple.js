const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function check() {
  const results = [];
  
  try {
    // Check Southern Company
    const southern = await prisma.companies.findUnique({
      where: { id: '01K9QD2ST0C0TTG34EMRD3M69H' },
      select: {
        name: true,
        industry: true,
        description: true,
        descriptionEnriched: true,
        domain: true,
        website: true,
      },
    });

    results.push('=== SOUTHERN COMPANY STATUS ===');
    if (southern) {
      results.push(`Name: ${southern.name}`);
      results.push(`Industry: ${southern.industry || 'N/A'}`);
      results.push(`Domain: ${southern.domain || 'N/A'}`);
      results.push(`Website: ${southern.website || 'N/A'}`);
      results.push(`Description: ${southern.description ? southern.description.substring(0, 150) + '...' : 'NULL ✅'}`);
      results.push(`Description Enriched: ${southern.descriptionEnriched ? southern.descriptionEnriched.substring(0, 150) + '...' : 'NULL ✅'}`);
      
      const hasBadContent = 
        (southern.description && (southern.description.includes('ישראל') || southern.description.includes('כפר נופש') || southern.description.toLowerCase().includes('israeli resort'))) ||
        (southern.descriptionEnriched && (southern.descriptionEnriched.includes('ישראל') || southern.descriptionEnriched.includes('כפר נופש') || southern.descriptionEnriched.toLowerCase().includes('israeli resort')));
      
      results.push('');
      results.push('=== VALIDATION ===');
      if (hasBadContent) {
        results.push('❌ ISSUE STILL EXISTS: Description contains Israeli/resort content');
      } else {
        results.push('✅ FIXED: No Israeli/resort content found in descriptions');
      }
    } else {
      results.push('❌ Company not found');
    }

    // Check for any companies with Israeli content
    const withBadContent = await prisma.companies.findMany({
      where: {
        workspaceId: '01K75ZD7DWHG1XF16HAF2YVKCK',
        deletedAt: null,
        OR: [
          { description: { contains: 'ישראל' } },
          { description: { contains: 'כפר נופש' } },
          { descriptionEnriched: { contains: 'ישראל' } },
          { descriptionEnriched: { contains: 'כפר נופש' } },
        ],
      },
      select: { name: true, industry: true },
      take: 20,
    });

    results.push('');
    results.push('=== OVERALL DATABASE STATUS ===');
    const total = await prisma.companies.count({
      where: { workspaceId: '01K75ZD7DWHG1XF16HAF2YVKCK', deletedAt: null },
    });
    
    results.push(`Total companies: ${total}`);
    results.push(`Companies with Israeli/resort content: ${withBadContent.length}`);
    
    if (withBadContent.length > 0) {
      results.push('');
      results.push('⚠️  Companies still with bad content:');
      withBadContent.forEach(c => {
        results.push(`   - ${c.name} (${c.industry || 'N/A'})`);
      });
    } else {
      results.push('');
      results.push('✅ All companies cleaned - no Israeli/resort content found');
    }

    // Write to file
    const output = results.join('\n');
    fs.writeFileSync('db-check-results.txt', output);
    console.log(output);
    
  } catch (error) {
    const errorMsg = `Error: ${error.message}\n${error.stack}`;
    fs.writeFileSync('db-check-results.txt', errorMsg);
    console.error(errorMsg);
  } finally {
    await prisma.$disconnect();
  }
}

check();

