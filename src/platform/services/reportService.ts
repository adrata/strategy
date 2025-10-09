/**
 * Report Service
 * Fetches AI-generated reports from enrichment pipeline
 */

import { canUseAPI } from "../platform-detection";
import { safeApiFetch } from "@/platform/api-fetch";

export interface AIReport {
  id: string;
  companyId: string;
  companyName: string;
  reportType:
    | "industry-mini"
    | "industry-deep"
    | "competitive-mini"
    | "competitive-deep"
    | "growth-mini"
    | "growth-deep"
    | "tech-mini"
    | "tech-deep";
  title: string;
  content: any;
  generatedAt: string;
  confidence: number;
}

class ReportService {
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getReportsForCompany(
    companyName: string,
  ): Promise<Record<string, any>> {
    const cacheKey = `company-reports-${companyName}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    // FOLLOW ESTABLISHED PATTERN: Check if API calls are allowed
    if (canUseAPI()) {
      try {
        // Try to fetch from enrichment API (only in web mode)
        const response = await safeApiFetch(
          "/api/enrichment/reports",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyName }),
          },
          {
            success: false,
            report: null,
            fallbackUsed: true,
          },
        );

        if (response.success) {
          const reports = response;

          // Cache the results
          this.cache.set(cacheKey, {
            data: reports,
            timestamp: Date.now(),
          });

          return reports;
        }
      } catch (error) {
        console.warn("Failed to fetch AI reports, using fallback data:", error);
      }
    }

    // ALWAYS use fallback data for desktop or when API fails
    const fallbackData = this.generateFallbackReports(companyName);

    // Cache fallback data too
    this.cache.set(cacheKey, {
      data: fallbackData,
      timestamp: Date.now(),
    });

    return fallbackData;
  }

  private generateFallbackReports(companyName: string): Record<string, any> {
    return {
      "industry-mini": {
        digitalMaturity: Math.floor(Math.random() * 30) + 70,
        competitivePressure: Math.floor(Math.random() * 3) + 7,
        innovationIndex: Math.floor(Math.random() * 3) + 8,
        trends: [
          {
            trend: "AI-powered automation",
            impact: "high",
            description: "Transforming operational efficiency",
          },
          {
            trend: "Cloud-first infrastructure",
            impact: "high",
            description: "Enabling scalability and flexibility",
          },
          {
            trend: "Data-driven decision making",
            impact: "medium",
            description: "Improving strategic insights",
          },
          {
            trend: "Remote work technology",
            impact: "medium",
            description: "Supporting distributed teams",
          },
          {
            trend: "Cybersecurity enhancement",
            impact: "high",
            description: "Protecting digital assets",
          },
        ],
        recommendations: [
          {
            action: "Implement AI automation pilot",
            priority: "high",
            timeline: "3-6 months",
          },
          {
            action: "Accelerate cloud migration",
            priority: "high",
            timeline: "6-12 months",
          },
          {
            action: "Enhance data analytics capabilities",
            priority: "medium",
            timeline: "9-18 months",
          },
        ],
      },
      "industry-deep": {
        marketSize: Math.floor(Math.random() * 500) + 100,
        growthRate: Math.floor(Math.random() * 10) + 15,
        trends: [
          "Digital transformation acceleration",
          "AI and machine learning adoption",
          "Cloud infrastructure migration",
          "Cybersecurity investment surge",
          "Remote work technology integration",
          "Data privacy regulatory compliance",
          "Sustainable technology practices",
          "Edge computing deployment",
          "API-first architecture",
          "Microservices adoption",
        ],
        competitors: [
          {
            name: "Market Leader A",
            marketShare: 25,
            strengths: ["Brand recognition", "Technology"],
            weaknesses: ["High cost", "Slow innovation"],
          },
          {
            name: "Challenger B",
            marketShare: 18,
            strengths: ["Innovation", "Agility"],
            weaknesses: ["Limited resources", "Market reach"],
          },
          {
            name: "Established C",
            marketShare: 15,
            strengths: ["Customer base", "Stability"],
            weaknesses: ["Legacy systems", "Slow adaptation"],
          },
        ],
        technologyTrends: [
          "AI/ML integration",
          "Cloud-native solutions",
          "Security automation",
        ],
        regulatoryChallenges: [
          "Data privacy laws",
          "Industry compliance",
          "Cross-border regulations",
        ],
        futureOpportunities: [
          "Emerging markets",
          "New technology adoption",
          "Strategic partnerships",
        ],
      },
      "competitive-mini": {
        marketPosition: "Strong mid-market player with growth potential",
        competitors: [
          {
            name: "Industry Leader",
            threat: "high",
            advantages: ["Market share", "Brand"],
            weaknesses: ["High cost", "Slow innovation"],
          },
          {
            name: "Agile Competitor",
            threat: "medium",
            advantages: ["Innovation", "Speed"],
            weaknesses: ["Limited reach", "Resources"],
          },
          {
            name: "Traditional Player",
            threat: "low",
            advantages: ["Stability", "Relationships"],
            weaknesses: ["Legacy tech", "Adaptation"],
          },
        ],
        competitiveAdvantages: [
          "Innovative technology",
          "Customer focus",
          "Agile delivery",
        ],
        threats: [
          "Price competition",
          "Market consolidation",
          "Technology disruption",
        ],
        recommendations: [
          "Strengthen differentiation",
          "Expand market reach",
          "Accelerate innovation",
        ],
      },
      "tech-mini": {
        systemHealth: Math.floor(Math.random() * 20) + 75,
        securityScore: Math.floor(Math.random() * 3) + 7,
        automationLevel: Math.floor(Math.random() * 40) + 40,
        techStack: [
          "Cloud infrastructure",
          "Modern APIs",
          "Data analytics",
          "Security tools",
        ],
        modernizationAreas: [
          "Legacy system replacement",
          "Process automation",
          "Data integration",
        ],
        recommendations: [
          {
            area: "Security enhancement",
            priority: "high",
            timeline: "1-3 months",
            impact: "Critical risk reduction",
          },
          {
            area: "Automation implementation",
            priority: "high",
            timeline: "3-6 months",
            impact: "Efficiency gains",
          },
          {
            area: "Infrastructure modernization",
            priority: "medium",
            timeline: "6-12 months",
            impact: "Scalability improvement",
          },
        ],
      },
      "growth-mini": {
        growthPotential: Math.floor(Math.random() * 30) + 70,
        marketExpansion: [
          "Geographic expansion",
          "New market segments",
          "Digital channels",
        ],
        productOpportunities: [
          "Product line extension",
          "Service offerings",
          "Technology integration",
        ],
        partnerships: [
          "Technology partners",
          "Channel partners",
          "Strategic alliances",
        ],
        timeline: [
          {
            phase: "Foundation",
            duration: "3 months",
            milestones: ["Market research", "Strategy development"],
          },
          {
            phase: "Implementation",
            duration: "6 months",
            milestones: ["Product development", "Partnership formation"],
          },
          {
            phase: "Scale",
            duration: "12 months",
            milestones: ["Market entry", "Growth acceleration"],
          },
        ],
        recommendations: [
          "Focus on core strengths",
          "Invest in technology",
          "Build strategic partnerships",
        ],
      },
    };
  }

  async getReportData(reportType: string, companyName: string): Promise<any> {
    const reports = await this.getReportsForCompany(companyName);
    return (
      reports[reportType] ||
      this.generateFallbackReports(companyName)[reportType]
    );
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const reportService = new ReportService();
