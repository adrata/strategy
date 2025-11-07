"use client";

import React, { useState, useEffect } from 'react';
import { ClockIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { authFetch } from '@/platform/api-fetch';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';

interface Reminder {
  id: string;
  entityType: 'people' | 'companies';
  entityId: string;
  reminderAt: string;
  note?: string;
  isCompleted: boolean;
}

export function ReminderBanner() {
  const { user: authUser } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchReminders = async () => {
      if (!authUser?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const workspaceId = acquisitionData?.workspaceId || authUser?.activeWorkspaceId;
        if (!workspaceId) {
          setIsLoading(false);
          return;
        }

        const result = await authFetch(`/api/v1/reminders?isCompleted=false`);
        if (result.success && result.data) {
          // Filter to show only reminders due in the next 24 hours
          const now = new Date();
          const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          
          const upcomingReminders = result.data.filter((reminder: Reminder) => {
            const reminderDate = new Date(reminder.reminderAt);
            return reminderDate >= now && reminderDate <= tomorrow;
          });

          setReminders(upcomingReminders);
        }
      } catch (error) {
        console.error('Failed to fetch reminders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminders();
    
    // Refresh reminders every minute
    const interval = setInterval(fetchReminders, 60 * 1000);
    return () => clearInterval(interval);
  }, [authUser?.id, acquisitionData?.workspaceId, authUser?.activeWorkspaceId]);

  const handleDismiss = (reminderId: string) => {
    setDismissedReminders(prev => new Set(prev).add(reminderId));
  };

  const handleComplete = async (reminderId: string) => {
    try {
      const result = await authFetch(`/api/v1/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCompleted: true }),
      });

      if (result.success) {
        setReminders(prev => prev.filter(r => r.id !== reminderId));
      }
    } catch (error) {
      console.error('Failed to complete reminder:', error);
    }
  };

  const getEntityName = async (reminder: Reminder): Promise<string> => {
    try {
      if (reminder.entityType === 'people') {
        const result = await authFetch(`/api/v1/people/${reminder.entityId}`);
        if (result.success && result.data) {
          return result.data.fullName || result.data.name || 'Unknown Person';
        }
      } else {
        const result = await authFetch(`/api/v1/companies/${reminder.entityId}`);
        if (result.success && result.data) {
          return result.data.name || 'Unknown Company';
        }
      }
    } catch (error) {
      console.error('Failed to fetch entity name:', error);
    }
    return reminder.entityType === 'people' ? 'Person' : 'Company';
  };

  if (isLoading || reminders.length === 0) {
    return null;
  }

  // Show only the next reminder that hasn't been dismissed
  const activeReminder = reminders.find(r => !dismissedReminders.has(r.id));
  if (!activeReminder) {
    return null;
  }

  const reminderDate = new Date(activeReminder.reminderAt);
  const now = new Date();
  const isOverdue = reminderDate < now;
  const minutesUntil = Math.floor((reminderDate.getTime() - now.getTime()) / (1000 * 60));

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md bg-background border border-border rounded-lg shadow-lg p-4 ${
      isOverdue ? 'border-error' : 'border-primary'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isOverdue ? 'bg-error/10' : 'bg-primary/10'
        }`}>
          <ClockIcon className={`w-5 h-5 ${isOverdue ? 'text-error' : 'text-primary'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">
              {isOverdue ? 'Overdue Reminder' : 'Upcoming Reminder'}
            </h3>
            <button
              onClick={() => handleDismiss(activeReminder.id)}
              className="text-muted hover:text-foreground transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-foreground mb-1">
            {activeReminder.entityType === 'people' ? 'Person' : 'Company'} reminder
          </p>
          {activeReminder.note && (
            <p className="text-xs text-muted mb-2">{activeReminder.note}</p>
          )}
          <p className="text-xs text-muted">
            {isOverdue 
              ? `${Math.abs(minutesUntil)} minutes ago`
              : minutesUntil < 60
                ? `In ${minutesUntil} minutes`
                : `In ${Math.floor(minutesUntil / 60)} hours`
            }
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => handleComplete(activeReminder.id)}
              className="px-3 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <CheckIcon className="w-3 h-3" />
              Mark Complete
            </button>
            <button
              onClick={() => handleDismiss(activeReminder.id)}
              className="px-3 py-1.5 text-xs bg-hover text-foreground rounded-md hover:bg-panel-background transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

