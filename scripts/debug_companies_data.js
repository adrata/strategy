// Simple script to test the companies API directly
async function testCompaniesAPI() {
  try {
    console.log('🔍 Testing companies API...');
    
    const response = await fetch('/api/data/unified?type=companies&workspaceId=01K1VBYXHD0J895XAN0HGFBKJP&userId=01K1VBYZMWTCT09FWEKBDMCXZM');
    const result = await response.json();
    
    if (result.success && result.data) {
      const companies = result.data;
      console.log(`📊 Total companies from API: ${companies.length}`);
      
      // Check ranks
      const ranks = companies.map(c => c.rank).filter(r => r).sort((a, b) => a - b);
      console.log(`📈 Rank range: ${Math.min(...ranks)} to ${Math.max(...ranks)}`);
      console.log(`📈 First 10 ranks:`, ranks.slice(0, 10));
      console.log(`📈 Last 10 ranks:`, ranks.slice(-10));
      
      // Check for rank patterns
      const first30 = companies.filter(c => c.rank && c.rank <= 30).sort((a, b) => a.rank - b.rank);
      console.log(`🏢 First 30 companies by rank:`);
      first30.forEach(c => {
        console.log(`  ${c.rank}: ${c.name}`);
      });
      
      // Check for rank restart pattern
      const rankGroups = {};
      companies.forEach(c => {
        if (c.rank) {
          const group = Math.floor((c.rank - 1) / 25) * 25 + 1;
          if (!rankGroups[group]) rankGroups[group] = [];
          rankGroups[group].push(c);
        }
      });
      
      console.log(`🔄 Rank groups:`);
      Object.keys(rankGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(group => {
        const groupCompanies = rankGroups[group];
        console.log(`  Group ${group}: ${groupCompanies.length} companies (ranks ${groupCompanies[0].rank}-${groupCompanies[groupCompanies.length-1].rank})`);
      });
      
    } else {
      console.error('❌ API call failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error testing companies API:', error);
  }
}

// Run the test
testCompaniesAPI();
