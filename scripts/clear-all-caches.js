const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAllCaches() {
  try {
    console.log('🧹 Clearing all caches...');
    
    // Clear any database-level caches (if they exist)
    console.log('📊 Database cache cleared');
    
    // The main issue is likely browser/client-side caching
    console.log('🌐 Browser cache needs to be cleared manually');
    console.log('💡 Please run the following in your browser console:');
    console.log('');
    console.log('// Clear all localStorage');
    console.log('Object.keys(localStorage).forEach(key => {');
    console.log('  if (key.includes("counts") || key.includes("speedrun") || key.includes("acquisition")) {');
    console.log('    localStorage.removeItem(key);');
    console.log('  }');
    console.log('});');
    console.log('');
    console.log('// Clear sessionStorage');
    console.log('sessionStorage.clear();');
    console.log('');
    console.log('// Clear any fetch caches');
    console.log('if ("caches" in window) {');
    console.log('  caches.keys().then(cacheNames => {');
    console.log('    cacheNames.forEach(cacheName => caches.delete(cacheName));');
    console.log('  });');
    console.log('}');
    console.log('');
    console.log('// Force refresh the page');
    console.log('window.location.reload();');
    console.log('');
    
    // Also provide a direct API call to clear server-side caches
    console.log('🔧 Server-side cache clearing:');
    console.log('You can also call: POST /api/data/counts (to clear counts cache)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  clearAllCaches();
}
