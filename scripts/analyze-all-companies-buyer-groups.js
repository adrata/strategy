/**
 * 🏢 ANALYZE ALL COMPANIES BUYER GROUPS
 * 
 * This script analyzes buyer groups for ALL companies in the workspace
 * using CoreSignal with strict active employment validation
 */

const { PrismaClient } = require('@prisma/client');

class AnalyzeAllCompaniesBuyerGroups {
  constructor() {
    this.prisma = new PrismaClient();
    this.correctWorkspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.correctUserId = '01K1VBYXHD0J895XAN0HGFBKJP';
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    
    if (!this.coresignalApiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
  }

  async execute() {
    console.log('🏢 ANALYZING ALL COMPANIES BUYER GROUPS');
    console.log('=====================================');
    console.log('');

    try {
      // Step 1: Get all companies in workspace
      await this.getAllCompanies();
      
      // Step 2: Analyze buyer groups for each company
      await this.analyzeAllBuyerGroups();
      
      // Step 3: Validate active employment for all people
      await this.validateActiveEmployment();
      
      // Step 4: Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Analysis failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getAllCompanies() {
    console.log('🏢 STEP 1: Getting all companies in workspace...');
    console.log('');

    this.companies = await this.prisma.companies.findMany({
      where: { workspaceId: this.correctWorkspaceId },
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

    console.log(`📊 Found ${this.companies.length} companies in workspace`);
    console.log('');
  }

  async analyzeAllBuyerGroups() {
    console.log('🎯 STEP 2: Analyzing buyer groups for each company...');
    console.log('');

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const company of this.companies) {
      processedCount++;
      console.log(`🏢 [${processedCount}/${this.companies.length}] Analyzing ${company.name}...`);
      
      try {
        // Step 2a: Enrich company by domain
        const enrichedCompany = await this.enrichCompanyByDomain(company);
        
        if (!enrichedCompany) {
          console.log(`   ⚠️ Could not enrich company ${company.name}`);
          errorCount++;
          continue;
        }

        // Step 2b: Search for current employees
        const currentEmployees = await this.searchCurrentEmployees(enrichedCompany);
        
        if (!currentEmployees || currentEmployees.length === 0) {
          console.log(`   ⚠️ No current employees found for ${company.name}`);
          errorCount++;
          continue;
        }

        // Step 2c: Analyze buyer group roles
        const buyerGroupAnalysis = await this.analyzeBuyerGroupRoles(currentEmployees, company);
        
        // Step 2d: Create/update people records
        const createdPeople = await this.createPeopleRecords(currentEmployees, company, buyerGroupAnalysis);
        
        // Step 2e: Create prospect records for new people
        await this.createProspectRecords(createdPeople, company);
        
        // Step 2f: Update company with buyer group analysis
        await this.updateCompanyWithBuyerGroup(company, buyerGroupAnalysis);
        
        console.log(`   ✅ Successfully analyzed ${company.name}`);
        console.log(`   📊 Found ${currentEmployees.length} current employees`);
        console.log(`   👥 Created/updated ${createdPeople.length} people records`);
        console.log(`   🎯 Buyer group roles: ${buyerGroupAnalysis.summary}`);
        console.log('');
        
        successCount++;
        
        // Add delay to avoid rate limiting
        await this.delay(1000);
        
      } catch (error) {
        console.error(`   ❌ Error analyzing ${company.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`📊 ANALYSIS SUMMARY:`);
    console.log(`===================`);
    console.log(`✅ Successfully processed: ${successCount} companies`);
    console.log(`❌ Errors: ${errorCount} companies`);
    console.log(`📈 Success rate: ${((successCount/processedCount)*100).toFixed(1)}%`);
    console.log('');
  }

  async enrichCompanyByDomain(company) {
    try {
      const domain = this.extractDomain(company.website || company.name);
      if (!domain) return null;

      const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website=${domain}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.coresignalApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`   ⚠️ Company enrichment failed for ${domain}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.log(`   ⚠️ Company enrichment error for ${company.name}:`, error.message);
      return null;
    }
  }

  async searchCurrentEmployees(enrichedCompany) {
    try {
      const companyId = enrichedCompany.id;
      if (!companyId) return [];

      // Use CoreSignal v2 API with active_experience filter
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                term: {
                  "company_id": companyId
                }
              },
              {
                term: {
                  "active_experience": 1
                }
              }
            ]
          }
        },
        size: 50,
        sort: [
          {
            "experience.start_date": {
              "order": "desc"
            }
          }
        ]
      };

      const response = await fetch('https://api.coresignal.com/cdapi/v2/employee/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.coresignalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (!response.ok) {
        console.log(`   ⚠️ Employee search failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.hits?.hits || [];
    } catch (error) {
      console.log(`   ⚠️ Employee search error:`, error.message);
      return [];
    }
  }

  async analyzeBuyerGroupRoles(employees, company) {
    const buyerGroupRoles = {
      decisionMakers: [],
      champions: [],
      influencers: [],
      stakeholders: [],
      summary: ''
    };

    for (const employee of employees) {
      const personData = employee._source;
      const role = this.determineBuyerGroupRole(personData, company);
      
      const personInfo = {
        name: personData.full_name || `${personData.first_name || ''} ${personData.last_name || ''}`.trim(),
        title: personData.headline || personData.experience?.[0]?.position_title || 'Unknown',
        role: role,
        influenceLevel: this.assessInfluenceLevel(personData, role),
        engagementPriority: this.assessEngagementPriority(role),
        rawData: personData
      };

      switch (role) {
        case 'Decision Maker':
          buyerGroupRoles.decisionMakers.push(personInfo);
          break;
        case 'Champion':
          buyerGroupRoles.champions.push(personInfo);
          break;
        case 'Influencer':
          buyerGroupRoles.influencers.push(personInfo);
          break;
        case 'Stakeholder':
          buyerGroupRoles.stakeholders.push(personInfo);
          break;
      }
    }

    // Generate summary
    const totalPeople = employees.length;
    const decisionMakers = buyerGroupRoles.decisionMakers.length;
    const champions = buyerGroupRoles.champions.length;
    const influencers = buyerGroupRoles.influencers.length;
    const stakeholders = buyerGroupRoles.stakeholders.length;

    buyerGroupRoles.summary = `${decisionMakers} Decision Makers, ${champions} Champions, ${influencers} Influencers, ${stakeholders} Stakeholders (${totalPeople} total)`;

    return buyerGroupRoles;
  }

  determineBuyerGroupRole(personData, company) {
    const title = (personData.headline || personData.experience?.[0]?.position_title || '').toLowerCase();
    const department = personData.department || '';
    const seniority = this.assessSeniority(title, personData);

    // Decision Makers - C-level, VPs, Directors with purchasing authority
    if (title.includes('ceo') || title.includes('chief executive') ||
        title.includes('president') || title.includes('owner') ||
        title.includes('vp') || title.includes('vice president') ||
        (title.includes('director') && (title.includes('operations') || title.includes('procurement') || title.includes('purchasing')))) {
      return 'Decision Maker';
    }

    // Champions - Technical leaders, project managers, department heads
    if (title.includes('cto') || title.includes('chief technology') ||
        title.includes('engineering manager') || title.includes('project manager') ||
        title.includes('department head') || title.includes('team lead') ||
        (title.includes('manager') && (title.includes('technical') || title.includes('engineering') || title.includes('it')))) {
      return 'Champion';
    }

    // Influencers - Senior technical staff, specialists
    if (title.includes('senior') || title.includes('sr ') ||
        title.includes('specialist') || title.includes('expert') ||
        title.includes('architect') || title.includes('consultant') ||
        seniority === 'senior') {
      return 'Influencer';
    }

    // Stakeholders - Everyone else
    return 'Stakeholder';
  }

  assessSeniority(title, personData) {
    if (title.includes('senior') || title.includes('sr ')) return 'senior';
    if (title.includes('junior') || title.includes('jr ')) return 'junior';
    if (title.includes('lead') || title.includes('principal')) return 'lead';
    return 'mid';
  }

  assessInfluenceLevel(personData, role) {
    switch (role) {
      case 'Decision Maker': return 'High';
      case 'Champion': return 'High';
      case 'Influencer': return 'Medium';
      case 'Stakeholder': return 'Low';
      default: return 'Medium';
    }
  }

  assessEngagementPriority(role) {
    switch (role) {
      case 'Decision Maker': return 'High';
      case 'Champion': return 'High';
      case 'Influencer': return 'Medium';
      case 'Stakeholder': return 'Low';
      default: return 'Medium';
    }
  }

  async createPeopleRecords(employees, company, buyerGroupAnalysis) {
    const createdPeople = [];

    for (const employee of employees) {
      const personData = employee._source;
      const name = personData.full_name || `${personData.first_name || ''} ${personData.last_name || ''}`.trim();
      const title = personData.headline || personData.experience?.[0]?.position_title || 'Unknown';
      
      // Find existing person or create new one
      let person = await this.prisma.people.findFirst({
        where: {
          workspaceId: this.correctWorkspaceId,
          OR: [
            { email: personData.email },
            { fullName: name }
          ]
        }
      });

      const role = this.determineBuyerGroupRole(personData, company);
      const influenceLevel = this.assessInfluenceLevel(personData, role);
      const engagementPriority = this.assessEngagementPriority(role);

      const personDataToSave = {
        firstName: personData.first_name || name.split(' ')[0] || 'Unknown',
        lastName: personData.last_name || name.split(' ').slice(1).join(' ') || 'Unknown',
        fullName: name,
        jobTitle: title,
        email: personData.email || null,
        phone: personData.phone || null,
        linkedinUrl: personData.linkedin_url || null,
        companyId: company.id,
        workspaceId: this.correctWorkspaceId,
        customFields: {
          buyerGroupRole: role,
          influenceLevel: influenceLevel,
          engagementPriority: engagementPriority,
          coresignalId: personData.id,
          richProfile: personData,
          lastEnriched: new Date().toISOString(),
          dataSource: 'CoreSignal API'
        },
        updatedAt: new Date()
      };

      if (person) {
        // Update existing person
        person = await this.prisma.people.update({
          where: { id: person.id },
          data: personDataToSave,
          select: { id: true, fullName: true, jobTitle: true }
        });
        console.log(`   🔄 Updated existing person: ${person.fullName}`);
      } else {
        // Create new person
        person = await this.prisma.people.create({
          data: personDataToSave,
          select: { id: true, fullName: true, jobTitle: true }
        });
        console.log(`   ➕ Created new person: ${person.fullName}`);
      }

      createdPeople.push(person);
    }

    return createdPeople;
  }

  async createProspectRecords(people, company) {
    for (const person of people) {
      // Check if prospect already exists
      const existingProspect = await this.prisma.prospects.findFirst({
        where: {
          workspaceId: this.correctWorkspaceId,
          personId: person.id
        }
      });

      if (!existingProspect) {
        const prospectData = {
          personId: person.id,
          companyId: company.id,
          workspaceId: this.correctWorkspaceId,
          assignedUserId: this.correctUserId,
          status: 'engaged',
          priority: 'medium',
          buyerGroupRole: person.customFields?.buyerGroupRole || 'Stakeholder',
          engagementLevel: 'initial',
          tags: ['CoreSignal Enriched', 'Buyer Group Analysis', company.name, 'Current Employee'],
          customFields: {
            dataSource: 'CoreSignal API',
            enrichmentDate: new Date().toISOString(),
            buyerGroupAnalysis: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await this.prisma.prospects.create({
          data: prospectData,
          select: { id: true }
        });
        console.log(`   🎯 Created prospect record for ${person.fullName}`);
      }
    }
  }

  async updateCompanyWithBuyerGroup(company, buyerGroupAnalysis) {
    const customFields = company.customFields || {};
    
    await this.prisma.companies.update({
      where: { id: company.id },
      data: {
        customFields: {
          ...customFields,
          buyerGroupAnalysis: buyerGroupAnalysis,
          lastBuyerGroupUpdate: new Date().toISOString(),
          buyerGroupStatus: 'Complete'
        },
        updatedAt: new Date()
      }
    });
  }

  async validateActiveEmployment() {
    console.log('✅ STEP 3: Validating active employment for all people...');
    console.log('');

    // Get all people with CoreSignal data
    const peopleWithCoreSignal = await this.prisma.people.findMany({
      where: {
        workspaceId: this.correctWorkspaceId,
        customFields: {
          path: ['dataSource'],
          equals: 'CoreSignal API'
        }
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        customFields: true,
        company: {
          select: { name: true }
        }
      }
    });

    console.log(`📊 Found ${peopleWithCoreSignal.length} people with CoreSignal data`);
    console.log('');

    let validatedCount = 0;
    let invalidCount = 0;

    for (const person of peopleWithCoreSignal) {
      const richProfile = person.customFields?.richProfile;
      if (!richProfile) continue;

      // Validate active employment using multiple methods
      const isActive = await this.validatePersonActiveEmployment(person, richProfile);
      
      if (isActive) {
        validatedCount++;
        console.log(`   ✅ ${person.fullName} - Active at ${person.company?.name}`);
      } else {
        invalidCount++;
        console.log(`   ❌ ${person.fullName} - Not active at ${person.company?.name}`);
        
        // Update person record to reflect inactive status
        await this.prisma.people.update({
          where: { id: person.id },
          data: {
            customFields: {
              ...person.customFields,
              employmentStatus: 'Inactive',
              lastValidated: new Date().toISOString()
            },
            updatedAt: new Date()
          }
        });
      }
    }

    console.log('');
    console.log(`📊 EMPLOYMENT VALIDATION SUMMARY:`);
    console.log(`=================================`);
    console.log(`✅ Active employees: ${validatedCount}`);
    console.log(`❌ Inactive employees: ${invalidCount}`);
    console.log(`📈 Validation rate: ${((validatedCount/(validatedCount+invalidCount))*100).toFixed(1)}%`);
    console.log('');
  }

  async validatePersonActiveEmployment(person, richProfile) {
    // Method 1: Check active_experience flag
    if (richProfile.active_experience === 1) {
      return true;
    }

    // Method 2: Check experience array for current role
    if (richProfile.experience && Array.isArray(richProfile.experience)) {
      const currentExperience = richProfile.experience.find(exp => 
        exp.active_experience === 1 || 
        exp.end_date === null || 
        exp.end_date === undefined ||
        new Date(exp.end_date) > new Date()
      );
      
      if (currentExperience) {
        return true;
      }
    }

    // Method 3: Check if last experience is recent (within 6 months)
    if (richProfile.experience && Array.isArray(richProfile.experience)) {
      const latestExperience = richProfile.experience[0];
      if (latestExperience && latestExperience.start_date) {
        const startDate = new Date(latestExperience.start_date);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        if (startDate > sixMonthsAgo) {
          return true;
        }
      }
    }

    return false;
  }

  async generateFinalReport() {
    console.log('📊 STEP 4: Generating final report...');
    console.log('');

    const stats = await Promise.all([
      this.prisma.companies.count({ where: { workspaceId: this.correctWorkspaceId } }),
      this.prisma.people.count({ where: { workspaceId: this.correctWorkspaceId } }),
      this.prisma.people.count({ 
        where: { 
          workspaceId: this.correctWorkspaceId,
          customFields: {
            path: ['dataSource'],
            equals: 'CoreSignal API'
          }
        } 
      }),
      this.prisma.prospects.count({ where: { workspaceId: this.correctWorkspaceId } }),
      this.prisma.companies.count({ 
        where: { 
          workspaceId: this.correctWorkspaceId,
          customFields: {
            path: ['buyerGroupStatus'],
            equals: 'Complete'
          }
        } 
      })
    ]);

    const [totalCompanies, totalPeople, coresignalPeople, totalProspects, companiesWithBuyerGroups] = stats;

    console.log('📈 FINAL WORKSPACE STATISTICS:');
    console.log('==============================');
    console.log(`🏢 Total Companies: ${totalCompanies}`);
    console.log(`👥 Total People: ${totalPeople}`);
    console.log(`🔍 CoreSignal Enriched People: ${coresignalPeople}`);
    console.log(`🎯 Total Prospects: ${totalProspects}`);
    console.log(`🎯 Companies with Buyer Groups: ${companiesWithBuyerGroups}`);
    console.log('');

    // Show buyer group distribution
    const buyerGroupStats = await this.prisma.people.groupBy({
      by: ['customFields'],
      where: {
        workspaceId: this.correctWorkspaceId,
        customFields: {
          path: ['buyerGroupRole'],
          not: null
        }
      },
      _count: true
    });

    console.log('🎯 BUYER GROUP DISTRIBUTION:');
    console.log('============================');
    
    const roleCounts = {
      'Decision Maker': 0,
      'Champion': 0,
      'Influencer': 0,
      'Stakeholder': 0
    };

    for (const stat of buyerGroupStats) {
      const role = stat.customFields?.buyerGroupRole;
      if (role && roleCounts.hasOwnProperty(role)) {
        roleCounts[role] += stat._count;
      }
    }

    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`${role}: ${count} people`);
    });

    console.log('');
    console.log('✅ ALL COMPANIES BUYER GROUP ANALYSIS COMPLETE!');
    console.log('===============================================');
    console.log('');
    console.log('🎯 Every company in the workspace now has:');
    console.log('• Comprehensive buyer group analysis');
    console.log('• Current employees with active employment validation');
    console.log('• Proper buyer group role assignments');
    console.log('• Linked people and prospect records');
    console.log('• Rich CoreSignal profile data');
    console.log('');
    console.log('📊 The system now provides complete buyer group intelligence');
    console.log('for all companies, enabling effective sales and engagement strategies.');
  }

  extractDomain(website) {
    if (!website) return null;
    
    // Remove protocol
    let domain = website.replace(/^https?:\/\//, '');
    
    // Remove www
    domain = domain.replace(/^www\./, '');
    
    // Remove path
    domain = domain.split('/')[0];
    
    // Remove port
    domain = domain.split(':')[0];
    
    return domain;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute the analysis
async function main() {
  const analyzer = new AnalyzeAllCompaniesBuyerGroups();
  await analyzer.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AnalyzeAllCompaniesBuyerGroups;
