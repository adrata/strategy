/**
 * Check Age of Cached Intelligence
 * 
 * Identifies companies with cached intelligence that was generated
 * before our logic fixes, so we know which ones need regeneration.
 */

import { prisma } from '../src/lib/prisma';

async function checkCachedIntelligenceAge(workspaceId: string) {
  console.log('🔍 Checking Age of Cached Intelligence\n');
  console.log('=' .repeat(80));
  
  try {
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        customFields: {
          path: ['strategyData'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        size: true,
        employeeCount: true,
        updatedAt: true,
        customFields: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`\n📊 Found ${companies.length} companies with cached intelligence\n`);
    
    // Our fixes were made around now - any intelligence generated before this
    // likely has the old logic issues
    const fixesDate = new Date('2025-01-14T00:00:00Z'); // Approximate date of fixes
    
    let oldCacheCount = 0;
    let newCacheCount = 0;
    let missingMetadataCount = 0;
    
    const oldCache: Array<{ name: string; id: string; lastUpdate: Date | null }> = [];
    
    for (const company of companies) {
      const customFields = company.customFields as any || {};
      const strategyData = customFields?.strategyData;
      
      if (!strategyData) continue;
      
      // Check if strategy has metadata about when it was generated
      const generatedAt = strategyData.strategyGeneratedAt || 
                         strategyData.generatedAt || 
                         customFields.lastStrategyUpdate;
      
      let isOld = false;
      
      if (generatedAt) {
        const generatedDate = new Date(generatedAt);
        if (generatedDate < fixesDate) {
          isOld = true;
        }
      } else {
        // No generation timestamp - check updatedAt as fallback
        // If company was updated before fixes, likely old cache
        if (company.updatedAt && company.updatedAt < fixesDate) {
          isOld = true;
        } else {
          // Can't determine - assume needs regeneration if it has issues
          missingMetadataCount++;
        }
      }
      
      // Also check for signs of old logic:
      // - Large company with "Fast-Growing Disruptor" archetype
      // - Missing growth stage or market position
      const parsedSize = typeof company.size === 'string' && company.size.includes('+') 
        ? parseInt(company.size.replace(/[^0-9]/g, ''), 10) 
        : (company.employeeCount || 0);
      
      const hasOldLogicIssues = 
        (parsedSize >= 1000 && strategyData.archetypeName === 'The Fast-Growing Disruptor') ||
        !strategyData.growthStage ||
        !strategyData.marketPosition;
      
      if (isOld || hasOldLogicIssues) {
        oldCacheCount++;
        oldCache.push({
          name: company.name,
          id: company.id,
          lastUpdate: generatedAt ? new Date(generatedAt) : company.updatedAt
        });
      } else {
        newCacheCount++;
      }
    }
    
    console.log('\n📈 Cache Age Analysis:');
    console.log('=' .repeat(80));
    console.log(`✅ Likely accurate (new logic): ${newCacheCount}`);
    console.log(`❌ Needs regeneration (old logic or issues): ${oldCacheCount}`);
    console.log(`⚠️  Missing metadata (uncertain): ${missingMetadataCount}`);
    
    if (oldCache.length > 0) {
      console.log('\n\n⚠️  Companies Needing Regeneration:');
      console.log('=' .repeat(80));
      console.log(`\nTotal: ${oldCache.length} companies\n`);
      
      oldCache.slice(0, 20).forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} (Last update: ${item.lastUpdate?.toISOString().split('T')[0] || 'Unknown'})`);
      });
      
      if (oldCache.length > 20) {
        console.log(`\n... and ${oldCache.length - 20} more companies`);
      }
      
      console.log('\n\n💡 Recommendation:');
      console.log(`   ALL ${oldCache.length} companies should be regenerated to ensure accuracy.`);
      console.log(`   Run: npm run regenerate:intelligence -- --workspace=${workspaceId}\n`);
    } else {
      console.log('\n\n✅ All cached intelligence appears to be accurate!\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const workspaceId = args.find(arg => arg.startsWith('--workspace='))?.split('=')[1] || '01K9QAP09FHT6EAP1B4G2KP3D2';
  
  checkCachedIntelligenceAge(workspaceId)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Check failed:', error);
      process.exit(1);
    });
}

export { checkCachedIntelligenceAge };

