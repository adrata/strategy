"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth-unified";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signIn } = useUnifiedAuth();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    setToken(tokenParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      // Store user info for success message
      setResetUser(data.user);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error instanceof Error ? error.message : "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
            Password Reset Successful
          </h1>
          
          <div className="text-center">
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
              Your password has been successfully reset!
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              {resetUser ? `Your password has been successfully reset, ${resetUser.name}!` : 'Your password has been successfully reset!'}
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              For security reasons, please sign in with your new password.
            </p>
            
            <div className="flex flex-col gap-2">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 bg-[#2F6FDC] text-white px-4 py-2 rounded font-medium hover:bg-[#4374DE] transition-colors"
              >
                Sign In with New Password
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
            Invalid Reset Link
          </h1>
          
          <div className="text-center">
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
              This password reset link is invalid or has expired.
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Please request a new password reset link.
            </p>
            
            <Link
              href="/reset-password"
              className="inline-flex items-center gap-2 text-black font-medium hover:text-gray-800 transition-colors"
            >
              ← Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Reset Your Password
        </h1>

        <p className="text-sm text-gray-600 mb-6 text-center">
          Enter your new password below.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block font-medium mb-1" htmlFor="password">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-[#2F6FDC] focus:border-[#2F6FDC] outline-none invalid:border-gray-300"
              placeholder="Enter your new password"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block font-medium mb-1" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-[#2F6FDC] focus:border-[#2F6FDC] outline-none invalid:border-gray-300"
              placeholder="Confirm your new password"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            className="w-full bg-[#2F6FDC] text-white py-2 rounded font-semibold hover:bg-[#4374DE] transition disabled:cursor-not-allowed disabled:bg-[#2F6FDC] disabled:opacity-100 cursor-pointer"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/sign-in"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
} 
} 