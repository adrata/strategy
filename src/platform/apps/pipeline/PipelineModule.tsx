"use client";

import React from "react";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";

export function PipelineContentModule() {
  const { 
    ui: { activeSection },
    data: { acquireData } 
  } = useRevenueOS();

  const renderContent = () => {
    switch (activeSection) {
      case "leads":
        return <div className="p-4"><h3 className="text-lg font-semibold">Pipeline Leads</h3><p className="text-[var(--muted)]">Manage your sales pipeline leads</p></div>;
      case "opportunities":
        return <div className="p-4"><h3 className="text-lg font-semibold">Opportunities</h3><p className="text-[var(--muted)]">Track sales opportunities</p></div>;
      case "people":
        return <div className="p-4"><h3 className="text-lg font-semibold">People</h3><p className="text-[var(--muted)]">Manage your people</p></div>;
      case "companies":
        return <div className="p-4"><h3 className="text-lg font-semibold">Companies</h3><p className="text-[var(--muted)]">Manage your companies</p></div>;
      default:
        return <div className="p-4"><h3 className="text-lg font-semibold">Pipeline</h3><p className="text-[var(--muted)]">Your sales pipeline dashboard</p></div>;
    }
  };

  return (
    <div className="h-full">
      {renderContent()}
    </div>
  );
}

export function PipelineLeftModule() {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Pipeline</h3>
      <div className="space-y-2">
        <div className="p-2 bg-blue-50 rounded">
          <div className="text-sm font-medium">Active Deals</div>
          <div className="text-lg font-bold">47</div>
        </div>
        <div className="p-2 bg-green-50 rounded">
          <div className="text-sm font-medium">Won This Month</div>
          <div className="text-lg font-bold">12</div>
        </div>
        <div className="p-2 bg-orange-50 rounded">
          <div className="text-sm font-medium">Pipeline Value</div>
          <div className="text-lg font-bold">$847K</div>
        </div>
      </div>
    </div>
  );
}

export function PipelineShouldShowLeftPanel() {
  return false;
} 