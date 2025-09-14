import React from 'react';
import { CompanyIntelligence } from '../services/company-intelligence-service';

export function useCompanyIntelligence(companyName: string, workspaceId: string) {
  const [intelligence, setIntelligence] = React.useState<CompanyIntelligence>({
    executives: [],
    stakeholders: [],
    companyNews: []
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!companyName || !workspaceId) {
      setLoading(false);
      return;
    }

    const fetchIntelligence = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔍 useCompanyIntelligence: Fetching data for ${companyName} in workspace ${workspaceId}`);
        
        const response = await fetch(`/api/company-intelligence?companyName=${encodeURIComponent(companyName)}&workspaceId=${encodeURIComponent(workspaceId)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch company intelligence: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`API returned failure: ${result.error || 'Unknown error'}`);
        }
        
        const data = result.data;
        
        if (!data) {
          throw new Error('No data returned from API');
        }
        
        console.log(`✅ useCompanyIntelligence: Received data:`, {
          executives: data.executives?.length || 0,
          stakeholders: data.stakeholders?.length || 0,
          news: data.companyNews?.length || 0,
          fullData: data
        });
        
        setIntelligence({
          executives: data.executives || [],
          stakeholders: data.stakeholders || [],
          companyNews: data.companyNews || []
        });
      } catch (err) {
        console.error('❌ useCompanyIntelligence: Error fetching company intelligence:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch company intelligence');
      } finally {
        setLoading(false);
      }
    };

    fetchIntelligence();
  }, [companyName, workspaceId]);

  return {
    intelligence,
    loading,
    error,
    refetch: () => {
      if (companyName && workspaceId) {
        setLoading(true);
        fetch(`/api/company-intelligence?companyName=${encodeURIComponent(companyName)}&workspaceId=${encodeURIComponent(workspaceId)}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch company intelligence: ${response.status}`);
            }
            return response.json();
          })
          .then(result => setIntelligence(result.data))
          .catch(err => setError(err instanceof Error ? err.message : 'Failed to fetch company intelligence'))
          .finally(() => setLoading(false));
      }
    }
  };
} 