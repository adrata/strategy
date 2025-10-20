import React from "react";
import { SpeedrunPerson } from "../types/SpeedrunTypes";

// Error boundary for lazy-loaded components
class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyLoadErrorBoundary caught error:', error, errorInfo);
    
    // Check if it's a ChunkLoadError
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      console.warn('ChunkLoadError detected, attempting page reload...');
      // Auto-reload on chunk load errors
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-600 mb-2">Failed to load report component</div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Import report components - ensuring we use the aos versions
import IndustryDeepReport from "../../reports/industry-deep";
import CompetitiveDeepReport from "../../reports/competitive-deep";
import GrowthDeepReport from "../../reports/growth-deep";
import TechDeepReport from "../../reports/tech-deep";
import IndustryMiniReport from "../../reports/industry-mini";
import CompetitiveMiniReport from "../../reports/competitive-mini";
import GrowthMiniReport from "../../reports/growth-mini";
import TechMiniReport from "../../reports/tech-mini";

interface SpeedrunLeadDetailsReportRendererProps {
  person: SpeedrunPerson;
  activeReport: string;
  onReportBack: () => void;
}

export function SpeedrunLeadDetailsReportRenderer({
  person,
  activeReport,
  onReportBack,
}: SpeedrunLeadDetailsReportRendererProps) {
  if (!activeReport) return null;

  // Helper function to derive industry from company
  const deriveIndustry = (companyName: string): string => {
    const industryMap: { [key: string]: string } = {
      Airtable: "Business Software",
      Twilio: "Communications Technology",
      Snyk: "Security Technology",
      Stripe: "Financial Technology",
      Shopify: "E-commerce",
      Zoom: "Communications Technology",
      Slack: "Business Software",
      Asana: "Project Management",
      Dropbox: "Cloud Storage",
      GitHub: "Developer Tools",
    };
    return industryMap[companyName] || "Technology";
  };

  // Transform Monaco data to expected report format
  const transformMonacoToReportData = (monacoData: any, reportType: string) => {
    const intelligence = monacoData?.intelligence || {};
    const company = monacoData?.companyInformation || {};

    switch (reportType) {
      case "industry-deep":
        return {
          marketSize: intelligence?.marketSize || 0,
          growthRate: intelligence?.growthRate || 0,
          competitors: intelligence?.competitors || [],
          trends: intelligence?.trends || [],
        };

      case "industry-mini":
        return {
          digitalMaturity: intelligence?.digitalMaturity || 0,
          competitivePressure: intelligence?.competitivePressure || 0,
          innovationIndex: intelligence?.innovationIndex || 0,
          trends: (intelligence?.trends || []).map((trend: string) => ({
            trend,
            impact: "medium" as const,
            description: `${trend} creating opportunities for ${company.name}`,
          })),
          recommendations: intelligence?.recommendations || [],
        };

      case "competitive-deep":
        return {
          marketPosition: intelligence?.marketPosition || "Unknown",
          competitiveAdvantage: intelligence?.competitiveAdvantage || 0,
          threatLevel: intelligence?.threatLevel || 0,
          competitors: intelligence?.competitors || [],
          opportunities: intelligence?.opportunities || [],
        };

      case "competitive-mini":
        return {
          marketShare: intelligence?.marketShare || 0,
          competitivePosition: intelligence?.competitivePosition || "Unknown",
          customerSatisfaction: intelligence?.customerSatisfaction || 0,
          threats: intelligence?.threats || [],
          opportunities: intelligence?.opportunities || [],
          swotAnalysis: intelligence?.swotAnalysis || {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: [],
          },
        };

      case "growth-deep":
        return {
          revenueGrowth: intelligence?.revenueGrowth || 0,
          digitalSales: intelligence?.digitalSales || 0,
          customerAcquisitionCost: intelligence?.customerAcquisitionCost || 0,
          marketExpansion: intelligence?.marketExpansion || [],
          growthDrivers: intelligence?.growthDrivers || [],
          scalingChallenges: intelligence?.scalingChallenges || [],
        };

      case "growth-mini":
        return {
          revenueGrowth: intelligence?.revenueGrowth || 0,
          digitalSales: intelligence?.digitalSales || 0,
          customerAcquisitionCost: intelligence?.customerAcquisitionCost || 0,
          quickWins: intelligence?.quickWins || [],
          challenges: intelligence?.challenges || [],
        };

      case "tech-deep":
        return {
          systemHealth: intelligence?.systemHealth || 0,
          securityScore: intelligence?.securityScore || 0,
          automationLevel: intelligence?.automationLevel || 0,
          recommendations: intelligence?.recommendations || [],
        };

      case "tech-mini":
        return {
          systemHealth: intelligence?.systemHealth || 0,
          securityScore: intelligence?.securityScore || 0,
          automationLevel: intelligence?.automationLevel || 0,
        };

      default:
        return {};
    }
  };

  try {
    // Extract original title if present in new format: "Title|type-variant"
    const [originalTitle, reportTypeAndVariant] = activeReport.includes('|') 
      ? activeReport.split('|') 
      : [null, activeReport];
    
    const reportString = reportTypeAndVariant || activeReport;
    
    const reportType =
      reportString.includes("industry") ||
      reportString.includes("market-intelligence")
        ? "industry"
        : reportString.includes("competitive") ||
            reportString.includes("competitive-analysis")
          ? "competitive"
          : reportString.includes("growth") ||
              reportString.includes("growth-opportunities")
            ? "growth"
            : reportString.includes("tech") ||
                reportString.includes("technology-audit") ||
                reportString.includes("innovation-roadmap")
              ? "tech"
              : "competitive";

    const isDeepReport = activeReport.includes("deep");
    const industry = deriveIndustry(person.company);
    
    // Use original title for report display name if available
    const reportDisplayName = originalTitle 
      ? (isDeepReport ? `${originalTitle} Report` : `${originalTitle} Mini Report`)
      : (isDeepReport ? "Deep Value Report" : "Mini Report");

    // Extract Monaco enrichment data for the report
    const monacoData = person.customFields?.monacoEnrichment || {};

    // Transform Monaco data to report format
    const reportData = transformMonacoToReportData(monacoData, activeReport);

    // Render the appropriate report component
    if (reportType === "industry" && isDeepReport) {
      const industryDeepData = {
        marketSize:
          reportData.marketSize || Math.floor(Math.random() * 100) + 50,
        growthRate: reportData.growthRate || Math.floor(Math.random() * 20) + 5,
        competitors: reportData.competitors?.length
          ? reportData.competitors
          : [
              { name: "CompetitorA", marketShare: 25 },
              { name: "CompetitorB", marketShare: 18 },
            ],
        trends: reportData.trends?.length
          ? reportData.trends
          : [
              "Digital transformation acceleration",
              "AI-powered automation",
              "Cloud-first architecture",
            ],
      };
      return (
        <LazyLoadErrorBoundary>
          <IndustryDeepReport
            company={person.company}
            title={originalTitle}
            data={industryDeepData}
            onBack={onReportBack}
          />
        </LazyLoadErrorBoundary>
      );
    } else if (reportType === "industry" && !isDeepReport) {
      const industryMiniData = {
        digitalMaturity:
          reportData.digitalMaturity || Math.floor(Math.random() * 100),
        competitivePressure:
          reportData.competitivePressure || Math.floor(Math.random() * 100),
        innovationIndex:
          reportData.innovationIndex || Math.floor(Math.random() * 100),
        trends: reportData.trends?.map((trend: string) => ({
          trend,
          impact: "medium" as const,
          description: `${trend} creating opportunities for ${person.company}`,
        })) || [
          {
            trend: "Digital transformation",
            impact: "high" as const,
            description: "Major opportunity",
          },
          {
            trend: "AI adoption",
            impact: "medium" as const,
            description: "Growing trend",
          },
        ],
        recommendations: reportData.recommendations || [
          {
            action: "Modernize technology stack",
            priority: "high" as const,
            timeline: "6 months",
          },
          {
            action: "Enhance digital capabilities",
            priority: "medium" as const,
            timeline: "12 months",
          },
        ],
      };
      return (
        <LazyLoadErrorBoundary>
          <IndustryMiniReport
            company={person.company}
            data={industryMiniData}
            onBack={onReportBack}
          />
        </LazyLoadErrorBoundary>
      );
    } else if (reportType === "competitive" && isDeepReport) {
      const competitiveDeepData = {
        marketShare:
          reportData.marketShare || Math.floor(Math.random() * 30) + 10,
        competitivePosition: reportData.competitivePosition || "Strong Player",
        customerSatisfaction:
          reportData.customerSatisfaction ||
          Math.floor(Math.random() * 40) + 60,
        threats: reportData.threats || [
          "New market entrants",
          "Price competition",
        ],
        opportunities: reportData.opportunities || [
          "Market expansion",
          "Product innovation",
        ],
        swotAnalysis: reportData.swotAnalysis || {
          strengths: ["Technology leadership", "Customer relationships"],
          weaknesses: ["Market reach", "Brand awareness"],
          opportunities: ["Market expansion", "Product innovation"],
          threats: ["New entrants", "Economic downturn"],
        },
      };
      return (
        <LazyLoadErrorBoundary>
          <CompetitiveDeepReport
            company={person.company}
            data={competitiveDeepData}
            onBack={onReportBack}
          />
        </LazyLoadErrorBoundary>
      );
    } else if (reportType === "competitive" && !isDeepReport) {
      const competitiveMiniData = {
        marketPosition: reportData.marketPosition || "Strong Player",
        competitiveAdvantage:
          reportData.competitiveAdvantage || Math.floor(Math.random() * 100),
        threatLevel: reportData.threatLevel || Math.floor(Math.random() * 100),
        competitors: reportData.competitors?.map((comp: any) => ({
          name: comp.name,
          marketShare: comp.marketShare || 20,
          threat: "medium" as const,
          position: "challenger",
        })) || [
          {
            name: "CompetitorA",
            marketShare: 25,
            threat: "high" as const,
            position: "challenger",
          },
          {
            name: "CompetitorB",
            marketShare: 18,
            threat: "medium" as const,
            position: "niche",
          },
        ],
        opportunities: reportData.opportunities || [
          "Market expansion",
          "Product innovation",
        ],
      };
      return (
        <LazyLoadErrorBoundary>
          <CompetitiveMiniReport
            company={person.company}
            data={competitiveMiniData}
            onBack={onReportBack}
          />
        </LazyLoadErrorBoundary>
      );
    } else if (reportType === "growth" && isDeepReport) {
      const growthDeepData = {
        revenueGrowth:
          reportData.revenueGrowth || Math.floor(Math.random() * 30) + 10,
        digitalSales:
          reportData.digitalSales || Math.floor(Math.random() * 50) + 30,
        customerAcquisitionCost:
          reportData.customerAcquisitionCost ||
          Math.floor(Math.random() * 500) + 200,
        marketExpansion: reportData.marketExpansion || [
          "North America",
          "Europe",
        ],
        growthDrivers: reportData.growthDrivers || [
          "Product innovation",
          "Market expansion",
        ],
        scalingChallenges: reportData.scalingChallenges || [
          "Talent acquisition",
          "Infrastructure",
        ],
      };
      // Use the original title from the new format, or create a meaningful title
      let reportTitle = originalTitle;
      if (!reportTitle) {
        // Fallback logic for old format
        if (activeReport.includes("Revenue Acceleration")) {
          reportTitle = "Revenue Acceleration Opportunities";
        } else if (activeReport.includes("Growth Acceleration")) {
          reportTitle = "Growth Acceleration Plan";
        } else if (activeReport.includes("Growth Opportunities")) {
          reportTitle = "Growth Opportunities Report";
        } else if (activeReport.includes("Technology Modernization")) {
          reportTitle = "Technology Modernization Roadmap";
        } else {
          reportTitle = "Growth Deep Value Report";
        }
      }
      
      return (
        <LazyLoadErrorBoundary>
          <GrowthDeepReport
            company={person.company}
            title={reportTitle}
            data={growthDeepData}
            onBack={onReportBack}
          />
        </LazyLoadErrorBoundary>
      );
    } else if (reportType === "growth" && !isDeepReport) {
      const growthMiniData = {
        revenueGrowth:
          reportData.revenueGrowth || Math.floor(Math.random() * 30) + 10,
        digitalSales:
          reportData.digitalSales || Math.floor(Math.random() * 50) + 30,
        customerAcquisitionCost:
          reportData.customerAcquisitionCost ||
          Math.floor(Math.random() * 500) + 200,
        quickWins: reportData.quickWins || [
          "Product optimization",
          "Process automation",
        ],
        challenges: reportData.challenges || [
          "Market competition",
          "Resource constraints",
        ],
      };
      return (
        <LazyLoadErrorBoundary>
          <GrowthMiniReport
            company={person.company}
            data={growthMiniData}
            onBack={onReportBack}
          />
        </LazyLoadErrorBoundary>
      );
    } else if (reportType === "tech" && isDeepReport) {
      const techDeepData = {
        systemHealth:
          reportData.systemHealth || Math.floor(Math.random() * 30) + 70,
        securityScore:
          reportData.securityScore || Math.floor(Math.random() * 30) + 70,
        automationLevel:
          reportData.automationLevel || Math.floor(Math.random() * 40) + 60,
        recommendations: reportData.recommendations || [
          "Upgrade security systems",
          "Implement automation",
        ],
      };
      return (
        <LazyLoadErrorBoundary>
          <TechDeepReport
            company={person.company}
            data={techDeepData}
            onBack={onReportBack}
          />
        </LazyLoadErrorBoundary>
      );
    } else if (reportType === "tech" && !isDeepReport) {
      const techMiniData = {
        systemHealth:
          reportData.systemHealth || Math.floor(Math.random() * 30) + 70,
        securityScore:
          reportData.securityScore || Math.floor(Math.random() * 30) + 70,
        automationLevel:
          reportData.automationLevel || Math.floor(Math.random() * 40) + 60,
      };
      return (
        <LazyLoadErrorBoundary>
          <TechMiniReport
            company={person.company}
            data={techMiniData}
            onBack={onReportBack}
          />
        </LazyLoadErrorBoundary>
      );
    }
  } catch (error) {
    console.error("Error rendering report:", error);
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Error loading report. Please try again.</p>
        <button
          onClick={onReportBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Lead Details
        </button>
      </div>
    );
  }

  return null;
}
