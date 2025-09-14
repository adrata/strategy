/**
 * 🎭 DEMO SCRIPTING SERVICE
 * Smart seeding technology for seamless seller demos
 * Supports role-based demo types with comprehensive data
 */

export interface DemoType {
  id: string;
  name: string;
  description: string;
  icon: string;
  roles: DemoRole[];
  industries: string[];
  demoData: DemoDataSet;
  targetAudience: string;
  demoFlow: DemoStep[];
  winningPoints: string[];
}

export interface DemoRole {
  id: string;
  name: string;
  title: string;
  email: string;
  password: string;
  permissions: string[];
  personalizedData: any;
  demoScript: DemoScript;
}

export interface DemoScript {
  intro: string;
  keyTalkingPoints: string[];
  demoFlow: string[];
  closingPoints: string[];
  objectionHandlers: Record<string, string>;
}

export interface DemoDataSet {
  companies: any[];
  leads: any[];
  opportunities: any[];
  conversations: any[];
  reports: any[];
  integrations: any[];
}

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  duration: number; // minutes
  keyActions: string[];
  expectedOutcome: string;
}

// DEMO TYPES CONFIGURATION
export const DEMO_TYPES: Record<string, DemoType> = {
  "enterprise-sales": {
    id: "enterprise-sales",
    name: "Enterprise Sales Excellence",
    description: "Fortune 500 account intelligence with AI-powered insights",
    icon: "🏢",
    industries: ["Technology", "Finance", "Healthcare", "Manufacturing"],
    targetAudience: "Enterprise Sales Teams, CROs, Sales Directors",
    roles: [
      {
        id: "enterprise-ae",
        name: "Sarah Williams",
        title: "Enterprise Account Executive",
        email: "sarah@demo.adrata.com",
        password: process.env.DEMO_ENTERPRISE_PASSWORD || "demo-enterprise-2024",
        permissions: [
          "full-platform",
          "advanced-intelligence",
          "enterprise-features",
        ],
        personalizedData: {
          territory: "West Coast Enterprise",
          quota: "$2.5M",
          currentPipeline: "$8.7M",
          avgDealSize: "$450K",
          preferredApps: ["monaco", "Speedrun", "pipeline"],
        },
        demoScript: {
          intro:
            "I'm Sarah, an Enterprise AE managing Fortune 500 accounts. Let me show you how Adrata helps me exceed my $2.5M quota consistently.",
          keyTalkingPoints: [
            "AI-powered account intelligence reveals hidden opportunities",
            "Alternative data sources provide competitive advantage",
            "Predictive analytics increase win rates by 67%",
            "Integrated workflow saves 12+ hours per week",
          ],
          demoFlow: [
            "Monaco: Show Nike opportunity with buying signals",
            "Alternative data: Government contracts + economic indicators",
            "Speedrun: AI-generated personalized sequences",
            "Pipeline: Predictive close date accuracy",
          ],
          closingPoints: [
            "This intelligence would have closed 3 more deals last quarter",
            "The time savings alone justify the investment",
            "Your team needs this competitive advantage",
          ],
          objectionHandlers: {
            "too expensive":
              "The average user closes 2.3x more deals - ROI is 847%",
            "we use Salesforce":
              "We enhance Salesforce with intelligence they don't have",
            "too complex": "Our AI handles complexity - you just get insights",
          },
        },
      },
      {
        id: "sales-director",
        name: "Michael Chen",
        title: "VP of Sales",
        email: "michael@demo.adrata.com",
        password: process.env.DEMO_DIRECTOR_PASSWORD || "demo-director-2024",
        permissions: ["team-management", "analytics", "forecasting", "admin"],
        personalizedData: {
          teamSize: 24,
          regions: ["North America", "EMEA"],
          quarterlyTarget: "$15M",
          currentForecast: "$16.2M",
          teamPerformance: "108% of quota",
        },
        demoScript: {
          intro:
            "I'm Michael, VP of Sales managing 24 AEs across North America and EMEA. Here's how Adrata transformed our revenue operations.",
          keyTalkingPoints: [
            "Team performance visibility increased by 340%",
            "Forecast accuracy improved from 67% to 94%",
            "Pipeline health scores predict team performance",
            "AI coaching increases rep performance by 45%",
          ],
          demoFlow: [
            "Team dashboard: Real-time performance metrics",
            "Forecast precision: AI-powered predictions",
            "Rep coaching: Personalized improvement plans",
            "Market intelligence: Competitive battlecards",
          ],
          closingPoints: [
            "This would have prevented our Q2 forecast miss",
            "The team enablement features are game-changing",
            "ROI pays for itself in 6 weeks",
          ],
          objectionHandlers: {
            "team adoption": "94% adoption rate - it sells itself to reps",
            "training required":
              "AI provides contextual guidance - minimal training needed",
            "data quality": "Our intelligence sources are 99.3% accurate",
          },
        },
      },
    ],
    demoData: {
      companies: [
        {
          name: "Nike Inc.",
          industry: "Apparel & Accessories",
          revenue: "$51.2B",
          employees: "83,700",
          signals: [
            "Digital transformation initiative",
            "$2B technology budget",
            "Q1 vendor evaluation",
          ],
          buyingCommittee: 8,
          competitorActivity: "Salesforce (high threat)",
        },
        {
          name: "Goldman Sachs",
          industry: "Investment Banking",
          revenue: "$44.6B",
          employees: "49,100",
          signals: [
            "Expanding technology team",
            "New CTO hired",
            "Data modernization project",
          ],
          buyingCommittee: 12,
          competitorActivity: "Oracle (medium threat)",
        },
      ],
      leads: [
        {
          name: "Jennifer Park",
          title: "Chief Marketing Officer",
          company: "Nike Inc.",
          email: "j.park@nike.com",
          buyerRole: "Decision Maker",
          engagement: "High",
          lastActivity: "Viewed pricing page 3x this week",
        },
      ],
      opportunities: [
        {
          name: "Nike Digital Customer Analytics Platform",
          value: "$1,250,000",
          stage: "Proposal",
          probability: "75%",
          closeDate: "2024-04-15",
          buyingSignals: [
            "Executive presentation scheduled",
            "Technical requirements approved",
            "Budget confirmed",
          ],
        },
      ],
      conversations: [
        {
          subject: "Nike Digital Platform Discussion",
          participants: ["Jennifer Park", "Sarah Williams"],
          sentiment: "Very Positive",
          nextSteps: "Executive presentation March 15th",
        },
      ],
      reports: [
        {
          name: "Q1 Pipeline Health Report",
          insights: "Pipeline is 108% of target with strong velocity",
          recommendations: [
            "Focus on Nike opportunity",
            "Accelerate Goldman Sachs engagement",
          ],
        },
      ],
      integrations: [
        {
          name: "Salesforce Sync",
          status: "Active",
          lastSync: "2 minutes ago",
          recordsProcessed: "2,847",
        },
      ],
    },
    demoFlow: [
      {
        id: "welcome",
        title: "Platform Overview",
        description: "Welcome and 30-second platform overview",
        duration: 2,
        keyActions: ["Show unified dashboard", "Highlight key metrics"],
        expectedOutcome: "Understanding of platform scope",
      },
      {
        id: "intelligence",
        title: "AI-Powered Intelligence",
        description: "Monaco company intelligence and buying signals",
        duration: 5,
        keyActions: [
          "Search Nike",
          "Show buying signals",
          "Reveal alternative data",
        ],
        expectedOutcome: "Amazement at intelligence depth",
      },
      {
        id: "automation",
        title: "Intelligent Automation",
        description: "Speedrun AI sequences and personalization",
        duration: 4,
        keyActions: [
          "Show AI-generated email",
          "Demonstrate personalization",
          "Multi-channel sequences",
        ],
        expectedOutcome: "Understanding of productivity gains",
      },
      {
        id: "analytics",
        title: "Predictive Analytics",
        description: "Pipeline forecasting and team performance",
        duration: 4,
        keyActions: [
          "Show forecast accuracy",
          "Team dashboard",
          "Performance insights",
        ],
        expectedOutcome: "Recognition of strategic value",
      },
      {
        id: "integration",
        title: "Platform Integration",
        description: "Grand Central data hub and existing tool enhancement",
        duration: 3,
        keyActions: [
          "Show Salesforce sync",
          "Data enrichment",
          "Unified workflow",
        ],
        expectedOutcome: "Confidence in implementation",
      },
      {
        id: "close",
        title: "Business Impact",
        description: "ROI calculation and next steps",
        duration: 2,
        keyActions: [
          "Show ROI metrics",
          "Success stories",
          "Implementation timeline",
        ],
        expectedOutcome: "Commitment to next meeting",
      },
    ],
    winningPoints: [
      "847% average ROI within 6 months",
      "67% increase in win rates with predictive intelligence",
      "12+ hours saved per rep per week",
      "94% forecast accuracy vs. industry average of 67%",
      "2.3x more deals closed per rep",
    ],
  },

  "nightlife-venue": {
    id: "nightlife-venue",
    name: "Nightlife Venue Optimization",
    description: "Complete venue management with revenue optimization",
    icon: "🎭",
    industries: ["Nightlife", "Hospitality", "Entertainment"],
    targetAudience: "Club Owners, Venue Managers, Entertainment Groups",
    roles: [
      {
        id: "club-owner",
        name: "Marcus Rodriguez",
        title: "Club Owner & Operator",
        email: "marcus@demo.adrata.com",
        password: process.env.DEMO_NIGHTLIFE_PASSWORD || "demo-nightlife-2024",
        permissions: [
          "venue-management",
          "financial-analytics",
          "customer-intelligence",
        ],
        personalizedData: {
          venues: ["Skybar Rooftop", "Underground Lounge"],
          monthlyRevenue: "$485K",
          capacity: "850 guests",
          avgSpendPerGuest: "$127",
          preferredApps: ["nightlife", "vault", "pulse"],
        },
        demoScript: {
          intro:
            "I'm Marcus, owner of two premier nightlife venues in Miami. Let me show you how Adrata transformed our operations and profitability.",
          keyTalkingPoints: [
            "Cross-venue customer intelligence increases repeat visits by 34%",
            "Dynamic pricing optimization boosts revenue per night by 28%",
            "Integrated ticketing with Posh.vip and Partiful streamlines operations",
            "Predictive staffing reduces labor costs by 15%",
          ],
          demoFlow: [
            "Customer journey: Track guest across venues and platforms",
            "Revenue optimization: Dynamic pricing and inventory management",
            "Event planning: Integrated Partiful and TablelistPro management",
            "Financial analytics: Real-time P&L and forecasting",
          ],
          closingPoints: [
            "This would have optimized our peak season revenue by $180K",
            "The customer intelligence creates unfair competitive advantage",
            "ROI positive within 30 days",
          ],
          objectionHandlers: {
            "staff adoption":
              "Interface designed for hospitality - 15 minute training",
            "integration complexity":
              "Pre-built connectors for all major platforms",
            "cost concern":
              "Pays for itself with first weekend of optimization",
          },
        },
      },
    ],
    demoData: {
      companies: [
        {
          name: "SBE Entertainment Group",
          industry: "Hospitality & Entertainment",
          revenue: "$1.2B",
          venues: 47,
          signals: [
            "Technology modernization initiative",
            "New venues opening Q2",
            "Operations efficiency focus",
          ],
        },
      ],
      leads: [
        {
          name: "Isabella Chen",
          title: "VP Operations",
          company: "SBE Entertainment",
          venue: "Hyde Bellagio",
          engagement: "High",
          lastActivity: "Requested platform demo",
        },
      ],
      opportunities: [
        {
          name: "SBE Multi-Venue Platform Implementation",
          value: "$890,000",
          venues: 12,
          stage: "Discovery",
          probability: "45%",
          closeDate: "2024-05-30",
        },
      ],
      conversations: [],
      reports: [],
      integrations: [
        {
          name: "Posh.vip Sync",
          status: "Active",
          lastSync: "5 minutes ago",
          eventsProcessed: "847",
        },
        {
          name: "TablelistPro Integration",
          status: "Active",
          lastSync: "1 minute ago",
          reservationsProcessed: "234",
        },
      ],
    },
    demoFlow: [
      {
        id: "venue-overview",
        title: "Venue Intelligence Dashboard",
        description: "Real-time venue performance and customer insights",
        duration: 3,
        keyActions: [
          "Show multi-venue dashboard",
          "Customer lifetime value",
          "Peak performance metrics",
        ],
        expectedOutcome: "Understanding of comprehensive venue intelligence",
      },
      {
        id: "customer-journey",
        title: "Cross-Platform Customer Tracking",
        description:
          "Guest journey across Posh.vip, Partiful, and TablelistPro",
        duration: 4,
        keyActions: [
          "Show customer profile",
          "Cross-venue visits",
          "Spending patterns",
        ],
        expectedOutcome: "Amazement at customer intelligence depth",
      },
      {
        id: "revenue-optimization",
        title: "Dynamic Revenue Management",
        description: "AI-powered pricing and inventory optimization",
        duration: 4,
        keyActions: [
          "Show demand forecasting",
          "Dynamic pricing",
          "Inventory optimization",
        ],
        expectedOutcome: "Recognition of revenue potential",
      },
      {
        id: "operations",
        title: "Operational Excellence",
        description: "Staff optimization and expense management",
        duration: 3,
        keyActions: [
          "Staffing predictions",
          "Cost analysis",
          "Performance benchmarks",
        ],
        expectedOutcome: "Understanding of operational benefits",
      },
    ],
    winningPoints: [
      "Average 28% increase in revenue per night",
      "34% increase in customer repeat visits",
      "15% reduction in labor costs through predictive staffing",
      "Real-time integration with all major nightlife platforms",
      "ROI positive within first month",
    ],
  },

  "smb-growth": {
    id: "smb-growth",
    name: "SMB Growth Acceleration",
    description: "Complete business platform for scaling companies",
    icon: "🚀",
    industries: [
      "Technology",
      "Professional Services",
      "E-commerce",
      "Consulting",
    ],
    targetAudience: "SMB Owners, Growth Teams, Operations Managers",
    roles: [
      {
        id: "smb-owner",
        name: "David Kim",
        title: "CEO & Founder",
        email: "david@demo.adrata.com",
        password: process.env.DEMO_GROWTH_PASSWORD || "demo-growth-2024",
        permissions: [
          "full-platform",
          "team-management",
          "financial-oversight",
        ],
        personalizedData: {
          companySize: 47,
          industry: "Marketing Technology",
          annualRevenue: "$4.2M",
          growthRate: "34% YoY",
          preferredApps: ["aos", "vault", "harmony"],
        },
        demoScript: {
          intro:
            "I'm David, CEO of a fast-growing martech company. Here's how Adrata replaced 12 different tools and accelerated our growth.",
          keyTalkingPoints: [
            "Consolidated 12 tools into one unified platform",
            "Reduced software costs by 67% while improving functionality",
            "Team productivity increased 89% with unified workflows",
            "Customer acquisition cost decreased 43% with better intelligence",
          ],
          demoFlow: [
            "Platform overview: Show unified workspace",
            "Team collaboration: Integrated communication and project management",
            "Customer intelligence: Monaco for market insights",
            "Financial management: Vault for cash flow and forecasting",
          ],
          closingPoints: [
            "This would have saved us $180K in software costs last year",
            "The time savings allow focus on growth instead of admin",
            "All-in-one platform scales with us",
          ],
          objectionHandlers: {
            "switching costs":
              "Migration tools and dedicated success manager included",
            "team training":
              "Intuitive design - most features learned in minutes",
            "feature parity":
              "We exceed functionality of tools you're replacing",
          },
        },
      },
    ],
    demoData: {
      companies: [
        {
          name: "TechFlow Solutions",
          industry: "Marketing Technology",
          revenue: "$4.2M",
          employees: "47",
          stage: "Series A",
          signals: [
            "Rapid growth",
            "Team scaling",
            "Process optimization needed",
          ],
        },
      ],
      leads: [
        {
          name: "Sarah Mitchell",
          title: "Head of Operations",
          company: "TechFlow Solutions",
          email: "s.mitchell@techflow.com",
          buyerRole: "Champion",
          engagement: "High",
          lastActivity: "Downloaded ROI calculator",
        },
      ],
      opportunities: [
        {
          name: "TechFlow Growth Platform Implementation",
          value: "$48,000",
          stage: "Proposal",
          probability: "85%",
          closeDate: "2024-03-30",
          buyingSignals: [
            "Budget approved",
            "Team demo completed",
            "Reference calls scheduled",
          ],
        },
      ],
      conversations: [],
      reports: [],
      integrations: [],
    },
    demoFlow: [
      {
        id: "platform-consolidation",
        title: "Tool Consolidation",
        description: "How Adrata replaces multiple tools with one platform",
        duration: 4,
        keyActions: [
          "Show tool comparison",
          "Cost savings calculator",
          "Feature mapping",
        ],
        expectedOutcome: "Understanding of consolidation benefits",
      },
      {
        id: "team-productivity",
        title: "Team Productivity",
        description: "Unified workflows and collaboration",
        duration: 5,
        keyActions: [
          "Show project management",
          "Team communication",
          "Workflow automation",
        ],
        expectedOutcome: "Recognition of productivity gains",
      },
      {
        id: "business-intelligence",
        title: "Growth Intelligence",
        description: "Customer insights and market intelligence",
        duration: 4,
        keyActions: [
          "Customer analytics",
          "Market trends",
          "Competitive intelligence",
        ],
        expectedOutcome: "Amazement at business insights",
      },
      {
        id: "financial-management",
        title: "Financial Operations",
        description: "Cash flow, forecasting, and financial health",
        duration: 3,
        keyActions: [
          "Cash flow dashboard",
          "Revenue forecasting",
          "Expense tracking",
        ],
        expectedOutcome: "Confidence in financial control",
      },
    ],
    winningPoints: [
      "Average 67% reduction in software costs",
      "89% increase in team productivity",
      "43% decrease in customer acquisition cost",
      "Replaces 8-15 separate tools with one platform",
      "Implementation completed in 2 weeks",
    ],
  },
};

