const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function checkRecentMassiveEnrichment() {
  try {
    await prisma.$connect();
    console.log('🔍 RECENT MASSIVE ENRICHMENT ANALYSIS');
    console.log('=====================================');
    console.log(`Workspace ID: ${WORKSPACE_ID}`);
    console.log(`Analysis Time: ${new Date().toLocaleString()}`);
    console.log('');

    // Check last 3 days for massive enrichment activity
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    console.log(`📅 Checking enrichment activity from: ${threeDaysAgo.toISOString()}`);
    console.log(`📅 To: ${new Date().toISOString()}`);
    console.log('');

    // Get people enriched in the last 3 days
    const recentEnrichment = await prisma.people.findMany({
      where: {
        workspaceId: WORKSPACE_ID,
        OR: [
          { lastEnriched: { gte: threeDaysAgo } },
          { updatedAt: { gte: threeDaysAgo } }
        ]
      },
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
      },
      orderBy: { updatedAt: 'desc' }
    });

    console.log(`📊 PEOPLE ENRICHED IN LAST 3 DAYS: ${recentEnrichment.length}`);
    console.log('');

    if (recentEnrichment.length > 0) {
      // Group by day
      const enrichmentByDay = {};
      const enrichmentByHour = {};
      
      recentEnrichment.forEach(person => {
        const updateDate = new Date(person.updatedAt);
        const dayKey = updateDate.toISOString().split('T')[0];
        const hourKey = updateDate.getHours();
        
        if (!enrichmentByDay[dayKey]) {
          enrichmentByDay[dayKey] = [];
        }
        enrichmentByDay[dayKey].push(person);
        
        enrichmentByHour[hourKey] = (enrichmentByHour[hourKey] || 0) + 1;
      });

      console.log('📅 ENRICHMENT BY DAY:');
      console.log('=====================');
      Object.entries(enrichmentByDay)
        .sort(([a], [b]) => b.localeCompare(a))
        .forEach(([day, people]) => {
          console.log(`   ${day}: ${people.length} people`);
        });
      console.log('');

      console.log('🕒 ENRICHMENT BY HOUR (Last 3 Days):');
      console.log('=====================================');
      Object.entries(enrichmentByHour)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([hour, count]) => {
          const timeStr = `${hour}:00-${parseInt(hour)+1}:00`;
          console.log(`   ${timeStr}: ${count} people`);
        });
      console.log('');

      // Analyze the biggest enrichment day
      const biggestDay = Object.entries(enrichmentByDay)
        .sort(([,a], [,b]) => b.length - a.length)[0];
      
      if (biggestDay) {
        const [day, people] = biggestDay;
        console.log(`🚀 BIGGEST ENRICHMENT DAY: ${day} (${people.length} people)`);
        console.log('==================================================');
        
        // Analyze sources used that day
        const sourcesUsed = {};
        people.forEach(person => {
          if (person.enrichmentSources) {
            person.enrichmentSources.forEach(source => {
              sourcesUsed[source] = (sourcesUsed[source] || 0) + 1;
            });
          }
        });
        
        console.log('🔧 SOURCES USED THAT DAY:');
        Object.entries(sourcesUsed)
          .sort(([,a], [,b]) => b - a)
          .forEach(([source, count]) => {
            console.log(`   ${source}: ${count} people`);
          });
        console.log('');

        // Show sample of people enriched that day
        console.log('👥 SAMPLE OF PEOPLE ENRICHED THAT DAY:');
        people.slice(0, 20).forEach((person, index) => {
          const time = new Date(person.updatedAt).toLocaleTimeString();
          const company = person.company?.name || 'Unknown';
          const sources = person.enrichmentSources?.join(', ') || 'None';
          console.log(`   ${index + 1}. ${person.fullName} (${company}) - ${time} - Sources: ${sources}`);
        });
        
        if (people.length > 20) {
          console.log(`   ... and ${people.length - 20} more people`);
        }
        console.log('');
      }

      // Check for any bulk enrichment patterns
      console.log('🔍 BULK ENRICHMENT PATTERNS:');
      console.log('============================');
      
      // Look for people enriched in quick succession (same minute)
      const enrichmentByMinute = {};
      recentEnrichment.forEach(person => {
        const updateDate = new Date(person.updatedAt);
        const minuteKey = updateDate.toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
        if (!enrichmentByMinute[minuteKey]) {
          enrichmentByMinute[minuteKey] = [];
        }
        enrichmentByMinute[minuteKey].push(person);
      });

      const bulkMinutes = Object.entries(enrichmentByMinute)
        .filter(([,people]) => people.length >= 5) // 5+ people in same minute
        .sort(([,a], [,b]) => b.length - a.length);

      if (bulkMinutes.length > 0) {
        console.log('⚡ BULK ENRICHMENT MINUTES (5+ people):');
        bulkMinutes.slice(0, 10).forEach(([minute, people]) => {
          console.log(`   ${minute}: ${people.length} people`);
        });
      } else {
        console.log('   No bulk enrichment patterns detected (5+ people per minute)');
      }
      console.log('');

      // Check for specific enrichment scripts that might have been used
      console.log('🔧 ENRICHMENT SCRIPT ANALYSIS:');
      console.log('===============================');
      
      const scriptPatterns = {
        'Production 100 People': /production.*100.*people/i,
        'Full CoreSignal': /coresignal.*full/i,
        'Employee Complete': /employee.*complete/i,
        'Missing Data': /missing.*data/i,
        'Basic CoreSignal': /^coresignal$/i
      };

      Object.entries(scriptPatterns).forEach(([scriptName, pattern]) => {
        const matches = recentEnrichment.filter(person => 
          person.enrichmentSources?.some(source => pattern.test(source))
        );
        if (matches.length > 0) {
          console.log(`   ${scriptName}: ${matches.length} people`);
        }
      });
    }

    console.log('');
    console.log('✅ RECENT MASSIVE ENRICHMENT ANALYSIS COMPLETE');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentMassiveEnrichment();
