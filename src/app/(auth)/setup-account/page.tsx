"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { createSession, storeSession } from '@/platform/auth/session';
import { getPlatform, getDeviceId } from '@/platform/auth/platform';

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

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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
        setUsername((data.data.user.firstName || data.data.user.name).toLowerCase());
        setEmail(data.data.user.email);
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

    setSubmitting(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    // Validate password strength
    if (passwordStrength < 50) {
      setError('Password is too weak. Please choose a stronger password.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/auth/setup-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: invitationData.token,
          username,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Account setup completed successfully');
        
        // Fetch user's workspaces to populate the session
        let workspaces = [];
        try {
          const workspacesResponse = await fetch('/api/v1/workspaces', {
            headers: {
              'Authorization': `Bearer ${data.data.tokens.accessToken}`,
            },
          });
          
          if (workspacesResponse.ok) {
            const workspacesData = await workspacesResponse.json();
            if (workspacesData.success) {
              workspaces = workspacesData.data.workspaces.map((ws: any) => ({
                id: ws.id,
                name: ws.name,
                role: ws.role || 'VIEWER',
              }));
              console.log('✅ Fetched user workspaces:', workspaces);
            }
          } else {
            console.warn('⚠️ Failed to fetch workspaces, continuing with empty array');
          }
        } catch (workspaceError) {
          console.warn('⚠️ Error fetching workspaces:', workspaceError);
          // If workspace fetch fails but we have a workspace from the invitation, use it
          if (data.data.workspace) {
            workspaces = [{
              id: data.data.workspace.id,
              name: data.data.workspace.name,
              role: data.data.role || 'VIEWER',
            }];
          }
        }

        // Create proper UnifiedSession object
        const platform = getPlatform();
        const deviceId = getDeviceId();
        const activeWorkspaceId = data.data.workspace?.id || null;

        const userData = {
          id: data.data.user.id,
          name: data.data.user.name,
          email: data.data.user.email,
          workspaces: workspaces,
          activeWorkspaceId: activeWorkspaceId,
          deviceId: deviceId,
        };

        const session = createSession(
          userData,
          platform,
          deviceId,
          data.data.tokens.accessToken,
          data.data.tokens.refreshToken,
          false // rememberMe
        );

        // Store the session in localStorage
        console.log('💾 [SETUP] Storing session...', {
          userId: userData.id,
          email: userData.email,
          workspaceCount: workspaces.length,
          activeWorkspaceId: activeWorkspaceId,
          platform: platform,
          deviceId: deviceId,
        });
        
        await storeSession(session);
        console.log('✅ [SETUP] Session stored successfully');

        // Verify the session was stored correctly
        const storedSessionRaw = localStorage.getItem('adrata_unified_session_v3');
        if (!storedSessionRaw) {
          console.error('❌ [SETUP] Session verification failed - not found in localStorage');
          setError('Failed to store session. Please try again.');
          return;
        }

        const storedSession = JSON.parse(storedSessionRaw);
        console.log('✅ [SETUP] Session verified in localStorage:', {
          hasUser: !!storedSession.user,
          userId: storedSession.user?.id,
          email: storedSession.user?.email,
          workspaceCount: storedSession.user?.workspaces?.length || 0,
          activeWorkspaceId: storedSession.user?.activeWorkspaceId,
          hasAccessToken: !!storedSession.accessToken,
          expires: storedSession.expires,
        });

        // Verify workspaces are in the session
        if (!storedSession.user?.workspaces || storedSession.user.workspaces.length === 0) {
          console.warn('⚠️ [SETUP] No workspaces in stored session, adding from invitation data');
          // If workspaces are missing, add them manually
          storedSession.user.workspaces = workspaces;
          localStorage.setItem('adrata_unified_session_v3', JSON.stringify(storedSession));
          console.log('✅ [SETUP] Workspaces added to session');
        }

        // Also set cookies for server-side authentication compatibility
        if (data.data.tokens) {
          localStorage.setItem('adrata-access-token', data.data.tokens.accessToken);
          localStorage.setItem('adrata-refresh-token', data.data.tokens.refreshToken);
          
          // Set the auth-token cookie that the system expects
          document.cookie = `auth-token=${data.data.tokens.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
          
          // Set the unified session cookie as well
          const sessionData = {
            accessToken: data.data.tokens.accessToken,
            refreshToken: data.data.tokens.refreshToken,
            user: data.data.user,
            workspace: data.data.workspace,
            expires: session.expires
          };
          document.cookie = `adrata_unified_session=${JSON.stringify(sessionData)}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
        }

        console.log('🔑 [SETUP] Tokens stored in localStorage and cookies');
        console.log('🏢 [SETUP] Workspace:', data.data.workspace);
        console.log('👤 [SETUP] Session created for user:', data.data.user.email);

        // Wait for localStorage to persist (critical for reliability)
        console.log('⏳ [SETUP] Waiting for storage to persist...');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Final verification before redirect
        const finalCheck = localStorage.getItem('adrata_unified_session_v3');
        if (!finalCheck) {
          console.error('❌ [SETUP] Final verification failed - session lost');
          setError('Session storage failed. Please try again.');
          return;
        }
        console.log('✅ [SETUP] Final verification passed - session persisted');

        // Redirect to the workspace
        if (data.data.workspace) {
          console.log(`🔄 [SETUP] Redirecting to workspace: /${data.data.workspace.slug}/people`);
          // Use window.location.href to force a full page reload so auth system picks up the new session
          window.location.href = `/${data.data.workspace.slug}/people`;
        } else {
          console.log('🔄 [SETUP] Redirecting to workspaces page');
          window.location.href = '/workspaces';
        }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center">
            <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Get Started
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Loading your invitation...
            </p>
          </div>
          <div className="bg-white py-6 px-4 sm:py-8 sm:px-6 shadow rounded-lg">
            <div className="animate-pulse space-y-4 sm:space-y-6">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-10 sm:h-12 bg-gray-200 rounded"></div>
              <div className="h-10 sm:h-12 bg-gray-200 rounded"></div>
              <div className="h-10 sm:h-12 bg-gray-200 rounded"></div>
              <div className="h-10 sm:h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
          <ExclamationTriangleIcon className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/sign-in')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base min-h-[44px]"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }


  if (!invitationData) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:items-center sm:justify-center py-4 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4 sm:space-y-8 flex-1 sm:flex-none">
        <div className="text-center">
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
            Get Started
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            You've been invited to join <strong>{invitationData.workspace?.name}</strong> on Adrata
          </p>
          {invitationData.inviter && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Invited by {invitationData.inviter.name}
            </p>
          )}
        </div>

        <div className="bg-white py-4 px-4 sm:py-8 sm:px-6 shadow rounded-lg pb-8 sm:pb-8">

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-2 sm:ml-3">
                    <p className="text-xs sm:text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="appearance-none block w-full px-3 py-3 sm:py-2 border border-[var(--border)] rounded-md placeholder-[var(--muted)] focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px]"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 sm:py-2 border border-[var(--border)] rounded-md placeholder-[var(--muted)] focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px]"
                  placeholder="Enter your email"
                />
              </div>
            </div>

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
                  className="appearance-none block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-12 sm:pr-10 text-sm sm:text-base min-h-[44px]"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-[44px] min-w-[44px] justify-center"
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
                  <div className="flex items-center justify-between text-xs sm:text-sm">
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
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <div className={`flex items-center ${passwordRequirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircleIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="text-xs">At least 8 characters</span>
                    </div>
                    <div className={`flex items-center ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircleIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="text-xs">One uppercase letter</span>
                    </div>
                    <div className={`flex items-center ${passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircleIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="text-xs">One lowercase letter</span>
                    </div>
                    <div className={`flex items-center ${passwordRequirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                      <CheckCircleIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="text-xs">One number</span>
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
                  className="appearance-none block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-12 sm:pr-10 text-sm sm:text-base min-h-[44px]"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-[44px] min-w-[44px] justify-center"
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
                <p className="mt-1 text-xs sm:text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            <div className="mt-6 mb-4 sm:mb-0">
              <button
                type="submit"
                disabled={submitting}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-medium rounded-md text-white bg-[#5B7FFF] hover:bg-[#4A6BFF] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5B7FFF] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Starting...
                  </>
                ) : (
                  'Start'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              This invitation expires on{' '}
              <span className="font-medium">
                {new Date(invitationData.expiresAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
