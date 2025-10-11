"use client";

import React, { useState } from "react";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";

interface MonacoAnalyticsViewProps {
  // Add any props needed for analytics
}

export function MonacoAnalyticsView({}: MonacoAnalyticsViewProps) {
  const [activeAnalyticsSection, setActiveAnalyticsSection] =
    useState("overview");

  const analyticsLeftPanel = (
    <div className="w-[13.085rem] min-w-[13.085rem] max-w-[13.085rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col pt-0 pr-2 pb-6 pl-2 overflow-y-auto">
      <div className="flex-1 flex flex-col">
        <div className="mx-2 mt-4 mb-6">
          <h3 className="text-xl font-bold mb-0.5 mt-[2px]">Analytics</h3>
          <p className="text-[var(--muted)] mt-0 mb-1">
            Performance insights and metrics
          </p>
        </div>

        {/* Analytics Sections */}
        <div>
          <h3 className="text-xs font-bold text-[var(--muted)] uppercase mb-2 pl-2 tracking-widest">
            METRICS
          </h3>

          {[
            {
              id: "overview",
              name: "Overview",
              description: "Key performance indicators",
              icon: ChartBarIcon,
            },
            {
              id: "trends",
              name: "Trends",
              description: "Performance over time",
              icon: ArrowTrendingUpIcon,
            },
            {
              id: "engagement",
              name: "Engagement",
              description: "Prospect interactions",
              icon: UsersIcon,
            },
            {
              id: "companies",
              name: "Companies",
              description: "Company analytics",
              icon: BuildingOffice2Icon,
            },
          ].map((section) => (
            <div
              key={section.id}
              className={`pl-3 pr-4 py-2 rounded-lg cursor-pointer font-medium text-base transition-colors mb-0.5 ${
                activeAnalyticsSection === section.id
                  ? "bg-[var(--hover-bg)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)]"
              }`}
              onClick={() => setActiveAnalyticsSection(section.id)}
            >
              <div className="flex items-center gap-2 mb-1">
                <section.icon className="w-4 h-4" />
                <span>{section.name}</span>
              </div>
              <div className="text-xs text-[var(--muted)]">
                {section.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalyticsContent = () => {
    switch (activeAnalyticsSection) {
      case "overview":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">Active Prospects</h3>
                <p className="text-3xl font-bold text-[#2563EB] mb-2">1,247</p>
                <p className="text-sm text-[var(--muted)]">
                  +12% from last month
                </p>
              </div>
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">Engagement Rate</h3>
                <p className="text-3xl font-bold text-[#10B981] mb-2">68%</p>
                <p className="text-sm text-[var(--muted)]">
                  +5% from last month
                </p>
              </div>
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">Conversion Rate</h3>
                <p className="text-3xl font-bold text-[#F59E0B] mb-2">23%</p>
                <p className="text-sm text-[var(--muted)]">
                  +8% from last month
                </p>
              </div>
            </div>
          </div>
        );
      case "trends":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Trends
            </h2>
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
              <p className="text-[var(--muted)]">
                Trend analysis and forecasting coming soon...
              </p>
            </div>
          </div>
        );
      case "engagement":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Engagement
            </h2>
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Prospect Engagement
              </h3>
              <p className="text-[var(--muted)]">
                Engagement metrics and analysis coming soon...
              </p>
            </div>
          </div>
        );
      case "companies":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              Company Analytics
            </h2>
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Company Performance
              </h3>
              <p className="text-[var(--muted)]">
                Company analytics and insights coming soon...
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-[var(--background)]">
      {analyticsLeftPanel}
      <div className="flex-1 min-w-0">{renderAnalyticsContent()}</div>
    </div>
  );
}
