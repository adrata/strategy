import React from 'react';

// Import all tab components
import { UniversalOverviewTab } from '../tabs/UniversalOverviewTab';
import { UniversalCareerTab } from '../tabs/UniversalCareerTab';
import { UniversalStrategyTab } from '../tabs/UniversalStrategyTab';
import { UniversalBuyerGroupsTab } from '../tabs/UniversalBuyerGroupsTab';
import { UniversalInsightsTab } from '../tabs/UniversalInsightsTab';
import { UniversalTimelineTab } from '../tabs/UniversalTimelineTab';
import { UniversalCompanyTab } from '../tabs/UniversalCompanyTab';
import { PersonOverviewTab } from '../tabs/PersonOverviewTab';
import { ProspectOverviewTab } from '../tabs/ProspectOverviewTab';

/**
 * Tab Registry Configuration
 * 
 * Replaces large switch statements with a configuration-driven approach.
 * Each record type has its own tab configuration with component mappings.
 */

export interface TabConfig {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  icon?: string;
  description?: string;
}

export interface RecordTypeTabConfig {
  [recordType: string]: {
    [tabId: string]: TabConfig;
  };
}

// Tab component registry
export const TAB_COMPONENTS: RecordTypeTabConfig = {
  people: {
    overview: {
      id: 'overview',
      label: 'Overview',
      component: PersonOverviewTab,
      icon: '👤',
      description: 'Personal and professional information'
    },
    career: {
      id: 'career',
      label: 'Career',
      component: UniversalCareerTab,
      icon: '💼',
      description: 'Career history and experience'
    },
    role: {
      id: 'role',
      label: 'Role',
      component: UniversalOverviewTab,
      icon: '🎯',
      description: 'Current role and responsibilities'
    },
    enablers: {
      id: 'enablers',
      label: 'Enablers',
      component: UniversalOverviewTab,
      icon: '🔗',
      description: 'Connections and relationships'
    },
    company: {
      id: 'company',
      label: 'Company',
      component: UniversalCompanyTab,
      icon: '🏢',
      description: 'Company information'
    },
    intelligence: {
      id: 'intelligence',
      label: 'Intelligence',
      component: UniversalInsightsTab,
      icon: '🧠',
      description: 'AI-generated insights and analysis'
    },
    'buyer-groups': {
      id: 'buyer-groups',
      label: 'Buyer Groups',
      component: UniversalBuyerGroupsTab,
      icon: '👥',
      description: 'Buying committee and stakeholder mapping'
    },
    notes: {
      id: 'notes',
      label: 'Notes',
      component: UniversalOverviewTab,
      icon: '📝',
      description: 'Notes and comments'
    },
    timeline: {
      id: 'timeline',
      label: 'Timeline',
      component: UniversalTimelineTab,
      icon: '📅',
      description: 'Activity timeline and history'
    },
    delete: {
      id: 'delete',
      label: 'Delete',
      component: UniversalOverviewTab,
      icon: '🗑️',
      description: 'Delete this record'
    }
  },

  companies: {
    overview: {
      id: 'overview',
      label: 'Overview',
      component: UniversalCompanyTab,
      icon: '🏢',
      description: 'Company overview and basic information'
    },
    strategy: {
      id: 'strategy',
      label: 'Strategy',
      component: UniversalStrategyTab,
      icon: '🎯',
      description: 'Strategic information and approach'
    },
    people: {
      id: 'people',
      label: 'People',
      component: UniversalOverviewTab,
      icon: '👥',
      description: 'Company contacts and team members'
    },
    opportunities: {
      id: 'opportunities',
      label: 'Opportunities',
      component: UniversalOverviewTab,
      icon: '💰',
      description: 'Related opportunities and deals'
    },
    timeline: {
      id: 'timeline',
      label: 'Timeline',
      component: UniversalTimelineTab,
      icon: '📅',
      description: 'Activity timeline and history'
    },
    notes: {
      id: 'notes',
      label: 'Notes',
      component: UniversalOverviewTab,
      icon: '📝',
      description: 'Notes and comments'
    },
    delete: {
      id: 'delete',
      label: 'Delete',
      component: UniversalOverviewTab,
      icon: '🗑️',
      description: 'Delete this record'
    }
  },

  leads: {
    overview: {
      id: 'overview',
      label: 'Overview',
      component: ProspectOverviewTab,
      icon: '🎯',
      description: 'Lead overview and basic information'
    },
    career: {
      id: 'career',
      label: 'Career',
      component: UniversalCareerTab,
      icon: '💼',
      description: 'Career history and experience'
    },
    role: {
      id: 'role',
      label: 'Role',
      component: UniversalOverviewTab,
      icon: '🎯',
      description: 'Current role and responsibilities'
    },
    enablers: {
      id: 'enablers',
      label: 'Enablers',
      component: UniversalOverviewTab,
      icon: '🔗',
      description: 'Connections and relationships'
    },
    company: {
      id: 'company',
      label: 'Company',
      component: UniversalCompanyTab,
      icon: '🏢',
      description: 'Company information'
    },
    intelligence: {
      id: 'intelligence',
      label: 'Intelligence',
      component: UniversalInsightsTab,
      icon: '🧠',
      description: 'AI-generated insights and analysis'
    },
    'buyer-groups': {
      id: 'buyer-groups',
      label: 'Buyer Groups',
      component: UniversalBuyerGroupsTab,
      icon: '👥',
      description: 'Buying committee and stakeholder mapping'
    },
    notes: {
      id: 'notes',
      label: 'Notes',
      component: UniversalOverviewTab,
      icon: '📝',
      description: 'Notes and comments'
    },
    timeline: {
      id: 'timeline',
      label: 'Timeline',
      component: UniversalTimelineTab,
      icon: '📅',
      description: 'Activity timeline and history'
    },
    delete: {
      id: 'delete',
      label: 'Delete',
      component: UniversalOverviewTab,
      icon: '🗑️',
      description: 'Delete this record'
    }
  },

  prospects: {
    overview: {
      id: 'overview',
      label: 'Overview',
      component: ProspectOverviewTab,
      icon: '🎯',
      description: 'Prospect overview and basic information'
    },
    career: {
      id: 'career',
      label: 'Career',
      component: UniversalCareerTab,
      icon: '💼',
      description: 'Career history and experience'
    },
    role: {
      id: 'role',
      label: 'Role',
      component: UniversalOverviewTab,
      icon: '🎯',
      description: 'Current role and responsibilities'
    },
    enablers: {
      id: 'enablers',
      label: 'Enablers',
      component: UniversalOverviewTab,
      icon: '🔗',
      description: 'Connections and relationships'
    },
    company: {
      id: 'company',
      label: 'Company',
      component: UniversalCompanyTab,
      icon: '🏢',
      description: 'Company information'
    },
    intelligence: {
      id: 'intelligence',
      label: 'Intelligence',
      component: UniversalInsightsTab,
      icon: '🧠',
      description: 'AI-generated insights and analysis'
    },
    'buyer-groups': {
      id: 'buyer-groups',
      label: 'Buyer Groups',
      component: UniversalBuyerGroupsTab,
      icon: '👥',
      description: 'Buying committee and stakeholder mapping'
    },
    notes: {
      id: 'notes',
      label: 'Notes',
      component: UniversalOverviewTab,
      icon: '📝',
      description: 'Notes and comments'
    },
    timeline: {
      id: 'timeline',
      label: 'Timeline',
      component: UniversalTimelineTab,
      icon: '📅',
      description: 'Activity timeline and history'
    },
    delete: {
      id: 'delete',
      label: 'Delete',
      component: UniversalOverviewTab,
      icon: '🗑️',
      description: 'Delete this record'
    }
  },

  opportunities: {
    overview: {
      id: 'overview',
      label: 'Overview',
      component: UniversalOverviewTab,
      icon: '💰',
      description: 'Opportunity overview and basic information'
    },
    'deal-intel': {
      id: 'deal-intel',
      label: 'Deal Intel',
      component: UniversalInsightsTab,
      icon: '🧠',
      description: 'Deal intelligence and analysis'
    },
    stakeholders: {
      id: 'stakeholders',
      label: 'Stakeholders',
      component: UniversalBuyerGroupsTab,
      icon: '👥',
      description: 'Stakeholder mapping and contacts'
    },
    competitive: {
      id: 'competitive',
      label: 'Competitive',
      component: UniversalStrategyTab,
      icon: '⚔️',
      description: 'Competitive analysis and positioning'
    },
    'close-plan': {
      id: 'close-plan',
      label: 'Close Plan',
      component: UniversalStrategyTab,
      icon: '🎯',
      description: 'Closing strategy and plan'
    },
    timeline: {
      id: 'timeline',
      label: 'Timeline',
      component: UniversalTimelineTab,
      icon: '📅',
      description: 'Activity timeline and history'
    },
    notes: {
      id: 'notes',
      label: 'Notes',
      component: UniversalOverviewTab,
      icon: '📝',
      description: 'Notes and comments'
    },
    delete: {
      id: 'delete',
      label: 'Delete',
      component: UniversalOverviewTab,
      icon: '🗑️',
      description: 'Delete this record'
    }
  }
};

