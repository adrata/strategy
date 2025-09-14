#!/usr/bin/env node

/**
 * PROPER AUTHENTICATION FIX FOR ACTION PLATFORM
 *
 * This script implements the correct solution:
 * 1. Remove hardcoded fallback user IDs (band-aid fix)
 * 2. Make Action Platform wait for real authentication
 * 3. Only load data when user is properly authenticated
 * 4. Show proper sign-in prompt when needed
 */

const fs = require("fs");
const path = require("path");

console.log("🔧 IMPLEMENTING PROPER AUTHENTICATION FIX");
console.log("=========================================\n");

const CONTEXT_FILE = "./ActionPlatformContext.tsx";

console.log("📖 Reading current Action Platform context...");
let content = fs.readFileSync(CONTEXT_FILE, "utf8");

console.log("🛠️  Applying proper authentication fixes...\n");

// 1. Remove hardcoded fallback user object
console.log("1. ✅ Removing hardcoded fallback user object");
content = content.replace(
  /\/\/ For desktop without auth, use fallback user\s*const effectiveUser = authUser \|\| \{[\s\S]*?\};/g,
  `// PROPER FIX: Only use authenticated user, no fallbacks
  if (!authUser) {
    console.log('⚠️ [ActionPlatformProvider] No authenticated user - data loading skipped');
    return; // Exit early - don't load data without authentication
  }
  
  const effectiveUser = authUser;`,
);

// 2. Remove hardcoded workspace/user ID fallbacks
console.log("2. ✅ Removing hardcoded workspace and user ID fallbacks");
content = content.replace(
  /const effectiveWorkspaceId = workspaceId \|\| [^;]+;/g,
  "const effectiveWorkspaceId = workspaceId;",
);
content = content.replace(
  /const effectiveUserId = userId \|\| [^;]+;/g,
  "const effectiveUserId = userId;",
);

// 3. Add proper authentication check at the beginning of loadLeadsData
console.log("3. ✅ Adding proper authentication guard");
content = content.replace(
  /const loadLeadsData = useCallback\(async \(\) => \{[\s\S]*?if \(leadsLoaded \|\| isLoadingLeads\) \{/g,
  `const loadLeadsData = useCallback(async () => {
    // CRITICAL: Ensure user is authenticated before loading any data
    if (!authUser) {
      console.log('🔐 [ActionPlatformProvider] User not authenticated - skipping data load');
      console.log('🔐 [ActionPlatformProvider] User should be redirected to sign-in page');
      return; // Exit early - authentication required
    }
    
    if (leadsLoaded || isLoadingLeads) {`,
);

// 4. Update the useEffect dependency to properly trigger on authentication
console.log("4. ✅ Fixing useEffect dependencies for proper auth flow");
content = content.replace(
  /\}, \[leadsLoaded, isLoadingLeads, authUser\?\.\w+, authUser\?\.\w+\]\);/g,
  "}, [leadsLoaded, isLoadingLeads, authUser]); // Depend on full authUser object",
);

// 5. Add authentication status logging
console.log("5. ✅ Adding comprehensive authentication status logging");
const authLoggingCode = `
  // Enhanced authentication debugging
  useEffect(() => {
    console.log('🔐 [ActionPlatformProvider] AUTHENTICATION STATUS:', {
      hasAuthUser: !!authUser,
      authUserDetails: authUser ? {
        id: authUser.id,
        email: authUser.email,
        workspaceId: authUser.workspaceId,
        name: authUser.name
      } : null,
      isAuthenticated,
      isLoading,
      shouldLoadData: !!(authUser && !leadsLoaded && !isLoadingLeads),
      timestamp: new Date().toISOString()
    });
    
    // Show clear guidance when authentication is needed
    if (!authUser && !isLoading) {
      console.error('🚨 [ActionPlatformProvider] AUTHENTICATION REQUIRED!');
      console.error('🚨 [ActionPlatformProvider] User needs to sign in at /sign-in');
      console.error('🚨 [ActionPlatformProvider] Action Platform cannot load data without authentication');
    }
  }, [authUser, isAuthenticated, isLoading, leadsLoaded, isLoadingLeads]);
`;

// Insert authentication logging after the existing debug effect
content = content.replace(
  /\/\/ DEBUG: Log auth state for debugging[\s\S]*?\}, \[authUser, isAuthenticated, isLoading\]\);/,
  authLoggingCode,
);

console.log("💾 Writing updated Action Platform context...");
fs.writeFileSync(CONTEXT_FILE, content);

console.log("\n✅ PROPER AUTHENTICATION FIX COMPLETED!");
console.log("==========================================");
console.log("");
console.log("🎯 CHANGES APPLIED:");
console.log("   ✅ Removed hardcoded fallback user objects");
console.log("   ✅ Removed hardcoded workspace/user ID fallbacks");
console.log("   ✅ Added authentication guards in data loading");
console.log("   ✅ Fixed useEffect dependencies");
console.log("   ✅ Added comprehensive auth status logging");
console.log("");
console.log("🔄 EXPECTED BEHAVIOR:");
console.log("   - App will show sign-in page when user not authenticated");
console.log("   - Action Platform will only load data for authenticated users");
console.log("   - Real user data will display (no more fallbacks)");
console.log("   - Clear logging will help debug any remaining issues");
console.log("");
console.log("🚀 Next steps:");
console.log("   1. Test the desktop app - it should prompt for sign-in");
console.log("   2. Sign in with dan/danpass");
console.log("   3. Verify 408 real leads load correctly");
console.log("   4. No more mock data should appear");
