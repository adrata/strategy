"use client";

import React, { useState } from "react";
import { useConnections } from "../hooks/useConnections";
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  Cog6ToothIcon,
  ClockIcon,
  CloudIcon
} from "@heroicons/react/24/outline";

interface Connection {
  id: string;
  workspaceId: string;
  userId: string;
  provider: string;
  providerConfigKey: string;
  nangoConnectionId: string;
  connectionName?: string;
  metadata: any;
  status: 'active' | 'pending' | 'error' | 'inactive';
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ConnectionDetailProps {
  connection: Connection;
  onClose: () => void;
}

export function ConnectionDetail({ connection, onClose }: ConnectionDetailProps) {
  const { disconnectConnection } = useConnections();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const success = await disconnectConnection(connection.id);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setIsDisconnecting(false);
      setShowDisconnectConfirm(false);
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
      case 'pending': return <ArrowPathIcon className="w-4 h-4 animate-spin" />;
      case 'error': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <CloudIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            connection.status === 'active' ? 'bg-green-500' :
            connection.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
            'bg-red-500'
          }`}></div>
          <div>
            <h2 className="font-semibold text-gray-900">{connection.connectionName || connection.provider}</h2>
            <p className="text-sm text-gray-500">{connection.provider}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Status */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Connection Status</h3>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(connection.status)}`}>
            {getStatusIcon(connection.status)}
            {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
          </div>
        </div>

        {/* Connection Info */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Connection Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Provider:</span>
              <span className="text-gray-900 font-medium">{connection.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Connection ID:</span>
              <span className="text-gray-900 font-mono text-xs">{connection.nangoConnectionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span className="text-gray-900">{formatDate(connection.createdAt)}</span>
            </div>
            {connection.lastSyncAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Last Sync:</span>
                <span className="text-gray-900">{formatDate(connection.lastSyncAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        {connection.metadata && Object.keys(connection.metadata).length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Additional Information</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(connection.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Actions</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Cog6ToothIcon className="w-4 h-4" />
              Configure Sync Settings
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
              <ArrowPathIcon className="w-4 h-4" />
              Test Connection
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <ClockIcon className="w-4 h-4" />
              View Sync History
            </button>
          </div>
        </div>

        {/* Disconnect */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900">Danger Zone</h3>
          {!showDisconnectConfirm ? (
            <button
              onClick={() => setShowDisconnectConfirm(true)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Disconnect Integration
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Are you sure you want to disconnect this integration? This will remove all access to {connection.provider}.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Yes, Disconnect'}
                </button>
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
