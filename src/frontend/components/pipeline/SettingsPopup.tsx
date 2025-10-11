"use client";

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { 
  XMarkIcon, 
  CogIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  KeyIcon,
  BellIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement?: HTMLElement | null;
}

interface WorkspaceSettings {
  // Core Settings
  vertical: string;
  industry: string;
  companySize: string;
  targetMarket: string;
  
  // Enrichment Pipeline Settings
  enrichmentTier: 'free' | 'professional' | 'enterprise' | 'custom';
  maxCostPerRecord: number;
  autoEnrichment: boolean;
  dataRetentionDays: number;
  
  // AI & Intelligence Settings
  aiPersonality: string;
  intelligenceFocus: string[];
  buyingSignalSensitivity: 'low' | 'medium' | 'high';
  
  // Pipeline Settings
  defaultPipelineStages: string[];
  autoStageProgression: boolean;
  leadScoringThreshold: number;
}

interface UserSettings {
  // Profile Information
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  phoneNumber: string;
  linkedinUrl: string;
  
  // Preferences
  timezone: string;
  communicationStyle: 'direct' | 'consultative' | 'analytical' | 'relationship';
  preferredDetailLevel: 'summary' | 'detailed' | 'comprehensive';
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  
  // Performance Settings
  quota: number;
  territory: string;
  dailyActivityTarget: number;
}

function SettingsSection({ title, icon: Icon, children }: { 
  title: string; 
  icon: React.ComponentType<any>; 
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border)]">
        <Icon className="w-5 h-5 text-[var(--muted)]" />
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SettingsField({ 
  label, 
  value, 
  onChange, 
  type = 'text',
  options,
  placeholder,
  description
}: {
  label: string;
  value: string | number | boolean;
  onChange: (value: any) => void;
  type?: 'text' | 'select' | 'number' | 'checkbox' | 'password';
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {description && (
          <span className="block text-xs text-[var(--muted)] font-normal mt-1">
            {description}
          </span>
        )}
      </label>
      
      {type === 'select' ? (
        <select
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
        >
          {options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 text-red-600 border-[var(--border)] rounded focus:ring-red-500"
          />
          <span className="text-sm text-gray-700">Enable this setting</span>
        </label>
      ) : type === 'password' ? (
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 pr-10 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--muted)]"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      ) : (
        <input
          type={type}
          value={value as string | number}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
        />
      )}
    </div>
  );
}

export function SettingsPopup({ isOpen, onClose, anchorElement }: SettingsPopupProps) {
  const { user } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState<'company' | 'user'>('company');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  // Settings state
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings>({
    vertical: 'Technology',
    industry: 'Software',
    companySize: 'Enterprise',
    targetMarket: 'Mid-Market',
    enrichmentTier: 'professional',
    maxCostPerRecord: 0.05,
    autoEnrichment: true,
    dataRetentionDays: 365,
    aiPersonality: 'Professional',
    intelligenceFocus: ['buying_signals', 'competitor_mentions', 'stakeholder_mapping'],
    buyingSignalSensitivity: 'medium',
    defaultPipelineStages: ['Lead', 'Qualified', 'Demo', 'Proposal', 'Negotiation', 'Closed Won'],
    autoStageProgression: true,
    leadScoringThreshold: 75
  });

  const [userSettings, setUserSettings] = useState<UserSettings>({
    firstName: '',
    lastName: '',
    title: '',
    department: '',
    phoneNumber: '',
    linkedinUrl: '',
    timezone: 'America/New_York',
    communicationStyle: 'consultative',
    preferredDetailLevel: 'detailed',
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    quota: 1000000,
    territory: '',
    dailyActivityTarget: 25
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Calculate popup position
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  // Load settings when popup opens
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      const popupWidth = 600;
      const popupHeight = 700;
      
      // Position to the right of the anchor element
      let left = rect.right + 10;
      let top = rect.top;
      
      // Adjust if popup would go off-screen
      if (left + popupWidth > window.innerWidth) {
        left = rect.left - popupWidth - 10;
      }
      
      if (top + popupHeight > window.innerHeight) {
        top = window.innerHeight - popupHeight - 20;
      }
      
      setPopupStyle({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${popupWidth}px`,
        maxHeight: `${popupHeight}px`,
        zIndex: 1000
      });
    }
  }, [isOpen, anchorElement]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load workspace settings
      const workspaceResponse = await fetch('/api/settings/workspace');
      if (workspaceResponse.ok) {
        const workspaceData = await workspaceResponse.json();
        if (workspaceData.success) {
          setWorkspaceSettings(workspaceData.settings);
        }
      }

      // Load user settings
      const userResponse = await fetch('/api/settings/user');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.success) {
          setUserSettings(userData.settings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkspaceSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspaceSettings)
      });

      const data = await response.json();
      if (data.success) {
        alert('Company settings saved successfully');
      } else {
        alert('Failed to save company settings: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving workspace settings:', error);
      alert('Failed to save company settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUserSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userSettings)
      });

      const data = await response.json();
      if (data.success) {
        alert('User settings saved successfully');
      } else {
        alert('Failed to save user settings: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving user settings:', error);
      alert('Failed to save user settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/settings/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      if (data.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordChange(false);
        alert('Password updated successfully');
      } else {
        alert('Failed to update password: ' + data.error);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/settings/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_account'
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Account deletion initiated. You will receive an email confirmation.');
        // Redirect to sign out
        window['location']['href'] = '/sign-in';
      } else {
        alert('Failed to delete account: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />
      
      {/* Settings Popup */}
      <div 
        className="bg-[var(--background)] rounded-lg shadow-2xl border border-[var(--border)] overflow-hidden z-50"
        style={popupStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--panel-background)]">
          <div className="flex items-center gap-2">
            <CogIcon className="w-5 h-5 text-[var(--muted)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--loading-bg)] rounded transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'company'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-background)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BuildingOfficeIcon className="w-4 h-4" />
              Company Settings
            </div>
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'user'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-background)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserIcon className="w-4 h-4" />
              My Settings
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="h-96 overflow-y-auto p-4">
          {activeTab === 'company' ? (
            <div>
              {/* Company Information */}
              <SettingsSection title="Company Information" icon={BuildingOfficeIcon}>
                <div className="grid grid-cols-2 gap-4">
                  <SettingsField
                    label="Vertical"
                    value={workspaceSettings.vertical}
                    onChange={(value) => setWorkspaceSettings(prev => ({ ...prev, vertical: value }))}
                    type="select"
                    options={[
                      { value: 'Technology', label: 'Technology' },
                      { value: 'Healthcare', label: 'Healthcare' },
                      { value: 'Financial Services', label: 'Financial Services' },
                      { value: 'Manufacturing', label: 'Manufacturing' },
                      { value: 'Retail', label: 'Retail' },
                      { value: 'Education', label: 'Education' },
                      { value: 'Government', label: 'Government' },
                      { value: 'Other', label: 'Other' }
                    ]}
                  />
                  <SettingsField
                    label="Industry"
                    value={workspaceSettings.industry}
                    onChange={(value) => setWorkspaceSettings(prev => ({ ...prev, industry: value }))}
                    type="select"
                    options={[
                      { value: 'Software', label: 'Software' },
                      { value: 'SaaS', label: 'SaaS' },
                      { value: 'Cybersecurity', label: 'Cybersecurity' },
                      { value: 'Cloud Infrastructure', label: 'Cloud Infrastructure' },
                      { value: 'Data Analytics', label: 'Data Analytics' },
                      { value: 'AI/ML', label: 'AI/ML' },
                      { value: 'DevOps', label: 'DevOps' },
                      { value: 'Other', label: 'Other' }
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SettingsField
                    label="Company Size"
                    value={workspaceSettings.companySize}
                    onChange={(value) => setWorkspaceSettings(prev => ({ ...prev, companySize: value }))}
                    type="select"
                    options={[
                      { value: 'Startup', label: 'Startup (1-50)' },
                      { value: 'SMB', label: 'Small Business (51-200)' },
                      { value: 'Mid-Market', label: 'Mid-Market (201-1000)' },
                      { value: 'Enterprise', label: 'Enterprise (1000+)' }
                    ]}
                  />
                  <SettingsField
                    label="Target Market"
                    value={workspaceSettings.targetMarket}
                    onChange={(value) => setWorkspaceSettings(prev => ({ ...prev, targetMarket: value }))}
                    type="select"
                    options={[
                      { value: 'SMB', label: 'Small Business' },
                      { value: 'Mid-Market', label: 'Mid-Market' },
                      { value: 'Enterprise', label: 'Enterprise' },
                      { value: 'Mixed', label: 'Mixed' }
                    ]}
                  />
                </div>
              </SettingsSection>

              {/* Enrichment Pipeline */}
              <SettingsSection title="Enrichment Pipeline" icon={ChartBarIcon}>
                <SettingsField
                  label="Enrichment Tier"
                  value={workspaceSettings.enrichmentTier}
                  onChange={(value) => setWorkspaceSettings(prev => ({ ...prev, enrichmentTier: value }))}
                  type="select"
                  options={[
                    { value: 'free', label: 'Free - Basic enrichment' },
                    { value: 'professional', label: 'Professional - AI optimized' },
                    { value: 'enterprise', label: 'Enterprise - Maximum coverage' },
                    { value: 'custom', label: 'Custom - Fully configurable' }
                  ]}
                  description="Controls which data providers and features are available"
                />
                <div className="grid grid-cols-2 gap-4">
                  <SettingsField
                    label="Max Cost Per Record"
                    value={workspaceSettings.maxCostPerRecord}
                    onChange={(value) => setWorkspaceSettings(prev => ({ ...prev, maxCostPerRecord: value }))}
                    type="number"
                    description="Maximum spend per contact enrichment"
                  />
                  <SettingsField
                    label="Data Retention (Days)"
                    value={workspaceSettings.dataRetentionDays}
                    onChange={(value) => setWorkspaceSettings(prev => ({ ...prev, dataRetentionDays: value }))}
                    type="number"
                    description="How long to keep enriched data"
                  />
                </div>
                <SettingsField
                  label="Auto Enrichment"
                  value={workspaceSettings.autoEnrichment}
                  onChange={(value) => setWorkspaceSettings(prev => ({ ...prev, autoEnrichment: value }))}
                  type="checkbox"
                />
              </SettingsSection>

              {/* AI & Intelligence */}
              <SettingsSection title="AI & Intelligence" icon={ShieldCheckIcon}>
                <div className="grid grid-cols-2 gap-4">
                  <SettingsField
                    label="AI Personality"
                    value={workspaceSettings.aiPersonality}
                    onChange={(value) => setWorkspaceSettings(prev => ({ ...prev, aiPersonality: value }))}
                    type="select"
                    options={[
                      { value: 'Professional', label: 'Professional' },
                      { value: 'Analytical', label: 'Analytical' },
                      { value: 'Direct', label: 'Direct' },
                      { value: 'Consultative', label: 'Consultative' }
                    ]}
                  />
                  <SettingsField
                    label="Buying Signal Sensitivity"
                    value={workspaceSettings.buyingSignalSensitivity}
                    onChange={(value) => setWorkspaceSettings(prev => ({ ...prev, buyingSignalSensitivity: value }))}
                    type="select"
                    options={[
                      { value: 'low', label: 'Low - Only strong signals' },
                      { value: 'medium', label: 'Medium - Balanced detection' },
                      { value: 'high', label: 'High - Sensitive detection' }
                    ]}
                  />
                </div>
                <SettingsField
                  label="Lead Scoring Threshold"
                  value={workspaceSettings.leadScoringThreshold}
                  onChange={(value) => setWorkspaceSettings(prev => ({ ...prev, leadScoringThreshold: value }))}
                  type="number"
                  description="Minimum score for qualified leads (0-100)"
                />
              </SettingsSection>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                <button
                  onClick={handleSaveWorkspaceSettings}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Company Settings'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Profile Information */}
              <SettingsSection title="Profile Information" icon={UserIcon}>
                <div className="grid grid-cols-2 gap-4">
                  <SettingsField
                    label="First Name"
                    value={userSettings.firstName}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, firstName: value }))}
                    placeholder="Enter first name"
                  />
                  <SettingsField
                    label="Last Name"
                    value={userSettings.lastName}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, lastName: value }))}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SettingsField
                    label="Title"
                    value={userSettings.title}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, title: value }))}
                    placeholder="Account Executive"
                  />
                  <SettingsField
                    label="Department"
                    value={userSettings.department}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, department: value }))}
                    type="select"
                    options={[
                      { value: 'Sales', label: 'Sales' },
                      { value: 'Marketing', label: 'Marketing' },
                      { value: 'Customer Success', label: 'Customer Success' },
                      { value: 'Business Development', label: 'Business Development' },
                      { value: 'Operations', label: 'Operations' },
                      { value: 'Executive', label: 'Executive' }
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SettingsField
                    label="Phone Number"
                    value={userSettings.phoneNumber}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, phoneNumber: value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                  <SettingsField
                    label="LinkedIn URL"
                    value={userSettings.linkedinUrl}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, linkedinUrl: value }))}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </SettingsSection>

              {/* Preferences */}
              <SettingsSection title="Preferences" icon={BellIcon}>
                <div className="grid grid-cols-2 gap-4">
                  <SettingsField
                    label="Timezone"
                    value={userSettings.timezone}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, timezone: value }))}
                    type="select"
                    options={[
                      { value: 'America/New_York', label: 'Eastern Time' },
                      { value: 'America/Chicago', label: 'Central Time' },
                      { value: 'America/Denver', label: 'Mountain Time' },
                      { value: 'America/Los_Angeles', label: 'Pacific Time' },
                      { value: 'Europe/London', label: 'London' },
                      { value: 'Europe/Paris', label: 'Paris' },
                      { value: 'Asia/Tokyo', label: 'Tokyo' }
                    ]}
                  />
                  <SettingsField
                    label="Communication Style"
                    value={userSettings.communicationStyle}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, communicationStyle: value }))}
                    type="select"
                    options={[
                      { value: 'direct', label: 'Direct' },
                      { value: 'consultative', label: 'Consultative' },
                      { value: 'analytical', label: 'Analytical' },
                      { value: 'relationship', label: 'Relationship-focused' }
                    ]}
                  />
                </div>
                <SettingsField
                  label="Preferred Detail Level"
                  value={userSettings.preferredDetailLevel}
                  onChange={(value) => setUserSettings(prev => ({ ...prev, preferredDetailLevel: value }))}
                  type="select"
                  options={[
                    { value: 'summary', label: 'Summary - Key points only' },
                    { value: 'detailed', label: 'Detailed - Comprehensive info' },
                    { value: 'comprehensive', label: 'Comprehensive - Everything' }
                  ]}
                />
                <div className="space-y-2">
                  <SettingsField
                    label="Email Notifications"
                    value={userSettings.emailNotifications}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, emailNotifications: value }))}
                    type="checkbox"
                  />
                  <SettingsField
                    label="Push Notifications"
                    value={userSettings.pushNotifications}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, pushNotifications: value }))}
                    type="checkbox"
                  />
                  <SettingsField
                    label="Weekly Reports"
                    value={userSettings.weeklyReports}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, weeklyReports: value }))}
                    type="checkbox"
                  />
                </div>
              </SettingsSection>

              {/* Performance Settings */}
              <SettingsSection title="Performance Settings" icon={ChartBarIcon}>
                <div className="grid grid-cols-2 gap-4">
                  <SettingsField
                    label="Annual Quota"
                    value={userSettings.quota}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, quota: value }))}
                    type="number"
                    description="Annual revenue target"
                  />
                  <SettingsField
                    label="Daily Activity Target"
                    value={userSettings.dailyActivityTarget}
                    onChange={(value) => setUserSettings(prev => ({ ...prev, dailyActivityTarget: value }))}
                    type="number"
                    description="Daily activities goal"
                  />
                </div>
                <SettingsField
                  label="Territory"
                  value={userSettings.territory}
                  onChange={(value) => setUserSettings(prev => ({ ...prev, territory: value }))}
                  placeholder="West Coast, Enterprise Accounts"
                />
              </SettingsSection>

              {/* Account Security */}
              <SettingsSection title="Account Security" icon={KeyIcon}>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="w-full text-left px-3 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Change Password</span>
                      <KeyIcon className="w-4 h-4 text-[var(--muted)]" />
                    </div>
                  </button>
                  
                  {showPasswordChange && (
                    <div className="bg-[var(--panel-background)] p-4 rounded-lg space-y-3">
                      <SettingsField
                        label="Current Password"
                        value={passwordData.currentPassword}
                        onChange={(value) => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
                        type="password"
                        placeholder="Enter current password"
                      />
                      <SettingsField
                        label="New Password"
                        value={passwordData.newPassword}
                        onChange={(value) => setPasswordData(prev => ({ ...prev, newPassword: value }))}
                        type="password"
                        placeholder="Enter new password"
                      />
                      <SettingsField
                        label="Confirm New Password"
                        value={passwordData.confirmPassword}
                        onChange={(value) => setPasswordData(prev => ({ ...prev, confirmPassword: value }))}
                        type="password"
                        placeholder="Confirm new password"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handlePasswordChange}
                          disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Updating...' : 'Update Password'}
                        </button>
                        <button
                          onClick={() => setShowPasswordChange(false)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                    className="w-full text-left px-3 py-2 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-600">Delete Account</span>
                      <TrashIcon className="w-4 h-4 text-red-400" />
                    </div>
                  </button>
                  
                  {showDeleteConfirm && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-sm text-red-800 mb-3">
                        This will permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={loading}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          {loading ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </SettingsSection>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                <button
                  onClick={handleSaveUserSettings}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Save My Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
