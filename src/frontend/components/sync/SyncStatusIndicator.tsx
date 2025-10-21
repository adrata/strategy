'use client';

import React, { useState, useEffect } from 'react';
import { unifiedApi } from '@/platform/unified-api-service';
import { isDesktop } from '@/platform/platform-detection';
import { 
  CloudIcon, 
  CloudArrowUpIcon, 
  CloudArrowDownIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  WifiIcon,
  WifiSlashIcon
} from '@heroicons/react/24/outline';

interface SyncStatus {
  status: 'online' | 'offline' | 'syncing' | 'error' | 'conflict';
  lastSync: string | null;
  conflicts: number;
  pendingChanges: number;
  isConnected: boolean;
}

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'offline',
    lastSync: null,
    conflicts: 0,
    pendingChanges: 0,
    isConnected: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isDesktop()) {
      setIsLoading(false);
      return;
    }

    const fetchSyncStatus = async () => {
      try {
        const response = await unifiedApi.getSyncStatus();
        if (response.success && response.data) {
          setSyncStatus({
            status: response.data.status || 'offline',
            lastSync: response.data.lastSync,
            conflicts: response.data.conflicts || 0,
            pendingChanges: response.data.pendingChanges || 0,
            isConnected: response.data.isConnected || false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch sync status:', error);
        setSyncStatus(prev => ({ ...prev, status: 'error' }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSyncStatus();

    // Poll for sync status updates every 30 seconds
    const interval = setInterval(fetchSyncStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isDesktop() || isLoading) {
    return null;
  }

  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'online':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <CloudArrowUpIcon className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'offline':
        return <WifiSlashIcon className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'conflict':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus.status) {
      case 'online':
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'offline':
        return 'Offline';
      case 'error':
        return 'Sync Error';
      case 'conflict':
        return 'Conflicts';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus.status) {
      case 'online':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'syncing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'offline':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'conflict':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>

      {showDetails && (
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          {syncStatus.isConnected ? (
            <div className="flex items-center space-x-1">
              <WifiIcon className="w-3 h-3" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <WifiSlashIcon className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}
          
          <span>Last sync: {formatLastSync(syncStatus.lastSync)}</span>
          
          {syncStatus.pendingChanges > 0 && (
            <span className="text-blue-600">
              {syncStatus.pendingChanges} pending
            </span>
          )}
          
          {syncStatus.conflicts > 0 && (
            <span className="text-yellow-600">
              {syncStatus.conflicts} conflicts
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
