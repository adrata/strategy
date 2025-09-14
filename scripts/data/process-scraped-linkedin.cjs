const fs = require('fs');

console.log('🔍 PROCESSING SCRAPED LINKEDIN DATA');
console.log('===================================');
console.log('🎯 Target: Salesforce Solution Architect + nonprofit cloud + fundraising');
console.log('');

// Enhanced criteria for scraped LinkedIn data
const CRITERIA = {
  // Must have solution architect in position/headline
  solutionArchitect: [
    'solution architect',
    'solutions architect', 
    'technical architect',
    'system architect',
    'enterprise architect',
    'cloud architect',
    'salesforce architect',
    'crm architect'
  ],
  
  // Must have salesforce experience
  salesforce: [
    'salesforce',
    'sf cloud',
    'crm',
    'salesforce cloud',
    'salesforce crm',
    'sfdc',
    'force.com',
    'trailhead',
    'apex',
    'lightning'
  ],
  
  // Must have nonprofit OR fundraising experience
  nonprofitFundraising: [
    'nonprofit', 'non-profit', 'npo',
    'fundraising', 'fundraiser', 'fund raising',
    'nonprofit cloud', 'npo cloud',
    'charitable', 'charity', 'foundation',
    'grants', 'grant writing', 'donor',
    'volunteer management', 'community outreach',
    'social impact', 'social good',
    'education', 'university', 'school',
    'healthcare', 'hospital', 'medical',
    'religious', 'church', 'ministry'
  ]
};

function containsAny(text, keywords) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

function analyzeLinkedInProfile(profile) {
  // Combine all available text fields for comprehensive search
  const allText = [
    profile.name || profile.full_name || '',
    profile.headline || '',
    profile.current_position || profile.position || '',
    profile.current_company || profile.company || '',
    profile.location || '',
    profile.about || profile.summary || '',
    profile.experience || '',
    profile.skills || '',
    profile.industry || ''
  ].join(' ').toLowerCase();
  
  const analysis = {
    isSolutionArchitect: containsAny(allText, CRITERIA.solutionArchitect),
    hasSalesforce: containsAny(allText, CRITERIA.salesforce),
    hasNonprofitFundraising: containsAny(allText, CRITERIA.nonprofitFundraising),
    score: 0
  };
  
  // Calculate match score with bonuses
  if (analysis.isSolutionArchitect) analysis.score += 40;
  if (analysis.hasSalesforce) analysis.score += 35;
  if (analysis.hasNonprofitFundraising) analysis.score += 25;
  
  // Bonus points for exact matches
  if (allText.includes('salesforce solution architect')) analysis.score += 10;
  if (allText.includes('nonprofit cloud')) analysis.score += 10;
  if (allText.includes('fundraising')) analysis.score += 5;
  
  analysis.isPerfectMatch = analysis.isSolutionArchitect && 
                          analysis.hasSalesforce && 
                          analysis.hasNonprofitFundraising;
  
  analysis.isExcellentMatch = analysis.score >= 80; // High score
  analysis.isGoodMatch = analysis.score >= 60; // At least 2 out of 3 criteria
  analysis.isPartialMatch = analysis.score >= 35; // At least 1 strong criteria
  
  return analysis;
}

