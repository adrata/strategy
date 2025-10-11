/**
 * TAB REGISTRY - Configuration-driven tab management
 * 
 * This file replaces large switch statements in UniversalRecordTemplate and UpdateModal
 * with a data-driven approach. It maintains exact same functionality while improving
 * code maintainability.
 */

import React from 'react';

// Import all tab components
import {
  UniversalOverviewTab,
  UniversalInsightsTab,
  UniversalCompanyTab,
  UniversalProfileTab,
  UniversalPainValueTab,
  UniversalTimelineTab,
  UniversalIndustryIntelTab,
  UniversalOutreachTab,
  UniversalEngagementTab,
  UniversalDealIntelTab,
  UniversalCompanyIntelTab,
  UniversalClosePlanTab,
  UniversalCompetitiveTab,
  UniversalRelationshipTab,
  UniversalPersonalTab,
  UniversalBusinessTab,
  UniversalSuccessTab,
  UniversalPartnershipTab,
  UniversalCollaborationTab,
  UniversalPerformanceTab,
  UniversalIndustryTab,
  UniversalLandminesTab,
  UniversalStakeholdersTab,
  UniversalDocumentsTab,
  UniversalContactsTab,
  UniversalOpportunitiesTab,
  UniversalStrategyTab,
  UniversalBuyerGroupsTab,
  UniversalCompetitorsTab,
  UniversalSellerCompaniesTab
} from '../tabs';

import { UniversalNewsTab } from '../tabs/UniversalNewsTab';
import { UniversalRoleTab } from '../tabs/UniversalRoleTab';
import { UniversalEnablersTab } from '../tabs/UniversalEnablersTab';
import { ProspectOverviewTab } from '../tabs/ProspectOverviewTab';
import { PersonOverviewTab } from '../tabs/PersonOverviewTab';
import { UniversalInsightsTab as ComprehensiveInsightsTab } from '../tabs/UniversalInsightsTab';
import { UniversalCareerTab as ComprehensiveCareerTab } from '../tabs/UniversalCareerTab';
import { UniversalHistoryTab } from '../tabs/UniversalHistoryTab';
import { UniversalBuyerGroupTab } from '../tabs/UniversalBuyerGroupTab';
import { UniversalProfileTab as ComprehensiveProfileTab } from '../tabs/UniversalProfileTab';
import { UniversalCompanyTab as ComprehensiveCompanyTab } from '../tabs/UniversalCompanyTab';

// Tab configuration interface
export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  component?: React.ComponentType<any>;
  availableFor?: string[];
  requiresProps?: string[];
}

// Component registry - maps tab IDs to React components
export const TAB_COMPONENTS: Record<string, React.ComponentType<any>> = {
  // Overview tabs
  'overview': UniversalOverviewTab,
  'overview-companies': UniversalCompanyTab,
  'overview-people': PersonOverviewTab,
  'overview-prospects': ProspectOverviewTab,
  
  // Intelligence tabs
  'intelligence': UniversalInsightsTab,
  'intelligence-companies': UniversalCompanyIntelTab,
  'intelligence-people': ComprehensiveInsightsTab,
  'intelligence-comprehensive': ComprehensiveInsightsTab,
  
  // Career and role tabs
  'career': ComprehensiveCareerTab,
  'role': UniversalRoleTab,
  'enablers': UniversalEnablersTab,
  
  // Strategy and business tabs
  'strategy': UniversalStrategyTab,
  'buyer-groups': UniversalBuyerGroupsTab,
  'competitors': UniversalCompetitorsTab,
  'companies': UniversalSellerCompaniesTab,
  
  // Profile and personal tabs
  'profile': UniversalProfileTab,
  'profile-comprehensive': ComprehensiveProfileTab,
  'personal': UniversalPersonalTab,
  'business': UniversalBusinessTab,
  
  // Deal and opportunity tabs
  'deal-intel': UniversalDealIntelTab,
  'stakeholders': UniversalStakeholdersTab,
  'close-plan': UniversalClosePlanTab,
  'competitive': UniversalCompetitiveTab,
  'opportunities': UniversalOpportunitiesTab,
  
  // Relationship and partnership tabs
  'relationship': UniversalRelationshipTab,
  'partnership': UniversalPartnershipTab,
  'collaboration': UniversalCollaborationTab,
  'performance': UniversalPerformanceTab,
  
  // Industry and company tabs
  'industry': UniversalIndustryTab,
  'industry-intel': UniversalIndustryIntelTab,
  'company': ComprehensiveCompanyTab,
  'company-intel': UniversalCompanyIntelTab,
  
  // Communication and engagement tabs
  'outreach': UniversalOutreachTab,
  'engagement': UniversalEngagementTab,
  'pain-value': UniversalPainValueTab,
  
  // Information and content tabs
  'news': UniversalNewsTab,
  'notes': UniversalTimelineTab, // Notes are typically rendered in timeline
  'timeline': UniversalTimelineTab,
  'documents': UniversalDocumentsTab,
  'contacts': UniversalContactsTab,
  
  // Specialized tabs
  'landmines': UniversalLandminesTab,
  'buyer-group': UniversalBuyerGroupTab,
  'history': UniversalHistoryTab,
  'success': UniversalSuccessTab,
  
  // Delete tab (special case)
  'delete': null as any, // Handled specially in components
};

