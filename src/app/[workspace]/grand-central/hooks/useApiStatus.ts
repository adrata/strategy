"use client";

import { useState, useEffect } from 'react';
import { ApiStatusService, APIStatus } from '../services/ApiStatusService';

export function useApiStatus() {
  const [statuses, setStatuses] = useState<APIStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiStatusService = ApiStatusService.getInstance();

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        setLoading(true);
        setError(null);
        const statuses = await apiStatusService.checkAllAPIStatus();
        setStatuses(statuses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load API statuses');
      } finally {
        setLoading(false);
      }
    };

    loadStatuses();
  }, []);

  const refreshStatuses = async () => {
    try {
      setLoading(true);
      setError(null);
      apiStatusService.clearAllCache();
      const statuses = await apiStatusService.checkAllAPIStatus();
      setStatuses(statuses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh API statuses');
    } finally {
      setLoading(false);
    }
  };

  const getStatusById = (id: string) => {
    return statuses.find(status => status.id === id);
  };

  const getConfiguredAPIs = () => {
    return statuses.filter(status => status.status === 'configured');
  };

  const getNotConfiguredAPIs = () => {
    return statuses.filter(status => status.status === 'not-configured');
  };

  const getSummary = () => {
    return {
      total: statuses.length,
      configured: statuses.filter(s => s.status === 'configured').length,
      notConfigured: statuses.filter(s => s.status === 'not-configured').length,
      inactive: statuses.filter(s => s.status === 'inactive').length
    };
  };

  return {
    statuses,
    loading,
    error,
    refreshStatuses,
    getStatusById,
    getConfiguredAPIs,
    getNotConfiguredAPIs,
    getSummary
  };
}
