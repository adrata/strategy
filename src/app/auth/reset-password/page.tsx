"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Invalid or missing reset token");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          token, 
          password 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
              Password Reset Successfully
            </h1>
            <p className="text-gray-600 mb-6">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link
              href="/sign-in"
              className="w-full bg-[#2F6FDC] text-white py-2 px-4 rounded font-semibold hover:bg-[#4374DE] transition text-center block"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Set New Password
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-[#2F6FDC] focus:border-[#2F6FDC] outline-none"
              placeholder="Enter your new password"
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div>
            <label className="block font-medium mb-1" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-[#2F6FDC] focus:border-[#2F6FDC] outline-none"
              placeholder="Confirm your new password"
              required
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full bg-[#2F6FDC] text-white py-2 rounded font-semibold hover:bg-[#4374DE] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update Password"}
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
