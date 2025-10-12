"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  XMarkIcon,
  Bars3Icon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  BellIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { ACTION_PLATFORM_APPS } from "@/platform/config";
import type { ActionPlatformApp } from "../types";
import { ThemePicker } from "./ThemePicker";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppPreference {
  id: string;
  isVisible: boolean;
  order: number;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [appPreferences, setAppPreferences] = useState<AppPreference[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'apps' | 'appearance' | 'notifications' | 'account'>('apps');

  // Load preferences from localStorage on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const savedPreferences = localStorage.getItem(
          "aos-app-preferences",
        );
        if (savedPreferences) {
          const parsed = JSON.parse(savedPreferences);
          setAppPreferences(parsed);
          console.log("📱 [SETTINGS] Loaded app preferences:", parsed);
        } else {
          setDefaultPreferences();
        }
      } catch (error) {
        console.error("❌ [SETTINGS] Error loading preferences:", error);
        setDefaultPreferences();
      }
    };

    loadPreferences();
  }, []);

  // Set default preferences based on current ACTION_PLATFORM_APPS
  const setDefaultPreferences = () => {
    const defaultPrefs = ACTION_PLATFORM_APPS.map((app, index) => ({
      id: app.id,
      isVisible: true,
      order: index,
    }));
    setAppPreferences(defaultPrefs);
    console.log("📱 [SETTINGS] Set default preferences:", defaultPrefs);
  };

  // Save preferences to localStorage
  const savePreferences = (preferences: AppPreference[]) => {
    console.log(
      "💾 [SETTINGS] Saving preferences:",
      preferences.map((p) => `${p.id}:${p.order}`).join(", "),
    );

    localStorage.setItem(
      "aos-app-preferences",
      JSON.stringify(preferences),
    );
    setAppPreferences(preferences);

    // Notify other components
    const event = new CustomEvent("aos-apps-updated", {
      detail: preferences,
    });
    window.dispatchEvent(event);

    console.log("✅ [SETTINGS] Preferences saved and event dispatched");
  };

  // Toggle app visibility
  const toggleAppVisibility = (appId: string) => {
    const updatedPreferences = appPreferences.map((pref) =>
      pref['id'] === appId ? { ...pref, isVisible: !pref.isVisible } : pref,
    );
    savePreferences(updatedPreferences);
  };

  // Simplified drag handlers
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    appId: string,
  ) => {
    console.log("🎯 [DRAG] Starting drag for:", appId);

    setDraggedItem(appId);
    e['dataTransfer']['effectAllowed'] = "move";
    e.dataTransfer.setData("text/plain", appId);

    // Add visual feedback
    if (e.target instanceof HTMLElement) {
      e.target['style']['opacity'] = "0.5";
    }
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    appId: string,
  ) => {
    e.preventDefault();
    e['dataTransfer']['dropEffect'] = "move";

    if (draggedItem && draggedItem !== appId) {
      setDragOverItem(appId);
    }
  };

  const handleDragEnter = (
    e: React.DragEvent<HTMLDivElement>,
    appId: string,
  ) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== appId) {
      setDragOverItem(appId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Only clear drag over if we're actually leaving the element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverItem(null);
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    dropTargetId: string,
  ) => {
    e.preventDefault();

    console.log(
      "🎯 [DRAG] Drop on:",
      dropTargetId,
      "dragged item:",
      draggedItem,
    );

    if (!draggedItem || draggedItem === dropTargetId) {
      console.log("🎯 [DRAG] Invalid drop, ignoring");
      resetDragState();
      return;
    }

    // Reorder the apps
    const newPreferences = [...appPreferences];
    const draggedIndex = newPreferences.findIndex((p) => p['id'] === draggedItem);
    const targetIndex = newPreferences.findIndex((p) => p['id'] === dropTargetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      console.log("❌ [DRAG] Could not find indices for reorder");
      resetDragState();
      return;
    }

    // Remove dragged item and insert at target position
    const [movedItem] = newPreferences.splice(draggedIndex, 1);
    if (movedItem) {
      newPreferences.splice(targetIndex, 0, movedItem);
    } else {
      console.log("❌ [DRAG] Moved item is undefined");
      resetDragState();
      return;
    }

    // Update order values
    const reorderedPreferences = newPreferences.map((pref, index) => ({
      ...pref,
      order: index,
    }));

    console.log(
      "✅ [DRAG] Reorder complete:",
      reorderedPreferences.map((p) => `${p.id}:${p.order}`).join(", "),
    );

    savePreferences(reorderedPreferences);
    resetDragState();
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log("🎯 [DRAG] Drag ended");

    // Reset visual feedback
    if (e.target instanceof HTMLElement) {
      e.target['style']['opacity'] = "";
    }

    resetDragState();
  };

  const resetDragState = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Reset to default layout
  const resetToDefault = () => {
    setDefaultPreferences();
    localStorage.removeItem("aos-app-preferences");
    window.dispatchEvent(
      new CustomEvent("aos-apps-updated", {
        detail: null,
      }),
    );
    console.log("🔄 [SETTINGS] Reset to default layout");
  };

  // Get sorted apps for display
  const getSortedApps = () => {
    return appPreferences
      .sort((a, b) => a.order - b.order)
      .map((pref) => {
        const app = ACTION_PLATFORM_APPS.find((a) => a['id'] === pref.id);
        return app ? { ...app, isVisible: pref.isVisible } : null;
      })
      .filter(Boolean) as (ActionPlatformApp & { isVisible: boolean })[];
  };

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e['key'] === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sortedApps = getSortedApps();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`bg-[var(--background)] dark:bg-[var(--foreground)] rounded-2xl shadow-2xl transition-all duration-300 ${
        isExpanded ? 'w-[90vw] max-w-6xl h-[85vh]' : 'w-full max-w-2xl h-[70vh]'
      } overflow-hidden`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] dark:border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Cog6ToothIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)] dark:text-white">
                Settings
              </h2>
              <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)]">
                Customize your Adrata experience
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
              title={isExpanded ? 'Collapse to compact mode' : 'Expand to full mode'}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isExpanded ? 'Compact' : 'Full'}
              </span>
              {isExpanded ? (
                <ArrowsPointingInIcon className="w-5 h-5 text-[var(--muted)]" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5 text-[var(--muted)]" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--hover)] rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
            </button>
          </div>
        </div>

        <div className={`flex ${isExpanded ? 'min-h-[calc(85vh-88px)]' : 'min-h-[calc(70vh-88px)]'}`}>
          {/* Left Panel - Navigation */}
          <div className={`${isExpanded ? 'w-64' : 'w-48'} border-r border-[var(--border)] dark:border-[var(--border)] p-4`}>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('apps')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'apps'
                    ? 'bg-[var(--hover)] text-[var(--foreground)] dark:text-white'
                    : 'text-[var(--muted)] dark:text-[var(--muted)] hover:bg-[var(--panel-background)]'
                }`}
              >
                <Bars3Icon className="w-5 h-5" />
                App Layout
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'appearance'
                    ? 'bg-[var(--hover)] text-[var(--foreground)] dark:text-white'
                    : 'text-[var(--muted)] dark:text-[var(--muted)] hover:bg-[var(--panel-background)]'
                }`}
              >
                <PaintBrushIcon className="w-5 h-5" />
                Appearance
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-[var(--hover)] text-[var(--foreground)] dark:text-white'
                    : 'text-[var(--muted)] dark:text-[var(--muted)] hover:bg-[var(--panel-background)]'
                }`}
              >
                <BellIcon className="w-5 h-5" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'account'
                    ? 'bg-[var(--hover)] text-[var(--foreground)] dark:text-white'
                    : 'text-[var(--muted)] dark:text-[var(--muted)] hover:bg-[var(--panel-background)]'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                Account
              </button>
            </nav>
          </div>

          {/* Right Panel - Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'apps' && (
              <div>
                <h3 className="text-lg font-medium text-[var(--foreground)] dark:text-white mb-4">App Layout</h3>
                <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)] mb-6">
                  Customize which apps appear in your left panel and their order. Drag to reorder, click the eye to hide/show apps.
                </p>
                
                {/* Reset Button */}
                <div className="mb-6">
                  <button
                    onClick={resetToDefaults}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--hover)] hover:bg-[var(--loading-bg)] rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Reset to Defaults
                  </button>
                </div>

                {/* App List */}
                <div className="space-y-3">
                  {sortedApps.map((app) => {
                    const Icon = app.icon;
                    const isBeingDragged = draggedItem === app.id;
                    const isDraggedOver = dragOverItem === app.id;

                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onDragOver={(e) => handleDragOver(e, app.id)}
                        onDragEnter={(e) => handleDragEnter(e, app.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, app.id)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                          isBeingDragged
                            ? "opacity-50 scale-95 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : isDraggedOver
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]"
                              : "border-[var(--border)] dark:border-[var(--border)] hover:bg-[var(--panel-background)]"
                        } ${!app.isVisible ? "opacity-60" : ""}`}
                      >
                        {/* Drag Handle */}
                        <div
                          className="flex items-center justify-center w-8 h-8 text-[var(--muted)] hover:text-[var(--muted)] dark:hover:text-gray-300 transition-colors"
                          title="Drag to reorder"
                        >
                          <Bars3Icon className="w-5 h-5" />
                        </div>

                        {/* App Icon */}
                        <div
                          className="w-8 h-8 flex items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: app.color + "15",
                            color: app.color,
                          }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* App Info */}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[var(--foreground)] dark:text-white">
                            {app.name}
                          </div>
                          <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">
                            {app.description}
                          </div>
                        </div>

                        {/* Visibility Toggle */}
                        <button
                          onClick={() => toggleAppVisibility(app.id)}
                          className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
                          title={app.isVisible ? "Hide app" : "Show app"}
                        >
                          {app.isVisible ? (
                            <EyeIcon className="w-4 h-4 text-[var(--muted)] dark:text-[var(--muted)]" />
                          ) : (
                            <EyeSlashIcon className="w-4 h-4 text-[var(--muted)]" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <h3 className="text-lg font-medium text-[var(--foreground)] dark:text-white mb-4">Appearance</h3>
                <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)] mb-6">
                  Customize the look and feel of your Adrata workspace.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-[var(--foreground)] dark:text-white mb-3">Theme</h4>
                    <ThemePicker />
                  </div>
                  
                  {isExpanded && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-[var(--foreground)] dark:text-white mb-3">Density</h4>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input type="radio" name="density" className="mr-3" defaultChecked />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Comfortable</span>
                          </label>
                          <label className="flex items-center">
                            <input type="radio" name="density" className="mr-3" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Compact</span>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-[var(--foreground)] dark:text-white mb-3">Font Size</h4>
                        <select className="w-full p-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] dark:text-white">
                          <option>Small</option>
                          <option selected>Medium</option>
                          <option>Large</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-lg font-medium text-[var(--foreground)] dark:text-white mb-4">Notifications</h3>
                <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)] mb-6">
                  Control when and how you receive notifications.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)] dark:text-white">Desktop Notifications</div>
                      <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">Show notifications on your desktop</div>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)] dark:text-white">Email Notifications</div>
                      <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">Receive notifications via email</div>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)] dark:text-white">Sound</div>
                      <div className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">Play sound for notifications</div>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div>
                <h3 className="text-lg font-medium text-[var(--foreground)] dark:text-white mb-4">Account</h3>
                <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)] mb-6">
                  Manage your account settings and preferences.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] dark:text-white mb-2">
                      Profile Photo
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                        <UserIcon className="w-8 h-8 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="file" 
                          accept="image/*"
                          className="w-full p-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] dark:focus:border-[var(--border)]"
                        />
                        <p className="text-xs text-[var(--muted)] dark:text-[var(--muted)] mt-1">
                          Upload a profile photo (JPG, PNG, max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] dark:text-white mb-2">
                      Display Name
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] dark:focus:border-[var(--border)]"
                      placeholder="Your display name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] dark:text-white mb-2">
                      Email
                    </label>
                    <input 
                      type="email" 
                      className="w-full p-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-[var(--border)] dark:focus:border-[var(--border)]"
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  {isExpanded && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] dark:text-white mb-2">
                          Time Zone
                        </label>
                        <select className="w-full p-2 border border-[var(--border)] dark:border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] dark:text-white">
                          <option>Pacific Time (PT)</option>
                          <option>Mountain Time (MT)</option>
                          <option>Central Time (CT)</option>
                          <option>Eastern Time (ET)</option>
                        </select>
                      </div>
                      
                      <div className="pt-4 border-t border-[var(--border)] dark:border-[var(--border)]">
                        <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
