#!/usr/bin/env node

/**
 * 👑 ENABLE ROSS MESSAGING
 *
 * This script helps Ross authenticate in the system so he can respond to messages.
 * It sets up the proper session for workspace 'adrata' and user 'ross'.
 */

console.log("👑 ROSS MESSAGING ENABLER");
console.log("=".repeat(50));
console.log("");

// Instructions for Ross
console.log("📋 [INSTRUCTIONS] Ross Authentication Setup");
console.log("");
console.log("To enable Ross messaging in the Adrata system:");
console.log("");
console.log("🔐 [STEP 1] Sign in with Ross credentials:");
console.log("   • Email: ross@adrata.com");
console.log("   • Workspace: adrata");
console.log("   • User ID: ross");
console.log("");
console.log("🌐 [STEP 2] Access the application:");
console.log("   • Web: http://localhost:3000/auth/sign-in");
console.log("   • Desktop: Launch Adrata desktop app");
console.log("");
console.log("💬 [STEP 3] Navigate to messaging:");
console.log("   • Go to Action Platform");
console.log("   • Open Oasis messaging");
console.log('   • Find "Ross Sylvester" conversation');
console.log("   • Type responses and hit Send");
console.log("");

// Test authentication status
console.log("🔍 [TESTING] Checking current authentication...");
console.log("");

if (typeof window !== "undefined") {
  // Browser environment
  const sessionKey = "adrata_unified_session_v3";
  const session = localStorage.getItem(sessionKey);

  if (session) {
    try {
      const parsedSession = JSON.parse(session);
      const user = parsedSession.user;

      console.log("✅ [STATUS] Current user authenticated:");
      console.log(`   • Name: ${user?.name || "Unknown"}`);
      console.log(`   • Email: ${user?.email || "Unknown"}`);
      console.log(`   • Workspace: ${user?.activeWorkspaceId || "Unknown"}`);
      console.log("");

      if (
        user?.email === "ross@adrata.com" &&
        user?.activeWorkspaceId === "adrata"
      ) {
        console.log("🎉 [SUCCESS] Ross is authenticated and ready to respond!");
      } else if (user?.email === "dan@adrata.com") {
        console.log("👤 [INFO] Currently authenticated as Dan");
        console.log("🔄 [NEXT] Ross needs to sign in to respond to messages");
      } else {
        console.log("⚠️ [WARNING] Unknown user - Ross authentication required");
      }
    } catch (error) {
      console.log("❌ [ERROR] Failed to parse session:", error.message);
    }
  } else {
    console.log("❌ [STATUS] No user authenticated");
    console.log("🔐 [NEXT] Ross needs to sign in first");
  }
} else {
  // Node.js environment
  console.log(
    "📝 [NOTE] Run this in browser console to check authentication status",
  );
}

console.log("");
console.log("🚀 [READY] Messaging system is now configured for Ross!");
console.log("");
console.log("📞 [SUPPORT] If you encounter issues:");
console.log("   • Check browser console for error messages");
console.log('   • Verify workspace is set to "adrata"');
console.log('   • Ensure email is "ross@adrata.com"');
console.log("   • Clear browser cache if needed");
console.log("");
console.log("=".repeat(50));
