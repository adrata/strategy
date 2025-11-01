/**
 * Authentication Service
 * Core authentication service with multi-platform support
 */

import type { AuthResult, UnifiedSession } from "./types";
import {
  getPlatform,
  getDeviceId,
  getPlatformConfig,
  getTauriEnvironment,
  hasTauriIndicators,
} from "./platform";
import {
  storeSession,
  createSession,
  AUTH_CONFIG,
  getSession as getStoredSession,
} from "./session";
import { AUTH_API_ROUTES } from "./routes";
// Removed safeApiFetch import - using standard fetch

// Unified Auth Service
export class UnifiedAuthService {
  // Get Current Session
  static async getSession(): Promise<UnifiedSession | null> {
    try {
      return await getStoredSession();
    } catch (error) {
      console.error("❌ [AUTH SERVICE] Failed to get session:", error);
      return null;
    }
  }

  // Core Authentication
  static async signIn(email: string, password: string, rememberMe: boolean = false): Promise<AuthResult> {
    const platform = getPlatform();
    const config = getPlatformConfig();
    const deviceId = getDeviceId();

    console.log("🔐 [AUTH] Starting signIn for platform:", platform);
    console.log("🔐 [AUTH] Email:", email);
    console.log("🔐 [AUTH] Config:", config);
    console.log("🔐 [AUTH] Window location:", typeof window !== "undefined" ? window.location.href : "server");
    console.log("🔐 [AUTH] Has Tauri:", typeof window !== "undefined" ? !!(window as any).__TAURI__ : false);

    try {
      if (platform === "desktop") {
        console.log("🖥️ [AUTH] Using desktop authentication...");
        return await this.desktopSignIn(email, password, deviceId);
      }

      if (platform === "web") {
        console.log("🌐 [AUTH] Using web authentication...");
        return await this.databaseSignIn(email, password, deviceId, rememberMe);
      }

      // Platform detection failed
      console.error("❌ [AUTH] Unknown platform detected:", platform);
      console.error("❌ [AUTH] Platform config:", config);
      console.error(
        "❌ [AUTH] Window object:",
        typeof window !== "undefined"
          ? {
              protocol: window.location.protocol,
              href: window.location.href,
              __TAURI__: !!(window as any).__TAURI__,
              __TAURI_METADATA__: !!(window as any).__TAURI_METADATA__,
              __TAURI_INTERNALS__: !!(window as any).__TAURI_INTERNALS__,
            }
          : "undefined",
      );

      // Fallback to web authentication if platform detection fails
      console.log("🔄 [AUTH] Falling back to web authentication due to platform detection failure");
      return await this.databaseSignIn(email, password, deviceId);
    } catch (error) {
      console.error("❌ [AUTH] Authentication failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      };
    }
  }

  // Desktop Authentication (Online-only - uses backend API)
  private static async desktopSignIn(
    email: string,
    password: string,
    deviceId: string,
  ): Promise<AuthResult> {
    console.log("🖥️ [DESKTOP AUTH] Starting online authentication");
    console.log("🖥️ [DESKTOP AUTH] Using backend API (online-only mode)");
    console.log("  - Email:", email);
    console.log("  - Device ID:", deviceId.substring(0, 10) + "...");

    try {
      // Desktop app authenticates against backend API (same as web)
      // Get API base URL for desktop
      const { getAPIBaseURL } = await import('../../lib/desktop-config');
      const apiBaseUrl = getAPIBaseURL();
      const signInUrl = `${apiBaseUrl}/auth/sign-in`;

      console.log("🖥️ [DESKTOP AUTH] Calling backend API:", signInUrl);

      const response = await fetch(signInUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          platform: "desktop",
          deviceId,
          rememberMe: false,
        }),
        credentials: "include",
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const text = await response.text();
        console.error('❌ [DESKTOP AUTH] Backend API returned error:', response.status, text);
        return {
          success: false,
          error: response.status === 401 
            ? "Invalid credentials" 
            : "Authentication failed - please check your connection"
        };
      }

      const data = await response.json();

      if (!data.success) {
        console.error('❌ [DESKTOP AUTH] Backend API returned error:', data.error);
        return {
          success: false,
          error: data.error || "Invalid credentials",
        };
      }

      // Type-safe check for user property
      if (!data.user) {
        console.error('❌ [DESKTOP AUTH] No user data in response');
        return { success: false, error: "Authentication failed" };
      }

      console.log("✅ [DESKTOP AUTH] Authentication successful!");
      console.log("  - User ID:", data.user.id);
      console.log("  - Email:", data.user.email);

      const session = createSession(
        data.user,
        "desktop",
        deviceId,
        data.accessToken,
        data.refreshToken,
        data.rememberMe,
      );

      // Override expires if provided by server
      if (data.expires) {
        session['expires'] = data.expires;
      }

      console.log("💾 [DESKTOP AUTH] Storing session...");
      await storeSession(session);
      console.log("✅ [DESKTOP AUTH] Session stored successfully");

      // Include platform routing information if provided
      const authResult: AuthResult = { success: true, session };
      if (data.platformRoute) {
        authResult['platformRoute'] = data.platformRoute;
        authResult['redirectTo'] = data.redirectTo;
        console.log("🎯 [DESKTOP AUTH] Platform route included:", data.redirectTo);
      }

      return authResult;
    } catch (error) {
      console.error("❌ [DESKTOP AUTH] Authentication failed:", error);
      
      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          return { 
            success: false, 
            error: "Network error - please check your internet connection and try again" 
          };
        } else if (error.message.includes("500")) {
          return { success: false, error: "Server error - please try again later" };
        } else if (error.message.includes("401")) {
          return { success: false, error: "Invalid credentials" };
        }
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Authentication failed - please try again" 
      };
    }
  }

  // Database Authentication (Web)
  private static async databaseSignIn(
    email: string,
    password: string,
    deviceId: string,
    rememberMe: boolean = false,
  ): Promise<AuthResult> {
    try {
      const response = await fetch(
        AUTH_API_ROUTES.SIGN_IN,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            platform: getPlatform(),
            deviceId,
            rememberMe,
          }),
          credentials: "include",
        }
      );

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const text = await response.text();
        console.error('Auth API returned error:', response.status, text);
        return {
          success: false,
          error: response.status === 401 
            ? "Invalid credentials" 
            : "Authentication failed - please try again"
        };
      }

      const data = await response.json();

      if (!data.success) {
        return {
          success: false,
          error: data.error || "Invalid credentials",
        };
      }

      // Type-safe check for user property
      if (!data.user) {
        return { success: false, error: "Authentication failed" };
      }

      const session = createSession(
        data.user,
        "web",
        deviceId,
        data.accessToken,
        data.refreshToken,
        data.rememberMe,
      );

      // Override expires if provided by server
      if (data.expires) {
        session['expires'] = data.expires;
      }

      console.log("💾 [WEB AUTH] Storing session to localStorage...");
      await storeSession(session);
      console.log("✅ [WEB AUTH] Session stored successfully");

      // Include platform routing information if provided
      const authResult: AuthResult = { success: true, session };
      if (data.platformRoute) {
        authResult['platformRoute'] = data.platformRoute;
        authResult['redirectTo'] = data.redirectTo;
        console.log("🎯 [WEB AUTH] Platform route included:", data.redirectTo);
      }

      return authResult;
    } catch (error) {
      console.error("❌ Database auth failed:", error);
      
      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes("500")) {
          return { success: false, error: "Server error - please try again" };
        } else if (error.message.includes("401")) {
          return { success: false, error: "Invalid credentials" };
        } else if (error.message.includes("403")) {
          return { success: false, error: "Access denied" };
        } else if (error.message.includes("Network")) {
          return { success: false, error: "Network error - please check your connection" };
        }
      }
      
      return { success: false, error: "Authentication failed - please try again" };
    }
  }

  // Password Reset - Request Reset Email
  static async forgotPassword(email: string): Promise<AuthResult> {
    console.log("🔐 [FORGOT PASSWORD] Requesting password reset for:", email);

    try {
      const response = await fetch(
        AUTH_API_ROUTES.FORGOT_PASSWORD,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const text = await response.text();
        console.error('Forgot password API returned error:', response.status, text);
        return {
          success: false,
          error: "Password reset request failed"
        };
      }

      const data = await response.json();

      if (data.success) {
        console.log("✅ [FORGOT PASSWORD] Reset request successful");
        return {
          success: true,
          message: data.message || "If an account with that email exists, you will receive a password reset link.",
        };
      } else {
        console.log("❌ [FORGOT PASSWORD] Reset request failed:", data.error);
        return {
          success: false,
          error: data.error || "Password reset request failed",
        };
      }
    } catch (error) {
      console.error("❌ [FORGOT PASSWORD] Network error:", error);
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  }

  // Password Reset - Reset with Token
  static async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    console.log("🔐 [RESET PASSWORD] Resetting password with token");

    try {
      const response = await fetch(
        AUTH_API_ROUTES.RESET_PASSWORD,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        }
      );

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const text = await response.text();
        console.error('Reset password API returned error:', response.status, text);
        return {
          success: false,
          error: "Password reset failed"
        };
      }

      const data = await response.json();

      if (data.success) {
        console.log("✅ [RESET PASSWORD] Password reset successful");
        return {
          success: true,
          message: data.message || "Password has been reset successfully.",
        };
      } else {
        console.log("❌ [RESET PASSWORD] Password reset failed:", data.error);
        return {
          success: false,
          error: data.error || "Password reset failed",
        };
      }
    } catch (error) {
      console.error("❌ [RESET PASSWORD] Network error:", error);
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  }

  // Token Refresh
  static async refreshToken(): Promise<AuthResult> {
    console.log("🔄 [TOKEN REFRESH] Refreshing authentication token");

    try {
      const currentSession = await getStoredSession();
      if (!currentSession?.refreshToken) {
        console.log("❌ [TOKEN REFRESH] No refresh token available");
        return {
          success: false,
          error: "No refresh token available",
        };
      }

      const response = await fetch(
        AUTH_API_ROUTES.REFRESH_TOKEN,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: currentSession.refreshToken }),
          credentials: "include",
        }
      );

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const text = await response.text();
        console.error('Token refresh API returned error:', response.status, text);
        return {
          success: false,
          error: "Token refresh failed"
        };
      }

      const data = await response.json();

      if (data.success) {
        console.log("✅ [TOKEN REFRESH] Token refresh successful");

        // Type-safe check for user property
        if (!data.user) {
          return { success: false, error: "Token refresh failed" };
        }

        const platform = getPlatform();
        const deviceId = getDeviceId();

        const session = createSession(
          data.user,
          platform,
          deviceId,
          data.accessToken,
          data.refreshToken,
        );

        // Override expires if provided by server
        if (data.expires) {
          session['expires'] = data.expires;
        }

        console.log("💾 [TOKEN REFRESH] Storing refreshed session...");
        await storeSession(session);
        console.log("✅ [TOKEN REFRESH] Refreshed session stored successfully");

        return { success: true, session };
      } else {
        const errorData = await response.json().catch(() => ({ error: "Token refresh failed" }));
        console.log("❌ [TOKEN REFRESH] Token refresh failed:", errorData);
        return {
          success: false,
          error: (errorData as any).error || "Token refresh failed",
        };
      }
    } catch (error) {
      console.error("❌ [TOKEN REFRESH] Network error:", error);
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  }

  // Validate Reset Token (for UI)
  static async validateResetToken(token: string): Promise<AuthResult> {
    console.log("🔐 [VALIDATE TOKEN] Validating reset token");

    try {
      const response = await fetch(
        `${AUTH_API_ROUTES.RESET_PASSWORD}?token=${encodeURIComponent(token)}`,
        {
          method: "GET",
        }
      );

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const text = await response.text();
        console.error('Token validation API returned error:', response.status, text);
        return {
          success: false,
          error: "Token validation failed"
        };
      }

      const data = await response.json();

      if (data.valid) {
        console.log("✅ [VALIDATE TOKEN] Token is valid");
        return {
          success: true,
          message: "Token is valid",
          // Pass through additional data like email and expiry
          ...data,
        };
      } else {
        console.log("❌ [VALIDATE TOKEN] Token is invalid:", (data as any).error);
        return {
          success: false,
          error: data.error || "Invalid or expired token",
        };
      }
    } catch (error) {
      console.error("❌ [VALIDATE TOKEN] Network error:", error);
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  }
}
