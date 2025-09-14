#!/usr/bin/env node

/**
 * 🧹 CLEAR DAN CACHE AND TEST PLATFORM ROUTING
 * Clears all cached data that might be causing Dan to see demo data instead of production routing
 */

console.log("🧹 CLEARING DAN CACHE AND TESTING PLATFORM ROUTING");
console.log("=================================================");
console.log("");

// Instructions for manual cache clearing
console.log("📋 MANUAL STEPS TO CLEAR CACHE:");
console.log("-------------------------------");
console.log("1. Open Chrome Dev Tools (F12)");
console.log("2. Go to Application tab");
console.log("3. Clear these storage items:");
console.log("   ✅ Local Storage → Clear All");
console.log("   ✅ Session Storage → Clear All");
console.log("   ✅ Cookies → Clear All");
console.log("4. Go to Network tab");
console.log("5. Check 'Disable cache'");
console.log("6. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)");
console.log("");

console.log("🎯 EXPECTED BEHAVIOR AFTER CACHE CLEAR:");
console.log("---------------------------------------");
console.log("✅ Login as dan/danpass should redirect to /aos");
console.log("✅ Console should show WorkspaceDataRouter logs:");
console.log("   🔍 WorkspaceDataRouter: Getting session...");
console.log("   🔍 WorkspaceDataRouter: User data: {id: '...', email: 'dan@adrata.com'}");
console.log("   🔍 WorkspaceDataRouter: Demo user checks: {finalIsDemo: false}");
console.log("   🔍 WorkspaceDataRouter: Final context: {isDemo: false, platformAccess: 'aos-full'}");
console.log("");

console.log("🔍 DEBUG COMMANDS TO RUN IN BROWSER CONSOLE:");
console.log("--------------------------------------------");
console.log(`
// Clear all data manually
localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

// Check current session
console.log("Current session:", localStorage.getItem('adrata_unified_session_v3'));

// Force page reload
location.reload();
`);

console.log("");
console.log("🚨 IF STILL SEEING DEMO DATA:");
console.log("-----------------------------");
console.log("1. Check for this log: '🌐 Monaco: Web mode - showing template companies and people'");
console.log("2. If you see it, the cached JavaScript is being used");
console.log("3. Try: Ctrl+F5 or Cmd+Shift+R for hard refresh");
console.log("4. Or close all browser tabs and restart browser");
console.log("");

console.log("✅ Script complete - follow manual steps above!"); 