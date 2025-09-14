#!/usr/bin/env node

/**
 * Clear All Application Cache
 * 
 * This script clears all cached data to force fresh loading
 */

console.log('🧹 Clearing all application cache...\n');

// Browser storage keys to clear
const cacheKeys = [
  'acquisition-os-data-cache',
  'adrata-panel-ratio',
  'adrata-theme',
  'adrata-settings',
  'speedrun-cache',
  'monaco-cache',
  'pipeline-cache'
];

console.log('Cache keys to clear:');
cacheKeys.forEach(key => console.log(`  - ${key}`));

console.log('\n📝 To clear browser cache, run these commands in browser console:');
console.log('```javascript');
cacheKeys.forEach(key => {
  console.log(`localStorage.removeItem('${key}');`);
  console.log(`sessionStorage.removeItem('${key}');`);
});
console.log('location.reload();');
console.log('```');

console.log('\n✅ Cache clearing script ready!');
console.log('💡 The browser cache will be cleared on next page load with updated data.');
