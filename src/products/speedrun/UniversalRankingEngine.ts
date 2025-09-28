/**
 * 🏆 UNIVERSAL WINNING RANKING ENGINE
 * 
 * Smart ranking algorithm designed to maximize sales success for any workspace.
 * Based on sales psychology, buyer behavior, and proven conversion patterns.
 * 
 * Prioritizes prospects that are most likely to:
 * 1. Respond positively to outreach
 * 2. Move through the sales pipeline quickly  
 * 3. Convert to high-value deals
 * 4. Generate referrals and expand accounts
 * 
 * Adapts to different workspace naming conventions and data structures.
 */

import type { SpeedrunPerson } from "./context/SpeedrunProvider";
import { TodayActivityTracker } from "./TodayActivityTracker";

export interface WinningScore {
  totalScore: number;
  rank: string; // 1, 2, 3, 4, 5, etc. (simple 1-30 numbering)
  confidence: number; // 0-1 confidence in ranking
  winFactors: string[]; // Human-readable factors contributing to ranking
  urgencyLevel: "Critical" | "High" | "Medium" | "Low";
  bestContactTime: string;
  dealPotential: number; // 0-100 estimated deal potential
}

export interface RankedSpeedrunPerson extends SpeedrunPerson {
  winningScore: WinningScore;
}

/**
 * 🎯 UNIVERSAL WINNING FORMULA
 * Based on proven sales patterns and buyer psychology for any workspace
 */
export class UniversalRankingEngine {
  
  /**
   * Main ranking function - sorts prospects for maximum winning potential
   */
  static rankProspectsForWinning(prospects: SpeedrunPerson[], workspaceName?: string): RankedSpeedrunPerson[] {
    const workspace = workspaceName || 'workspace';
    console.log(`🏆 UniversalRanking: Ranking ${prospects.length} prospects for maximum success in ${workspace}...`);
    
    // Step 0: 🚨 SMART COMPANY FILTERING - Prioritize other people at same company
    const companiesContactedToday = TodayActivityTracker.getCompaniesContactedToday();
    const availableProspects = prospects.filter(prospect => {
      const company = prospect.company || "Unknown Company";
      const isCompanyContactedToday = companiesContactedToday.has(company);
      
      // Only filter out if THIS SPECIFIC PERSON was contacted today
      const wasThisPersonContactedToday = this.wasContactedToday(prospect);
      
      if (wasThisPersonContactedToday) {
        console.log(`⏭️ Skipping ${prospect.name} at ${company} - this person already contacted today`);
        return false;
      }
      
      // If company was contacted but this person wasn't, prioritize them!
      if (isCompanyContactedToday && !wasThisPersonContactedToday) {
        console.log(`🎯 PRIORITIZING ${prospect.name} at ${company} - company contacted but this person wasn't`);
        // Don't filter out - this is exactly who we want to contact next!
      }
      
      return true;
    });
    
    console.log(`🚨 Filtered out ${prospects.length - availableProspects.length} prospects who were personally contacted today`);
    console.log(`📋 Available prospects for ${workspace}: ${availableProspects.length}`);
    
    // Step 1: Calculate winning scores for each prospect
    const scoredProspects = availableProspects.map(prospect => ({
      ...prospect,
      winningScore: this.calculateWinningScore(prospect)
    }));
    
    // Step 2: Group by company for strategic account approach
    const prospectsByCompany = this.groupByCompany(scoredProspects);
    
    // Step 3: Rank companies by total opportunity potential
    const rankedCompanies = this.rankCompaniesByOpportunity(prospectsByCompany);
    
    // Step 4: Generate final ranking with 1A, 1B, 2A, 2B pattern
    const finalRanking = this.generateCompanyBasedRanking(rankedCompanies);
    
    console.log(`🏆 UniversalRanking: Completed ranking for ${workspace}. Top ${Math.min(5, finalRanking.length)} prospects:`, 
      finalRanking.slice(0, 5).map(p => 
        `${p.winningScore.rank} ${p.name} (${p.company}) - Score: ${p.winningScore.totalScore}`
      )
    );
    
    return finalRanking;
  }
  
