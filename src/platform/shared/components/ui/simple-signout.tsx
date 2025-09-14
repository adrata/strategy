"use client";

import { useState } from "react";

export function SimpleSignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      console.log("🚪 Starting sign out process...");

      // Clear all local storage
      if (typeof window !== "undefined") {
        // Specifically clear speedrun engine settings for demo reset
        localStorage.removeItem('speedrun-engine-settings');
        console.log("🎯 Speedrun engine settings cleared for demo reset");
        
        localStorage.clear();
        sessionStorage.clear();
        console.log("✅ Local storage cleared");
      }

      // Try to clear any cookies
      if (typeof document !== "undefined") {
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document['cookie'] =
            name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
        console.log("✅ Cookies cleared");
      }

      // For desktop apps, just reload the window
      if (window['location']['protocol'] === "tauri:") {
        console.log("🖥️ Desktop mode: Reloading window...");
        window.location.reload();
      } else {
        // For web, always redirect to sign-in form
        const homeUrl = "/sign-in";
        
        console.log("🌐 Web mode: Redirecting to sign-in form");
        console.log("🔄 SimpleSignOut: Redirecting to:", homeUrl);
        window['location']['href'] = homeUrl;
      }
    } catch (error) {
      console.error("❌ Sign out error:", error);
      // Force reload as fallback
      window.location.reload();
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {isSigningOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
