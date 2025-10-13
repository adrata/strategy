#!/usr/bin/env node

/**
 * 🎯 FINAL LINKAGE PUSH TO 100%
 * 
 * This script handles the remaining unlinked people by:
 * 1. Creating placeholder companies for missing companyIds
 * 2. Extracting company names from email domains
 * 3. Using any remaining data sources
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class FinalLinkagePush {
  constructor() {
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
    this.results = {
      totalUnlinked: 0,
      peopleLinked: 0,
      companiesMatched: 0,
      newCompaniesCreated: 0,
      placeholderCompaniesCreated: 0,
      errors: []
    };
  }

  async getUnlinkedPeople() {
    console.log('👥 Getting remaining unlinked people...');
    
    const unlinkedPeople = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        companyId: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        enrichedData: true,
        coresignalData: true,
        customFields: true
      }
    });

    this.results.totalUnlinked = unlinkedPeople.length;
    console.log(`   📊 Found ${unlinkedPeople.length} remaining unlinked people`);
    return unlinkedPeople;
  }

  extractCompanyInfo(person) {
    const sources = [];
    
    // Method 1: Direct companyId from enrichedData.overview (create placeholder)
    if (person.enrichedData?.overview?.companyId) {
      sources.push({
        type: 'companyId',
        value: person.enrichedData.overview.companyId,
        confidence: 100,
        isPlaceholder: true
      });
    }
    
    // Method 2: Direct companyId from customFields.enrichedData.overview (create placeholder)
    if (person.customFields?.enrichedData?.overview?.companyId) {
      sources.push({
        type: 'companyId',
        value: person.customFields.enrichedData.overview.companyId,
        confidence: 100,
        isPlaceholder: true
      });
    }
    
    // Method 3: Company name from headline (parse "at" format)
    if (person.customFields?.headline) {
      const headline = person.customFields.headline;
      if (headline.includes(' at ')) {
        const companyPart = headline.split(' at ')[1];
        const cleanCompany = companyPart
          .replace(/\s*,\s*.*$/, '')
          .replace(/\s*\.\s*$/, '')
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
    
    // Method 4: Email domain extraction (create company from domain)
    const email = person.email || 
                  person.enrichedData?.overview?.email || 
                  person.customFields?.enrichedData?.overview?.email;
    if (email && email.includes('@')) {
      const domain = email.split('@')[1];
      if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && 
          !domain.includes('hotmail') && !domain.includes('outlook') &&
          !domain.includes('aol') && !domain.includes('icloud')) {
        // Convert domain to company name
        const companyName = domain
          .split('.')[0]
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        sources.push({
          type: 'emailDomain',
          value: companyName,
          confidence: 70,
          originalDomain: domain
        });
      }
    }
    
    // Method 5: Try to extract from coresignal data
    if (person.coresignalData?.active_experience_company) {
      sources.push({
        type: 'coresignalCompany',
        value: person.coresignalData.active_experience_company,
        confidence: 85
      });
    }
    
    if (person.coresignalData?.current_company_name) {
      sources.push({
        type: 'coresignalCompany',
        value: person.coresignalData.current_company_name,
        confidence: 85
      });
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
        // Create placeholder company for missing companyId
        console.log(`   🏢 Creating placeholder company for missing companyId: "${companyInfo.value}"`);
        return await this.createPlaceholderCompany(companyInfo.value);
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
      
      const nameScore = this.calculateSimilarity(companyInfo.value, company.name);
      score = Math.max(score, nameScore);
      
      if (companyInfo.type === 'emailDomain' && company.domain) {
        const domainScore = this.calculateSimilarity(companyInfo.originalDomain, company.domain);
        score = Math.max(score, domainScore);
      }
      
      if (score > bestScore && score >= 80) { // Lower threshold for final push
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

  async createPlaceholderCompany(companyId) {
    console.log(`   🏢 Creating placeholder company for missing companyId: ${companyId}`);
    
    try {
      const newCompany = await prisma.companies.create({
        data: {
          workspaceId: this.workspaceId,
          name: `Company ${companyId.slice(-8)}`, // Use last 8 chars of ID
          status: 'ACTIVE',
          priority: 'LOW',
          industry: 'Title Insurance',
          createdAt: new Date(),
          updatedAt: new Date(),
          customFields: {
            createdFrom: 'placeholder_for_missing_companyid',
            originalCompanyId: companyId,
            isPlaceholder: true,
            createdAt: new Date().toISOString()
          }
        }
      });

      this.results.placeholderCompaniesCreated++;
      console.log(`   ✅ Created placeholder company: ${newCompany.id}`);
      return { company: newCompany, score: 100 };
    } catch (error) {
      console.error(`   ❌ Failed to create placeholder company: ${error.message}`);
      this.results.errors.push(`Failed to create placeholder company for ${companyId}: ${error.message}`);
      return { company: null, score: 0 };
    }
  }

  async createNewCompany(companyName, companyInfo) {
    console.log(`   🏢 Creating new company: "${companyName}"`);
    
    try {
      const newCompany = await prisma.companies.create({
        data: {
          workspaceId: this.workspaceId,
          name: companyName,
          status: 'ACTIVE',
          priority: 'LOW',
          industry: 'Title Insurance',
          domain: companyInfo.originalDomain || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          customFields: {
            createdFrom: 'final_linkage_push',
            extractionMethod: companyInfo.type,
            extractionConfidence: companyInfo.confidence,
            originalValue: companyInfo.value,
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
            linkedFrom: 'final_linkage_push',
            linkedAt: new Date().toISOString(),
            extractionMethod: companyInfo.type,
            extractionConfidence: companyInfo.confidence,
            extractedValue: companyInfo.value,
            isPlaceholder: companyInfo.isPlaceholder || false
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

  async processPeopleInBatches(people, batchSize = 25) {
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
          
          // If no match, create new company
          if (!targetCompany && (companyInfo.type === 'companyName' || companyInfo.type === 'emailDomain' || companyInfo.type === 'coresignalCompany')) {
            targetCompany = await this.createNewCompany(companyInfo.value, companyInfo);
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

      const processed = Math.min(i + batchSize, people.length);
      console.log(`   📈 Progress: ${processed}/${people.length} people processed`);
    }
  }

  async generateReport() {
    console.log('\n📊 GENERATING FINAL LINKAGE REPORT...');
    
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

    const reportPath = path.join(process.cwd(), 'notary-final-linkage-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Report saved to: ${reportPath}`);

    console.log('\n🎯 FINAL LINKAGE RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`📊 Total people: ${totalPeople}`);
    console.log(`📊 People linked in this run: ${this.results.peopleLinked}`);
    console.log(`📊 Total linked people: ${linkedPeople}`);
    console.log(`📊 Final linkage rate: ${linkageRate.toFixed(1)}%`);
    console.log(`📊 Companies matched: ${this.results.companiesMatched}`);
    console.log(`📊 New companies created: ${this.results.newCompaniesCreated}`);
    console.log(`📊 Placeholder companies created: ${this.results.placeholderCompaniesCreated}`);
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
      console.log('🎯 FINAL LINKAGE PUSH TO 100%');
      console.log('='.repeat(50));
      
      const unlinkedPeople = await this.getUnlinkedPeople();
      
      if (unlinkedPeople.length === 0) {
        console.log('✅ All people are already linked!');
        return;
      }
      
      await this.processPeopleInBatches(unlinkedPeople);
      await this.generateReport();
      
      console.log('\n🎉 Final linkage push completed successfully!');
      
    } catch (error) {
      console.error('❌ Fatal error during final linkage push:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the script
if (require.main === module) {
  const finalPush = new FinalLinkagePush();
  finalPush.run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = FinalLinkagePush;
