/**
 * 🎯 COMPREHENSIVE BGI SEARCH FOR PERFECT BUYER GROUPS
 * 
 * This script searches for MANY more people at both companies using CoreSignal
 * to ensure we have the absolute best buyer group with maximum confidence
 */

const fetch = require('node-fetch');

async function runComprehensiveBGISearch() {
  console.log('🎯 Starting Comprehensive BGI Search for Perfect Buyer Groups...\n');

  const baseUrl = 'http://localhost:3000';
  const endpoint = '/api/intelligence/buyer-group-bulk';

  // Comprehensive search requests with much higher limits
  const requests = [
    {
      name: 'Flexera',
      seller: 'SBI Growth',
      accounts: ['Flexera'],
      targetRoles: [
        // C-Level Executives
        'CEO', 'President', 'Chief Executive Officer',
        'CFO', 'Chief Financial Officer', 'VP Finance', 'Head of Finance',
        'CTO', 'Chief Technology Officer', 'VP Technology', 'Head of Technology',
        'COO', 'Chief Operating Officer', 'VP Operations', 'Head of Operations',
        'CRO', 'Chief Revenue Officer', 'VP Revenue', 'Head of Revenue',
        'CMO', 'Chief Marketing Officer', 'VP Marketing', 'Head of Marketing',
        'CHRO', 'Chief Human Resources Officer', 'VP HR', 'Head of HR',
        
        // Sales & Revenue Leadership
        'VP Sales', 'Head of Sales', 'Sales Director', 'Regional Sales Director',
        'VP Business Development', 'Head of Business Development', 'Business Development Director',
        'VP Customer Success', 'Head of Customer Success', 'Customer Success Director',
        'VP Partnerships', 'Head of Partnerships', 'Partnerships Director',
        'VP Channel Sales', 'Head of Channel Sales', 'Channel Sales Director',
        
        // Technology & Product Leadership
        'VP Product', 'Head of Product', 'Product Director', 'VP Engineering', 'Head of Engineering',
        'VP Data', 'Head of Data', 'Data Director', 'VP Analytics', 'Head of Analytics',
        'VP Security', 'Head of Security', 'Security Director', 'VP Infrastructure', 'Head of Infrastructure',
        
        // Operations & Strategy
        'VP Strategy', 'Head of Strategy', 'Strategy Director', 'VP Operations', 'Head of Operations',
        'VP Procurement', 'Head of Procurement', 'Procurement Director', 'VP Legal', 'Head of Legal',
        'VP Compliance', 'Head of Compliance', 'Compliance Director',
        
        // Regional & Business Unit Leaders
        'Regional Director', 'Country Manager', 'Business Unit Director', 'Division Director',
        'General Manager', 'Managing Director', 'Regional VP', 'Area Director'
      ],
      userId: '01K1VBYXHD0J895XAN0HGFBKJP',
      workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
      maxCollects: 100 // Much higher limit for comprehensive search
    },
    {
      name: 'athenahealth',
      seller: 'Absorb',
      accounts: ['athenahealth'],
      targetRoles: [
        // C-Level Executives
        'CEO', 'President', 'Chief Executive Officer',
        'CFO', 'Chief Financial Officer', 'VP Finance', 'Head of Finance',
        'CTO', 'Chief Technology Officer', 'VP Technology', 'Head of Technology',
        'COO', 'Chief Operating Officer', 'VP Operations', 'Head of Operations',
        'CRO', 'Chief Revenue Officer', 'VP Revenue', 'Head of Revenue',
        'CMO', 'Chief Marketing Officer', 'VP Marketing', 'Head of Marketing',
        'CHRO', 'Chief Human Resources Officer', 'VP HR', 'Head of HR',
        'Chief Medical Officer', 'VP Medical', 'Head of Medical',
        
        // Technology & Product Leadership (Critical for LMS)
        'VP Product', 'Head of Product', 'Product Director', 'VP Engineering', 'Head of Engineering',
        'VP Data', 'Head of Data', 'Data Director', 'VP Analytics', 'Head of Analytics',
        'VP Security', 'Head of Security', 'Security Director', 'VP Infrastructure', 'Head of Infrastructure',
        'VP Software Development', 'Head of Software Development', 'Software Development Director',
        'VP Quality Assurance', 'Head of Quality Assurance', 'QA Director',
        
        // Learning & Development (Critical for Absorb)
        'VP Learning', 'Head of Learning', 'Learning Director', 'VP Training', 'Head of Training',
        'VP Education', 'Head of Education', 'Education Director', 'VP Development', 'Head of Development',
        'VP Talent Development', 'Head of Talent Development', 'Talent Development Director',
        'VP Employee Experience', 'Head of Employee Experience', 'Employee Experience Director',
        'VP Onboarding', 'Head of Onboarding', 'Onboarding Director',
        
        // Operations & Strategy
        'VP Strategy', 'Head of Strategy', 'Strategy Director', 'VP Operations', 'Head of Operations',
        'VP Procurement', 'Head of Procurement', 'Procurement Director', 'VP Legal', 'Head of Legal',
        'VP Compliance', 'Head of Compliance', 'Compliance Director',
        'VP Customer Success', 'Head of Customer Success', 'Customer Success Director',
        
        // Regional & Business Unit Leaders
        'Regional Director', 'Country Manager', 'Business Unit Director', 'Division Director',
        'General Manager', 'Managing Director', 'Regional VP', 'Area Director'
      ],
      userId: '01K1VBYXHD0J895XAN0HGFBKJP',
      workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
      maxCollects: 100 // Much higher limit for comprehensive search
    }
  ];

  const results = [];

  for (const request of requests) {
    console.log(`\n🎯 Comprehensive Search: ${request.name} for ${request.seller}...`);
    console.log(`📊 Target Roles: ${request.targetRoles.length} different role types`);
    console.log(`🔍 Max Profiles: ${request.maxCollects} (comprehensive search)\n`);

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`✅ ${request.name} Comprehensive Search Complete:`);
      console.log(`   📈 Total People Found: ${data.summary.totalPeopleFound}`);
      console.log(`   🎯 Success Rate: ${data.summary.overallSuccessRate}%`);
      console.log(`   ⏱️  Processing Time: ${data.summary.processingTimeMs}ms`);
      console.log(`   💰 Estimated Cost: ${data.summary.costEstimate}`);
      
      // Log comprehensive buyer group details
      if (data.buyerGroups && data.buyerGroups.length > 0) {
        const buyerGroup = data.buyerGroups[0];
        console.log(`   👥 Total Buyer Group Size: ${buyerGroup.peopleCount}`);
        console.log(`   🔍 Search Time: ${buyerGroup.searchTime}ms`);
        
        // Analyze role distribution
        const people = buyerGroup.people || [];
        const roleDistribution = {};
        const titleDistribution = {};
        
        people.forEach(person => {
          roleDistribution[person.role] = (roleDistribution[person.role] || 0) + 1;
          
          // Extract seniority from title
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
        
        // Log top decision makers and champions
        const decisionMakers = people.filter(p => p.role === 'Decision Maker');
        const champions = people.filter(p => p.role === 'Champion');
        
        console.log(`   👑 Top Decision Makers:`);
        decisionMakers.slice(0, 3).forEach((person, index) => {
          console.log(`      ${index + 1}. ${person.name} - ${person.title}`);
        });
        
        console.log(`   🏆 Top Champions:`);
        champions.slice(0, 3).forEach((person, index) => {
          console.log(`      ${index + 1}. ${person.name} - ${person.title}`);
        });
      }

      results.push({
        company: request.name,
        seller: request.seller,
        data: data,
        success: true
      });

    } catch (error) {
      console.error(`❌ Error in comprehensive search for ${request.name}:`, error.message);
      results.push({
        company: request.name,
        seller: request.seller,
        error: error.message,
        success: false
      });
    }

    // Rate limiting between comprehensive searches
    console.log('\n⏳ Waiting 5 seconds before next comprehensive search...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Comprehensive Summary
  console.log('\n📊 COMPREHENSIVE BGI SEARCH SUMMARY');
  console.log('=====================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful Comprehensive Searches: ${successful.length}`);
  console.log(`❌ Failed Comprehensive Searches: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎯 COMPREHENSIVE BUYER GROUP RESULTS:');
    successful.forEach(result => {
      const data = result.data;
      console.log(`\n${result.company} (${result.seller}):`);
      console.log(`  Total People Found: ${data.summary.totalPeopleFound}`);
      console.log(`  Success Rate: ${data.summary.overallSuccessRate}%`);
      console.log(`  Cost: ${data.summary.costEstimate}`);
      
      if (data.buyerGroups && data.buyerGroups.length > 0) {
        const people = data.buyerGroups[0].people || [];
        const roles = {};
        people.forEach(person => {
          roles[person.role] = (roles[person.role] || 0) + 1;
        });
        
        console.log(`  Comprehensive Role Distribution:`);
        Object.entries(roles).forEach(([role, count]) => {
          console.log(`    ${role}: ${count}`);
        });
        
        // Identify perfect buyer group candidates
        const perfectCandidates = identifyPerfectBuyerGroupCandidates(people, result.seller);
        console.log(`  🎯 Perfect Buyer Group Candidates: ${perfectCandidates.length}`);
        perfectCandidates.slice(0, 5).forEach((person, index) => {
          console.log(`    ${index + 1}. ${person.name} - ${person.title} (${person.role})`);
        });
      }
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED COMPREHENSIVE SEARCHES:');
    failed.forEach(result => {
      console.log(`${result.company}: ${result.error}`);
    });
  }

  // Save comprehensive results
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `bgi-comprehensive-search-${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n💾 Comprehensive results saved to: ${filename}`);

  return results;
}

function identifyPerfectBuyerGroupCandidates(people, seller) {
  // Score each person based on their relevance to the seller
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
      // SBI Growth targets revenue/sales leadership
      if (title.includes('revenue') || title.includes('sales') || title.includes('growth')) score += 50;
      if (title.includes('ceo') || title.includes('president') || title.includes('cfo') || title.includes('cro')) score += 40;
      if (title.includes('vp') && (title.includes('sales') || title.includes('revenue') || title.includes('marketing'))) score += 30;
    } else if (seller === 'Absorb') {
      // Absorb targets learning/HR/technology leadership
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
  
  // Sort by relevance score and return top candidates
  return scoredPeople
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 15); // Top 15 most relevant candidates
}

// Run the comprehensive search
if (require.main === module) {
  runComprehensiveBGISearch()
    .then(results => {
      console.log('\n🎉 Comprehensive BGI Search Complete!');
      console.log('🎯 Both companies now have comprehensive buyer group intelligence');
      console.log('📊 Perfect buyer group candidates identified with maximum confidence');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Comprehensive BGI Search Failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveBGISearch };
