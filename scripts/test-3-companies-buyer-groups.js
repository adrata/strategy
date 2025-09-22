/**
 * 🧪 TEST 3 COMPANIES BUYER GROUPS
 * 
 * This script tests the buyer group analysis on 3 companies first
 * to validate the approach works correctly before running on all companies
 */

const { PrismaClient } = require('@prisma/client');

class Test3CompaniesBuyerGroups {
  constructor() {
    this.prisma = new PrismaClient();
    this.correctWorkspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.correctUserId = '01K1VBYXHD0J895XAN0HGFBKJP';
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    
    // Test on 3 specific companies
    this.testCompanies = [
      '5 Bars Services, LLC', // Already working
      'Platte River Power Authority', // Has people with emails
      'Los Angeles Department of Water & Power' // Has people with emails
    ];
    
    if (!this.coresignalApiKey) {
      console.log('⚠️ CORESIGNAL_API_KEY not set - will use email domain enrichment only');
    }
  }

  async execute() {
    console.log('🧪 TESTING 3 COMPANIES BUYER GROUPS');
    console.log('===================================');
    console.log('');

    try {
      // Step 1: Get the 3 test companies
      await this.getTestCompanies();
      
      // Step 2: Enrich company websites from email domains
      await this.enrichCompanyWebsitesFromEmails();
      
      // Step 3: Analyze buyer groups for each test company
      await this.analyzeTestCompanies();
      
      // Step 4: Validate database saves
      await this.validateDatabaseSaves();
      
      // Step 5: Generate test report
      await this.generateTestReport();

    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getTestCompanies() {
    console.log('🏢 STEP 1: Getting 3 test companies...');
    console.log('');

    this.companies = await this.prisma.companies.findMany({
      where: { 
        workspaceId: this.correctWorkspaceId,
        name: { in: this.testCompanies }
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

    console.log(`📊 Found ${this.companies.length} test companies:`);
    this.companies.forEach(company => {
      console.log(`   • ${company.name} (ID: ${company.id})`);
    });
    console.log('');
  }

  async enrichCompanyWebsitesFromEmails() {
    console.log('📧 STEP 2: Enriching company websites from email domains...');
    console.log('');

    for (const company of this.companies) {
      console.log(`🔍 Checking ${company.name}...`);
      
      // Skip if company already has a website
      if (company.website && company.website.trim() !== '') {
        console.log(`   ✅ Already has website: ${company.website}`);
        continue;
      }

      // Get people associated with this company
      const people = await this.prisma.people.findMany({
        where: {
          workspaceId: this.correctWorkspaceId,
          companyId: company.id,
          email: { not: null }
        },
        select: {
          email: true,
          fullName: true
        }
      });

      console.log(`   📊 Found ${people.length} people with emails`);

      if (people.length === 0) {
        console.log(`   ⚠️ No people with emails found for ${company.name}`);
        continue;
      }

      // Extract email domains
      const emailDomains = people
        .map(person => this.extractEmailDomain(person.email))
        .filter(domain => domain && !this.isGenericEmailDomain(domain));

      console.log(`   📧 Email domains found: ${emailDomains.join(', ')}`);

      if (emailDomains.length === 0) {
        console.log(`   ⚠️ No valid email domains found for ${company.name}`);
        continue;
      }

      // Find the most common domain
      const domainCounts = {};
      emailDomains.forEach(domain => {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      });

      const mostCommonDomain = Object.keys(domainCounts).reduce((a, b) => 
        domainCounts[a] > domainCounts[b] ? a : b
      );

      // Update company with website
      await this.prisma.companies.update({
        where: { id: company.id },
        data: {
          website: `https://${mostCommonDomain}`,
          updatedAt: new Date()
        }
      });

      console.log(`   ✅ Enriched ${company.name} with website: ${mostCommonDomain}`);
    }

    console.log('');
  }

  async analyzeTestCompanies() {
    console.log('🎯 STEP 3: Analyzing buyer groups for test companies...');
    console.log('');

    for (const company of this.companies) {
      console.log(`🏢 Analyzing ${company.name}...`);
      
      try {
        // Step 3a: Enrich company by domain
        const enrichedCompany = await this.enrichCompanyByDomain(company);
        
        if (!enrichedCompany) {
          console.log(`   ⚠️ Could not enrich company ${company.name}`);
          continue;
        }

        console.log(`   ✅ Company enriched with CoreSignal ID: ${enrichedCompany.id}`);

        // Step 3b: Search for current employees
        const currentEmployees = await this.searchCurrentEmployees(enrichedCompany);
        
        if (!currentEmployees || currentEmployees.length === 0) {
          console.log(`   ⚠️ No current employees found for ${company.name}`);
          continue;
        }

        console.log(`   📊 Found ${currentEmployees.length} current employees`);

        // Step 3c: Analyze buyer group roles
        const buyerGroupAnalysis = await this.analyzeBuyerGroupRoles(currentEmployees, company);
        
        console.log(`   🎯 Buyer group analysis: ${buyerGroupAnalysis.summary}`);

        // Step 3d: Create/update people records
        const createdPeople = await this.createPeopleRecords(currentEmployees, company, buyerGroupAnalysis);
        
        console.log(`   👥 Created/updated ${createdPeople.length} people records`);

        // Step 3e: Create prospect records for new people
        await this.createProspectRecords(createdPeople, company);
        
        // Step 3f: Update company with buyer group analysis
        await this.updateCompanyWithBuyerGroup(company, buyerGroupAnalysis);
        
        console.log(`   ✅ Successfully analyzed ${company.name}`);
        console.log('');
        
        // Add delay to avoid rate limiting
        await this.delay(2000);
        
      } catch (error) {
        console.error(`   ❌ Error analyzing ${company.name}:`, error.message);
        console.log('');
      }
    }
  }

  async enrichCompanyByDomain(company) {
    if (!this.coresignalApiKey) {
      console.log(`   ⚠️ No CoreSignal API key - skipping enrichment for ${company.name}`);
      return null;
    }

    try {
      const domain = this.extractDomain(company.website);
      if (!domain) {
        console.log(`   ⚠️ Could not extract domain from ${company.website}`);
        return null;
      }

      console.log(`   🔍 Enriching company by domain: ${domain}`);

      const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website=${domain}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.coresignalApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`   ⚠️ Company enrichment failed for ${domain}: ${response.status} ${response.statusText}`);
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
    if (!this.coresignalApiKey) {
      return [];
    }

    try {
      const companyId = enrichedCompany.id;
      if (!companyId) return [];

      console.log(`   🔍 Searching for current employees with company ID: ${companyId}`);

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
        console.log(`   ⚠️ Employee search failed: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      const employees = data.hits?.hits || [];
      
      console.log(`   📊 CoreSignal returned ${employees.length} employees`);
      return employees;
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
        decisionMakingPower: this.calculateDecisionMakingPower(personData, role),
        rawData: personData
      };

      console.log(`     👤 ${personInfo.name} - ${personInfo.title} (${role})`);

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

  calculateDecisionMakingPower(personData, role) {
    const title = (personData.headline || personData.experience?.[0]?.position_title || '').toLowerCase();
    
    if (role === 'Decision Maker') {
      if (title.includes('ceo') || title.includes('chief executive') || title.includes('president')) return 95;
      if (title.includes('vp') || title.includes('vice president')) return 90;
      if (title.includes('director')) return 85;
      return 80;
    }
    
    if (role === 'Champion') {
      if (title.includes('cto') || title.includes('chief technology')) return 75;
      if (title.includes('manager')) return 70;
      return 65;
    }
    
    if (role === 'Influencer') {
      if (title.includes('senior') || title.includes('sr ')) return 60;
      if (title.includes('specialist') || title.includes('expert')) return 55;
      return 50;
    }
    
    return 40; // Stakeholder
  }

  async createPeopleRecords(employees, company, buyerGroupAnalysis) {
    const createdPeople = [];

    for (const employee of employees) {
      const personData = employee._source;
      const name = personData.full_name || `${personData.first_name || ''} ${personData.last_name || ''}`.trim();
      const title = personData.headline || personData.experience?.[0]?.position_title || 'Unknown';
      
      // Find existing person or create new one
      let person = await this.findExistingPerson(personData, company);
      
      const role = this.determineBuyerGroupRole(personData, company);
      const influenceLevel = this.assessInfluenceLevel(personData, role);
      const engagementPriority = this.assessEngagementPriority(role);
      const decisionMakingPower = this.calculateDecisionMakingPower(personData, role);

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
        tags: ['CoreSignal', 'Buyer Group Member', role, 'Current Employee', company.name],
        customFields: {
          coresignalId: personData.id,
          buyerGroupRole: role,
          influenceLevel: influenceLevel,
          engagementPriority: engagementPriority,
          decisionMakingPower: decisionMakingPower,
          richProfile: personData,
          dataSource: 'CoreSignal',
          lastUpdated: new Date().toISOString()
        },
        updatedAt: new Date()
      };

      if (person) {
        // Update existing person
        person = await this.updateExistingPerson(person, personDataToSave);
        console.log(`     🔄 Updated existing person: ${person.fullName}`);
      } else {
        // Create new person
        person = await this.createNewPerson(personDataToSave);
        console.log(`     ➕ Created new person: ${person.fullName}`);
      }

      createdPeople.push(person);
    }

    return createdPeople;
  }

  async findExistingPerson(personData, company) {
    const name = personData.full_name || `${personData.first_name || ''} ${personData.last_name || ''}`.trim();
    
    const matches = await this.prisma.people.findMany({
      where: {
        OR: [
          { email: personData.email },
          { fullName: name },
          { 
            AND: [
              { firstName: personData.first_name },
              { lastName: personData.last_name }
            ]
          }
        ],
        companyId: company.id,
        workspaceId: this.correctWorkspaceId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        jobTitle: true,
        email: true,
        customFields: true
      }
    });
    
    return matches[0] || null;
  }

  async updateExistingPerson(existingPerson, personDataToSave) {
    const updateData = {
      jobTitle: personDataToSave.jobTitle,
      email: personDataToSave.email,
      linkedinUrl: personDataToSave.linkedinUrl,
      customFields: {
        ...existingPerson.customFields,
        ...personDataToSave.customFields
      }
    };
    
    return await this.prisma.people.update({
      where: { id: existingPerson.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        jobTitle: true,
        email: true,
        companyId: true,
        workspaceId: true,
        tags: true,
        customFields: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async createNewPerson(personDataToSave) {
    return await this.prisma.people.create({
      data: personDataToSave,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        jobTitle: true,
        email: true,
        companyId: true,
        workspaceId: true,
        tags: true,
        customFields: true,
        createdAt: true,
        updatedAt: true
      }
    });
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
          firstName: person.firstName,
          lastName: person.lastName,
          fullName: person.fullName,
          jobTitle: person.jobTitle,
          email: person.email,
          linkedinUrl: person.linkedinUrl,
          personId: person.id,
          companyId: company.id,
          workspaceId: this.correctWorkspaceId,
          assignedUserId: this.correctUserId,
          status: 'Active',
          priority: 'medium',
          buyerGroupRole: person.customFields?.buyerGroupRole || 'Stakeholder',
          engagementLevel: 'initial',
          tags: ['CoreSignal', 'Buyer Group Member', person.customFields?.buyerGroupRole || 'Stakeholder', 'Current Employee', company.name],
          customFields: {
            coresignalId: person.customFields?.coresignalId,
            influenceLevel: person.customFields?.influenceLevel,
            engagementPriority: person.customFields?.engagementPriority,
            decisionMakingPower: person.customFields?.decisionMakingPower,
            richProfile: person.customFields?.richProfile,
            dataSource: 'CoreSignal',
            lastUpdated: new Date().toISOString()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await this.prisma.prospects.create({
          data: prospectData,
          select: { id: true }
        });
        console.log(`     🎯 Created prospect record for ${person.fullName}`);
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

    console.log(`   💾 Updated company record with buyer group analysis`);
  }

  async validateDatabaseSaves() {
    console.log('💾 STEP 4: Validating database saves...');
    console.log('');

    for (const company of this.companies) {
      console.log(`🔍 Validating ${company.name}...`);
      
      // Check if company has buyer group analysis
      const updatedCompany = await this.prisma.companies.findUnique({
        where: { id: company.id },
        select: {
          id: true,
          name: true,
          customFields: true
        }
      });

      if (updatedCompany?.customFields?.buyerGroupStatus === 'Complete') {
        console.log(`   ✅ Company has buyer group analysis saved`);
        
        // Check people records
        const people = await this.prisma.people.findMany({
          where: {
            companyId: company.id,
            workspaceId: this.correctWorkspaceId,
            customFields: {
              path: ['dataSource'],
              equals: 'CoreSignal'
            }
          },
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            customFields: true
          }
        });

        console.log(`   👥 Found ${people.length} people with CoreSignal data`);
        
        // Check prospect records
        const prospects = await this.prisma.prospects.findMany({
          where: {
            companyId: company.id,
            workspaceId: this.correctWorkspaceId,
            customFields: {
              path: ['dataSource'],
              equals: 'CoreSignal'
            }
          },
          select: {
            id: true,
            fullName: true,
            buyerGroupRole: true
          }
        });

        console.log(`   🎯 Found ${prospects.length} prospects with CoreSignal data`);
        
        // Show buyer group roles
        const roleCounts = {};
        people.forEach(person => {
          const role = person.customFields?.buyerGroupRole;
          if (role) {
            roleCounts[role] = (roleCounts[role] || 0) + 1;
          }
        });

        console.log(`   📊 Buyer group roles:`, roleCounts);
      } else {
        console.log(`   ❌ Company does not have buyer group analysis saved`);
      }
      
      console.log('');
    }
  }

  async generateTestReport() {
    console.log('📊 STEP 5: Generating test report...');
    console.log('');

    const stats = await Promise.all([
      this.prisma.companies.count({ 
        where: { 
          workspaceId: this.correctWorkspaceId,
          name: { in: this.testCompanies }
        } 
      }),
      this.prisma.people.count({ 
        where: { 
          workspaceId: this.correctWorkspaceId,
          company: {
            name: { in: this.testCompanies }
          }
        } 
      }),
      this.prisma.people.count({ 
        where: { 
          workspaceId: this.correctWorkspaceId,
          company: {
            name: { in: this.testCompanies }
          },
          customFields: {
            path: ['dataSource'],
            equals: 'CoreSignal'
          }
        } 
      }),
      this.prisma.prospects.count({ 
        where: { 
          workspaceId: this.correctWorkspaceId,
          company: {
            name: { in: this.testCompanies }
          }
        } 
      }),
      this.prisma.companies.count({ 
        where: { 
          workspaceId: this.correctWorkspaceId,
          name: { in: this.testCompanies },
          customFields: {
            path: ['buyerGroupStatus'],
            equals: 'Complete'
          }
        } 
      })
    ]);

    const [totalCompanies, totalPeople, coresignalPeople, totalProspects, companiesWithBuyerGroups] = stats;

    console.log('📈 TEST RESULTS SUMMARY:');
    console.log('========================');
    console.log(`🏢 Test Companies: ${totalCompanies}`);
    console.log(`👥 Total People: ${totalPeople}`);
    console.log(`🔍 CoreSignal Enriched People: ${coresignalPeople}`);
    console.log(`🎯 Total Prospects: ${totalProspects}`);
    console.log(`🎯 Companies with Buyer Groups: ${companiesWithBuyerGroups}`);
    console.log('');

    if (companiesWithBuyerGroups === totalCompanies) {
      console.log('✅ TEST PASSED: All test companies have buyer group analysis!');
    } else {
      console.log('❌ TEST FAILED: Not all companies have buyer group analysis');
    }

    console.log('');
    console.log('🎯 Next steps:');
    console.log('• If test passed, run the full script on all companies');
    console.log('• If test failed, review errors and fix before proceeding');
    console.log('• Validate that all data is being saved correctly to database');
  }

  extractEmailDomain(email) {
    if (!email || !email.includes('@')) return null;
    return email.split('@')[1].toLowerCase();
  }

  isGenericEmailDomain(domain) {
    const genericDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
      'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com'
    ];
    return genericDomains.includes(domain);
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

// Execute the test
async function main() {
  const tester = new Test3CompaniesBuyerGroups();
  await tester.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = Test3CompaniesBuyerGroups;
