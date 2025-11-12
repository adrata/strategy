/**
 * Investigation Script: Missing Lead Titles and Company Intelligence
 * 
 * This script investigates:
 * 1. Person records missing titles (jobTitle/title fields)
 * 2. Company records missing intelligence fields
 * 3. Enrichment coverage analysis
 * 4. Data source quality assessment
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MissingDataInvestigator {
  constructor() {
    this.results = {
      peopleMissingTitles: [],
      companiesMissingIntelligence: [],
      enrichmentCoverage: {
        totalPeople: 0,
        enrichedPeople: 0,
        enrichmentSources: {},
        missingTitles: 0,
        missingLinkedIn: 0,
        missingPhone: 0
      },
      companyIntelligence: {
        totalCompanies: 0,
        withIntelligence: 0,
        intelligenceFields: {
          businessChallenges: 0,
          businessPriorities: 0,
          competitiveAdvantages: 0,
          growthOpportunities: 0,
          techStack: 0
        }
      },
      dataSources: {
        csvImport: 0,
        manualEntry: 0,
        enrichment: 0,
        unknown: 0
      }
    };
  }

  async investigate() {
    console.log('🔍 Starting investigation of missing titles and company intelligence...\n');

    try {
      // Get workspace ID from environment or use a default
      const workspaceId = process.env.WORKSPACE_ID || process.argv[2];
      
      if (!workspaceId) {
        console.error('❌ Error: WORKSPACE_ID environment variable or workspace ID argument required');
        console.log('Usage: node investigate-missing-titles-and-intelligence.js <workspaceId>');
        process.exit(1);
      }

      console.log(`📊 Investigating workspace: ${workspaceId}\n`);

      await this.investigatePeopleTitles(workspaceId);
      await this.investigateCompanyIntelligence(workspaceId);
      await this.analyzeEnrichmentCoverage(workspaceId);
      await this.analyzeDataSources(workspaceId);

      this.generateReport();
    } catch (error) {
      console.error('❌ Error during investigation:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async investigatePeopleTitles(workspaceId) {
    console.log('👤 Investigating Person records missing titles...\n');

    // Find all people in workspace
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        workEmail: true,
        jobTitle: true,
        title: true,
        phone: true,
        linkedinUrl: true,
        status: true,
        source: true,
        enrichmentSources: true,
        customFields: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    this.results.enrichmentCoverage.totalPeople = allPeople.length;

    // Find people missing titles
    const missingTitles = allPeople.filter(person => {
      const hasJobTitle = person.jobTitle && person.jobTitle.trim() !== '';
      const hasTitle = person.title && person.title.trim() !== '';
      return !hasJobTitle && !hasTitle;
    });

    this.results.peopleMissingTitles = missingTitles.map(person => ({
      id: person.id,
      fullName: person.fullName,
      email: person.email || person.workEmail,
      phone: person.phone,
      linkedinUrl: person.linkedinUrl,
      status: person.status,
      source: person.source,
      enrichmentSources: person.enrichmentSources || [],
      hasCoreSignalData: !!(person.customFields?.coresignalData || person.customFields?.coresignal),
      hasLushaData: !!(person.customFields?.lusha || person.customFields?.enrichedData),
      hasPDLData: !!(person.customFields?.pdlData),
      company: person.company?.name,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt
    }));

    this.results.enrichmentCoverage.missingTitles = missingTitles.length;

    // Count missing LinkedIn and phone
    const missingLinkedIn = allPeople.filter(p => !p.linkedinUrl || p.linkedinUrl.trim() === '');
    const missingPhone = allPeople.filter(p => !p.phone || p.phone.trim() === '');

    this.results.enrichmentCoverage.missingLinkedIn = missingLinkedIn.length;
    this.results.enrichmentCoverage.missingPhone = missingPhone.length;

    // Analyze enrichment sources
    allPeople.forEach(person => {
      const sources = person.enrichmentSources || [];
      sources.forEach(source => {
        this.results.enrichmentCoverage.enrichmentSources[source] = 
          (this.results.enrichmentCoverage.enrichmentSources[source] || 0) + 1;
      });

      // Check if enriched based on customFields
      if (person.customFields?.coresignalData || person.customFields?.coresignal) {
        this.results.enrichmentCoverage.enrichedPeople++;
      }
      if (person.customFields?.lusha || person.customFields?.enrichedData) {
        this.results.enrichmentCoverage.enrichedPeople++;
      }
      if (person.customFields?.pdlData) {
        this.results.enrichmentCoverage.enrichedPeople++;
      }
    });

    console.log(`   ✅ Found ${allPeople.length} total people`);
    console.log(`   ⚠️  Found ${missingTitles.length} people missing titles`);
    console.log(`   ⚠️  Found ${missingLinkedIn.length} people missing LinkedIn URLs`);
    console.log(`   ⚠️  Found ${missingPhone.length} people missing phone numbers\n`);
  }

  async investigateCompanyIntelligence(workspaceId) {
    console.log('🏢 Investigating Company records missing intelligence...\n');

    // Find all companies in workspace
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        address: true,
        businessChallenges: true,
        businessPriorities: true,
        competitiveAdvantages: true,
        growthOpportunities: true,
        techStack: true,
        customFields: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            people: true
          }
        }
      }
    });

    this.results.companyIntelligence.totalCompanies = allCompanies.length;

    // Find companies missing intelligence
    const missingIntelligence = allCompanies.filter(company => {
      const hasBusinessChallenges = company.businessChallenges && company.businessChallenges.length > 0;
      const hasBusinessPriorities = company.businessPriorities && company.businessPriorities.length > 0;
      const hasCompetitiveAdvantages = company.competitiveAdvantages && company.competitiveAdvantages.length > 0;
      const hasGrowthOpportunities = company.growthOpportunities && company.growthOpportunities.length > 0;
      const hasTechStack = company.techStack && company.techStack.length > 0;
      
      // Check customFields for intelligence data
      const customFields = company.customFields || {};
      const hasCustomIntelligence = 
        (customFields.companyIntelligence && Object.keys(customFields.companyIntelligence).length > 0) ||
        (customFields.businessChallenges && customFields.businessChallenges.length > 0) ||
        (customFields.businessPriorities && customFields.businessPriorities.length > 0);

      return !hasBusinessChallenges && 
             !hasBusinessPriorities && 
             !hasCompetitiveAdvantages && 
             !hasGrowthOpportunities && 
             !hasTechStack && 
             !hasCustomIntelligence;
    });

    this.results.companiesMissingIntelligence = missingIntelligence.map(company => ({
      id: company.id,
      name: company.name,
      website: company.website,
      linkedinUrl: company.linkedinUrl,
      address: company.address,
      peopleCount: company._count.people,
      hasBusinessChallenges: company.businessChallenges && company.businessChallenges.length > 0,
      hasBusinessPriorities: company.businessPriorities && company.businessPriorities.length > 0,
      hasCompetitiveAdvantages: company.competitiveAdvantages && company.competitiveAdvantages.length > 0,
      hasGrowthOpportunities: company.growthOpportunities && company.growthOpportunities.length > 0,
      hasTechStack: company.techStack && company.techStack.length > 0,
      hasCustomFieldsIntelligence: !!(company.customFields?.companyIntelligence),
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    }));

    // Count intelligence fields
    allCompanies.forEach(company => {
      if (company.businessChallenges && company.businessChallenges.length > 0) {
        this.results.companyIntelligence.intelligenceFields.businessChallenges++;
      }
      if (company.businessPriorities && company.businessPriorities.length > 0) {
        this.results.companyIntelligence.intelligenceFields.businessPriorities++;
      }
      if (company.competitiveAdvantages && company.competitiveAdvantages.length > 0) {
        this.results.companyIntelligence.intelligenceFields.competitiveAdvantages++;
      }
      if (company.growthOpportunities && company.growthOpportunities.length > 0) {
        this.results.companyIntelligence.intelligenceFields.growthOpportunities++;
      }
      if (company.techStack && company.techStack.length > 0) {
        this.results.companyIntelligence.intelligenceFields.techStack++;
      }

      // Check if has any intelligence
      const hasAnyIntelligence = 
        (company.businessChallenges && company.businessChallenges.length > 0) ||
        (company.businessPriorities && company.businessPriorities.length > 0) ||
        (company.competitiveAdvantages && company.competitiveAdvantages.length > 0) ||
        (company.growthOpportunities && company.growthOpportunities.length > 0) ||
        (company.techStack && company.techStack.length > 0) ||
        (company.customFields?.companyIntelligence && Object.keys(company.customFields.companyIntelligence).length > 0);

      if (hasAnyIntelligence) {
        this.results.companyIntelligence.withIntelligence++;
      }
    });

    console.log(`   ✅ Found ${allCompanies.length} total companies`);
    console.log(`   ⚠️  Found ${missingIntelligence.length} companies missing intelligence`);
    console.log(`   ✅ Found ${this.results.companyIntelligence.withIntelligence} companies with intelligence\n`);
  }

  async analyzeEnrichmentCoverage(workspaceId) {
    console.log('🔬 Analyzing enrichment coverage...\n');

    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        enrichmentSources: true,
        customFields: true,
        jobTitle: true,
        title: true,
        linkedinUrl: true,
        phone: true
      }
    });

    let enrichedCount = 0;
    allPeople.forEach(person => {
      const hasEnrichment = 
        (person.enrichmentSources && person.enrichmentSources.length > 0) ||
        person.customFields?.coresignalData ||
        person.customFields?.coresignal ||
        person.customFields?.lusha ||
        person.customFields?.enrichedData ||
        person.customFields?.pdlData;

      if (hasEnrichment) {
        enrichedCount++;
      }
    });

    this.results.enrichmentCoverage.enrichedPeople = enrichedCount;

    console.log(`   ✅ ${enrichedCount} people have enrichment data`);
    console.log(`   ⚠️  ${allPeople.length - enrichedCount} people have no enrichment data\n`);
  }

  async analyzeDataSources(workspaceId) {
    console.log('📊 Analyzing data sources...\n');

    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        source: true,
        customFields: true
      }
    });

    allPeople.forEach(person => {
      const source = person.source || '';
      const customFields = person.customFields || {};

      if (source.includes('CSV') || source.includes('csv') || source.includes('import') || 
          customFields.importSource === 'excel_import' || 
          customFields.importSource === 'batch_people_import' ||
          customFields.importSource === 'industry_contacts_import') {
        this.results.dataSources.csvImport++;
      } else if (source.includes('enrichment') || source.includes('CoreSignal') || 
                 source.includes('Lusha') || source.includes('PDL') ||
                 person.enrichmentSources?.length > 0) {
        this.results.dataSources.enrichment++;
      } else if (source === 'manual' || source === 'Manual Entry') {
        this.results.dataSources.manualEntry++;
      } else {
        this.results.dataSources.unknown++;
      }
    });

    console.log(`   📥 CSV Import: ${this.results.dataSources.csvImport}`);
    console.log(`   ✍️  Manual Entry: ${this.results.dataSources.manualEntry}`);
    console.log(`   🤖 Enrichment: ${this.results.dataSources.enrichment}`);
    console.log(`   ❓ Unknown: ${this.results.dataSources.unknown}\n`);
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 INVESTIGATION REPORT: Missing Lead Titles and Company Intelligence');
    console.log('='.repeat(80) + '\n');

    // People Titles Report
    console.log('👤 PEOPLE TITLES ANALYSIS');
    console.log('-'.repeat(80));
    console.log(`Total People: ${this.results.enrichmentCoverage.totalPeople}`);
    console.log(`Missing Titles: ${this.results.enrichmentCoverage.missingTitles} (${((this.results.enrichmentCoverage.missingTitles / this.results.enrichmentCoverage.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`Missing LinkedIn: ${this.results.enrichmentCoverage.missingLinkedIn} (${((this.results.enrichmentCoverage.missingLinkedIn / this.results.enrichmentCoverage.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`Missing Phone: ${this.results.enrichmentCoverage.missingPhone} (${((this.results.enrichmentCoverage.missingPhone / this.results.enrichmentCoverage.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`Enriched People: ${this.results.enrichmentCoverage.enrichedPeople} (${((this.results.enrichmentCoverage.enrichedPeople / this.results.enrichmentCoverage.totalPeople) * 100).toFixed(1)}%)`);

    if (Object.keys(this.results.enrichmentCoverage.enrichmentSources).length > 0) {
      console.log('\nEnrichment Sources:');
      Object.entries(this.results.enrichmentCoverage.enrichmentSources)
        .sort((a, b) => b[1] - a[1])
        .forEach(([source, count]) => {
          console.log(`  - ${source}: ${count}`);
        });
    }

    // Sample of people missing titles
    if (this.results.peopleMissingTitles.length > 0) {
      console.log(`\n📋 Sample of People Missing Titles (showing first 10):`);
      this.results.peopleMissingTitles.slice(0, 10).forEach((person, index) => {
        console.log(`\n  ${index + 1}. ${person.fullName}`);
        console.log(`     Email: ${person.email || 'N/A'}`);
        console.log(`     Phone: ${person.phone || 'N/A'}`);
        console.log(`     LinkedIn: ${person.linkedinUrl || 'N/A'}`);
        console.log(`     Status: ${person.status || 'N/A'}`);
        console.log(`     Source: ${person.source || 'N/A'}`);
        console.log(`     Enrichment Sources: ${person.enrichmentSources.join(', ') || 'None'}`);
        console.log(`     Has CoreSignal Data: ${person.hasCoreSignalData ? 'Yes' : 'No'}`);
        console.log(`     Has Lusha Data: ${person.hasLushaData ? 'Yes' : 'No'}`);
        console.log(`     Company: ${person.company || 'N/A'}`);
      });
    }

    // Company Intelligence Report
    console.log('\n\n🏢 COMPANY INTELLIGENCE ANALYSIS');
    console.log('-'.repeat(80));
    console.log(`Total Companies: ${this.results.companyIntelligence.totalCompanies}`);
    console.log(`With Intelligence: ${this.results.companyIntelligence.withIntelligence} (${((this.results.companyIntelligence.withIntelligence / this.results.companyIntelligence.totalCompanies) * 100).toFixed(1)}%)`);
    console.log(`Missing Intelligence: ${this.results.companiesMissingIntelligence.length} (${((this.results.companiesMissingIntelligence.length / this.results.companyIntelligence.totalCompanies) * 100).toFixed(1)}%)`);

    console.log('\nIntelligence Fields Coverage:');
    Object.entries(this.results.companyIntelligence.intelligenceFields).forEach(([field, count]) => {
      const percentage = this.results.companyIntelligence.totalCompanies > 0 
        ? ((count / this.results.companyIntelligence.totalCompanies) * 100).toFixed(1)
        : '0.0';
      console.log(`  - ${field}: ${count} (${percentage}%)`);
    });

    // Sample of companies missing intelligence
    if (this.results.companiesMissingIntelligence.length > 0) {
      console.log(`\n📋 Sample of Companies Missing Intelligence (showing first 10):`);
      this.results.companiesMissingIntelligence.slice(0, 10).forEach((company, index) => {
        console.log(`\n  ${index + 1}. ${company.name}`);
        console.log(`     Website: ${company.website || 'N/A'}`);
        console.log(`     LinkedIn: ${company.linkedinUrl || 'N/A'}`);
        console.log(`     Address: ${company.address || 'N/A'}`);
        console.log(`     People Count: ${company.peopleCount}`);
        console.log(`     Has Business Challenges: ${company.hasBusinessChallenges ? 'Yes' : 'No'}`);
        console.log(`     Has Business Priorities: ${company.hasBusinessPriorities ? 'Yes' : 'No'}`);
        console.log(`     Has Competitive Advantages: ${company.hasCompetitiveAdvantages ? 'Yes' : 'No'}`);
        console.log(`     Has Growth Opportunities: ${company.hasGrowthOpportunities ? 'Yes' : 'No'}`);
        console.log(`     Has Tech Stack: ${company.hasTechStack ? 'Yes' : 'No'}`);
      });
    }

    // Data Sources Report
    console.log('\n\n📊 DATA SOURCES ANALYSIS');
    console.log('-'.repeat(80));
    const totalSources = Object.values(this.results.dataSources).reduce((a, b) => a + b, 0);
    Object.entries(this.results.dataSources).forEach(([source, count]) => {
      const percentage = totalSources > 0 ? ((count / totalSources) * 100).toFixed(1) : '0.0';
      console.log(`  ${source}: ${count} (${percentage}%)`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Investigation Complete');
    console.log('='.repeat(80) + '\n');

    // Save detailed results to JSON file
    const fs = require('fs');
    const reportPath = `logs/investigation-missing-data-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed results saved to: ${reportPath}\n`);
  }
}

// Run investigation
const investigator = new MissingDataInvestigator();
investigator.investigate()
  .then(() => {
    console.log('✅ Investigation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Investigation failed:', error);
    process.exit(1);
  });

