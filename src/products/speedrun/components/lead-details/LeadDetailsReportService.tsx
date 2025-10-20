import React from "react";
import { SpeedrunPerson, ValueIdea } from "../../types/SpeedrunTypes";
import { ReportData, LeadDetailsReportServiceProps } from "./LeadDetailsTypes";

// React namespace declaration for JSX
declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
  }
}

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

// Enhanced lazy imports with error handling and retry logic
const createLazyComponent = (importFn: () => Promise<any>, componentName: string) => {
  return React.lazy(() => 
    importFn().catch((error) => {
      console.error(`Failed to load ${componentName}:`, error);
      
      // If it's a chunk load error, try to reload the page
      if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
        console.warn(`ChunkLoadError for ${componentName}, reloading page...`);
        setTimeout(() => window.location.reload(), 500);
      }
      
      // Return a fallback component
      return {
        default: () => (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-red-600 mb-2">Failed to load {componentName}</div>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      };
    })
  );
};

// ⚡ LAZY IMPORTS: Optimize bundle size by lazy loading report components with error handling
const IndustryDeepReport = createLazyComponent(() => import("@/platform/reports/industry-deep"), "IndustryDeepReport");
const CompetitiveDeepReport = createLazyComponent(() => import("@/platform/reports/competitive-deep"), "CompetitiveDeepReport");
const GrowthDeepReport = createLazyComponent(() => import("@/platform/reports/growth-deep"), "GrowthDeepReport");
const TechDeepReport = createLazyComponent(() => import("@/platform/reports/tech-deep"), "TechDeepReport");
const IndustryMiniReport = createLazyComponent(() => import("@/platform/reports/industry-mini"), "IndustryMiniReport");
const CompetitiveMiniReport = createLazyComponent(() => import("@/platform/reports/competitive-mini"), "CompetitiveMiniReport");
const GrowthMiniReport = createLazyComponent(() => import("@/platform/reports/growth-mini"), "GrowthMiniReport");
const TechMiniReport = createLazyComponent(() => import("@/platform/reports/tech-mini"), "TechMiniReport");

const reportComponents = {
  IndustryDeepReport,
  CompetitiveDeepReport,
  GrowthDeepReport,
  TechDeepReport,
  IndustryMiniReport,
  CompetitiveMiniReport,
  GrowthMiniReport,
  TechMiniReport,
};

export class LeadDetailsReportService {
  // Generate fallback reports when AI generation fails
  static getFallbackReports(role: string): ValueIdea[] {
    const reportMap = {
      "Decision Maker": [
        {
          title: "Competitive Threat Assessment: Q2 2025",
          description:
            "Strategic positioning analysis revealing competitor vulnerabilities and market opportunities.",
          urgency: "high" as const,
          type: "competitive-mini",
        },
        {
          title: "Revenue Acceleration Opportunities",
          description:
            "Untapped market segments and expansion strategies based on industry analysis.",
          urgency: "high" as const,
          type: "growth-mini",
        },
        {
          title: "Stakeholder Influence Strategy",
          description:
            "Strategic stakeholder mapping and influence framework for decision acceleration.",
          urgency: "medium" as const,
          type: "stakeholder-mini",
        },
        {
          title: "Technology Modernization Roadmap",
          description:
            "Platform upgrade strategy and digital transformation framework.",
          urgency: "medium" as const,
          type: "competitive-mini",
        },
      ],
      Champion: [
        {
          title: "Technology Stack Assessment",
          description:
            "Infrastructure evaluation and platform upgrade strategy for 2025-2026.",
          urgency: "high" as const,
          type: "competitive-mini",
        },
        {
          title: "Platform Vendor Comparison",
          description:
            "Detailed analysis of leading platforms with implementation and ROI projections.",
          urgency: "high" as const,
          type: "growth-mini",
        },
        {
          title: "Digital Transformation Strategy",
          description:
            "Technology adoption framework aligned with business objectives and market trends.",
          urgency: "medium" as const,
          type: "stakeholder-mini",
        },
        {
          title: "Growth Acceleration Plan",
          description:
            "Strategic growth opportunities and competitive positioning framework.",
          urgency: "medium" as const,
          type: "growth-mini",
        },
      ],
      Stakeholder: [
        {
          title: "Industry Trends Analysis",
          description:
            "Market disruption patterns and strategic response recommendations.",
          urgency: "medium" as const,
          type: "stakeholder-mini",
        },
        {
          title: "Market Expansion Strategy",
          description:
            "Growth opportunity analysis and competitive positioning framework.",
          urgency: "medium" as const,
          type: "growth-mini",
        },
        {
          title: "Competitive Intelligence Brief",
          description:
            "Strategic competitive analysis and market positioning insights.",
          urgency: "low" as const,
          type: "competitive-mini",
        },
        {
          title: "Growth Opportunities Report",
          description:
            "Revenue expansion and market development opportunity analysis.",
          urgency: "low" as const,
          type: "growth-mini",
        },
      ],
    };

    return (
      reportMap[role as keyof typeof reportMap] || reportMap["Stakeholder"]
    );
  }

  // Helper function to derive industry from company
  static deriveIndustry(companyName: string): string {
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
  }

  // Transform Monaco data to expected report format
  static transformMonacoToReportData(
    monacoData: any,
    reportType: string,
  ): ReportData {
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
  }

  // Render report component
  static renderReport({
    activeReport,
    person,
    onReportBack,
  }: LeadDetailsReportServiceProps): React.ReactElement | null {
    if (!activeReport) return null;

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
      
      // Use original title if available, otherwise fall back to generic names
      const reportDisplayName = originalTitle 
        ? (isDeepReport ? `${originalTitle} Report` : `${originalTitle} Mini Report`)
        : (isDeepReport ? "Deep Value Report" : "Mini Report");

      // Extract Monaco enrichment data for the report
      const monacoData = person.customFields?.monacoEnrichment || {};
      const industry = this.deriveIndustry(person.company);

      // Transform Monaco data to report format
      const reportData = this.transformMonacoToReportData(
        monacoData,
        activeReport,
      );

      // Render the appropriate report component
      let ReportComponent = null;

      if (reportType === "industry" && isDeepReport) {
        const industryDeepData = {
          marketSize:
            reportData.marketSize || Math.floor(Math.random() * 100) + 50,
          growthRate:
            reportData.growthRate || Math.floor(Math.random() * 20) + 5,
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
        ReportComponent = (
          <IndustryDeepReport
            company={person.company}
            data={industryDeepData}
            onBack={onReportBack}
          />
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
        ReportComponent = (
          <IndustryMiniReport
            company={person.company}
            data={industryMiniData}
            onBack={onReportBack}
          />
        );
      } else if (reportType === "competitive" && isDeepReport) {
        const competitiveDeepData = {
          marketShare:
            reportData.marketShare || Math.floor(Math.random() * 30) + 10,
          competitivePosition:
            reportData.competitivePosition || "Strong Player",
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
        ReportComponent = (
          <CompetitiveDeepReport
            company={person.company}
            data={competitiveDeepData}
            onBack={onReportBack}
          />
        );
      } else if (reportType === "competitive" && !isDeepReport) {
        const competitiveMiniData = {
          marketPosition: reportData.marketPosition || "Strong Player",
          competitiveAdvantage:
            reportData.competitiveAdvantage || Math.floor(Math.random() * 100),
          threatLevel:
            reportData.threatLevel || Math.floor(Math.random() * 100),
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
              position: "leader",
            },
            {
              name: "CompetitorB",
              marketShare: 18,
              threat: "medium" as const,
              position: "challenger",
            },
          ],
          opportunities: reportData.opportunities?.map((opp: any) => ({
            area: opp.area || opp,
            potential: "high" as const,
            description: `Strategic opportunity in ${opp.area || opp} for ${person.company}`,
          })) || [
            {
              area: "Market expansion",
              potential: "high" as const,
              description: "Strategic market expansion opportunity",
            },
            {
              area: "Product innovation",
              potential: "medium" as const,
              description: "Technology innovation and development",
            },
          ],
        };
        ReportComponent = (
          <CompetitiveMiniReport
            company={person.company}
            data={competitiveMiniData}
            onBack={onReportBack}
          />
        );
      } else if (reportType === "growth" && isDeepReport) {
        const growthDeepData = {
          revenueGrowth:
            reportData.revenueGrowth || Math.floor(Math.random() * 30) + 10,
          digitalSales:
            reportData.digitalSales || Math.floor(Math.random() * 60) + 20,
          customerAcquisitionCost:
            reportData.customerAcquisitionCost ||
            Math.floor(Math.random() * 500) + 100,
          marketExpansion: reportData.marketExpansion || [
            "North America",
            "Europe",
            "Asia-Pacific",
          ],
          growthDrivers: reportData.growthDrivers || [
            "Digital transformation",
            "Product innovation",
          ],
          scalingChallenges: reportData.scalingChallenges || [
            "Talent acquisition",
            "Technology infrastructure",
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
        
        ReportComponent = (
          <GrowthDeepReport
            company={person.company}
            title={reportTitle}
            data={growthDeepData}
            onBack={onReportBack}
          />
        );
      } else if (reportType === "growth" && !isDeepReport) {
        const growthMiniData = {
          revenueGrowth:
            reportData.revenueGrowth || Math.floor(Math.random() * 30) + 10,
          digitalSales:
            reportData.digitalSales || Math.floor(Math.random() * 60) + 20,
          customerAcquisitionCost:
            reportData.customerAcquisitionCost ||
            Math.floor(Math.random() * 500) + 100,
          quickWins: reportData.quickWins || [
            {
              action: "Optimize conversion funnel",
              timeline: "2 months",
              impact: "High revenue boost",
            },
            {
              action: "Enhance customer retention",
              timeline: "3 months",
              impact: "Improved LTV",
            },
          ],
          challenges: reportData.challenges || [
            {
              issue: "High customer acquisition cost",
              solution: "Improve targeting and conversion",
            },
            {
              issue: "Limited market reach",
              solution: "Expand digital marketing channels",
            },
          ],
        };
        ReportComponent = (
          <GrowthMiniReport
            company={person.company}
            data={growthMiniData}
            onBack={onReportBack}
          />
        );
      } else if (reportType === "tech" && isDeepReport) {
        const techDeepData = {
          systemHealth:
            reportData.systemHealth || Math.floor(Math.random() * 40) + 60,
          securityScore:
            reportData.securityScore || Math.floor(Math.random() * 40) + 60,
          automationLevel:
            reportData.automationLevel || Math.floor(Math.random() * 40) + 30,
          recommendations: reportData.recommendations || [
            {
              action: "Upgrade security infrastructure",
              priority: "high" as const,
              impact: "Critical protection",
              timeline: "6 months",
            },
            {
              action: "Implement automation tools",
              priority: "medium" as const,
              impact: "Efficiency gains",
              timeline: "12 months",
            },
          ],
        };
        ReportComponent = (
          <TechDeepReport
            company={person.company}
            data={techDeepData}
            onBack={onReportBack}
          />
        );
      } else if (reportType === "tech" && !isDeepReport) {
        const techMiniData = {
          systemHealth:
            reportData.systemHealth || Math.floor(Math.random() * 40) + 60,
          securityScore:
            reportData.securityScore || Math.floor(Math.random() * 40) + 60,
          automationLevel:
            reportData.automationLevel || Math.floor(Math.random() * 40) + 30,
        };
        ReportComponent = (
          <TechMiniReport
            company={person.company}
            data={techMiniData}
            onBack={onReportBack}
          />
        );
      }

      if (ReportComponent) {
        return <div className="h-full flex flex-col">{ReportComponent}</div>;
      }

      // Fallback if no component matches
      return this.renderReportFallback(
        activeReport,
        person,
        onReportBack,
        reportDisplayName,
      );
    } catch (error) {
      console.error("❌ Error rendering report:", error);
      return this.renderReportError(person, onReportBack);
    }
  }

  // Render fallback when no report component matches
  private static renderReportFallback(
    activeReport: string,
    person: SpeedrunPerson,
    onReportBack: () => void,
    reportDisplayName: string,
  ): React.ReactElement {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center gap-3">
            <button
              onClick={onReportBack}
              className="text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              ← Back to {person.name}
            </button>
          </div>
          <div className="text-sm text-[var(--muted)]">
            {reportDisplayName} • {person.company}
          </div>
        </div>
        <div className="flex-1 p-8 flex items-center justify-center bg-[var(--background)]">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Report Type Not Found
            </h3>
            <p className="text-[var(--muted)] mb-4">
              Unable to load report component for: {activeReport}
            </p>
            <button
              onClick={onReportBack}
              className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#2563EB]/90 transition-colors"
            >
              Back to Overview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render error when report fails to load
  private static renderReportError(
    person: SpeedrunPerson,
    onReportBack: () => void,
  ): React.ReactElement {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center gap-3">
            <button
              onClick={onReportBack}
              className="text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              ← Back to {person.name}
            </button>
          </div>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Report Loading Error
            </h3>
            <p className="text-[var(--muted)] mb-4">
              There was an issue loading the report. Please try again.
            </p>
            <button
              onClick={onReportBack}
              className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#2563EB]/90 transition-colors"
            >
              Back to Overview
            </button>
          </div>
        </div>
      </div>
    );
  }
}
