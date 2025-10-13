#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SimilarCompanyChecker {
  constructor() {
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
    this.results = {
      totalCompanies: 0,
      similarPairs: 0,
      highSimilarityPairs: [],
      mediumSimilarityPairs: []
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

  async getAllCompanies() {
    console.log('🔍 Getting all companies for similarity analysis...');
    
    const companies = await prisma.companies.findMany({
      where: { workspaceId: this.workspaceId },
      select: {
        id: true,
        name: true,
        industry: true,
        customFields: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    this.results.totalCompanies = companies.length;
    console.log(`   📊 Found ${companies.length} companies to analyze`);
    return companies;
  }

  async findSimilarCompanies(companies) {
    console.log('\n🔍 Analyzing company name similarities...');
    
    const similarPairs = [];
    
    // Compare each company with every other company
    for (let i = 0; i < companies.length; i++) {
      for (let j = i + 1; j < companies.length; j++) {
        const company1 = companies[i];
        const company2 = companies[j];
        
        const similarity = this.calculateSimilarity(company1.name, company2.name);
        
        if (similarity >= 70) { // 70% similarity threshold
          similarPairs.push({
            company1,
            company2,
            similarity
          });
        }
      }
    }

    // Sort by similarity (highest first)
    similarPairs.sort((a, b) => b.similarity - a.similarity);

    this.results.similarPairs = similarPairs.length;
    this.results.highSimilarityPairs = similarPairs.filter(p => p.similarity >= 85);
    this.results.mediumSimilarityPairs = similarPairs.filter(p => p.similarity >= 70 && p.similarity < 85);

    console.log(`   📊 Found ${similarPairs.length} similar company pairs`);
    console.log(`   📊 High similarity (85%+): ${this.results.highSimilarityPairs.length}`);
    console.log(`   📊 Medium similarity (70-84%): ${this.results.mediumSimilarityPairs.length}`);
  }

  async generateReport() {
    console.log('\n📊 SIMILAR COMPANY NAMES ANALYSIS');
    console.log('='.repeat(70));
    console.log(`Total companies analyzed: ${this.results.totalCompanies}`);
    console.log(`Similar company pairs found: ${this.results.similarPairs}`);
    console.log(`High similarity pairs (85%+): ${this.results.highSimilarityPairs.length}`);
    console.log(`Medium similarity pairs (70-84%): ${this.results.mediumSimilarityPairs.length}`);

    if (this.results.highSimilarityPairs.length > 0) {
      console.log('\n🔴 HIGH SIMILARITY COMPANIES (85%+ similarity):');
      console.log('='.repeat(70));
      
      this.results.highSimilarityPairs.slice(0, 20).forEach((pair, index) => {
        console.log(`\n${index + 1}. ${pair.similarity.toFixed(1)}% similarity:`);
        console.log(`   Company 1: "${pair.company1.name}"`);
        console.log(`   ID: ${pair.company1.id}`);
        console.log(`   Created: ${pair.company1.createdAt.toISOString()}`);
        console.log(`   Source: ${pair.company1.customFields?.createdFrom || 'Existing'}`);
        
        console.log(`   Company 2: "${pair.company2.name}"`);
        console.log(`   ID: ${pair.company2.id}`);
        console.log(`   Created: ${pair.company2.createdAt.toISOString()}`);
        console.log(`   Source: ${pair.company2.customFields?.createdFrom || 'Existing'}`);
      });

      if (this.results.highSimilarityPairs.length > 20) {
        console.log(`\n   ... and ${this.results.highSimilarityPairs.length - 20} more high similarity pairs`);
      }
    }

    if (this.results.mediumSimilarityPairs.length > 0) {
      console.log('\n🟡 MEDIUM SIMILARITY COMPANIES (70-84% similarity):');
      console.log('='.repeat(70));
      
      this.results.mediumSimilarityPairs.slice(0, 10).forEach((pair, index) => {
        console.log(`\n${index + 1}. ${pair.similarity.toFixed(1)}% similarity:`);
        console.log(`   Company 1: "${pair.company1.name}"`);
        console.log(`   Company 2: "${pair.company2.name}"`);
      });

      if (this.results.mediumSimilarityPairs.length > 10) {
        console.log(`\n   ... and ${this.results.mediumSimilarityPairs.length - 10} more medium similarity pairs`);
      }
    }

    if (this.results.similarPairs === 0) {
      console.log('\n✅ NO SIMILAR COMPANY NAMES FOUND!');
      console.log('All company names appear to be sufficiently unique.');
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('='.repeat(70));
    
    if (this.results.highSimilarityPairs.length > 0) {
      console.log(`🔴 ${this.results.highSimilarityPairs.length} high similarity pairs found - manual review recommended`);
      console.log('   Consider merging companies with 95%+ similarity');
    }
    
    if (this.results.mediumSimilarityPairs.length > 0) {
      console.log(`🟡 ${this.results.mediumSimilarityPairs.length} medium similarity pairs found - review for potential merging`);
    }
    
    if (this.results.similarPairs === 0) {
      console.log('✅ No similar company names found - data quality is excellent');
    }
  }

  async run() {
    try {
      console.log('🔍 CHECKING FOR SIMILAR COMPANY NAMES');
      console.log('='.repeat(70));
      
      const companies = await this.getAllCompanies();
      
      if (companies.length === 0) {
        console.log('✅ No companies found to analyze');
        return;
      }
      
      await this.findSimilarCompanies(companies);
      await this.generateReport();
      
      console.log('\n🎉 Similar company name analysis completed!');
      
    } catch (error) {
      console.error('❌ Fatal error during similarity analysis:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the script
if (require.main === module) {
  const checker = new SimilarCompanyChecker();
  checker.run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = SimilarCompanyChecker;
