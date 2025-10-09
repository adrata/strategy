"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUnifiedAuth } from "@/platform/auth-unified";
import { getCommonShortcut } from "@/platform/utils/keyboard-shortcuts";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { signIn: authSignIn } = useUnifiedAuth();

  // Optimized platform detection and logout cleanup (logging removed for performance)
  useEffect(() => {
    // Handle Command+Enter keyboard shortcut
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isLoading && email && password) {
          handleSubmit(event as any);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [email, password, isLoading]);

  useEffect(() => {

    // CRITICAL: Ensure we're on the correct domain before anything else
    if (typeof window !== "undefined") {
      // 🆕 ENVIRONMENT-AWARE: Allow staging and production domains
      const currentHostname = window.location.hostname;
      const isProduction = currentHostname === "action.adrata.com";
      const isLocalhost = currentHostname === "localhost" || currentHostname === "127.0.0.1";
      const isStaging = currentHostname.includes("vercel.app") || currentHostname.includes("adrata-git");
      
      // Only redirect if we're on an unrecognized domain
      if (!isProduction && !isLocalhost && !isStaging) {
        console.log("🔄 [SIGN-IN PAGE] Unrecognized domain detected:", currentHostname);
        console.log("🔄 [SIGN-IN PAGE] Redirecting to production domain: action.adrata.com");
        const correctUrl = `https://action.adrata.com/sign-in${window.location.search}`;
        console.log("🔄 [SIGN-IN PAGE] Full redirect URL:", correctUrl);
        window['location']['href'] = correctUrl;
        return;
      }
      
      // Debug logs removed for production

      // Check if this was a logout redirect
      const urlParams = new URLSearchParams(window.location.search);
      const isLogoutRedirect =
        urlParams.get("logout") || urlParams.get("emergency");

      if (isLogoutRedirect) {
        // Logout redirect detected - completing cleanup
      }

      // Clear all logout flags to allow fresh sign-in
      sessionStorage.removeItem("adrata_signed_out");
      sessionStorage.removeItem("adrata_emergency_logout");
      sessionStorage.removeItem("adrata_logout_timestamp");
      localStorage.removeItem("adrata_logout_initiated");
      localStorage.removeItem("adrata_logout_active");
      localStorage.removeItem("adrata_logout_session_id");

      // Check for auto-login only if this is NOT a logout redirect
      if (!isLogoutRedirect) {
        // Load remember me preference from cookies
        const savedRememberMe = document.cookie
          .split("; ")
          .find((row) => row.startsWith("adrata_remember_me="))
          ?.split("=")[1] === "true";
        
        const savedEmail = localStorage.getItem("adrata_remembered_email");
        const savedPassword = localStorage.getItem("adrata_remembered_password");
        
        if (savedRememberMe && savedEmail && savedPassword) {
          setEmail(savedEmail);
          setRememberMe(true);
          
          // Auto-login after a brief delay to allow state to update
          setTimeout(async () => {
            setIsLoading(true);
            
            try {
              const result = await authSignIn(savedEmail, savedPassword);
              
              if (result.success) {
                console.log("✅ [SIGN-IN PAGE] Auto-login successful!");
                
                // Determine redirect URL
                let redirectUrl = "/speedrun"; // Default to Speedrun
                
                if (result.redirectTo) {
                  redirectUrl = result.redirectTo;
                  console.log("🎯 [SIGN-IN PAGE] Using platform route:", redirectUrl);
                } else {
                  const lastLocation = localStorage.getItem("adrata_last_location");
                  if (lastLocation) {
                    redirectUrl = lastLocation;
                  } else {
                    // First time login - default all users to Speedrun
                    redirectUrl = "/speedrun";  // All users go to Speedrun by default
                    
                    localStorage.setItem("adrata_last_location", redirectUrl);
                  }
                }
                
                console.log("🎯 [SIGN-IN PAGE] Auto-login redirecting to:", redirectUrl);
                router.push(redirectUrl);
                return;
              } else {
                console.log("❌ [SIGN-IN PAGE] Auto-login failed:", result.error);
                // Clear invalid credentials
                localStorage.removeItem("adrata_remembered_password");
                setError("Auto-login failed. Please sign in manually.");
              }
            } catch (error) {
              console.error("❌ [SIGN-IN PAGE] Auto-login error:", error);
              // Clear invalid credentials
              localStorage.removeItem("adrata_remembered_password");
              setError("Auto-login failed. Please sign in manually.");
            } finally {
              setIsLoading(false);
            }
          }, 500);
        } else if (savedRememberMe && savedEmail) {
          // Just populate the email field if we have it but no password
          // Populating remembered email
          setEmail(savedEmail);
          setRememberMe(true);
        }
      }

      console.log(
        "✅ [SIGN-IN PAGE] Logout flags cleared - ready for fresh authentication",
      );
    }
  }, [router, authSignIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Starting authentication
    // Using UnifiedAuthService for cross-platform auth

    try {
      const result = await authSignIn(email, password);

      if (result.success) {
        // Authentication successful

        // Handle remember me functionality
        if (typeof window !== "undefined") {
          if (rememberMe) {
            // Set remember me cookie for 30 days
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            document['cookie'] = `adrata_remember_me=true; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=strict`;
            
            // Save email and password for auto-login
            localStorage.setItem("adrata_remembered_email", email);
            localStorage.setItem("adrata_remembered_password", password);
            console.log("💾 [SIGN-IN PAGE] Saved credentials for auto-login");
          } else {
            // Clear remember me data
            document['cookie'] = "adrata_remember_me=false; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            localStorage.removeItem("adrata_remembered_email");
            localStorage.removeItem("adrata_remembered_password");
            console.log("🧹 [SIGN-IN PAGE] Cleared saved credentials");
          }
        }

        // 🆕 AUTO-LOGIN TO LAST WORKSPACE
        // Use the server-provided redirectTo path which includes workspace-aware routing
        let redirectUrl = "/speedrun"; // Default fallback
        
        // DEBUG: Log the full authentication result
        console.log("🔍 [SIGN-IN PAGE] Full authentication result:", JSON.stringify(result, null, 2));
        console.log("🔍 [SIGN-IN PAGE] Session user:", result.session?.user);
        console.log("🔍 [SIGN-IN PAGE] Active workspace ID:", result.session?.user?.activeWorkspaceId);
        console.log("🔍 [SIGN-IN PAGE] User workspaces:", result.session?.user?.workspaces);
        console.log("🔍 [SIGN-IN PAGE] Server redirectTo:", result.redirectTo);
        console.log("🔍 [SIGN-IN PAGE] Platform route:", result.platformRoute);
        
        // 🆕 CRITICAL FIX: Use server-provided redirectTo path (workspace-aware)
        if (result.redirectTo) {
          redirectUrl = result.redirectTo;
          console.log("🎯 [SIGN-IN PAGE] Using server-provided redirectTo:", redirectUrl);
        } else if (result.session?.user?.activeWorkspaceId) {
          const activeWorkspaceId = result.session.user.activeWorkspaceId;
          console.log("🎯 [SIGN-IN PAGE] User has active workspace:", activeWorkspaceId);
          
          // Find the workspace details
          const activeWorkspace = result.session.user.workspaces?.find(
            (ws: any) => ws.id === activeWorkspaceId
          );
          
          if (activeWorkspace) {
            console.log("✅ [SIGN-IN PAGE] Found active workspace:", activeWorkspace.name);
            // Fall back to generic path if no server redirect
            redirectUrl = "/speedrun";
            console.log("🚀 [SIGN-IN PAGE] Auto-redirecting to last workspace:", activeWorkspace.name);
          } else {
            console.log("⚠️ [SIGN-IN PAGE] Active workspace not found in user's workspaces");
            console.log("⚠️ [SIGN-IN PAGE] Available workspaces:", result.session.user.workspaces?.map((ws: any) => ({ id: ws.id, name: ws.name })));
            // Fall back to workspace selection if workspace not found
            redirectUrl = "/workspaces";
          }
        } else {
          console.log("⚠️ [SIGN-IN PAGE] No active workspace found, redirecting to workspace selection");
          redirectUrl = "/workspaces";
        }

        // Handle returnTo parameter for post-login redirects (override auto-login)
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get("returnTo");
        if (returnTo) {
          redirectUrl = returnTo;
          console.log("🎯 [SIGN-IN PAGE] Using returnTo parameter (overriding auto-login):", redirectUrl);
        }

        console.log("🎯 [SIGN-IN PAGE] Final redirect decision:", { 
          email, 
          redirectUrl,
          hasActiveWorkspace: !!result.session?.user?.activeWorkspaceId,
          activeWorkspaceId: result.session?.user?.activeWorkspaceId
        });

        // 🆕 ENVIRONMENT-AWARE: Ensure we're redirecting to the correct domain
        if (typeof window !== "undefined") {
          const currentHostname = window.location.hostname;
          const isProduction = currentHostname === "action.adrata.com";
          const isLocalhost = currentHostname === "localhost" || currentHostname === "127.0.0.1";
          const isStaging = currentHostname.includes("vercel.app") || currentHostname.includes("adrata-git");
          
          // Only redirect if we're on an unrecognized domain
          if (!isProduction && !isLocalhost && !isStaging) {
            console.log("🔄 [SIGN-IN PAGE] Redirecting to production domain: action.adrata.com");
            const correctUrl = `https://action.adrata.com${redirectUrl}`;
            console.log("🔄 [SIGN-IN PAGE] Full redirect URL:", correctUrl);
            window['location']['href'] = correctUrl;
            return;
          }
        }

        // Small delay to ensure session is saved, then redirect
        setTimeout(() => {
          console.log("🔄 [SIGN-IN PAGE] Redirecting to:", redirectUrl);
          router.push(redirectUrl);
        }, 100);
      } else {
        console.error("❌ [SIGN-IN PAGE] Authentication failed:", result.error);
        setError(
          result.error ||
            "Authentication failed. Please check your credentials.",
        );
      }
    } catch (error) {
      console.error("❌ [SIGN-IN PAGE] Unexpected error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Adrata Sign In
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block font-medium mb-1" htmlFor="username">
              Username or Email
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 transition-colors invalid:border-gray-300"
              placeholder="Enter your username or email"
              required
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div>
            <label className="block font-medium mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 transition-colors invalid:border-gray-300"
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            <Link
              href="/reset-password"
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-2 rounded font-semibold hover:bg-gray-800 transition disabled:cursor-not-allowed disabled:bg-black disabled:opacity-100"
          >
            {isLoading ? "Starting..." : `Start (${getCommonShortcut('SUBMIT')})`}
          </button>
        </form>

        {/* Demo Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account yet?{" "}
            <Link
              href="/demo"
              className="text-black font-medium hover:text-gray-800 transition-colors"
            >
              Get a demo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
