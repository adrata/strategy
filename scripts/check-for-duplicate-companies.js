#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DuplicateCompanyChecker {
  constructor() {
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
    this.results = {
      newlyCreatedCompanies: 0,
      potentialDuplicates: 0,
      exactMatches: 0,
      similarMatches: 0,
      duplicates: []
    };
  }

  normalizeCompanyName(name) {
    if (!name) return '';
    
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

  async getNewlyCreatedCompanies() {
    console.log('🔍 Finding newly created companies...');
    
    const newlyCreated = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        OR: [
          { customFields: { path: ['createdFrom'], equals: 'improved_people_linking' } },
          { customFields: { path: ['createdFrom'], equals: 'final_linkage_push' } },
          { customFields: { path: ['createdFrom'], equals: 'people_linking' } },
          { customFields: { path: ['createdFrom'], equals: 'placeholder_for_missing_companyid' } }
        ]
      },
      select: {
        id: true,
        name: true,
        industry: true,
        customFields: true,
        createdAt: true
      }
    });

    this.results.newlyCreatedCompanies = newlyCreated.length;
    console.log(`   📊 Found ${newlyCreated.length} newly created companies`);
    return newlyCreated;
  }

  async getAllCompanies() {
    console.log('🔍 Getting all companies for comparison...');
    
    const allCompanies = await prisma.companies.findMany({
      where: { workspaceId: this.workspaceId },
      select: {
        id: true,
        name: true,
        industry: true,
        customFields: true,
        createdAt: true
      }
    });

    console.log(`   📊 Total companies in workspace: ${allCompanies.length}`);
    return allCompanies;
  }

  async checkForDuplicates(newlyCreated, allCompanies) {
    console.log('\n🔍 Checking for duplicate companies...');
    
    const existingCompanies = allCompanies.filter(company => 
      !newlyCreated.some(newCompany => newCompany.id === company.id)
    );

    console.log(`   📊 Comparing ${newlyCreated.length} new companies against ${existingCompanies.length} existing companies`);

    for (const newCompany of newlyCreated) {
      const duplicates = [];
      
      for (const existingCompany of existingCompanies) {
        const similarity = this.calculateSimilarity(newCompany.name, existingCompany.name);
        
        if (similarity >= 90) { // 90% similarity threshold
          duplicates.push({
            existingCompany,
            similarity,
            isExact: similarity === 100
          });
        }
      }

      if (duplicates.length > 0) {
        this.results.potentialDuplicates++;
        
        const exactMatch = duplicates.find(d => d.isExact);
        if (exactMatch) {
          this.results.exactMatches++;
        } else {
          this.results.similarMatches++;
        }

        this.results.duplicates.push({
          newCompany,
          duplicates
        });

        console.log(`\n⚠️  POTENTIAL DUPLICATE: "${newCompany.name}"`);
        console.log(`   Created: ${newCompany.createdAt.toISOString()}`);
        console.log(`   Source: ${newCompany.customFields?.createdFrom || 'Unknown'}`);
        
        duplicates.forEach((dup, i) => {
          console.log(`   ${i+1}. "${dup.existingCompany.name}" (${dup.similarity.toFixed(1)}% similarity)`);
          console.log(`      Existing ID: ${dup.existingCompany.id}`);
          console.log(`      Created: ${dup.existingCompany.createdAt.toISOString()}`);
        });
      }
    }
  }

  async generateReport() {
    console.log('\n📊 DUPLICATE COMPANY ANALYSIS REPORT');
    console.log('='.repeat(60));
    console.log(`Newly created companies: ${this.results.newlyCreatedCompanies}`);
    console.log(`Companies with potential duplicates: ${this.results.potentialDuplicates}`);
    console.log(`Exact matches found: ${this.results.exactMatches}`);
    console.log(`Similar matches found: ${this.results.similarMatches}`);
    
    if (this.results.duplicates.length > 0) {
      console.log('\n⚠️  DUPLICATE COMPANIES FOUND:');
      console.log('='.repeat(60));
      
      this.results.duplicates.forEach((duplicate, index) => {
        const newCompany = duplicate.newCompany;
        const exactMatch = duplicate.duplicates.find(d => d.isExact);
        
        console.log(`\n${index + 1}. NEW COMPANY: "${newCompany.name}"`);
        console.log(`   ID: ${newCompany.id}`);
        console.log(`   Created: ${newCompany.createdAt.toISOString()}`);
        console.log(`   Source: ${newCompany.customFields?.createdFrom || 'Unknown'}`);
        
        if (exactMatch) {
          console.log(`   ❌ EXACT DUPLICATE FOUND:`);
          console.log(`      Existing: "${exactMatch.existingCompany.name}"`);
          console.log(`      ID: ${exactMatch.existingCompany.id}`);
          console.log(`      Created: ${exactMatch.existingCompany.createdAt.toISOString()}`);
        } else {
          console.log(`   ⚠️  SIMILAR COMPANIES FOUND:`);
          duplicate.duplicates.forEach((dup, i) => {
            console.log(`      ${i+1}. "${dup.existingCompany.name}" (${dup.similarity.toFixed(1)}% similarity)`);
            console.log(`         ID: ${dup.existingCompany.id}`);
          });
        }
      });
    } else {
      console.log('\n✅ NO DUPLICATE COMPANIES FOUND!');
      console.log('All newly created companies appear to be unique.');
    }

    // Summary recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('='.repeat(60));
    
    if (this.results.exactMatches > 0) {
      console.log(`❌ ${this.results.exactMatches} exact duplicates found - consider merging or deleting duplicates`);
    }
    
    if (this.results.similarMatches > 0) {
      console.log(`⚠️  ${this.results.similarMatches} similar companies found - review for potential merging`);
    }
    
    if (this.results.duplicates.length === 0) {
      console.log('✅ No duplicates found - all newly created companies are unique');
    }
  }

  async run() {
    try {
      console.log('🔍 CHECKING FOR DUPLICATE COMPANIES');
      console.log('='.repeat(60));
      
      const newlyCreated = await this.getNewlyCreatedCompanies();
      const allCompanies = await this.getAllCompanies();
      
      if (newlyCreated.length === 0) {
        console.log('✅ No newly created companies found to check');
        return;
      }
      
      await this.checkForDuplicates(newlyCreated, allCompanies);
      await this.generateReport();
      
      console.log('\n🎉 Duplicate check completed!');
      
    } catch (error) {
      console.error('❌ Fatal error during duplicate check:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the script
if (require.main === module) {
  const checker = new DuplicateCompanyChecker();
  checker.run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = DuplicateCompanyChecker;
