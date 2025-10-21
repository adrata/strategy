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
  UniversalActionsTab,
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
  NotesTab,
} from '../UniversalRecordTemplate';
import {
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
  UniversalPeopleTab,
  UniversalCompetitorsTab,
  UniversalSellerCompaniesTab
} from '../tabs';

import { UniversalNewsTab } from '../tabs/UniversalNewsTab';
import { UniversalRoleTab } from '../tabs/UniversalRoleTab';
import { UniversalEnablersTab } from '../tabs/UniversalEnablersTab';
import { ValueTab } from '../tabs/ValueTab';
import { ProspectOverviewTab } from '../tabs/ProspectOverviewTab';
import { PersonOverviewTab } from '../tabs/PersonOverviewTab';
import { UniversalInsightsTab as ComprehensiveInsightsTab } from '../tabs/UniversalInsightsTab';
import { UniversalCareerTab as ComprehensiveCareerTab } from '../tabs/UniversalCareerTab';
import { UniversalHistoryTab } from '../tabs/UniversalHistoryTab';
import { UniversalBuyerGroupTab } from '../tabs/UniversalBuyerGroupTab';
import { UniversalProfileTab as ComprehensiveProfileTab } from '../tabs/UniversalProfileTab';
import { UniversalCompanyTab as ComprehensiveCompanyTab } from '../tabs/UniversalCompanyTab';
import { CompanyOverviewTab } from '../tabs/CompanyOverviewTab';

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
  
  // Strategy tabs
  'strategy': UniversalInsightsTab,
  'strategy-companies': UniversalCompanyIntelTab,
  'strategy-people': ComprehensiveInsightsTab,
  'strategy-comprehensive': ComprehensiveInsightsTab,
  
  // Career and role tabs
  'career': ComprehensiveCareerTab,
  'role': UniversalRoleTab,
  'enablers': UniversalEnablersTab,
  
  // Business tabs
  'buyer-groups': UniversalBuyerGroupsTab,
  'people': UniversalPeopleTab,
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
  'company': CompanyOverviewTab,
  'company-info': CompanyOverviewTab,
  'company-intel': UniversalCompanyIntelTab,
  
  // Communication and engagement tabs
  'outreach': UniversalOutreachTab,
  'engagement': UniversalEngagementTab,
  'pain-value': UniversalPainValueTab,
  
  // Information and content tabs
  // 'news': UniversalNewsTab, // Temporarily hidden until news relevance is improved
  'notes': NotesTab, // Simple notes textarea
  'timeline': UniversalActionsTab,
  
  // Value and reporting tabs
  'value': ValueTab,
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
    { id: 'company', label: 'Company', component: CompanyOverviewTab },
    { id: 'strategy', label: 'Strategy', component: UniversalInsightsTab },
    { id: 'actions', label: 'Actions', component: UniversalActionsTab },
    { id: 'career', label: 'Career', component: ComprehensiveCareerTab },
    { id: 'notes', label: 'Notes', component: UniversalActionsTab }
  ],
  
  prospects: [
    { id: 'overview', label: 'Overview', component: ProspectOverviewTab },
    { id: 'company', label: 'Company', component: CompanyOverviewTab },
    { id: 'strategy', label: 'Strategy', component: UniversalInsightsTab },
    { id: 'actions', label: 'Actions', component: UniversalActionsTab },
    { id: 'career', label: 'Career', component: ComprehensiveCareerTab },
    { id: 'notes', label: 'Notes', component: UniversalActionsTab }
  ],
  
  opportunities: [
    { id: 'overview', label: 'Overview', component: UniversalOverviewTab },
    { id: 'company', label: 'Company', component: CompanyOverviewTab },
    { id: 'deal-intel', label: 'Deal Intel', component: UniversalDealIntelTab },
    { id: 'stakeholders', label: 'Stakeholders', component: UniversalStakeholdersTab },
    { id: 'buyer-groups', label: 'Buyer Group', component: UniversalBuyerGroupsTab },
    { id: 'competitive', label: 'Competitive', component: UniversalCompetitiveTab },
    { id: 'close-plan', label: 'Close Plan', component: UniversalClosePlanTab },
    { id: 'notes', label: 'Notes', component: UniversalActionsTab },
    { id: 'timeline', label: 'Timeline', component: UniversalActionsTab }
  ],
  
  companies: [
    { id: 'overview', label: 'Overview', component: UniversalCompanyTab },
    { id: 'strategy', label: 'Strategy', component: UniversalCompanyIntelTab },
    { id: 'actions', label: 'Actions', component: UniversalActionsTab },
    // { id: 'news', label: 'News', component: UniversalNewsTab }, // Temporarily hidden until news relevance is improved
    { id: 'people', label: 'People', component: UniversalPeopleTab },
    { id: 'value', label: 'Value', component: ValueTab },
    { id: 'buyer-groups', label: 'Buyer Group', component: UniversalBuyerGroupsTab },
    { id: 'opportunities', label: 'Opportunities', component: UniversalOpportunitiesTab },
    { id: 'notes', label: 'Notes', component: UniversalActionsTab }
  ],
  
  people: [
    { id: 'overview', label: 'Overview', component: PersonOverviewTab },
    { id: 'company', label: 'Company', component: CompanyOverviewTab },
    { id: 'strategy', label: 'Strategy', component: ComprehensiveInsightsTab },
    { id: 'actions', label: 'Actions', component: UniversalActionsTab },
    { id: 'career', label: 'Career', component: ComprehensiveCareerTab },
    { id: 'notes', label: 'Notes', component: UniversalActionsTab }
  ],
  
  speedrun: [
    { id: 'overview', label: 'Overview', component: PersonOverviewTab },
    { id: 'company', label: 'Company', component: CompanyOverviewTab },
    { id: 'strategy', label: 'Strategy', component: ComprehensiveInsightsTab },
    { id: 'actions', label: 'Actions', component: UniversalActionsTab },
    { id: 'career', label: 'Career', component: ComprehensiveCareerTab },
    { id: 'notes', label: 'Notes', component: UniversalActionsTab }
  ],
  
  clients: [
    { id: 'overview', label: 'Overview', component: UniversalOverviewTab },
    { id: 'relationship', label: 'Relationship', component: UniversalRelationshipTab },
    { id: 'business', label: 'Business', component: UniversalBusinessTab },
    { id: 'personal', label: 'Personal', component: UniversalPersonalTab },
    { id: 'notes', label: 'Notes', component: UniversalActionsTab },
    { id: 'timeline', label: 'Timeline', component: UniversalActionsTab }
  ],
  
  partners: [
    { id: 'overview', label: 'Overview', component: UniversalOverviewTab },
    { id: 'partnership', label: 'Partnership', component: UniversalPartnershipTab },
    { id: 'collaboration', label: 'Collaboration', component: UniversalCollaborationTab },
    { id: 'performance', label: 'Performance', component: UniversalPerformanceTab },
    { id: 'notes', label: 'Notes', component: UniversalActionsTab },
    { id: 'timeline', label: 'Timeline', component: UniversalActionsTab }
  ],
  
  sellers: [
    { id: 'overview', label: 'Overview', component: UniversalOverviewTab },
    { id: 'companies', label: 'Companies', component: UniversalSellerCompaniesTab },
    { id: 'performance', label: 'Performance', component: UniversalPerformanceTab },
    { id: 'profile', label: 'Profile', component: ComprehensiveProfileTab },
    { id: 'notes', label: 'Notes', component: UniversalActionsTab },
    { id: 'timeline', label: 'Timeline', component: UniversalActionsTab }
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