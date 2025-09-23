#!/usr/bin/env node

/**
 * 🔍 PROCESS COMPANIES WITH WEBSITES
 * 
 * Focuses on companies that have websites and uses alternative search methods
 * to find employees and create buyer groups
 */

const { PrismaClient } = require('@prisma/client');

class ProcessCompaniesWithWebsites {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    
    this.creditsUsed = { search: 0, collect: 0, enrich: 0 };
    this.maxCompaniesPerRun = 10;
    
    this.results = {
      companiesProcessed: 0,
      companiesSuccessful: 0,
      companiesFailed: [],
      peopleFound: 0,
      buyerGroupsCreated: 0,
      totalCreditsUsed: this.creditsUsed,
      errors: []
    };
  }

  async execute() {
    console.log('🔍 PROCESSING COMPANIES WITH WEBSITES');
    console.log('====================================\n');

    try {
      const companies = await this.findCompaniesWithWebsites();
      await this.processCompanies(companies);
      this.generateReport();
    } catch (error) {
      console.error('❌ Processing failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findCompaniesWithWebsites() {
    console.log('🔍 STEP 1: Finding companies with websites...');
    
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        people: { none: {} },
        website: { not: null }
      },
      select: { id: true, name: true, website: true },
      take: this.maxCompaniesPerRun
    });

    console.log(`📊 Found ${companies.length} companies with websites (processing first ${this.maxCompaniesPerRun})`);
    console.log('');

    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.website})`);
    });
    console.log('');

    return companies;
  }

  async processCompanies(companies) {
    console.log('🔍 STEP 2: Processing companies with alternative search methods...');
    
    for (const company of companies) {
      try {
        console.log(`\n🏢 Processing ${company.name}...`);
        
        // Try multiple search strategies
        let employees = [];
        
        // Strategy 1: Search by company name
        employees = await this.searchByCompanyName(company.name);
        
        // Strategy 2: If no results, try searching by domain
        if (employees.length === 0 && company.website) {
          const domain = this.extractDomain(company.website);
          if (domain) {
            employees = await this.searchByDomain(domain);
          }
        }
        
        // Strategy 3: If still no results, try alternative company names
        if (employees.length === 0) {
          employees = await this.searchByAlternativeNames(company.name);
        }
        
        if (employees.length === 0) {
          console.log(`   ⚠️ No employees found for ${company.name} with any search method`);
          this.results.companiesFailed.push({
            name: company.name,
            id: company.id,
            reason: 'No employees found with any search method'
          });
          continue;
        }

        console.log(`   👥 Found ${employees.length} employees`);
        
        // Collect employee profiles (limit to control costs)
        const maxProfilesToCollect = Math.min(employees.length, 10);
        const employeesToCollect = employees.slice(0, maxProfilesToCollect);
        
        const collectedEmployees = await this.collectEmployeeProfiles(employeesToCollect);
        
        if (collectedEmployees.length === 0) {
          console.log(`   ⚠️ No employee profiles collected for ${company.name}`);
          this.results.companiesFailed.push({
            name: company.name,
            id: company.id,
            reason: 'No employee profiles collected'
          });
          continue;
        }

        // Create people records and assign buyer group roles
        const peopleCreated = await this.createPeopleAndAssignRoles(company, collectedEmployees);
        
        // Create buyer group
        const buyerGroupCreated = await this.createBuyerGroup(company, peopleCreated);
        
        this.results.companiesProcessed++;
        this.results.companiesSuccessful++;
        this.results.peopleFound += peopleCreated.length;
        this.results.buyerGroupsCreated += buyerGroupCreated ? 1 : 0;
        
        console.log(`   ✅ Successfully processed ${company.name}: ${peopleCreated.length} people, buyer group created`);
        
        // Add delay to respect rate limits
        await this.delay(3000);

      } catch (error) {
        console.error(`   ❌ Failed to process ${company.name}:`, error.message);
        this.results.companiesFailed.push({
          name: company.name,
          id: company.id,
          reason: `Processing failed: ${error.message}`
        });
        this.results.errors.push(`Company ${company.name}: ${error.message}`);
      }
    }
  }

  async searchByCompanyName(companyName) {
    try {
      const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/employee/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.coresignalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: companyName,
          limit: 30
        })
      });

      if (!response.ok) {
        throw new Error(`CoreSignal search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.creditsUsed.search++;
      
      return data.data || [];
    } catch (error) {
      console.error(`   ❌ Search by company name failed:`, error.message);
      return [];
    }
  }

  async searchByDomain(domain) {
    try {
      const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/employee/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.coresignalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_domain: domain,
          limit: 30
        })
      });

      if (!response.ok) {
        throw new Error(`CoreSignal search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.creditsUsed.search++;
      
      return data.data || [];
    } catch (error) {
      console.error(`   ❌ Search by domain failed:`, error.message);
      return [];
    }
  }

  async searchByAlternativeNames(companyName) {
    // Try common variations of company names
    const variations = [
      companyName,
      companyName.replace(/Inc\.?$/, ''),
      companyName.replace(/LLC$/, ''),
      companyName.replace(/Corp\.?$/, ''),
      companyName.replace(/Company$/, ''),
      companyName.replace(/Co\.?$/, ''),
      companyName.replace(/Ltd\.?$/, ''),
      companyName.replace(/Limited$/, '')
    ].filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates

    for (const variation of variations) {
      if (variation !== companyName) {
        console.log(`   🔍 Trying alternative name: ${variation}`);
        const employees = await this.searchByCompanyName(variation);
        if (employees.length > 0) {
          return employees;
        }
      }
    }
    
    return [];
  }

  async collectEmployeeProfiles(employees) {
    const collectedProfiles = [];

    for (const employee of employees) {
      try {
        const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/employee/collect', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.coresignalApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: employee.id
          })
        });

        if (!response.ok) {
          throw new Error(`CoreSignal collect failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        this.creditsUsed.collect++;

        if (data.data) {
          collectedProfiles.push(data.data);
        }

        // Add delay to respect rate limits
        await this.delay(1500);

      } catch (error) {
        console.error(`   ❌ CoreSignal collect failed for employee ${employee.id}:`, error.message);
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
              dataSource: 'CoreSignal Alternative Search',
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
          description: `Buyer group for ${company.name} with ${people.length} people (Alternative Search)`,
          purpose: `To facilitate targeted sales and marketing efforts for ${company.name}`,
          status: 'active',
          priority: 'medium',
          people: {
            create: buyerGroupMembers
          },
          customFields: {
            roleDistribution: roleCounts,
            createdBy: 'alternative_search_discovery',
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

  generateReport() {
    console.log('\n🎉 COMPANIES WITH WEBSITES PROCESSING REPORT');
    console.log('============================================');
    console.log(`✅ Companies processed: ${this.results.companiesProcessed}`);
    console.log(`✅ Companies successful: ${this.results.companiesSuccessful}`);
    console.log(`❌ Companies failed: ${this.results.companiesFailed.length}`);
    console.log(`👥 People found: ${this.results.peopleFound}`);
    console.log(`🎯 Buyer groups created: ${this.results.buyerGroupsCreated}`);
    console.log('\n💰 Credits used:');
    console.log(`   Search: ${this.creditsUsed.search}`);
    console.log(`   Collect: ${this.creditsUsed.collect}`);
    console.log(`   Enrich: ${this.creditsUsed.enrich}`);
    console.log(`   Total: ${this.creditsUsed.search + this.creditsUsed.collect + this.creditsUsed.enrich}`);

    if (this.results.companiesFailed.length > 0) {
      console.log('\n⚠️ Companies not processed:');
      this.results.companiesFailed.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} - ${company.reason}`);
      });
    }

    console.log('\n🎯 Next steps:');
    console.log('   1. Run additional batches to process remaining companies');
    console.log('   2. Review and validate created buyer groups');
    console.log('   3. Monitor credit usage for future runs');
    console.log('\n🚀 Companies with websites processing complete!');
  }
}

if (require.main === module) {
  const processor = new ProcessCompaniesWithWebsites();
  processor.execute().catch(console.error);
}

module.exports = ProcessCompaniesWithWebsites;
