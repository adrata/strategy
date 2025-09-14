const fs = require('fs');

console.log('🔍 FILTERING EXISTING LEAD DATA');
console.log('===============================');
console.log('🎯 Target: Salesforce Solution Architect + nonprofit cloud + fundraising');
console.log('📂 Data source: ../../data/raw/lead-data-full.csv');
console.log('');

// Define our target criteria (adapted for lead data structure)
const CRITERIA = {
  // Must have solution architect in title
  solutionArchitect: [
    'solution architect',
    'solutions architect', 
    'technical architect',
    'system architect',
    'enterprise architect',
    'cloud architect'
  ],
  
  // Must have salesforce experience
  salesforce: [
    'salesforce',
    'sf ',
    'crm',
    'salesforce cloud',
    'salesforce crm'
  ],
  
  // Must have nonprofit OR fundraising experience (look in company names too)
  nonprofitFundraising: [
    'nonprofit', 'non-profit', 'npo',
    'fundraising', 'fundraiser', 'fund raising',
    'charitable', 'charity', 'foundation',
    'grants', 'grant', 'donor',
    'community', 'social impact',
    'education', 'university', 'school'
  ]
};

function containsAny(text, keywords) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

function analyzeCandidate(person) {
  // Combine relevant text fields for comprehensive search
  const allText = [
    person.Title || '',
    person.role || '',
    person.company || '',
    person.name || ''
  ].join(' ').toLowerCase();
  
  const analysis = {
    isSolutionArchitect: containsAny(allText, CRITERIA.solutionArchitect),
    hasSalesforce: containsAny(allText, CRITERIA.salesforce),
    hasNonprofitFundraising: containsAny(allText, CRITERIA.nonprofitFundraising),
    score: 0
  };
  
  // Calculate match score
  if (analysis.isSolutionArchitect) analysis.score += 40;
  if (analysis.hasSalesforce) analysis.score += 35;
  if (analysis.hasNonprofitFundraising) analysis.score += 25;
  
  analysis.isPerfectMatch = analysis.isSolutionArchitect && 
                          analysis.hasSalesforce && 
                          analysis.hasNonprofitFundraising;
  
  analysis.isGoodMatch = analysis.score >= 60; // At least 2 out of 3 criteria
  analysis.isPartialMatch = analysis.score >= 35; // At least 1 strong criteria
  
  return analysis;
}

function parseLeadCSV(filePath) {
  console.log(`📂 Reading: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  File not found: ${filePath}`);
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.log(`   ⚠️  Empty file: ${filePath}`);
    return [];
  }
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  console.log(`   📊 Found ${lines.length - 1} records with ${headers.length} fields`);
  
  const leads = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      // More robust CSV parsing for complex data
      const line = lines[i];
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add the last value
      
      const person = {};
      headers.forEach((header, index) => {
        person[header] = values[index] || '';
      });
      
      // Only include people with basic required fields
      if (person.name && person.Title) {
        leads.push(person);
      }
    } catch (error) {
      console.log(`   ⚠️  Error parsing line ${i + 1}: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Parsed ${leads.length} valid records`);
  return leads;
}

function filterLeads() {
  const leads = parseLeadCSV('../../data/raw/lead-data-full.csv');
  
  let perfectMatches = [];
  let goodMatches = [];
  let partialMatches = [];
  
  console.log('\n🔍 ANALYZING LEADS:');
  console.log('===================');
  
  leads.forEach(person => {
    const analysis = analyzeCandidate(person);
    
    const candidate = {
      ...person,
      analysis
    };
    
    if (analysis.isPerfectMatch) {
      perfectMatches.push(candidate);
    } else if (analysis.isGoodMatch) {
      goodMatches.push(candidate);
    } else if (analysis.isPartialMatch) {
      partialMatches.push(candidate);
    }
  });
  
  console.log(`📊 Total leads analyzed: ${leads.length}`);
  console.log(`🏆 Perfect matches (ALL 3 criteria): ${perfectMatches.length}`);
  console.log(`✅ Good matches (2+ criteria): ${goodMatches.length}`);
  console.log(`🔍 Partial matches (1+ criteria): ${partialMatches.length}`);
  console.log('');
  
  // Show perfect matches
  if (perfectMatches.length > 0) {
    console.log('🏆 PERFECT MATCHES:');
    console.log('===================');
    
    perfectMatches.forEach((candidate, index) => {
      console.log(`${index + 1}. ${candidate.name}`);
      console.log(`   Title: ${candidate.Title}`);
      console.log(`   Company: ${candidate.company}`);
      console.log(`   Email: ${candidate.Email || 'N/A'}`);
      console.log(`   LinkedIn: ${candidate['Person Linkedin Url'] || 'N/A'}`);
      console.log(`   Score: ${candidate.analysis.score}/100`);
      console.log('');
    });
  } else {
    console.log('❌ No perfect matches found in current dataset');
  }
  
  // Show good matches if no perfect matches
  if (goodMatches.length > 0 && perfectMatches.length < 5) {
    console.log('✅ GOOD MATCHES (for backup):');
    console.log('=============================');
    
    goodMatches
      .sort((a, b) => b.analysis.score - a.analysis.score)
      .slice(0, 10)
      .forEach((candidate, index) => {
        console.log(`${index + 1}. ${candidate.name} (Score: ${candidate.analysis.score}/100)`);
        console.log(`   Title: ${candidate.Title}`);
        console.log(`   Company: ${candidate.company}`);
        console.log(`   Missing: ${!candidate.analysis.isSolutionArchitect ? 'Solution Architect ' : ''}${!candidate.analysis.hasSalesforce ? 'Salesforce ' : ''}${!candidate.analysis.hasNonprofitFundraising ? 'Nonprofit/Fundraising' : ''}`);
        console.log('');
      });
  }
  
  // Show breakdown for insights
  console.log('📈 CRITERIA BREAKDOWN:');
  console.log('======================');
  
  const architectCount = leads.filter(l => analyzeCandidate(l).isSolutionArchitect).length;
  const salesforceCount = leads.filter(l => analyzeCandidate(l).hasSalesforce).length;
  const nonprofitCount = leads.filter(l => analyzeCandidate(l).hasNonprofitFundraising).length;
  
  console.log(`🏗️  Solution Architects: ${architectCount} (${(architectCount/leads.length*100).toFixed(1)}%)`);
  console.log(`⚡ Salesforce Experience: ${salesforceCount} (${(salesforceCount/leads.length*100).toFixed(1)}%)`);
  console.log(`🤝 Nonprofit/Fundraising: ${nonprofitCount} (${(nonprofitCount/leads.length*100).toFixed(1)}%)`);
  
  // Save results
  if (perfectMatches.length > 0) {
    fs.writeFileSync('perfect_matches_leads.json', JSON.stringify(perfectMatches, null, 2));
    console.log('\n💾 Perfect matches saved to: perfect_matches_leads.json');
  }
  
  if (goodMatches.length > 0) {
    fs.writeFileSync('good_matches_leads.json', JSON.stringify(goodMatches, null, 2));
    console.log('💾 Good matches saved to: good_matches_leads.json');
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('==============');
  if (perfectMatches.length + goodMatches.length >= 10) {
    console.log('✅ Found enough candidates to start CloudCaddie recruitment!');
  } else {
    console.log('💡 Need to expand dataset:');
    console.log('   1. Fix Brightdata API issues');
    console.log('   2. Import additional LinkedIn data');
    console.log('   3. Use alternative data sources');
    console.log('   4. Broaden search criteria');
  }
  
  return { perfectMatches, goodMatches, partialMatches };
}

// Run the filtering
filterLeads(); 