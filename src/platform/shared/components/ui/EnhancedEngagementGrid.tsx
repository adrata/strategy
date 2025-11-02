"use client";

import React, { useState, useEffect, useCallback } from "react";
import { EngagementGrid } from "./EngagementGrid";

interface EnhancedEngagementGridProps {
  userId?: string;
  className?: string;
}

/**
 * 🚀 ENHANCED ENGAGEMENT GRID - Chrome Extension Integration
 *
 * 5-Level Engagement System:
 * Level 0: No activity (gray)
 * Level 1: Light activity - 1-2 actions (light blue)
 * Level 2: Moderate activity - 3-5 actions (medium blue)
 * Level 3: Good activity - 6-10 actions (bright blue)
 * Level 4: High activity - 11-20 actions (dark blue)
 * Level 5: Power user - 21+ actions (blue-purple gradient!)
 */

/**
 * 📊 Enhanced Engagement Grid with Chrome Extension Intelligence
 */
export function EnhancedEngagementGrid({
  userId,
  className = "",
}: EnhancedEngagementGridProps) {
  const [extensionData, setExtensionData] = useState<any>({});
  const [totalStats, setTotalStats] = useState({
    web: 0,
    desktop: 0,
    extension: 0,
    total: 0,
  });

  /**
   * 📈 Calculate platform statistics
   */
  const calculatePlatformStats = useCallback((extensionData: any) => {
    const today = new Date().toISOString().split("T")[0];
    const thisWeek = getThisWeekDates();

    let webCount = 0;
    let desktopCount = 0;
    let extensionCount = 0;

    // Count extension activities
    Object.keys(extensionData || {}).forEach((dateKey) => {
      if (
        dateKey &&
        thisWeek.includes(dateKey) &&
        extensionData &&
        extensionData[dateKey]
      ) {
        extensionCount += extensionData[dateKey].count || 0;
      }
    });

    // Get web/desktop counts from main engagement tracker
    const mainEngagement = getMainEngagementData();
    Object.keys(mainEngagement || {}).forEach((date) => {
      if (thisWeek.includes(date) && mainEngagement[date]) {
        const dayData = mainEngagement[date];
        if (dayData?.activities && Array.isArray(dayData.activities)) {
          dayData.activities.forEach((activity: any) => {
            if (activity?.type?.includes("web_")) webCount++;
            else if (activity?.type?.includes("desktop_")) desktopCount++;
          });
        }
      }
    });

    return {
      web: webCount,
      desktop: desktopCount,
      extension: extensionCount,
      total: webCount + desktopCount + extensionCount,
    };
  }, []);

  /**
   * 🔄 Load Chrome extension engagement data
   */
  const loadExtensionEngagementData = useCallback(async () => {
    try {
      // Get Chrome extension storage data if available
      if (
        typeof (globalThis as any).chrome !== "undefined" &&
        (globalThis as any).chrome.storage
      ) {
        const result = await (globalThis as any).chrome.storage.local.get([
          "adrata_extension_engagement",
        ]);
        const extensionEngagement = result.adrata_extension_engagement || {};
        setExtensionData(extensionEngagement);

        // Calculate stats
        const stats = calculatePlatformStats(extensionEngagement);
        setTotalStats(stats);
      } else {
        console.log("Chrome extension not available, using web-only data");
      }
    } catch (error) {
      console.warn("Could not load extension data:", error);
    }
  }, [calculatePlatformStats]);

  useEffect(() => {
    loadExtensionEngagementData();

    // Listen for extension activity updates
    const handleExtensionUpdate = () => {
      loadExtensionEngagementData();
    };

    window.addEventListener(
      "extension-engagement-updated",
      handleExtensionUpdate,
    );

    return () => {
      window.removeEventListener(
        "extension-engagement-updated",
        handleExtensionUpdate,
      );
    };
  }, [loadExtensionEngagementData]);

  /**
   * 📅 Get this week's dates
   */
  function getThisWeekDates(): string[] {
    const dates: string[] = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateString = date.toISOString().split("T")[0];
      if (dateString) {
        dates.push(dateString);
      }
    }

    return dates;
  }

  /**
   * 📊 Get main platform engagement data
   */
  function getMainEngagementData() {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("adrata_user_engagement");
        return stored ? JSON.parse(stored) : {};
      }
    } catch {
      return {};
    }
    return {};
  }

  /**
   * 📈 Get Chrome extension activity for today
   */
  function getExtensionTodayCount(extensionData: any): number {
    const today = new Date().toISOString().split("T")[0];
    if (!today) return 0;
    return extensionData?.[today]?.count || 0;
  }

  /**
   * 📊 Get top Chrome extension activities this week
   */
  function getTopExtensionActivities(
    extensionData: any,
  ): Array<{ name: string; count: number }> {
    const thisWeek = getThisWeekDates();
    const activities: Record<string, number> = {};

    thisWeek.forEach((date) => {
      if (date && extensionData && extensionData[date]) {
        const dayData = extensionData[date];
        if (dayData?.types) {
          Object.entries(dayData.types).forEach(([type, count]) => {
            activities[type] = (activities[type] || 0) + (count as number);
          });
        }
      }
    });

    return Object.entries(activities)
      .map(([name, count]) => ({
        name: name.replace("extension_", "").replace(/_/g, " "),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  // Render only if userId is provided (avoid undefined errors)
  if (!userId) {
    return (
      <div
        className={`p-6 border border-border rounded-lg ${className}`}
      >
        <div className="text-center text-muted">
          <p>👤 Please log in to view engagement data</p>
        </div>
      </div>
    );
  }

  const todayExtensionCount = getExtensionTodayCount(extensionData);
  const topActivities = getTopExtensionActivities(extensionData);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 📊 Enhanced Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {totalStats.web}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            🌐 Web Actions
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {totalStats.desktop}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            🖥️ Desktop Actions
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {totalStats.extension}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            🔌 Extension Actions
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {totalStats.total}
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">
            🚀 Total Actions
          </div>
        </div>
      </div>

      {/* 🌟 Chrome Extension Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-indigo-200 dark:border-indigo-800">
        <h4 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200 mb-4">
          🔌 Chrome Extension Intelligence
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
              {todayExtensionCount}
            </div>
            <div className="text-sm text-indigo-600 dark:text-indigo-400">
              Today&apos;s LinkedIn Actions
            </div>
          </div>

          <div>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {totalStats.extension}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              Weekly Analyses
            </div>
          </div>

          <div>
            <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Most Used:
            </div>
            <div className="text-sm text-muted dark:text-muted">
              {topActivities.length > 0 && topActivities[0]
                ? topActivities[0].name
                : "No activity yet"}
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 Cross-Platform Intelligence */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-6 rounded-lg border border-teal-200 dark:border-teal-800">
        <h4 className="text-lg font-semibold text-teal-800 dark:text-teal-200 mb-3">
          🧠 Cross-Platform Intelligence
        </h4>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-teal-700 dark:text-teal-300">
              🌐 Most active platform:
            </span>
            <span className="font-medium">
              {totalStats.web > totalStats['desktop'] &&
              totalStats.web > totalStats.extension
                ? "Web"
                : totalStats.desktop > totalStats.extension
                  ? "Desktop"
                  : "Chrome Extension"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-teal-700 dark:text-teal-300">
              📊 Engagement spread:
            </span>
            <span className="font-medium">
              {totalStats.total > 50
                ? "Power User"
                : totalStats.total > 20
                  ? "High Engagement"
                  : totalStats.total > 10
                    ? "Good Activity"
                    : "Getting Started"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-teal-700 dark:text-teal-300">
              🎯 LinkedIn focus:
            </span>
            <span className="font-medium">
              {totalStats.extension > 10
                ? "LinkedIn Pro"
                : totalStats.extension > 5
                  ? "Active Networker"
                  : "Exploring"}
            </span>
          </div>
        </div>
      </div>

      {/* 📈 Original Engagement Grid with Enhanced Data */}
      <div className="bg-background dark:bg-foreground p-6 rounded-lg border border-border">
        <h4 className="text-lg font-semibold text-foreground mb-4">
          📈 5-Level Engagement Heatmap
        </h4>

        {/* 🎨 5-Level Legend */}
        <div className="mb-4 p-4 bg-panel-background rounded-lg">
          <div className="text-sm font-medium text-foreground mb-2">
            5-Level System:
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-hover rounded-sm"></div>
              <span>Level 0: No activity</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900 rounded-sm"></div>
              <span>Level 1: Light (1-2)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-300 dark:bg-blue-700 rounded-sm"></div>
              <span>Level 2: Moderate (3-5)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 dark:bg-blue-500 rounded-sm"></div>
              <span>Level 3: Good (6-10)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-700 dark:bg-blue-400 rounded-sm"></div>
              <span>Level 4: High (11-20)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-800 to-purple-800 rounded-sm"></div>
              <span>Level 5: Power User (21+)! 🚀</span>
            </div>
          </div>
        </div>

        {/* Enhanced Engagement Grid */}
        <EngagementGrid
          userId={userId}
          showTooltips={true}
          showStats={true}
          className="enhanced-grid"
        />
      </div>
    </div>
  );
}
