#!/usr/bin/env node

/**
 * 🔍 PROCESS COMPANIES WITHOUT PEOPLE
 * 
 * This script processes the 76 companies that don't have people yet by:
 * 1. Using CoreSignal to find employees for each company
 * 2. Creating people records for found employees
 * 3. Assigning buyer group roles using the 5-role system
 * 4. Creating formal buyer group records
 * 5. Implementing credit optimizations to control costs
 */

const { PrismaClient } = require('@prisma/client');

class ProcessCompaniesWithoutPeople {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus workspace
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    // Credit optimization settings
    this.creditsUsed = { search: 0, collect: 0, enrich: 0 };
    this.maxCollectCredits = 1000; // Limit to control costs
    this.maxCompaniesPerRun = 20; // Process in batches
    
    this.results = {
      analysisDate: new Date().toISOString(),
      companiesProcessed: 0,
      companiesSuccessful: 0,
      companiesFailed: 0,
      peopleFound: 0,
      buyerGroupsCreated: 0,
      totalCreditsUsed: this.creditsUsed,
      companiesNotProcessed: [],
      errors: []
    };
  }

  async execute() {
    console.log('🔍 PROCESSING COMPANIES WITHOUT PEOPLE');
    console.log('=====================================');
    console.log('');

    try {
      // Step 1: Find companies without people
      await this.findCompaniesWithoutPeople();
      
      // Step 2: Process companies with CoreSignal discovery
      await this.processCompaniesWithCoreSignal();
      
      // Step 3: Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Processing failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findCompaniesWithoutPeople() {
    console.log('🔍 STEP 1: Finding companies without people...');
    
    const companiesWithoutPeople = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        people: { none: {} }
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true
      }
    });

    console.log(`   📊 Found ${companiesWithoutPeople.length} companies without people`);
    console.log('');

    // Show first 20 companies
    console.log('📋 Companies without people (first 20):');
    companiesWithoutPeople.slice(0, 20).forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.website || 'No website'})`);
    });
    
    if (companiesWithoutPeople.length > 20) {
      console.log(`   ... and ${companiesWithoutPeople.length - 20} more`);
    }
    console.log('');

    return companiesWithoutPeople;
  }

  async processCompaniesWithCoreSignal() {
    console.log('🔍 STEP 2: Processing companies with CoreSignal discovery...');
    
    const companiesWithoutPeople = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        people: { none: {} }
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true
      }
    });

    // Process in batches to control costs
    const companiesToProcess = companiesWithoutPeople.slice(0, this.maxCompaniesPerRun);
    
    console.log(`   📊 Processing ${companiesToProcess.length} companies (batch 1 of ${Math.ceil(companiesWithoutPeople.length / this.maxCompaniesPerRun)})`);
    console.log('');

    for (const company of companiesToProcess) {
      try {
        console.log(`🏢 Processing ${company.name}...`);
        
        // Check if we've hit our credit limit
        if (this.creditsUsed.collect >= this.maxCollectCredits) {
          console.log(`   💰 Reached collect credit limit (${this.maxCollectCredits}). Stopping processing.`);
          this.results.companiesNotProcessed.push({
            name: company.name,
            id: company.id,
            reason: 'Credit limit reached'
          });
          break;
        }

        // Step 2a: Enrich company by domain
        const enrichedCompany = await this.enrichCompanyByDomain(company);
        
        if (!enrichedCompany) {
          console.log(`   ⚠️ Could not enrich company ${company.name}`);
          this.results.companiesNotProcessed.push({
            name: company.name,
            id: company.id,
            reason: 'Enrichment failed - company not found in CoreSignal'
          });
          this.results.companiesFailed++;
          continue;
        }

        // Step 2b: Search for employees
        const employees = await this.searchForEmployees(enrichedCompany);
        
        if (!employees || employees.length === 0) {
          console.log(`   ⚠️ No employees found for ${company.name}`);
          this.results.companiesNotProcessed.push({
            name: company.name,
            id: company.id,
            reason: 'No employees found via CoreSignal search'
          });
          this.results.companiesFailed++;
          continue;
        }

        // Step 2c: Collect employee profiles (limited to control costs)
        const maxProfilesToCollect = Math.min(employees.length, 20); // Limit to 20 profiles per company
        const employeesToCollect = employees.slice(0, maxProfilesToCollect);
        
        console.log(`   👥 Found ${employees.length} employees, collecting ${employeesToCollect.length} profiles...`);
        
        const collectedEmployees = await this.collectEmployeeProfiles(employeesToCollect);
        
        if (collectedEmployees.length === 0) {
          console.log(`   ⚠️ No employee profiles collected for ${company.name}`);
          this.results.companiesNotProcessed.push({
            name: company.name,
            id: company.id,
            reason: 'No employee profiles collected'
          });
          this.results.companiesFailed++;
          continue;
        }

        // Step 2d: Create people records and assign buyer group roles
        const peopleCreated = await this.createPeopleAndAssignRoles(company, collectedEmployees);
        
        // Step 2e: Create buyer group
        const buyerGroupCreated = await this.createBuyerGroup(company, peopleCreated);
        
        this.results.companiesProcessed++;
        this.results.companiesSuccessful++;
        this.results.peopleFound += peopleCreated.length;
        this.results.buyerGroupsCreated += buyerGroupCreated ? 1 : 0;
        
        console.log(`   ✅ Successfully processed ${company.name}: ${peopleCreated.length} people, buyer group created`);
        
        // Add delay to respect rate limits
        await this.delay(2000);

      } catch (error) {
        console.error(`   ❌ Failed to process ${company.name}:`, error.message);
        this.results.companiesNotProcessed.push({
          name: company.name,
          id: company.id,
          reason: `Processing failed: ${error.message}`
        });
        this.results.companiesFailed++;
        this.results.errors.push(`Company ${company.name}: ${error.message}`);
      }
    }

    console.log('');
  }

  async enrichCompanyByDomain(company) {
    if (!company.website) {
      return null;
    }

    try {
      // Extract domain from website
      const domain = this.extractDomain(company.website);
      if (!domain) {
        return null;
      }

      // Call CoreSignal enrich endpoint
      const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/company/enrich', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: domain
        })
      });

      if (!response.ok) {
        throw new Error(`Enrich failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.creditsUsed.enrich++;

      return data;
    } catch (error) {
      console.error(`   ❌ Enrich failed for ${company.name}:`, error.message);
      return null;
    }
  }

  async searchForEmployees(company) {
    try {
      // Search for employees using company name
      const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/employee/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: company.name,
          limit: 50 // Limit to control costs
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.creditsUsed.search++;

      return data.data || [];
    } catch (error) {
      console.error(`   ❌ Search failed for ${company.name}:`, error.message);
      return [];
    }
  }

  async collectEmployeeProfiles(employees) {
    const collectedProfiles = [];

    for (const employee of employees) {
      try {
        // Check if we've hit our collect credit limit
        if (this.creditsUsed.collect >= this.maxCollectCredits) {
          console.log(`   💰 Reached collect credit limit. Stopping collection.`);
          break;
        }

        const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/employee/collect', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: employee.id
          })
        });

        if (!response.ok) {
          throw new Error(`Collect failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        this.creditsUsed.collect++;

        if (data.data) {
          collectedProfiles.push(data.data);
        }

        // Add delay to respect rate limits
        await this.delay(1000);

      } catch (error) {
        console.error(`   ❌ Collect failed for employee ${employee.id}:`, error.message);
        continue;
      }
    }

    return collectedProfiles;
  }

  async createPeopleAndAssignRoles(company, employees) {
    const peopleCreated = [];

    for (const employee of employees) {
      try {
        // Determine buyer group role
        const buyerGroupRole = this.determineBuyerGroupRole(employee);
        
        // Create person record
        const person = await this.prisma.people.create({
          data: {
            firstName: employee.first_name || 'Unknown',
            lastName: employee.last_name || 'Unknown',
            fullName: `${employee.first_name || 'Unknown'} ${employee.last_name || 'Unknown'}`.trim(),
            jobTitle: employee.title || 'Unknown Title',
            email: employee.email || null,
            linkedinUrl: employee.linkedin_url || null,
            companyId: company.id,
            workspaceId: this.workspaceId,
            buyerGroupRole: buyerGroupRole,
            tags: ['CoreSignal', 'Buyer Group Member', buyerGroupRole, 'Current Employee'],
            customFields: {
              coresignalId: employee.id,
              dataSource: 'CoreSignal',
              lastUpdated: new Date().toISOString()
            }
          }
        });

        peopleCreated.push(person);

      } catch (error) {
        console.error(`   ❌ Failed to create person for ${employee.first_name} ${employee.last_name}:`, error.message);
        continue;
      }
    }

    return peopleCreated;
  }

  async createBuyerGroup(company, people) {
    try {
      if (people.length === 0) {
        return false;
      }

      // Calculate role distribution
      const roleCounts = {
        'Decision Maker': 0,
        'Champion': 0,
        'Blocker': 0,
        'Stakeholder': 0,
        'Introducer': 0
      };

      people.forEach(person => {
        const role = person.buyerGroupRole || 'Stakeholder';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      // Create buyer group members
      const buyerGroupMembers = people.map(person => ({
        personId: person.id,
        influence: this.determineInfluenceLevel(person.buyerGroupRole),
        isPrimary: person.buyerGroupRole === 'Decision Maker'
      }));

      // Create the buyer group
      const buyerGroup = await this.prisma.buyer_groups.create({
        data: {
          workspaceId: this.workspaceId,
          companyId: company.id,
          name: `${company.name} - Buyer Group`,
          description: `Buyer group for ${company.name} with ${people.length} people`,
          purpose: `To facilitate targeted sales and marketing efforts for ${company.name}`,
          status: 'active',
          priority: 'medium',
          people: {
            create: buyerGroupMembers
          },
          customFields: {
            roleDistribution: roleCounts,
            createdBy: 'coresignal_discovery',
            createdAt: new Date().toISOString()
          }
        }
      });

      return true;

    } catch (error) {
      console.error(`   ❌ Failed to create buyer group for ${company.name}:`, error.message);
      return false;
    }
  }

  determineBuyerGroupRole(employee) {
    const title = (employee.title || '').toLowerCase();
    
    // Decision Makers - C-level, VPs, Directors
    if (title.includes('ceo') || title.includes('president') || 
        title.includes('chief') || title.includes('vp') || 
        title.includes('vice president') || title.includes('director') ||
        title.includes('general manager') || title.includes('manager')) {
      return 'Decision Maker';
    }
    
    // Champions - Technical leaders, project managers
    if (title.includes('engineer') || title.includes('technical') ||
        title.includes('project manager') || title.includes('supervisor') ||
        title.includes('lead') || title.includes('senior')) {
      return 'Champion';
    }
    
    // Blockers - Legal, compliance, security, low-level roles
    if (title.includes('legal') || title.includes('compliance') ||
        title.includes('security') || title.includes('audit') ||
        title.includes('assistant') || title.includes('clerk') ||
        title.includes('receptionist') || title.includes('intern')) {
      return 'Blocker';
    }
    
    // Introducers - Business development, marketing, sales
    if (title.includes('business development') || title.includes('marketing') ||
        title.includes('sales') || title.includes('partnership') ||
        title.includes('outreach') || title.includes('communications')) {
      return 'Introducer';
    }
    
    // Default to Stakeholder for everyone else
    return 'Stakeholder';
  }

  determineInfluenceLevel(role) {
    switch (role) {
      case 'Decision Maker': return 'high';
      case 'Champion': return 'high';
      case 'Introducer': return 'medium';
      case 'Stakeholder': return 'medium';
      case 'Blocker': return 'low';
      default: return 'medium';
    }
  }

  extractDomain(website) {
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return null;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateFinalReport() {
    console.log('📋 STEP 3: Generating final report...');
    
    console.log('\n🎉 COMPANIES WITHOUT PEOPLE PROCESSING REPORT');
    console.log('=============================================');
    console.log(`✅ Companies processed: ${this.results.companiesProcessed}`);
    console.log(`✅ Companies successful: ${this.results.companiesSuccessful}`);
    console.log(`❌ Companies failed: ${this.results.companiesFailed}`);
    console.log(`👥 People found: ${this.results.peopleFound}`);
    console.log(`🎯 Buyer groups created: ${this.results.buyerGroupsCreated}`);
    console.log('');
    
    console.log('💰 Credits used:');
    console.log(`   Search: ${this.results.totalCreditsUsed.search}`);
    console.log(`   Collect: ${this.results.totalCreditsUsed.collect}`);
    console.log(`   Enrich: ${this.results.totalCreditsUsed.enrich}`);
    console.log(`   Total: ${this.results.totalCreditsUsed.search + this.results.totalCreditsUsed.collect + this.results.totalCreditsUsed.enrich}`);
    console.log('');

    if (this.results.companiesNotProcessed.length > 0) {
      console.log('⚠️ Companies not processed:');
      this.results.companiesNotProcessed.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} - ${company.reason}`);
      });
      console.log('');
    }

    if (this.results.errors.length > 0) {
      console.log('❌ Errors encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('');
    }

    console.log('🎯 Next steps:');
    console.log('   1. Run additional batches to process remaining companies');
    console.log('   2. Review and validate created buyer groups');
    console.log('   3. Monitor credit usage for future runs');
    console.log('');
    
    console.log('🚀 Companies without people processing complete!');
  }
}

// Execute the processing
async function main() {
  const processor = new ProcessCompaniesWithoutPeople();
  await processor.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ProcessCompaniesWithoutPeople;
