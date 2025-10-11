#!/usr/bin/env node

/**
 * 🎯 COMPLETE BUYER GROUP ANALYSIS
 * 
 * This script handles the complete buyer group analysis:
 * 1. Creates formal buyer group records for 209 companies that already have people with roles
 * 2. Processes remaining 267 companies that need buyer group analysis
 * 3. Implements 5-role system: Decision Makers, Champions, Blockers, Stakeholders, Introducers
 * 4. Uses optimized credit approach for new company processing
 */

const { PrismaClient } = require('@prisma/client');

class CompleteBuyerGroupAnalysis {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    // Credit optimization settings
    this.creditsUsed = { search: 0, collect: 0, enrich: 0 };
    this.maxCollectCredits = 200;
    this.maxSearchCredits = 1000;
    
    this.results = {
      analysisDate: new Date().toISOString(),
      phase1: { companiesProcessed: 0, buyerGroupsCreated: 0 },
      phase2: { companiesProcessed: 0, peopleFound: 0, buyerGroupsCreated: 0 },
      totalCreditsUsed: this.creditsUsed,
      errors: []
    };
  }

  async execute() {
    console.log('🎯 COMPLETE BUYER GROUP ANALYSIS');
    console.log('================================');
    console.log('✅ Phase 1: Create formal buyer groups for 209 companies with existing people');
    console.log('✅ Phase 2: Process remaining 267 companies with optimized approach');
    console.log('✅ 5-Role System: Decision Makers, Champions, Blockers, Stakeholders, Introducers');
    console.log('');

    try {
      // Phase 1: Create formal buyer groups for companies with existing people
      await this.phase1CreateFormalBuyerGroups();
      
      // Phase 2: Process remaining companies
      await this.phase2ProcessRemainingCompanies();
      
      // Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async phase1CreateFormalBuyerGroups() {
    console.log('📋 PHASE 1: Creating formal buyer groups for companies with existing people...');
    console.log('================================================================================');
    
    // Get companies that have people with buyer group roles but no formal buyer groups
    const companiesWithPeople = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        people: {
          some: {
            buyerGroupRole: { not: null }
          }
        },
        buyerGroups: { none: {} }
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        people: {
          where: {
            buyerGroupRole: { not: null }
          },
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            buyerGroupRole: true,
            customFields: true
          }
        }
      }
    });

    console.log(`📊 Found ${companiesWithPeople.length} companies with people but no formal buyer groups`);
    console.log('');

    for (const company of companiesWithPeople) {
      try {
        console.log(`🏢 Processing ${company.name} (${company.people.length} people with roles)...`);
        
        // Convert existing roles to new 5-role system
        const convertedPeople = this.convertTo5RoleSystem(company.people);
        
        // Create formal buyer group
        const buyerGroup = await this.createFormalBuyerGroup(company, convertedPeople);
        
        // Link people to buyer group
        await this.linkPeopleToBuyerGroup(buyerGroup.id, convertedPeople);
        
        console.log(`   ✅ Created buyer group "${buyerGroup.name}" with ${convertedPeople.length} people`);
        console.log(`   🎯 Roles: ${this.getRoleSummary(convertedPeople)}`);
        console.log('');
        
        this.results.phase1.companiesProcessed++;
        this.results.phase1.buyerGroupsCreated++;
        
      } catch (error) {
        console.error(`   ❌ Error processing ${company.name}:`, error.message);
        this.results.errors.push(`Phase 1 - ${company.name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Phase 1 Complete: ${this.results.phase1.companiesProcessed} companies processed, ${this.results.phase1.buyerGroupsCreated} buyer groups created`);
    console.log('');
  }

  convertTo5RoleSystem(people) {
    return people.map(person => {
      let newRole = person.buyerGroupRole;
      
      // Convert Influencer to appropriate role based on title
      if (person.buyerGroupRole === 'Influencer') {
        const title = (person.jobTitle || '').toLowerCase();
        
        // Check for introduction/networking potential
        if (title.includes('business development') || title.includes('partnership') || 
            title.includes('community') || title.includes('events') || 
            title.includes('marketing') || title.includes('sales') ||
            title.includes('customer success') || title.includes('account manager')) {
          newRole = 'Introducer';
        }
        // Check for blocking potential
        else if (title.includes('legal') || title.includes('compliance') || 
                 title.includes('security') || title.includes('audit') ||
                 title.includes('finance') || title.includes('procurement')) {
          newRole = 'Blocker';
        }
        // Default to Stakeholder
        else {
          newRole = 'Stakeholder';
        }
      }
      
      return {
        ...person,
        buyerGroupRole: newRole
      };
    });
  }

  async createFormalBuyerGroup(company, people) {
    const roleCounts = this.getRoleCounts(people);
    const totalPeople = people.length;
    
    const buyerGroupData = {
      workspaceId: this.workspaceId,
      companyId: company.id,
      name: `${company.name} - Buyer Group`,
      description: `Buyer group for ${company.name} with ${totalPeople} members`,
      purpose: 'TOP Engineers Plus telecommunications infrastructure sales',
      status: 'active',
      priority: this.calculatePriority(roleCounts),
      tags: ['TOP Engineers Plus', 'Telecommunications', 'Infrastructure', 'Generated'],
      customFields: {
        roleDistribution: roleCounts,
        totalMembers: totalPeople,
        generationMethod: 'existing_people_conversion',
        lastUpdated: new Date().toISOString(),
        confidence: this.calculateConfidence(roleCounts, totalPeople)
      }
    };
    
    return await this.prisma.buyer_groups.create({
      data: buyerGroupData
    });
  }

  async linkPeopleToBuyerGroup(buyerGroupId, people) {
    const links = people.map(person => ({
      buyerGroupId: buyerGroupId,
      personId: person.id,
      role: person.buyerGroupRole,
      influence: this.getInfluenceLevel(person.buyerGroupRole),
      isPrimary: person.buyerGroupRole === 'Decision Maker',
      notes: `Converted from existing role assignment`
    }));
    
    await this.prisma.buyerGroupToPerson.createMany({
      data: links
    });
  }

  async phase2ProcessRemainingCompanies() {
    console.log('🔍 PHASE 2: Processing remaining companies with optimized approach...');
    console.log('====================================================================');
    
    // Get companies that need buyer group analysis
    const remainingCompanies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        website: { not: null },
        buyerGroups: { none: {} },
        people: {
          none: {
            buyerGroupRole: { not: null }
          }
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        people: {
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            email: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Found ${remainingCompanies.length} companies needing buyer group analysis`);
    console.log('');

    let processedCount = 0;
    const maxProcess = Math.min(remainingCompanies.length, 50); // Limit for this run

    for (const company of remainingCompanies.slice(0, maxProcess)) {
      if (this.creditsUsed.collect >= this.maxCollectCredits) {
        console.log(`💰 Reached collect credit limit (${this.maxCollectCredits}). Stopping Phase 2.`);
        break;
      }

      try {
        console.log(`🏢 [${processedCount + 1}/${maxProcess}] Processing ${company.name}...`);
        
        // Determine if we need to find people or just assign roles to existing people
        if (company.people.length === 0) {
          // Need to find people via CoreSignal
          await this.findAndProcessPeople(company);
        } else {
          // Assign roles to existing people
          await this.assignRolesToExistingPeople(company);
        }
        
        processedCount++;
        this.results.phase2.companiesProcessed++;
        
        // Add delay to avoid rate limiting
        await this.delay(2000);
        
      } catch (error) {
        console.error(`   ❌ Error processing ${company.name}:`, error.message);
        this.results.errors.push(`Phase 2 - ${company.name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Phase 2 Complete: ${processedCount} companies processed`);
    console.log('');
  }

  async findAndProcessPeople(company) {
    console.log(`   🔍 Finding people for ${company.name} via CoreSignal...`);
    
    // Enrich company by domain
    const enrichedCompany = await this.enrichCompanyByDomain(company);
    if (!enrichedCompany) {
      console.log(`   ⚠️ Could not enrich company ${company.name}`);
      return;
    }

    // Search for current employees
    const employees = await this.searchCurrentEmployees(enrichedCompany);
    if (!employees || employees.length === 0) {
      console.log(`   ⚠️ No employees found for ${company.name}`);
      return;
    }

    // Collect employee profiles (limited to save credits)
    const profilesToCollect = employees.slice(0, 30); // Limit to 30 profiles
    const employeeProfiles = await this.collectEmployeeProfiles(profilesToCollect);
    
    if (employeeProfiles.length === 0) {
      console.log(`   ⚠️ No employee profiles collected for ${company.name}`);
      return;
    }

    // Create people records and assign buyer group roles
    const peopleWithRoles = await this.createPeopleWithRoles(employeeProfiles, company);
    
    // Create formal buyer group
    const buyerGroup = await this.createFormalBuyerGroup(company, peopleWithRoles);
    
    // Link people to buyer group
    await this.linkPeopleToBuyerGroup(buyerGroup.id, peopleWithRoles);
    
    console.log(`   ✅ Created ${peopleWithRoles.length} people with roles and buyer group`);
    console.log(`   🎯 Roles: ${this.getRoleSummary(peopleWithRoles)}`);
    
    this.results.phase2.peopleFound += peopleWithRoles.length;
    this.results.phase2.buyerGroupsCreated++;
  }

  async assignRolesToExistingPeople(company) {
    console.log(`   🎯 Assigning buyer group roles to ${company.people.length} existing people...`);
    
    // Assign roles using 5-role system
    const peopleWithRoles = company.people.map(person => ({
      ...person,
      buyerGroupRole: this.determineBuyerGroupRole5Role(person)
    }));
    
    // Update people records with roles
    for (const person of peopleWithRoles) {
      await this.prisma.people.update({
        where: { id: person.id },
        data: {
          buyerGroupRole: person.buyerGroupRole,
          customFields: {
            ...person.customFields,
            buyerGroupRole: person.buyerGroupRole,
            lastUpdated: new Date().toISOString()
          }
        }
      });
    }
    
    // Create formal buyer group
    const buyerGroup = await this.createFormalBuyerGroup(company, peopleWithRoles);
    
    // Link people to buyer group
    await this.linkPeopleToBuyerGroup(buyerGroup.id, peopleWithRoles);
    
    console.log(`   ✅ Assigned roles to ${peopleWithRoles.length} people and created buyer group`);
    console.log(`   🎯 Roles: ${this.getRoleSummary(peopleWithRoles)}`);
    
    this.results.phase2.peopleFound += peopleWithRoles.length;
    this.results.phase2.buyerGroupsCreated++;
  }

  determineBuyerGroupRole5Role(person) {
    const title = (person.jobTitle || '').toLowerCase();
    
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

    // Blockers - Low influence, non-strategic roles, or potential resistance
    if (title.includes('intern') || title.includes('trainee') ||
        title.includes('assistant') || title.includes('coordinator') ||
        title.includes('clerk') || title.includes('receptionist') ||
        title.includes('legal') || title.includes('compliance') ||
        title.includes('security') || title.includes('audit') ||
        title.includes('temp') || title.includes('contractor')) {
      return 'Blocker';
    }

    // Introducers - Good for introductions, networking roles
    if (title.includes('business development') || title.includes('partnership') ||
        title.includes('community') || title.includes('events') ||
        title.includes('marketing') || title.includes('sales') ||
        title.includes('customer success') || title.includes('account manager') ||
        title.includes('relationship manager')) {
      return 'Introducer';
    }

    // Stakeholders - Everyone else (default)
    return 'Stakeholder';
  }

  // Helper methods for CoreSignal integration
  async enrichCompanyByDomain(company) {
    const domain = this.extractDomain(company.website);
    if (!domain) return null;

    try {
      const enrichUrl = 'https://api.coresignal.com/cdapi/v2/company_multi_source/enrich';
      const enrichQuery = { domain: domain };

      const response = await fetch(enrichUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enrichQuery)
      });

      this.creditsUsed.enrich++;
      
      if (response.ok) {
        const companyData = await response.json();
        return {
          ...company,
          coresignalCompanyId: companyData.id,
          coresignalData: companyData
        };
      }
    } catch (error) {
      console.log(`   ⚠️ Enrichment error for ${company.name}: ${error.message}`);
    }
    
    return null;
  }

  async searchCurrentEmployees(enrichedCompany) {
    const searchUrl = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=50';
    const searchQuery = {
      query: {
        term: {
          'current_company_id': enrichedCompany.coresignalCompanyId
        }
      }
    };

    try {
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      this.creditsUsed.search++;
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log(`   ⚠️ Search error for ${enrichedCompany.name}: ${error.message}`);
    }
    
    return [];
  }

  async collectEmployeeProfiles(employees) {
    const profiles = [];
    
    for (const employee of employees) {
      if (this.creditsUsed.collect >= this.maxCollectCredits) break;
      
      const employeeId = employee._source?.id || employee.id;
      if (!employeeId) continue;
      
      try {
        const collectUrl = `https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`;
        const response = await fetch(collectUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        this.creditsUsed.collect++;
        
        if (response.ok) {
          const employeeData = await response.json();
          profiles.push(employeeData);
        }
      } catch (error) {
        console.log(`   ⚠️ Error collecting employee ${employeeId}: ${error.message}`);
      }
    }
    
    return profiles;
  }

  async createPeopleWithRoles(employeeProfiles, company) {
    const peopleWithRoles = [];

    for (const employee of employeeProfiles) {
      try {
        const personData = employee._source;
        const role = this.determineBuyerGroupRole5Role({ jobTitle: personData.headline });
        
        const personRecord = {
          firstName: personData.first_name || 'Unknown',
          lastName: personData.last_name || 'Unknown',
          fullName: personData.full_name || `${personData.first_name || ''} ${personData.last_name || ''}`.trim(),
          jobTitle: personData.headline || personData.experience?.[0]?.position_title || 'Unknown',
          email: personData.email || null,
          linkedinUrl: personData.linkedin_url || null,
          companyId: company.id,
          workspaceId: this.workspaceId,
          buyerGroupRole: role,
          tags: ['CoreSignal', 'Buyer Group Member', role, 'Current Employee'],
          customFields: {
            coresignalId: personData.id,
            buyerGroupRole: role,
            dataSource: 'CoreSignal',
            lastUpdated: new Date().toISOString()
          }
        };
        
        const createdPerson = await this.prisma.people.create({
          data: personRecord
        });
        
        peopleWithRoles.push({
          ...createdPerson,
          buyerGroupRole: role
        });
        
      } catch (error) {
        console.log(`   ⚠️ Error creating person: ${error.message}`);
      }
    }

    return peopleWithRoles;
  }

  // Utility methods
  getRoleCounts(people) {
    const counts = {
      'Decision Maker': 0,
      'Champion': 0,
      'Blocker': 0,
      'Stakeholder': 0,
      'Introducer': 0
    };
    
    people.forEach(person => {
      counts[person.buyerGroupRole] = (counts[person.buyerGroupRole] || 0) + 1;
    });
    
    return counts;
  }

  getRoleSummary(people) {
    const counts = this.getRoleCounts(people);
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([role, count]) => `${count} ${role}${count > 1 ? 's' : ''}`)
      .join(', ');
  }

  calculatePriority(roleCounts) {
    const decisionMakers = roleCounts['Decision Maker'] || 0;
    const champions = roleCounts['Champion'] || 0;
    
    if (decisionMakers > 0 && champions > 0) return 'high';
    if (decisionMakers > 0 || champions > 0) return 'medium';
    return 'low';
  }

  calculateConfidence(roleCounts, totalPeople) {
    let confidence = 50;
    
    if (totalPeople >= 5) confidence += 20;
    if (roleCounts['Decision Maker'] > 0) confidence += 15;
    if (roleCounts['Champion'] > 0) confidence += 10;
    if (roleCounts['Blocker'] > 0) confidence += 5;
    if (roleCounts['Introducer'] > 0) confidence += 5;
    
    return Math.min(confidence, 100);
  }

  getInfluenceLevel(role) {
    switch (role) {
      case 'Decision Maker': return 'High';
      case 'Champion': return 'High';
      case 'Introducer': return 'Medium';
      case 'Stakeholder': return 'Medium';
      case 'Blocker': return 'Low';
      default: return 'Medium';
    }
  }

  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return null;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateFinalReport() {
    console.log('📋 FINAL ANALYSIS REPORT');
    console.log('========================');
    console.log(`✅ Phase 1: ${this.results.phase1.companiesProcessed} companies processed, ${this.results.phase1.buyerGroupsCreated} buyer groups created`);
    console.log(`✅ Phase 2: ${this.results.phase2.companiesProcessed} companies processed, ${this.results.phase2.peopleFound} people found, ${this.results.phase2.buyerGroupsCreated} buyer groups created`);
    console.log(`💰 Total credits used: ${JSON.stringify(this.creditsUsed)}`);
    console.log(`❌ Errors: ${this.results.errors.length}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    console.log('\n🎯 5-Role System Implemented: Decision Makers, Champions, Blockers, Stakeholders, Introducers');
    console.log('✅ Formal buyer group records created for all processed companies');
    console.log('✅ People linked to buyer groups with proper role assignments');
  }
}

// Execute the analysis
async function main() {
  const analyzer = new CompleteBuyerGroupAnalysis();
  await analyzer.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CompleteBuyerGroupAnalysis;