function parseScrapedData(filePath) {
  console.log(`📂 Reading: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  File not found: ${filePath}`);
    return [];
  }
  
  let data;
  try {
    if (filePath.endsWith('.json')) {
      const content = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(content);
    } else if (filePath.endsWith('.csv')) {
      // Parse CSV
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const profile = {};
        headers.forEach((header, index) => {
          profile[header] = values[index] || '';
        });
        data.push(profile);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error parsing file: ${error.message}`);
    return [];
  }
  
  // Handle different data structures
  if (Array.isArray(data)) {
    console.log(`   📊 Found ${data.length} profiles`);
    return data;
  } else if (data.data && Array.isArray(data.data)) {
    console.log(`   📊 Found ${data.data.length} profiles`);
    return data.data;
  } else if (data.results && Array.isArray(data.results)) {
    console.log(`   📊 Found ${data.results.length} profiles`);
    return data.results;
  } else {
    console.log(`   ⚠️  Unexpected data structure`);
    return [];
  }
}

function processScrapedFiles() {
  // Look for scraped data files
  const possibleFiles = [
    'linkedin_scraped.json',
    'linkedin_scraped.csv',
    'salesforce_architect_nonprofit.json',
    'salesforce_architect_fundraising.json',
    'solution_architect_nonprofit_cloud.json',
    // Add any other files you download from the scraper
  ];
  
  let allProfiles = [];
  let perfectMatches = [];
  let excellentMatches = [];
  let goodMatches = [];
  let partialMatches = [];
  
  console.log('📁 PROCESSING SCRAPED FILES:');
  console.log('============================');
  
  possibleFiles.forEach(filename => {
    const profiles = parseScrapedData(filename);
    
    profiles.forEach(profile => {
      const analysis = analyzeLinkedInProfile(profile);
      
      const candidate = {
        ...profile,
        analysis,
        source: filename
      };
      
      allProfiles.push(candidate);
      
      if (analysis.isPerfectMatch) {
        perfectMatches.push(candidate);
      } else if (analysis.isExcellentMatch) {
        excellentMatches.push(candidate);
      } else if (analysis.isGoodMatch) {
        goodMatches.push(candidate);
      } else if (analysis.isPartialMatch) {
        partialMatches.push(candidate);
      }
    });
  });
  
  // Remove duplicates based on LinkedIn URL or name
  function removeDuplicates(candidates) {
    const seen = new Set();
    return candidates.filter(candidate => {
      const key = candidate.profile_url || candidate.linkedin_url || 
                  candidate.url || candidate.name || candidate.full_name;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  perfectMatches = removeDuplicates(perfectMatches);
  excellentMatches = removeDuplicates(excellentMatches);
  goodMatches = removeDuplicates(goodMatches);
  
  console.log('\n🎯 ANALYSIS RESULTS:');
  console.log('===================');
  console.log(`📊 Total profiles analyzed: ${allProfiles.length}`);
  console.log(`🏆 Perfect matches (ALL 3 criteria): ${perfectMatches.length}`);
  console.log(`⭐ Excellent matches (high score): ${excellentMatches.length}`);
  console.log(`✅ Good matches (2+ criteria): ${goodMatches.length}`);
  console.log(`🔍 Partial matches (1+ criteria): ${partialMatches.length}`);
  console.log('');
  
  // Show perfect matches
  if (perfectMatches.length > 0) {
    console.log('🏆 PERFECT MATCHES (CloudCaddie targets):');
    console.log('=========================================');
    
    perfectMatches.slice(0, 20).forEach((candidate, index) => {
      console.log(`${index + 1}. ${candidate.name || candidate.full_name}`);
      console.log(`   Headline: ${candidate.headline || 'N/A'}`);
      console.log(`   Company: ${candidate.current_company || candidate.company || 'N/A'}`);
      console.log(`   Location: ${candidate.location || 'N/A'}`);
      console.log(`   LinkedIn: ${candidate.profile_url || candidate.linkedin_url || candidate.url || 'N/A'}`);
      console.log(`   Score: ${candidate.analysis.score}/100`);
      console.log(`   Source: ${candidate.source}`);
      console.log('');
    });
    
    if (perfectMatches.length > 20) {
      console.log(`   ... and ${perfectMatches.length - 20} more perfect matches!`);
    }
  }
  
  // Show excellent matches if needed
  if (excellentMatches.length > 0 && perfectMatches.length < 10) {
    console.log('⭐ EXCELLENT MATCHES (backup targets):');
    console.log('=====================================');
    
    excellentMatches
      .sort((a, b) => b.analysis.score - a.analysis.score)
      .slice(0, 10)
      .forEach((candidate, index) => {
        console.log(`${index + 1}. ${candidate.name || candidate.full_name} (Score: ${candidate.analysis.score}/100)`);
        console.log(`   Headline: ${candidate.headline || 'N/A'}`);
        console.log(`   Missing: ${!candidate.analysis.isSolutionArchitect ? 'Solution Architect ' : ''}${!candidate.analysis.hasSalesforce ? 'Salesforce ' : ''}${!candidate.analysis.hasNonprofitFundraising ? 'Nonprofit/Fundraising' : ''}`);
        console.log('');
      });
  }
  
  // Save results
  if (perfectMatches.length > 0) {
    fs.writeFileSync('perfect_matches_linkedin.json', JSON.stringify(perfectMatches, null, 2));
    console.log('💾 Perfect matches saved to: perfect_matches_linkedin.json');
  }
  
  if (excellentMatches.length > 0) {
    fs.writeFileSync('excellent_matches_linkedin.json', JSON.stringify(excellentMatches, null, 2));
    console.log('💾 Excellent matches saved to: excellent_matches_linkedin.json');
  }
  
  // Export contact list for CloudCaddie
  const contactList = perfectMatches.concat(excellentMatches.slice(0, 50 - perfectMatches.length));
  if (contactList.length > 0) {
    const exportData = contactList.map(candidate => ({
      name: candidate.name || candidate.full_name,
      headline: candidate.headline,
      company: candidate.current_company || candidate.company,
      location: candidate.location,
      linkedin_url: candidate.profile_url || candidate.linkedin_url || candidate.url,
      score: candidate.analysis.score,
      match_type: candidate.analysis.isPerfectMatch ? 'Perfect' : 'Excellent',
      criteria_met: {
        solution_architect: candidate.analysis.isSolutionArchitect,
        salesforce: candidate.analysis.hasSalesforce,
        nonprofit_fundraising: candidate.analysis.hasNonprofitFundraising
      }
    }));
    
    fs.writeFileSync('cloudcaddie_recruitment_targets.json', JSON.stringify(exportData, null, 2));
    console.log('🎯 CloudCaddie targets saved to: cloudcaddie_recruitment_targets.json');
  }
  
  console.log('\n📈 SUCCESS SUMMARY:');
  console.log('==================');
  console.log(`🎯 CloudCaddie recruitment targets: ${contactList.length}`);
  console.log(`📊 Success rate: ${((perfectMatches.length / allProfiles.length) * 100).toFixed(1)}%`);
  
  if (perfectMatches.length >= 25) {
    console.log('🎉 EXCELLENT! You have 25+ perfect candidates!');
  } else if (perfectMatches.length >= 10) {
    console.log('✅ GOOD! You have 10+ qualified candidates to start with!');
  } else if (perfectMatches.length >= 5) {
    console.log('👍 DECENT! You have 5+ candidates - may need more data');
  } else {
    console.log('💡 Need more data - try additional search URLs or broader criteria');
  }
  
  return { perfectMatches, excellentMatches, goodMatches };
}

// Auto-run if files exist, otherwise show instructions
const hasFiles = ['linkedin_scraped.json', 'linkedin_scraped.csv'].some(f => fs.existsSync(f));

if (hasFiles) {
  console.log('📁 Found scraped files - processing automatically...');
  processScrapedFiles();
} else {
  console.log('📋 INSTRUCTIONS:');
  console.log('================');
  console.log('1. Use the LinkedIn search URLs from linkedin-search-urls.js');
  console.log('2. Run the Brightdata web scraper');
  console.log('3. Download results as JSON or CSV');
  console.log('4. Save files in this directory with names like:');
  console.log('   - linkedin_scraped.json');
  console.log('   - salesforce_architect_nonprofit.json');
  console.log('   - etc.');
  console.log('5. Run this script again to process the results');
  console.log('');
  console.log('💡 The script will automatically find and process your scraped data!');
} 