// DEMO SERVICE CLASS
export class DemoScriptingService {
  static readonly DEMO_SESSION_KEY = "adrata_demo_session";

  static getDemoTypes() {
    return [
      {
        id: "enterprise-sales",
        name: "Enterprise Sales Excellence",
        description:
          "Fortune 500 account intelligence with AI-powered insights",
        icon: "🏢",
        roles: [
          {
            id: "enterprise-ae",
            name: "Sarah Williams",
            title: "Enterprise Account Executive",
            email: "sarah@demo.adrata.com",
            password: process.env.DEMO_ENTERPRISE_PASSWORD || "demo-enterprise-2024",
          },
          {
            id: "sales-director",
            name: "Michael Chen",
            title: "VP of Sales",
            email: "michael@demo.adrata.com",
            password: process.env.DEMO_DIRECTOR_PASSWORD || "demo-director-2024",
          },
        ],
      },
      {
        id: "nightlife-venue",
        name: "Nightlife Venue Optimization",
        description: "Complete venue management with revenue optimization",
        icon: "🎭",
        roles: [
          {
            id: "club-owner",
            name: "Marcus Rodriguez",
            title: "Club Owner & Operator",
            email: "marcus@demo.adrata.com",
            password: process.env.DEMO_NIGHTLIFE_PASSWORD || "demo-nightlife-2024",
          },
        ],
      },
      {
        id: "smb-growth",
        name: "SMB Growth Acceleration",
        description: "Complete business platform for scaling companies",
        icon: "🚀",
        roles: [
          {
            id: "smb-owner",
            name: "David Kim",
            title: "CEO & Founder",
            email: "david@demo.adrata.com",
            password: process.env.DEMO_GROWTH_PASSWORD || "demo-growth-2024",
          },
        ],
      },
    ];
  }

  static isDemoMode() {
    return !!localStorage.getItem(this.DEMO_SESSION_KEY);
  }

  static initializeDemoSession(demoTypeId: string, roleId: string) {
    const session = {
      demoTypeId,
      roleId,
      startTime: new Date().toISOString(),
    };
    localStorage.setItem(this.DEMO_SESSION_KEY, JSON.stringify(session));
    console.log(`🎭 Demo session initialized: ${demoTypeId} - ${roleId}`);
  }
}

export default DemoScriptingService;
