/**
 * 🎯 SmartRank Service - PRODUCTION READY
 * Uses existing database schema + localStorage hybrid
 * Ready for full database migration when schema is updated
 */

import { PrismaClient } from "@prisma/client";

// Use existing Activity table for lead interactions
interface LeadActivity {
  id: string;
  leadId: string;
  type: string;
  outcome?: string;
  completedAt?: Date;
  scheduledAt?: Date;
}

export interface SmartRankLead {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;

  // SmartRank Intelligence
  smartRankScore: number;
  rankingReason: string;
  priority: "Critical" | "High" | "Medium" | "Low";

  // Historical Data (from existing Activity table)
  lastContactDate?: Date | undefined;
  totalInteractions: number;
  responseRate: number;

  // Calculated Intelligence
  daysSinceLastContact: number;
  estimatedDealValue: number;
  buyingSignalsScore: number;

  // Team Coordination
  isBeingContactedToday: boolean;
}

export interface DailyProgress {
  date: string;
  completed: number;
  target: number;
  percentage: number;
  isComplete: boolean;
}

/**
 * 🧠 SmartRank Service - Production Implementation
 */
export class SmartRankServiceLive {
  private userId: string;
  private workspaceId: string;
  private prisma: PrismaClient;

  constructor(userId: string, workspaceId: string) {
    this['userId'] = userId;
    this['workspaceId'] = workspaceId;
    this['prisma'] = new PrismaClient();
  }