/**
 * Get tab configuration for a specific record type
 */
export function getTabsForRecordType(recordType: string): TabConfig[] {
  const tabs = TAB_COMPONENTS[recordType];
  if (!tabs) {
    console.warn(`No tab configuration found for record type: ${recordType}`);
    return [];
  }
  
  return Object.values(tabs);
}

/**
 * Get a specific tab component for a record type and tab ID
 */
export function getTabComponent(recordType: string, tabId: string): React.ComponentType<any> | null {
  const tabs = TAB_COMPONENTS[recordType];
  if (!tabs || !tabs[tabId]) {
    console.warn(`No tab component found for record type: ${recordType}, tab: ${tabId}`);
    return null;
  }
  
  return tabs[tabId].component;
}

/**
 * Get tab configuration for a specific record type and tab ID
 */
export function getTabConfig(recordType: string, tabId: string): TabConfig | null {
  const tabs = TAB_COMPONENTS[recordType];
  if (!tabs || !tabs[tabId]) {
    console.warn(`No tab configuration found for record type: ${recordType}, tab: ${tabId}`);
    return null;
  }
  
  return tabs[tabId];
}

/**
 * Check if a tab exists for a record type
 */
export function hasTab(recordType: string, tabId: string): boolean {
  const tabs = TAB_COMPONENTS[recordType];
  return !!(tabs && tabs[tabId]);
}
