'use client';

import React, { useState, useEffect } from 'react';
import { unifiedApi } from '@/platform/unified-api-service';
import { isDesktop } from '@/platform/platform-detection';
import { 
  WifiSlashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface OfflineBannerProps {
  className?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ className = '' }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  useEffect(() => {
    if (!isDesktop()) {
      return;
    }

    const checkConnection = async () => {
      try {
        const response = await unifiedApi.getSyncStatus();
        const isConnected = response.success && response.data?.isConnected;
        
        if (isConnected && isOffline) {
          // Just came back online
          setIsOffline(false);
          setLastOnline(new Date());
        } else if (!isConnected && !isOffline) {
          // Just went offline
          setIsOffline(true);
        }
      } catch (error) {
        // Network error - likely offline
        if (!isOffline) {
          setIsOffline(true);
        }
      }
    };

    // Check connection immediately
    checkConnection();

    // Check connection every 10 seconds
    const interval = setInterval(checkConnection, 10000);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      setLastOnline(new Date());
      checkConnection();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline]);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await unifiedApi.pullChanges();
      setIsOffline(false);
      setLastOnline(new Date());
    } catch (error) {
      console.error('Reconnection failed:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  if (!isDesktop() || !isOffline) {
    return null;
  }

  return (
    <div className={`bg-yellow-50 border-b border-yellow-200 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <WifiSlashIcon className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              You're currently offline
            </p>
            <p className="text-xs text-yellow-700">
              Changes will be synced when you're back online
              {lastOnline && ` • Last online: ${lastOnline.toLocaleTimeString()}`}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleReconnect}
          disabled={isReconnecting}
          className="flex items-center space-x-2 px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-md hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isReconnecting ? (
            <>
              <ArrowPathIcon className="w-3 h-3 animate-spin" />
              <span>Reconnecting...</span>
            </>
          ) : (
            <>
              <ArrowPathIcon className="w-3 h-3" />
              <span>Reconnect</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default OfflineBanner;