  /**
   * Calculate comprehensive winning score for a prospect
   */
  private static calculateWinningScore(prospect: SpeedrunPerson): WinningScore {
    let totalScore = 0;
    const winFactors: string[] = [];
    const scoreBreakdown: Record<string, number> = {};
    
    // 1. RELATIONSHIP WARMTH (25 points max) - Easier to connect with warm prospects
    const relationshipScore = this.calculateRelationshipScore(prospect);
    totalScore += relationshipScore.score;
    scoreBreakdown['relationship'] = relationshipScore.score;
    winFactors.push(...relationshipScore.factors);
    
    // 2. DECISION MAKING POWER (20 points max) - Target decision makers
    const decisionPowerScore = this.calculateDecisionPowerScore(prospect);
    totalScore += decisionPowerScore.score;
    scoreBreakdown['decisionPower'] = decisionPowerScore.score;
    winFactors.push(...decisionPowerScore.factors);
    
    // 3. TIMING & URGENCY (20 points max) - Strike while iron is hot
    const timingScore = this.calculateTimingScore(prospect);
    totalScore += timingScore.score;
    scoreBreakdown['timing'] = timingScore.score;
    winFactors.push(...timingScore.factors);
    
    // 4. DEAL VALUE POTENTIAL (15 points max) - Prioritize high-value opportunities
    const valueScore = this.calculateValueScore(prospect);
    totalScore += valueScore.score;
    scoreBreakdown['value'] = valueScore.score;
    winFactors.push(...valueScore.factors);
    
    // 5. ENGAGEMENT READINESS (10 points max) - Responsive prospects
    const engagementScore = this.calculateEngagementScore(prospect);
    totalScore += engagementScore.score;
    scoreBreakdown['engagement'] = engagementScore.score;
    winFactors.push(...engagementScore.factors);
    
    // 6. STRATEGIC ACCOUNT VALUE (10 points max) - Account expansion potential
    const strategicScore = this.calculateStrategicAccountScore(prospect);
    totalScore += strategicScore.score;
    scoreBreakdown['strategic'] = strategicScore.score;
    winFactors.push(...strategicScore.factors);
    
    // Generate rank placeholder (will be assigned during company ranking)
    const rank = "TBD";
    
    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(prospect, scoreBreakdown);
    
    // Determine urgency level
    const urgencyLevel = this.determineUrgencyLevel(totalScore, prospect);
    
    // Calculate best contact time
    const bestContactTime = this.calculateBestContactTime(prospect);
    
    // Calculate deal potential
    const dealPotential = Math.min(totalScore * 1.2, 100);
    
    // Generate human-readable explanation
    const humanReadableExplanation = this.generateHumanReadableExplanation(
      prospect, 
      totalScore, 
      winFactors.slice(0, 3)
    );
    
    return {
      totalScore: Math.round(totalScore),
      rank,
      confidence,
      winFactors: [humanReadableExplanation], // Human-readable explanation
      urgencyLevel,
      bestContactTime,
      dealPotential: Math.round(dealPotential)
    };
  }
  
  /**
   * Calculate relationship warmth score
   */
  private static calculateRelationshipScore(prospect: SpeedrunPerson): { score: number; factors: string[] } {
    let score = 0;
    const factors: string[] = [];
    
    const relationship = (prospect.relationship || "").toLowerCase();
    const status = (prospect.status || "").toLowerCase();
    const recentActivity = (prospect.recentActivity || "").toLowerCase();
    
    // Base relationship scoring
    if (relationship.includes("hot") || status.includes("hot")) {
      score += 25;
      factors.push("🔥 Hot relationship");
    } else if (relationship.includes("warm") || status.includes("qualified")) {
      score += 18;
      factors.push("🤝 Warm relationship");
    } else if (relationship.includes("contacted") || status.includes("contacted")) {
      score += 12;
      factors.push("📞 Previously contacted");
    } else if (relationship.includes("cold") || status.includes("new")) {
      score += 8;
      factors.push("❄️ Cold prospect");
    } else {
      score += 10; // Neutral/unknown
    }
    
    // Bonus for recent positive activity
    if (recentActivity.includes("response") || recentActivity.includes("meeting")) {
      score += 5;
      factors.push("📧 Recent engagement");
    }
    
    return { score: Math.min(score, 25), factors };
  }
  
  /**
   * Calculate decision making power score
   */
  private static calculateDecisionPowerScore(prospect: SpeedrunPerson): { score: number; factors: string[] } {
    let score = 0;
    const factors: string[] = [];
    
    const title = (prospect.title || "").toLowerCase();
    const monacoData = prospect.customFields?.monacoEnrichment;
    const buyerRole = monacoData?.buyerGroupAnalysis?.role;
    const decisionPower = monacoData?.personIntelligence?.decisionPower;
    
    // Buyer group role analysis
    if (buyerRole === "Decision Maker") {
      score += 20;
      factors.push("👑 Decision maker");
    } else if (buyerRole === "Champion") {
      score += 15;
      factors.push("⭐ Champion");
    } else if (buyerRole === "Stakeholder") {
      score += 10;
      factors.push("🤝 Key stakeholder");
    }
    
    // Title-based decision power
    if (title.includes("ceo") || title.includes("president") || title.includes("founder")) {
      score += 18;
      factors.push("🎯 C-level executive");
    } else if (title.includes("vp") || title.includes("vice president") || title.includes("director")) {
      score += 15;
      factors.push("🎯 Senior executive");
    } else if (title.includes("manager") || title.includes("head") || title.includes("lead")) {
      score += 10;
      factors.push("🎯 Management level");
    }
    
    // Monaco intelligence boost
    if (decisionPower && decisionPower > 0.7) {
      score += 5;
      factors.push("🧠 High decision authority");
    }
    
    return { score: Math.min(score, 20), factors };
  }
  
  /**
   * Calculate timing and urgency score
   */
  private static calculateTimingScore(prospect: SpeedrunPerson): { score: number; factors: string[] } {
    let score = 0;
    const factors: string[] = [];
    
    const lastContact = prospect.lastContact;
    const nextAction = (prospect.nextAction || "").toLowerCase();
    const status = (prospect.status || "").toLowerCase();
    
    // 🚨 CRITICAL: Check if prospect was contacted TODAY (should be deprioritized)
    const wasContactedToday = this.wasContactedToday(prospect);
    if (wasContactedToday) {
      score = 1; // Minimal score for prospects contacted today
      factors.push("📧 Already contacted today");
      return { score, factors };
    }
    
    // Days since last contact urgency
    if (lastContact) {
      const daysSince = this.calculateDaysSince(lastContact);
      
      if (daysSince <= 3) {
        score += 20;
        factors.push("⚡ Very recent activity");
      } else if (daysSince <= 7) {
        score += 15;
        factors.push("📅 Recent activity");
      } else if (daysSince <= 30) {
        score += 10;
        factors.push("⏰ Follow-up needed");
      } else if (daysSince <= 90) {
        score += 12; // Re-engagement opportunity
        factors.push("🔄 Re-engagement opportunity");
      } else {
        score += 8;
        factors.push("💤 Long dormant");
      }
    }
    
    // Next action urgency
    if (nextAction.includes("urgent") || nextAction.includes("asap")) {
      score += 8;
      factors.push("🚨 Urgent action needed");
    } else if (nextAction.includes("follow") || nextAction.includes("call")) {
      score += 5;
      factors.push("📞 Follow-up ready");
    }
    
    // Status-based timing
    if (status.includes("demo-scheduled") || status.includes("proposal")) {
      score += 10;
      factors.push("🎯 Active opportunity");
    }
    
    return { score: Math.min(score, 20), factors };
  }
  
