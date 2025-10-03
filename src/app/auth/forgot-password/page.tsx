"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              Check Your Email
            </h1>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              If you don't see the email, check your spam folder or try again.
            </p>
            <div className="space-y-3">
              <Link
                href="/sign-in"
                className="w-full bg-[#2F6FDC] text-white py-2 px-4 rounded font-semibold hover:bg-[#4374DE] transition text-center block"
              >
                Back to Sign In
              </Link>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
                className="w-full text-[#2F6FDC] py-2 px-4 rounded font-semibold hover:bg-gray-50 transition"
              >
                Try Different Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Reset Your Password
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-[#2F6FDC] focus:border-[#2F6FDC] outline-none"
              placeholder="Enter your email address"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2F6FDC] text-white py-2 rounded font-semibold hover:bg-[#4374DE] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/sign-in"
            className="text-[#2F6FDC] hover:text-[#4374DE] font-medium"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
