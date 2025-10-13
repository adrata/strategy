"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface InvitationData {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  } | null;
  role: string;
  expiresAt: string;
  inviter: {
    id: string;
    name: string;
    email: string;
  } | null;
  invitedAt: string;
}

export default function SetupAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  // Validate invitation token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Please check your email for the correct link.');
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  // Check password strength
  useEffect(() => {
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
    setPasswordRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    });
  }, [password]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/v1/auth/validate-invitation-token?token=${token}`);
      const data = await response.json();

      if (data.success) {
        setInvitationData(data.data);
        setError(null);
      } else {
        setError(data.error || 'Invalid or expired invitation token');
      }
    } catch (err) {
      setError('Failed to validate invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 25) return 'bg-red-500';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationData) return;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (passwordStrength < 50) {
      setError('Password is too weak. Please choose a stronger password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/setup-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: invitationData.token,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        
        // Store tokens for immediate login
        if (data.data.tokens) {
          localStorage.setItem('adrata-access-token', data.data.tokens.accessToken);
          localStorage.setItem('adrata-refresh-token', data.data.tokens.refreshToken);
        }

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          if (data.data.workspace) {
            router.push(`/${data.data.workspace.slug}`);
          } else {
            router.push('/');
          }
        }, 2000);
      } else {
        setError(data.error || 'Failed to set up account. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/sign-in')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Account Set Up Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Welcome to {invitationData?.workspace?.name}! You're being redirected to your dashboard...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!invitationData) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Set Up Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join <strong>{invitationData.workspace?.name}</strong>
          </p>
          {invitationData.inviter && (
            <p className="text-sm text-gray-500">
              Invited by {invitationData.inviter.name}
            </p>
          )}
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Account Details
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p><strong>Email:</strong> {invitationData.user.email}</p>
                  <p><strong>Name:</strong> {invitationData.user.name}</p>
                  <p><strong>Workspace:</strong> {invitationData.workspace?.name}</p>
                  <p><strong>Role:</strong> {invitationData.role}</p>
                </div>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={`font-medium ${
                      passwordStrength < 25 ? 'text-red-600' :
                      passwordStrength < 50 ? 'text-orange-600' :
                      passwordStrength < 75 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="mt-2 text-xs text-gray-600">
                    <div className={`flex items-center ${passwordRequirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      At least 8 characters
                    </div>
                    <div className={`flex items-center ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      One uppercase letter
                    </div>
                    <div className={`flex items-center ${passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      One lowercase letter
                    </div>
                    <div className={`flex items-center ${passwordRequirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      One number
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting || passwordStrength < 50 || password !== confirmPassword}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up account...
                  </>
                ) : (
                  'Set Up Account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              This invitation expires on{' '}
              {new Date(invitationData.expiresAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
