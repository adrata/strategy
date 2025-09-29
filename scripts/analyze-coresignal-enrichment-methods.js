const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function analyzeCoreSignalEnrichmentMethods() {
  try {
    await prisma.$connect();
    console.log('🔍 COMPREHENSIVE CORESIGNAL ENRICHMENT ANALYSIS');
    console.log('================================================');
    console.log(`Workspace ID: ${WORKSPACE_ID}`);
    console.log(`Analysis Time: ${new Date().toLocaleString()}`);
    console.log('');

    // Get all people with any enrichment data
    const allPeople = await prisma.people.findMany({
      where: { workspaceId: WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        workEmail: true,
        jobTitle: true,
        linkedinUrl: true,
        customFields: true,
        enrichmentSources: true,
        lastEnriched: true,
        updatedAt: true,
        company: {
          select: { name: true }
        }
      }
    });

    console.log(`📊 TOTAL PEOPLE: ${allPeople.length}`);
    console.log('');

    // Analyze enrichment methods and data structures
    const analysis = {
      totalPeople: allPeople.length,
      withCoreSignal: 0,
      withCustomFields: 0,
      enrichmentMethods: {},
      dataStructures: {},
      recentActivity: [],
      validationMetadata: {},
      confidenceScores: {},
      issues: {}
    };

    allPeople.forEach(person => {
      // Check for CoreSignal data
      if (person.customFields?.coresignalData) {
        analysis.withCoreSignal++;
        
        const coresignalData = person.customFields.coresignalData;
        
        // Analyze enrichment source
        const source = coresignalData.enrichmentSource || 'Unknown';
        analysis.enrichmentMethods[source] = (analysis.enrichmentMethods[source] || 0) + 1;
        
        // Analyze data structure
        const hasExperience = Array.isArray(coresignalData.experience) && coresignalData.experience.length > 0;
        const hasEducation = Array.isArray(coresignalData.education) && coresignalData.education.length > 0;
        const hasSkills = Array.isArray(coresignalData.inferred_skills) && coresignalData.inferred_skills.length > 0;
        const hasEmail = coresignalData.primary_professional_email;
        const hasTitle = coresignalData.active_experience_title;
        const hasPhone = coresignalData.phone;
        
        const dataStructure = {
          experience: hasExperience,
          education: hasEducation,
          skills: hasSkills,
          email: hasEmail,
          title: hasTitle,
          phone: hasPhone
        };
        
        const structureKey = Object.entries(dataStructure)
          .map(([key, value]) => `${key}:${value ? 'Y' : 'N'}`)
          .join('|');
        analysis.dataStructures[structureKey] = (analysis.dataStructures[structureKey] || 0) + 1;
        
        // Analyze validation metadata
        if (coresignalData.validationMetadata) {
          const confidence = coresignalData.validationMetadata.confidenceScore;
          if (confidence) {
            const range = Math.floor(confidence / 10) * 10;
            analysis.confidenceScores[`${range}-${range + 9}%`] = (analysis.confidenceScores[`${range}-${range + 9}%`] || 0) + 1;
          }
          
          const methods = coresignalData.validationMetadata.validationMethods || [];
          methods.forEach(method => {
            analysis.validationMetadata[method] = (analysis.validationMetadata[method] || 0) + 1;
          });
          
          const issues = coresignalData.validationMetadata.validationIssues || [];
          issues.forEach(issue => {
            analysis.issues[issue] = (analysis.issues[issue] || 0) + 1;
          });
        }
        
        // Check for recent activity (last 7 days)
        if (person.lastEnriched && new Date(person.lastEnriched) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
          analysis.recentActivity.push({
            name: person.fullName,
            company: person.company?.name,
            source: source,
            lastEnriched: person.lastEnriched,
            confidence: coresignalData.validationMetadata?.confidenceScore || 'N/A'
          });
        }
      }
      
      // Check for any custom fields
      if (person.customFields && Object.keys(person.customFields).length > 0) {
        analysis.withCustomFields++;
      }
    });

    // Display comprehensive analysis
    console.log('📈 ENRICHMENT COVERAGE:');
    console.log('========================');
    console.log(`✅ With CoreSignal data: ${analysis.withCoreSignal} (${Math.round((analysis.withCoreSignal/analysis.totalPeople)*100)}%)`);
    console.log(`📋 With any customFields: ${analysis.withCustomFields} (${Math.round((analysis.withCustomFields/analysis.totalPeople)*100)}%)`);
    console.log('');

    console.log('🔧 ENRICHMENT METHODS USED:');
    console.log('============================');
    Object.entries(analysis.enrichmentMethods)
      .sort(([,a], [,b]) => b - a)
      .forEach(([method, count]) => {
        console.log(`   ${method}: ${count} people`);
      });
    console.log('');

    console.log('📊 DATA STRUCTURE PATTERNS:');
    console.log('===========================');
    Object.entries(analysis.dataStructures)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) // Top 10 patterns
      .forEach(([pattern, count]) => {
        console.log(`   ${pattern}: ${count} people`);
      });
    console.log('');

    console.log('✅ VALIDATION METHODS:');
    console.log('======================');
    Object.entries(analysis.validationMetadata)
      .sort(([,a], [,b]) => b - a)
      .forEach(([method, count]) => {
        console.log(`   ${method}: ${count} validations`);
      });
    console.log('');

    console.log('📊 CONFIDENCE SCORE DISTRIBUTION:');
    console.log('==================================');
    Object.entries(analysis.confidenceScores)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([range, count]) => {
        console.log(`   ${range}: ${count} people`);
      });
    console.log('');

    console.log('⚠️ VALIDATION ISSUES:');
    console.log('=====================');
    Object.entries(analysis.issues)
      .sort(([,a], [,b]) => b - a)
      .forEach(([issue, count]) => {
        console.log(`   ${issue}: ${count} occurrences`);
      });
    console.log('');

    console.log('🕒 RECENT ACTIVITY (Last 7 Days):');
    console.log('==================================');
    if (analysis.recentActivity.length > 0) {
      analysis.recentActivity
        .sort((a, b) => new Date(b.lastEnriched) - new Date(a.lastEnriched))
        .slice(0, 10) // Top 10 recent
        .forEach(activity => {
          console.log(`   ${activity.name} (${activity.company}) - ${activity.source} - ${activity.confidence}% confidence`);
        });
    } else {
      console.log('   No recent activity in the last 7 days');
    }
    console.log('');

    // Analyze specific enrichment approaches
    console.log('🔍 ENRICHMENT APPROACH ANALYSIS:');
    console.log('================================');
    
    const approaches = {
      'Production 100 People': analysis.enrichmentMethods['CoreSignal API - Production 100 People with Accuracy Validation'] || 0,
      'Production with Accuracy': analysis.enrichmentMethods['CoreSignal API - Production with Accuracy Validation'] || 0,
      'Full Data': analysis.enrichmentMethods['CoreSignal API - Full Data'] || 0,
      'Missing Data': analysis.enrichmentMethods['CoreSignal API - Missing Data Enrichment'] || 0,
      'Basic CoreSignal': analysis.enrichmentMethods['CoreSignal API'] || 0
    };
    
    Object.entries(approaches)
      .sort(([,a], [,b]) => b - a)
      .forEach(([approach, count]) => {
        console.log(`   ${approach}: ${count} people`);
      });
    console.log('');

    // Data quality analysis
    console.log('📈 DATA QUALITY ANALYSIS:');
    console.log('=========================');
    
    const qualityMetrics = {
      'Has Email': 0,
      'Has Title': 0,
      'Has Phone': 0,
      'Has Experience': 0,
      'Has Education': 0,
      'Has Skills': 0,
      'Has LinkedIn': 0,
      'Has Location': 0
    };
    
    allPeople.forEach(person => {
      if (person.customFields?.coresignalData) {
        const data = person.customFields.coresignalData;
        if (data.primary_professional_email) qualityMetrics['Has Email']++;
        if (data.active_experience_title) qualityMetrics['Has Title']++;
        if (data.phone) qualityMetrics['Has Phone']++;
        if (Array.isArray(data.experience) && data.experience.length > 0) qualityMetrics['Has Experience']++;
        if (Array.isArray(data.education) && data.education.length > 0) qualityMetrics['Has Education']++;
        if (Array.isArray(data.inferred_skills) && data.inferred_skills.length > 0) qualityMetrics['Has Skills']++;
        if (data.linkedin_url) qualityMetrics['Has LinkedIn']++;
        if (data.location_full) qualityMetrics['Has Location']++;
      }
    });
    
    Object.entries(qualityMetrics).forEach(([metric, count]) => {
      const percentage = Math.round((count / analysis.withCoreSignal) * 100);
      console.log(`   ${metric}: ${count}/${analysis.withCoreSignal} (${percentage}%)`);
    });

    console.log('');
    console.log('✅ COMPREHENSIVE ANALYSIS COMPLETE');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCoreSignalEnrichmentMethods();
