'use client';

import React, { useState, useEffect } from 'react';
import { unifiedApi } from '@/platform/unified-api-service';
import { isDesktop } from '@/platform/platform-detection';
import { 
  XMarkIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SyncStatus {
  status: 'idle' | 'syncing' | 'completed' | 'error';
  lastSync: string | null;
  conflicts: Array<{
    id: string;
    table: string;
    localValue: any;
    remoteValue: any;
    conflictType: string;
  }>;
  pendingChanges: number;
  syncStats: {
    people: number;
    companies: number;
    actions: number;
    total: number;
  };
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSync: null,
    conflicts: [],
    pendingChanges: 0,
    syncStats: { people: 0, companies: 0, actions: 0, total: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    if (isOpen && isDesktop()) {
      fetchSyncStatus();
    }
  }, [isOpen]);

  const fetchSyncStatus = async () => {
    try {
      const response = await unifiedApi.getSyncStatus();
      if (response.success && response.data) {
        setSyncStatus({
          status: response.data.status || 'idle',
          lastSync: response.data.lastSync,
          conflicts: response.data.conflicts || [],
          pendingChanges: response.data.pendingChanges || 0,
          syncStats: response.data.syncStats || { people: 0, companies: 0, actions: 0, total: 0 },
        });
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  const handleSync = async () => {
    if (!isDesktop()) return;

    setIsLoading(true);
    setSyncProgress(0);
    setSyncStatus(prev => ({ ...prev, status: 'syncing' }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Pull changes first
      await unifiedApi.pullChanges();
      setSyncProgress(50);

      // Push local changes
      await unifiedApi.pushChanges();
      setSyncProgress(90);

      clearInterval(progressInterval);
      setSyncProgress(100);

      // Update status
      setSyncStatus(prev => ({ 
        ...prev, 
        status: 'completed',
        lastSync: new Date().toISOString(),
        pendingChanges: 0,
        conflicts: []
      }));

      // Refresh sync status
      setTimeout(fetchSyncStatus, 1000);

    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsLoading(false);
      setSyncProgress(0);
    }
  };

  const handleResolveConflict = async (conflictId: string, resolution: 'local' | 'remote') => {
    try {
      await unifiedApi.resolveConflict(conflictId, resolution);
      await fetchSyncStatus();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    
    const date = new Date(lastSync);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Sync Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Sync Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {syncStatus.status === 'syncing' && (
                <ArrowPathIcon className="w-6 h-6 text-blue-500 animate-spin" />
              )}
              {syncStatus.status === 'completed' && (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              )}
              {syncStatus.status === 'error' && (
                <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
              )}
              {syncStatus.status === 'idle' && (
                <ClockIcon className="w-6 h-6 text-gray-500" />
              )}
              
              <div>
                <p className="font-medium text-gray-900">
                  {syncStatus.status === 'syncing' && 'Syncing...'}
                  {syncStatus.status === 'completed' && 'Sync Complete'}
                  {syncStatus.status === 'error' && 'Sync Error'}
                  {syncStatus.status === 'idle' && 'Ready to Sync'}
                </p>
                <p className="text-sm text-gray-500">
                  Last sync: {formatLastSync(syncStatus.lastSync)}
                </p>
              </div>
            </div>

            <button
              onClick={handleSync}
              disabled={isLoading || syncStatus.status === 'syncing'}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CloudArrowUpIcon className="w-4 h-4" />
              <span>Sync Now</span>
            </button>
          </div>

          {/* Progress Bar */}
          {isLoading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          )}

          {/* Sync Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">People</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {syncStatus.syncStats.people}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <BuildingOfficeIcon className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Companies</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {syncStatus.syncStats.companies}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <BoltIcon className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Actions</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {syncStatus.syncStats.actions}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Pending</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {syncStatus.pendingChanges}
              </p>
            </div>
          </div>

          {/* Conflicts */}
          {syncStatus.conflicts.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Conflicts ({syncStatus.conflicts.length})
              </h3>
              <div className="space-y-3">
                {syncStatus.conflicts.map((conflict) => (
                  <div key={conflict.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-yellow-800">
                        {conflict.table} - {conflict.conflictType}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Local</p>
                        <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                          {JSON.stringify(conflict.localValue, null, 2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Remote</p>
                        <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                          {JSON.stringify(conflict.remoteValue, null, 2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResolveConflict(conflict.id, 'local')}
                        className="px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded hover:bg-blue-200"
                      >
                        Keep Local
                      </button>
                      <button
                        onClick={() => handleResolveConflict(conflict.id, 'remote')}
                        className="px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded hover:bg-green-200"
                      >
                        Use Remote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No conflicts message */}
          {syncStatus.conflicts.length === 0 && syncStatus.pendingChanges === 0 && (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">Everything is up to date!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500">
            {isDesktop() ? 'Desktop sync with offline support' : 'Web version - always online'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
