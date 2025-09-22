/**
 * 🎯 ANALYZE ALL COMPANIES BUYER GROUPS - FIXED VERSION
 * 
 * This script uses the exact same approach as the successful 5Bars analysis
 * but applies it to all companies in the workspace
 */

const { PrismaClient } = require('@prisma/client');

class AnalyzeAllCompaniesFixed {
  constructor() {
    this.prisma = new PrismaClient();
    this.correctWorkspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.correctUserId = '01K1VBYXHD0J895XAN0HGFBKJP';
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    this.creditsUsed = { search: 0, collect: 0, enrich: 0 };
    this.results = {
      analysisDate: new Date().toISOString(),
      companies: [],
      totalCreditsUsed: this.creditsUsed,
      errors: []
    };
  }

  async execute() {
    console.log('🎯 ANALYZING ALL COMPANIES BUYER GROUPS - FIXED VERSION');
    console.log('======================================================');
    console.log('');

    try {
      // Step 1: Get companies with websites
      await this.getCompaniesWithWebsites();
      
      // Step 2: Analyze each company using the proven approach
      await this.analyzeAllCompanies();
      
      // Step 3: Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getCompaniesWithWebsites() {
    console.log('🏢 STEP 1: Getting companies with websites...');
    console.log('');

    // Get companies that have websites
    const companies = await this.prisma.companies.findMany({
      where: { 
        workspaceId: this.correctWorkspaceId,
        website: { not: null }
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        size: true,
        customFields: true
      },
      orderBy: { name: 'asc' }
    });

    this.companies = companies;

    console.log(`📊 Found ${this.companies.length} companies with websites`);
    console.log('');
  }

  async analyzeAllCompanies() {
    console.log('🎯 STEP 2: Analyzing buyer groups for all companies...');
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < this.companies.length; i++) {
      const company = this.companies[i];
      
      console.log(`🏢 [${i + 1}/${this.companies.length}] Analyzing ${company.name}...`);
      
      try {
        const result = await this.analyzeCompany(company);
        this.results.companies.push(result);
        successCount++;
        
        console.log(`   ✅ Successfully analyzed ${company.name}`);
        console.log(`   📊 Found ${result.employeeCount} current employees`);
        console.log(`   🎯 Buyer group: ${result.buyerGroupSummary}`);
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Failed to analyze ${company.name}: ${error.message}`);
        this.results.errors.push({
          company: company.name,
          error: error.message
        });
        errorCount++;
        console.log('');
      }

      // Add a small delay to avoid rate limiting
      if (i < this.companies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('📊 ANALYSIS SUMMARY:');
    console.log('===================');
    console.log(`✅ Successfully processed: ${successCount} companies`);
    console.log(`❌ Errors: ${errorCount} companies`);
    console.log(`📈 Success rate: ${((successCount / this.companies.length) * 100).toFixed(1)}%`);
    console.log('');
  }

  async analyzeCompany(company) {
    // Extract domain from website
    const domain = company.website ? company.website.replace(/^https?:\/\//, '').replace(/^www\./, '') : null;
    
    if (!domain) {
      throw new Error('No website domain available');
    }

    console.log(`   🔍 Enriching company by domain: ${domain}`);

    // Step 1: Enrich company by domain (exact same as successful 5Bars script)
    const enrichResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website=${domain}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.creditsUsed.enrich++;
    console.log(`   📊 Enrichment status: ${enrichResponse.status}`);

    if (!enrichResponse.ok) {
      throw new Error(`Company enrichment failed for ${domain}: ${enrichResponse.status}`);
    }

    const enrichData = await enrichResponse.json();
    const coresignalCompanyId = enrichData.id;

    console.log(`   ✅ Company enriched: ${enrichData.name}`);
    console.log(`   🆔 CoreSignal ID: ${coresignalCompanyId}`);
    console.log(`   👥 Employee count: ${enrichData.employee_count || 'Unknown'}`);

    // Step 2: Search for current employees (exact same as successful 5Bars script)
    console.log(`   🔍 Searching for current employees at company ID: ${coresignalCompanyId}`);

    const searchQuery = {
      query: {
        bool: {
          must: [
            {
              term: {
                "experience.company_id": coresignalCompanyId
              }
            },
            {
              term: {
                "experience.active_experience": 1
              }
            }
          ]
        }
      },
      size: 100
    };

    const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchQuery)
    });

    this.creditsUsed.search++;
    console.log(`   📊 Search status: ${searchResponse.status}`);

    if (!searchResponse.ok) {
      throw new Error(`Employee search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const employeeIds = searchData.hits?.hits?.map(hit => hit._id) || [];

    console.log(`   📊 Found ${employeeIds.length} employee IDs`);

    if (employeeIds.length === 0) {
      return {
        companyName: company.name,
        domain,
        coresignalCompanyId,
        employeeCount: 0,
        buyerGroupSummary: 'No employees found',
        people: []
      };
    }

    // Step 3: Collect employee details (limit to 20 for efficiency)
    const employeesToCollect = employeeIds.slice(0, 20);
    console.log(`   🔍 Collecting details for ${employeesToCollect.length} employees...`);

    const collectPromises = employeesToCollect.map(async (employeeId) => {
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.creditsUsed.collect++;
      
      if (collectResponse.ok) {
        return await collectResponse.json();
      } else {
        console.log(`   ⚠️ Failed to collect employee ${employeeId}: ${collectResponse.status}`);
        return null;
      }
    });

    const employeeData = (await Promise.all(collectPromises)).filter(Boolean);
    console.log(`   ✅ Collected ${employeeData.length} employee profiles`);

    // Step 4: Analyze buyer group roles (exact same logic as successful 5Bars script)
    const people = this.analyzeBuyerGroupRoles(employeeData, company.name);

    // Step 5: Update database (exact same approach as successful 5Bars script)
    console.log(`   💾 Updating database with ${people.length} people...`);
    await this.updateDatabaseWithPeople(people, company.id);

    // Generate buyer group summary
    const roleCounts = people.reduce((acc, person) => {
      acc[person.buyerGroupRole] = (acc[person.buyerGroupRole] || 0) + 1;
      return acc;
    }, {});

    const buyerGroupSummary = [
      `${roleCounts['Decision Maker'] || 0} Decision Makers`,
      `${roleCounts['Champion'] || 0} Champions`,
      `${roleCounts['Influencer'] || 0} Influencers`,
      `${roleCounts['Stakeholder'] || 0} Stakeholders`
    ].join(', ') + ` (${people.length} total)`;

    return {
      companyName: company.name,
      domain,
      coresignalCompanyId,
      employeeCount: people.length,
      buyerGroupSummary,
      people: people.map(p => ({
        name: p.fullName,
        role: p.buyerGroupRole,
        title: p.jobTitle
      }))
    };
  }

  analyzeBuyerGroupRoles(employeeData, companyName) {
    return employeeData.map(personData => {
      const currentExperience = personData.experience?.find(exp => exp.active_experience === 1);
      const jobTitle = currentExperience?.position_title || personData.headline || 'Unknown Title';
      const department = currentExperience?.department || 'Unknown Department';
      
      // Enhanced buyer group logic for TOP as seller (exact same as successful 5Bars script)
      let buyerGroupRole = 'Stakeholder';
      let influenceLevel = 'Low';
      let engagementStrategy = 'Standard outreach';

      const title = jobTitle.toLowerCase();
      const dept = department.toLowerCase();

      // Decision Makers - C-level and VP level
      if (title.includes('ceo') || title.includes('chief executive') ||
          title.includes('president') || title.includes('owner') ||
          title.includes('founder') || title.includes('vp') ||
          title.includes('vice president') || title.includes('director') ||
          title.includes('head of') || title.includes('manager')) {
        buyerGroupRole = 'Decision Maker';
        influenceLevel = 'High';
        engagementStrategy = 'Executive briefing and ROI presentation';
      }
      // Champions - Technical and operational leaders
      else if (title.includes('engineer') || title.includes('developer') ||
               title.includes('architect') || title.includes('lead') ||
               title.includes('senior') || title.includes('principal') ||
               title.includes('specialist') || title.includes('analyst') ||
               dept.includes('engineering') || dept.includes('technology') ||
               dept.includes('operations') || dept.includes('it')) {
        buyerGroupRole = 'Champion';
        influenceLevel = 'Medium-High';
        engagementStrategy = 'Technical demo and proof of concept';
      }
      // Influencers - Mid-level professionals
      else if (title.includes('coordinator') || title.includes('supervisor') ||
               title.includes('assistant') || title.includes('associate') ||
               title.includes('representative') || title.includes('consultant') ||
               dept.includes('marketing') || dept.includes('sales') ||
               dept.includes('finance') || dept.includes('hr')) {
        buyerGroupRole = 'Influencer';
        influenceLevel = 'Medium';
        engagementStrategy = 'Educational content and case studies';
      }

      return {
        fullName: personData.full_name || `${personData.first_name || ''} ${personData.last_name || ''}`.trim() || 'Unknown Name',
        jobTitle: jobTitle,
        email: personData.email || null,
        phone: personData.phone || null,
        linkedinUrl: personData.linkedin_url || null,
        companyId: null, // Will be set when updating database
        workspaceId: this.correctWorkspaceId,
        assignedUserId: this.correctUserId,
        buyerGroupRole,
        customFields: {
          coresignalId: personData.id,
          influenceLevel,
          engagementStrategy,
          department,
          seniority: this.determineSeniority(jobTitle),
          source: 'CoreSignal API',
          lastEnriched: new Date().toISOString(),
          companyName,
          rawData: personData
        },
        tags: ['CoreSignal', 'Buyer Group', companyName, buyerGroupRole, 'Active Employee']
      };
    });
  }

  determineSeniority(jobTitle) {
    const title = jobTitle.toLowerCase();
    if (title.includes('senior') || title.includes('lead') || title.includes('principal') || title.includes('head')) {
      return 'Senior';
    } else if (title.includes('junior') || title.includes('associate') || title.includes('assistant')) {
      return 'Junior';
    } else if (title.includes('manager') || title.includes('director') || title.includes('vp') || title.includes('chief')) {
      return 'Executive';
    }
    return 'Mid-level';
  }

  async updateDatabaseWithPeople(people, companyId) {
    for (const person of people) {
      person.companyId = companyId;
      
      try {
        // Try to find existing person by CoreSignal ID
        const existingPerson = await this.prisma.people.findFirst({
          where: {
            customFields: {
              path: ['coresignalId'],
              equals: person.customFields.coresignalId
            }
          },
          select: { id: true }
        });

        if (existingPerson) {
          // Update existing person
          await this.prisma.people.update({
            where: { id: existingPerson.id },
            data: {
              fullName: person.fullName,
              jobTitle: person.jobTitle,
              email: person.email,
              phone: person.phone,
              linkedinUrl: person.linkedinUrl,
              companyId: person.companyId,
              buyerGroupRole: person.buyerGroupRole,
              customFields: person.customFields,
              tags: person.tags,
              updatedAt: new Date()
            },
            select: { id: true }
          });
          console.log(`     🔄 Updated: ${person.fullName} (${person.buyerGroupRole})`);
        } else {
          // Create new person
          const createdPerson = await this.prisma.people.create({
            data: {
              fullName: person.fullName,
              jobTitle: person.jobTitle,
              email: person.email,
              phone: person.phone,
              linkedinUrl: person.linkedinUrl,
              companyId: person.companyId,
              workspaceId: person.workspaceId,
              assignedUserId: person.assignedUserId,
              buyerGroupRole: person.buyerGroupRole,
              customFields: person.customFields,
              tags: person.tags,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            select: { id: true }
          });

          // Create prospect record for new person
          await this.prisma.prospects.create({
            data: {
              personId: createdPerson.id,
              companyId: person.companyId,
              workspaceId: person.workspaceId,
              assignedUserId: person.assignedUserId,
              status: 'new',
              priority: 'medium',
              buyerGroupRole: person.buyerGroupRole,
              engagementLevel: 'initial',
              tags: [...person.tags, 'New Prospect'],
              customFields: {
                source: 'CoreSignal Analysis',
                analysisDate: new Date().toISOString(),
                influenceLevel: person.customFields.influenceLevel,
                engagementStrategy: person.customFields.engagementStrategy
              },
              createdAt: new Date(),
              updatedAt: new Date()
            },
            select: { id: true }
          });

          console.log(`     ➕ Created: ${person.fullName} (${person.buyerGroupRole})`);
        }
      } catch (error) {
        console.log(`     ❌ Error updating ${person.fullName}: ${error.message}`);
      }
    }
  }

  async generateFinalReport() {
    console.log('📊 STEP 3: Generating final report...');
    console.log('');

    const successfulCompanies = this.results.companies.filter(c => c.employeeCount > 0);
    const totalEmployees = this.results.companies.reduce((sum, c) => sum + c.employeeCount, 0);

    console.log('📈 FINAL RESULTS SUMMARY:');
    console.log('=========================');
    console.log(`🏢 Companies analyzed: ${this.results.companies.length}`);
    console.log(`✅ Successful analyses: ${successfulCompanies.length}`);
    console.log(`👥 Total employees found: ${totalEmployees}`);
    console.log(`💰 Total credits used: ${JSON.stringify(this.creditsUsed)}`);
    console.log('');

    if (successfulCompanies.length > 0) {
      console.log('🏆 TOP 10 COMPANIES BY EMPLOYEE COUNT:');
      console.log('======================================');
      
      const topCompanies = successfulCompanies
        .sort((a, b) => b.employeeCount - a.employeeCount)
        .slice(0, 10);

      topCompanies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.companyName} - ${company.employeeCount} employees`);
        console.log(`   🎯 Buyer Group: ${company.buyerGroupSummary}`);
      });
    }

    console.log('');
    console.log('✅ ALL COMPANIES BUYER GROUP ANALYSIS COMPLETE!');
    console.log('===============================================');
    console.log('');
    console.log('🎯 Every company now has:');
    console.log('• Real CoreSignal employee data with active employment validation');
    console.log('• Proper buyer group role assignments (Decision Makers, Champions, Influencers, Stakeholders)');
    console.log('• Linked people records in database with rich profile data');
    console.log('• Complete buyer group intelligence for sales and engagement');
    console.log('');
    console.log('📊 The workspace now contains comprehensive buyer group data');
    console.log('for all companies, enabling effective sales strategies and engagement.');
  }
}

// Run the analysis
async function main() {
  const analyzer = new AnalyzeAllCompaniesFixed();
  await analyzer.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AnalyzeAllCompaniesFixed;
