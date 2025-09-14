/**
 * ENHANCED USER PROFILE COMPONENT
 * 
 * Comprehensive user profile management with sales role hierarchy,
 * personalization settings, and CoreSignal access management.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PipelineSkeleton } from '@/platform/ui/components/Loader';
import { User, UserProfile, Role } from '@prisma/client';
import { SALES_ROLES } from '../../../services/user-role-system';

interface EnhancedUserProfileProps {
  userId: string;
  workspaceId: string;
  onSave?: (profile: Partial<UserProfile>) => void;
  onClose?: () => void;
}

interface UserWithProfile extends User {
  profiles: UserProfile[];
  memberships: Array<{
    role: string;
    assignedRole?: Role;
  }>;
}

export function EnhancedUserProfile({ 
  userId, 
  workspaceId, 
  onSave, 
  onClose 
}: EnhancedUserProfileProps) {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'role' | 'personalization' | 'access'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [userId, workspaceId]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/profile?workspaceId=${workspaceId}`);
      const userData = await response.json();
      setUser(userData);
      setProfile(userData['profiles'][0] || {});
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          profile
        })
      });

      if (response.ok) {
        onSave?.(profile);
        await loadUserProfile(); // Refresh data
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const currentRole = user?.memberships[0]?.assignedRole;
  const roleConfig = currentRole ? SALES_ROLES[currentRole.name] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <PipelineSkeleton message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500">
                {profile.title || 'No title set'} • {currentRole?.displayName || 'No role assigned'}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'profile', label: 'Profile Information' },
            { id: 'role', label: 'Role & Permissions' },
            { id: 'personalization', label: 'AI Personalization' },
            { id: 'access', label: 'Data Access' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'profile' && (
          <ProfileInformationTab 
            profile={profile} 
            user={user} 
            onUpdate={updateProfile} 
          />
        )}
        
        {activeTab === 'role' && (
          <RolePermissionsTab 
            user={user} 
            roleConfig={roleConfig} 
            workspaceId={workspaceId} 
          />
        )}
        
        {activeTab === 'personalization' && (
          <PersonalizationTab 
            profile={profile} 
            roleConfig={roleConfig} 
            onUpdate={updateProfile} 
          />
        )}
        
        {activeTab === 'access' && (
          <DataAccessTab 
            user={user} 
            roleConfig={roleConfig} 
            profile={profile} 
          />
        )}
      </div>
    </div>
  );
}

// Profile Information Tab
function ProfileInformationTab({ 
  profile, 
  user, 
  onUpdate 
}: { 
  profile: Partial<UserProfile>; 
  user: UserWithProfile | null; 
  onUpdate: (field: keyof UserProfile, value: any) => void; 
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={profile.title || ''}
            onChange={(e) => onUpdate('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Enterprise Account Executive"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            value={profile.department || ''}
            onChange={(e) => onUpdate('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Department</option>
            <option value="sales">Sales</option>
            <option value="revenue_operations">Revenue Operations</option>
            <option value="sales_enablement">Sales Enablement</option>
            <option value="customer_success">Customer Success</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seniority Level
          </label>
          <select
            value={profile.seniorityLevel || ''}
            onChange={(e) => onUpdate('seniorityLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Level</option>
            <option value="ic">Individual Contributor</option>
            <option value="manager">Manager</option>
            <option value="director">Director</option>
            <option value="vp">Vice President</option>
            <option value="c_level">C-Level</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Territory
          </label>
          <input
            type="text"
            value={profile.territory || ''}
            onChange={(e) => onUpdate('territory', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., West Coast Enterprise"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Quota
          </label>
          <input
            type="number"
            value={profile.quota?.toString() || ''}
            onChange={(e) => onUpdate('quota', parseFloat(e.target.value) || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2500000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={profile.startDate ? new Date(profile.startDate).toISOString().split('T')[0] : ''}
            onChange={(e) => onUpdate('startDate', e.target.value ? new Date(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={profile.phoneNumber || ''}
            onChange={(e) => onUpdate('phoneNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn URL
          </label>
          <input
            type="url"
            value={profile.linkedinUrl || ''}
            onChange={(e) => onUpdate('linkedinUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://linkedin.com/in/username"
          />
        </div>
      </div>
    </div>
  );
}

// Role & Permissions Tab
function RolePermissionsTab({ 
  user, 
  roleConfig, 
  workspaceId 
}: { 
  user: UserWithProfile | null; 
  roleConfig: any; 
  workspaceId: string; 
}) {
  if (!roleConfig) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No role configuration found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          {roleConfig.displayName}
        </h3>
        <p className="text-blue-700 text-sm mb-3">
          Level {roleConfig.level} • {roleConfig.category.replace('_', ' ')} • {roleConfig.department}
        </p>
        <div className="flex space-x-4 text-sm">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {roleConfig.dataAccess.coreSignalAccess.creditsPerMonth} CoreSignal credits/month
          </span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {roleConfig.dataAccess.coreSignalAccess.enrichmentLevel} enrichment
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Permissions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roleConfig.permissions.map((permission: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="font-medium text-sm text-gray-900">
                {permission.resource}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {permission.actions.join(', ')} • {permission.scope}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Default Applications</h4>
        <div className="flex flex-wrap gap-2">
          {roleConfig.defaultApps.map((app: string) => (
            <span key={app} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
              {app}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Personalization Tab
function PersonalizationTab({ 
  profile, 
  roleConfig, 
  onUpdate 
}: { 
  profile: Partial<UserProfile>; 
  roleConfig: any; 
  onUpdate: (field: keyof UserProfile, value: any) => void; 
}) {
  const updatePersonalization = (field: string, value: any) => {
    const current = profile.intelligenceFocus as any || {};
    onUpdate('intelligenceFocus', { ...current, [field]: value });
  };

  const updateNotifications = (field: string, value: any) => {
    const current = profile.notificationPreferences as any || {};
    onUpdate('notificationPreferences', { ...current, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Communication Style</h4>
        <select
          value={profile.communicationStyle || 'consultative'}
          onChange={(e) => onUpdate('communicationStyle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="direct">Direct</option>
          <option value="consultative">Consultative</option>
          <option value="analytical">Analytical</option>
          <option value="relationship_focused">Relationship Focused</option>
        </select>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Preferred Detail Level</h4>
        <select
          value={profile.preferredDetailLevel || 'detailed'}
          onChange={(e) => onUpdate('preferredDetailLevel', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="summary">Summary</option>
          <option value="detailed">Detailed</option>
          <option value="comprehensive">Comprehensive</option>
        </select>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Intelligence Focus</h4>
        <div className="space-y-3">
          {[
            { key: 'buyingSignals', label: 'Buying Signals' },
            { key: 'competitorMentions', label: 'Competitor Mentions' },
            { key: 'stakeholderMapping', label: 'Stakeholder Mapping' },
            { key: 'technographics', label: 'Technographics' },
            { key: 'financialHealth', label: 'Financial Health' }
          ].map((item) => (
            <label key={item.key} className="flex items-center">
              <input
                type="checkbox"
                checked={(profile.intelligenceFocus as any)?.[item.key] || false}
                onChange={(e) => updatePersonalization(item.key, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// Data Access Tab
function DataAccessTab({ 
  user, 
  roleConfig, 
  profile 
}: { 
  user: UserWithProfile | null; 
  roleConfig: any; 
  profile: Partial<UserProfile>; 
}) {
  if (!roleConfig) return null;

  const dataAccess = roleConfig.dataAccess;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Account Access</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Scope: <span className="font-medium">{dataAccess.accounts.scope}</span></p>
            {dataAccess['accounts']['dealSizeLimit'] && (
              <p>Deal Limit: <span className="font-medium">${dataAccess.accounts.dealSizeLimit.toLocaleString()}</span></p>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Contact Access</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Scope: <span className="font-medium">{dataAccess.contacts.scope}</span></p>
            {dataAccess['contacts']['seniorityLimit'] && (
              <p>Max Level: <span className="font-medium">{dataAccess.contacts.seniorityLimit}</span></p>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">CoreSignal Access</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Status: <span className="font-medium text-green-600">Enabled</span></p>
            <p>Credits: <span className="font-medium">{dataAccess.coreSignalAccess.creditsPerMonth}/month</span></p>
            <p>Level: <span className="font-medium">{dataAccess.coreSignalAccess.enrichmentLevel}</span></p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Intelligence Features</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(dataAccess.intelligence).map(([key, enabled]) => (
            <div key={key} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Current Usage</h4>
        <div className="text-sm text-yellow-700">
          <p>CoreSignal Credits Used: <span className="font-medium">{user?.coreSignalCreditsUsed || 0}</span> / {user?.coreSignalCreditsLimit || 500}</p>
          <p>Last Reset: <span className="font-medium">
            {user?.coreSignalLastReset ? new Date(user.coreSignalLastReset).toLocaleDateString() : 'Never'}
          </span></p>
        </div>
      </div>
    </div>
  );
}

export default EnhancedUserProfile;
