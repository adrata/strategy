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
import { invoke } from "@tauri-apps/api/core";
import { MobileAuthService } from "@/platform/services/mobile-auth-service";

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
    console.log("🔐 [AUTH] Has Capacitor:", typeof window !== "undefined" ? !!(window as any).Capacitor : false);
    console.log("🔐 [AUTH] Has Tauri:", typeof window !== "undefined" ? !!(window as any).__TAURI__ : false);

    try {
      if (platform === "desktop") {
        console.log("🖥️ [AUTH] Using desktop authentication...");
        return await this.desktopSignIn(email, password, deviceId);
      }

      if (platform === "mobile") {
        console.log("📱 [AUTH] Using mobile authentication...");
        
        // Check if we're actually in a mobile environment
        const isActuallyMobile = typeof window !== "undefined" && 
          (window as any).Capacitor && 
          typeof (window as any).Capacitor['isNativePlatform'] === 'function' &&
          (window as any).Capacitor.isNativePlatform();
        
        if (!isActuallyMobile) {
          console.log("⚠️ [AUTH] Platform detected as mobile but not actually mobile, falling back to web auth");
          return await this.databaseSignIn(email, password, deviceId);
        }
        
        return await this.mobileSignIn(email, password, deviceId);
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
              Capacitor: !!(window as any).Capacitor,
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

  // Desktop Authentication (Tauri)
  private static async desktopSignIn(
    email: string,
    password: string,
    deviceId: string,
  ): Promise<AuthResult> {
    console.log("🖥️ [DESKTOP AUTH] Starting Tauri authentication");
    console.log("🖥️ [DESKTOP AUTH] VERSION:", AUTH_CONFIG.version);
    console.log("🖥️ [DESKTOP AUTH] Raw inputs:");
    console.log("  - Email/Username:", JSON.stringify(email));
    console.log("  - Password length:", password.length, "characters");
    console.log("  - First char of password:", password.charAt(0));
    console.log("  - Device ID:", deviceId.substring(0, 10) + "...");

    try {
      console.log("🖥️ [DESKTOP AUTH] Step 1: Tauri environment check...");

      // Tauri environment validation
      if (typeof window === "undefined") {
        throw new Error("Window object not available - not in browser environment");
      }

      const tauriChecks = getTauriEnvironment();
      console.log("🖥️ [DESKTOP AUTH] Tauri Environment Analysis:", tauriChecks);

      // Check if any Tauri indicator is present
      if (!hasTauriIndicators(tauriChecks)) {
        const errorMsg = `Tauri environment not detected. Environment details: ${JSON.stringify(tauriChecks)}`;
        console.error("❌ [DESKTOP AUTH]", errorMsg);
        throw new Error(errorMsg + " - please ensure you are running in the desktop app");
      }

      console.log("✅ [DESKTOP AUTH] Tauri environment confirmed");
      console.log("🖥️ [DESKTOP AUTH] Step 2: Importing Tauri API...");

      // Use statically imported Tauri API
      console.log("✅ [DESKTOP AUTH] Tauri API imported successfully");

      // Clean and prepare the email
      const cleanEmail = email.toLowerCase().trim();
      console.log("🖥️ [DESKTOP AUTH] Step 3: Email normalization:");
      console.log("  - Original:", JSON.stringify(email));
      console.log("  - Cleaned:", JSON.stringify(cleanEmail));

      console.log("🖥️ [DESKTOP AUTH] Step 4: Calling authenticate_user_direct command...");
      console.log("🖥️ [DESKTOP AUTH] Command parameters:");
      console.log("  - email:", JSON.stringify(cleanEmail));
      console.log("  - password length:", password.length);

      const startTime = performance.now();
      console.log("🖥️ [DESKTOP AUTH] Invoking Tauri command at:", new Date().toISOString());

      const authResult = (await invoke("authenticate_user_direct", {
        email: cleanEmail,
        password,
      })) as any;

      const endTime = performance.now();
      console.log(
        "🖥️ [DESKTOP AUTH] Step 5: Command completed in",
        Math.round(endTime - startTime),
        "ms",
      );
      console.log("🖥️ [DESKTOP AUTH] Raw result type:", typeof authResult);
      console.log("🖥️ [DESKTOP AUTH] Raw result:", JSON.stringify(authResult, null, 2));

      if (authResult === null || authResult === undefined) {
        console.error("❌ [DESKTOP AUTH] Result is null/undefined - authentication failed");
        return {
          success: false,
          error: "Authentication failed - no result returned",
        };
      }

      if (authResult && authResult.id) {
        console.log("✅ [DESKTOP AUTH] Step 6: Authentication SUCCESSFUL!");
        console.log("✅ [DESKTOP AUTH] User details:");
        console.log("  - ID:", authResult.id);
        console.log("  - Name:", authResult.name);
        console.log("  - Email:", authResult.email);
        console.log("  - Workspace ID:", authResult.workspace_id);

        const userWorkspaces = authResult.workspaces || [];

        if (userWorkspaces['length'] === 0) {
          console.error("❌ [DESKTOP AUTH] No workspaces found for user - authentication failed");
          return {
            success: false,
            error: "No workspace access found for user",
          };
        }

        const session = createSession(
          {
            id: authResult.id,
            name: authResult.name,
            email: authResult.email,
            workspaces: userWorkspaces,
            lastSeen: new Date().toISOString(),
          },
          "desktop",
          deviceId,
        );

        console.log("✅ [DESKTOP AUTH] Step 7: Session created successfully");
        console.log("✅ [DESKTOP AUTH] Session object:", JSON.stringify(session, null, 2));

        // Store session
        console.log("💾 [DESKTOP AUTH] Step 8: Storing session...");
        await storeSession(session);
        console.log("✅ [DESKTOP AUTH] Session stored successfully");

        return { success: true, session };
      } else {
        console.log("❌ [DESKTOP AUTH] Step 6: Authentication FAILED - No user data in result");
        console.log("❌ [DESKTOP AUTH] Expected authResult.id but got:");
        console.log("  - authResult:", JSON.stringify(authResult, null, 2));
        console.log("  - authResult.id:", authResult?.id);
        console.log("  - Type of result:", typeof authResult);

        if (typeof authResult === "object" && authResult !== null) {
          console.log("  - Object keys:", Object.keys(authResult));
        }

        return {
          success: false,
          error: "Invalid credentials - user not found or password incorrect",
        };
      }
    } catch (error) {
      console.error("❌ [DESKTOP AUTH] Exception caught:");
      console.error("  - Error type:", typeof error);
      console.error("  - Error constructor:", error?.constructor?.name);
      console.error(
        "  - Error message:",
        error && typeof error === "object" && "message" in error
          ? (error as any).message
          : "No message",
      );
      console.error("  - Error string:", String(error));
      console.error(
        "  - Full error object:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      );

      if (error instanceof Error) {
        console.error("  - Stack trace:", error.stack);
      }

      return {
        success: false,
        error: `Desktop authentication failed: ${error}`,
      };
    }
  }

  // Mobile Authentication (Capacitor)
  private static async mobileSignIn(
    email: string,
    password: string,
    deviceId: string,
  ): Promise<AuthResult> {
    try {
      // Use statically imported MobileAuthService

      const authResult = await MobileAuthService.signIn(email, password);

      if (authResult['success'] && authResult.user) {
        const session = createSession(
          authResult.user,
          "mobile",
          deviceId,
          authResult.accessToken,
        );

        console.log("💾 [MOBILE AUTH] Storing session to localStorage...");
        await storeSession(session);
        console.log("✅ [MOBILE AUTH] Session stored successfully");

        return { success: true, session };
      } else {
        return {
          success: false,
          error: authResult.error || "Invalid credentials",
        };
      }
    } catch (error) {
      console.error("❌ Mobile authentication failed:", error);
      return { success: false, error: "Mobile authentication failed" };
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
        },
        {
          success: false,
          error: "Password reset request failed",
        },
      );

      if (response.success) {
        console.log("✅ [FORGOT PASSWORD] Reset request successful");
        return {
          success: true,
          message: (response as any).message || "If an account with that email exists, you will receive a password reset link.",
        };
      } else {
        console.log("❌ [FORGOT PASSWORD] Reset request failed:", response.error);
        return {
          success: false,
          error: response.error || "Password reset request failed",
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
        },
        {
          success: false,
          error: "Password reset failed",
        },
      );

      if (response.success) {
        console.log("✅ [RESET PASSWORD] Password reset successful");
        return {
          success: true,
          message: (response as any).message || "Password has been reset successfully.",
        };
      } else {
        console.log("❌ [RESET PASSWORD] Password reset failed:", response.error);
        return {
          success: false,
          error: response.error || "Password reset failed",
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
        },
        {
          success: false,
          error: "Token refresh failed",
          accessToken: "",
          refreshToken: "",
          expires: "",
        },
      );

      if (response.success) {
        console.log("✅ [TOKEN REFRESH] Token refresh successful");

        // Type-safe check for user property
        const data = response as any;
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
        console.log("❌ [TOKEN REFRESH] Token refresh failed:", response.error);
        return {
          success: false,
          error: response.error || "Token refresh failed",
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
        },
        {
          valid: false,
          error: "Token validation failed",
        },
      );

      if (response.valid) {
        console.log("✅ [VALIDATE TOKEN] Token is valid");
        return {
          success: true,
          message: "Token is valid",
          // Pass through additional data like email and expiry
          ...response,
        };
      } else {
        console.log("❌ [VALIDATE TOKEN] Token is invalid:", response.error);
        return {
          success: false,
          error: response.error || "Invalid or expired token",
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
