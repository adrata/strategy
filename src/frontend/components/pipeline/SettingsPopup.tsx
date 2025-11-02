"use client";

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { PRESET_TEMPLATES, getPresetTemplate, type PresetTemplateId } from '@/platform/ui/components/daily100Presets';
import { ThemePicker } from '@/platform/ui/components/ThemePicker';
import { 
  XMarkIcon, 
  CogIcon, 
  UserIcon, 
  KeyIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BellIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  phoneNumber: string;
  linkedinUrl: string;
  timezone: string;
  communicationStyle: string;
  preferredDetailLevel: string;
  quota: number;
  territory: string;
  dailyActivityTarget: number;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  weeklyReports?: boolean;
}

interface WorkspaceContext {
  productPortfolio: string[];
  targetIndustries: string[];
  valuePropositions: string[];
  businessModel: string;
  industry: string;
}

export function SettingsPopup({ isOpen, onClose }: SettingsPopupProps) {
  const { user } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'theme' | 'daily100'>('profile');
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
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
    quota: 1000000,
    territory: '',
    dailyActivityTarget: 25,
    emailNotifications: false,
    pushNotifications: false,
    weeklyReports: false
  });

  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext>({
    productPortfolio: [],
    targetIndustries: [],
    valuePropositions: [],
    businessModel: '',
    industry: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Daily 100 settings
  const [daily100Preset, setDaily100Preset] = useState<PresetTemplateId>('elite-seller');
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string;
  }>({ type: null, text: '' });

  // Load settings when popup opens
  useEffect(() => {
    if (isOpen) {
      console.log('⚙️ SettingsPopup: Opening, loading settings...');
      loadSettings();
    } else {
      console.log('⚙️ SettingsPopup: Closed');
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load user settings
      const userResponse = await fetch('/api/settings/user');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.success) {
          console.log('✅ SettingsPopup: Loaded user settings:', userData.settings);
          setUserSettings(userData.settings);
          
          // Load workspace context if available
          if (userData.workspaceContext) {
            setWorkspaceContext(userData.workspaceContext);
          }
        } else {
          console.error('❌ SettingsPopup: Failed to load settings:', userData.error);
        }
      } else {
        console.error('❌ SettingsPopup: HTTP error loading settings:', userResponse.status);
      }
      
      // Load Daily 100 preset preference
      if (user?.id) {
        const workspaceId = user.activeWorkspaceId || '';
        const presetKey = `daily100-preset-${user.id}-${workspaceId}`;
        try {
          const savedPreset = localStorage.getItem(presetKey);
          if (savedPreset) {
            const parsed = JSON.parse(savedPreset);
            if (typeof parsed === 'string' && ['elite-seller', 'pipeline-builder', 'relationship-builder', 'growth-mindset', 'balanced', 'custom-only'].includes(parsed)) {
              setDaily100Preset(parsed as PresetTemplateId);
            }
          }
        } catch (error) {
          console.warn('Failed to load Daily 100 preset:', error);
        }
      }
    } catch (error) {
      console.error('❌ SettingsPopup: Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const saveDaily100Preset = () => {
    if (!user?.id) return;
    
    const workspaceId = user.activeWorkspaceId || '';
    const presetKey = `daily100-preset-${user.id}-${workspaceId}`;
    
    try {
      localStorage.setItem(presetKey, JSON.stringify(daily100Preset));
      console.log('✅ Saved Daily 100 preset:', daily100Preset);
      // Trigger page reload to apply new preset (or could use a refresh mechanism)
      // For now, we'll just save and show success
      alert('Daily 100 preset saved! Changes will take effect on your next visit to the Action List.');
    } catch (error) {
      console.error('Failed to save Daily 100 preset:', error);
      alert('Failed to save preset. Please try again.');
    }
  };

  const handleSaveUserSettings = async () => {
    setLoading(true);
    try {
      console.log('💾 SettingsPopup: Saving user settings:', userSettings);
      const response = await fetch('/api/settings/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userSettings)
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ SettingsPopup: Settings saved successfully');
        alert('Settings saved successfully');
      } else {
        console.error('❌ SettingsPopup: Failed to save settings:', data.error);
        alert('Failed to save settings: ' + data.error);
      }
    } catch (error) {
      console.error('❌ SettingsPopup: Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'New passwords do not match'
      });
      return;
    }
    
    setLoading(true);
    setPasswordMessage({ type: null, text: '' });
    
    try {
      console.log('🔐 SettingsPopup: Changing password via v1 API');
      const response = await fetch('/api/v1/users/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        })
      });

      const data = await response.json();
      console.log('🔐 SettingsPopup: Password change response:', data);
      
      if (data.success) {
        console.log('✅ SettingsPopup: Password updated successfully');
        setPasswordMessage({
          type: 'success',
          text: 'Password updated successfully!'
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordChange(false);
        // Clear message after 5 seconds
        setTimeout(() => {
          setPasswordMessage({ type: null, text: '' });
        }, 5000);
      } else {
        console.error('❌ SettingsPopup: Password change failed:', data.error);
        setPasswordMessage({
          type: 'error',
          text: data.error || 'Failed to update password'
        });
      }
    } catch (error) {
      console.error('❌ SettingsPopup: Error changing password:', error);
      setPasswordMessage({
        type: 'error',
        text: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePasswordStrength = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    return {
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isLongEnough,
      isValid: hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough
    };
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm bg-overlay-bg/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-2xl shadow-2xl border border-border max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-background border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Settings</h2>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-foreground hover:bg-hover'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('theme')}
                className={`w-full text-left px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'theme'
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-foreground hover:bg-hover'
                }`}
              >
                Theme
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'security'
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-foreground hover:bg-hover'
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full text-left px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-foreground hover:bg-hover'
                }`}
              >
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('daily100')}
                className={`w-full text-left px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'daily100'
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-foreground hover:bg-hover'
                }`}
              >
                Daily 100
              </button>
            </nav>
          </div>

          {/* Close Button */}
          <div className="p-4 border-t border-border">
            <button
              onClick={onClose}
              className="w-full text-left px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-hover rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Breadcrumb */}
          <div className="px-6 py-4 border-b border-border bg-background flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted">
                <span>Settings</span>
                <span>›</span>
                <span className="text-foreground font-medium">
                  {activeTab === 'profile' && 'Profile'}
                  {activeTab === 'security' && 'Security'}
                  {activeTab === 'notifications' && 'Notifications'}
                  {activeTab === 'theme' && 'Theme'}
                  {activeTab === 'daily100' && 'Daily 100'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-hover rounded-md transition-colors"
                title="Close settings"
              >
                <XMarkIcon className="h-5 w-5 text-muted" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <div className="transition-all duration-200 ease-in-out">
          {activeTab === 'profile' ? (
            <div className="space-y-6">
              {/* User Profile Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Profile Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={userSettings.firstName}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={userSettings.lastName}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={userSettings.title}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                        placeholder="Account Executive"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Department
                      </label>
                      <select
                        value={userSettings.department}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                      >
                        <option value="">Select department</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Customer Success">Customer Success</option>
                        <option value="Business Development">Business Development</option>
                        <option value="Operations">Operations</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full p-3 border border-border rounded-md bg-panel-background text-muted"
                    />
                    <p className="text-xs text-muted mt-1">Email cannot be changed</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-border">
                <button
                  onClick={handleSaveUserSettings}
                  disabled={loading}
                  className="px-4 py-2 bg-button-background text-button-text rounded-lg hover:bg-button-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          ) : activeTab === 'security' ? (
            <div className="space-y-6">
              {/* Password Change Section */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <KeyIcon className="w-5 h-5" />
                  Change Password
                </h3>
                
                {!showPasswordChange ? (
                  <div className="space-y-4">
                    <p className="text-muted">Keep your account secure by updating your password regularly.</p>
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className="px-4 py-2 bg-button-background text-button-text rounded-lg hover:bg-button-hover transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full p-3 border border-border rounded-md bg-background text-foreground pr-10"
                          placeholder="Enter your current password"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground"
                        >
                          {showPasswords.current ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full p-3 border border-border rounded-md bg-background text-foreground pr-10"
                          placeholder="Enter your new password"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground"
                        >
                          {showPasswords.new ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      
                      {/* Password Strength Indicator */}
                      {passwordData.newPassword && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-muted">Password requirements:</div>
                          {(() => {
                            const validation = validatePasswordStrength(passwordData.newPassword);
                            return (
                              <div className="space-y-1">
                                <div className={`flex items-center gap-2 text-xs ${validation.isLongEnough ? 'text-success' : 'text-error'}`}>
                                  {validation.isLongEnough ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                                  At least 8 characters
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${validation.hasUpperCase ? 'text-success' : 'text-error'}`}>
                                  {validation.hasUpperCase ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                                  One uppercase letter
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${validation.hasLowerCase ? 'text-success' : 'text-error'}`}>
                                  {validation.hasLowerCase ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                                  One lowercase letter
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${validation.hasNumbers ? 'text-success' : 'text-error'}`}>
                                  {validation.hasNumbers ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                                  One number
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${validation.hasSpecialChar ? 'text-success' : 'text-error'}`}>
                                  {validation.hasSpecialChar ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                                  One special character
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full p-3 border border-border rounded-md bg-background text-foreground pr-10"
                          placeholder="Confirm your new password"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground"
                        >
                          {showPasswords.confirm ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      
                      {/* Password Match Indicator */}
                      {passwordData.confirmPassword && (
                        <div className="mt-2">
                          <div className={`flex items-center gap-2 text-xs ${passwordData.newPassword === passwordData.confirmPassword ? 'text-success' : 'text-error'}`}>
                            {passwordData.newPassword === passwordData.confirmPassword ? (
                              <CheckCircleIcon className="w-3 h-3" />
                            ) : (
                              <ExclamationTriangleIcon className="w-3 h-3" />
                            )}
                            {passwordData.newPassword === passwordData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Success/Error Message */}
                    {passwordMessage.type && (
                      <div className={`p-3 rounded-md flex items-center gap-2 ${
                        passwordMessage.type === 'success' 
                          ? 'bg-success-bg border border-success-border text-success-text' 
                          : 'bg-error-bg border border-error-border text-error-text'
                      }`}>
                        {passwordMessage.type === 'success' ? (
                          <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                          <ExclamationTriangleIcon className="w-5 h-5" />
                        )}
                        {passwordMessage.text}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handlePasswordChange}
                        disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="px-4 py-2 bg-button-background text-button-text rounded-lg hover:bg-button-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Changing Password...' : 'Change Password'}
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setPasswordMessage({ type: null, text: '' });
                        }}
                        className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-hover transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'daily100' ? (
            <div className="space-y-6">
              {/* Daily 100 Section */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Daily 100 Preset
                </h3>
                <p className="text-sm text-muted mb-6">
                  Choose your daily checklist template. Your preset items reset each day, while custom items persist.
                </p>
                
                <div className="space-y-3">
                  {PRESET_TEMPLATES.map((preset) => (
                    <label
                      key={preset.id}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        daily100Preset === preset.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="daily100-preset"
                        value={preset.id}
                        checked={daily100Preset === preset.id}
                        onChange={() => setDaily100Preset(preset.id)}
                        className="mt-1 w-4 h-4 border-border text-primary focus:ring-primary focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-foreground">
                            {preset.name}
                          </h4>
                          {daily100Preset === preset.id && (
                            <span className="text-xs px-2 py-0.5 rounded bg-primary text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mb-3">
                          {preset.description}
                        </p>
                        {preset.items.length > 0 && (
                          <ul className="space-y-1.5 mt-2">
                            {preset.items.map((item) => (
                              <li key={item.id} className="text-xs text-muted flex items-start gap-2">
                                <span className="mt-0.5">•</span>
                                <span>{item.text}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {preset.items.length === 0 && (
                          <p className="text-xs text-muted italic">
                            Create your own daily items
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={saveDaily100Preset}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  >
                    Save Preset
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'notifications' ? (
            <div className="space-y-6">
              {/* Notifications Section */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BellIcon className="w-5 h-5" />
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-foreground">Email Notifications</label>
                      <p className="text-xs text-muted">Receive notifications via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={userSettings.emailNotifications}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                      className="rounded border-border bg-background text-primary focus:ring-[var(--focus-ring)] focus:ring-2"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-foreground">Push Notifications</label>
                      <p className="text-xs text-muted">Receive push notifications in browser</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={userSettings.pushNotifications}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                      className="rounded border-border bg-background text-primary focus:ring-[var(--focus-ring)] focus:ring-2"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-foreground">Weekly Reports</label>
                      <p className="text-xs text-muted">Receive weekly performance reports</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={userSettings.weeklyReports}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                      className="rounded border-border bg-background text-primary focus:ring-[var(--focus-ring)] focus:ring-2"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-border">
                <button
                  onClick={handleSaveUserSettings}
                  disabled={loading}
                  className="px-4 py-2 bg-button-background text-button-text rounded-lg hover:bg-button-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Theme Section */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <PaintBrushIcon className="w-5 h-5" />
                  Theme Preferences
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted">
                    Customize the appearance of your workspace. Choose between light and dark themes, or let the system decide.
                  </p>
                  <ThemePicker />
                </div>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}