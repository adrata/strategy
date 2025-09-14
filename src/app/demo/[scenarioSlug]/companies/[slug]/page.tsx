"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PanelLayout } from '@/platform/ui/components/layout/PanelLayout';
import { PipelineLeftPanelStandalone } from '@/products/pipeline/components/PipelineLeftPanelStandalone';
import { AIRightPanel } from '@/platform/ui/components/chat/AIRightPanel';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';
import { PipelineProvider } from '@/products/pipeline/context/PipelineContext';
import { SpeedrunDataProvider } from '@/platform/services/speedrun-data-context';
import { RecordContextProvider } from '@/platform/ui/context/RecordContextProvider';
import { ZoomProvider } from '@/platform/ui/components/ZoomProvider';
import { ProfilePopupProvider } from '@/platform/ui/components/ProfilePopupContext';
import { MiddlePanelSkeleton } from '@/platform/ui/components/skeletons/MiddlePanelSkeleton';

interface CompanyData {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  location?: string;
  website?: string;
  description?: string;
  createdAt: string;
  notes?: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params['slug'] as string;
  const scenarioSlug = params['scenarioSlug'] as string;
  
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract company ID from slug
  const getCompanyIdFromSlug = (slug: string) => {
    if (slug['length'] === 26 && slug.startsWith('01')) {
      return slug;
    } else if (slug.startsWith('zp-') && slug.endsWith('-2025')) {
      return slug;
    } else {
      const parts = slug.split('-');
      if (parts.length >= 2) {
        const potentialId = parts[parts.length - 1];
        if (potentialId['length'] === 26 && potentialId.startsWith('01')) {
          return potentialId;
        } else if (parts.length >= 3 && parts[parts.length - 2] === 'zp' && parts[parts.length - 1] === '2025') {
          return `zp-${parts.slice(0, -2).join('-')}-2025`;
        } else {
          const idMatch = slug.match(/(zp-[a-z-]+-2025|[0-9A-HJKMNP-TV-Z]{26})/);
          if (idMatch) {
            return idMatch[1];
          }
        }
      }
    }
    return null;
  };

  useEffect(() => {
    const loadCompany = async () => {
      try {
        setLoading(true);
        setError(null);

        const companyId = getCompanyIdFromSlug(slug);
        if (!companyId) {
          setError('Invalid company ID format');
          return;
        }

        const response = await fetch(`/api/demo-scenarios/companies/${companyId}`);
        const data = await response.json();

        if (data['success'] && data.data) {
          setCompany(data.data);
        } else {
          setError(data.error || 'Company not found');
        }
      } catch (err) {
        console.error('Error loading company:', err);
        setError('Failed to load company');
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [slug]);

  if (loading) {
    return (
      <ZoomProvider>
        <PipelineProvider>
          <SpeedrunDataProvider>
            <RecordContextProvider>
              <ProfilePopupProvider>
                <PanelLayout
                  leftPanel={<PipelineLeftPanelStandalone />}
                  rightPanel={<AIRightPanel />}
                  isLeftPanelVisible={true}
                  isRightPanelVisible={true}
                >
                  <MiddlePanelSkeleton />
                </PanelLayout>
              </ProfilePopupProvider>
            </RecordContextProvider>
          </SpeedrunDataProvider>
        </PipelineProvider>
      </ZoomProvider>
    );
  }

  if (error || !company) {
    return (
      <ZoomProvider>
        <PipelineProvider>
          <SpeedrunDataProvider>
            <RecordContextProvider>
              <ProfilePopupProvider>
                <PanelLayout
                  leftPanel={<PipelineLeftPanelStandalone />}
                  rightPanel={<AIRightPanel />}
                  isLeftPanelVisible={true}
                  isRightPanelVisible={true}
                >
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-red-500 text-6xl mb-4">⚠️</div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                      <p className="text-gray-600 mb-6">{error}</p>
                    </div>
                  </div>
                </PanelLayout>
              </ProfilePopupProvider>
            </RecordContextProvider>
          </SpeedrunDataProvider>
        </PipelineProvider>
      </ZoomProvider>
    );
  }

  // Custom tabs configuration with buyer group navigation
  const customTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'buyer-groups', label: 'Buyer Group' },
    { id: 'notes', label: 'Notes' },
    { id: 'timeline', label: 'Timeline' }
  ];

  // Handle buyer group navigation
  const handleBuyerGroupNavigation = () => {
    router.push(`/demo/${scenarioSlug}/companies/${slug}/buyer-group`);
  };

  return (
    <ZoomProvider>
      <PipelineProvider>
        <SpeedrunDataProvider>
          <RecordContextProvider>
            <ProfilePopupProvider>
              <PanelLayout
                leftPanel={<PipelineLeftPanelStandalone />}
                rightPanel={<AIRightPanel />}
                isLeftPanelVisible={true}
                isRightPanelVisible={true}
              >
                <div className="flex flex-col h-full">
                  {/* Custom header with buyer group button */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {company.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
                        <p className="text-sm text-gray-600">{company.industry}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleBuyerGroupNavigation}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      View Buyer Group
                    </button>
                  </div>
                  
                  {/* Universal Record Template */}
                  <div className="flex-1 overflow-hidden">
                    <UniversalRecordTemplate
                      record={company}
                      recordType="companies"
                      onBack={() => router.back()}
                      customTabs={customTabs}
                    />
                  </div>
                </div>
              </PanelLayout>
            </ProfilePopupProvider>
          </RecordContextProvider>
        </SpeedrunDataProvider>
      </PipelineProvider>
    </ZoomProvider>
  );
}