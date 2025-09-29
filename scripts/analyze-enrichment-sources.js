const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function analyzeEnrichmentSources() {
  try {
    await prisma.$connect();
    console.log('🔍 ENRICHMENT SOURCES ANALYSIS');
    console.log('==============================');
    console.log(`Workspace ID: ${WORKSPACE_ID}`);
    console.log(`Analysis Time: ${new Date().toLocaleString()}`);
    console.log('');

    // Get all people with their enrichment sources
    const allPeople = await prisma.people.findMany({
      where: { workspaceId: WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        workEmail: true,
        email: true,
        linkedinUrl: true,
        enrichmentSources: true,
        customFields: true,
        lastEnriched: true,
        updatedAt: true,
        company: {
          select: { name: true }
        }
      }
    });

    console.log(`📊 TOTAL PEOPLE: ${allPeople.length}`);
    console.log('');

    // Analyze enrichment sources
    const sourceAnalysis = {
      totalPeople: allPeople.length,
      withEnrichmentSources: 0,
      withCoreSignal: 0,
      withCustomFields: 0,
      enrichmentSources: {},
      sourceCombinations: {},
      recentActivity: [],
      linkedinBased: 0,
      emailBased: 0,
      bothBased: 0,
      neitherBased: 0
    };

    allPeople.forEach(person => {
      // Check for enrichment sources
      if (person.enrichmentSources && person.enrichmentSources.length > 0) {
        sourceAnalysis.withEnrichmentSources++;
        
        // Count individual sources
        person.enrichmentSources.forEach(source => {
          sourceAnalysis.enrichmentSources[source] = (sourceAnalysis.enrichmentSources[source] || 0) + 1;
        });
        
        // Check for source combinations
        const sourcesKey = person.enrichmentSources.sort().join('|');
        sourceAnalysis.sourceCombinations[sourcesKey] = (sourceAnalysis.sourceCombinations[sourcesKey] || 0) + 1;
        
        // Categorize by enrichment method
        const hasLinkedin = person.enrichmentSources.some(source => 
          source.includes('linkedin') || 
          source.includes('coresignal') || 
          source.includes('production') ||
          source.includes('full') ||
          source.includes('employee')
        );
        const hasEmail = person.enrichmentSources.some(source => 
          source.includes('email') || 
          source.includes('missing') ||
          source.includes('batch')
        );
        
        if (hasLinkedin && hasEmail) {
          sourceAnalysis.bothBased++;
        } else if (hasLinkedin) {
          sourceAnalysis.linkedinBased++;
        } else if (hasEmail) {
          sourceAnalysis.emailBased++;
        } else {
          sourceAnalysis.neitherBased++;
        }
      }
      
      // Check for CoreSignal data
      if (person.customFields?.coresignalData) {
        sourceAnalysis.withCoreSignal++;
      }
      
      // Check for any custom fields
      if (person.customFields && Object.keys(person.customFields).length > 0) {
        sourceAnalysis.withCustomFields++;
      }
      
      // Check for recent activity (last 7 days)
      if (person.lastEnriched && new Date(person.lastEnriched) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        sourceAnalysis.recentActivity.push({
          name: person.fullName,
          company: person.company?.name,
          sources: person.enrichmentSources,
          lastEnriched: person.lastEnriched,
          hasLinkedin: person.linkedinUrl ? 'Yes' : 'No',
          hasEmail: (person.workEmail || person.email) ? 'Yes' : 'No'
        });
      }
    });

    // Display comprehensive analysis
    console.log('📈 ENRICHMENT COVERAGE:');
    console.log('========================');
    console.log(`✅ With enrichment sources: ${sourceAnalysis.withEnrichmentSources} (${Math.round((sourceAnalysis.withEnrichmentSources/sourceAnalysis.totalPeople)*100)}%)`);
    console.log(`📊 With CoreSignal data: ${sourceAnalysis.withCoreSignal} (${Math.round((sourceAnalysis.withCoreSignal/sourceAnalysis.totalPeople)*100)}%)`);
    console.log(`📋 With any customFields: ${sourceAnalysis.withCustomFields} (${Math.round((sourceAnalysis.withCustomFields/sourceAnalysis.totalPeople)*100)}%)`);
    console.log('');

    console.log('🔧 ENRICHMENT SOURCES BREAKDOWN:');
    console.log('=================================');
    Object.entries(sourceAnalysis.enrichmentSources)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        const percentage = Math.round((count / sourceAnalysis.totalPeople) * 100);
        console.log(`   ${source}: ${count} people (${percentage}%)`);
      });
    console.log('');

    console.log('📊 ENRICHMENT METHOD CATEGORIZATION:');
    console.log('====================================');
    console.log(`🔗 LinkedIn-based: ${sourceAnalysis.linkedinBased} people`);
    console.log(`📧 Email-based: ${sourceAnalysis.emailBased} people`);
    console.log(`🔗📧 Both LinkedIn & Email: ${sourceAnalysis.bothBased} people`);
    console.log(`❓ Neither/Other: ${sourceAnalysis.neitherBased} people`);
    console.log('');

    console.log('🔍 TOP SOURCE COMBINATIONS:');
    console.log('============================');
    Object.entries(sourceAnalysis.sourceCombinations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15) // Top 15 combinations
      .forEach(([combination, count]) => {
        console.log(`   ${combination}: ${count} people`);
      });
    console.log('');

    console.log('🕒 RECENT ACTIVITY (Last 7 Days):');
    console.log('==================================');
    if (sourceAnalysis.recentActivity.length > 0) {
      console.log(`   ${sourceAnalysis.recentActivity.length} people enriched in the last 7 days`);
      sourceAnalysis.recentActivity
        .sort((a, b) => new Date(b.lastEnriched) - new Date(a.lastEnriched))
        .slice(0, 10) // Top 10 recent
        .forEach(activity => {
          console.log(`   ${activity.name} - Sources: ${activity.sources.join(', ')} - LinkedIn: ${activity.hasLinkedin}, Email: ${activity.hasEmail}`);
        });
    } else {
      console.log('   No recent activity in the last 7 days');
    }
    console.log('');

    // Calculate percentages
    const totalEnriched = sourceAnalysis.linkedinBased + sourceAnalysis.emailBased + sourceAnalysis.bothBased;
    if (totalEnriched > 0) {
      console.log('📊 ENRICHMENT METHOD PERCENTAGES:');
      console.log('=================================');
      console.log(`🔗 LinkedIn-based: ${sourceAnalysis.linkedinBased} (${Math.round((sourceAnalysis.linkedinBased/totalEnriched)*100)}%)`);
      console.log(`📧 Email-based: ${sourceAnalysis.emailBased} (${Math.round((sourceAnalysis.emailBased/totalEnriched)*100)}%)`);
      console.log(`🔗📧 Both methods: ${sourceAnalysis.bothBased} (${Math.round((sourceAnalysis.bothBased/totalEnriched)*100)}%)`);
    }

    console.log('');
    console.log('✅ ENRICHMENT SOURCES ANALYSIS COMPLETE');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeEnrichmentSources();