  /**
   * Calculate deal value potential score using REAL CoreSignal data
   */
  private static calculateValueScore(prospect: SpeedrunPerson): { score: number; factors: string[] } {
    let score = 0;
    const factors: string[] = [];
    
    const commission = prospect.commission || "50K";
    const company = (prospect.company || "").toLowerCase();
    const title = (prospect.title || "").toLowerCase();
    const monacoData = prospect.customFields?.monacoEnrichment;
    
    // 🎯 USE REAL CORESIGNAL DATA for company intelligence
    const coresignalData = prospect.customFields?.coresignalData;
    const companySize = coresignalData?.size_range || coresignalData?.employees_count;
    const companyRevenue = coresignalData?.revenue_annual_range?.annual_revenue_range_from;
    const companyIndustry = coresignalData?.industry;
    const companyGrowth = coresignalData?.employees_count_change?.change_yearly_percentage;
    
    // Commission/deal value
    const dealValue = parseInt(commission.replace(/[^\d]/g, "")) || 50000;
    
    if (dealValue >= 200000) {
      score += 15;
      factors.push("💰 High-value opportunity");
    } else if (dealValue >= 100000) {
      score += 12;
      factors.push("💰 Significant opportunity");
    } else if (dealValue >= 50000) {
      score += 8;
      factors.push("💰 Standard opportunity");
    } else {
      score += 5;
      factors.push("💰 Entry opportunity");
    }
    
    // 🏢 REAL COMPANY SIZE from CoreSignal (not fake data!)
    if (companySize) {
      if (companySize.includes("1000+") || companySize.includes("5000+") || companySize.includes("10000+")) {
        score += 5;
        factors.push("🏢 Enterprise company (CoreSignal verified)");
      } else if (companySize.includes("500+") || companySize.includes("1000+")) {
        score += 4;
        factors.push("🏢 Large company (CoreSignal verified)");
      } else if (companySize.includes("100+") || companySize.includes("500+")) {
        score += 3;
        factors.push("🏢 Mid-market company (CoreSignal verified)");
      } else if (companySize.includes("50+") || companySize.includes("100+")) {
        score += 2;
        factors.push("🏢 Growing company (CoreSignal verified)");
      }
    }
    
    // 💰 REAL REVENUE DATA from CoreSignal
    if (companyRevenue) {
      if (companyRevenue >= 100000000) { // $100M+
        score += 4;
        factors.push("💰 High revenue company (CoreSignal verified)");
      } else if (companyRevenue >= 10000000) { // $10M+
        score += 3;
        factors.push("💰 Significant revenue (CoreSignal verified)");
      } else if (companyRevenue >= 1000000) { // $1M+
        score += 2;
        factors.push("💰 Established revenue (CoreSignal verified)");
      }
    }
    
    // 📈 REAL GROWTH DATA from CoreSignal
    if (companyGrowth && companyGrowth > 0) {
      if (companyGrowth >= 50) {
        score += 3;
        factors.push("📈 High growth company (CoreSignal verified)");
      } else if (companyGrowth >= 20) {
        score += 2;
        factors.push("📈 Growing company (CoreSignal verified)");
      } else if (companyGrowth >= 5) {
        score += 1;
        factors.push("📈 Stable growth (CoreSignal verified)");
      }
    }
    
    // 🎯 REAL INDUSTRY DATA from CoreSignal
    if (companyIndustry) {
      const highValueIndustries = ['technology', 'software', 'fintech', 'healthcare', 'finance', 'enterprise'];
      if (highValueIndustries.some(industry => companyIndustry.toLowerCase().includes(industry))) {
        score += 2;
        factors.push(`🎯 High-value industry: ${companyIndustry} (CoreSignal verified)`);
      }
    }
    
    // Fallback to basic company indicators if no CoreSignal data
    if (!coresignalData && (company.includes("enterprise") || company.includes("fortune"))) {
      score += 2;
      factors.push("🏢 Enterprise account (basic data)");
    }
    
    // Senior title value multiplier
    if (title.includes("ceo") || title.includes("vp") || title.includes("director")) {
      score += 2;
      factors.push("📈 Executive access");
    }
    
    return { score: Math.min(score, 15), factors };
  }
  
  /**
   * Calculate engagement readiness score
   */
  private static calculateEngagementScore(prospect: SpeedrunPerson): { score: number; factors: string[] } {
    let score = 0;
    const factors: string[] = [];
    
    const email = prospect.email;
    const phone = prospect.phone;
    const linkedin = prospect.linkedin;
    const bio = (prospect.bio || "").toLowerCase();
    
    // Contact completeness
    if (email && email.includes("@")) {
      score += 3;
    }
    if (phone && phone.length >= 10) {
      score += 3;
    }
    if (linkedin) {
      score += 2;
    }
    
    // Bio quality indicates engagement potential
    if (bio.length > 50) {
      score += 2;
      factors.push("📝 Detailed profile");
    }
    
    return { score: Math.min(score, 10), factors };
  }
  
  /**
   * Calculate strategic account value score using REAL CoreSignal data
   */
  private static calculateStrategicAccountScore(prospect: SpeedrunPerson): { score: number; factors: string[] } {
    let score = 0;
    const factors: string[] = [];
    
    const company = (prospect.company || "").toLowerCase();
    const interests = prospect.interests || [];
    const status = (prospect.status || "").toLowerCase();
    
    // 🎯 USE REAL CORESIGNAL DATA for strategic assessment
    const coresignalData = prospect.customFields?.coresignalData;
    const companySize = coresignalData?.size_range || coresignalData?.employees_count;
    const companyRevenue = coresignalData?.revenue_annual_range?.annual_revenue_range_from;
    const companyIndustry = coresignalData?.industry;
    const companyGrowth = coresignalData?.employees_count_change?.change_yearly_percentage;
    const fundingRounds = coresignalData?.funding_rounds;
    const jobPostings = coresignalData?.active_job_postings_count;
    
    // 🏆 EXISTING CUSTOMERS GET PRIORITY - Easier to expand than acquire new
    const isCustomer = status.includes("customer") || 
                      prospect.relationship?.toLowerCase().includes("customer") ||
                      (prospect as any).isCustomer || 
                      (prospect as any).customerStatus === 'active';
    
    if (isCustomer) {
      score += 8;
      factors.push("💰 Existing customer (expansion opportunity)");
    }
    
    // 🏢 REAL COMPANY SIZE from CoreSignal for strategic value
    if (companySize) {
      if (companySize.includes("1000+") || companySize.includes("5000+") || companySize.includes("10000+")) {
        score += 4;
        factors.push("🏢 Enterprise strategic account (CoreSignal verified)");
      } else if (companySize.includes("500+") || companySize.includes("1000+")) {
        score += 3;
        factors.push("🏢 Large strategic account (CoreSignal verified)");
      } else if (companySize.includes("100+") || companySize.includes("500+")) {
        score += 2;
        factors.push("🏢 Mid-market strategic account (CoreSignal verified)");
      }
    }
    
    // 💰 REAL REVENUE DATA from CoreSignal for strategic value
    if (companyRevenue) {
      if (companyRevenue >= 100000000) { // $100M+
        score += 3;
        factors.push("💰 High revenue strategic account (CoreSignal verified)");
      } else if (companyRevenue >= 10000000) { // $10M+
        score += 2;
        factors.push("💰 Significant revenue strategic account (CoreSignal verified)");
      }
    }
    
    // 📈 REAL GROWTH DATA from CoreSignal for expansion potential
    if (companyGrowth && companyGrowth > 0) {
      if (companyGrowth >= 50) {
        score += 3;
        factors.push("📈 High growth expansion potential (CoreSignal verified)");
      } else if (companyGrowth >= 20) {
        score += 2;
        factors.push("📈 Growing expansion potential (CoreSignal verified)");
      }
    }
    
    // 🎯 REAL INDUSTRY DATA from CoreSignal for strategic value
    if (companyIndustry) {
      const strategicIndustries = ['technology', 'software', 'fintech', 'healthcare', 'finance', 'enterprise', 'consulting'];
      if (strategicIndustries.some(industry => companyIndustry.toLowerCase().includes(industry))) {
        score += 2;
        factors.push(`🎯 Strategic industry: ${companyIndustry} (CoreSignal verified)`);
      }
    }
    
    // 💼 REAL HIRING DATA from CoreSignal for expansion potential
    if (jobPostings && jobPostings > 0) {
      if (jobPostings >= 20) {
        score += 2;
        factors.push("💼 High hiring activity (CoreSignal verified)");
      } else if (jobPostings >= 5) {
        score += 1;
        factors.push("💼 Active hiring (CoreSignal verified)");
      }
    }
    
    // 💰 REAL FUNDING DATA from CoreSignal for strategic value
    if (fundingRounds && fundingRounds.length > 0) {
      const recentFunding = fundingRounds.filter(round => {
        const fundingDate = new Date(round.announced_date);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return fundingDate > oneYearAgo;
      });
      
      if (recentFunding.length > 0) {
        score += 2;
        factors.push("💰 Recent funding activity (CoreSignal verified)");
      }
    }
    
    // Fallback to basic company indicators if no CoreSignal data
    if (!coresignalData) {
      // Target company types for account expansion
      const strategicCompanyTypes = [
        "technology", "enterprise", "fortune", "global", "corp", "inc",
        "solutions", "systems", "consulting", "services"
      ];
      
      if (strategicCompanyTypes.some(type => company.includes(type))) {
        score += 3;
        factors.push("🎯 Strategic account type (basic data)");
      }
    }
    
    // Interest alignment for expansion potential
    if (interests.some(interest => 
      interest.toLowerCase().includes("technology") || 
      interest.toLowerCase().includes("business") ||
      interest.toLowerCase().includes("strategy")
    )) {
      score += 1;
      factors.push("🔄 Expansion potential");
    }
    
    return { score: Math.min(score, 10), factors };
  }
  
