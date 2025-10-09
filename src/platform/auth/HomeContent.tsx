"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import { getPlatformConfig } from "@/platform/platform-detection";

export function HomeContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const { signIn, signOut, isLoading, isAuthenticated, user } =
    useUnifiedAuth();

  // Initialize component
  useEffect(() => {
    console.log("🏠 HomeContent: Initializing...");
    const timer = setTimeout(() => {
      setIsInitialized(true);
      console.log("🏠 HomeContent: Initialized");
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      console.log("🔐 Login attempt for:", email);
      const result = await signIn(email, password);
      console.log("🔐 Login result:", result);

      if (result?.success) {
        console.log("✅ Login successful");
        setEmail("");
        setPassword("");

        // Handle navigation based on platform
        const config = getPlatformConfig();

        // Check if user has a stored location, otherwise default to Monaco sellers
        let redirectUrl = "/monaco/sellers";
        if (typeof window !== "undefined") {
          const lastLocation = localStorage.getItem("adrata_last_location");
          if (lastLocation) {
            redirectUrl = lastLocation;
          } else {
            // First time login - set to Monaco sellers
            localStorage.setItem("adrata_last_location", "/monaco/sellers");
          }
        }

        if (config.isDesktop) {
          // For desktop, navigate to the main app
          window['location']['href'] = redirectUrl;
        }
      } else {
        console.log("❌ Login failed:", result?.error);
        setError(result?.error || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setEmail("");
    setPassword("");
    setError("");
  };

  // Show loading while initializing
  if (!isInitialized) {
    return null; // No loading screen - instant experience
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated && user) {
    return null; // No loading screen - instant experience
  }

  // Show login form with hardcoded colors for reliability
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Adrata</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to continue</p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-200 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username or Email
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username email"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-white text-gray-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                placeholder="Enter your username or email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-white text-gray-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          {/* Test credentials help */}
          <div className="mt-6 p-3 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-500 mb-2">Test credentials:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <code className="bg-white px-2 py-1 rounded border text-gray-700">
                  admin
                </code>
                <span className="text-gray-400 mx-1">/</span>
                <code className="bg-white px-2 py-1 rounded border text-gray-700">
                  admin123
                </code>
              </div>
              <div>
                <code className="bg-white px-2 py-1 rounded border text-gray-700">
                  demo
                </code>
                <span className="text-gray-400 mx-1">/</span>
                <code className="bg-white px-2 py-1 rounded border text-gray-700">
                  demo123
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
