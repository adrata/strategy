"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth";
import CostOptimizationDashboard from "@/platform/ui/components/cost-optimization/CostOptimizationDashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/platform/shared/components/ui/card";
import { Button } from "@/platform/shared/components/ui/button";
import { EnhancedEngagementGrid } from "@/platform/shared/components/ui/EnhancedEngagementGrid";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUnifiedAuth();
  const [showCostOptimization, setShowCostOptimization] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("auto");
  const [aiPersonality, setAiPersonality] = useState("tough-love");
  const [aiIntelligence, setAiIntelligence] = useState("max");

  // Use the user's actual workspace
  const workspaceId = user?.workspaces?.[0]?.id || "c854dff0-27db-4e79-a47b-787b0618a353";

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme);
    // TODO: Implement theme switching logic
    console.log("Theme changed to:", theme);
  };

  const handleAIPersonalityChange = (personality: string) => {
    setAiPersonality(personality);
    // TODO: Save to user preferences
    console.log("AI personality changed to:", personality);
  };

  const handleAIIntelligenceChange = (intelligence: string) => {
    setAiIntelligence(intelligence);
    // TODO: Save to user preferences
    console.log("AI intelligence changed to:", intelligence);
  };

  if (showCostOptimization) {
    return (
      <div className="min-h-screen bg-[var(--panel-background)]">
        <div className="p-6">
          <Button
            onClick={() => setShowCostOptimization(false)}
            className="mb-4"
          >
            Back to Profile
          </Button>
          <CostOptimizationDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[var(--background)] p-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                Profile Settings
            </h1>
              <p className="text-[var(--muted)]">
                Manage your preferences and platform settings
              </p>
            </div>
            <Button
              onClick={() => router.push("../")}
              variant="outline"
            >
              Back to Grand Central
            </Button>
          </div>

          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[var(--primary)] rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user?.name?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    {user?.name}
                  </h3>
                  <p className="text-[var(--muted)]">{user?.email}</p>
                  <p className="text-sm text-[var(--muted)]">
                    Workspace: {user?.workspaces?.[0]?.name || 'Default Workspace'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Platform Engagement Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Cross-Platform Intelligence</CardTitle>
              <p className="text-sm text-[var(--muted)]">
                Track your activity across all Adrata platforms: Web, Desktop, Chrome Extension & Mobile
              </p>
            </CardHeader>
            <CardContent>
              {user?.id && <EnhancedEngagementGrid userId={user.id} />}
            </CardContent>
          </Card>

          {/* AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant Configuration</CardTitle>
              <p className="text-sm text-[var(--muted)]">
                Customize your AI assistant personality and intelligence level
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    AI Personality
                  </label>
                  <select 
                    value={aiPersonality}
                    onChange={(e) => handleAIPersonalityChange(e.target.value)}
                    className="w-full p-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                  >
                    <option value="professional">Professional & Direct</option>
                    <option value="friendly">Friendly & Supportive</option>
                    <option value="tough-love">Tough Love (Dano's preference)</option>
                    <option value="analytical">Analytical & Data-driven</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Intelligence Level
                  </label>
                  <select 
                    value={aiIntelligence}
                    onChange={(e) => handleAIIntelligenceChange(e.target.value)}
                    className="w-full p-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                  >
                    <option value="pro">Pro - Essential AI for growing teams</option>
                    <option value="max">Max - Advanced intelligence for sales teams</option>
                    <option value="fury">Fury - Ultimate AI supremacy for enterprise</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Writing Style & Memory */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Communication Style</CardTitle>
              <p className="text-sm text-[var(--muted)]">
                Help Adrata learn your writing style for emails and communication
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Writing Style Preferences
                  </label>
                  <textarea
                    placeholder="Describe how you like to communicate (e.g., 'I prefer direct, concise emails with clear action items' or 'I like a warm, conversational tone with personal touches')"
                    rows={3}
                    className="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)]"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    This helps Adrata write emails and responses that match your personal style
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Persistent Memory & Rules
                  </label>
                  <textarea
                    placeholder="Important context Adrata should always remember (e.g., 'I work in retail fixtures', 'Never mention competitors', 'Always include ROI in proposals')"
                    rows={4}
                    className="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)]"
                  />
                  <p className="text-xs text-[var(--muted)] mt-1">
                    This context will be included in every AI conversation to ensure consistent, personalized responses
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useEmojis"
                    checked={false} // Default to false as per user requirements
                    onChange={(e) => console.log('Toggle emojis:', e.target.checked)}
                    className="rounded border-[var(--border)]"
                  />
                  <label htmlFor="useEmojis" className="text-sm text-[var(--foreground)]">
                    Use emojis in responses
                  </label>
                </div>
                <button
                  onClick={() => console.log('Save writing preferences')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Themes */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Preferences</CardTitle>
              <p className="text-sm text-[var(--muted)]">
                Customize your interface appearance
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => handleThemeChange('light')}
                  className={`p-3 border rounded-md hover:bg-[var(--hover-bg)] transition-colors ${
                    selectedTheme === 'light' ? 'border-[var(--primary)] bg-[var(--primary-bg)]' : 'border-[var(--border)]'
                  }`}
                >
                  <div className="w-full h-6 bg-[var(--background)] border rounded mb-2"></div>
                  <span className="text-xs">Light</span>
                </button>
                <button 
                  onClick={() => handleThemeChange('dark')}
                  className={`p-3 border rounded-md hover:bg-[var(--hover-bg)] transition-colors ${
                    selectedTheme === 'dark' ? 'border-[var(--primary)] bg-[var(--primary-bg)]' : 'border-[var(--border)]'
                  }`}
                >
                  <div className="w-full h-6 bg-gray-800 rounded mb-2"></div>
                  <span className="text-xs">Dark</span>
                </button>
                <button 
                  onClick={() => handleThemeChange('auto')}
                  className={`p-3 border rounded-md hover:bg-[var(--hover-bg)] transition-colors ${
                    selectedTheme === 'auto' ? 'border-[var(--primary)] bg-[var(--primary-bg)]' : 'border-[var(--border)]'
                  }`}
                >
                  <div className="w-full h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded mb-2"></div>
                  <span className="text-xs">Auto</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <p className="text-sm text-[var(--muted)]">
                Manage your data and privacy settings
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Export My Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Privacy Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Data Retention Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => setShowCostOptimization(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Cost Optimization Dashboard
                </Button>
                <Button
                  onClick={() => router.push("../integrations")}
                  variant="outline"
                >
                  Manage Integrations
                </Button>
                <Button
                  onClick={() => router.push("/optimization")}
                  variant="outline"
                >
                  View Full Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}