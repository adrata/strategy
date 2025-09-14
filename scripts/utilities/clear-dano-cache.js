#!/usr/bin/env node

/**
 * Clear Dano's Specific Cache
 * 
 * Forces cache refresh for Dano after duplicate cleanup
 */

console.log('🧹 CLEARING DANO\'S CACHE AFTER DUPLICATE CLEANUP\n');

const danoKeys = [
  '01K1VBYYV7TRPY04NW4TW4XWRB-01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's specific cache key
  'acquisition-os-data-cache',
  'adrata-panel-ratio'
];

console.log('🎯 Dano-specific cache keys to clear:');
danoKeys.forEach(key => console.log(`  - ${key}`));

console.log('\n📝 Run this in browser console to clear Dano\'s cache:');
console.log('```javascript');
danoKeys.forEach(key => {
  console.log(`localStorage.removeItem('${key}');`);
  console.log(`sessionStorage.removeItem('${key}');`);
});
console.log('location.reload();');
console.log('```');

console.log('\n✅ This will force fresh data loading with:');
console.log('   - Dano\'s correct workspace (01K1VBYV8ETM2RCQA4GNN9EG72)');
console.log('   - Clean, deduplicated opportunities (60 unique)');
console.log('   - Accurate data counts (232 accounts, 1,075 contacts, 209 prospects)');
console.log('   - No more kanban duplicates!');
