"use client";

import React from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { ZohoUpdateNotification } from '@/platform/services/zoho-notification-service';
import { useZohoNotifications } from '@/platform/hooks/useZohoNotifications';

interface ZohoNotificationToastProps {
  notification: ZohoUpdateNotification;
  onDismiss: () => void;
  onMarkAsRead?: (notificationId: string) => void;
}

export function ZohoNotificationToast({ 
  notification, 
  onDismiss, 
  onMarkAsRead 
}: ZohoNotificationToastProps) {
  
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'MEDIUM':
        return <InformationCircleIcon className="w-5 h-5 text-yellow-500" />;
      case 'LOW':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'border-red-200 bg-red-50';
      case 'MEDIUM':
        return 'border-yellow-200 bg-yellow-50';
      case 'LOW':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'leads':
        return '👥';
      case 'contacts':
        return '📞';
      case 'deals':
        return '💼';
      case 'accounts':
        return '🏢';
      case 'notes':
        return '📝';
      case 'tasks':
        return '✅';
      case 'meetings':
        return '📅';
      default:
        return '📋';
    }
  };

  const getOperationText = (operation: string) => {
    switch (operation) {
      case 'create':
        return 'Created';
      case 'update':
        return 'Updated';
      case 'delete':
        return 'Deleted';
      default:
        return operation;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleMarkAsRead = () => {
    if (onMarkAsRead) {
      onMarkAsRead(notification.record.id);
    }
    onDismiss();
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-[var(--background)] rounded-lg shadow-lg border-l-4 ${getPriorityColor(notification.priority)} animate-in slide-in-from-right-full duration-300`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0">
              {getPriorityIcon(notification.priority)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{getModuleIcon(notification.module)}</span>
                <h4 className="text-sm font-medium text-[var(--foreground)] truncate">
                  {notification.note.title}
                </h4>
              </div>
              
              <p className="text-xs text-[var(--muted)] mb-2 line-clamp-2">
                {notification.note.content}
              </p>
              
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span className="capitalize">
                  {getOperationText(notification.operation)} • {notification.module}
                </span>
                <span>{formatTimestamp(notification.timestamp)}</span>
              </div>
              
              {/* Show changes if available */}
              {notification.changes && notification.changes.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--muted)] mb-1">Changes:</p>
                  <div className="space-y-1">
                    {notification.changes.slice(0, 2).map((change, index) => (
                      <div key={index} className="text-xs text-[var(--muted)]">
                        <span className="font-medium">{change.field}:</span>{' '}
                        <span className="text-[var(--muted)] line-through">{change.oldValue}</span>{' '}
                        → <span className="text-green-600">{change.newValue}</span>
                      </div>
                    ))}
                    {notification.changes.length > 2 && (
                      <div className="text-xs text-[var(--muted)]">
                        ... and {notification.changes.length - 2} more changes
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {onMarkAsRead && (
              <button
                onClick={handleMarkAsRead}
                className="p-1 text-[var(--muted)] hover:text-green-600 transition-colors"
                title="Mark as read"
              >
                <CheckCircleIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onDismiss}
              className="p-1 text-[var(--muted)] hover:text-[var(--muted)] transition-colors"
              title="Dismiss"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Container component for managing multiple Zoho notifications
 */
interface ZohoNotificationContainerProps {
  workspaceId: string;
  userId: string;
  maxNotifications?: number;
}

export function ZohoNotificationContainer({ 
  workspaceId, 
  userId, 
  maxNotifications = 3 
}: ZohoNotificationContainerProps) {
  const { activeNotification, dismissNotification, markAsRead } = useZohoNotifications(
    workspaceId,
    userId,
    (notification) => {
      console.log('🔔 [Zoho Container] New notification received:', notification);
    }
  );

  if (!activeNotification) {
    return null;
  }

  return (
    <ZohoNotificationToast
      notification={activeNotification}
      onDismiss={dismissNotification}
      onMarkAsRead={markAsRead}
    />
  );
}
