/**
 * 🚀 INTELLIGENT STAGE PROGRESSION ENGINE
 * 
 * Automatically advances leads/deals/accounts through pipeline stages based on
 * contextual activity analysis. Uses AI-powered decision making to determine
 * when prospects should move to the next stage.
 */

import { TodayActivityTracker, type TodayActivity } from "./TodayActivityTracker";
import { AutoCustomerConversion } from "./AutoCustomerConversion";
import type { SpeedrunPerson } from "./context/SpeedrunProvider";
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';

export interface StageProgressionRule {
  trigger: "email_sent" | "email_replied" | "call_completed" | "meeting_scheduled" | "demo_completed" | "proposal_sent";
  currentStage: string;
  nextStage: string;
  condition?: string; // Optional additional condition
  minTime?: number; // Minimum time in minutes before progression
  confidence: number; // 0-100 confidence in this progression
}

export interface StageProgressionResult {
  shouldProgress: boolean;
  fromStage: string;
  toStage: string;
  reason: string;
  confidence: number;
  activityTrigger: TodayActivity;
  recommendedActions: string[];
}

export class IntelligentStageProgression {
  
  // Define stage progression rules based on sales methodology
  private static PROGRESSION_RULES: StageProgressionRule[] = [
    {
      trigger: "email_sent",
      currentStage: "prospect",
      nextStage: "contacted",
      confidence: 85,
      reason: "Initial outreach sent - moved to contacted stage"
    },
    {
      trigger: "email_replied", 
      currentStage: "contacted",
      nextStage: "qualified",
      confidence: 90,
      reason: "Prospect replied - indicates interest, qualifying stage"
    },
    {
      trigger: "call_completed",
      currentStage: "qualified", 
      nextStage: "discovery",
      confidence: 85,
      reason: "Discovery call completed - understanding needs"
    },
    {
      trigger: "demo_completed",
      currentStage: "discovery",
      nextStage: "proposal",
      confidence: 88,
      reason: "Demo completed - ready for proposal stage"
    },
    {
      trigger: "proposal_sent",
      currentStage: "proposal", 
      nextStage: "negotiation",
      confidence: 82,
      reason: "Proposal sent - entering negotiation phase"
    },
    {
      trigger: "meeting_scheduled",
      currentStage: "negotiation",
      nextStage: "closing",
      confidence: 95,
      reason: "Decision meeting scheduled - closing stage"
    }
  ];

  /**
   * 🎯 MAIN FUNCTION: Analyze recent activity and determine stage progression
   */
  static analyzeStageProgression(prospect: SpeedrunPerson): StageProgressionResult | null {
    const recentActivities = this.getRecentActivities(prospect.id.toString());
    
    if (recentActivities['length'] === 0) {
      return null; // No recent activity to analyze
    }

    // Get the most recent activity
    const latestActivity = recentActivities[0];
    const currentStage = prospect.status?.toLowerCase() || "prospect";
    
    // Find matching progression rule
    const matchingRule = this.PROGRESSION_RULES.find(rule => 
      rule['trigger'] === latestActivity['activityType'] &&
      rule.currentStage.toLowerCase() === currentStage
    );

    if (!matchingRule) {
      return null; // No matching rule found
    }

    // Check timing constraints
    if (matchingRule.minTime) {
      const activityAge = Date.now() - new Date(latestActivity.timestamp).getTime();
      const minTimeMs = matchingRule.minTime * 60 * 1000;
      
      if (activityAge < minTimeMs) {
        return null; // Too soon to progress
      }
    }

    // Generate contextual recommendations
    const recommendations = this.generateRecommendations(matchingRule.nextStage, prospect);

    return {
      shouldProgress: true,
      fromStage: matchingRule.currentStage,
      toStage: matchingRule.nextStage,
      reason: `${latestActivity.activityType.replace('_', ' ').toUpperCase()} activity detected - ${matchingRule.reason || 'automatic progression'}`,
      confidence: matchingRule.confidence,
      activityTrigger: latestActivity,
      recommendedActions: recommendations
    };
  }

