import { UnifiedAuthService } from "./auth-unified";
import { isDesktop } from "./platform-detection";

interface AuthFetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Desktop-safe authenticated fetch that automatically includes UnifiedAuth session data
 */
export async function authFetch(
  url: string,
  options: AuthFetchOptions = {},
): Promise<Response> {
  // TEMPORARILY DISABLED: Mock responses for desktop mode
  // TODO: Re-enable with proper platform detection
  // if (isDesktop()) {
  //   // For /api/ routes, return mock authenticated responses
  //   // EXCEPT for data operations and Ross-Dan chat which need real data
  //   if (url.startsWith("/api/") && 
  //       !url.includes("/api/chat/ross-dan") &&
  //       !url.includes("/api/data/")) {
  //     const mockData = {
  //       user: { id: "1", name: "Desktop User", email: "user@adrata.com" },
  //       status: "success",
  //       message: "Desktop mode - mock authenticated response",
  //     };

  //     return new Response(JSON.stringify(mockData), {
  //       status: 200,
  //       statusText: "OK",
  //       headers: { "Content-Type": "application/json" },
  //     });
  //   }
  // }

  // Web mode - normal authenticated fetch
  const session = await UnifiedAuthService.getSession();
  console.log("🔐 [AUTH-FETCH] Session retrieved:", {
    hasSession: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    activeWorkspaceId: session?.user?.activeWorkspaceId,
    hasAccessToken: !!session?.accessToken
  });

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add authentication if available
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
    console.log("🔐 [AUTH-FETCH] Authorization header added");
  } else {
    console.log("⚠️ [AUTH-FETCH] No access token available - request will be unauthenticated");
  }

  // Also set session as cookie for compatibility
  if (session && typeof document !== "undefined") {
    // Set the session cookie so the backend can read it
    const sessionString = JSON.stringify(session);
    document['cookie'] = `adrata_unified_session=${encodeURIComponent(sessionString)}; path=/; SameSite=Lax`;
    console.log("🔐 [AUTH-FETCH] Set session cookie for backend compatibility");
  }

  console.log("🔐 [AUTH-FETCH] Making fetch request with headers:", {
    hasAuth: !!headers["Authorization"],
    contentType: headers["Content-Type"],
    credentials: "include",
  });

  return fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
}
