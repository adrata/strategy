"use client";

import React, { useState } from 'react';
import { 
  ArrowPathIcon, 
  TrashIcon, 
  Cog6ToothIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ConnectionActionsProps {
  connection: {
    id: string;
    provider: string;
    status: string;
    nangoConnectionId: string;
    lastSyncAt?: string;
  };
  onSync: (connectionId: string) => Promise<void>;
  onDisconnect: (connectionId: string) => Promise<void>;
  onConfigure: (connectionId: string) => void;
}

export function ConnectionActions({ 
  connection, 
  onSync, 
  onDisconnect, 
  onConfigure 
}: ConnectionActionsProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync(connection.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect(connection.id);
      setShowDisconnectConfirm(false);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'error': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-3 bg-panel-background rounded-lg">
        <div className="flex items-center gap-3">
          {getStatusIcon(connection.status)}
          <div>
            <div className="text-sm font-medium text-foreground">
              {connection.provider}
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(connection.status)}`}>
              {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
            </div>
          </div>
        </div>
        {connection.lastSyncAt && (
          <div className="text-xs text-muted">
            Last sync: {new Date(connection.lastSyncAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleSync}
          disabled={isSyncing || connection.status !== 'active'}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isSyncing || connection.status !== 'active'
              ? 'bg-hover text-muted cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>

        <button
          onClick={() => onConfigure(connection.id)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-background border border-border text-foreground rounded-lg text-sm font-medium hover:bg-hover transition-colors"
        >
          <Cog6ToothIcon className="w-4 h-4" />
          Configure
        </button>
      </div>

      {/* Disconnect Button */}
      <div className="pt-2 border-t border-border">
        {!showDisconnectConfirm ? (
          <button
            onClick={() => setShowDisconnectConfirm(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            Disconnect
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted text-center">
              Are you sure you want to disconnect this integration?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDisconnecting ? 'Disconnecting...' : 'Yes, Disconnect'}
              </button>
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="flex-1 px-4 py-2 bg-background border border-border text-foreground rounded-lg text-sm font-medium hover:bg-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Connection Info */}
      <div className="p-3 bg-panel-background rounded-lg">
        <div className="text-xs text-muted space-y-1">
          <div className="flex justify-between">
            <span>Connection ID:</span>
            <span className="font-mono text-foreground">
              {connection.nangoConnectionId.substring(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between">
            <span>Provider:</span>
            <span className="font-medium text-foreground">
              {connection.provider}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