  /**
   * Group prospects by company
   */
  private static groupByCompany(prospects: RankedSpeedrunPerson[]): Map<string, RankedSpeedrunPerson[]> {
    const grouped = new Map<string, RankedSpeedrunPerson[]>();
    
    prospects.forEach(prospect => {
      const company = prospect.company || "Unknown Company";
      if (!grouped.has(company)) {
        grouped.set(company, []);
      }
      grouped.get(company)!.push(prospect);
    });
    
    return grouped;
  }
  
  /**
   * Rank companies by total opportunity potential
   */
  private static rankCompaniesByOpportunity(
    prospectsByCompany: Map<string, RankedSpeedrunPerson[]>
  ): Array<[string, RankedSpeedrunPerson[]]> {
    return Array.from(prospectsByCompany.entries()).sort(([, prospectsA], [, prospectsB]) => {
      // Calculate company score as sum of top 3 prospect scores
      const scoreA = prospectsA
        .sort((a, b) => b.winningScore.totalScore - a.winningScore.totalScore)
        .slice(0, 3)
        .reduce((sum, p) => sum + p.winningScore.totalScore, 0);
      
      const scoreB = prospectsB
        .sort((a, b) => b.winningScore.totalScore - a.winningScore.totalScore)
        .slice(0, 3)
        .reduce((sum, p) => sum + p.winningScore.totalScore, 0);
      
      return scoreB - scoreA;
    });
  }
  
  /**
   * Generate final ranking with simple 1-30 numbering
   */
  private static generateCompanyBasedRanking(
    rankedCompanies: Array<[string, RankedSpeedrunPerson[]]>
  ): RankedSpeedrunPerson[] {
    const finalRanking: RankedSpeedrunPerson[] = [];
    let globalRank = 1;
    
    rankedCompanies.forEach(([company, prospects], companyIndex) => {
      // Sort prospects within company by winning score
      const sortedProspects = prospects.sort((a, b) => 
        b.winningScore.totalScore - a.winningScore.totalScore
      );
      
      // Assign simple numerical ranks: 1, 2, 3, 4, 5, etc. (up to 30)
      sortedProspects.forEach((prospect, prospectIndex) => {
        // Only assign ranks 1-30 to match daily target
        if (globalRank <= 30) {
          prospect['winningScore']['rank'] = globalRank.toString();
          finalRanking.push(prospect);
          globalRank++;
        }
      });
    });
    
    return finalRanking;
  }
  
  /**
   * 🚨 CRITICAL: Check if prospect was contacted today
   */
  private static wasContactedToday(prospect: SpeedrunPerson): boolean {
    // Use the comprehensive activity tracker
    if (TodayActivityTracker.wasContactedToday(prospect.id.toString())) {
      return true;
    }
    
    const today = new Date().toDateString();
    
    // Check if lastContact is today
    if (prospect.lastContact) {
      try {
        const lastContactDate = new Date(prospect.lastContact).toDateString();
        if (lastContactDate === today) {
          return true;
        }
      } catch {
        // Invalid date format, continue checking other signals
      }
    }
    
    // Check recent activity text for today's outreach
    const recentActivity = (prospect.recentActivity || "").toLowerCase();
    const today_indicators = [
      "emailed today",
      "contacted today", 
      "reached out today",
      "sent email today",
      new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    ];
    
    return today_indicators.some(indicator => recentActivity.includes(indicator));
  }
  
