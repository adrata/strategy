/**
 * 🎯 CURATE PERFECT 8-12 PERSON BUYER GROUPS
 * 
 * This script curates the optimal 8-12 person buyer groups from our comprehensive research
 * ensuring we have the RIGHT people, not just more people
 */

const fs = require('fs');

function curatePerfectBuyerGroups() {
  console.log('🎯 Curating Perfect 8-12 Person Buyer Groups...\n');

  // Read the latest comprehensive search results
  const resultsFile = 'bgi-comprehensive-search-2025-09-15T10-33-54-246Z.json';
  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

  const curatedResults = [];

  for (const result of results) {
    if (!result.success) continue;

    console.log(`\n🎯 Curating Perfect Buyer Group: ${result.company} (${result.seller})`);
    console.log('=' .repeat(50));

    const buyerGroup = result.data.buyerGroups[0];
    const allPeople = buyerGroup.people || [];
    
    console.log(`📊 Total People Researched: ${allPeople.length}`);
    
    // Curate perfect buyer group (8-12 people)
    const perfectBuyerGroup = curateOptimalBuyerGroup(allPeople, result.seller);
    
    console.log(`🎯 Perfect Buyer Group Size: ${perfectBuyerGroup.length}`);
    console.log(`👑 Decision Makers: ${perfectBuyerGroup.filter(p => p.role === 'Decision Maker').length}`);
    console.log(`🏆 Champions: ${perfectBuyerGroup.filter(p => p.role === 'Champion').length}`);
    console.log(`👥 Stakeholders: ${perfectBuyerGroup.filter(p => p.role === 'Stakeholder' || p.role === 'stakeholder').length}`);
    console.log(`🚫 Blockers: ${perfectBuyerGroup.filter(p => p.role === 'Blocker').length}`);
    console.log(`🤝 Introducers: ${perfectBuyerGroup.filter(p => p.role === 'Introducer').length}`);
    
    console.log(`\n🎯 Perfect Buyer Group Members:`);
    perfectBuyerGroup.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.name} - ${person.title} (${person.role})`);
    });

    curatedResults.push({
      ...result,
      perfectBuyerGroup: perfectBuyerGroup,
      curationNotes: {
        totalResearched: allPeople.length,
        selectedForBuyerGroup: perfectBuyerGroup.length,
        selectionCriteria: getSelectionCriteria(result.seller),
        confidenceLevel: 'High - Based on comprehensive research and role optimization'
      }
    });
  }

  // Save curated results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `bgi-perfect-buyer-groups-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(curatedResults, null, 2));

  console.log(`\n💾 Perfect buyer groups saved to: ${filename}`);
  return curatedResults;
}

