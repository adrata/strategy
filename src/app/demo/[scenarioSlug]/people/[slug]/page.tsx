"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PanelLayout } from '@/platform/ui/components/layout/PanelLayout';
import { PipelineLeftPanelStandalone } from '@/products/pipeline/components/PipelineLeftPanelStandalone';
import { AIRightPanel } from '@/platform/ui/components/chat/AIRightPanel';
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';
import { AcquisitionOSProvider } from '@/platform/ui/context/AcquisitionOSProvider';
import { PipelineProvider } from '@/products/pipeline/context/PipelineContext';
import { SpeedrunDataProvider } from '@/platform/services/speedrun-data-context';
import { RecordContextProvider, useRecordContext } from '@/platform/ui/context/RecordContextProvider';
import { ZoomProvider } from '@/platform/ui/components/ZoomProvider';
import { ProfilePopupProvider } from '@/platform/ui/components/ProfilePopupContext';
import { MiddlePanelSkeleton } from '@/platform/ui/components/skeletons/MiddlePanelSkeleton';

interface PersonData {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  jobTitle: string;
  company: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  department?: string;
  createdAt: string;
  notes?: string;
}

// Component to set record context when person data is loaded
function PersonRecordContextSetter({ person }: { person: PersonData }) {
  const { setCurrentRecord } = useRecordContext();
  
  React.useEffect(() => {
    if (person) {
      console.log('🎯 Setting record context for person:', person.fullName);
      setCurrentRecord(person, 'people');
    }
  }, [person, setCurrentRecord]);
  
  return null;
}

export default function PersonDetailPage() {
  const params = useParams();
  const slug = params['slug'] as string;
  const scenarioSlug = params['scenarioSlug'] as string;
  
  const [person, setPerson] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract person ID from slug
  const getPersonIdFromSlug = (slug: string) => {
    if (slug['length'] === 26 && slug.startsWith('01')) {
      return slug;
    } else if (slug.startsWith('p-zp-') && slug.endsWith('-2025-1')) {
      return slug;
    } else {
      const parts = slug.split('-');
      if (parts.length >= 2) {
        const potentialId = parts[parts.length - 1];
        if (potentialId['length'] === 26 && potentialId.startsWith('01')) {
          return potentialId;
        } else if (parts.length >= 5 && parts[parts.length - 4] === 'p' && parts[parts.length - 3] === 'zp' && parts[parts.length - 2] === '2025' && parts[parts.length - 1] === '1') {
          return `p-zp-${parts.slice(0, -4).join('-')}-2025-1`;
        } else {
          const idMatch = slug.match(/(p-zp-[a-z-]+-2025-1|[0-9A-HJKMNP-TV-Z]{26})/);
          if (idMatch) {
            return idMatch[1];
          }
        }
      }
    }
    return null;
  };

  useEffect(() => {
    const loadPerson = async () => {
      try {
        setLoading(true);
        setError(null);

        const personId = getPersonIdFromSlug(slug);
        if (!personId) {
          setError('Invalid person ID format');
          return;
        }

        // Use specific demo person API endpoint
        const response = await fetch(`/api/demo-scenarios/people/${personId}`);
        const data = await response.json();

        if (data['success'] && data.person) {
          setPerson(data.person);
        } else {
          setError(data.error || 'Person not found');
        }
      } catch (err) {
        console.error('Error loading person:', err);
        setError('Failed to load person');
      } finally {
        setLoading(false);
      }
    };

    loadPerson();
  }, [slug, scenarioSlug]);

  if (loading) {
    return (
      <AcquisitionOSProvider>
        <ZoomProvider>
          <PipelineProvider>
            <SpeedrunDataProvider>
              <RecordContextProvider>
                <ProfilePopupProvider>
                  <PanelLayout
                    leftPanel={
                      <PipelineLeftPanelStandalone
                        activeSection="people"
                        onSectionChange={() => {}}
                        isOpportunitiesVisible={false}
                        isProspectsVisible={false}
                        isLeadsVisible={false}
                        isCustomersVisible={false}
                        isPartnersVisible={false}
                      />
                    }
                    middlePanel={<MiddlePanelSkeleton />}
                    rightPanel={<AIRightPanel />}
                    isLeftPanelVisible={true}
                    isRightPanelVisible={true}
                    onToggleLeftPanel={() => {}}
                    onToggleRightPanel={() => {}}
                  />
                </ProfilePopupProvider>
              </RecordContextProvider>
            </SpeedrunDataProvider>
          </PipelineProvider>
        </ZoomProvider>
      </AcquisitionOSProvider>
    );
  }

  if (error || !person) {
    return (
      <AcquisitionOSProvider>
        <ZoomProvider>
          <PipelineProvider>
            <SpeedrunDataProvider>
              <RecordContextProvider>
                <ProfilePopupProvider>
                  <PanelLayout
                    leftPanel={
                      <PipelineLeftPanelStandalone
                        activeSection="people"
                        onSectionChange={() => {}}
                        isOpportunitiesVisible={false}
                        isProspectsVisible={false}
                        isLeadsVisible={false}
                        isCustomersVisible={false}
                        isPartnersVisible={false}
                      />
                    }
                    middlePanel={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-red-500 text-6xl mb-4">⚠️</div>
                          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                          <p className="text-gray-600 mb-6">{error}</p>
                        </div>
                      </div>
                    }
                    rightPanel={<AIRightPanel />}
                    isLeftPanelVisible={true}
                    isRightPanelVisible={true}
                    onToggleLeftPanel={() => {}}
                    onToggleRightPanel={() => {}}
                  />
                </ProfilePopupProvider>
              </RecordContextProvider>
            </SpeedrunDataProvider>
          </PipelineProvider>
        </ZoomProvider>
      </AcquisitionOSProvider>
    );
  }

  return (
    <AcquisitionOSProvider>
      <ZoomProvider>
        <PipelineProvider>
          <SpeedrunDataProvider>
            <RecordContextProvider>
              <PersonRecordContextSetter person={person} />
              <ProfilePopupProvider>
                <PanelLayout
                  leftPanel={
                    <PipelineLeftPanelStandalone
                      activeSection="people"
                      onSectionChange={() => {}}
                    />
                  }
                  middlePanel={
                    <UniversalRecordTemplate
                      record={person}
                      recordType="people"
                      onBack={() => window.history.back()}
                    />
                  }
                  rightPanel={<AIRightPanel />}
                  isLeftPanelVisible={true}
                  isRightPanelVisible={true}
                  onToggleLeftPanel={() => {}}
                  onToggleRightPanel={() => {}}
                />
              </ProfilePopupProvider>
            </RecordContextProvider>
          </SpeedrunDataProvider>
        </PipelineProvider>
      </ZoomProvider>
    </AcquisitionOSProvider>
  );
}