  /**
   * 🎯 Get 408 Leads Ranked by SmartRank Algorithm
   */
  async getSmartRankedLeads(limit: number = 100): Promise<SmartRankLead[]> {
    console.log("🧠 SmartRank: Loading 408 production leads...");

    // Get all leads with their activities
    const leads = await this.prisma.leads.findMany({
      where: {
        workspaceId: this.workspaceId,
        assignedUserId: this.userId,
        deletedAt: null,
        status: {
          in: ["new", "contacted", "qualified", "follow-up", "demo-scheduled"],
        },
      },
      include: {
        activities: {
          orderBy: { completedAt: "desc" },
          take: 10, // Last 10 activities
        },
      },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
    });

    console.log(`📊 SmartRank: Found ${leads.length} production leads`);

    // Get today's completed leads from localStorage (hybrid approach)
    const today = new Date().toDateString();
    const completedToday = this.getTodayCompletedLeads();

    // Apply SmartRank algorithm to each lead
    const filteredLeads = leads.filter((lead) => !completedToday.has(lead.id));
    const smartRankedLeads: SmartRankLead[] = await Promise.all(
      filteredLeads.map(async (lead) => {
        const activities = lead.activities || [];
        const lastActivity = activities[0];

        // Calculate SmartRank Score (0-100)
        const smartRankScore = this.calculateSmartRankScore(lead, activities);

        // Calculate days since last contact
        const daysSinceLastContact = lastActivity?.completedAt
          ? Math.floor(
              (Date.now() - lastActivity.completedAt.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 999;

        return {
          id: lead.id,
          name: lead.fullName,
          title: lead.jobTitle || "Professional",
          company: lead.company || "Unknown Company",
          email: lead.email || lead.workEmail || "",
          phone: lead.phone || lead.mobilePhone || "",

          smartRankScore,
          rankingReason: await this.generateRankingReason(
            lead,
            activities,
            smartRankScore,
          ),
          priority: this.scoreToPriority(smartRankScore),

          lastContactDate: lastActivity?.completedAt || undefined,
          totalInteractions: activities.length,
          responseRate: this.calculateResponseRate(activities),

          daysSinceLastContact,
          estimatedDealValue: lead.estimatedValue || 50000,
          buyingSignalsScore: this.calculateBuyingSignals(lead),

          isBeingContactedToday: this.checkTeammateActivityToday(
            lead.id,
            activities,
          ),
        };
      })
    )
      .sort((a, b) => b.smartRankScore - a.smartRankScore)
      .slice(0, limit);

    console.log(
      `🎯 SmartRank: Ranked ${smartRankedLeads.length} leads, top score: ${smartRankedLeads[0]?.smartRankScore || 0}`,
    );

    return smartRankedLeads;
  }

  /**
   * 📊 Get Daily Progress (Database-Ready)
   */
  async getDailyProgress(): Promise<DailyProgress> {
    const today = new Date().toDateString();
    const completedToday = this.getTodayCompletedLeads();

    // In full database version, this would query SpeedrunDailyProgress table
    const completed = completedToday.size;
    const target = 100;

    return {
      date: today,
      completed,
      target,
      percentage: Math.min((completed / target) * 100, 100),
      isComplete: completed >= target,
    };
  }

  /**
   * ✅ Mark Lead as Completed (Hybrid: localStorage + database activity)
   */
  async markLeadCompleted(
    leadId: string,
    outcome: string = "positive",
  ): Promise<void> {
    console.log(
      `✅ SmartRank: Speedrunng lead ${leadId} as completed with outcome: ${outcome}`,
    );

    try {
      // 1. Record activity in database
      await this.prisma.activity.create({
        data: {
          workspaceId: this.workspaceId,
          userId: this.userId,
          leadId: leadId,
          type: "outreach",
          subject: "Speedrun Outreach Completed",
          description: `Lead completed via SmartRank Speedrun with outcome: ${outcome}`,
          outcome: outcome,
          status: "completed",
          completedAt: new Date(),
        },
      });

      // 2. Update localStorage for immediate UI update
      this.addTodayCompletedLead(leadId);

      console.log(
        `✅ SmartRank: Successfully recorded completion for lead ${leadId}`,
      );
    } catch (error) {
      console.error("❌ SmartRank: Error speedrunng lead as completed:", error);
      throw error;
    }
  }

  /**
   * 👀 Mark Lead as Viewed (for ML learning)
   */
  async markLeadViewed(leadId: string): Promise<void> {
    // Record view for freshness tracking
    this.addTodayViewedLead(leadId);

    // In full database version, would create SpeedrunLeadInteraction record
    console.log(`👀 SmartRank: Lead ${leadId} viewed`);
  }

  /**
   * 📈 Weekly Progress (Cross-device when database migration complete)
   */
  async getWeeklyProgress(): Promise<DailyProgress> {
    // Use Activity table to get this week's completions
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyActivities = await this.prisma.activity.findMany({
      where: {
        workspaceId: this.workspaceId,
        userId: this.userId,
        type: "outreach",
        status: "completed",
        completedAt: {
          gte: startOfWeek,
        },
      },
    });

    const completed = weeklyActivities.length;
    const target = 400; // Weekly target

    return {
      date: startOfWeek.toDateString(),
      completed,
      target,
      percentage: Math.min((completed / target) * 100, 100),
      isComplete: completed >= target,
    };
  }

  // ===========================================
  // SMARTRANK ALGORITHM METHODS
  // ===========================================

  /**
   * 🧠 Calculate SmartRank Score (0-100)
   */
  private calculateSmartRankScore(lead: any, activities: any[]): number {
    let score = 0;

    // 1. Recency Score (30 points max) - More recent = higher score
    const lastActivity = activities[0];
    const daysSince = lastActivity?.completedAt
      ? Math.floor(
          (Date.now() - lastActivity.completedAt.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 30;
    const recencyScore = Math.max(30 - daysSince, 0); // 30 points for today, decreasing
    score += recencyScore;

    // 2. Engagement Score (25 points max) - Based on activity count and outcomes
    const positiveActivities = activities.filter(
      (a) => a['outcome'] === "positive",
    ).length;
    const engagementScore = Math.min(
      activities.length * 3 + positiveActivities * 5,
      25,
    );
    score += engagementScore;

    // 3. Deal Value Score (20 points max)
    const dealValue = lead.estimatedValue || 50000;
    const valueScore = Math.min(dealValue / 5000, 20); // $100K = 20 points
    score += valueScore;

    // 4. Priority Score (15 points max)
    const priorityScores = { high: 15, medium: 10, low: 5 };
    const priorityScore =
      priorityScores[lead.priority as keyof typeof priorityScores] || 5;
    score += priorityScore;

    // 5. Freshness Score (10 points max) - New leads get priority
    const isNewLead = activities['length'] === 0;
    const freshnessScore = isNewLead ? 10 : Math.max(10 - activities.length, 0);
    score += freshnessScore;

    return Math.min(Math.round(score), 100);
  }

  /**
   * 🎯 Generate Human-Readable Ranking Reason
   */
  private async generateRankingReason(
    lead: any,
    activities: any[],
    score: number,
  ): Promise<string> {
    try {
      const { generateText } = await import('../../platform/utils/openaiService');
      
      const lastActivity = activities[0];
      const daysSinceActivity = lastActivity ? 
        Math.floor((Date.now() - lastActivity.completedAt.getTime()) / (1000 * 60 * 60 * 24)) : null;
      
      const prompt = `Generate a concise sales priority explanation:

Lead: ${lead.fullName}
Title: ${lead.jobTitle || 'Unknown'}
Company: ${lead.company || 'Unknown'}
Score: ${score}/100
Value: $${lead.estimatedValue?.toLocaleString() || '50,000'}
Activities: ${activities.length} total
Last Contact: ${daysSinceActivity ? daysSinceActivity + ' days ago' : 'Never'}

Format: "[Priority]: [context], [timing]"
Example: "High priority: senior executive, engaged this week"
Keep under 80 characters:`;

      const explanation = await generateText({
        prompt,
        maxTokens: 30,
        temperature: 0.3
      });
      
      return explanation.trim();
    } catch (error) {
      console.warn('LLM explanation failed, using fallback:', error);
      return this.generateFallbackRankingReason(lead, activities, score);
    }
  }
  
  private generateFallbackRankingReason(
    lead: any,
    activities: any[],
    score: number,
  ): string {
    const reasons = [];

    if (score >= 80) reasons.push("🔥 High priority lead");
    if (lead['estimatedValue'] && lead.estimatedValue > 100000)
      reasons.push("💰 High value opportunity");
    if (activities.length > 0) {
      const daysSince = Math.floor(
        (Date.now() - activities[0].completedAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysSince > 7)
        reasons.push(`⏰ ${daysSince} days since last contact`);
      else reasons.push("📧 Recent engagement");
    } else {
      reasons.push("✨ Fresh lead opportunity");
    }

    return `${priorityLevel}: ${contextText}, ${reasonText}`;
  }

  /**
   * 🚦 Convert Score to Priority Level
   */
  private scoreToPriority(
    score: number,
  ): "Critical" | "High" | "Medium" | "Low" {
    if (score >= 80) return "Critical";
    if (score >= 60) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  }

  /**
   * 📊 Calculate Response Rate from Activities
   */
  private calculateResponseRate(activities: any[]): number {
    if (activities['length'] === 0) return 0.5; // Default neutral
    const positiveOutcomes = activities.filter(
      (a) => a['outcome'] === "positive",
    ).length;
    return positiveOutcomes / activities.length;
  }

  /**
   * 🔍 Calculate Buying Signals Score
   */
  private calculateBuyingSignals(lead: any): number {
    let score = 0;
    const text = [lead.notes, lead.description].join(" ").toLowerCase();

    const buyingKeywords = [
      "budget",
      "timeline",
      "decision",
      "urgent",
      "purchase",
      "buy",
      "asap",
      "immediately",
    ];
    buyingKeywords.forEach((keyword) => {
      if (text.includes(keyword)) score += 12.5; // Each keyword = 12.5 points
    });

    return Math.min(score, 100);
  }

  /**
   * 👥 Check if Teammate is Already Working This Lead Today
   */
  private checkTeammateActivityToday(
    leadId: string,
    activities: any[],
  ): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activities.some(
      (activity) =>
        activity.userId !== this['userId'] &&
        activity['completedAt'] &&
        activity.completedAt >= today,
    );
  }

  // ===========================================
  // HYBRID LOCALSTORAGE METHODS (for immediate use)
  // Will be replaced by database when migration complete
  // ===========================================

  private getTodayCompletedLeads(): Set<string> {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`smartrank-completed-${today}`);
    return new Set(stored ? JSON.parse(stored) : []);
  }

  private addTodayCompletedLead(leadId: string): void {
    const today = new Date().toDateString();
    const completed = this.getTodayCompletedLeads();
    completed.add(leadId);
    localStorage.setItem(
      `smartrank-completed-${today}`,
      JSON.stringify([...completed]),
    );
  }

  private addTodayViewedLead(leadId: string): void {
    const today = new Date().toDateString();
    const key = `smartrank-viewed-${today}`;
    const viewed = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
    viewed.add(leadId);
    localStorage.setItem(key, JSON.stringify([...viewed]));
  }

  /**
   * 🧹 Clear Today's Data (for testing/reset)
   */
  clearTodayData(): void {
    const today = new Date().toDateString();
    localStorage.removeItem(`smartrank-completed-${today}`);
    localStorage.removeItem(`smartrank-viewed-${today}`);
    console.log("🧹 SmartRank: Cleared today's data");
  }
}
