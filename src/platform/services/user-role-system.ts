/**
 * COMPREHENSIVE USER ROLE AND PERSONALIZATION SYSTEM
 * 
 * Defines sales team hierarchy, permissions, and personalized experiences
 * from SDR to CRO with role-based data access and AI personalization.
 */

export interface SalesRole {
  id: string;
  name: string;
  displayName: string;
  level: number; // 1 = CRO, 2 = VP, 3 = Director, 4 = Manager, 5 = Individual Contributor
  category: 'executive' | 'management' | 'individual_contributor';
  department: 'sales' | 'revenue_operations' | 'sales_enablement' | 'customer_success';
  permissions: RolePermission[];
  dataAccess: DataAccessLevel;
  aiPersonalization: AIPersonalizationConfig;
  defaultApps: string[];
  dashboardConfig: DashboardConfig;
}

export interface RolePermission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'manage')[];
  scope: 'own' | 'team' | 'department' | 'company' | 'all';
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'in' | 'greater_than' | 'less_than';
  value: any;
}

export interface DataAccessLevel {
  // Account/Company access
  accounts: {
    scope: 'assigned' | 'team' | 'territory' | 'all';
    dealSizeLimit?: number; // Max deal size they can see
    industryRestrictions?: string[];
  };
  
  // Contact/People access
  contacts: {
    scope: 'assigned' | 'team' | 'territory' | 'all';
    seniorityLimit?: 'ic' | 'manager' | 'director' | 'vp' | 'c_level'; // Max seniority they can see
  };
  
  // Pipeline/Opportunity access
  opportunities: {
    scope: 'assigned' | 'team' | 'territory' | 'all';
    stageRestrictions?: string[];
    forecastAccess: boolean;
  };
  
  // Intelligence/Research access
  intelligence: {
    buyerGroupAccess: boolean;
    competitiveIntel: boolean;
    marketResearch: boolean;
    advancedAnalytics: boolean;
  };
  
  // CoreSignal API access
  coreSignalAccess: {
    enabled: boolean;
    creditsPerMonth?: number;
    searchTypes: ('person' | 'company' | 'bulk')[];
    enrichmentLevel: 'basic' | 'standard' | 'premium';
  };
}

export interface AIPersonalizationConfig {
  // Communication style
  communicationStyle: 'direct' | 'consultative' | 'analytical' | 'relationship_focused';
  
  // Content preferences
  contentPreferences: {
    detailLevel: 'summary' | 'detailed' | 'comprehensive';
    includeMetrics: boolean;
    includeRecommendations: boolean;
    includeNextSteps: boolean;
  };
  
  // Intelligence focus areas
  intelligenceFocus: {
    buyingSignals: boolean;
    competitorMentions: boolean;
    stakeholderMapping: boolean;
    technographics: boolean;
    financialHealth: boolean;
  };
  
  // Notification preferences
  notifications: {
    urgency: 'low' | 'medium' | 'high';
    frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
    channels: ('in_app' | 'email' | 'slack' | 'teams')[];
  };
}

export interface DashboardConfig {
  defaultView: 'speedrun' | 'pipeline' | 'accounts' | 'analytics';
  widgets: DashboardWidget[];
  kpis: string[];
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'activity_feed';
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
}

// COMPREHENSIVE SALES ROLE DEFINITIONS
export const SALES_ROLES: Record<string, SalesRole> = {
  // EXECUTIVE LEVEL (Level 1-2)
  cro: {
    id: 'cro',
    name: 'Chief Revenue Officer',
    displayName: 'Chief Revenue Officer',
    level: 1,
    category: 'executive',
    department: 'sales',
    permissions: [
      { resource: '*', actions: ['create', 'read', 'update', 'delete', 'manage'], scope: 'all' },
      { resource: 'financial_data', actions: ['read'], scope: 'all' },
      { resource: 'strategic_planning', actions: ['create', 'read', 'update', 'manage'], scope: 'all' }
    ],
    dataAccess: {
      accounts: { scope: 'all' },
      contacts: { scope: 'all' },
      opportunities: { scope: 'all', forecastAccess: true },
      intelligence: {
        buyerGroupAccess: true,
        competitiveIntel: true,
        marketResearch: true,
        advancedAnalytics: true
      },
      coreSignalAccess: {
        enabled: true,
        creditsPerMonth: 10000,
        searchTypes: ['person', 'company', 'bulk'],
        enrichmentLevel: 'premium'
      }
    },
    aiPersonalization: {
      communicationStyle: 'analytical',
      contentPreferences: {
        detailLevel: 'comprehensive',
        includeMetrics: true,
        includeRecommendations: true,
        includeNextSteps: true
      },
      intelligenceFocus: {
        buyingSignals: true,
        competitorMentions: true,
        stakeholderMapping: true,
        technographics: true,
        financialHealth: true
      },
      notifications: {
        urgency: 'high',
        frequency: 'real_time',
        channels: ['in_app', 'email', 'slack']
      }
    },
    defaultApps: ['analytics', 'pipeline', 'speedrun', 'monaco'],
    dashboardConfig: {
      defaultView: 'analytics',
      widgets: [
        { id: 'revenue_forecast', type: 'chart', position: { x: 0, y: 0, w: 6, h: 4 }, config: {} },
        { id: 'pipeline_health', type: 'metric', position: { x: 6, y: 0, w: 3, h: 2 }, config: {} },
        { id: 'team_performance', type: 'table', position: { x: 0, y: 4, w: 9, h: 4 }, config: {} }
      ],
      kpis: ['revenue', 'pipeline_value', 'win_rate', 'sales_velocity', 'team_quota_attainment']
    }
  },

  vp_sales: {
    id: 'vp_sales',
    name: 'VP Sales',
    displayName: 'Vice President of Sales',
    level: 2,
    category: 'executive',
    department: 'sales',
    permissions: [
      { resource: 'accounts', actions: ['create', 'read', 'update', 'delete'], scope: 'department' },
      { resource: 'opportunities', actions: ['create', 'read', 'update', 'delete'], scope: 'department' },
      { resource: 'team_management', actions: ['create', 'read', 'update', 'manage'], scope: 'department' },
      { resource: 'forecasting', actions: ['read', 'update'], scope: 'department' }
    ],
    dataAccess: {
      accounts: { scope: 'territory', dealSizeLimit: 5000000 },
      contacts: { scope: 'territory', seniorityLimit: 'c_level' },
      opportunities: { scope: 'territory', forecastAccess: true },
      intelligence: {
        buyerGroupAccess: true,
        competitiveIntel: true,
        marketResearch: true,
        advancedAnalytics: true
      },
      coreSignalAccess: {
        enabled: true,
        creditsPerMonth: 5000,
        searchTypes: ['person', 'company', 'bulk'],
        enrichmentLevel: 'premium'
      }
    },
    aiPersonalization: {
      communicationStyle: 'consultative',
      contentPreferences: {
        detailLevel: 'detailed',
        includeMetrics: true,
        includeRecommendations: true,
        includeNextSteps: true
      },
      intelligenceFocus: {
        buyingSignals: true,
        competitorMentions: true,
        stakeholderMapping: true,
        technographics: true,
        financialHealth: true
      },
      notifications: {
        urgency: 'high',
        frequency: 'real_time',
        channels: ['in_app', 'email']
      }
    },
    defaultApps: ['pipeline', 'speedrun', 'monaco', 'analytics'],
    dashboardConfig: {
      defaultView: 'pipeline',
      widgets: [
        { id: 'territory_pipeline', type: 'chart', position: { x: 0, y: 0, w: 6, h: 4 }, config: {} },
        { id: 'team_quota', type: 'metric', position: { x: 6, y: 0, w: 3, h: 2 }, config: {} },
        { id: 'top_opportunities', type: 'table', position: { x: 0, y: 4, w: 9, h: 4 }, config: {} }
      ],
      kpis: ['territory_revenue', 'team_quota_attainment', 'pipeline_coverage', 'win_rate']
    }
  },

  // MANAGEMENT LEVEL (Level 3-4)
  sales_director: {
    id: 'sales_director',
    name: 'Sales Director',
    displayName: 'Director of Sales',
    level: 3,
    category: 'management',
    department: 'sales',
    permissions: [
      { resource: 'accounts', actions: ['create', 'read', 'update', 'delete'], scope: 'team' },
      { resource: 'opportunities', actions: ['create', 'read', 'update', 'delete'], scope: 'team' },
      { resource: 'team_management', actions: ['read', 'update'], scope: 'team' }
    ],
    dataAccess: {
      accounts: { scope: 'team', dealSizeLimit: 2000000 },
      contacts: { scope: 'team', seniorityLimit: 'vp' },
      opportunities: { scope: 'team', forecastAccess: true },
      intelligence: {
        buyerGroupAccess: true,
        competitiveIntel: true,
        marketResearch: true,
        advancedAnalytics: false
      },
      coreSignalAccess: {
        enabled: true,
        creditsPerMonth: 2500,
        searchTypes: ['person', 'company'],
        enrichmentLevel: 'standard'
      }
    },
    aiPersonalization: {
      communicationStyle: 'consultative',
      contentPreferences: {
        detailLevel: 'detailed',
        includeMetrics: true,
        includeRecommendations: true,
        includeNextSteps: true
      },
      intelligenceFocus: {
        buyingSignals: true,
        competitorMentions: true,
        stakeholderMapping: true,
        technographics: false,
        financialHealth: false
      },
      notifications: {
        urgency: 'medium',
        frequency: 'hourly',
        channels: ['in_app', 'email']
      }
    },
    defaultApps: ['pipeline', 'speedrun', 'monaco'],
    dashboardConfig: {
      defaultView: 'pipeline',
      widgets: [
        { id: 'team_pipeline', type: 'chart', position: { x: 0, y: 0, w: 6, h: 4 }, config: {} },
        { id: 'quota_progress', type: 'metric', position: { x: 6, y: 0, w: 3, h: 2 }, config: {} }
      ],
      kpis: ['team_revenue', 'quota_attainment', 'pipeline_health', 'activity_metrics']
    }
  },

  sales_manager: {
    id: 'sales_manager',
    name: 'Sales Manager',
    displayName: 'Sales Manager',
    level: 4,
    category: 'management',
    department: 'sales',
    permissions: [
      { resource: 'accounts', actions: ['read', 'update'], scope: 'team' },
      { resource: 'opportunities', actions: ['create', 'read', 'update'], scope: 'team' },
      { resource: 'activities', actions: ['create', 'read', 'update'], scope: 'team' }
    ],
    dataAccess: {
      accounts: { scope: 'team', dealSizeLimit: 1000000 },
      contacts: { scope: 'team', seniorityLimit: 'director' },
      opportunities: { scope: 'team', forecastAccess: true },
      intelligence: {
        buyerGroupAccess: true,
        competitiveIntel: true,
        marketResearch: false,
        advancedAnalytics: false
      },
      coreSignalAccess: {
        enabled: true,
        creditsPerMonth: 1500,
        searchTypes: ['person', 'company'],
        enrichmentLevel: 'standard'
      }
    },
    aiPersonalization: {
      communicationStyle: 'relationship_focused',
      contentPreferences: {
        detailLevel: 'detailed',
        includeMetrics: true,
        includeRecommendations: true,
        includeNextSteps: true
      },
      intelligenceFocus: {
        buyingSignals: true,
        competitorMentions: true,
        stakeholderMapping: true,
        technographics: false,
        financialHealth: false
      },
      notifications: {
        urgency: 'medium',
        frequency: 'hourly',
        channels: ['in_app']
      }
    },
    defaultApps: ['speedrun', 'pipeline', 'monaco'],
    dashboardConfig: {
      defaultView: 'speedrun',
      widgets: [
        { id: 'team_activities', type: 'activity_feed', position: { x: 0, y: 0, w: 6, h: 6 }, config: {} },
        { id: 'pipeline_summary', type: 'metric', position: { x: 6, y: 0, w: 3, h: 3 }, config: {} }
      ],
      kpis: ['team_activities', 'pipeline_progression', 'coaching_metrics']
    }
  },

  // INDIVIDUAL CONTRIBUTORS (Level 5)
  enterprise_ae: {
    id: 'enterprise_ae',
    name: 'Enterprise AE',
    displayName: 'Enterprise Account Executive',
    level: 5,
    category: 'individual_contributor',
    department: 'sales',
    permissions: [
      { resource: 'accounts', actions: ['read', 'update'], scope: 'own' },
      { resource: 'opportunities', actions: ['create', 'read', 'update'], scope: 'own' },
      { resource: 'activities', actions: ['create', 'read', 'update'], scope: 'own' }
    ],
    dataAccess: {
      accounts: { scope: 'assigned', dealSizeLimit: 2000000 },
      contacts: { scope: 'assigned', seniorityLimit: 'c_level' },
      opportunities: { scope: 'assigned', forecastAccess: false },
      intelligence: {
        buyerGroupAccess: true,
        competitiveIntel: true,
        marketResearch: false,
        advancedAnalytics: false
      },
      coreSignalAccess: {
        enabled: true,
        creditsPerMonth: 1000,
        searchTypes: ['person', 'company'],
        enrichmentLevel: 'standard'
      }
    },
    aiPersonalization: {
      communicationStyle: 'consultative',
      contentPreferences: {
        detailLevel: 'detailed',
        includeMetrics: false,
        includeRecommendations: true,
        includeNextSteps: true
      },
      intelligenceFocus: {
        buyingSignals: true,
        competitorMentions: true,
        stakeholderMapping: true,
        technographics: false,
        financialHealth: false
      },
      notifications: {
        urgency: 'medium',
        frequency: 'real_time',
        channels: ['in_app']
      }
    },
    defaultApps: ['speedrun', 'monaco', 'pipeline'],
    dashboardConfig: {
      defaultView: 'speedrun',
      widgets: [
        { id: 'my_opportunities', type: 'table', position: { x: 0, y: 0, w: 9, h: 4 }, config: {} },
        { id: 'activity_summary', type: 'metric', position: { x: 0, y: 4, w: 4, h: 2 }, config: {} }
      ],
      kpis: ['quota_attainment', 'pipeline_value', 'activity_count', 'deal_velocity']
    }
  },

  mid_market_ae: {
    id: 'mid_market_ae',
    name: 'Mid-Market AE',
    displayName: 'Mid-Market Account Executive',
    level: 5,
    category: 'individual_contributor',
    department: 'sales',
    permissions: [
      { resource: 'accounts', actions: ['read', 'update'], scope: 'own' },
      { resource: 'opportunities', actions: ['create', 'read', 'update'], scope: 'own' },
      { resource: 'activities', actions: ['create', 'read', 'update'], scope: 'own' }
    ],
    dataAccess: {
      accounts: { scope: 'assigned', dealSizeLimit: 500000 },
      contacts: { scope: 'assigned', seniorityLimit: 'vp' },
      opportunities: { scope: 'assigned', forecastAccess: false },
      intelligence: {
        buyerGroupAccess: true,
        competitiveIntel: false,
        marketResearch: false,
        advancedAnalytics: false
      },
      coreSignalAccess: {
        enabled: true,
        creditsPerMonth: 750,
        searchTypes: ['person', 'company'],
        enrichmentLevel: 'standard'
      }
    },
    aiPersonalization: {
      communicationStyle: 'direct',
      contentPreferences: {
        detailLevel: 'summary',
        includeMetrics: false,
        includeRecommendations: true,
        includeNextSteps: true
      },
      intelligenceFocus: {
        buyingSignals: true,
        competitorMentions: false,
        stakeholderMapping: true,
        technographics: false,
        financialHealth: false
      },
      notifications: {
        urgency: 'medium',
        frequency: 'hourly',
        channels: ['in_app']
      }
    },
    defaultApps: ['speedrun', 'pipeline'],
    dashboardConfig: {
      defaultView: 'speedrun',
      widgets: [
        { id: 'my_pipeline', type: 'chart', position: { x: 0, y: 0, w: 6, h: 4 }, config: {} },
        { id: 'quota_progress', type: 'metric', position: { x: 6, y: 0, w: 3, h: 2 }, config: {} }
      ],
      kpis: ['quota_attainment', 'deals_closed', 'activity_count']
    }
  },

  sdr: {
    id: 'sdr',
    name: 'SDR',
    displayName: 'Sales Development Representative',
    level: 5,
    category: 'individual_contributor',
    department: 'sales',
    permissions: [
      { resource: 'leads', actions: ['create', 'read', 'update'], scope: 'own' },
      { resource: 'activities', actions: ['create', 'read', 'update'], scope: 'own' },
      { resource: 'sequences', actions: ['create', 'read', 'update'], scope: 'own' }
    ],
    dataAccess: {
      accounts: { scope: 'assigned', dealSizeLimit: 100000 },
      contacts: { scope: 'assigned', seniorityLimit: 'manager' },
      opportunities: { scope: 'assigned', forecastAccess: false },
      intelligence: {
        buyerGroupAccess: false,
        competitiveIntel: false,
        marketResearch: false,
        advancedAnalytics: false
      },
      coreSignalAccess: {
        enabled: true,
        creditsPerMonth: 500,
        searchTypes: ['person'],
        enrichmentLevel: 'basic'
      }
    },
    aiPersonalization: {
      communicationStyle: 'direct',
      contentPreferences: {
        detailLevel: 'summary',
        includeMetrics: false,
        includeRecommendations: true,
        includeNextSteps: true
      },
      intelligenceFocus: {
        buyingSignals: true,
        competitorMentions: false,
        stakeholderMapping: false,
        technographics: false,
        financialHealth: false
      },
      notifications: {
        urgency: 'low',
        frequency: 'daily',
        channels: ['in_app']
      }
    },
    defaultApps: ['speedrun'],
    dashboardConfig: {
      defaultView: 'speedrun',
      widgets: [
        { id: 'lead_queue', type: 'table', position: { x: 0, y: 0, w: 9, h: 6 }, config: {} },
        { id: 'activity_metrics', type: 'metric', position: { x: 0, y: 6, w: 9, h: 2 }, config: {} }
      ],
      kpis: ['leads_qualified', 'meetings_booked', 'activity_count', 'response_rate']
    }
  },

  // REVENUE OPERATIONS
  vp_revenue_ops: {
    id: 'vp_revenue_ops',
    name: 'VP Revenue Operations',
    displayName: 'VP Revenue Operations',
    level: 2,
    category: 'executive',
    department: 'revenue_operations',
    permissions: [
      { resource: 'analytics', actions: ['create', 'read', 'update', 'manage'], scope: 'all' },
      { resource: 'forecasting', actions: ['create', 'read', 'update', 'manage'], scope: 'all' },
      { resource: 'process_optimization', actions: ['create', 'read', 'update', 'manage'], scope: 'all' }
    ],
    dataAccess: {
      accounts: { scope: 'all' },
      contacts: { scope: 'all' },
      opportunities: { scope: 'all', forecastAccess: true },
      intelligence: {
        buyerGroupAccess: true,
        competitiveIntel: true,
        marketResearch: true,
        advancedAnalytics: true
      },
      coreSignalAccess: {
        enabled: true,
        creditsPerMonth: 7500,
        searchTypes: ['person', 'company', 'bulk'],
        enrichmentLevel: 'premium'
      }
    },
    aiPersonalization: {
      communicationStyle: 'analytical',
      contentPreferences: {
        detailLevel: 'comprehensive',
        includeMetrics: true,
        includeRecommendations: true,
        includeNextSteps: false
      },
      intelligenceFocus: {
        buyingSignals: true,
        competitorMentions: true,
        stakeholderMapping: true,
        technographics: true,
        financialHealth: true
      },
      notifications: {
        urgency: 'medium',
        frequency: 'daily',
        channels: ['in_app', 'email']
      }
    },
    defaultApps: ['analytics', 'pipeline', 'monaco'],
    dashboardConfig: {
      defaultView: 'analytics',
      widgets: [
        { id: 'revenue_analytics', type: 'chart', position: { x: 0, y: 0, w: 12, h: 6 }, config: {} },
        { id: 'process_metrics', type: 'table', position: { x: 0, y: 6, w: 12, h: 4 }, config: {} }
      ],
      kpis: ['revenue_efficiency', 'process_optimization', 'data_quality', 'forecast_accuracy']
    }
  }
};

// ROLE HIERARCHY AND REPORTING STRUCTURE
export const ROLE_HIERARCHY = {
  1: ['cro'],
  2: ['vp_sales', 'vp_revenue_ops'],
  3: ['sales_director'],
  4: ['sales_manager'],
  5: ['enterprise_ae', 'mid_market_ae', 'sdr']
};

// PERMISSION VALIDATION
export class RolePermissionService {
  
  static hasPermission(
    userRole: string,
    resource: string,
    action: string,
    scope: string = 'own'
  ): boolean {
    const role = SALES_ROLES[userRole];
    if (!role) return false;
    
    // Check for wildcard permissions
    const wildcardPermission = role.permissions.find(p => p['resource'] === '*');
    if (wildcardPermission && wildcardPermission.actions.includes(action as any)) {
      return this.checkScope(wildcardPermission.scope, scope);
    }
    
    // Check specific resource permissions
    const permission = role.permissions.find(p => p['resource'] === resource);
    if (!permission) return false;
    
    return permission.actions.includes(action as any) && 
           this.checkScope(permission.scope, scope);
  }
  
  private static checkScope(permissionScope: string, requestedScope: string): boolean {
    const scopeHierarchy = ['own', 'team', 'department', 'company', 'all'];
    const permissionLevel = scopeHierarchy.indexOf(permissionScope);
    const requestedLevel = scopeHierarchy.indexOf(requestedScope);
    
    return permissionLevel >= requestedLevel;
  }
  
  static getDataAccessLevel(userRole: string): DataAccessLevel | null {
    const role = SALES_ROLES[userRole];
    return role?.dataAccess || null;
  }
  
  static getAIPersonalization(userRole: string): AIPersonalizationConfig | null {
    const role = SALES_ROLES[userRole];
    return role?.aiPersonalization || null;
  }
  
  static getRolesByLevel(level: number): SalesRole[] {
    return Object.values(SALES_ROLES).filter(role => role['level'] === level);
  }
  
  static getRolesByCategory(category: SalesRole['category']): SalesRole[] {
    return Object.values(SALES_ROLES).filter(role => role['category'] === category);
  }
  
  static canAccessCoreSignal(userRole: string): boolean {
    const role = SALES_ROLES[userRole];
    return role?.dataAccess.coreSignalAccess.enabled || false;
  }
  
  static getCoreSignalLimits(userRole: string) {
    const role = SALES_ROLES[userRole];
    return role?.dataAccess.coreSignalAccess || null;
  }
}

export default {
  SALES_ROLES,
  ROLE_HIERARCHY,
  RolePermissionService
};
