const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function checkTodaysEnrichment() {
  try {
    await prisma.$connect();
    console.log('🔍 TODAY\'S ENRICHMENT ACTIVITY');
    console.log('==============================');
    console.log(`Workspace ID: ${WORKSPACE_ID}`);
    console.log(`Analysis Time: ${new Date().toLocaleString()}`);
    console.log('');

    // Get today's date range
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log(`📅 Checking enrichment activity from: ${startOfToday.toISOString()}`);
    console.log(`📅 To: ${endOfToday.toISOString()}`);
    console.log('');

    // Get people enriched today
    const todaysEnrichment = await prisma.people.findMany({
      where: {
        workspaceId: WORKSPACE_ID,
        OR: [
          { lastEnriched: { gte: startOfToday, lt: endOfToday } },
          { updatedAt: { gte: startOfToday, lt: endOfToday } }
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

    console.log(`📊 PEOPLE ENRICHED TODAY: ${todaysEnrichment.length}`);
    console.log('');

    if (todaysEnrichment.length > 0) {
      // Analyze today's enrichment
      const analysis = {
        totalEnriched: todaysEnrichment.length,
        withCoreSignal: 0,
        enrichmentSources: {},
        companies: {},
        timeDistribution: {},
        dataQuality: {
          hasEmail: 0,
          hasLinkedin: 0,
          hasTitle: 0,
          hasPhone: 0,
          hasExperience: 0,
          hasEducation: 0,
          hasSkills: 0
        }
      };

      todaysEnrichment.forEach(person => {
        // Check for CoreSignal data
        if (person.customFields?.coresignalData) {
          analysis.withCoreSignal++;
        }
        
        // Count enrichment sources
        if (person.enrichmentSources) {
          person.enrichmentSources.forEach(source => {
            analysis.enrichmentSources[source] = (analysis.enrichmentSources[source] || 0) + 1;
          });
        }
        
        // Count companies
        const companyName = person.company?.name || 'Unknown';
        analysis.companies[companyName] = (analysis.companies[companyName] || 0) + 1;
        
        // Time distribution
        const hour = new Date(person.updatedAt).getHours();
        analysis.timeDistribution[hour] = (analysis.timeDistribution[hour] || 0) + 1;
        
        // Data quality analysis
        if (person.workEmail || person.email) analysis.dataQuality.hasEmail++;
        if (person.linkedinUrl) analysis.dataQuality.hasLinkedin++;
        
        if (person.customFields?.coresignalData) {
          const data = person.customFields.coresignalData;
          if (data.active_experience_title) analysis.dataQuality.hasTitle++;
          if (data.phone) analysis.dataQuality.hasPhone++;
          if (Array.isArray(data.experience) && data.experience.length > 0) analysis.dataQuality.hasExperience++;
          if (Array.isArray(data.education) && data.education.length > 0) analysis.dataQuality.hasEducation++;
          if (Array.isArray(data.inferred_skills) && data.inferred_skills.length > 0) analysis.dataQuality.hasSkills++;
        }
      });

      console.log('📈 TODAY\'S ENRICHMENT BREAKDOWN:');
      console.log('=================================');
      console.log(`✅ Total enriched: ${analysis.totalEnriched}`);
      console.log(`📊 With CoreSignal data: ${analysis.withCoreSignal} (${Math.round((analysis.withCoreSignal/analysis.totalEnriched)*100)}%)`);
      console.log('');

      console.log('🔧 ENRICHMENT SOURCES USED TODAY:');
      console.log('==================================');
      Object.entries(analysis.enrichmentSources)
        .sort(([,a], [,b]) => b - a)
        .forEach(([source, count]) => {
          console.log(`   ${source}: ${count} people`);
        });
      console.log('');

      console.log('🏢 TOP COMPANIES ENRICHED TODAY:');
      console.log('=================================');
      Object.entries(analysis.companies)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([company, count]) => {
          console.log(`   ${company}: ${count} people`);
        });
      console.log('');

      console.log('🕒 ENRICHMENT TIME DISTRIBUTION:');
      console.log('=================================');
      Object.entries(analysis.timeDistribution)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([hour, count]) => {
          const timeStr = `${hour}:00-${parseInt(hour)+1}:00`;
          console.log(`   ${timeStr}: ${count} people`);
        });
      console.log('');

      console.log('📊 DATA QUALITY (Today\'s Enrichment):');
      console.log('======================================');
      Object.entries(analysis.dataQuality).forEach(([field, count]) => {
        const percentage = Math.round((count / analysis.totalEnriched) * 100);
        console.log(`   ${field}: ${count}/${analysis.totalEnriched} (${percentage}%)`);
      });
      console.log('');

      console.log('👥 RECENT ENRICHMENTS (Last 20):');
      console.log('=================================');
      todaysEnrichment.slice(0, 20).forEach((person, index) => {
        const time = new Date(person.updatedAt).toLocaleTimeString();
        const company = person.company?.name || 'Unknown';
        const sources = person.enrichmentSources?.join(', ') || 'None';
        console.log(`   ${index + 1}. ${person.fullName} (${company}) - ${time} - Sources: ${sources}`);
      });

    } else {
      console.log('❌ No enrichment activity found for today');
      console.log('');
      
      // Check if there was any recent activity
      const recentActivity = await prisma.people.findMany({
        where: {
          workspaceId: WORKSPACE_ID,
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        },
        select: {
          fullName: true,
          updatedAt: true,
          enrichmentSources: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      });
      
      if (recentActivity.length > 0) {
        console.log('🕒 RECENT ACTIVITY (Last 24 Hours):');
        console.log('===================================');
        recentActivity.forEach((person, index) => {
          const time = new Date(person.updatedAt).toLocaleString();
          const sources = person.enrichmentSources?.join(', ') || 'None';
          console.log(`   ${index + 1}. ${person.fullName} - ${time} - Sources: ${sources}`);
        });
      }
    }

    console.log('');
    console.log('✅ TODAY\'S ENRICHMENT ANALYSIS COMPLETE');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodaysEnrichment();
