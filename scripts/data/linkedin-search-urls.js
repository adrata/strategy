// LinkedIn Search URLs for Brightdata Web Scraper
// Target: Salesforce Solution Architect + nonprofit cloud + fundraising

console.log('🔍 LINKEDIN SEARCH URLS FOR WEB SCRAPER');
console.log('======================================');
console.log('🎯 Use these URLs with "LinkedIn people search - collect by URL"');
console.log('');

const searchUrls = [
  {
    name: 'Salesforce Solution Architects with Nonprofit',
    description: 'Primary target - exact match for our criteria',
    url: 'https://www.linkedin.com/search/results/people/?keywords=salesforce%20solution%20architect%20nonprofit&origin=GLOBAL_SEARCH_HEADER&region=us%3A0',
    expectedResults: '50-200 profiles',
    priority: 'HIGH'
  },
  {
    name: 'Salesforce Architects + Fundraising',
    description: 'Alternative search focusing on fundraising experience',
    url: 'https://www.linkedin.com/search/results/people/?keywords=salesforce%20architect%20fundraising&origin=GLOBAL_SEARCH_HEADER&region=us%3A0',
    expectedResults: '30-150 profiles',
    priority: 'HIGH'
  },
  {
    name: 'Solution Architect + Nonprofit Cloud',
    description: 'Broader architect search with nonprofit cloud focus',
    url: 'https://www.linkedin.com/search/results/people/?keywords=solution%20architect%20nonprofit%20cloud&origin=GLOBAL_SEARCH_HEADER&region=us%3A0',
    expectedResults: '100-300 profiles',
    priority: 'MEDIUM'
  },
  {
    name: 'Salesforce + Charity + Technical',
    description: 'Alternative terms for nonprofit sector',
    url: 'https://www.linkedin.com/search/results/people/?keywords=salesforce%20charity%20technical%20architect&origin=GLOBAL_SEARCH_HEADER&region=us%3A0',
    expectedResults: '20-100 profiles',
    priority: 'MEDIUM'
  },
  {
    name: 'CRM Architect + Foundation',
    description: 'Broader CRM search with foundation experience',
    url: 'https://www.linkedin.com/search/results/people/?keywords=crm%20architect%20foundation%20salesforce&origin=GLOBAL_SEARCH_HEADER&region=us%3A0',
    expectedResults: '50-200 profiles',
    priority: 'MEDIUM'
  },
  {
    name: 'Salesforce Nonprofit Cloud Specialists',
    description: 'Specific product experience search',
    url: 'https://www.linkedin.com/search/results/people/?keywords=%22nonprofit%20cloud%22%20salesforce%20architect&origin=GLOBAL_SEARCH_HEADER&region=us%3A0',
    expectedResults: '10-50 profiles',
    priority: 'LOW'
  }
];

console.log('📋 SEARCH STRATEGY:');
console.log('===================');

searchUrls.forEach((search, index) => {
  console.log(`${index + 1}. ${search.name} (${search.priority} PRIORITY)`);
  console.log(`   📝 ${search.description}`);
  console.log(`   📊 Expected: ${search.expectedResults}`);
  console.log(`   🔗 URL: ${search.url}`);
  console.log('');
});

console.log('🚀 HOW TO USE WITH BRIGHTDATA WEB SCRAPER:');
console.log('==========================================');
console.log('1. Go to "LinkedIn people search - collect by URL"');
console.log('2. Copy/paste each URL above (start with HIGH priority)');
console.log('3. Set records limit: 100-500 per search');
console.log('4. Run scraper and download results');
console.log('5. Use our filtering script to find perfect matches');
console.log('');

console.log('💡 RECOMMENDED EXECUTION ORDER:');
console.log('===============================');
console.log('Start with these 2 HIGH priority searches:');
console.log('1. Salesforce Solution Architects with Nonprofit');
console.log('2. Salesforce Architects + Fundraising');
console.log('');
console.log('Expected total: 100-400 profiles to review');
console.log('Success rate estimate: 5-15% perfect matches = 5-60 candidates');
console.log('');

console.log('🎯 SUCCESS CRITERIA:');
console.log('====================');
console.log('✅ 25+ perfect matches = excellent results');
console.log('✅ 10-25 perfect matches = good results');  
console.log('✅ 5-10 perfect matches = acceptable start');
console.log('❌ <5 perfect matches = need broader search');

// Export for easy copy/paste
const urlList = searchUrls.map(s => s.url);
console.log('');
console.log('📋 COPY/PASTE URLS:');
console.log('==================');
urlList.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
}); 