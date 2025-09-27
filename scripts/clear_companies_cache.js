// Script to clear companies cache and test fresh data
async function clearCompaniesCache() {
  try {
    console.log('🧹 Clearing companies cache...');
    
    // Clear browser cache
    if (typeof window !== 'undefined') {
      // Clear localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('companies') || key.includes('unified') || key.includes('acquisition')) {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared localStorage key: ${key}`);
        }
      });
      
      // Clear sessionStorage
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.includes('companies') || key.includes('unified') || key.includes('acquisition')) {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Cleared sessionStorage key: ${key}`);
        }
      });
    }
    
    // Test API with cache busting
    const timestamp = Date.now();
    const response = await fetch(`/api/data/unified?type=companies&workspaceId=01K1VBYXHD0J895XAN0HGFBKJP&userId=01K1VBYZMWTCT09FWEKBDMCXZM&_t=${timestamp}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      const companies = result.data;
      console.log(`📊 Fresh companies data: ${companies.length} companies`);
      
      // Check ranks
      const ranks = companies.map(c => c.rank).filter(r => r).sort((a, b) => a - b);
      console.log(`📈 Rank range: ${Math.min(...ranks)} to ${Math.max(...ranks)}`);
      
      // Check for rank restart pattern
      const first30 = companies.filter(c => c.rank && c.rank <= 30).sort((a, b) => a.rank - b.rank);
      console.log(`🏢 First 30 companies by rank:`);
      first30.forEach(c => {
        console.log(`  ${c.rank}: ${c.name}`);
      });
      
      // Check for rank groups
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
    console.error('❌ Error clearing cache:', error);
  }
}

// Run the cache clearing
clearCompaniesCache();
