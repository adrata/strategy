"use client";

import * as React from "react";
import { useRevenueOS } from "@/platform/ui/context/RevenueOSProvider";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
import { useWorkspacePipelineStages, DatabaseOnlyDataLayer } from "@/platform/services/database-only-data-layer";
import { OpportunityDetails } from "@/products/pipeline/OpportunityDetails";
import { PersonDetails } from "@/products/pipeline/PersonDetails";
import { CompanyDetails } from "@/products/pipeline/CompanyDetails";
import { PartnerDetails } from "@/products/pipeline/PartnerDetails";
import { PipelineKanbanView } from "./components/PipelineKanbanView";
import { PipelineTableView } from "./components/PipelineTableView";
import { PipelineFilters } from "./components/PipelineFilters";
// Removed deleted PipelineDataStore - using unified data system
import { useUnifiedAuth } from "@/platform/auth";
import { UniversalRecordTemplate } from '@/frontend/components/pipeline/UniversalRecordTemplate';
import { useLeadsData } from '@/platform/hooks/useLeadsData';
import { useProspectsData } from '@/platform/hooks/useProspectsData';
import { useOpportunitiesData } from '@/platform/hooks/useOpportunitiesData';
import { usePeopleData } from '@/platform/hooks/usePeopleData';
import { useCompaniesData } from '@/platform/hooks/useCompaniesData';

