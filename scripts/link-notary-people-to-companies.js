#!/usr/bin/env node

/**
 * 🔗 LINK NOTARY EVERYDAY PEOPLE TO COMPANIES
 * 
 * Extract company information from enriched/coresignal data and link people to companies
 * This addresses the critical 1.8% linkage rate by leveraging the 98.2% enriched data
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class NotaryPeopleCompanyLinker {
  constructor() {
    this.workspaceId = null;
    this.results = {
      totalPeople: 0,
      peopleWithEnrichedData: 0,
      companiesExtracted: 0,
      peopleLinked: 0,
      newCompaniesCreated: 0,
      companiesMatched: 0,
      errors: [],
      linkageRate: 0
    };
  }

  async findNotaryEverydayWorkspace() {
    console.log('🔍 Finding Notary Everyday workspace...');
    
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }

    this.workspaceId = workspace.id;
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    return workspace;
  }

  async getPeopleWithEnrichedData() {
    console.log('\n👥 Getting people with enriched data...');
    
    const people = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { enrichedData: { not: null } },
          { coresignalData: { not: null } },
          { customFields: { path: ['coresignalData'], not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        workEmail: true,
        jobTitle: true,
        companyId: true,
        enrichedData: true,
        coresignalData: true,
        customFields: true,
        currentCompany: true
      }
    });

    this.results.totalPeople = people.length;
    this.results.peopleWithEnrichedData = people.filter(p => 
      p.enrichedData || p.coresignalData || p.customFields?.coresignalData
    ).length;

    console.log(`   📊 Total people: ${this.results.totalPeople}`);
    console.log(`   📊 People with enriched data: ${this.results.peopleWithEnrichedData}`);
    console.log(`   📊 People already linked: ${people.filter(p => p.companyId).length}`);

    return people;
  }

  extractCompanyName(person) {
    // Try multiple sources for company name
    const sources = [
      // From enrichedData overview (primary source)
      person.enrichedData?.overview?.companyId,
      
      // From customFields enrichedData overview
      person.customFields?.enrichedData?.overview?.companyId,
      
      // From headline field (contains company info)
      person.customFields?.headline,
      
      // From coresignalData in customFields
      person.customFields?.coresignalData?.active_experience_company,
      person.customFields?.coresignalData?.current_company_name,
      
      // From direct coresignalData
      person.coresignalData?.active_experience_company,
      person.coresignalData?.current_company_name,
      
      // From enrichedData
      person.enrichedData?.current_company_name,
      person.enrichedData?.active_experience_company,
      
      // From direct field
      person.currentCompany
    ];

    // Find first non-null, non-empty value
    for (const source of sources) {
      if (source && typeof source === 'string' && source.trim().length > 0) {
        // If it's a companyId, return it as-is for direct matching
        if (source.startsWith('01K')) {
          return source;
        }
        // If it's a headline, extract company name
        if (source.includes(' at ')) {
          const companyPart = source.split(' at ')[1];
          return this.normalizeCompanyName(companyPart.trim());
        }
        return this.normalizeCompanyName(source.trim());
      }
    }

    return null;
  }

  normalizeCompanyName(name) {
    if (!name) return null;
    
    // Remove common suffixes and normalize
    return name
      .toLowerCase()
      .replace(/\b(inc|llc|ltd|corp|corporation|company|co\.?|group|associates?)\b\.?/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = this.normalizeCompanyName(str1);
    const s2 = this.normalizeCompanyName(str2);
    
    if (s1 === s2) return 100;
    
    // Simple Jaccard similarity
    const set1 = new Set(s1.split(' '));
    const set2 = new Set(s2.split(' '));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return (intersection.size / union.size) * 100;
  }

  async findBestCompanyMatch(extractedName) {
    console.log(`   🔍 Looking for match: "${extractedName}"`);
    
    // If it's a direct companyId, try to find the company directly
    if (extractedName.startsWith('01K')) {
      const directMatch = await prisma.companies.findFirst({
        where: { 
          id: extractedName,
          workspaceId: this.workspaceId 
        },
        select: { id: true, name: true, domain: true }
      });
      
      if (directMatch) {
        console.log(`   ✅ Direct companyId match: "${directMatch.name}"`);
        this.results.companiesMatched++;
        return { company: directMatch, score: 100 };
      } else {
        console.log(`   ❌ CompanyId not found: "${extractedName}"`);
        return { company: null, score: 0 };
      }
    }
    
    // Otherwise, do fuzzy matching by name
    const companies = await prisma.companies.findMany({
      where: { workspaceId: this.workspaceId },
      select: { id: true, name: true, domain: true }
    });

    let bestMatch = null;
    let bestScore = 0;

    for (const company of companies) {
      const score = this.calculateSimilarity(extractedName, company.name);
      if (score > bestScore && score >= 85) { // 85% similarity threshold
        bestScore = score;
        bestMatch = company;
      }
    }

    if (bestMatch) {
      console.log(`   ✅ Found match: "${bestMatch.name}" (${bestScore.toFixed(1)}% similarity)`);
      this.results.companiesMatched++;
    } else {
      console.log(`   ❌ No match found for: "${extractedName}"`);
    }

    return { company: bestMatch, score: bestScore };
  }

  async createNewCompany(companyName) {
    console.log(`   🏢 Creating new company: "${companyName}"`);
    
    try {
      const newCompany = await prisma.companies.create({
        data: {
          workspaceId: this.workspaceId,
          name: companyName,
          status: 'ACTIVE',
          priority: 'MEDIUM',
          industry: 'Title Insurance', // Default for Notary Everyday
          createdAt: new Date(),
          updatedAt: new Date(),
          customFields: {
            createdFrom: 'people_linking',
            extractedFrom: 'coresignal_data',
            createdAt: new Date().toISOString()
          }
        }
      });

      this.results.newCompaniesCreated++;
      console.log(`   ✅ Created company: ${newCompany.id}`);
      return newCompany;
    } catch (error) {
      console.error(`   ❌ Failed to create company: ${error.message}`);
      this.results.errors.push(`Failed to create company "${companyName}": ${error.message}`);
      return null;
    }
  }

  async linkPersonToCompany(person, company) {
    try {
      await prisma.people.update({
        where: { id: person.id },
        data: {
          companyId: company.id,
          customFields: {
            ...person.customFields,
            linkedFrom: 'coresignal_extraction',
            linkedAt: new Date().toISOString(),
            extractedCompanyName: this.extractCompanyName(person)
          }
        }
      });

      this.results.peopleLinked++;
      console.log(`   ✅ Linked ${person.fullName} to ${company.name}`);
    } catch (error) {
      console.error(`   ❌ Failed to link person: ${error.message}`);
      this.results.errors.push(`Failed to link ${person.fullName}: ${error.message}`);
    }
  }

  async processPeopleInBatches(people, batchSize = 50) {
    console.log(`\n🔄 Processing people in batches of ${batchSize}...`);
    
    const unlinkedPeople = people.filter(p => !p.companyId);
    console.log(`   📊 Processing ${unlinkedPeople.length} unlinked people`);

    for (let i = 0; i < unlinkedPeople.length; i += batchSize) {
      const batch = unlinkedPeople.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(unlinkedPeople.length / batchSize)}`);
      
      for (const person of batch) {
        try {
          const extractedName = this.extractCompanyName(person);
          
          if (!extractedName) {
            console.log(`   ⚠️  No company name found for ${person.fullName}`);
            continue;
          }

          this.results.companiesExtracted++;

          // Try to find existing company
          const { company: matchedCompany } = await this.findBestCompanyMatch(extractedName);
          
          let targetCompany = matchedCompany;
          
          // If no match, create new company
          if (!targetCompany) {
            targetCompany = await this.createNewCompany(extractedName);
          }
          
          // Link person to company
          if (targetCompany) {
            await this.linkPersonToCompany(person, targetCompany);
          }

        } catch (error) {
          console.error(`   ❌ Error processing ${person.fullName}: ${error.message}`);
          this.results.errors.push(`Error processing ${person.fullName}: ${error.message}`);
        }
      }

      // Progress update
      const processed = Math.min(i + batchSize, unlinkedPeople.length);
      console.log(`   📈 Progress: ${processed}/${unlinkedPeople.length} people processed`);
    }
  }

  async generateReport() {
    console.log('\n📊 GENERATING LINKAGE REPORT...');
    
    // Calculate final linkage rate
    const totalPeople = await prisma.people.count({
      where: { workspaceId: this.workspaceId, deletedAt: null }
    });
    
    const linkedPeople = await prisma.people.count({
      where: { 
        workspaceId: this.workspaceId, 
        deletedAt: null,
        companyId: { not: null }
      }
    });

    this.results.linkageRate = totalPeople > 0 ? (linkedPeople / totalPeople) * 100 : 0;

    const report = {
      timestamp: new Date().toISOString(),
      workspaceId: this.workspaceId,
      results: this.results,
      finalStats: {
        totalPeople,
        linkedPeople,
        linkageRate: this.results.linkageRate,
        unlinkedPeople: totalPeople - linkedPeople
      }
    };

    // Save report
    const reportPath = path.join(process.cwd(), 'notary-people-linking-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Report saved to: ${reportPath}`);

    // Display summary
    console.log('\n🎯 LINKING RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`📊 Total people: ${totalPeople}`);
    console.log(`📊 People with enriched data: ${this.results.peopleWithEnrichedData}`);
    console.log(`📊 Companies extracted: ${this.results.companiesExtracted}`);
    console.log(`📊 People linked: ${this.results.peopleLinked}`);
    console.log(`📊 New companies created: ${this.results.newCompaniesCreated}`);
    console.log(`📊 Companies matched: ${this.results.companiesMatched}`);
    console.log(`📊 Final linkage rate: ${this.results.linkageRate.toFixed(1)}%`);
    console.log(`📊 Errors: ${this.results.errors.length}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    return report;
  }

  async run() {
    try {
      console.log('🔗 NOTARY EVERYDAY PEOPLE-COMPANY LINKING');
      console.log('='.repeat(50));
      
      // Find workspace
      await this.findNotaryEverydayWorkspace();
      
      // Get people with enriched data
      const people = await this.getPeopleWithEnrichedData();
      
      if (people.length === 0) {
        console.log('❌ No people found with enriched data');
        return;
      }
      
      // Process people in batches
      await this.processPeopleInBatches(people);
      
      // Generate report
      await this.generateReport();
      
      console.log('\n🎉 People-company linking completed successfully!');
      
    } catch (error) {
      console.error('❌ Fatal error during linking:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the script
if (require.main === module) {
  const linker = new NotaryPeopleCompanyLinker();
  linker.run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = NotaryPeopleCompanyLinker;
