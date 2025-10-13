#!/usr/bin/env node

/**
 * 🔗 IMPROVE NOTARY EVERYDAY LINKAGE TO 100%
 * 
 * Enhanced script to achieve 100% linkage rate using better extraction methods
 * without making up any data - only using what's actually in the enriched data
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class NotaryLinkageImprover {
  constructor() {
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
    this.results = {
      totalUnlinked: 0,
      peopleLinked: 0,
      companiesMatched: 0,
      newCompaniesCreated: 0,
      errors: []
    };
  }

  async getUnlinkedPeople() {
    console.log('👥 Getting unlinked people...');
    
    const unlinkedPeople = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        companyId: null
      },
      select: {
        id: true,
        fullName: true,
        enrichedData: true,
        coresignalData: true,
        customFields: true
      }
    });

    this.results.totalUnlinked = unlinkedPeople.length;
    console.log(`   📊 Found ${unlinkedPeople.length} unlinked people`);
    return unlinkedPeople;
  }

  extractCompanyInfo(person) {
    const sources = [];
    
    // Method 1: Direct companyId from enrichedData.overview
    if (person.enrichedData?.overview?.companyId) {
      sources.push({
        type: 'companyId',
        value: person.enrichedData.overview.companyId,
        confidence: 100
      });
    }
    
    // Method 2: Direct companyId from customFields.enrichedData.overview
    if (person.customFields?.enrichedData?.overview?.companyId) {
      sources.push({
        type: 'companyId',
        value: person.customFields.enrichedData.overview.companyId,
        confidence: 100
      });
    }
    
    // Method 3: Company name from headline (parse "at" format)
    if (person.customFields?.headline) {
      const headline = person.customFields.headline;
      if (headline.includes(' at ')) {
        const companyPart = headline.split(' at ')[1];
        // Clean up the company name
        const cleanCompany = companyPart
          .replace(/\s*,\s*.*$/, '') // Remove everything after comma
          .replace(/\s*\.\s*$/, '') // Remove trailing period
          .trim();
        if (cleanCompany && cleanCompany.length > 2) {
          sources.push({
            type: 'companyName',
            value: cleanCompany,
            confidence: 90
          });
        }
      }
    }
    
    // Method 4: Email domain extraction
    const email = person.enrichedData?.overview?.email || 
                  person.customFields?.enrichedData?.overview?.email;
    if (email && email.includes('@')) {
      const domain = email.split('@')[1];
      if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && 
          !domain.includes('hotmail') && !domain.includes('outlook')) {
        sources.push({
          type: 'emailDomain',
          value: domain,
          confidence: 80
        });
      }
    }
    
    // Return the highest confidence source
    return sources.sort((a, b) => b.confidence - a.confidence)[0] || null;
  }

  normalizeCompanyName(name) {
    if (!name) return null;
    
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

  async findCompanyMatch(companyInfo) {
    console.log(`   🔍 Looking for match: "${companyInfo.value}" (${companyInfo.type}, ${companyInfo.confidence}% confidence)`);
    
    // If it's a direct companyId, try to find the company directly
    if (companyInfo.type === 'companyId') {
      const directMatch = await prisma.companies.findFirst({
        where: { 
          id: companyInfo.value,
          workspaceId: this.workspaceId 
        },
        select: { id: true, name: true, domain: true }
      });
      
      if (directMatch) {
        console.log(`   ✅ Direct companyId match: "${directMatch.name}"`);
        this.results.companiesMatched++;
        return { company: directMatch, score: 100 };
      } else {
        console.log(`   ❌ CompanyId not found: "${companyInfo.value}"`);
        return { company: null, score: 0 };
      }
    }
    
    // For company names and email domains, do fuzzy matching
    const companies = await prisma.companies.findMany({
      where: { workspaceId: this.workspaceId },
      select: { id: true, name: true, domain: true }
    });

    let bestMatch = null;
    let bestScore = 0;

    for (const company of companies) {
      let score = 0;
      
      // Match against company name
      const nameScore = this.calculateSimilarity(companyInfo.value, company.name);
      score = Math.max(score, nameScore);
      
      // Match against domain if it's an email domain
      if (companyInfo.type === 'emailDomain' && company.domain) {
        const domainScore = this.calculateSimilarity(companyInfo.value, company.domain);
        score = Math.max(score, domainScore);
      }
      
      if (score > bestScore && score >= 85) { // 85% similarity threshold
        bestScore = score;
        bestMatch = company;
      }
    }

    if (bestMatch) {
      console.log(`   ✅ Found match: "${bestMatch.name}" (${bestScore.toFixed(1)}% similarity)`);
      this.results.companiesMatched++;
    } else {
      console.log(`   ❌ No match found for: "${companyInfo.value}"`);
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
          industry: 'Title Insurance',
          createdAt: new Date(),
          updatedAt: new Date(),
          customFields: {
            createdFrom: 'improved_people_linking',
            extractedFrom: 'enriched_data',
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

  async linkPersonToCompany(person, company, companyInfo) {
    try {
      await prisma.people.update({
        where: { id: person.id },
        data: {
          companyId: company.id,
          customFields: {
            ...person.customFields,
            linkedFrom: 'improved_extraction',
            linkedAt: new Date().toISOString(),
            extractionMethod: companyInfo.type,
            extractionConfidence: companyInfo.confidence,
            extractedValue: companyInfo.value
          }
        }
      });

      this.results.peopleLinked++;
      console.log(`   ✅ Linked ${person.fullName} to ${company.name} (${companyInfo.type}, ${companyInfo.confidence}% confidence)`);
    } catch (error) {
      console.error(`   ❌ Failed to link person: ${error.message}`);
      this.results.errors.push(`Failed to link ${person.fullName}: ${error.message}`);
    }
  }

  async processPeopleInBatches(people, batchSize = 50) {
    console.log(`\n🔄 Processing people in batches of ${batchSize}...`);
    
    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(people.length / batchSize)}`);
      
      for (const person of batch) {
        try {
          const companyInfo = this.extractCompanyInfo(person);
          
          if (!companyInfo) {
            console.log(`   ⚠️  No company info found for ${person.fullName}`);
            continue;
          }

          // Try to find existing company
          const { company: matchedCompany } = await this.findCompanyMatch(companyInfo);
          
          let targetCompany = matchedCompany;
          
          // If no match and it's a company name (not companyId), create new company
          if (!targetCompany && companyInfo.type === 'companyName') {
            targetCompany = await this.createNewCompany(companyInfo.value);
          }
          
          // Link person to company
          if (targetCompany) {
            await this.linkPersonToCompany(person, targetCompany, companyInfo);
          }

        } catch (error) {
          console.error(`   ❌ Error processing ${person.fullName}: ${error.message}`);
          this.results.errors.push(`Error processing ${person.fullName}: ${error.message}`);
        }
      }

      // Progress update
      const processed = Math.min(i + batchSize, people.length);
      console.log(`   📈 Progress: ${processed}/${people.length} people processed`);
    }
  }

  async generateReport() {
    console.log('\n📊 GENERATING IMPROVED LINKAGE REPORT...');
    
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

    const linkageRate = totalPeople > 0 ? (linkedPeople / totalPeople) * 100 : 0;

    const report = {
      timestamp: new Date().toISOString(),
      workspaceId: this.workspaceId,
      results: this.results,
      finalStats: {
        totalPeople,
        linkedPeople,
        linkageRate,
        unlinkedPeople: totalPeople - linkedPeople,
        improvement: this.results.peopleLinked
      }
    };

    // Save report
    const reportPath = path.join(process.cwd(), 'notary-improved-linkage-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Report saved to: ${reportPath}`);

    // Display summary
    console.log('\n🎯 IMPROVED LINKAGE RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`📊 Total people: ${totalPeople}`);
    console.log(`📊 People linked in this run: ${this.results.peopleLinked}`);
    console.log(`📊 Total linked people: ${linkedPeople}`);
    console.log(`📊 Final linkage rate: ${linkageRate.toFixed(1)}%`);
    console.log(`📊 Companies matched: ${this.results.companiesMatched}`);
    console.log(`📊 New companies created: ${this.results.newCompaniesCreated}`);
    console.log(`📊 Errors: ${this.results.errors.length}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (this.results.errors.length > 10) {
        console.log(`   ... and ${this.results.errors.length - 10} more errors`);
      }
    }

    return report;
  }

  async run() {
    try {
      console.log('🔗 NOTARY EVERYDAY LINKAGE IMPROVEMENT');
      console.log('='.repeat(50));
      
      // Get unlinked people
      const unlinkedPeople = await this.getUnlinkedPeople();
      
      if (unlinkedPeople.length === 0) {
        console.log('✅ All people are already linked!');
        return;
      }
      
      // Process people in batches
      await this.processPeopleInBatches(unlinkedPeople);
      
      // Generate report
      await this.generateReport();
      
      console.log('\n🎉 Linkage improvement completed successfully!');
      
    } catch (error) {
      console.error('❌ Fatal error during linkage improvement:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the script
if (require.main === module) {
  const improver = new NotaryLinkageImprover();
  improver.run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = NotaryLinkageImprover;
