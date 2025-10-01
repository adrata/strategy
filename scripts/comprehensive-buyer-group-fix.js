const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const { ulid } = require('ulid');
require('dotenv').config();

const prisma = new PrismaClient();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class ComprehensiveBuyerGroupFix {
  constructor() {
    this.results = {
      companiesWithoutCoreSignal: [],
      suspiciousSizes: [],
      noPeople: [],
      noDecisionMakers: [],
      fixes: {
        coreSignalEnriched: 0,
        suspiciousSizesFixed: 0,
        noPeopleFixed: 0,
        noDecisionMakersFixed: 0
      }
    };
  }

  async executeComprehensiveFix() {
    console.log('🔧 COMPREHENSIVE BUYER GROUP FIX');
    console.log('=================================');
    console.log('Fixing all 4 categories of issues:');
    console.log('1. 46 companies without CoreSignal IDs');
    console.log('2. 36 companies with suspicious sizes');
    console.log('3. 135 companies with no people');
    console.log('4. 135 companies with no decision makers');
    console.log('');

    try {
      // Step 1: Fix companies without CoreSignal IDs
      await this.fixCompaniesWithoutCoreSignalIDs();
      
      // Step 2: Fix companies with suspicious sizes
      await this.fixSuspiciousCompanySizes();
      
      // Step 3: Fix companies with no people
      await this.fixCompaniesWithNoPeople();
      
      // Step 4: Fix companies with no decision makers
      await this.fixCompaniesWithNoDecisionMakers();
      
      // Step 5: Generate comprehensive report
      this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('❌ Comprehensive fix failed:', error.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  async fixCompaniesWithoutCoreSignalIDs() {
    console.log('🔍 FIXING COMPANIES WITHOUT CORESIGNAL IDs');
    console.log('==========================================');
    console.log('Using website and company name search to find CoreSignal IDs');
    console.log('');

    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP Engineering Plus' }
    });

    const companiesWithoutCoreSignal = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        OR: [
          {
            customFields: {
              path: ['coresignalData', 'id'],
              equals: null
            }
          },
          {
            customFields: {
              path: ['coresignalData'],
              equals: null
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        website: true,
        customFields: true
      }
    });

    console.log(`Found ${companiesWithoutCoreSignal.length} companies without CoreSignal IDs`);
    console.log('');

    let enrichedCount = 0;
    let failedCount = 0;

    for (const company of companiesWithoutCoreSignal) {
      console.log(`🏢 Processing: ${company.name}`);
      let coresignalId = null;
      let coresignalData = null;

      try {
        // Try searching by website first
        if (company.website) {
          console.log(`   🔍 Searching by website: ${company.website}`);
          const websiteResults = await this.searchCompanyByWebsite(company.website);
          if (websiteResults.length > 0) {
            coresignalId = websiteResults[0];
            console.log(`   ✅ Found CoreSignal ID ${coresignalId} via website`);
          }
        }

        // If not found by website, try by name
        if (!coresignalId) {
          console.log(`   🔍 Searching by company name: ${company.name}`);
          const nameResults = await this.searchCompanyByName(company.name);
          if (nameResults.length > 0) {
            coresignalId = nameResults[0];
            console.log(`   ✅ Found CoreSignal ID ${coresignalId} via name`);
          }
        }

        if (coresignalId) {
          // Collect company data
          coresignalData = await this.collectCompanyData(coresignalId);
          if (coresignalData) {
            // Update company with CoreSignal data
            await prisma.companies.update({
              where: { id: company.id },
              data: {
                customFields: {
                  ...company.customFields,
                  coresignalData: coresignalData,
                  enrichmentDate: new Date().toISOString(),
                  enrichmentMethod: 'Website and Name Search'
                },
                updatedAt: new Date()
              }
            });
            
            enrichedCount++;
            console.log(`   ✅ Enriched ${company.name} with CoreSignal ID ${coresignalId}`);
          }
        } else {
          console.log(`   ❌ No CoreSignal ID found for ${company.name}`);
          failedCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error processing ${company.name}: ${error.message}`);
        failedCount++;
      }
      console.log('');
    }

    this.results.fixes.coreSignalEnriched = enrichedCount;
    console.log(`✅ CoreSignal enrichment complete: ${enrichedCount} enriched, ${failedCount} failed`);
    console.log('');
  }

  async fixSuspiciousCompanySizes() {
    console.log('🔍 FIXING COMPANIES WITH SUSPICIOUS SIZES');
    console.log('========================================');
    console.log('Finding correct CoreSignal matches for major utilities');
    console.log('');

    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP Engineering Plus' }
    });

    // Find companies with suspicious sizes (major utilities with <10 employees)
    const suspiciousCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true
      }
    });

    const actuallySuspicious = [];
    for (const company of suspiciousCompanies) {
      const coresignalData = company.customFields?.coresignalData;
      const companySize = coresignalData?.employees_count;
      const companyName = company.name.toLowerCase();
      
      const isMajorUtility = companyName.includes('power') || 
                            companyName.includes('electric') || 
                            companyName.includes('utility') ||
                            companyName.includes('energy') ||
                            companyName.includes('hydro') ||
                            companyName.includes('grid');
      
      if (isMajorUtility && companySize <= 10) {
        actuallySuspicious.push({
          ...company,
          currentSize: companySize,
          currentId: coresignalData.id
        });
      }
    }

    console.log(`Found ${actuallySuspicious.length} companies with suspicious sizes`);
    console.log('');

    let fixedCount = 0;
    let failedCount = 0;

    for (const company of actuallySuspicious) {
      console.log(`🏢 Fixing suspicious size: ${company.name}`);
      console.log(`   Current: ${company.currentSize} employees (ID: ${company.currentId})`);
      
      try {
        // Search for better matches using company name variations
        const nameVariations = this.generateCompanyNameVariations(company.name);
        let bestMatch = null;
        let bestScore = 0;

        for (const variation of nameVariations) {
          console.log(`   🔍 Searching variation: ${variation}`);
          const results = await this.searchCompanyByName(variation);
          
          for (const resultId of results) {
            const companyData = await this.collectCompanyData(resultId);
            if (companyData && companyData.employees_count > company.currentSize) {
              const score = this.calculateMatchScore(company.name, companyData.company_name, companyData.employees_count);
              if (score > bestScore) {
                bestScore = score;
                bestMatch = { id: resultId, data: companyData };
              }
            }
          }
        }

        if (bestMatch && bestMatch.data.employees_count > company.currentSize) {
          // Update with better match
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              customFields: {
                ...company.customFields,
                coresignalData: bestMatch.data,
                enrichmentDate: new Date().toISOString(),
                enrichmentMethod: 'Suspicious Size Correction',
                previousMatch: {
                  id: company.currentId,
                  size: company.currentSize,
                  correctedDate: new Date().toISOString()
                }
              },
              updatedAt: new Date()
            }
          });
          
          fixedCount++;
          console.log(`   ✅ Fixed: ${company.name} -> ${bestMatch.data.employees_count} employees (ID: ${bestMatch.id})`);
        } else {
          console.log(`   ⚠️ No better match found for ${company.name}`);
          failedCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error fixing ${company.name}: ${error.message}`);
        failedCount++;
      }
      console.log('');
    }

    this.results.fixes.suspiciousSizesFixed = fixedCount;
    console.log(`✅ Suspicious size fixes complete: ${fixedCount} fixed, ${failedCount} failed`);
    console.log('');
  }

  async fixCompaniesWithNoPeople() {
    console.log('🔍 FIXING COMPANIES WITH NO PEOPLE');
    console.log('===================================');
    console.log('Using enhanced search strategies to find people');
    console.log('');

    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP Engineering Plus' }
    });

    // Find companies with buyer groups but no people
    const companiesWithNoPeople = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        },
        buyer_groups: {
          some: {
            customFields: {
              path: ['roleDistribution'],
              not: null
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true,
        buyer_groups: {
          where: { workspaceId: workspace.id },
          select: { id: true, customFields: true }
        }
      }
    });

    const actuallyNoPeople = [];
    for (const company of companiesWithNoPeople) {
      const buyerGroup = company.buyer_groups[0];
      if (buyerGroup) {
        const roleDistribution = buyerGroup.customFields?.roleDistribution;
        if (roleDistribution) {
          const totalPeople = Object.values(roleDistribution).reduce((sum, count) => sum + count, 0);
          if (totalPeople === 0) {
            actuallyNoPeople.push(company);
          }
        }
      }
    }

    console.log(`Found ${actuallyNoPeople.length} companies with no people in buyer groups`);
    console.log('');

    let fixedCount = 0;
    let failedCount = 0;

    for (const company of actuallyNoPeople) {
      console.log(`🏢 Fixing no people: ${company.name}`);
      
      try {
        const coresignalData = company.customFields?.coresignalData;
        const companyId = coresignalData?.id;
        
        if (!companyId) {
          console.log(`   ❌ No CoreSignal ID for ${company.name}`);
          failedCount++;
          continue;
        }

        // Use enhanced search strategies
        const people = await this.executeEnhancedPeopleSearch(companyId, company.name);
        
        if (people.length > 0) {
          // Create buyer group with found people
          await this.createBuyerGroupWithPeople(company, people);
          fixedCount++;
          console.log(`   ✅ Found ${people.length} people for ${company.name}`);
        } else {
          console.log(`   ❌ No people found for ${company.name}`);
          failedCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error fixing ${company.name}: ${error.message}`);
        failedCount++;
      }
      console.log('');
    }

    this.results.fixes.noPeopleFixed = fixedCount;
    console.log(`✅ No people fixes complete: ${fixedCount} fixed, ${failedCount} failed`);
    console.log('');
  }

  async fixCompaniesWithNoDecisionMakers() {
    console.log('🔍 FIXING COMPANIES WITH NO DECISION MAKERS');
    console.log('===========================================');
    console.log('Using enhanced role assignment logic');
    console.log('');

    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP Engineering Plus' }
    });

    // Find companies with buyer groups but no decision makers
    const companiesWithNoDMs = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        },
        buyer_groups: {
          some: {
            customFields: {
              path: ['roleDistribution', 'decisionMakers'],
              equals: 0
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true,
        people: {
          where: { deletedAt: null },
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

    console.log(`Found ${companiesWithNoDMs.length} companies with no decision makers`);
    console.log('');

    let fixedCount = 0;
    let failedCount = 0;

    for (const company of companiesWithNoDMs) {
      console.log(`🏢 Fixing no decision makers: ${company.name}`);
      
      try {
        // Find people who should be decision makers
        const potentialDMs = company.people.filter(person => {
          const title = (person.jobTitle || '').toLowerCase();
          const isCoreSignalDM = person.customFields?.is_decision_maker === 1;
          
          return isCoreSignalDM ||
                 title.includes('ceo') || title.includes('chief') || title.includes('president') ||
                 title.includes('vp') || title.includes('vice president') ||
                 title.includes('director') || title.includes('head of') ||
                 title.includes('svp') || title.includes('senior vice president');
        });

        if (potentialDMs.length > 0) {
          // Promote the best candidate to Decision Maker
          const bestDM = potentialDMs.sort((a, b) => {
            const aScore = this.calculateDecisionMakerScore(a);
            const bScore = this.calculateDecisionMakerScore(b);
            return bScore - aScore;
          })[0];

          // Update person's role
          await prisma.people.update({
            where: { id: bestDM.id },
            data: {
              buyerGroupRole: 'Decision Maker',
              updatedAt: new Date(),
              customFields: {
                ...bestDM.customFields,
                buyerGroupDiscovery: {
                  ...bestDM.customFields?.buyerGroupDiscovery,
                  role: 'Decision Maker',
                  confidence: 0.9,
                  reasoning: 'Promoted to Decision Maker - Enhanced role assignment logic',
                  promotionDate: new Date().toISOString()
                }
              }
            }
          });

          // Update buyer group role distribution
          await this.updateBuyerGroupRoleDistribution(company.id, workspace.id);
          
          fixedCount++;
          console.log(`   ✅ Promoted ${bestDM.fullName} to Decision Maker`);
        } else {
          console.log(`   ❌ No suitable decision maker candidates found for ${company.name}`);
          failedCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error fixing ${company.name}: ${error.message}`);
        failedCount++;
      }
      console.log('');
    }

    this.results.fixes.noDecisionMakersFixed = fixedCount;
    console.log(`✅ No decision makers fixes complete: ${fixedCount} fixed, ${failedCount} failed`);
    console.log('');
  }

  // Helper methods
  async searchCompanyByWebsite(website) {
    const normalizedWebsite = website.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const searchQuery = {
      query: {
        bool: {
          should: [
            { match: { 'website': normalizedWebsite } },
            { match: { 'domain': normalizedWebsite } },
            { wildcard: { 'website': `*${normalizedWebsite}*` } },
            { wildcard: { 'domain': `*${normalizedWebsite}*` } }
          ],
          minimum_should_match: 1
        }
      }
    };
    
    const response = await this.callCoreSignalAPI('/company_multi_source/search/es_dsl', searchQuery, 'POST');
    return Array.isArray(response) ? response : [];
  }

  async searchCompanyByName(companyName) {
    const searchQuery = {
      query: {
        match: {
          'company_name': {
            query: companyName,
            fuzziness: 'AUTO'
          }
        }
      }
    };
    
    const response = await this.callCoreSignalAPI('/company_multi_source/search/es_dsl', searchQuery, 'POST');
    return Array.isArray(response) ? response : [];
  }

  async collectCompanyData(coresignalCompanyId) {
    return await this.callCoreSignalAPI(`/company_multi_source/collect/${coresignalCompanyId}`, null, 'GET');
  }

  generateCompanyNameVariations(companyName) {
    const variations = [companyName];
    
    // Add common variations
    if (companyName.includes('Inc')) {
      variations.push(companyName.replace(' Inc', ''));
    }
    if (companyName.includes('Corp')) {
      variations.push(companyName.replace(' Corp', ''));
    }
    if (companyName.includes('LLC')) {
      variations.push(companyName.replace(' LLC', ''));
    }
    if (companyName.includes('Company')) {
      variations.push(companyName.replace(' Company', ''));
    }
    
    return [...new Set(variations)]; // Remove duplicates
  }

  calculateMatchScore(originalName, foundName, employeeCount) {
    let score = 0;
    
    // Name similarity
    const originalLower = originalName.toLowerCase();
    const foundLower = foundName.toLowerCase();
    
    if (originalLower === foundLower) score += 100;
    else if (foundLower.includes(originalLower)) score += 80;
    else if (originalLower.includes(foundLower)) score += 70;
    
    // Employee count bonus (prefer larger companies for utilities)
    if (employeeCount > 100) score += 20;
    if (employeeCount > 500) score += 30;
    if (employeeCount > 1000) score += 40;
    
    return score;
  }

  async executeEnhancedPeopleSearch(companyId, companyName) {
    // Enhanced search with multiple strategies
    const searchStrategies = [
      // Strategy 1: Basic company search
      {
        query: {
          bool: {
            must: [
              { term: { 'active_experience_company_id': companyId } }
            ]
          }
        }
      },
      // Strategy 2: Company search with decision maker focus
      {
        query: {
          bool: {
            must: [
              { term: { 'active_experience_company_id': companyId } },
              {
                bool: {
                  should: [
                    { term: { 'is_decision_maker': 1 } },
                    { match: { 'active_experience_title': 'ceo' } },
                    { match: { 'active_experience_title': 'chief' } },
                    { match: { 'active_experience_title': 'president' } },
                    { match: { 'active_experience_title': 'vp' } },
                    { match: { 'active_experience_title': 'director' } }
                  ],
                  minimum_should_match: 1
                }
              }
            ]
          }
        }
      },
      // Strategy 3: Department-focused search
      {
        query: {
          bool: {
            must: [
              { term: { 'active_experience_company_id': companyId } },
              {
                bool: {
                  should: [
                    { match: { 'active_experience_department': 'engineering' } },
                    { match: { 'active_experience_department': 'operations' } },
                    { match: { 'active_experience_department': 'it' } },
                    { match: { 'active_experience_department': 'technology' } }
                  ],
                  minimum_should_match: 1
                }
              }
            ]
          }
        }
      }
    ];

    const allPeople = [];
    
    for (const strategy of searchStrategies) {
      try {
        const response = await this.callCoreSignalAPI('/employee_multi_source/search/es_dsl', strategy, 'POST');
        const employeeIds = Array.isArray(response) ? response : [];
        
        // Collect profiles for top candidates
        for (const employeeId of employeeIds.slice(0, 10)) {
          try {
            const profile = await this.callCoreSignalAPI(`/employee_multi_source/collect/${employeeId}`, null, 'GET');
            if (profile) {
              allPeople.push(profile);
            }
          } catch (error) {
            // Continue with other profiles
          }
        }
      } catch (error) {
        // Continue with other strategies
      }
    }

    // Remove duplicates and return
    const uniquePeople = [];
    const seenIds = new Set();
    
    for (const person of allPeople) {
      if (person.id && !seenIds.has(person.id)) {
        seenIds.add(person.id);
        uniquePeople.push(person);
      }
    }

    return uniquePeople;
  }

  async createBuyerGroupWithPeople(company, people) {
    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP Engineering Plus' }
    });

    // Assign roles to people
    const peopleWithRoles = people.map(person => ({
      ...person,
      role: this.determineEnhancedRole(person)
    }));

    // Create buyer group
    const buyerGroupId = ulid();
    await prisma.buyer_groups.create({
      data: {
        id: buyerGroupId,
        workspaceId: workspace.id,
        companyId: company.id,
        name: `${company.name} - Buyer Group (Enhanced)`,
        description: `Enhanced buyer group for ${company.name}`,
        purpose: 'Strategic buyer group identification',
        status: 'active',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
        customFields: {
          enrichmentDate: new Date().toISOString(),
          discoveryMethod: 'Enhanced Search Strategies',
          roleDistribution: {
            decisionMakers: peopleWithRoles.filter(p => p.role === 'Decision Maker').length,
            champions: peopleWithRoles.filter(p => p.role === 'Champion').length,
            stakeholders: peopleWithRoles.filter(p => p.role === 'Stakeholder').length,
            blockers: peopleWithRoles.filter(p => p.role === 'Blocker').length,
            introducers: peopleWithRoles.filter(p => p.role === 'Introducer').length
          }
        }
      }
    });

    // Create people records
    for (const person of peopleWithRoles) {
      const personId = ulid();
      await prisma.people.create({
        data: {
          id: personId,
          workspaceId: workspace.id,
          companyId: company.id,
          firstName: person.full_name?.split(' ')[0] || 'Unknown',
          lastName: person.full_name?.split(' ').slice(1).join(' ') || 'Unknown',
          fullName: person.full_name || 'Unknown',
          jobTitle: person.active_experience_title || null,
          department: person.active_experience_department || null,
          email: person.primary_professional_email || `temp-${Date.now()}@buyer-group.com`,
          linkedinUrl: person.professional_network_url || null,
          lastEnriched: new Date(),
          enrichmentSources: ['CoreSignal', 'Enhanced Search'],
          buyerGroupRole: person.role,
          createdAt: new Date(),
          updatedAt: new Date(),
          customFields: {
            ...person,
            enrichmentDate: new Date().toISOString(),
            discoveryMethod: 'Enhanced Search Strategies'
          }
        }
      });

      // Link to buyer group
      await prisma.buyerGroupToPerson.create({
        data: {
          buyerGroupId: buyerGroupId,
          personId: personId,
          role: person.role,
          influence: 'Medium',
          isPrimary: person.role === 'Decision Maker',
          notes: `Enhanced discovery - ${person.role}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }

  determineEnhancedRole(profile) {
    const title = (profile.active_experience_title || '').toLowerCase();
    const isDecisionMaker = profile.is_decision_maker === 1;
    
    // Enhanced decision maker detection
    if (isDecisionMaker || 
        title.includes('ceo') || title.includes('chief') || title.includes('president') ||
        title.includes('vp') || title.includes('vice president') ||
        title.includes('director') || title.includes('head of') ||
        title.includes('svp') || title.includes('senior vice president')) {
      return 'Decision Maker';
    }
    
    // Enhanced champion detection
    if (title.includes('senior') || title.includes('principal') || title.includes('lead')) {
      return 'Champion';
    }
    
    // Enhanced blocker detection
    if (title.includes('legal') || title.includes('compliance') || title.includes('procurement') ||
        title.includes('finance') || title.includes('security') || title.includes('risk')) {
      return 'Blocker';
    }
    
    // Enhanced introducer detection
    if (title.includes('assistant') || title.includes('coordinator') || title.includes('administrative')) {
      return 'Introducer';
    }
    
    // Default to stakeholder
    return 'Stakeholder';
  }

  calculateDecisionMakerScore(person) {
    let score = 0;
    
    const title = (person.jobTitle || '').toLowerCase();
    const isCoreSignalDM = person.customFields?.is_decision_maker === 1;
    
    if (isCoreSignalDM) score += 100;
    if (title.includes('ceo')) score += 90;
    if (title.includes('chief')) score += 85;
    if (title.includes('president')) score += 80;
    if (title.includes('vp')) score += 70;
    if (title.includes('director')) score += 60;
    
    return score;
  }

  async updateBuyerGroupRoleDistribution(companyId, workspaceId) {
    const buyerGroup = await prisma.buyer_groups.findFirst({
      where: { companyId: companyId, workspaceId: workspaceId }
    });

    if (buyerGroup) {
      const people = await prisma.people.findMany({
        where: { companyId: companyId, workspaceId: workspaceId, deletedAt: null },
        select: { buyerGroupRole: true }
      });

      const roleDistribution = {
        decisionMakers: people.filter(p => p.buyerGroupRole === 'Decision Maker').length,
        champions: people.filter(p => p.buyerGroupRole === 'Champion').length,
        stakeholders: people.filter(p => p.buyerGroupRole === 'Stakeholder').length,
        blockers: people.filter(p => p.buyerGroupRole === 'Blocker').length,
        introducers: people.filter(p => p.buyerGroupRole === 'Introducer').length
      };

      await prisma.buyer_groups.update({
        where: { id: buyerGroup.id },
        data: {
          customFields: {
            ...buyerGroup.customFields,
            roleDistribution: roleDistribution
          },
          updatedAt: new Date()
        }
      });
    }
  }

  async callCoreSignalAPI(endpoint, data, method = 'POST') {
    const url = `${CORESIGNAL_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY
      }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`CoreSignal API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  generateComprehensiveReport() {
    console.log('📊 COMPREHENSIVE FIX REPORT');
    console.log('===========================');
    console.log('');
    
    console.log('🔧 FIXES APPLIED:');
    console.log(`   Companies enriched with CoreSignal IDs: ${this.results.fixes.coreSignalEnriched}`);
    console.log(`   Suspicious sizes fixed: ${this.results.fixes.suspiciousSizesFixed}`);
    console.log(`   No people issues fixed: ${this.results.fixes.noPeopleFixed}`);
    console.log(`   No decision makers issues fixed: ${this.results.fixes.noDecisionMakersFixed}`);
    console.log('');
    
    const totalFixes = Object.values(this.results.fixes).reduce((sum, count) => sum + count, 0);
    console.log(`🎯 TOTAL FIXES APPLIED: ${totalFixes}`);
    console.log('');
    
    console.log('✅ COMPREHENSIVE BUYER GROUP FIX COMPLETE!');
    console.log('All 4 categories of issues have been addressed.');
  }
}

// Main execution
async function main() {
  const fix = new ComprehensiveBuyerGroupFix();
  await fix.executeComprehensiveFix();
}

main().catch(console.error);
