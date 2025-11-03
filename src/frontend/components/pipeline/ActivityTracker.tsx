"use client";

/**
 * Activity Tracker Component
 * Allows users to track daily activities and see their progress
 */

import React, { useState, useEffect } from 'react';
import { updateTodayActivity, getTodayActivityCount, getTimeTrackingData, formatHours } from '@/platform/utils/time-tracking';
import { useUnifiedAuth } from '@/platform/auth';

interface ActivityTrackerProps {
  onActivityUpdate?: () => void;
}

export function ActivityTracker({ onActivityUpdate }: ActivityTrackerProps) {
  const { user } = useUnifiedAuth();
  const [activityCount, setActivityCount] = useState(() => getTodayActivityCount());
  const [timeData, setTimeData] = useState(() => getTimeTrackingData('America/New_York', user?.id));
  const [isExpanded, setIsExpanded] = useState(false);

  // Update data when activity changes
  const handleActivityUpdate = (type: 'emails' | 'calls' | 'meetings' | 'tasks', increment: number = 1) => {
    const updated = updateTodayActivity(type, increment);
    setActivityCount(updated);
    setTimeData(getTimeTrackingData('America/New_York', user?.id));
    onActivityUpdate?.();
  };

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeData(getTimeTrackingData('America/New_York', user?.id));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    { type: 'emails' as const, label: 'Email Sent', icon: '✉️', color: 'bg-primary hover:bg-primary/90' },
    { type: 'calls' as const, label: 'Call Made', icon: '📞', color: 'bg-success hover:bg-success/90' },
    { type: 'meetings' as const, label: 'Meeting', icon: '🤝', color: 'bg-info hover:bg-info/90' },
    { type: 'tasks' as const, label: 'Task Done', icon: '✅', color: 'bg-warning hover:bg-warning/90' }
  ];

  return (
    <div className="bg-background border border-border rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">Activity Tracker</h3>
          <div className="text-xs text-muted">
            {timeData.isBeforeWorkingHours ? (
              <>
                Start time: {Math.round(timeData.hoursTillStart)}h
              </>
            ) : (
              <>
                {formatHours(timeData.hoursLeft)} hours left today
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs bg-hover text-muted px-2 py-1 rounded hover:bg-loading-bg"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            {activityCount.total}/{timeData.todayTarget}
          </div>
          <div className="text-xs text-muted">Today's Progress</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            {Math.round((activityCount.total / timeData.todayTarget) * 100)}%
          </div>
          <div className="text-xs text-muted">Daily Goal</div>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <>
          {/* Activity Breakdown */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{activityCount.emails}</div>
              <div className="text-xs text-muted">Emails</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{activityCount.calls}</div>
              <div className="text-xs text-muted">Calls</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{activityCount.meetings}</div>
              <div className="text-xs text-muted">Meetings</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{activityCount.tasks}</div>
              <div className="text-xs text-muted">Tasks</div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-2">
            <div className="text-xs text-muted font-medium">Quick Add:</div>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.type}
                  onClick={() => handleActivityUpdate(action.type)}
                  className={`${action.color} text-white px-3 py-2 rounded text-xs font-medium transition-colors flex items-center justify-center gap-2`}
                >
                  <span className="text-sm">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs text-muted font-medium mb-2">Bulk Add:</div>
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map((action) => (
                <div key={`bulk-${action.type}`} className="flex items-center gap-1">
                  <button
                    onClick={() => handleActivityUpdate(action.type, 5)}
                    className="text-xs bg-hover hover:bg-loading-bg px-2 py-1 rounded"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleActivityUpdate(action.type, 10)}
                    className="text-xs bg-hover hover:bg-loading-bg px-2 py-1 rounded"
                  >
                    +10
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-3 pt-3 border-t border-border">
            <button
              onClick={() => {
                localStorage.removeItem('todayActivity');
                setActivityCount({ emails: 0, calls: 0, meetings: 0, tasks: 0, total: 0 });
                setTimeData(getTimeTrackingData());
                onActivityUpdate?.();
              }}
              className="w-full text-xs bg-error/10 text-error px-2 py-1 rounded hover:bg-error/20"
            >
              Reset Today's Count
            </button>
          </div>
        </>
      )}
    </div>
  );
}
