"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordRequestPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error instanceof Error ? error.message : "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
            Check Your Email
          </h1>
          
          <div className="text-center">
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
              We've sent a password reset link to {email}
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              If you don't see the email, check your spam folder or try again.
            </p>
            
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-black font-medium hover:text-gray-800 transition-colors"
            >
              ← Back to Sign In
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
          Enter your email address and we'll send you a secure link to reset your password.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block font-medium mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-[#2F6FDC] focus:border-[#2F6FDC] outline-none invalid:border-gray-300"
              placeholder="Enter your email address"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-[#2F6FDC] text-white py-2 rounded font-semibold hover:bg-[#4374DE] transition disabled:cursor-not-allowed disabled:bg-[#2F6FDC] disabled:opacity-100 cursor-pointer"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
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