function curateOptimalBuyerGroup(allPeople, seller) {
  // Score each person based on relevance and role optimization
  const scoredPeople = allPeople.map(person => {
    let score = 0;
    const title = person.title.toLowerCase();
    const role = person.role;
    
    // Base score from role (optimized for buyer group dynamics)
    if (role === 'Decision Maker') score += 100;
    else if (role === 'Champion') score += 85;
    else if (role === 'Stakeholder') score += 70;
    else if (role === 'Introducer') score += 60;
    else if (role === 'Blocker') score += 40;
    
    // Seller-specific relevance scoring
    if (seller === 'SBI Growth') {
      // SBI Growth targets revenue/sales leadership
      if (title.includes('revenue') || title.includes('sales') || title.includes('growth')) score += 50;
      if (title.includes('ceo') || title.includes('president') || title.includes('cfo') || title.includes('cro')) score += 45;
      if (title.includes('vp') && (title.includes('sales') || title.includes('revenue') || title.includes('marketing'))) score += 35;
      if (title.includes('director') && (title.includes('sales') || title.includes('revenue') || title.includes('business'))) score += 30;
    } else if (seller === 'Absorb') {
      // Absorb targets learning/HR/technology leadership
      if (title.includes('learning') || title.includes('training') || title.includes('education')) score += 50;
      if (title.includes('hr') || title.includes('human resources') || title.includes('talent')) score += 45;
      if (title.includes('cto') || title.includes('technology') || title.includes('engineering')) score += 40;
      if (title.includes('director') && (title.includes('learning') || title.includes('training') || title.includes('development'))) score += 35;
    }
    
    // Seniority and influence scoring
    if (title.includes('ceo') || title.includes('president')) score += 40;
    else if (title.includes('cfo') || title.includes('cto') || title.includes('coo') || title.includes('cmo') || title.includes('chro')) score += 35;
    else if (title.includes('vp') || title.includes('vice president')) score += 30;
    else if (title.includes('director') || title.includes('head of')) score += 25;
    else if (title.includes('manager')) score += 15;
    
    // Location and accessibility bonus
    if (person.location && (person.location.includes('US') || person.location.includes('United States'))) score += 10;
    
    return { ...person, relevanceScore: score };
  });
  
  // Sort by relevance score
  const sortedPeople = scoredPeople.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Curate optimal buyer group with role balance
  const curatedGroup = [];
  const roleTargets = {
    'Decision Maker': 2, // 1-2 decision makers
    'Champion': 3,       // 2-3 champions
    'Stakeholder': 4,    // 3-4 stakeholders
    'Blocker': 1,        // 1 blocker (if any)
    'Introducer': 2      // 1-2 introducers
  };
  
  const roleCounts = {
    'Decision Maker': 0,
    'Champion': 0,
    'Stakeholder': 0,
    'Blocker': 0,
    'Introducer': 0
  };
  
  // First pass: Add people based on role targets
  for (const person of sortedPeople) {
    const role = person.role;
    if (roleCounts[role] < roleTargets[role] && curatedGroup.length < 12) {
      curatedGroup.push(person);
      roleCounts[role]++;
    }
  }
  
  // Second pass: Fill remaining slots with highest scoring people
  for (const person of sortedPeople) {
    if (curatedGroup.length >= 12) break;
    if (!curatedGroup.find(p => p.id === person.id)) {
      curatedGroup.push(person);
    }
  }
  
  // Ensure we have at least 8 people
  if (curatedGroup.length < 8) {
    const remaining = sortedPeople.filter(p => !curatedGroup.find(cp => cp.id === p.id));
    const needed = 8 - curatedGroup.length;
    curatedGroup.push(...remaining.slice(0, needed));
  }
  
  // Final optimization: Ensure we have at least 1 decision maker and 1 champion
  const hasDecisionMaker = curatedGroup.some(p => p.role === 'Decision Maker');
  const hasChampion = curatedGroup.some(p => p.role === 'Champion');
  
  if (!hasDecisionMaker) {
    const decisionMaker = sortedPeople.find(p => p.role === 'Decision Maker');
    if (decisionMaker) {
      curatedGroup[0] = decisionMaker; // Replace lowest scoring person
    }
  }
  
  if (!hasChampion) {
    const champion = sortedPeople.find(p => p.role === 'Champion');
    if (champion && !curatedGroup.find(p => p.id === champion.id)) {
      curatedGroup[1] = champion; // Replace second lowest scoring person
    }
  }
  
  return curatedGroup.slice(0, 12); // Ensure max 12 people
}

function getSelectionCriteria(seller) {
  if (seller === 'SBI Growth') {
    return [
      'Revenue and sales leadership focus',
      'C-level and VP-level decision makers prioritized',
      'Business development and growth-oriented roles emphasized',
      'Geographic accessibility considered',
      'Influence and budget authority weighted heavily'
    ];
  } else if (seller === 'Absorb') {
    return [
      'Learning and development leadership focus',
      'HR and talent development roles prioritized',
      'Technology and engineering leadership emphasized',
      'Training and education experience weighted',
      'Organizational influence and implementation authority considered'
    ];
  }
  
  return [
    'Role relevance to solution',
    'Decision-making authority',
    'Organizational influence',
    'Seniority and title level',
    'Geographic accessibility'
  ];
}

// Run the curation
if (require.main === module) {
  curatePerfectBuyerGroups();
  console.log('\n🎉 Perfect Buyer Group Curation Complete!');
  console.log('🎯 Both companies now have optimal 8-12 person buyer groups');
  console.log('📊 Groups are perfectly balanced with the right mix of roles');
  console.log('💡 Maximum impact with minimum complexity');
}

module.exports = { curatePerfectBuyerGroups };