  /**
   * 🚨 Get companies that have been contacted today
   */
  private static getCompaniesContactedToday(prospects: SpeedrunPerson[]): Set<string> {
    const companiesContactedToday = new Set<string>();
    
    prospects.forEach(prospect => {
      if (this.wasContactedToday(prospect)) {
        const company = prospect.company || "Unknown Company";
        companiesContactedToday.add(company);
      }
    });
    
    return companiesContactedToday;
  }
  
  /**
   * Get today's completed leads from localStorage
   */
  private static getTodayCompletedLeads(): Set<string> {
    try {
      const today = new Date().toDateString();
      const stored = localStorage.getItem(`smartrank-completed-${today}`);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  }
  
  /**
   * Helper functions
   */
  private static calculateDaysSince(dateString: string): number {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 999; // Invalid date
    }
  }
  
  private static calculateConfidence(
    prospect: SpeedrunPerson, 
    scoreBreakdown: Record<string, number>
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on data completeness
    if (prospect.email) confidence += 0.1;
    if (prospect.phone) confidence += 0.1;
    if (prospect['title'] && prospect.title !== "Professional") confidence += 0.1;
    if (prospect.customFields?.monacoEnrichment) confidence += 0.2;
    if (Object.keys(scoreBreakdown).length >= 4) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
  
  private static determineUrgencyLevel(
    totalScore: number, 
    prospect: SpeedrunPerson
  ): "Critical" | "High" | "Medium" | "Low" {
    if (totalScore >= 80) return "Critical";
    if (totalScore >= 60) return "High";
    if (totalScore >= 40) return "Medium";
    return "Low";
  }
  
  private static calculateBestContactTime(prospect: SpeedrunPerson): string {
    // Simple logic - can be enhanced with timezone detection
    const priority = (prospect.priority || "").toLowerCase();
    
    if (priority === "high") return "9:00 AM - 10:00 AM";
    if (priority === "medium") return "2:00 PM - 3:00 PM";
    return "10:00 AM - 11:00 AM";
  }
  
  /**
   * Generate human-readable ranking explanation
   */
  private static generateHumanReadableExplanation(
    prospect: SpeedrunPerson, 
    totalScore: number, 
    topFactors: string[]
  ): string {
    const reasons = [];
    const context = [];
    
    // Determine priority level
    let priorityLevel = "Medium priority";
    if (totalScore >= 90) {
      priorityLevel = "Critical priority";
    } else if (totalScore >= 70) {
      priorityLevel = "High priority";
    }
    
    // Add context about prospect type
    const status = (prospect.status || "").toLowerCase();
    const relationship = (prospect.relationship || "").toLowerCase();
    
    if (relationship.includes("customer") || status.includes("customer")) {
      context.push("existing customer");
    } else if (relationship.includes("hot") || status.includes("hot")) {
      context.push("hot prospect");
    } else if (relationship.includes("warm") || status.includes("qualified")) {
      context.push("warm prospect");
    } else {
      context.push("prospect");
    }
    
    // Add executive level context
    const title = (prospect.title || "").toLowerCase();
    if (title.includes("ceo") || title.includes("president") || title.includes("founder")) {
      context.push("C-level executive");
    } else if (title.includes("vp") || title.includes("director")) {
      context.push("senior executive");
    }
    
    // Convert factor descriptions to human readable
    topFactors.forEach(factor => {
      const cleanFactor = factor.replace(/[🔥👑⭐📞💰🏢⚡🎯🤝❄️📧🧠🔄💤🚨📅📈]/g, '').trim();
      if (cleanFactor && cleanFactor !== 'Professional') {
        reasons.push(cleanFactor.toLowerCase());
      }
    });
    
    // Build explanation
    const contextText = context.length > 0 ? context.join(", ") : "contact";
    const reasonText = reasons.length > 0 ? reasons.slice(0, 2).join(", ") : "standard priority";
    
    return `${priorityLevel}: ${contextText}${reasons.length > 0 ? ', ' + reasonText : ''}`;
  }
}
