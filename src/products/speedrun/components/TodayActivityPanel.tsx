/**
 * 📊 TODAY ACTIVITY PANEL
 * 
 * Shows today's outreach activities and allows manual marking
 * of contacts/companies as reached out to prevent duplicate ranking.
 */

import React, { useState, useEffect } from "react";
import { TodayActivityTracker, type TodayActivity } from "../TodayActivityTracker";

interface TodayActivityPanelProps {
  onActivityRecorded?: () => void;
}

export function TodayActivityPanel({ onActivityRecorded }: TodayActivityPanelProps) {
  const [activities, setActivities] = useState<TodayActivity[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [companiesContacted, setCompaniesContacted] = useState<Set<string>>(new Set());
  const [showMarkForm, setShowMarkForm] = useState(false);
  const [markFormData, setMarkFormData] = useState({
    prospectName: "",
    company: "",
    activityType: "email" as "email" | "call" | "message" | "meeting"
  });

  const refreshData = () => {
    const todayActivities = TodayActivityTracker.getTodayActivities();
    const todayCounts = TodayActivityTracker.getTodayActivityCounts();
    const todayCompanies = TodayActivityTracker.getCompaniesContactedToday();
    
    setActivities(todayActivities);
    setCounts(todayCounts);
    setCompaniesContacted(todayCompanies);
  };

  useEffect(() => {
    refreshData();
    
    // Refresh every 30 seconds in case activities are recorded elsewhere
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkActivity = () => {
    if (!markFormData.prospectName.trim() || !markFormData.company.trim()) {
      alert("Please fill in both prospect name and company");
      return;
    }

    // Generate a temporary lead ID based on name and company
    const tempLeadId = `manual-${Date.now()}-${markFormData.prospectName.replace(/\s+/g, '-').toLowerCase()}`;

    TodayActivityTracker.recordActivity({
      leadId: tempLeadId,
      prospectName: markFormData.prospectName.trim(),
      company: markFormData.company.trim(),
      activityType: markFormData.activityType,
      timestamp: new Date(),
      outcome: "manual-entry"
    });

    // Reset form
    setMarkFormData({
      prospectName: "",
      company: "",
      activityType: "email"
    });
    setShowMarkForm(false);

    // Refresh data
    refreshData();

    // Notify parent
    if (onActivityRecorded) {
      onActivityRecorded();
    }

    console.log(`✅ Manually recorded ${markFormData.activityType} to ${markFormData.prospectName} at ${markFormData.company}`);
  };

  const handleClearToday = () => {
    if (confirm("Clear all today's activity data? This will reset the smart ranking filters.")) {
      TodayActivityTracker.clearTodayData();
      refreshData();
      if (onActivityRecorded) {
        onActivityRecorded();
      }
    }
  };

  return (
    <div className="bg-background border border-border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-foreground">Today's Outreach</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMarkForm(!showMarkForm)}
            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20"
          >
            {showMarkForm ? "Cancel" : "Mark Activity"}
          </button>
          {activities.length > 0 && (
            <button
              onClick={handleClearToday}
              className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
            >
              Clear Today
            </button>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{counts.email || 0}</div>
          <div className="text-xs text-muted">Emails</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{counts.call || 0}</div>
          <div className="text-xs text-muted">Calls</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">{counts.message || 0}</div>
          <div className="text-xs text-muted">Messages</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">{companiesContacted.size}</div>
          <div className="text-xs text-muted">Companies</div>
        </div>
      </div>

      {/* Manual Mark Form */}
      {showMarkForm && (
        <div className="bg-panel-background p-3 rounded border mb-3">
          <div className="text-xs font-medium text-foreground mb-2">
            Mark External Outreach (Email sent outside Speedrun, calls, etc.)
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="Prospect Name"
              value={markFormData.prospectName}
              onChange={(e) => setMarkFormData({...markFormData, prospectName: e.target.value})}
              className="text-xs border border-border rounded px-2 py-1"
            />
            <input
              type="text"
              placeholder="Company Name"
              value={markFormData.company}
              onChange={(e) => setMarkFormData({...markFormData, company: e.target.value})}
              className="text-xs border border-border rounded px-2 py-1"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={markFormData.activityType}
              onChange={(e) => setMarkFormData({...markFormData, activityType: e.target.value as any})}
              className="text-xs border border-border rounded px-2 py-1 flex-1"
            >
              <option value="email">Email</option>
              <option value="call">Call</option>
              <option value="message">Message</option>
              <option value="meeting">Meeting</option>
            </select>
            <button
              onClick={handleMarkActivity}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Record
            </button>
          </div>
        </div>
      )}

      {/* Companies Contacted Today */}
      {companiesContacted.size > 0 && (
        <div>
          <div className="text-xs font-medium text-foreground mb-1">
            Companies Contacted Today (Filtered from Speedrun):
          </div>
          <div className="flex flex-wrap gap-1">
            {Array.from(companiesContacted).map(company => (
              <span 
                key={company}
                className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded border"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      )}

      {activities['length'] === 0 && !showMarkForm && (
        <div className="text-xs text-muted text-center py-2">
          No outreach activities recorded today
        </div>
      )}
    </div>
  );
}
