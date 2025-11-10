"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUnifiedAuth } from "@/platform/auth";
import { Alert, AlertDescription } from "@/platform/shared/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const { signIn: authSignIn } = useUnifiedAuth();

  // Optimized platform detection and logout cleanup (logging removed for performance)

  useEffect(() => {
    // Set mounted state after component mounts to prevent hydration mismatch
    setMounted(true);
  }, []);

  useEffect(() => {
    // CRITICAL: Ensure we're on the correct domain before anything else
    if (typeof window !== "undefined") {
      // Environment-aware domain check - allow production, staging, and localhost
      const currentHostname = window.location.hostname;
      const isProduction = currentHostname === "action.adrata.com";
      const isStaging = currentHostname === "staging.adrata.com";
      const isLocalhost = currentHostname === "localhost" || currentHostname === "127.0.0.1";
      const isVercelPreview = currentHostname.includes("vercel.app") || currentHostname.includes("adrata-git");
      
      // Only redirect if we're on an unrecognized domain (not production, staging, localhost, or Vercel preview)
      if (!isProduction && !isStaging && !isLocalhost && !isVercelPreview) {
        console.log("🔄 [SIGN-IN PAGE] Unrecognized domain detected:", currentHostname);
        // For unrecognized domains, redirect to production
        const correctUrl = `https://action.adrata.com/sign-in${window.location.search}`;
        console.log("🔄 [SIGN-IN PAGE] Redirecting to production domain:", correctUrl);
        window.location.href = correctUrl;
        return;
      }
      
      // Debug logs removed for production

      // Clear all logout flags to allow fresh sign-in
      sessionStorage.removeItem("adrata_signed_out");
      sessionStorage.removeItem("adrata_emergency_logout");
      sessionStorage.removeItem("adrata_logout_timestamp");
      localStorage.removeItem("adrata_logout_initiated");
      localStorage.removeItem("adrata_logout_active");
      localStorage.removeItem("adrata_logout_session_id");

      console.log(
        "✅ [SIGN-IN PAGE] Logout flags cleared - ready for fresh authentication",
      );
    }
  }, [router, authSignIn]);

  // Initialize email from localStorage only after component mounts to prevent hydration mismatch
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    // Load remember me preference from cookies
    const savedRememberMe = document.cookie
      .split("; ")
      .find((row) => row.startsWith("adrata_remember_me="))
      ?.split("=")[1] === "true";
    
    const savedEmail = localStorage.getItem("adrata_remembered_email");
    
    if (savedRememberMe && savedEmail) {
      // Just populate the email field - no auto-login for security
      setEmail(savedEmail);
      setRememberMe(true);
      console.log("📧 [SIGN-IN PAGE] Populated remembered email");
    }
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Starting authentication
    // Using UnifiedAuthService for cross-platform auth

    try {
      const result = await authSignIn(email, password, rememberMe);

      if (result.success) {
        // Authentication successful


        // Handle remember me functionality
        if (typeof window !== "undefined") {
          if (rememberMe) {
            // Set remember me cookie for 30 days
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            document.cookie = `adrata_remember_me=true; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=strict`;
            
            // Save email only for convenience (no password storage for security)
            localStorage.setItem("adrata_remembered_email", email);
            console.log("💾 [SIGN-IN PAGE] Saved email for convenience");
          } else {
            // Clear remember me data
            document.cookie = "adrata_remember_me=false; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            localStorage.removeItem("adrata_remembered_email");
            console.log("🧹 [SIGN-IN PAGE] Cleared saved email");
          }
        }

        // 🆕 REDIRECT TO LAST WORKSPACE
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
            (ws: { id: string; name: string; role: string }) => ws.id === activeWorkspaceId
          );
          
          if (activeWorkspace) {
            console.log("✅ [SIGN-IN PAGE] Found active workspace:", activeWorkspace.name);
            // Fall back to generic path if no server redirect
            redirectUrl = "/speedrun";
            console.log("🚀 [SIGN-IN PAGE] Auto-redirecting to last workspace:", activeWorkspace.name);
          } else {
            console.log("⚠️ [SIGN-IN PAGE] Active workspace not found in user's workspaces");
            console.log("⚠️ [SIGN-IN PAGE] Available workspaces:", result.session.user.workspaces?.map((ws: { id: string; name: string; role: string }) => ({ id: ws.id, name: ws.name })));
            // Fall back to workspace selection if workspace not found
            redirectUrl = "/workspaces";
          }
        } else {
          console.log("⚠️ [SIGN-IN PAGE] No active workspace found, redirecting to workspace selection");
          redirectUrl = "/workspaces";
        }

        // Handle returnTo parameter for post-login redirects
        const returnToParams = new URLSearchParams(window.location.search);
        const returnTo = returnToParams.get("returnTo");
        if (returnTo) {
          redirectUrl = returnTo;
          console.log("🎯 [SIGN-IN PAGE] Using returnTo parameter:", redirectUrl);
        }

        console.log("🎯 [SIGN-IN PAGE] Final redirect decision:", { 
          email, 
          redirectUrl,
          hasActiveWorkspace: !!result.session?.user?.activeWorkspaceId,
          activeWorkspaceId: result.session?.user?.activeWorkspaceId
        });

        // Environment-aware: Ensure we're redirecting to the correct domain
        // No need to redirect if we're already on a valid domain (production, staging, localhost, or Vercel preview)
        // The redirectUrl is already relative, so it will work on any valid domain

        // Small delay to ensure session is saved, then redirect
        setTimeout(() => {
          console.log("🔄 [SIGN-IN PAGE] Redirecting to:", redirectUrl);
          router.push(redirectUrl);
        }, 100);
        // Don't reset loading state on success - let the redirect happen while showing "Starting..."
      } else {
        console.error("❌ [SIGN-IN PAGE] Authentication failed:", result.error);
        setError(
          result.error ||
            "Invalid email or password. Please check your credentials and try again.",
        );
        setIsLoading(false); // Only reset loading state on error
      }
    } catch (error) {
      console.error("❌ [SIGN-IN PAGE] Unexpected error:", error);
      setError("An unexpected error occurred. Please try again or contact support if the problem persists.");
      setIsLoading(false); // Only reset loading state on error
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="bg-background rounded-xl shadow-lg p-8 w-full max-w-md border">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Adrata Sign In
        </h1>

        {error && (
          <Alert className="mb-4 bg-white border-l-4 border-l-red-500 shadow-sm">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-gray-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate suppressHydrationWarning>
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
              className="w-full border border-border rounded px-4 py-2 outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 transition-colors invalid:border-border"
              placeholder="Enter your username or email"
              required
              disabled={isLoading}
              autoFocus
              suppressHydrationWarning
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
              className="w-full border border-border rounded px-4 py-2 outline-none focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 transition-colors invalid:border-border"
              placeholder="Enter your password"
              required
              disabled={isLoading}
              suppressHydrationWarning
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
                className="h-4 w-4 text-black focus:ring-black border-border rounded"
                disabled={isLoading}
                suppressHydrationWarning
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            <Link
              href="/reset-password"
              className="text-sm text-muted hover:text-black transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-2 rounded font-semibold hover:bg-gray-800 transition disabled:cursor-not-allowed disabled:bg-black disabled:opacity-100"
            suppressHydrationWarning
          >
            {isLoading ? "Starting..." : "Start"}
          </button>
        </form>

        {/* Demo Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            Don&apos;t have an account yet?{" "}
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
