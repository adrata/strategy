// Simple script to clear cache and force refresh
// Run this in browser console to clear all pipeline caches

// Clear localStorage cache
const workspaceId = 'your-workspace-id'; // Replace with actual workspace ID
const sections = ['leads', 'prospects', 'people', 'companies', 'speedrun'];

sections.forEach(section => {
  const storageKey = `adrata-${section}-${workspaceId}`;
  localStorage.removeItem(storageKey);
  console.log(`Cleared localStorage cache for ${section}: ${storageKey}`);
});

// Set force refresh flags
sections.forEach(section => {
  const flag = `force-refresh-${section}`;
  sessionStorage.setItem(flag, 'true');
  console.log(`Set force refresh flag for ${section}: ${flag}`);
});

console.log('Cache cleared! Refresh the page to see changes.');
