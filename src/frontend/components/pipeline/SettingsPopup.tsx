"use client";

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
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
  SparklesIcon
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
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'ai-context'>('profile');
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
    dailyActivityTarget: 25
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
    } catch (error) {
      console.error('❌ SettingsPopup: Error loading settings:', error);
    } finally {
      setLoading(false);
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
      className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--background)] rounded-2xl shadow-2xl border border-[var(--border)] max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient icon */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CogIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Settings</h2>
              <p className="text-sm text-[var(--muted)]">Customize your Adrata experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-background)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserIcon className="w-4 h-4" />
              Profile
            </div>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'security'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-background)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ShieldCheckIcon className="w-4 h-4" />
              Security
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-background)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BellIcon className="w-4 h-4" />
              Notifications
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto p-6">
          {activeTab === 'profile' ? (
            <div className="space-y-6">
              {/* User Profile Information */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Profile Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={userSettings.firstName}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={userSettings.lastName}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={userSettings.title}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                        placeholder="Account Executive"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Department
                      </label>
                      <select
                        value={userSettings.department}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
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
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--panel-background)] text-[var(--muted)]"
                    />
                    <p className="text-xs text-[var(--muted)] mt-1">Email cannot be changed</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                <button
                  onClick={handleSaveUserSettings}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          ) : activeTab === 'security' ? (
            <div className="space-y-6">
              {/* Password Change Section */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <KeyIcon className="w-5 h-5" />
                  Change Password
                </h3>
                
                {!showPasswordChange ? (
                  <div className="space-y-4">
                    <p className="text-[var(--muted)]">Keep your account secure by updating your password regularly.</p>
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] pr-10"
                          placeholder="Enter your current password"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
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
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] pr-10"
                          placeholder="Enter your new password"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
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
                          <div className="text-xs text-[var(--muted)]">Password requirements:</div>
                          {(() => {
                            const validation = validatePasswordStrength(passwordData.newPassword);
                            return (
                              <div className="space-y-1">
                                <div className={`flex items-center gap-2 text-xs ${validation.isLongEnough ? 'text-green-600' : 'text-red-600'}`}>
                                  {validation.isLongEnough ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                                  At least 8 characters
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${validation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                                  {validation.hasUpperCase ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                                  One uppercase letter
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${validation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                                  {validation.hasLowerCase ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                                  One lowercase letter
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${validation.hasNumbers ? 'text-green-600' : 'text-red-600'}`}>
                                  {validation.hasNumbers ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                                  One number
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${validation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
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
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] pr-10"
                          placeholder="Confirm your new password"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
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
                          <div className={`flex items-center gap-2 text-xs ${passwordData.newPassword === passwordData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
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
                          ? 'bg-green-50 border border-green-200 text-green-700' 
                          : 'bg-red-50 border border-red-200 text-red-700'
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Changing Password...' : 'Change Password'}
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setPasswordMessage({ type: null, text: '' });
                        }}
                        className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--hover)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Notifications Section */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <BellIcon className="w-5 h-5" />
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-[var(--foreground)]">Email Notifications</label>
                      <p className="text-xs text-[var(--muted)]">Receive notifications via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={userSettings.emailNotifications}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-[var(--foreground)]">Push Notifications</label>
                      <p className="text-xs text-[var(--muted)]">Receive push notifications in browser</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={userSettings.pushNotifications}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-[var(--foreground)]">Weekly Reports</label>
                      <p className="text-xs text-[var(--muted)]">Receive weekly performance reports</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={userSettings.weeklyReports}
                      onChange={(e) => setUserSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                      className="rounded border-[var(--border)]"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                <button
                  onClick={handleSaveUserSettings}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}