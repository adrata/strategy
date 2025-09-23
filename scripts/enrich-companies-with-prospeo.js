#!/usr/bin/env node

/**
 * 🔍 ENRICH COMPANIES WITH PROSPEO
 * 
 * This script uses Prospeo to validate and enrich websites for companies without people:
 * 1. Validates company websites using Prospeo
 * 2. Enriches company data with Prospeo
 * 3. Uses CoreSignal to find employees for validated companies
 * 4. Creates people records and buyer groups
 * 5. Implements credit optimizations
 */

const { PrismaClient } = require('@prisma/client');

class EnrichCompaniesWithProspeo {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus workspace
    this.prospeoApiKey = process.env.PROSPEO_API_KEY;
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    
    if (!this.prospeoApiKey) {
      throw new Error('PROSPEO_API_KEY environment variable is required');
    }
    
    if (!this.coresignalApiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    // Credit optimization settings
    this.creditsUsed = { prospeo: 0, coresignal: { search: 0, collect: 0, enrich: 0 } };
    this.maxProspeoCredits = 100; // Limit Prospeo usage
    this.maxCoresignalCredits = 500; // Limit CoreSignal usage
    this.maxCompaniesPerRun = 15; // Process in small batches
    
    this.results = {
      analysisDate: new Date().toISOString(),
      companiesProcessed: 0,
      companiesValidated: 0,
      companiesEnriched: 0,
      peopleFound: 0,
      buyerGroupsCreated: 0,
      totalCreditsUsed: this.creditsUsed,
      companiesNotProcessed: [],
      errors: []
    };
  }

