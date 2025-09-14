// Desktop Authentication Bypass for Development
// Automatically authenticates as 'dan' user on desktop platform

export interface DesktopUser {
  id: string;
  name: string;
  email: string;
  workspaceId: string;
}

export function createDesktopSession(): any {
  const session = {
    user: {
      id: "dan",
      name: "Dan Mirolli",
      email: "dan@adrata.com",
      workspaceId: "adrata",
      deviceId: "desktop-auto",
      lastSeen: new Date().toISOString(),
    },
    accessToken: undefined,
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
    lastActivity: new Date().toISOString(),
    platform: "desktop",
    deviceId: "desktop-auto",
    syncEnabled: true,
  };

  // Store session
  if (typeof window !== "undefined") {
    localStorage.setItem("adrata_unified_session_v3", JSON.stringify(session));
    console.log("✅ [DESKTOP BYPASS] Auto-authenticated as dan");
  }

  return session;
}

export function isDesktopPlatform(): boolean {
  return (
    typeof window !== "undefined" &&
    (!!(window as any).__TAURI__ ||
      !!(window as any).__TAURI_METADATA__ ||
      !!(window as any).__TAURI_INTERNALS__ ||
      (window as any).location?.protocol === "tauri:" ||
      process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true")
  );
}

export function ensureDesktopAuth(): void {
  if (!isDesktopPlatform()) return;

  const stored = localStorage.getItem("adrata_unified_session_v3");
  if (!stored) {
    console.log(
      "🖥️ [DESKTOP BYPASS] No session found, creating auto-login session...",
    );
    createDesktopSession();
  }
}
