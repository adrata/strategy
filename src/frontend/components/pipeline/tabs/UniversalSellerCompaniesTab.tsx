import React, { useState, useEffect } from 'react';
import { authFetch } from '@/platform/auth-fetch';
import { useWorkspaceNavigation } from '@/platform/hooks/useWorkspaceNavigation';

interface UniversalSellerCompaniesTabProps {
  record: any;
  recordType: string;
  onSave?: (field: string, value: string) => Promise<void>;
}

export function UniversalSellerCompaniesTab({ record, recordType }: UniversalSellerCompaniesTabProps) {
  const { navigateToPipelineItem } = useWorkspaceNavigation();
  const [associatedCompanies, setAssociatedCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssociatedCompanies = async () => {
      try {
        setLoading(true);
        
        // Use the record's workspace and user ID
        const workspaceId = record?.workspaceId;
        const userId = record?.userId || record?.id;
        const assignedUserId = record?.assignedUserId;
        
        console.log('Loading companies for seller:', { record, workspaceId, userId, assignedUserId });
        
        // Fetch companies directly from the unified API with sellerId parameter
        const sellerId = record?.id || record?.userId;
        const response = await authFetch(`/api/data/unified?type=companies&action=get&sellerId=${sellerId}`);
        const result = await response.json();
        
        if (result['success'] && result.data) {
          const companies = result.data;
          
          // Ensure companies is an array - API already filters by sellerId
          if (Array.isArray(companies)) {
            setAssociatedCompanies(companies);
            console.log('Associated companies for seller:', companies);
          } else {
            console.error('Companies data is not an array:', companies);
            setAssociatedCompanies([]);
          }
        } else {
          console.error('Failed to load companies:', result.error);
          setAssociatedCompanies([]);
        }
      } catch (error) {
        console.error('Error loading associated companies:', error);
        setAssociatedCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    if (record) {
      loadAssociatedCompanies();
    }
  }, [record]);

  const handleCompanyClick = (company: any) => {
    console.log('Navigating to company:', company);
    navigateToPipelineItem('companies', company.id, company.name);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-600">Loading companies...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {associatedCompanies['length'] === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No companies assigned</p>
            <p className="text-sm text-gray-500 mt-1">This seller doesn't have any companies assigned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {associatedCompanies.map((company) => (
              <div
                key={company.id}
                onClick={() => handleCompanyClick(company)}
                className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-blue-700 transition-colors">
                      {company.name}
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {company['industry'] && (
                        <div className="flex items-center">
                          <span className="font-medium text-gray-500">Industry:</span>
                          <span className="ml-2 text-gray-900">{company.industry}</span>
                        </div>
                      )}
                      {company['website'] && (
                        <div className="flex items-center">
                          <span className="font-medium text-gray-500">Website:</span>
                          <a 
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:text-blue-700 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {company.website}
                          </a>
                        </div>
                      )}
                      {company['size'] && (
                        <div className="flex items-center">
                          <span className="font-medium text-gray-500">Size:</span>
                          <span className="ml-2 text-gray-900">{company.size}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-semibold">
                        {company.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">View company details</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