  async execute() {
    console.log('🔍 ENRICHING COMPANIES WITH PROSPEO');
    console.log('===================================');
    console.log('');

    try {
      // Step 1: Find companies without people
      await this.findCompaniesWithoutPeople();
      
      // Step 2: Validate and enrich companies with Prospeo
      await this.validateAndEnrichWithProspeo();
      
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

    // Show companies with websites first (priority for Prospeo)
    const companiesWithWebsites = companiesWithoutPeople.filter(c => c.website && c.website.trim() !== '');
    const companiesWithoutWebsites = companiesWithoutPeople.filter(c => !c.website || c.website.trim() === '');
    
    console.log(`   🌐 Companies with websites: ${companiesWithWebsites.length}`);
    console.log(`   ❌ Companies without websites: ${companiesWithoutWebsites.length}`);
    console.log('');

    // Show first 20 companies with websites
    if (companiesWithWebsites.length > 0) {
      console.log('📋 Companies with websites (first 20):');
      companiesWithWebsites.slice(0, 20).forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} (${company.website})`);
      });
      
      if (companiesWithWebsites.length > 20) {
        console.log(`   ... and ${companiesWithWebsites.length - 20} more`);
      }
      console.log('');
    }

    return { companiesWithWebsites, companiesWithoutWebsites };
  }

  async validateAndEnrichWithProspeo() {
    console.log('🔍 STEP 2: Validating and enriching companies with Prospeo...');
    
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

    // Focus on companies with websites first
    const companiesWithWebsites = companiesWithoutPeople.filter(c => c.website && c.website.trim() !== '');
    const companiesToProcess = companiesWithWebsites.slice(0, this.maxCompaniesPerRun);
    
    console.log(`   📊 Processing ${companiesToProcess.length} companies with websites`);
    console.log('');

    for (const company of companiesToProcess) {
      try {
        console.log(`🏢 Processing ${company.name}...`);
        
        // Check if we've hit our credit limits
        if (this.creditsUsed.prospeo >= this.maxProspeoCredits) {
          console.log(`   💰 Reached Prospeo credit limit (${this.maxProspeoCredits}). Stopping processing.`);
          this.results.companiesNotProcessed.push({
            name: company.name,
            id: company.id,
            reason: 'Prospeo credit limit reached'
          });
          break;
        }

        if (this.creditsUsed.coresignal.search + this.creditsUsed.coresignal.collect + this.creditsUsed.coresignal.enrich >= this.maxCoresignalCredits) {
          console.log(`   💰 Reached CoreSignal credit limit (${this.maxCoresignalCredits}). Stopping processing.`);
          this.results.companiesNotProcessed.push({
            name: company.name,
            id: company.id,
            reason: 'CoreSignal credit limit reached'
          });
          break;
        }

        // Step 2a: Validate website with Prospeo
        const prospeoData = await this.validateWebsiteWithProspeo(company);
        
        if (!prospeoData) {
          console.log(`   ⚠️ Could not validate website for ${company.name}`);
          this.results.companiesNotProcessed.push({
            name: company.name,
            id: company.id,
            reason: 'Website validation failed with Prospeo'
          });
          continue;
        }

        this.results.companiesValidated++;

        // Step 2b: Enrich company data with Prospeo
        const enrichedData = await this.enrichCompanyWithProspeo(company, prospeoData);
        
        if (enrichedData) {
          this.results.companiesEnriched++;
          
          // Update company record with enriched data
          await this.updateCompanyWithEnrichedData(company, enrichedData);
        }

        // Step 2c: Search for employees with CoreSignal
        const employees = await this.searchForEmployeesWithCoreSignal(company);
        
        if (!employees || employees.length === 0) {
          console.log(`   ⚠️ No employees found for ${company.name}`);
          this.results.companiesNotProcessed.push({
            name: company.name,
            id: company.id,
            reason: 'No employees found via CoreSignal search'
          });
          continue;
        }

        // Step 2d: Collect employee profiles (limited to control costs)
        const maxProfilesToCollect = Math.min(employees.length, 15); // Limit to 15 profiles per company
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
          continue;
        }

        // Step 2e: Create people records and assign buyer group roles
        const peopleCreated = await this.createPeopleAndAssignRoles(company, collectedEmployees);
        
        // Step 2f: Create buyer group
        const buyerGroupCreated = await this.createBuyerGroup(company, peopleCreated);
        
        this.results.companiesProcessed++;
        this.results.peopleFound += peopleCreated.length;
        this.results.buyerGroupsCreated += buyerGroupCreated ? 1 : 0;
        
        console.log(`   ✅ Successfully processed ${company.name}: ${peopleCreated.length} people, buyer group created`);
        
        // Add delay to respect rate limits
        await this.delay(3000);

      } catch (error) {
        console.error(`   ❌ Failed to process ${company.name}:`, error.message);
        this.results.companiesNotProcessed.push({
          name: company.name,
          id: company.id,
          reason: `Processing failed: ${error.message}`
        });
        this.results.errors.push(`Company ${company.name}: ${error.message}`);
      }
    }

    console.log('');
  }

  async validateWebsiteWithProspeo(company) {
    try {
      const domain = this.extractDomain(company.website);
      if (!domain) {
        return null;
      }

      // Call Prospeo domain validation endpoint
      const response = await fetch('https://api.prospeo.io/v1/domain/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.prospeoApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: domain
        })
      });

      if (!response.ok) {
        throw new Error(`Prospeo validation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.creditsUsed.prospeo++;

      return data;
    } catch (error) {
      console.error(`   ❌ Prospeo validation failed for ${company.name}:`, error.message);
      return null;
    }
  }