// Tab configurations by record type
export const TAB_CONFIGURATIONS: Record<string, TabConfig[]> = {
  leads: [
    { id: 'overview', label: 'Overview', component: UniversalOverviewTab },
    { id: 'intelligence', label: 'Intelligence', component: UniversalInsightsTab },
    { id: 'career', label: 'Career', component: ComprehensiveCareerTab },
    { id: 'notes', label: 'Notes', component: UniversalTimelineTab },
    { id: 'timeline', label: 'Timeline', component: UniversalTimelineTab }
  ],
  
  prospects: [
    { id: 'overview', label: 'Overview', component: ProspectOverviewTab },
    { id: 'intelligence', label: 'Intelligence', component: UniversalInsightsTab },
    { id: 'career', label: 'Career', component: ComprehensiveCareerTab },
    { id: 'notes', label: 'Notes', component: UniversalTimelineTab },
    { id: 'timeline', label: 'Timeline', component: UniversalTimelineTab }
  ],
  
  opportunities: [
    { id: 'overview', label: 'Overview', component: UniversalOverviewTab },
    { id: 'deal-intel', label: 'Deal Intel', component: UniversalDealIntelTab },
    { id: 'stakeholders', label: 'Stakeholders', component: UniversalStakeholdersTab },
    { id: 'buyer-groups', label: 'Buyer Group', component: UniversalBuyerGroupsTab },
    { id: 'competitive', label: 'Competitive', component: UniversalCompetitiveTab },
    { id: 'close-plan', label: 'Close Plan', component: UniversalClosePlanTab },
    { id: 'notes', label: 'Notes', component: UniversalTimelineTab },
    { id: 'timeline', label: 'Timeline', component: UniversalTimelineTab }
  ],
  
  companies: [
    { id: 'overview', label: 'Overview', component: UniversalCompanyTab },
    { id: 'news', label: 'News', component: UniversalNewsTab },
    { id: 'intelligence', label: 'Intelligence', component: UniversalCompanyIntelTab },
    { id: 'buyer-groups', label: 'Buyer Group', component: UniversalBuyerGroupsTab },
    { id: 'competitors', label: 'Competitors', component: UniversalCompetitorsTab },
    { id: 'opportunities', label: 'Opportunities', component: UniversalOpportunitiesTab },
    { id: 'notes', label: 'Notes', component: UniversalTimelineTab },
    { id: 'timeline', label: 'Timeline', component: UniversalTimelineTab }
  ],
  
  people: [
    { id: 'overview', label: 'Overview', component: PersonOverviewTab },
    { id: 'intelligence', label: 'Intelligence', component: ComprehensiveInsightsTab },
    { id: 'career', label: 'Career', component: ComprehensiveCareerTab },
    { id: 'notes', label: 'Notes', component: UniversalTimelineTab },
    { id: 'timeline', label: 'Timeline', component: UniversalTimelineTab }
  ],
  
  speedrun: [
    { id: 'overview', label: 'Overview', component: PersonOverviewTab },
    { id: 'intelligence', label: 'Intelligence', component: ComprehensiveInsightsTab },
    { id: 'career', label: 'Career', component: ComprehensiveCareerTab },
    { id: 'notes', label: 'Notes', component: UniversalTimelineTab },
    { id: 'timeline', label: 'Timeline', component: UniversalTimelineTab }
  ],
  
  clients: [
    { id: 'overview', label: 'Overview', component: UniversalOverviewTab },
    { id: 'relationship', label: 'Relationship', component: UniversalRelationshipTab },
    { id: 'business', label: 'Business', component: UniversalBusinessTab },
    { id: 'personal', label: 'Personal', component: UniversalPersonalTab },
    { id: 'notes', label: 'Notes', component: UniversalTimelineTab },
    { id: 'timeline', label: 'Timeline', component: UniversalTimelineTab }
  ],
  
  partners: [
    { id: 'overview', label: 'Overview', component: UniversalOverviewTab },
    { id: 'partnership', label: 'Partnership', component: UniversalPartnershipTab },
    { id: 'collaboration', label: 'Collaboration', component: UniversalCollaborationTab },
    { id: 'performance', label: 'Performance', component: UniversalPerformanceTab },
    { id: 'notes', label: 'Notes', component: UniversalTimelineTab },
    { id: 'timeline', label: 'Timeline', component: UniversalTimelineTab }
  ],
  
  sellers: [
    { id: 'overview', label: 'Overview', component: UniversalOverviewTab },
    { id: 'companies', label: 'Companies', component: UniversalSellerCompaniesTab },
    { id: 'performance', label: 'Performance', component: UniversalPerformanceTab },
    { id: 'profile', label: 'Profile', component: ComprehensiveProfileTab },
    { id: 'notes', label: 'Notes', component: UniversalTimelineTab },
    { id: 'timeline', label: 'Timeline', component: UniversalTimelineTab }
  ]
};