export function PipelineMiddlePanel() {
  const { ui, data } = useRevenueOS();
  const { navigateToPipeline, navigateToPipelineItem } = useWorkspaceNavigation();
  const { activeSection, selectedRecord } = ui;
  
  // Get workspace and user IDs from unified auth
  const { user: authUser } = useUnifiedAuth();
  const workspaceId = authUser?.workspaces?.[0]?.id || ui.activeWorkspace?.id;
  const userId = authUser?.id;
  
  // 🎯 FIXED: Use data from RevenueOSProvider context instead of duplicate API calls
  // const leadsData = useLeadsData(); // REMOVED: This was causing duplicate API calls
  
  // CRITICAL FIX: Disable PipelineDataStore to eliminate duplicate data loading
  // const pipelineData = usePipelineData(activeSection as any, workspaceId, userId);
  
  // Use single data source from useRevenueOS instead
  const { data: acquisitionData } = useRevenueOS();
  
  // CRITICAL FIX: Map acquisition data to pipeline format for compatibility
  const getSectionData = (section: string) => {
    // 🎯 FIXED: Use data from RevenueOSProvider context for all sections
    if (section === 'leads') {
      // Get leads data from the context (people with LEAD status)
      const peopleData = acquisitionData?.acquireData?.people || [];
      return peopleData.filter((person: any) => person.status === 'LEAD');
    }
    
    // The useData hook returns acquireData, not data
    const acquireData = acquisitionData?.acquireData || {};
    
    switch (section) {
      case 'prospects': return acquireData.prospects || [];
      case 'opportunities': return acquireData.opportunities || [];
      case 'companies': return acquireData.companies || []; // Companies data
      case 'people': return acquireData.people || []; // People data
      case 'clients': return acquireData.clients || [];
      case 'partners': return acquireData.partnerships || [];
      case 'speedrun': return acquireData.speedrunItems || [];
      default: return [];
    }
  };
  
  // CRITICAL FIX: Ensure navigation data is always available for record views
  const getNavigationData = (section: string) => {
    const sectionData = getSectionData(section);
    
    // If we have a selected record but no section data, try to load it
    if (selectedRecord && sectionData['length'] === 0) {
      console.log(`🔍 [NAVIGATION] No data for ${section}, attempting to load...`);
      
      // For prospects, ensure we have data for navigation (leads uses v1 API)
      if (section === 'prospects') {
        // Try to get data from the acquisition context
        const fallbackData = acquisitionData?.acquireData?.prospects || [];
        
        if (fallbackData && fallbackData.length > 0) {
          console.log(`✅ [NAVIGATION] Using fallback data: ${fallbackData.length} records`);
          return fallbackData;
        }
      }
    }
    
    return sectionData;
  };
  
  // CRITICAL FIX: Load navigation data directly when needed
  const [navigationData, setNavigationData] = React.useState<any[]>([]);
  const [isLoadingNavigation, setIsLoadingNavigation] = React.useState(false);
  
  // Load navigation data when we have a selected record but no data
  React.useEffect(() => {
    const loadNavigationData = async () => {
      if (!selectedRecord || !workspaceId || !authUser?.id) return;
      
      // Only load if we don't have data for the current section
      const currentData = getSectionData(activeSection);
      if (currentData.length > 0) {
        setNavigationData(currentData);
        return;
      }
      
      setIsLoadingNavigation(true);
      
      try {
        let sectionData: any[] = [];
        
        // 🎯 NEW: Use v1 APIs for all sections
        switch (activeSection) {
          case 'leads':
            const leadsResponse = await fetch('/api/v1/people?status=LEAD');
            const leadsData = await leadsResponse.json();
            if (leadsData.success) {
              sectionData = leadsData.data || [];
            }
            break;
          case 'prospects':
            const prospectsResponse = await fetch('/api/v1/people?status=PROSPECT');
            const prospectsData = await prospectsResponse.json();
            if (prospectsData.success) {
              sectionData = prospectsData.data || [];
            }
            break;
          case 'opportunities':
            const opportunitiesResponse = await fetch('/api/v1/companies?status=OPPORTUNITY');
            const opportunitiesData = await opportunitiesResponse.json();
            if (opportunitiesData.success) {
              sectionData = opportunitiesData.data || [];
            }
            break;
          case 'companies':
            const companiesResponse = await fetch('/api/v1/companies');
            const companiesData = await companiesResponse.json();
            if (companiesData.success) {
              sectionData = companiesData.data || [];
            }
            break;
          case 'people':
            const peopleResponse = await fetch('/api/v1/people');
            const peopleData = await peopleResponse.json();
            if (peopleData.success) {
              sectionData = peopleData.data || [];
            }
            break;
          default:
            sectionData = [];
        }
          
          console.log(`✅ [NAVIGATION] Loaded ${sectionData.length} records for ${activeSection}:`, {
            section: activeSection,
            dataLength: sectionData.length,
            firstRecord: sectionData[0]?.id,
            lastRecord: sectionData[sectionData.length - 1]?.id,
            selectedRecordId: selectedRecord.id,
            hasSelectedRecord: sectionData.some((r: any) => r['id'] === selectedRecord.id)
          });
          
          setNavigationData(sectionData);
      } catch (error) {
        console.error(`❌ [NAVIGATION] Failed to load data:`, error);
      } finally {
        setIsLoadingNavigation(false);
      }
    };
    
    loadNavigationData();
  }, [selectedRecord, activeSection, workspaceId, authUser?.id]);
  
  // CRITICAL FIX: Ensure we always have navigation data for the selected record
  const finalNavigationData = React.useMemo(() => {
    // If we have navigation data, use it
    if (navigationData.length > 0) {
      return navigationData;
    }
    
    // If we have acquisition data, use it
    const acquisitionSectionData = getSectionData(activeSection);
    if (acquisitionSectionData.length > 0) {
      return acquisitionSectionData;
    }
    
    // If we have a selected record but no data, return empty array
    // This will trigger the data loading effect
    if (selectedRecord) {
      console.log(`⚠️ [NAVIGATION] No data available for ${activeSection}, will trigger load`);
      return [];
    }
    
    return [];
  }, [navigationData, activeSection, selectedRecord]);
  
  const pipelineData = {
    data: finalNavigationData,
    loading: activeSection === 'leads' ? leadsData.loading : (acquisitionData.isLoading || isLoadingNavigation),
    error: activeSection === 'leads' ? leadsData.error : acquisitionData.error,
    isEmpty: finalNavigationData['length'] === 0
  };
  
  console.log(`🔍 [PIPELINE MIDDLE PANEL] Section: ${activeSection}, Data: ${pipelineData.data.length} records, Selected: ${selectedRecord?.id || 'none'}`);
  
  // CRITICAL DEBUG: Log the actual data being used for navigation
  if (selectedRecord && pipelineData.data.length > 0) {
    console.log(`🔍 [NAVIGATION DEBUG] Data mismatch check:`, {
      selectedRecordId: selectedRecord.id,
      selectedRecordName: selectedRecord.fullName || selectedRecord.name || selectedRecord.firstName,
      pipelineDataIds: pipelineData.data.map((r: any) => r.id).slice(0, 5),
      pipelineDataNames: pipelineData.data.map((r: any) => r.fullName || r.name || r.firstName).slice(0, 5),
      hasMatchingRecord: pipelineData.data.some((r: any) => r['id'] === selectedRecord.id)
    });
  }
  
  // PREVENT DEFAULT WORKSPACE POLLUTION: Don't render if no valid workspace
  if (!workspaceId) {
    return null;
  }
  
  // Skip pipeline stages for now - use default stages to prevent loading issues
  const stagesLoading = false;

  // Calculate section-specific metrics using pipeline data
  const getSectionMetrics = () => {
    const sectionData = pipelineData.data || [];
    
    switch (activeSection) {
      case 'leads':
        const leadsValue = sectionData.reduce((sum: number, lead: any) => sum + (parseFloat(lead.estimatedValue || lead.value || '0') || 0), 0);
        return {
          title: 'Leads',
          subtitle: 'Convert to prospects',
          metrics: [
            { label: 'Total Pipeline', value: leadsValue > 0 ? `$${(leadsValue / 1000000).toFixed(1)}M` : '$0.0M', color: 'text-[var(--foreground)]' },
            { label: 'Open Opportunities', value: sectionData.length.toString(), color: 'text-blue-600' },
            { label: 'Win Rate', value: 'Calculating...', color: 'text-green-600' }
          ],
          actionButton: '+ Add Lead'
        };
      case 'prospects':
        const prospectsValue = sectionData.reduce((sum: number, prospect: any) => sum + (parseFloat(prospect.estimatedValue || prospect.value || '0') || 0), 0);
        return {
          title: 'Prospects',
          subtitle: 'Create opportunity',
          metrics: [
            { label: 'Total Value', value: prospectsValue > 0 ? `$${(prospectsValue / 1000000).toFixed(1)}M` : '$0.0M', color: 'text-[var(--foreground)]' },
            { label: 'Active', value: sectionData.length.toString(), color: 'text-blue-600' },
            { label: 'Conversion', value: 'Calculating...', color: 'text-green-600' }
          ],
          actionButton: '+ Add Prospect'
        };
      case 'opportunities':
        const totalValue = sectionData.reduce((sum: number, opp: any) => sum + (parseFloat(opp.amount) || 0), 0);
        return {
          title: 'Opportunities',
          subtitle: 'Active opportunities',
          metrics: [
            { label: 'Pipeline Value', value: `$${(totalValue / 1000000).toFixed(1)}M`, color: 'text-[var(--foreground)]' },
            { label: 'Open Opportunities', value: sectionData.length.toString(), color: 'text-blue-600' },
            { label: 'Win Rate', value: '63%', color: 'text-green-600' }
          ],
          actionButton: '+ Add Opportunity'
        };
      case 'people':
        const activePeople = sectionData.filter((c: any) => c.status !== 'inactive').length;
        return {
          title: 'People',
          subtitle: 'People',
          metrics: [
            { label: 'Total People', value: sectionData.length.toString(), color: 'text-[var(--foreground)]' },
            { label: 'Active', value: activePeople.toString(), color: 'text-blue-600' },
            { label: 'Response Rate', value: 'Calculating...', color: 'text-green-600' }
          ],
          actionButton: '+ Add Person'
        };
      case 'companies':
        const activeCompanies = sectionData.filter((a: any) => a.status !== 'inactive').length;
        return {
          title: 'Companies',
          subtitle: 'Companies',
          metrics: [
            { label: 'Total Companies', value: sectionData.length.toString(), color: 'text-[var(--foreground)]' },
            { label: 'Active', value: activeCompanies.toString(), color: 'text-blue-600' },
            { label: 'Growth', value: 'Calculating...', color: 'text-green-600' }
          ],
          actionButton: '+ Add Company'
        };
      case 'partners':
        const activePartners = sectionData.filter((p: any) => p['relationshipStatus'] === 'Active').length;
        return {
          title: 'Partners',
          subtitle: 'Strategic alliances',
          metrics: [
            { label: 'Total Partners', value: sectionData.length.toString(), color: 'text-[var(--foreground)]' },
            { label: 'Active', value: activePartners.toString(), color: 'text-blue-600' },
            { label: 'Revenue Impact', value: 'Calculating...', color: 'text-green-600' }
          ],
          actionButton: '+ Add Partner'
        };
      case 'clients':
      case 'clients':
        const activeCustomers = sectionData.filter((c: any) => c['customerStatus'] === 'active' || c['status'] === 'active').length;
        return {
          title: 'Customers',
          subtitle: 'Earned relationships',
          metrics: [
            { label: 'Total Customers', value: sectionData.length.toString(), color: 'text-[var(--foreground)]' },
            { label: 'Active', value: activeCustomers.toString(), color: 'text-blue-600' },
            { label: 'Satisfaction', value: 'Calculating...', color: 'text-green-600' }
          ],
          actionButton: '+ Add Customer'
        };
      default:
        return {
          title: activeSection.charAt(0).toUpperCase() + activeSection.slice(1),
          subtitle: 'Pipeline data',
          metrics: [],
          actionButton: '+ Add Record'
        };
    }
  };

  const sectionInfo = getSectionMetrics();

  // Debug logging to see what's causing the loading state
  console.log("🔍 PipelineMiddlePanel state:", {
    section: activeSection,
    isLoading: data.isLoading,
    isLoaded: data.isLoaded,
    stagesLoading,
    leadsCount: pipelineData.data?.length || 0,
    prospectsCount: pipelineData.data?.length || 0,
    dataKeys: [`pipeline-${activeSection}`]
  });

  // More robust loading check: Use pipeline data loading state
  const hasAnyData = pipelineData['data'] && pipelineData.data.length > 0;
  const shouldShowLoading = pipelineData['loading'] && !hasAnyData;
  
  if (shouldShowLoading) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)]">
        {/* Header skeleton */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-[var(--loading-bg)] rounded w-32 animate-pulse"></div>
            </div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-20 animate-pulse"></div>
          </div>
        </div>
        
        {/* Filters skeleton */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-[var(--border)]">
          <div className="flex gap-4">
            <div className="h-8 bg-[var(--loading-bg)] rounded w-48 animate-pulse"></div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
            <div className="h-8 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
          </div>
        </div>
        
        {/* Table skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-[var(--loading-bg)] rounded w-8 animate-pulse"></div>
                <div className="h-4 bg-[var(--loading-bg)] rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-[var(--loading-bg)] rounded w-28 animate-pulse"></div>
                <div className="h-4 bg-[var(--loading-bg)] rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-[var(--loading-bg)] rounded w-40 animate-pulse"></div>
                <div className="h-4 bg-[var(--loading-bg)] rounded w-32 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Detail view when record is selected
  if (selectedRecord) {
    return (
      <div className="h-full">
        {activeSection === 'leads' && (
          <UniversalRecordTemplate
            record={selectedRecord}
            recordType="leads"
            recordIndex={(() => {
              const index = pipelineData.data.findIndex((r: any) => r['id'] === selectedRecord.id);
              return index >= 0 ? index + 1 : 0;
            })()}
            totalRecords={pipelineData.data.length}
            onBack={() => {
              ui.setSelectedRecord(null);
              // Navigate back to leads list with workspace context
              navigateToPipeline('leads');
            }}
            onNavigatePrevious={() => {
              const currentIndex = pipelineData.data.findIndex((r: any) => r['id'] === selectedRecord.id);
              if (currentIndex > 0) {
                const newRecord = pipelineData['data'][currentIndex - 1];
                ui.setSelectedRecord(newRecord);
                const recordName = newRecord.fullName || newRecord.name || newRecord.firstName || 'record';
                navigateToPipelineItem('leads', newRecord.id, recordName);
              }
            }}
            onNavigateNext={() => {
              const currentIndex = pipelineData.data.findIndex((r: any) => r['id'] === selectedRecord.id);
              if (currentIndex < pipelineData.data.length - 1) {
                const newRecord = pipelineData['data'][currentIndex + 1];
                ui.setSelectedRecord(newRecord);
                const recordName = newRecord.fullName || newRecord.name || newRecord.firstName || 'record';
                navigateToPipelineItem('leads', newRecord.id, recordName);
              }
            }}
            onComplete={() => {
              console.log('Complete action for:', selectedRecord?.fullName || selectedRecord?.name || selectedRecord?.firstName);
            }}
            onSnooze={(recordId: string, duration: string) => {
              console.log('Snooze action for:', recordId, duration);
            }}
            onRecordUpdate={(updatedRecord) => {
              console.log('Record updated:', updatedRecord);
              ui.setSelectedRecord(updatedRecord);
            }}
          />
        )}
        {activeSection === 'prospects' && (
          <UniversalRecordTemplate
            record={selectedRecord}
            recordType="prospects"
            recordIndex={(() => {
              const index = pipelineData.data.findIndex((r: any) => r['id'] === selectedRecord.id);
              return index >= 0 ? index + 1 : 0;
            })()}
            totalRecords={pipelineData.data.length}
            onBack={() => {
              ui.setSelectedRecord(null);
              // Navigate back to prospects list with workspace context
              navigateToPipeline('prospects');
            }}
            onNavigatePrevious={() => {
              const currentIndex = pipelineData.data.findIndex((r: any) => r['id'] === selectedRecord.id);
              if (currentIndex > 0) {
                const newRecord = pipelineData['data'][currentIndex - 1];
                ui.setSelectedRecord(newRecord);
                const recordName = newRecord.fullName || newRecord.name || newRecord.firstName || 'record';
                navigateToPipelineItem('prospects', newRecord.id, recordName);
              }
            }}
            onNavigateNext={() => {
              const currentIndex = pipelineData.data.findIndex((r: any) => r['id'] === selectedRecord.id);
              if (currentIndex < pipelineData.data.length - 1) {
                const newRecord = pipelineData['data'][currentIndex + 1];
                ui.setSelectedRecord(newRecord);
                const recordName = newRecord.fullName || newRecord.name || newRecord.firstName || 'record';
                navigateToPipelineItem('prospects', newRecord.id, recordName);
              }
            }}
            onComplete={() => {
              console.log('Complete action for:', selectedRecord?.fullName || selectedRecord?.name || selectedRecord?.firstName);
            }}
            onSnooze={(recordId: string, duration: string) => {
              console.log('Snooze action for:', recordId, duration);
            }}
            onRecordUpdate={(updatedRecord) => {
              console.log('Record updated:', updatedRecord);
              ui.setSelectedRecord(updatedRecord);
            }}
          />
        )}
        {activeSection === 'opportunities' && (
          <OpportunityDetails 
            opportunity={selectedRecord} 
            onBack={() => {
              ui.setSelectedRecord(null);
              // Navigate back to opportunities list
              window.history.pushState(null, '', '/opportunities');
            }}
            hideHeader={false}
            onCompanyClick={(company) => console.log('Navigate to company:', company)}
            onEditOpportunity={(opportunity) => console.log('Edit opportunity:', opportunity)}
            onDeleteOpportunity={(opportunity) => console.log('Delete opportunity:', opportunity)}
            onNavigateToBuyerGroups={() => console.log('Navigate to buyer groups')}
            onNavigateToLeads={() => console.log('Navigate to leads')}
          />
        )}
        {activeSection === 'people' && (
          <PersonDetails 
            person={selectedRecord} 
            onBack={() => ui.setSelectedRecord(null)}
            hideHeader={false}
            onCompanyClick={(company) => console.log('Navigate to company:', company)}
            onEditPerson={(person) => console.log('Edit person:', person)}
            onDeletePerson={(person) => console.log('Delete person:', person)}
          />
        )}
        {activeSection === 'companies' && (
          <CompanyDetails 
            company={selectedRecord} 
            onBack={() => ui.setSelectedRecord(null)}
            hideHeader={false}
            onCompanyClick={(company) => console.log('Navigate to company:', company)}
            onReportClick={(reportKey) => console.log('View report:', reportKey)}
            onEditCompany={(company) => console.log('Edit company:', company)}
            onDeleteCompany={(company) => console.log('Delete company:', company)}
          />
        )}
        {activeSection === 'partners' && (
          <PartnerDetails 
            partner={selectedRecord} 
            onBack={() => ui.setSelectedRecord(null)}
            hideHeader={false}
            onEditPartner={(partner) => console.log('Edit partner:', partner)}
            onDeletePartner={(partner) => console.log('Delete partner:', partner)}
          />
        )}
        {/* Fallback for other sections */}
        {!['leads', 'opportunities', 'people', 'companies', 'partners'].includes(activeSection) && (
          <div className="p-6">
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => ui.setSelectedRecord(null)}
                    className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
                  >
                    ← Back
                  </button>
                  <h3 className="text-lg font-medium text-[var(--foreground)]">
                    {selectedRecord.name || selectedRecord.companyName || selectedRecord.company || 'Record Details'}
                  </h3>
                </div>
                <div className="text-sm text-[var(--muted)] capitalize">
                  {activeSection}
                </div>
              </div>
              <div className="p-6">
                <p className="text-[var(--muted)]">
                  Detail view for {activeSection} is not yet implemented.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render header with section info and metrics (like original implementation)
  const renderHeader = () => (
    <div className="bg-[var(--background)] border-b border-[var(--border)] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{sectionInfo.title}</h1>
            <p className="text-sm text-[var(--muted)]">{sectionInfo.subtitle}</p>
          </div>
          
          {/* Metrics like the original */}
          <div className="flex items-center gap-6 ml-8">
            {sectionInfo.metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className={`text-lg font-semibold ${metric.color}`}>
                  {metric.value}
                </div>
                <div className="text-xs text-[var(--muted)] uppercase tracking-wide">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Action button like the original */}
        <button 
          onClick={() => {
            console.log(`Creating new ${activeSection.slice(0, -1)}`);
            // Open the Add Modal for the current section
            ui.setIsAddModalOpen(true);
          }}
          className="bg-[var(--button-background)] text-[var(--button-text)] border border-[var(--border)] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--button-hover)] transition-colors"
        >
          {sectionInfo.actionButton}
        </button>
      </div>
    </div>
  );

  // List/Table view for certain sections
  const showTableView = ['leads', 'prospects', 'accounts', 'contacts'].includes(activeSection);
  
  if (showTableView) {
    return (
      <div className="h-full flex flex-col bg-[var(--background)] overflow-hidden">
        {renderHeader()}
        <div className="flex-1 px-6 pt-2">
          <PipelineFilters activeSection={activeSection} />
          <div className="flex-1 mt-2 -mx-6">
            <PipelineTableView activeSection={activeSection} />
          </div>
        </div>
      </div>
    );
  }

  // Kanban view for other sections
  return (
    <div className="h-full flex flex-col bg-[var(--background)] overflow-hidden">
      {renderHeader()}
      <div className="flex-1 px-6 pt-2 pb-4">
        <PipelineFilters activeSection={activeSection} />
        <div className="mt-2">
          <PipelineKanbanView activeSection={activeSection} />
        </div>
      </div>
    </div>
  );
}
