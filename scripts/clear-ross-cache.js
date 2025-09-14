#!/usr/bin/env node

/**
 * 🧹 CLEAR ROSS CACHE SCRIPT
 * Comprehensive cache clearing for data isolation issues
 */

console.log('🧹 CLEARING ALL CACHES FOR ROSS WORKSPACE');
console.log('=========================================');

// Clear server-side caches by restarting the process
console.log('\n🔄 SERVER-SIDE CACHE CLEARING:');
console.log('1. ✅ API response caches will be cleared on server restart');
console.log('2. ✅ Database query caches will be cleared on server restart');
console.log('3. ✅ Unified API caches will be cleared on server restart');

console.log('\n🌐 CLIENT-SIDE CACHE CLEARING INSTRUCTIONS:');
console.log('==========================================');
console.log('In your browser, execute this JavaScript in the console:');
console.log('');
console.log('```javascript');
console.log('// Clear all localStorage');
console.log('localStorage.clear();');
console.log('');
console.log('// Clear all sessionStorage');
console.log('sessionStorage.clear();');
console.log('');
console.log('// Clear specific cache keys');
console.log('const cacheKeys = [');
console.log('  "acquisition-os-data-cache",');
console.log('  "speedrun-data-cache",');
console.log('  "monaco-data-cache",');
console.log('  "pipeline-data-cache",');
console.log('  "unified-cache",');
console.log('  "smart-cache",');
console.log('  "api-cache"');
console.log('];');
console.log('');
console.log('cacheKeys.forEach(key => {');
console.log('  localStorage.removeItem(key);');
console.log('  sessionStorage.removeItem(key);');
console.log('  console.log("Cleared:", key);');
console.log('});');
console.log('');
console.log('// Force reload');
console.log('window.location.reload(true);');
console.log('```');

console.log('\n🔧 MANUAL STEPS:');
console.log('===============');
console.log('1. 🌐 Open browser DevTools (F12)');
console.log('2. 📝 Go to Console tab');
console.log('3. 📋 Copy and paste the JavaScript code above');
console.log('4. ⚡ Press Enter to execute');
console.log('5. 🔄 Browser will reload with cleared cache');
console.log('6. 🧪 Test Ross login - should see empty workspace');

console.log('\n✅ EXPECTED RESULT AFTER CACHE CLEAR:');
console.log('====================================');
console.log('Ross should see:');
console.log('  - 0 Leads');
console.log('  - 0 Prospects');
console.log('  - 0 Opportunities');
console.log('  - 0 Accounts');
console.log('  - Empty dashboards');
console.log('  - Clean workspace ready for setup');

console.log('\n🎯 TO GIVE ROSS DATA:');
console.log('====================');
console.log('Run this SQL to assign leads to Ross:');
console.log('');
console.log('```sql');
console.log('-- Assign some leads to Ross for testing');
console.log('UPDATE "Lead" ');
console.log('SET assignedUserId = \'01K1VBYZG41K9QA0D9CF06KNRG\'  -- Ross');
console.log('WHERE workspaceId = \'01K1VBYXHD0J895XAN0HGFBKJP\'   -- Adrata');
console.log('  AND assignedUserId IS NULL');
console.log('  AND id IN (');
console.log('    SELECT id FROM "Lead" ');
console.log('    WHERE workspaceId = \'01K1VBYXHD0J895XAN0HGFBKJP\'');
console.log('      AND assignedUserId IS NULL');
console.log('    LIMIT 5  -- Assign 5 leads for testing');
console.log('  );');
console.log('```');
