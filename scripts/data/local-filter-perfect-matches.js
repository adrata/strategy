const fs = require('fs');
const path = require('path');

console.log('🔍 LOCAL FILTERING FOR PERFECT MATCHES');
console.log('======================================');
console.log('🎯 Target: Salesforce Solution Architect + nonprofit cloud + fundraising');
console.log('');

// Define our target criteria
const CRITERIA = {
  // Must have solution architect in position
  solutionArchitect: [
    'solution architect',
    'solutions architect', 
    'technical architect',
    'system architect'
  ],
  
  // Must have salesforce experience
  salesforce: [
    'salesforce',
    'sf cloud',
    'crm cloud',
    'salesforce cloud',
    'salesforce crm'
  ],
  
  // Must have nonprofit OR fundraising experience
  nonprofitFundraising: [
    'nonprofit', 'non-profit', 'npo',
    'fundraising', 'fundraiser', 'fund raising',
    'nonprofit cloud', 'npo cloud',
    'charitable', 'charity', 'foundation',
    'grants', 'grant writing', 'donor',
    'volunteer management', 'community outreach'
  ]
};

function containsAny(text, keywords) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

function analyzeCandidate(person) {
  // Combine all text fields for comprehensive search
  const allText = [
    person.position || '',
    person.experience || '',
    person.about || '',
    person.current_company_name || '',
    person.headline || ''
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
  
  return analysis;
}

function parseCSV(filePath) {
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
  
  const people = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      // Simple CSV parsing (assumes no commas in quoted fields for now)
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      
      const person = {};
      headers.forEach((header, index) => {
        person[header] = values[index] || '';
      });
      
      // Only include people with basic required fields
      if (person.full_name && (person.position || person.experience)) {
        people.push(person);
      }
    } catch (error) {
      console.log(`   ⚠️  Error parsing line ${i + 1}: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Parsed ${people.length} valid records`);
  return people;
}

function processDatasets() {
  const csvFiles = [
    'US_Solution_Architects.csv',
    'US_Salesforce_Professionals.csv', 
    'US_Nonprofit_Professionals.csv',
    'solution_architects.csv', // In case the simple search worked
    // Add any other CSV files you've downloaded
  ];
  
  let allCandidates = [];
  let perfectMatches = [];
  let goodMatches = [];
  
  console.log('📁 PROCESSING CSV FILES:');
  console.log('========================');
  
  csvFiles.forEach(filename => {
    const candidates = parseCSV(filename);
    
    candidates.forEach(person => {
      const analysis = analyzeCandidate(person);
      
      const candidate = {
        ...person,
        analysis,
        source: filename
      };
      
      allCandidates.push(candidate);
      
      if (analysis.isPerfectMatch) {
        perfectMatches.push(candidate);
      } else if (analysis.isGoodMatch) {
        goodMatches.push(candidate);
      }
    });
  });
  
  // Remove duplicates based on email or full name
  function removeDuplicates(candidates) {
    const seen = new Set();
    return candidates.filter(candidate => {
      const key = candidate.email || candidate.full_name || `${candidate.first_name}_${candidate.last_name}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  perfectMatches = removeDuplicates(perfectMatches);
  goodMatches = removeDuplicates(goodMatches);
  
  console.log('\n🎯 FILTERING RESULTS:');
  console.log('=====================');
  console.log(`📊 Total candidates processed: ${allCandidates.length}`);
  console.log(`🏆 Perfect matches (ALL 3 criteria): ${perfectMatches.length}`);
  console.log(`✅ Good matches (2+ criteria): ${goodMatches.length}`);
  console.log('');
  
  if (perfectMatches.length > 0) {
    console.log('🏆 PERFECT MATCHES:');
    console.log('===================');
    
    perfectMatches.slice(0, 10).forEach((candidate, index) => {
      console.log(`${index + 1}. ${candidate.full_name}`);
      console.log(`   Position: ${candidate.position || 'N/A'}`);
      console.log(`   Company: ${candidate.current_company_name || 'N/A'}`);
      console.log(`   Email: ${candidate.email || 'N/A'}`);
      console.log(`   Score: ${candidate.analysis.score}/100`);
      console.log(`   Source: ${candidate.source}`);
      console.log('');
    });
    
    if (perfectMatches.length > 10) {
      console.log(`   ... and ${perfectMatches.length - 10} more perfect matches!`);
    }
  }
  
  if (goodMatches.length > 0 && perfectMatches.length < 20) {
    console.log('✅ TOP GOOD MATCHES (for backup):');
    console.log('=================================');
    
    goodMatches
      .sort((a, b) => b.analysis.score - a.analysis.score)
      .slice(0, 5)
      .forEach((candidate, index) => {
        console.log(`${index + 1}. ${candidate.full_name} (Score: ${candidate.analysis.score}/100)`);
        console.log(`   Position: ${candidate.position || 'N/A'}`);
        console.log(`   Missing: ${!candidate.analysis.isSolutionArchitect ? 'Solution Architect ' : ''}${!candidate.analysis.hasSalesforce ? 'Salesforce ' : ''}${!candidate.analysis.hasNonprofitFundraising ? 'Nonprofit/Fundraising' : ''}`);
        console.log('');
      });
  }
  
  // Save results
  if (perfectMatches.length > 0) {
    const outputFile = 'perfect_matches.json';
    fs.writeFileSync(outputFile, JSON.stringify(perfectMatches, null, 2));
    console.log(`💾 Perfect matches saved to: ${outputFile}`);
  }
  
  if (goodMatches.length > 0) {
    const outputFile = 'good_matches.json';
    fs.writeFileSync(outputFile, JSON.stringify(goodMatches, null, 2));
    console.log(`💾 Good matches saved to: ${outputFile}`);
  }
  
  console.log('\n📈 SUMMARY:');
  console.log('===========');
  console.log(`🎯 Perfect Salesforce Solution Architects: ${perfectMatches.length}`);
  console.log(`✅ Good backup candidates: ${goodMatches.length}`);
  console.log(`📊 Success rate: ${((perfectMatches.length / allCandidates.length) * 100).toFixed(2)}%`);
  
  if (perfectMatches.length >= 500) {
    console.log('🎉 SUCCESS! You have 500+ perfect candidates for CloudCaddie recruitment!');
  } else if (perfectMatches.length + goodMatches.length >= 500) {
    console.log('✅ GOOD! You have 500+ total candidates (perfect + good matches)');
  } else {
    console.log(`💡 Need more data. Current total: ${perfectMatches.length + goodMatches.length}/500`);
    console.log('   Recommendation: Download more broad datasets and run again');
  }
}

// Run the filtering
processDatasets(); 