"use client";

import React, { useState, useEffect } from 'react';
import {
  UserPlusIcon,
  EnvelopeIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useUnifiedAuth } from '@/platform/auth';

interface InvitationFormData {
  email: string;
  firstName: string;
  lastName: string;
  workspaceId: string;
  role: string;
}

interface Invitation {
  id: string;
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
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
  inviter: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export const AdminInviteUsers: React.FC = () => {
  const { user: authUser } = useUnifiedAuth();
  const [formData, setFormData] = useState<InvitationFormData>({
    email: '',
    firstName: '',
    lastName: '',
    workspaceId: authUser?.activeWorkspaceId || '',
    role: 'VIEWER',
  });

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load workspaces and invitations on mount
  useEffect(() => {
    loadWorkspaces();
    loadInvitations();
  }, []);

  const loadWorkspaces = async () => {
    try {
      // For now, we'll use the current workspace. In a full implementation,
      // you'd fetch all workspaces the admin has access to
      if (authUser?.activeWorkspaceId) {
        setWorkspaces([{
          id: authUser.activeWorkspaceId,
          name: authUser.workspaces?.find(ws => ws['id'] === authUser.activeWorkspaceId)?.['name'] || 'Current Workspace',
          slug: authUser.workspaces?.find(ws => ws['id'] === authUser.activeWorkspaceId)?.['slug'] || 'current',
        }]);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  };

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/invitations');
      const data = await response.json();

      if (data.success) {
        setInvitations(data.data.invitations || []);
      } else {
        setError(data.error || 'Failed to load invitations');
      }
    } catch (err) {
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.workspaceId) {
      setError('Please select a workspace');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/v1/admin/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Invitation sent successfully to ${formData.email}`);
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          workspaceId: authUser?.activeWorkspaceId || '',
          role: 'VIEWER',
        });
        loadInvitations(); // Refresh the list
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'pending':
      default:
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center">
          <UserPlusIcon className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Invite Users
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Send invitations to new team members
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-8">
          {/* Invitation Form */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-6">
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
              Send Invitation
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="workspaceId" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Workspace *
                  </label>
                  <div className="relative">
                    <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                    <select
                      id="workspaceId"
                      name="workspaceId"
                      value={formData.workspaceId}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    First Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Last Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Role
                </label>
                <div className="relative">
                  <ShieldCheckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="VIEWER">Viewer - Read-only access</option>
                    <option value="SELLER">Seller - Manage own records</option>
                    <option value="MANAGER">Manager - Manage team records</option>
                    <option value="WORKSPACE_ADMIN">Workspace Admin - Full access</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Invitations */}
          <div className="bg-white rounded-lg border border-[var(--border)]">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-medium text-[var(--foreground)]">
                Recent Invitations
              </h3>
              <p className="text-sm text-[var(--muted)] mt-1">
                Track the status of your invitations
              </p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-[var(--muted)] mt-2">Loading invitations...</p>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlusIcon className="h-12 w-12 text-[var(--muted)] mx-auto mb-4" />
                  <p className="text-sm text-[var(--muted)]">No invitations sent yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(invitation.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {invitation.user.name || invitation.user.email}
                          </p>
                          <p className="text-sm text-[var(--muted)]">
                            {invitation.user.email}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {invitation.workspace?.name} • {invitation.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            invitation.status
                          )}`}
                        >
                          {invitation.status}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
