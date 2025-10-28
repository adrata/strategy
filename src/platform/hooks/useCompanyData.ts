import { useState, useEffect } from 'react';

interface CompanyData {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  revenue?: string;
  employeeCount?: number;
  foundedYear?: number;
  stockSymbol?: string;
  website?: string;
  hqLocation?: string;
  hqCity?: string;
  hqState?: string;
  hqCountry?: string;
  businessChallenges?: string[];
  businessPriorities?: string[];
  competitiveAdvantages?: string[];
  growthOpportunities?: string[];
  techStack?: string[];
  description?: string;
  domain?: string;
  isPublic?: boolean;
  lastFundingAmount?: string;
  lastFundingDate?: string;
  marketCap?: string;
}

interface UseCompanyDataResult {
  companyData: CompanyData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCompanyData(companyName: string, workspaceId: string): UseCompanyDataResult {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanyData = async () => {
    if (!companyName || !workspaceId) {
      setCompanyData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 useCompanyData: Fetching data for ${companyName} in workspace ${workspaceId}`);
      
      // Search for company by name using the companies API
      const response = await fetch(`/api/v1/companies?search=${encodeURIComponent(companyName)}&limit=1`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch company data: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`API returned failure: ${result.error || 'Unknown error'}`);
      }
      
      const companies = result.data || [];
      
      if (companies.length === 0) {
        console.log(`⚠️ useCompanyData: No company found with name "${companyName}"`);
        setCompanyData(null);
        return;
      }
      
      // Find exact match or closest match
      const exactMatch = companies.find((company: any) => 
        company.name?.toLowerCase() === companyName.toLowerCase()
      );
      
      const selectedCompany = exactMatch || companies[0];
      
      console.log(`✅ useCompanyData: Found company:`, {
        name: selectedCompany.name,
        industry: selectedCompany.industry,
        employeeCount: selectedCompany.employeeCount,
        revenue: selectedCompany.revenue
      });
      
      setCompanyData(selectedCompany);
    } catch (err) {
      console.error('❌ useCompanyData: Error fetching company data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch company data');
      setCompanyData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [companyName, workspaceId]);

  return {
    companyData,
    loading,
    error,
    refetch: fetchCompanyData
  };
}