// Helper functions to get tab configurations
export function getTabsForRecordType(recordType: string): TabConfig[] {
  return TAB_CONFIGURATIONS[recordType] || TAB_CONFIGURATIONS.leads;
}

export function getTabComponent(tabId: string, recordType: string): React.ComponentType<any> | null {
  // First try to get from tab configurations
  const tabs = getTabsForRecordType(recordType);
  const tabConfig = tabs.find(tab => tab.id === tabId);
  if (tabConfig?.component) {
    return tabConfig.component;
  }
  
  // Fallback to component registry
  return TAB_COMPONENTS[tabId] || null;
}

export function getTabConfig(tabId: string, recordType: string): TabConfig | null {
  const tabs = getTabsForRecordType(recordType);
  return tabs.find(tab => tab.id === tabId) || null;
}

// Special handling for record type specific components
export function getOverviewComponent(recordType: string): React.ComponentType<any> {
  switch (recordType) {
    case 'companies':
      return UniversalCompanyTab;
    case 'people':
    case 'speedrun':
      return PersonOverviewTab;
    case 'prospects':
      return ProspectOverviewTab;
    default:
      return UniversalOverviewTab;
  }
}

export function getIntelligenceComponent(recordType: string): React.ComponentType<any> {
  switch (recordType) {
    case 'companies':
      return UniversalCompanyIntelTab;
    case 'people':
      return ComprehensiveInsightsTab;
    default:
      return UniversalInsightsTab;
  }
}

export function getProfileComponent(recordType: string): React.ComponentType<any> {
  switch (recordType) {
    case 'people':
      return ComprehensiveProfileTab;
    default:
      return UniversalProfileTab;
  }
}

export function getBuyerGroupsComponent(recordType: string): React.ComponentType<any> {
  // All record types use the same buyer groups component
  return UniversalBuyerGroupsTab;
}

export function getInsightsComponent(recordType: string): React.ComponentType<any> {
  switch (recordType) {
    case 'people':
      return ComprehensiveInsightsTab;
    default:
      return UniversalInsightsTab;
  }
}