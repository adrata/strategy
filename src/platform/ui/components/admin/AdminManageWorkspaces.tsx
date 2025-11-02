"use client";

import React, { useState, useEffect } from 'react';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  CalendarIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  isActive: boolean;
  userCount: number;
}

interface WorkspaceFormData {
  name: string;
  slug: string;
  description: string;
}

export const AdminManageWorkspaces: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [formData, setFormData] = useState<WorkspaceFormData>({
    name: '',
    slug: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      // For now, we'll mock the data. In a real implementation,
      // you'd fetch from an API endpoint like /api/v1/admin/workspaces
      const mockWorkspaces: Workspace[] = [
        {
          id: 'ws1',
          name: 'Acme Corp',
          slug: 'acme-corp',
          description: 'Main workspace for Acme Corporation',
          createdAt: '2024-01-01T00:00:00Z',
          isActive: true,
          userCount: 12,
        },
        {
          id: 'ws2',
          name: 'Beta Testing',
          slug: 'beta-testing',
          description: 'Workspace for beta testing new features',
          createdAt: '2024-01-15T00:00:00Z',
          isActive: true,
          userCount: 5,
        },
        {
          id: 'ws3',
          name: 'Archived Project',
          slug: 'archived-project',
          description: 'Old project workspace',
          createdAt: '2023-12-01T00:00:00Z',
          isActive: false,
          userCount: 0,
        },
      ];

      setWorkspaces(mockWorkspaces);
    } catch (err) {
      setError('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: generateSlug(value),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Workspace name is required');
      return false;
    }

    if (!formData.slug.trim()) {
      setError('Workspace slug is required');
      return false;
    }

    // Check if slug is already taken
    const existingWorkspace = workspaces.find(ws => 
      ws.slug === formData.slug && ws.id !== editingWorkspace?.id
    );
    if (existingWorkspace) {
      setError('This workspace slug is already taken');
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
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingWorkspace) {
        // Update existing workspace
        setWorkspaces(prev => prev.map(ws => 
          ws.id === editingWorkspace.id
            ? { ...ws, ...formData, updatedAt: new Date().toISOString() }
            : ws
        ));
        setSuccess('Workspace updated successfully');
      } else {
        // Create new workspace
        const newWorkspace: Workspace = {
          id: `ws${Date.now()}`,
          ...formData,
          createdAt: new Date().toISOString(),
          isActive: true,
          userCount: 0,
        };
        setWorkspaces(prev => [newWorkspace, ...prev]);
        setSuccess('Workspace created successfully');
      }

      // Reset form
      setFormData({ name: '', slug: '', description: '' });
      setShowCreateForm(false);
      setEditingWorkspace(null);
    } catch (err) {
      setError('Failed to save workspace');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (workspace: Workspace) => {
    setFormData({
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description || '',
    });
    setEditingWorkspace(workspace);
    setShowCreateForm(true);
  };

  const handleDelete = async (workspace: Workspace) => {
    if (!confirm(`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setWorkspaces(prev => prev.filter(ws => ws.id !== workspace.id));
      setSuccess('Workspace deleted successfully');
    } catch (err) {
      setError('Failed to delete workspace');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', slug: '', description: '' });
    setShowCreateForm(false);
    setEditingWorkspace(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Manage Workspaces
              </h2>
              <p className="text-sm text-muted mt-1">
                Create and configure workspaces
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Workspace
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg border border-border p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">
                {editingWorkspace ? 'Edit Workspace' : 'Create New Workspace'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                      Workspace Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter workspace name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-1">
                      Workspace Slug *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-gray-50 text-gray-500 text-sm">
                        adrata.com/
                      </span>
                      <input
                        type="text"
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-border rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="workspace-slug"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Used in the workspace URL. Only lowercase letters, numbers, and hyphens allowed.
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the purpose of this workspace"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingWorkspace ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingWorkspace ? 'Update Workspace' : 'Create Workspace'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Workspaces List */}
          <div className="bg-white rounded-lg border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">
                Workspaces ({workspaces.length})
              </h3>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-muted mt-2">Loading workspaces...</p>
                </div>
              ) : workspaces.length === 0 ? (
                <div className="text-center py-8">
                  <BuildingOfficeIcon className="h-12 w-12 text-muted mx-auto mb-4" />
                  <p className="text-sm text-muted">No workspaces found</p>
                </div>
              ) : (
                workspaces.map((workspace) => (
                  <div key={workspace.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-medium text-foreground">
                              {workspace.name}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                workspace.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {workspace.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-sm text-muted">
                              <GlobeAltIcon className="h-4 w-4 mr-1" />
                              adrata.com/{workspace.slug}
                            </div>
                            <div className="flex items-center text-sm text-muted">
                              <UsersIcon className="h-4 w-4 mr-1" />
                              {workspace.userCount} users
                            </div>
                            <div className="flex items-center text-sm text-muted">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              Created {new Date(workspace.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          {workspace.description && (
                            <p className="text-sm text-muted mt-2">
                              {workspace.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(workspace)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                          title="Edit workspace"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(workspace)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                          title="Delete workspace"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
