"use client";

import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  FunnelIcon,
  PencilIcon,
  UserMinusIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  workspaces: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

interface UserFilters {
  search: string;
  workspace: string;
  role: string;
  status: string;
}

export const AdminManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    workspace: '',
    role: '',
    status: '',
  });

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users when filters change
  useEffect(() => {
    filterUsers();
  }, [users, filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // For now, we'll mock the data. In a real implementation,
      // you'd fetch from an API endpoint like /api/v1/admin/users
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'john.doe@example.com',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          lastLoginAt: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          workspaces: [
            { id: 'ws1', name: 'Acme Corp', role: 'SELLER' },
          ],
        },
        {
          id: '2',
          email: 'jane.smith@example.com',
          name: 'Jane Smith',
          firstName: 'Jane',
          lastName: 'Smith',
          isActive: true,
          lastLoginAt: '2024-01-14T15:45:00Z',
          createdAt: '2024-01-02T00:00:00Z',
          workspaces: [
            { id: 'ws1', name: 'Acme Corp', role: 'MANAGER' },
          ],
        },
        {
          id: '3',
          email: 'bob.wilson@example.com',
          name: 'Bob Wilson',
          firstName: 'Bob',
          lastName: 'Wilson',
          isActive: false,
          lastLoginAt: '2024-01-10T09:15:00Z',
          createdAt: '2024-01-03T00:00:00Z',
          workspaces: [
            { id: 'ws1', name: 'Acme Corp', role: 'VIEWER' },
          ],
        },
      ];

      setUsers(mockUsers);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Workspace filter
    if (filters.workspace) {
      filtered = filtered.filter(user =>
        user.workspaces.some(ws => ws.id === filters.workspace)
      );
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(user =>
        user.workspaces.some(ws => ws.role === filters.role)
      );
    }

    // Status filter
    if (filters.status) {
      if (filters.status === 'active') {
        filtered = filtered.filter(user => user.isActive);
      } else if (filters.status === 'inactive') {
        filtered = filtered.filter(user => !user.isActive);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEditUser = (user: User) => {
    // TODO: Implement edit user functionality
    console.log('Edit user:', user);
  };

  const handleDeactivateUser = (user: User) => {
    // TODO: Implement deactivate user functionality
    console.log('Deactivate user:', user);
  };

  const handleResendInvitation = (user: User) => {
    // TODO: Implement resend invitation functionality
    console.log('Resend invitation to:', user);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'WORKSPACE_ADMIN':
        return 'bg-red-100 text-red-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'SELLER':
        return 'bg-green-100 text-green-800';
      case 'VIEWER':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center">
          <UsersIcon className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Manage Users
            </h2>
            <p className="text-sm text-muted mt-1">
              View and manage existing users
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="flex items-center mb-4">
              <FunnelIcon className="h-5 w-5 text-muted mr-2" />
              <h3 className="text-sm font-medium text-foreground">
                Filters
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search users..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Workspace
                </label>
                <select
                  value={filters.workspace}
                  onChange={(e) => handleFilterChange('workspace', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Workspaces</option>
                  <option value="ws1">Acme Corp</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="WORKSPACE_ADMIN">Workspace Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="SELLER">Seller</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg border border-border">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  Users ({filteredUsers.length})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-muted mt-2">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-muted mx-auto mb-4" />
                  <p className="text-sm text-muted">
                    {filters.search || filters.workspace || filters.role || filters.status
                      ? 'No users match your filters'
                      : 'No users found'}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workspaces
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {user.workspaces.map((workspace) => (
                              <div key={workspace.id} className="flex items-center space-x-2">
                                <span className="text-sm text-gray-900">
                                  {workspace.name}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                                    workspace.role
                                  )}`}
                                >
                                  {workspace.role}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              user.isActive
                            )}`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit user"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleResendInvitation(user)}
                              className="text-green-600 hover:text-green-900"
                              title="Resend invitation"
                            >
                              <EnvelopeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeactivateUser(user)}
                              className="text-red-600 hover:text-red-900"
                              title="Deactivate user"
                            >
                              <UserMinusIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