  async enrichCompanyWithProspeo(company, prospeoData) {
    try {
      const domain = this.extractDomain(company.website);
      if (!domain) {
        return null;
      }

      // Call Prospeo company enrichment endpoint
      const response = await fetch('https://api.prospeo.io/v1/company/enrich', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.prospeoApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: domain,
          company_name: company.name
        })
      });

      if (!response.ok) {
        throw new Error(`Prospeo enrichment failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.creditsUsed.prospeo++;

      return data;
    } catch (error) {
      console.error(`   ❌ Prospeo enrichment failed for ${company.name}:`, error.message);
      return null;
    }
  }

  async updateCompanyWithEnrichedData(company, enrichedData) {
    try {
      const updateData = {};
      
      if (enrichedData.industry && !company.industry) {
        updateData.industry = enrichedData.industry;
      }
      
      if (enrichedData.description) {
        updateData.description = enrichedData.description;
      }
      
      if (enrichedData.employee_count) {
        updateData.employeeCount = enrichedData.employee_count;
      }
      
      if (enrichedData.founded_year) {
        updateData.foundedYear = enrichedData.founded_year;
      }
      
      if (enrichedData.location) {
        updateData.location = enrichedData.location;
      }
      
      if (Object.keys(updateData).length > 0) {
        updateData.customFields = {
          ...company.customFields,
          prospeoEnriched: true,
          prospeoEnrichedAt: new Date().toISOString(),
          prospeoData: enrichedData
        };
        
        await this.prisma.companies.update({
          where: { id: company.id },
          data: updateData
        });
        
        console.log(`   ✅ Updated company data for ${company.name}`);
      }
    } catch (error) {
      console.error(`   ❌ Failed to update company data for ${company.name}:`, error.message);
    }
  }

  async searchForEmployeesWithCoreSignal(company) {
    try {
      // Search for employees using company name
      const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/employee/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.coresignalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: company.name,
          limit: 30 // Limit to control costs
        })
      });

      if (!response.ok) {
        throw new Error(`CoreSignal search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.creditsUsed.coresignal.search++;

      return data.data || [];
    } catch (error) {
      console.error(`   ❌ CoreSignal search failed for ${company.name}:`, error.message);
      return [];
    }
  }

  async collectEmployeeProfiles(employees) {
    const collectedProfiles = [];

    for (const employee of employees) {
      try {
        // Check if we've hit our collect credit limit
        if (this.creditsUsed.coresignal.collect >= this.maxCoresignalCredits) {
          console.log(`   💰 Reached CoreSignal collect credit limit. Stopping collection.`);
          break;
        }

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
        this.creditsUsed.coresignal.collect++;

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
            tags: ['CoreSignal', 'Prospeo', 'Buyer Group Member', buyerGroupRole, 'Current Employee'],
            customFields: {
              coresignalId: employee.id,
              dataSource: 'CoreSignal + Prospeo',
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
          description: `Buyer group for ${company.name} with ${people.length} people (Prospeo + CoreSignal)`,
          purpose: `To facilitate targeted sales and marketing efforts for ${company.name}`,
          status: 'active',
          priority: 'medium',
          people: {
            create: buyerGroupMembers
          },
          customFields: {
            roleDistribution: roleCounts,
            createdBy: 'prospeo_coresignal_discovery',
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
    
    console.log('\n🎉 PROSPEO + CORESIGNAL ENRICHMENT REPORT');
    console.log('=========================================');
    console.log(`✅ Companies processed: ${this.results.companiesProcessed}`);
    console.log(`✅ Companies validated: ${this.results.companiesValidated}`);
    console.log(`✅ Companies enriched: ${this.results.companiesEnriched}`);
    console.log(`👥 People found: ${this.results.peopleFound}`);
    console.log(`🎯 Buyer groups created: ${this.results.buyerGroupsCreated}`);
    console.log('');
    
    console.log('💰 Credits used:');
    console.log(`   Prospeo: ${this.results.totalCreditsUsed.prospeo}`);
    console.log(`   CoreSignal Search: ${this.results.totalCreditsUsed.coresignal.search}`);
    console.log(`   CoreSignal Collect: ${this.results.totalCreditsUsed.coresignal.collect}`);
    console.log(`   CoreSignal Enrich: ${this.results.totalCreditsUsed.coresignal.enrich}`);
    console.log(`   Total: ${this.results.totalCreditsUsed.prospeo + this.results.totalCreditsUsed.coresignal.search + this.results.totalCreditsUsed.coresignal.collect + this.results.totalCreditsUsed.coresignal.enrich}`);
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
    
    console.log('🚀 Prospeo + CoreSignal enrichment complete!');
  }
}

// Execute the enrichment
async function main() {
  const enricher = new EnrichCompaniesWithProspeo();
  await enricher.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnrichCompaniesWithProspeo;
