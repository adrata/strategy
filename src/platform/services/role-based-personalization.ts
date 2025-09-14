/**
 * ROLE-BASED DATA ACCESS AND PERSONALIZATION SERVICE
 * 
 * Provides personalized experiences based on user roles, from SDR to CRO,
 * with intelligent data filtering and contextual AI responses.
 */

import { PrismaClient } from '@prisma/client';
import { SALES_ROLES, RolePermissionService, type DataAccessLevel, type AIPersonalizationConfig } from './user-role-system';

const prisma = new PrismaClient();

export interface UserContext {
  userId: string;
  workspaceId: string;
  roleId?: string;
  roleName?: string;
  title?: string;
  department?: string;
  seniorityLevel?: string;
  territory?: string;
  managerId?: string;
}

export interface PersonalizedResponse {
  content: string;
  detailLevel: 'summary' | 'detailed' | 'comprehensive';
  includeMetrics: boolean;
  includeRecommendations: boolean;
  includeNextSteps: boolean;
  urgency: 'low' | 'medium' | 'high';
  suggestedActions: PersonalizedAction[];
}

export interface PersonalizedAction {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'research' | 'outreach' | 'follow_up' | 'analysis' | 'planning';
  estimatedTime: string;
  requiredRole?: string;
}

export interface DataFilter {
  accounts?: {
    scope: 'assigned' | 'team' | 'territory' | 'all';
    dealSizeLimit?: number;
    industryRestrictions?: string[];
  };
  contacts?: {
    scope: 'assigned' | 'team' | 'territory' | 'all';
    seniorityLimit?: string;
  };
  opportunities?: {
    scope: 'assigned' | 'team' | 'territory' | 'all';
    stageRestrictions?: string[];
    forecastAccess: boolean;
  };
}

export class RoleBasedPersonalizationService {
  
  /**
   * Get comprehensive user context including role and profile information
   */
  static async getUserContext(userId: string, workspaceId: string): Promise<UserContext | null> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          profiles: {
            where: { workspaceId },
            include: {
              manager: {
                select: { id: true, name: true, title: true }
              }
            }
          },
          memberships: {
            where: { workspaceId },
            include: {
              assignedRole: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  level: true,
                  category: true,
                  department: true,
                  dataAccessConfig: true,
                  aiPersonalizationConfig: true
                }
              }
            }
          }
        }
      });

      if (!user) return null;

      const profile = user['profiles'][0];
      const membership = user['memberships'][0];
      const role = membership?.assignedRole;

      return {
        userId,
        workspaceId,
        roleId: role?.id,
        roleName: role?.name,
        title: profile?.title || user.title,
        department: profile?.department || user.department,
        seniorityLevel: profile?.seniorityLevel || user.seniorityLevel,
        territory: profile?.territory || user.territory,
        managerId: profile?.managerId || user.manager
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }

  /**
   * Get data access level for a user based on their role
   */
  static async getDataAccessLevel(userId: string, workspaceId: string): Promise<DataAccessLevel | null> {
    const context = await this.getUserContext(userId, workspaceId);
    if (!context?.roleName) return null;

    return RolePermissionService.getDataAccessLevel(context.roleName);
  }

  /**
   * Get AI personalization config for a user
   */
  static async getAIPersonalization(userId: string, workspaceId: string): Promise<AIPersonalizationConfig | null> {
    const context = await this.getUserContext(userId, workspaceId);
    if (!context?.roleName) return null;

    // Get base config from role
    const baseConfig = RolePermissionService.getAIPersonalization(context.roleName);
    if (!baseConfig) return null;

    // Override with user-specific preferences
    const userProfile = await prisma.usersProfile.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      }
    });

    if (userProfile) {
      return {
        ...baseConfig,
        communicationStyle: (userProfile.communicationStyle as any) || baseConfig.communicationStyle,
        contentPreferences: {
          ...baseConfig.contentPreferences,
          detailLevel: (userProfile.preferredDetailLevel as any) || baseConfig.contentPreferences.detailLevel
        },
        intelligenceFocus: {
          ...baseConfig.intelligenceFocus,
          ...(userProfile.intelligenceFocus as any || {})
        },
        notifications: {
          ...baseConfig.notifications,
          ...(userProfile.notificationPreferences as any || {})
        }
      };
    }

    return baseConfig;
  }

  /**
   * Apply data filters based on user role and permissions
   */
  static async applyDataFilters(
    userId: string,
    workspaceId: string,
    query: any
  ): Promise<any> {
    const dataAccess = await this.getDataAccessLevel(userId, workspaceId);
    if (!dataAccess) return query;

    const context = await this.getUserContext(userId, workspaceId);
    const filteredQuery = { ...query };

    // Apply account filters
    if (query.accounts || query.include?.accounts) {
      switch (dataAccess.accounts.scope) {
        case 'assigned':
          filteredQuery['where'] = {
            ...filteredQuery.where,
            assignedUserId: userId
          };
          break;
        case 'team':
          if (context?.managerId) {
            filteredQuery['where'] = {
              ...filteredQuery.where,
              OR: [
                { assignedUserId: userId },
                { assignedUserId: context.managerId }
              ]
            };
          }
          break;
        case 'territory':
          if (context?.territory) {
            filteredQuery['where'] = {
              ...filteredQuery.where,
              territory: context.territory
            };
          }
          break;
        // 'all' scope - no additional filters
      }

      // Apply deal size limits
      if (dataAccess.accounts.dealSizeLimit) {
        filteredQuery['where'] = {
          ...filteredQuery.where,
          opportunities: {
            some: {
              value: {
                lte: dataAccess.accounts.dealSizeLimit
              }
            }
          }
        };
      }
    }

    // Apply contact filters
    if (query.contacts || query.include?.contacts) {
      if (dataAccess.contacts.seniorityLimit) {
        const seniorityHierarchy = ['ic', 'manager', 'director', 'vp', 'c_level'];
        const maxIndex = seniorityHierarchy.indexOf(dataAccess.contacts.seniorityLimit);
        const allowedLevels = seniorityHierarchy.slice(0, maxIndex + 1);

        filteredQuery['where'] = {
          ...filteredQuery.where,
          seniorityLevel: {
            in: allowedLevels
          }
        };
      }
    }

    // Apply opportunity filters
    if (query.opportunities || query.include?.opportunities) {
      if (!dataAccess.opportunities.forecastAccess) {
        // Remove forecast-related fields from select
        if (filteredQuery.select) {
          delete filteredQuery.select.forecastCategory;
          delete filteredQuery.select.forecastProbability;
        }
      }

      if (dataAccess.opportunities.stageRestrictions) {
        filteredQuery['where'] = {
          ...filteredQuery.where,
          stage: {
            notIn: dataAccess.opportunities.stageRestrictions
          }
        };
      }
    }

    return filteredQuery;
  }

  /**
   * Personalize AI response based on user role and preferences
   */
  static async personalizeResponse(
    userId: string,
    workspaceId: string,
    baseResponse: string,
    context?: any
  ): Promise<PersonalizedResponse> {
    const aiConfig = await this.getAIPersonalization(userId, workspaceId);
    const userContext = await this.getUserContext(userId, workspaceId);
    
    if (!aiConfig || !userContext) {
      return {
        content: baseResponse,
        detailLevel: 'detailed',
        includeMetrics: false,
        includeRecommendations: true,
        includeNextSteps: true,
        urgency: 'medium',
        suggestedActions: []
      };
    }

    // Adjust content based on role and preferences
    let personalizedContent = baseResponse;
    const suggestedActions: PersonalizedAction[] = [];

    // Role-specific content adjustments
    switch (userContext.roleName) {
      case 'cro':
        personalizedContent = this.addExecutiveContext(personalizedContent, context);
        suggestedActions.push(...this.getCROActions(context));
        break;
      case 'vp_sales':
        personalizedContent = this.addVPContext(personalizedContent, context);
        suggestedActions.push(...this.getVPActions(context));
        break;
      case 'enterprise_ae':
        personalizedContent = this.addAEContext(personalizedContent, context);
        suggestedActions.push(...this.getAEActions(context));
        break;
      case 'sdr':
        personalizedContent = this.addSDRContext(personalizedContent, context);
        suggestedActions.push(...this.getSDRActions(context));
        break;
    }

    // Apply communication style
    personalizedContent = this.applyCommunicationStyle(
      personalizedContent,
      aiConfig.communicationStyle
    );

    return {
      content: personalizedContent,
      detailLevel: aiConfig.contentPreferences.detailLevel,
      includeMetrics: aiConfig.contentPreferences.includeMetrics,
      includeRecommendations: aiConfig.contentPreferences.includeRecommendations,
      includeNextSteps: aiConfig.contentPreferences.includeNextSteps,
      urgency: aiConfig.notifications.urgency,
      suggestedActions
    };
  }

  /**
   * Get role-specific CoreSignal access limits
   */
  static async getCoreSignalLimits(userId: string, workspaceId: string) {
    const context = await this.getUserContext(userId, workspaceId);
    if (!context?.roleName) return null;

    return RolePermissionService.getCoreSignalLimits(context.roleName);
  }

  /**
   * Check if user can access specific CoreSignal features
   */
  static async canAccessCoreSignalFeature(
    userId: string,
    workspaceId: string,
    feature: 'person' | 'company' | 'bulk' | 'premium_data'
  ): Promise<boolean> {
    const limits = await this.getCoreSignalLimits(userId, workspaceId);
    if (!limits || !limits.enabled) return false;

    switch (feature) {
      case 'person':
      case 'company':
        return limits.searchTypes.includes(feature);
      case 'bulk':
        return limits.searchTypes.includes('bulk');
      case 'premium_data':
        return limits['enrichmentLevel'] === 'premium';
      default:
        return false;
    }
  }

  /**
   * Track CoreSignal credit usage
   */
  static async trackCoreSignalUsage(
    userId: string,
    workspaceId: string,
    creditsUsed: number
  ): Promise<boolean> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          coreSignalCreditsUsed: true,
          coreSignalCreditsLimit: true,
          coreSignalLastReset: true
        }
      });

      if (!user) return false;

      // Check if we need to reset monthly credits
      const now = new Date();
      const lastReset = user.coreSignalLastReset || new Date();
      const monthsSinceReset = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                              (now.getMonth() - lastReset.getMonth());

      let currentUsed = user.coreSignalCreditsUsed || 0;
      let shouldReset = false;

      if (monthsSinceReset >= 1) {
        currentUsed = 0;
        shouldReset = true;
      }

      // Check if user has enough credits
      const limit = user.coreSignalCreditsLimit || 500;
      if (currentUsed + creditsUsed > limit) {
        return false; // Not enough credits
      }

      // Update usage
      await prisma.users.update({
        where: { id: userId },
        data: {
          coreSignalCreditsUsed: currentUsed + creditsUsed,
          ...(shouldReset && { coreSignalLastReset: now })
        }
      });

      return true;
    } catch (error) {
      console.error('Error tracking CoreSignal usage:', error);
      return false;
    }
  }

  // Private helper methods for role-specific content

  private static addExecutiveContext(content: string, context: any): string {
    // Add strategic insights and high-level metrics for CRO
    return content + '\n\n**Strategic Impact**: This intelligence supports revenue growth objectives and competitive positioning.';
  }

  private static addVPContext(content: string, context: any): string {
    // Add territory and team performance context for VP Sales
    return content + '\n\n**Territory Insights**: Consider impact on team performance and quota attainment.';
  }

  private static addAEContext(content: string, context: any): string {
    // Add deal-specific insights for Account Executives
    return content + '\n\n**Deal Strategy**: Focus on stakeholder engagement and buying committee dynamics.';
  }

  private static addSDRContext(content: string, context: any): string {
    // Add prospecting and lead qualification context for SDRs
    return content + '\n\n**Prospecting Focus**: Prioritize lead qualification and meeting booking opportunities.';
  }

  private static getCROActions(context: any): PersonalizedAction[] {
    return [
      {
        id: 'strategic-analysis',
        title: 'Strategic Market Analysis',
        description: 'Analyze competitive positioning and market opportunities',
        priority: 'high',
        category: 'analysis',
        estimatedTime: '30 minutes'
      }
    ];
  }

  private static getVPActions(context: any): PersonalizedAction[] {
    return [
      {
        id: 'team-coaching',
        title: 'Team Performance Review',
        description: 'Review team metrics and identify coaching opportunities',
        priority: 'medium',
        category: 'planning',
        estimatedTime: '20 minutes'
      }
    ];
  }

  private static getAEActions(context: any): PersonalizedAction[] {
    return [
      {
        id: 'stakeholder-mapping',
        title: 'Update Stakeholder Map',
        description: 'Map buying committee and identify missing stakeholders',
        priority: 'high',
        category: 'research',
        estimatedTime: '15 minutes'
      }
    ];
  }

  private static getSDRActions(context: any): PersonalizedAction[] {
    return [
      {
        id: 'lead-research',
        title: 'Research Lead Background',
        description: 'Gather intelligence for personalized outreach',
        priority: 'medium',
        category: 'research',
        estimatedTime: '10 minutes'
      }
    ];
  }

  private static applyCommunicationStyle(content: string, style: string): string {
    switch (style) {
      case 'direct':
        return content.replace(/\b(might|could|perhaps|maybe)\b/g, 'will');
      case 'analytical':
        return content + '\n\n**Data Confidence**: Based on available intelligence and market patterns.';
      case 'relationship_focused':
        return content.replace(/\bcompany\b/g, 'organization').replace(/\bcontact\b/g, 'relationship');
      default:
        return content;
    }
  }
}

export default RoleBasedPersonalizationService;
