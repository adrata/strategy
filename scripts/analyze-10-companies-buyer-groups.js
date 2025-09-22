/**
 * 🎯 ANALYZE 10 COMPANIES BUYER GROUPS
 * 
 * Based on the successful efficient-5bars-buyer-group-analysis.js approach
 * This script applies the same methodology to 10 other companies
 */

const { PrismaClient } = require('@prisma/client');

class Analyze10CompaniesBuyerGroups {
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
    console.log('🎯 ANALYZING 10 COMPANIES BUYER GROUPS');
    console.log('=====================================');
    console.log('');

    try {
      // Step 1: Get 10 companies with websites and people
      await this.get10Companies();
      
      // Step 2: Analyze each company using the successful 5Bars approach
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

  async get10Companies() {
    console.log('🏢 STEP 1: Getting 10 companies with websites and people...');
    console.log('');

    // Get companies that have websites and people with emails
    const companies = await this.prisma.companies.findMany({
      where: { 
        workspaceId: this.correctWorkspaceId,
        website: { not: null },
        people: {
          some: {
            email: { not: null }
          }
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        size: true,
        customFields: true,
        people: {
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            email: true,
            customFields: true
          }
        }
      },
      orderBy: { name: 'asc' },
      take: 10
    });

    // Filter out 5Bars since we already analyzed it
    this.companies = companies.filter(company => 
      !company.name.toLowerCase().includes('5 bars') && 
      !company.name.toLowerCase().includes('5bars')
    );

    console.log(`📊 Found ${this.companies.length} companies to analyze:`);
    this.companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.people.length} people)`);
    });
    console.log('');
  }

  async analyzeAllCompanies() {
    console.log('🎯 STEP 2: Analyzing buyer groups for each company...');
    console.log('');

    for (let i = 0; i < this.companies.length; i++) {
      const company = this.companies[i];
      console.log(`🏢 [${i + 1}/${this.companies.length}] Analyzing ${company.name}...`);
      
      try {
        const companyResult = await this.analyzeCompany(company);
        this.results.companies.push(companyResult);
        
        console.log(`   ✅ Successfully analyzed ${company.name}`);
        console.log(`   📊 Found ${companyResult.currentEmployees.length} current employees`);
        console.log(`   🎯 Buyer group: ${companyResult.buyerGroupSummary}`);
        console.log('');
        
        // Add delay to avoid rate limiting
        await this.delay(2000);
        
      } catch (error) {
        console.error(`   ❌ Error analyzing ${company.name}:`, error.message);
        this.results.errors.push(`${company.name}: ${error.message}`);
      }
    }
  }

  async analyzeCompany(company) {
    const companyResult = {
      id: company.id,
      name: company.name,
      website: company.website,
      domain: this.extractDomain(company.website),
      coresignalCompany: null,
      currentEmployees: [],
      buyerGroupAnalysis: null,
      databaseUpdates: { newPeople: 0, updatedPeople: 0, existingPeople: 0 },
      errors: []
    };

    try {
      // Step 1: Enrich company by domain (same as successful 5Bars approach)
      await this.enrichCompanyByDomain(companyResult);
      
      if (!companyResult.coresignalCompany) {
        throw new Error('Could not enrich company with CoreSignal');
      }

      // Step 2: Search current employees by company ID (same as successful 5Bars approach)
      await this.searchCurrentEmployeesByCompanyId(companyResult);
      
      if (companyResult.currentEmployees.length === 0) {
        throw new Error('No current employees found');
      }

      // Step 3: Analyze buyer group roles
      await this.analyzeBuyerGroupRoles(companyResult);
      
      // Step 4: Update database with people
      await this.updateDatabaseWithPeople(companyResult, company);
      
    } catch (error) {
      companyResult.errors.push(error.message);
    }

    return companyResult;
  }

  async enrichCompanyByDomain(companyResult) {
    console.log(`   🔍 Enriching company by domain: ${companyResult.domain}`);
    
    try {
      const response = await fetch(
        `https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website=${companyResult.domain}`,
        {
          method: 'GET',
          headers: {
            'apikey': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      console.log(`   📊 Enrichment status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Company enrichment failed: ${response.status} - ${errorText}`);
      }

      const companyData = await response.json();
      this.creditsUsed.enrich += 1;
      
      companyResult.coresignalCompany = {
        id: companyData.id,
        name: companyData.company_name,
        website: companyData.website,
        industry: companyData.industry,
        employeesCount: companyData.employees_count,
        size: companyData.company_size_range,
        location: companyData.hq_country,
        founded: companyData.founded_year,
        rawData: companyData
      };

      console.log(`   ✅ Company enriched: ${companyData.company_name}`);
      console.log(`   🆔 CoreSignal ID: ${companyData.id}`);
      console.log(`   👥 Employee count: ${companyData.employees_count || 'Unknown'}`);
      
    } catch (error) {
      console.error(`   ❌ Company enrichment failed:`, error.message);
      throw error;
    }
  }

  async searchCurrentEmployeesByCompanyId(companyResult) {
    console.log(`   🔍 Searching for current employees at company ID: ${companyResult.coresignalCompany.id}`);
    
    try {
      // Use the same successful query structure as 5Bars
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: 'experience',
                  query: {
                    bool: {
                      must: [
                        { term: { 'experience.active_experience': 1 } }, // ACTIVE experience only
                        { term: { 'experience.company_id': companyResult.coresignalCompany.id } } // Direct company ID match
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      };
      
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=100', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      console.log(`   📊 Search status: ${searchResponse.status}`);
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        throw new Error(`Employee search failed: ${searchResponse.status} - ${errorText}`);
      }

      const searchData = await searchResponse.json();
      
      // Handle different response formats (same as 5Bars)
      let employeeIds = [];
      if (Array.isArray(searchData)) {
        employeeIds = searchData;
      } else if (searchData && searchData.hits && searchData.hits.hits) {
        employeeIds = searchData.hits.hits.map(hit => hit._id);
      } else if (searchData && Array.isArray(searchData.data)) {
        employeeIds = searchData.data.map(item => item.id);
      } else {
        console.log(`   ⚠️ Unexpected search response format:`, typeof searchData);
        return;
      }

      console.log(`   📊 Found ${employeeIds.length} employee IDs`);
      
      if (employeeIds.length === 0) {
        console.log(`   ⚠️ No employees found for company ID: ${companyResult.coresignalCompany.id}`);
        return;
      }

      // Collect detailed employee data (same as 5Bars)
      await this.collectEmployeeDetails(employeeIds, companyResult);
      
    } catch (error) {
      console.error(`   ❌ Employee search failed:`, error.message);
      throw error;
    }
  }

  async collectEmployeeDetails(employeeIds, companyResult) {
    console.log(`   🔍 Collecting details for ${employeeIds.length} employees...`);
    
    for (const employeeId of employeeIds.slice(0, 20)) { // Limit to 20 employees per company
      try {
        const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
          method: 'GET',
          headers: {
            'apikey': this.apiKey,
            'Accept': 'application/json'
          }
        });

        if (!collectResponse.ok) {
          console.log(`   ⚠️ Failed to collect employee ${employeeId}: ${collectResponse.status}`);
          continue;
        }

        const employeeData = await collectResponse.json();
        this.creditsUsed.collect += 1;
        
        // Process employee data (same as 5Bars)
        const processedEmployee = this.processEmployeeData(employeeData, companyResult);
        if (processedEmployee) {
          companyResult.currentEmployees.push(processedEmployee);
        }
        
      } catch (error) {
        console.log(`   ⚠️ Error collecting employee ${employeeId}:`, error.message);
      }
    }

    console.log(`   ✅ Collected ${companyResult.currentEmployees.length} employee profiles`);
  }

  processEmployeeData(employeeData, companyResult) {
    // Extract current experience
    const currentExperience = employeeData.experience?.find(exp => exp.active_experience === 1);
    if (!currentExperience) return null;

    // Determine buyer group role (same logic as 5Bars)
    const role = this.determineBuyerGroupRole(employeeData, currentExperience);
    
    return {
      coresignalId: employeeData.id,
      name: employeeData.full_name || `${employeeData.first_name || ''} ${employeeData.last_name || ''}`.trim(),
      firstName: employeeData.first_name || 'Unknown',
      lastName: employeeData.last_name || 'Unknown',
      email: employeeData.email || null,
      linkedinUrl: employeeData.linkedin_url || null,
      currentTitle: currentExperience.position_title || employeeData.headline || 'Unknown',
      currentCompany: companyResult.name,
      buyerGroupRole: role,
      influenceLevel: this.assessInfluenceLevel(role),
      engagementPriority: this.assessEngagementPriority(role),
      decisionMakingPower: this.calculateDecisionMakingPower(role, currentExperience.position_title),
      richProfile: {
        headline: employeeData.headline,
        summary: employeeData.summary,
        pictureUrl: employeeData.picture_url,
        connectionsCount: employeeData.connections_count,
        followersCount: employeeData.followers_count,
        skills: employeeData.skills || [],
        location: employeeData.location,
        experience: employeeData.experience,
        education: employeeData.education
      }
    };
  }

  determineBuyerGroupRole(employeeData, currentExperience) {
    const title = (currentExperience.position_title || employeeData.headline || '').toLowerCase();
    
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
        title.includes('architect') || title.includes('consultant')) {
      return 'Influencer';
    }

    // Stakeholders - Everyone else
    return 'Stakeholder';
  }

  assessInfluenceLevel(role) {
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

  calculateDecisionMakingPower(role, title) {
    const titleLower = (title || '').toLowerCase();
    
    if (role === 'Decision Maker') {
      if (titleLower.includes('ceo') || titleLower.includes('chief executive') || titleLower.includes('president')) return 95;
      if (titleLower.includes('vp') || titleLower.includes('vice president')) return 90;
      if (titleLower.includes('director')) return 85;
      return 80;
    }
    
    if (role === 'Champion') {
      if (titleLower.includes('cto') || titleLower.includes('chief technology')) return 75;
      if (titleLower.includes('manager')) return 70;
      return 65;
    }
    
    if (role === 'Influencer') {
      if (titleLower.includes('senior') || titleLower.includes('sr ')) return 60;
      if (titleLower.includes('specialist') || titleLower.includes('expert')) return 55;
      return 50;
    }
    
    return 40; // Stakeholder
  }

  async analyzeBuyerGroupRoles(companyResult) {
    const employees = companyResult.currentEmployees;
    
    const roleDistribution = {
      decisionMakers: employees.filter(e => e.buyerGroupRole === 'Decision Maker').length,
      champions: employees.filter(e => e.buyerGroupRole === 'Champion').length,
      influencers: employees.filter(e => e.buyerGroupRole === 'Influencer').length,
      stakeholders: employees.filter(e => e.buyerGroupRole === 'Stakeholder').length
    };

    const primaryContact = employees.find(e => e.buyerGroupRole === 'Decision Maker') || 
                          employees.find(e => e.buyerGroupRole === 'Champion') || 
                          employees[0];

    companyResult.buyerGroupAnalysis = {
      totalMembers: employees.length,
      roleDistribution,
      primaryContact: primaryContact ? {
        name: primaryContact.name,
        role: primaryContact.buyerGroupRole,
        title: primaryContact.currentTitle
      } : null,
      confidence: 'High',
      analysisDate: new Date().toISOString()
    };

    companyResult.buyerGroupSummary = `${roleDistribution.decisionMakers} Decision Makers, ${roleDistribution.champions} Champions, ${roleDistribution.influencers} Influencers, ${roleDistribution.stakeholders} Stakeholders (${employees.length} total)`;
  }

  async updateDatabaseWithPeople(companyResult, company) {
    console.log(`   💾 Updating database with ${companyResult.currentEmployees.length} people...`);
    
    for (const employee of companyResult.currentEmployees) {
      try {
        // Check if person already exists
        const existingPerson = await this.findExistingPerson(employee, company.id);
        
        if (existingPerson) {
          // Update existing person
          await this.updateExistingPerson(existingPerson, employee);
          companyResult.databaseUpdates.updatedPeople++;
          console.log(`     🔄 Updated: ${employee.name} (${employee.buyerGroupRole})`);
        } else {
          // Create new person
          await this.createNewPerson(employee, company.id);
          companyResult.databaseUpdates.newPeople++;
          console.log(`     ➕ Created: ${employee.name} (${employee.buyerGroupRole})`);
        }
        
        // Create prospect record for new people
        if (!existingPerson) {
          await this.createProspectRecord(employee, company.id);
          console.log(`     🎯 Created prospect: ${employee.name}`);
        }
        
      } catch (error) {
        console.error(`     ❌ Failed to create records for ${employee.name}:`, error.message);
        companyResult.errors.push(`Record creation for ${employee.name}: ${error.message}`);
      }
    }
  }

  async findExistingPerson(employee, companyId) {
    const matches = await this.prisma.people.findMany({
      where: {
        OR: [
          { email: employee.email },
          { fullName: employee.name },
          { 
            AND: [
              { firstName: employee.firstName },
              { lastName: employee.lastName }
            ]
          }
        ],
        companyId: companyId,
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

  async updateExistingPerson(existingPerson, employee) {
    const updateData = {
      jobTitle: employee.currentTitle,
      email: employee.email,
      linkedinUrl: employee.linkedinUrl,
      customFields: {
        ...existingPerson.customFields,
        coresignalId: employee.coresignalId,
        buyerGroupRole: employee.buyerGroupRole,
        influenceLevel: employee.influenceLevel,
        engagementPriority: employee.engagementPriority,
        decisionMakingPower: employee.decisionMakingPower,
        richProfile: employee.richProfile,
        dataSource: 'CoreSignal',
        lastUpdated: new Date().toISOString()
      }
    };
    
    await this.prisma.people.update({
      where: { id: existingPerson.id },
      data: updateData
    });
  }

  async createNewPerson(employee, companyId) {
    const personData = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: employee.name,
      jobTitle: employee.currentTitle,
      email: employee.email,
      linkedinUrl: employee.linkedinUrl,
      companyId: companyId,
      workspaceId: this.correctWorkspaceId,
      tags: ['CoreSignal', 'Buyer Group Member', employee.buyerGroupRole, 'Current Employee'],
      customFields: {
        coresignalId: employee.coresignalId,
        buyerGroupRole: employee.buyerGroupRole,
        influenceLevel: employee.influenceLevel,
        engagementPriority: employee.engagementPriority,
        decisionMakingPower: employee.decisionMakingPower,
        richProfile: employee.richProfile,
        dataSource: 'CoreSignal',
        lastUpdated: new Date().toISOString()
      }
    };
    
    await this.prisma.people.create({
      data: personData,
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

  async createProspectRecord(employee, companyId) {
    const prospectData = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: employee.name,
      jobTitle: employee.currentTitle,
      email: employee.email,
      linkedinUrl: employee.linkedinUrl,
      companyId: companyId,
      workspaceId: this.correctWorkspaceId,
      assignedUserId: this.correctUserId,
      status: 'Active',
      priority: 'medium',
      buyerGroupRole: employee.buyerGroupRole,
      engagementLevel: 'initial',
      tags: ['CoreSignal', 'Buyer Group Member', employee.buyerGroupRole, 'Current Employee'],
      customFields: {
        coresignalId: employee.coresignalId,
        influenceLevel: employee.influenceLevel,
        engagementPriority: employee.engagementPriority,
        decisionMakingPower: employee.decisionMakingPower,
        richProfile: employee.richProfile,
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
  }

  async generateFinalReport() {
    console.log('📊 STEP 3: Generating final report...');
    console.log('');

    const totalEmployees = this.results.companies.reduce((sum, company) => sum + company.currentEmployees.length, 0);
    const totalNewPeople = this.results.companies.reduce((sum, company) => sum + company.databaseUpdates.newPeople, 0);
    const totalUpdatedPeople = this.results.companies.reduce((sum, company) => sum + company.databaseUpdates.updatedPeople, 0);
    const successfulCompanies = this.results.companies.filter(company => company.currentEmployees.length > 0);

    console.log('📈 FINAL RESULTS SUMMARY:');
    console.log('=========================');
    console.log(`🏢 Companies analyzed: ${this.results.companies.length}`);
    console.log(`✅ Successful analyses: ${successfulCompanies.length}`);
    console.log(`👥 Total employees found: ${totalEmployees}`);
    console.log(`🆕 New people added: ${totalNewPeople}`);
    console.log(`🔄 People updated: ${totalUpdatedPeople}`);
    console.log(`💰 Total credits used: ${JSON.stringify(this.creditsUsed)}`);
    console.log('');

    console.log('🎯 COMPANY DETAILS:');
    console.log('===================');
    this.results.companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   📊 Employees: ${company.currentEmployees.length}`);
      console.log(`   🎯 Buyer Group: ${company.buyerGroupSummary}`);
      if (company.errors.length > 0) {
        console.log(`   ❌ Errors: ${company.errors.join(', ')}`);
      }
      console.log('');
    });

    if (this.results.errors.length > 0) {
      console.log('❌ GLOBAL ERRORS:');
      console.log('=================');
      this.results.errors.forEach(error => console.log(`   • ${error}`));
      console.log('');
    }

    console.log('✅ 10 COMPANIES BUYER GROUP ANALYSIS COMPLETE!');
    console.log('==============================================');
    console.log('');
    console.log('🎯 Each company now has:');
    console.log('• Real CoreSignal employee data with active employment validation');
    console.log('• Proper buyer group role assignments');
    console.log('• Linked people and prospect records in database');
    console.log('• Rich profile data for sales and engagement');
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
  const analyzer = new Analyze10CompaniesBuyerGroups();
  await analyzer.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = Analyze10CompaniesBuyerGroups;