  /**
   * 🔄 Execute stage progression for a prospect
   */
  static async executeStageProgression(
    prospect: SpeedrunPerson, 
    progression: StageProgressionResult
  ): Promise<boolean> {
    try {
      console.log(`🚀 IntelligentStageProgression: Moving ${prospect.name} from ${progression.fromStage} to ${progression.toStage}`);
      
      // 🏆 SPECIAL CASE: Check if moving to "Closed Won" - trigger customer conversion
      if (progression.toStage.toLowerCase().includes("won") || progression.toStage.toLowerCase().includes("customer")) {
        console.log(`🏆 Closed Won detected! Triggering customer conversion for ${prospect.company}`);
        
        const customerConversion = await AutoCustomerConversion.detectAndConvertClosedWon({
          ...prospect,
          status: progression.toStage // Update status before conversion
        });
        
        if (customerConversion) {
          console.log(`✅ Successfully converted ${customerConversion.companyName} to customer: ${customerConversion.convertedPeople} people, $${customerConversion.revenue.toLocaleString()} revenue`);
          
          // Record the customer conversion
          TodayActivityTracker.recordActivity({
            leadId: prospect.id.toString(),
            prospectName: prospect.name,
            company: prospect.company,
            activityType: "message",
            timestamp: new Date(),
            outcome: `🏆 CUSTOMER CONVERSION: ${customerConversion.companyName} → ${customerConversion.convertedPeople} people converted, $${customerConversion.revenue.toLocaleString()} deal value`
          });
          
          return true;
        }
      }
      
      // Update prospect stage
      const updatedProspect = {
        ...prospect,
        status: progression.toStage,
        recentActivity: `Automatically progressed to ${progression.toStage}: ${progression.reason}`,
        lastContact: new Date().toISOString()
      };

      // Record the progression activity
      TodayActivityTracker.recordActivity({
        leadId: prospect.id.toString(),
        prospectName: prospect.name,
        company: prospect.company,
        activityType: "message", // System message
        timestamp: new Date(),
        outcome: `Stage progression: ${progression.fromStage} → ${progression.toStage}`
      });

      // If this is a real production environment, update the database
      const { workspaceId, userId } = await this.getWorkspaceContext();
      
      if (workspaceId && userId) {
        await this.updateProspectStage(
          prospect.id.toString(), 
          progression.toStage, 
          progression.reason,
          workspaceId,
          userId
        );
      }

      console.log(`✅ Successfully progressed ${prospect.name} to ${progression.toStage} stage`);
      return true;

    } catch (error) {
      console.error(`❌ IntelligentStageProgression: Error progressing ${prospect.name}:`, error);
      return false;
    }
  }

  /**
   * 📊 Get contextual insights about why prospect is ranking higher
   */
  static getContextualInsight(prospect: SpeedrunPerson): string {
    const recentActivities = this.getRecentActivities(prospect.id.toString());
    
    if (recentActivities['length'] === 0) {
      return "";
    }

    const latestActivity = recentActivities[0];
    const activityAge = Date.now() - new Date(latestActivity.timestamp).getTime();
    const minutesAgo = Math.floor(activityAge / (1000 * 60));
    const hoursAgo = Math.floor(activityAge / (1000 * 60 * 60));

    let timePhrase = "";
    if (minutesAgo < 60) {
      timePhrase = `${minutesAgo} minutes ago`;
    } else if (hoursAgo < 24) {
      timePhrase = `${hoursAgo} hours ago`;
    } else {
      timePhrase = "today";
    }

    const activityVerb = {
      "email": "emailed",
      "call": "called", 
      "message": "messaged",
      "meeting": "met with"
    }[latestActivity.activityType] || "contacted";

    return `🔥 Ranking higher: ${activityVerb} ${timePhrase}`;
  }

