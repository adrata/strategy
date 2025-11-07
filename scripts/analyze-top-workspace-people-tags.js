require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class TOPWorkspacePeopleTagAnalysis {
  constructor() {
    this.prisma = prisma;
  }

  async analyze() {
    try {
      console.log('🔍 ANALYZING TOP WORKSPACE PEOPLE DATA');
      console.log('=====================================\n');
      
      // Get TOP workspace
      const workspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { slug: 'top-engineers-plus' },
            { name: { contains: 'TOP', mode: 'insensitive' } }
          ]
        }
      });
      
      if (!workspace) {
        console.log('❌ TOP workspace not found');
        return;
      }
      
      console.log(`📊 Workspace: ${workspace.name} (ID: ${workspace.id})\n`);
      
      // Get all people with full details
      const allPeople = await this.prisma.people.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null
        },
        include: {
          company: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      console.log(`📋 Total People: ${allPeople.length}\n`);
      
      // Analyze tags
      this.analyzeTags(allPeople);
      
      // Analyze sources
      this.analyzeSources(allPeople);
      
      // Analyze creation timeline
      this.analyzeCreationTimeline(allPeople);
      
      // Analyze customFields
      this.analyzeCustomFields(allPeople);
      
      // Identify potential bad data
      this.identifyBadData(allPeople);
      
      // Generate recommendations
      this.generateRecommendations(allPeople);
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  analyzeTags(people) {
    console.log('🏷️  TAG ANALYSIS');
    console.log('================');
    
    const tagCounts = new Map();
    const peopleByTag = new Map();
    
    people.forEach(person => {
      const tags = person.tags || [];
      
      if (tags.length === 0) {
        const noTag = 'NO_TAGS';
        tagCounts.set(noTag, (tagCounts.get(noTag) || 0) + 1);
        if (!peopleByTag.has(noTag)) {
          peopleByTag.set(noTag, []);
        }
        peopleByTag.get(noTag).push(person);
      } else {
        tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          if (!peopleByTag.has(tag)) {
            peopleByTag.set(tag, []);
          }
          peopleByTag.get(tag).push(person);
        });
      }
    });
    
    // Sort by count
    const sortedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1]);
    
    console.log('\nTag Distribution:');
    sortedTags.forEach(([tag, count]) => {
      const percentage = ((count / people.length) * 100).toFixed(1);
      console.log(`  ${tag}: ${count} (${percentage}%)`);
    });
    
    // Identify system-added tags
    const systemTags = ['CoreSignal', 'Prospeo', 'Perplexity', 'Buyer Group Member', 
                        'buyer-group', 'buyer-group-discovery', 'Current Employee'];
    const systemTagged = people.filter(p => {
      const tags = p.tags || [];
      return tags.some(tag => systemTags.some(st => tag.includes(st) || tag === st));
    });
    
    console.log(`\n🔧 System-Added People (by tags): ${systemTagged.length}`);
    console.log(`   Original/Manual People: ${people.length - systemTagged.length}`);
    
    this.systemTaggedPeople = systemTagged;
    this.originalPeople = people.filter(p => !systemTagged.includes(p));
  }

  analyzeSources(people) {
    console.log('\n\n📝 SOURCE ANALYSIS');
    console.log('==================');
    
    const sourceCounts = new Map();
    
    people.forEach(person => {
      const source = person.source || 'NO_SOURCE';
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });
    
    const sortedSources = Array.from(sourceCounts.entries())
      .sort((a, b) => b[1] - a[1]);
    
    console.log('\nSource Distribution:');
    sortedSources.forEach(([source, count]) => {
      const percentage = ((count / people.length) * 100).toFixed(1);
      console.log(`  ${source}: ${count} (${percentage}%)`);
    });
    
    // Identify system sources
    const systemSources = ['buyer-group-discovery', 'coresignal', 'prospeo', 'perplexity'];
    const systemSourced = people.filter(p => {
      const source = (p.source || '').toLowerCase();
      return systemSources.some(ss => source.includes(ss));
    });
    
    console.log(`\n🔧 System-Sourced People: ${systemSourced.length}`);
    console.log(`   Original/Manual People: ${people.length - systemSourced.length}`);
    
    this.systemSourcedPeople = systemSourced;
  }

  analyzeCreationTimeline(people) {
    console.log('\n\n📅 CREATION TIMELINE ANALYSIS');
    console.log('============================');
    
    // Group by month
    const byMonth = new Map();
    
    people.forEach(person => {
      const date = new Date(person.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, []);
      }
      byMonth.get(monthKey).push(person);
    });
    
    const sortedMonths = Array.from(byMonth.entries()).sort();
    
    console.log('\nPeople Created by Month:');
    sortedMonths.forEach(([month, peopleInMonth]) => {
      console.log(`  ${month}: ${peopleInMonth.length} people`);
    });
    
    // Identify potential original data (earliest entries)
    if (sortedMonths.length > 0) {
      const firstMonth = sortedMonths[0][0];
      const firstMonthPeople = sortedMonths[0][1];
      const secondMonth = sortedMonths.length > 1 ? sortedMonths[1][0] : null;
      
      console.log(`\n📌 First Month (${firstMonth}): ${firstMonthPeople.length} people`);
      console.log(`   These are likely your original data from the list`);
      
      if (secondMonth) {
        console.log(`\n📌 Second Month (${secondMonth}): ${sortedMonths[1][1].length} people`);
        console.log(`   Check if these are system-added`);
      }
    }
    
    this.creationTimeline = sortedMonths;
  }

  analyzeCustomFields(people) {
    console.log('\n\n📦 CUSTOM FIELDS ANALYSIS');
    console.log('========================');
    
    const customFieldKeys = new Set();
    const dataSourceCounts = new Map();
    
    people.forEach(person => {
      const customFields = person.customFields || {};
      
      Object.keys(customFields).forEach(key => {
        customFieldKeys.add(key);
      });
      
      // Check for dataSource
      if (customFields.dataSource) {
        const ds = customFields.dataSource;
        dataSourceCounts.set(ds, (dataSourceCounts.get(ds) || 0) + 1);
      }
      
      // Check for coresignalId
      if (customFields.coresignalId) {
        dataSourceCounts.set('CoreSignal (by coresignalId)', 
          (dataSourceCounts.get('CoreSignal (by coresignalId)') || 0) + 1);
      }
    });
    
    console.log(`\nUnique Custom Field Keys: ${customFieldKeys.size}`);
    console.log('Common keys:', Array.from(customFieldKeys).slice(0, 10).join(', '));
    
    if (dataSourceCounts.size > 0) {
      console.log('\nData Source Distribution (from customFields):');
      Array.from(dataSourceCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([source, count]) => {
          console.log(`  ${source}: ${count}`);
        });
    }
  }

  identifyBadData(people) {
    console.log('\n\n🚨 IDENTIFYING POTENTIAL BAD DATA');
    console.log('==================================');
    
    // Criteria for "bad" data:
    // 1. Has system tags (CoreSignal, Prospeo, etc.)
    // 2. Has system source
    // 3. Has coresignalId in customFields
    // 4. Created after original data (if we can identify original)
    
    const badDataCandidates = people.filter(person => {
      const tags = person.tags || [];
      const source = (person.source || '').toLowerCase();
      const customFields = person.customFields || {};
      
      const hasSystemTag = tags.some(tag => 
        ['CoreSignal', 'Prospeo', 'Perplexity', 'Buyer Group Member', 
         'buyer-group', 'buyer-group-discovery'].some(st => 
          tag.includes(st) || tag === st
        )
      );
      
      const hasSystemSource = ['buyer-group-discovery', 'coresignal', 'prospeo', 'perplexity']
        .some(ss => source.includes(ss));
      
      const hasCoreSignalId = !!customFields.coresignalId;
      
      return hasSystemTag || hasSystemSource || hasCoreSignalId;
    });
    
    console.log(`\n🔴 Potential Bad Data (System-Added): ${badDataCandidates.length}`);
    console.log(`   Criteria: Has system tags, system source, or coresignalId`);
    
    // Show sample
    console.log('\nSample Bad Data Records:');
    badDataCandidates.slice(0, 5).forEach((person, i) => {
      console.log(`\n  ${i + 1}. ${person.fullName}`);
      console.log(`     Tags: ${(person.tags || []).join(', ') || 'None'}`);
      console.log(`     Source: ${person.source || 'None'}`);
      console.log(`     Created: ${new Date(person.createdAt).toISOString().split('T')[0]}`);
      console.log(`     Company: ${person.company?.name || 'None'}`);
      if (person.customFields?.coresignalId) {
        console.log(`     CoreSignal ID: ${person.customFields.coresignalId}`);
      }
    });
    
    this.badDataCandidates = badDataCandidates;
    this.goodDataCandidates = people.filter(p => !badDataCandidates.includes(p));
  }

  generateRecommendations(people) {
    console.log('\n\n💡 RECOMMENDATIONS');
    console.log('==================');
    
    console.log('\n1. IDENTIFICATION STRATEGY:');
    console.log('   ✅ Use tags to identify system-added people');
    console.log('   ✅ Use source field to identify system-added people');
    console.log('   ✅ Use customFields.coresignalId to identify CoreSignal-added people');
    console.log('   ✅ Use createdAt to identify original vs system-added (if original was first)');
    
    console.log('\n2. REPLACEMENT STRATEGY:');
    console.log(`   📊 Found ${this.badDataCandidates.length} potential bad records`);
    console.log(`   📊 Found ${this.goodDataCandidates.length} potential good records`);
    
    console.log('\n3. QUERY TO FIND BAD DATA:');
    console.log(`
   const badPeople = await prisma.people.findMany({
     where: {
       workspaceId: '${people[0]?.workspaceId}',
       deletedAt: null,
       OR: [
         { tags: { has: 'CoreSignal' } },
         { tags: { has: 'Prospeo' } },
         { tags: { has: 'Perplexity' } },
         { tags: { has: 'Buyer Group Member' } },
         { source: { contains: 'buyer-group-discovery', mode: 'insensitive' } },
         { source: { contains: 'coresignal', mode: 'insensitive' } },
         { customFields: { path: ['coresignalId'], not: null } }
       ]
     }
   });
    `);
    
    console.log('\n4. NEXT STEPS:');
    console.log('   a. Review the bad data candidates above');
    console.log('   b. Verify which records are actually bad');
    console.log('   c. Export good data to replace bad data');
    console.log('   d. Delete or update bad records');
    console.log('   e. Import good data');
    
    console.log('\n5. SAFETY RECOMMENDATIONS:');
    console.log('   ⚠️  Always backup before deleting');
    console.log('   ⚠️  Test on a small subset first');
    console.log('   ⚠️  Consider soft-deleting (deletedAt) instead of hard-deleting');
  }
}

// Run the analysis
async function main() {
  const analyzer = new TOPWorkspacePeopleTagAnalysis();
  await analyzer.analyze();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TOPWorkspacePeopleTagAnalysis;

