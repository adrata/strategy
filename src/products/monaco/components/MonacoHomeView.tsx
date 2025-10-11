"use client";

import React, { useEffect } from "react";
import {
  ChartBarIcon,
  UsersIcon,
  EnvelopeIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

interface MonacoHomeViewProps {
  // Add any props needed for home dashboard
}

export function MonacoHomeView({}: MonacoHomeViewProps) {
  // Set browser title
  useEffect(() => {
    document.title = 'Monaco • Analytics';
  }, []);
  const homeLeftPanel = (
    <div className="w-[13.335rem] min-w-[13.335rem] max-w-[13.335rem] bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col pt-0 pr-2 pb-6 pl-2 overflow-y-auto">
      <div className="flex-1 flex flex-col">
        <div className="mx-2 mt-4 mb-6">
          <h3 className="text-xl font-bold mb-0.5 mt-[2px]">Home</h3>
          <p className="text-[var(--muted)] mt-0 mb-1">
            Dashboard and overview
          </p>
        </div>

        {/* Quick Stats */}
        <div>
          <h3 className="text-xs font-bold text-[var(--muted)] uppercase mb-2 pl-2 tracking-widest">
            QUICK STATS
          </h3>

          <div className="space-y-2">
            <div className="pl-3 pr-4 py-2 rounded-lg bg-[var(--hover-bg)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Prospects</span>
                <span className="text-lg font-bold text-[#2563EB]">1,247</span>
              </div>
            </div>
            <div className="pl-3 pr-4 py-2 rounded-lg bg-[var(--hover-bg)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">This Week</span>
                <span className="text-lg font-bold text-[#10B981]">89</span>
              </div>
            </div>
            <div className="pl-3 pr-4 py-2 rounded-lg bg-[var(--hover-bg)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Rate</span>
                <span className="text-lg font-bold text-[#F59E0B]">23%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const homeContent = (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
        Welcome to Monaco
      </h1>
      <p className="text-[var(--muted)] mb-8">
        Your AI-powered prospecting platform
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#2563EB]/10 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold">Analytics</h3>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)] mb-1">
            68%
          </p>
          <p className="text-sm text-[var(--muted)]">Engagement Rate</p>
        </div>

        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-[#10B981]" />
            </div>
            <h3 className="text-lg font-semibold">Prospects</h3>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)] mb-1">
            1,247
          </p>
          <p className="text-sm text-[var(--muted)]">Active This Month</p>
        </div>

        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center">
              <EnvelopeIcon className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <h3 className="text-lg font-semibold">Sequences</h3>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)] mb-1">12</p>
          <p className="text-sm text-[var(--muted)]">Currently Running</p>
        </div>

        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#8B5CF6]/10 rounded-lg flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <h3 className="text-lg font-semibold">Growth</h3>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)] mb-1">
            +24%
          </p>
          <p className="text-sm text-[var(--muted)]">vs Last Month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
              <span className="text-sm">
                New prospect added to SaaS Outreach sequence
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#2563EB] rounded-full"></div>
              <span className="text-sm">
                Response received from TechCorp Solutions
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#F59E0B] rounded-full"></div>
              <span className="text-sm">
                Sequence &quot;Enterprise Follow-up&quot; completed
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">
            Top Performing Sequences
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">SaaS Outreach Q4</span>
              <span className="text-sm font-semibold text-[#10B981]">
                31% response
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Enterprise Follow-up</span>
              <span className="text-sm font-semibold text-[#10B981]">
                28% response
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Product Demo Request</span>
              <span className="text-sm font-semibold text-[#2563EB]">
                23% response
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-[var(--background)]">
      {homeLeftPanel}
      <div className="flex-1 min-w-0">{homeContent}</div>
    </div>
  );
}
