/**
 * 🎯 MULTI-SEARCH BGI FOR MAXIMUM COVERAGE
 * 
 * This script runs multiple targeted searches to get comprehensive coverage
 * of all potential buyer group members at both companies
 */

const fetch = require('node-fetch');

async function runMultiSearchBGI() {
  console.log('🎯 Starting Multi-Search BGI for Maximum Coverage...\n');

  const baseUrl = 'http://localhost:3000';
  const endpoint = '/api/intelligence/buyer-group-bulk';

  // Multiple targeted searches for each company
  const searchSets = [
    {
      company: 'Flexera',
      seller: 'SBI Growth',
      searches: [
        {
          name: 'C-Level Executives',
          accounts: ['Flexera'],
          targetRoles: ['CEO', 'President', 'CFO', 'CTO', 'COO', 'CRO', 'CMO', 'CHRO'],
          maxCollects: 20
        },
        {
          name: 'Sales & Revenue Leadership',
          accounts: ['Flexera'],
          targetRoles: ['VP Sales', 'Head of Sales', 'Sales Director', 'VP Revenue', 'Head of Revenue', 'VP Business Development', 'Head of Business Development'],
          maxCollects: 20
        },
        {
          name: 'Technology & Product Leadership',
          accounts: ['Flexera'],
          targetRoles: ['VP Technology', 'Head of Technology', 'VP Product', 'Head of Product', 'VP Engineering', 'Head of Engineering', 'VP Data', 'Head of Data'],
          maxCollects: 20
        },
        {
          name: 'Operations & Strategy',
          accounts: ['Flexera'],
          targetRoles: ['VP Operations', 'Head of Operations', 'VP Strategy', 'Head of Strategy', 'VP Procurement', 'Head of Procurement', 'VP Legal', 'Head of Legal'],
          maxCollects: 20
        },
        {
          name: 'Regional & Business Unit Leaders',
          accounts: ['Flexera'],
          targetRoles: ['Regional Director', 'Country Manager', 'Business Unit Director', 'General Manager', 'Managing Director', 'Regional VP'],
          maxCollects: 20
        }
      ]
    },
    {
      company: 'athenahealth',
      seller: 'Absorb',
      searches: [
        {
          name: 'C-Level Executives',
          accounts: ['athenahealth'],
          targetRoles: ['CEO', 'President', 'CFO', 'CTO', 'COO', 'CRO', 'CMO', 'CHRO', 'Chief Medical Officer'],
          maxCollects: 20
        },
        {
          name: 'Learning & Development Leadership',
          accounts: ['athenahealth'],
          targetRoles: ['VP Learning', 'Head of Learning', 'VP Training', 'Head of Training', 'VP Education', 'Head of Education', 'VP Development', 'Head of Development', 'VP Talent Development', 'Head of Talent Development'],
          maxCollects: 20
        },
        {
          name: 'Technology & Product Leadership',
          accounts: ['athenahealth'],
          targetRoles: ['VP Technology', 'Head of Technology', 'VP Product', 'Head of Product', 'VP Engineering', 'Head of Engineering', 'VP Data', 'Head of Data', 'VP Software Development', 'Head of Software Development'],
          maxCollects: 20
        },
        {
          name: 'HR & Employee Experience',
          accounts: ['athenahealth'],
          targetRoles: ['VP HR', 'Head of HR', 'VP Employee Experience', 'Head of Employee Experience', 'VP Onboarding', 'Head of Onboarding', 'VP Talent', 'Head of Talent'],
          maxCollects: 20
        },
        {
          name: 'Operations & Strategy',
          accounts: ['athenahealth'],
          targetRoles: ['VP Operations', 'Head of Operations', 'VP Strategy', 'Head of Strategy', 'VP Procurement', 'Head of Procurement', 'VP Legal', 'Head of Legal', 'VP Compliance', 'Head of Compliance'],
          maxCollects: 20
        }
      ]
    }
  ];

  const allResults = [];

  for (const searchSet of searchSets) {
    console.log(`\n🎯 Multi-Search: ${searchSet.company} (${searchSet.seller})`);
    console.log('=' .repeat(60));

    const companyResults = {
      company: searchSet.company,
      seller: searchSet.seller,
      searches: [],
      combinedPeople: [],
      success: true
    };

    for (const search of searchSet.searches) {
      console.log(`\n🔍 ${search.name} Search...`);
      
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...search,
            userId: '01K1VBYXHD0J895XAN0HGFBKJP',
            workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log(`   ✅ Found: ${data.summary.totalPeopleFound} people`);
        console.log(`   ⏱️  Time: ${data.summary.processingTimeMs}ms`);
        console.log(`   💰 Cost: ${data.summary.costEstimate}`);
        
        if (data.buyerGroups && data.buyerGroups.length > 0) {
          const people = data.buyerGroups[0].people || [];
          console.log(`   👥 People: ${people.length}`);
          
          // Add to combined results
          companyResults.combinedPeople.push(...people);
          
          // Log key people from this search
          people.slice(0, 3).forEach((person, index) => {
            console.log(`      ${index + 1}. ${person.name} - ${person.title} (${person.role})`);
          });
        }

        companyResults.searches.push({
          name: search.name,
          data: data,
          success: true
        });

      } catch (error) {
        console.error(`   ❌ ${search.name} search failed:`, error.message);
        companyResults.searches.push({
          name: search.name,
          error: error.message,
          success: false
        });
      }

      // Rate limiting between searches
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Deduplicate combined people
    const uniquePeople = Array.from(
      new Map(companyResults.combinedPeople.map(p => [p.id, p])).values()
    );
    
    console.log(`\n📊 ${searchSet.company} Combined Results:`);
    console.log(`   👥 Total Unique People: ${uniquePeople.length}`);
    
    // Analyze combined results
    const roleDistribution = {};
    const titleDistribution = {};
    
    uniquePeople.forEach(person => {
      roleDistribution[person.role] = (roleDistribution[person.role] || 0) + 1;
      
      const title = person.title.toLowerCase();
      if (title.includes('ceo') || title.includes('president')) {
        titleDistribution['C-Level'] = (titleDistribution['C-Level'] || 0) + 1;
      } else if (title.includes('cfo') || title.includes('cto') || title.includes('coo') || title.includes('cmo') || title.includes('chro')) {
        titleDistribution['C-Level'] = (titleDistribution['C-Level'] || 0) + 1;
      } else if (title.includes('vp') || title.includes('vice president')) {
        titleDistribution['VP Level'] = (titleDistribution['VP Level'] || 0) + 1;
      } else if (title.includes('director') || title.includes('head of')) {
        titleDistribution['Director Level'] = (titleDistribution['Director Level'] || 0) + 1;
      } else if (title.includes('manager')) {
        titleDistribution['Manager Level'] = (titleDistribution['Manager Level'] || 0) + 1;
      } else {
        titleDistribution['Other'] = (titleDistribution['Other'] || 0) + 1;
      }
    });
    
    console.log(`   🎭 Role Distribution:`);
    Object.entries(roleDistribution).forEach(([role, count]) => {
      console.log(`      ${role}: ${count}`);
    });
    
    console.log(`   📊 Seniority Distribution:`);
    Object.entries(titleDistribution).forEach(([level, count]) => {
      console.log(`      ${level}: ${count}`);
    });

    companyResults.combinedPeople = uniquePeople;
    allResults.push(companyResults);

    // Rate limiting between companies
    console.log('\n⏳ Waiting 5 seconds before next company...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Final Summary
  console.log('\n📊 MULTI-SEARCH BGI SUMMARY');
  console.log('============================');
  
  allResults.forEach(result => {
    console.log(`\n${result.company} (${result.seller}):`);
    console.log(`  Total Unique People: ${result.combinedPeople.length}`);
    console.log(`  Successful Searches: ${result.searches.filter(s => s.success).length}/${result.searches.length}`);
    
    // Identify perfect buyer group
    const perfectBuyerGroup = identifyPerfectBuyerGroup(result.combinedPeople, result.seller);
    console.log(`  🎯 Perfect Buyer Group: ${perfectBuyerGroup.length} people`);
    
    perfectBuyerGroup.forEach((person, index) => {
      console.log(`    ${index + 1}. ${person.name} - ${person.title} (${person.role})`);
    });
  });

  // Save multi-search results
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `bgi-multi-search-${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(allResults, null, 2));
  console.log(`\n💾 Multi-search results saved to: ${filename}`);

  return allResults;
}

function identifyPerfectBuyerGroup(people, seller) {
  // Score and rank people for perfect buyer group
  const scoredPeople = people.map(person => {
    let score = 0;
    const title = person.title.toLowerCase();
    const role = person.role;
    
    // Base score from role
    if (role === 'Decision Maker') score += 100;
    else if (role === 'Champion') score += 80;
    else if (role === 'Stakeholder') score += 60;
    else if (role === 'Introducer') score += 40;
    else if (role === 'Blocker') score += 20;
    
    // Seller-specific scoring
    if (seller === 'SBI Growth') {
      if (title.includes('revenue') || title.includes('sales') || title.includes('growth')) score += 50;
      if (title.includes('ceo') || title.includes('president') || title.includes('cfo') || title.includes('cro')) score += 40;
      if (title.includes('vp') && (title.includes('sales') || title.includes('revenue') || title.includes('marketing'))) score += 30;
    } else if (seller === 'Absorb') {
      if (title.includes('learning') || title.includes('training') || title.includes('education')) score += 50;
      if (title.includes('hr') || title.includes('human resources') || title.includes('talent')) score += 40;
      if (title.includes('cto') || title.includes('technology') || title.includes('engineering')) score += 30;
    }
    
    // Seniority bonus
    if (title.includes('ceo') || title.includes('president')) score += 30;
    else if (title.includes('cfo') || title.includes('cto') || title.includes('coo') || title.includes('cmo')) score += 25;
    else if (title.includes('vp') || title.includes('vice president')) score += 20;
    else if (title.includes('director') || title.includes('head of')) score += 15;
    
    return { ...person, relevanceScore: score };
  });
  
  // Sort by relevance and return top 12 (perfect buyer group size)
  return scoredPeople
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 12);
}

// Run the multi-search
if (require.main === module) {
  runMultiSearchBGI()
    .then(results => {
      console.log('\n🎉 Multi-Search BGI Complete!');
      console.log('🎯 Maximum coverage achieved for both companies');
      console.log('📊 Perfect buyer groups identified with comprehensive data');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Multi-Search BGI Failed:', error);
      process.exit(1);
    });
}

module.exports = { runMultiSearchBGI };