  /**
   * 🎯 Get enhanced ranking context for cards
   */
  static getEnhancedRankingContext(prospect: SpeedrunPerson): {
    contextLabel: string;
    priority: "high" | "medium" | "low";
    activityType: string;
    timeAgo: string;
    nextAction: string;
  } | null {
    const recentActivities = this.getRecentActivities(prospect.id.toString());
    
    if (recentActivities['length'] === 0) {
      return null;
    }

    const latestActivity = recentActivities[0];
    const activityAge = Date.now() - new Date(latestActivity.timestamp).getTime();
    const minutesAgo = Math.floor(activityAge / (1000 * 60));

    let priority: "high" | "medium" | "low" = "medium";
    if (minutesAgo < 30) priority = "high";
    else if (minutesAgo < 120) priority = "medium";
    else priority = "low";

    const timeAgo = minutesAgo < 60 ? `${minutesAgo}m` : `${Math.floor(minutesAgo / 60)}h`;

    const nextActions = {
      "email": "Follow up if no reply",
      "call": "Send follow-up email",
      "message": "Schedule call",
      "meeting": "Send proposal"
    };

    return {
      contextLabel: `${latestActivity.activityType} ${timeAgo} ago`,
      priority,
      activityType: latestActivity.activityType,
      timeAgo,
      nextAction: nextActions[latestActivity.activityType as keyof typeof nextActions] || "Follow up"
    };
  }

  /**
   * 🔍 Get recent activities for a prospect
   */
  private static getRecentActivities(leadId: string): TodayActivity[] {
    const todayActivities = TodayActivityTracker.getTodayActivities();
    return todayActivities
      .filter(activity => activity['leadId'] === leadId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * 💡 Generate stage-specific recommendations
   */
  private static generateRecommendations(nextStage: string, prospect: SpeedrunPerson): string[] {
    const stageRecommendations = {
      "contacted": [
        "Send personalized follow-up within 24 hours",
        "Reference specific pain points from research",
        "Offer value-add resource or insight"
      ],
      "qualified": [
        "Schedule discovery call within 48 hours", 
        "Prepare qualification questions",
        "Research key business challenges"
      ],
      "discovery": [
        "Document pain points and requirements",
        "Identify decision makers and process",
        "Schedule product demo or presentation"
      ],
      "proposal": [
        "Create customized proposal addressing specific needs",
        "Include ROI calculations and case studies", 
        "Set timeline for decision making"
      ],
      "negotiation": [
        "Address any objections or concerns",
        "Finalize contract terms and pricing",
        "Schedule decision meeting with stakeholders"
      ],
      "closing": [
        "Confirm all decision makers are aligned",
        "Prepare contracts and onboarding materials",
        "Set implementation timeline"
      ]
    };

    return stageRecommendations[nextStage as keyof typeof stageRecommendations] || [
      "Continue regular follow-up",
      "Maintain relationship momentum"
    ];
  }

  /**
   * 🔧 Get workspace context for API calls
   */
  private static async getWorkspaceContext(): Promise<{ workspaceId: string; userId: string }> {
    try {
      return await WorkspaceDataRouter.getApiParams();
    } catch (error) {
      console.warn("Could not get workspace context:", error);
      return { workspaceId: "", userId: "" };
    }
  }

  /**
   * 💾 Update prospect stage in database
   */
  private static async updateProspectStage(
    leadId: string, 
    newStage: string, 
    reason: string,
    workspaceId: string,
    userId: string
  ): Promise<void> {
    try {
      const response = await fetch('/api/data/leads/update-stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          newStage,
          reason,
          workspaceId,
          userId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update stage: ${response.statusText}`);
      }

      console.log(`✅ Database updated: Lead ${leadId} moved to ${newStage}`);
    } catch (error) {
      console.error("❌ Failed to update prospect stage in database:", error);
      // Don't throw - progression can continue without database update
    }
  }
}
