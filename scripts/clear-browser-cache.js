// Browser Console Script for Ross
// Copy and paste this into the browser console to clear workspace cache

console.log('🧹 Clearing Adrata workspace cache...');

// Clear all localStorage entries related to Adrata
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (
    key.startsWith('adrata-fast-counts-') ||
    key.includes('notary-everyday') ||
    key.includes('01K7DNYR5VZ7JY36KGKKN76XZ1') // Notary Everyday workspace ID
  )) {
    keysToRemove.push(key);
  }
}

// Remove the identified keys
keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ Removed: ${key}`);
});

console.log(`🧹 Cleared ${keysToRemove.length} cache entries`);
console.log('🔄 Please refresh the page (Ctrl+F5 or Cmd+Shift+R) to see Adrata workspace data');

// Alternative: Clear all localStorage (uncomment if needed)
// localStorage.clear();
// console.log('🧹 Cleared all localStorage');
