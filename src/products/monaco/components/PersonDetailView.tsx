import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Kbd, formatShortcutForDisplay, createTooltipWithShortcut } from '@/platform/utils/keyboard-shortcut-display';
import {
  ChevronLeftIcon,
  PlusIcon,
  CheckIcon,
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  SparklesIcon,
  BriefcaseIcon,
  UsersIcon,
  ClockIcon,
  DocumentTextIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { WorkspaceDataRouter } from "@/platform/services/workspace-data-router";
import { Person } from "../types";
import { PipelineProgress } from "@/platform/shared/components/ui/PipelineProgress";
import { PainIntelligence, PainIntelligenceData, ExamplePainData } from "./PainIntelligence";
import { useCompanyData } from "@/platform/hooks/useCompanyData";
import { useUnifiedAuth } from "@/platform/auth";
import { InlineEditField } from "@/frontend/components/pipeline/InlineEditField";


// Import report components
import IndustryDeepReport from "@/platform/reports/industry-deep";
import CompetitiveDeepReport from "@/platform/reports/competitive-deep";
import GrowthDeepReport from "@/platform/reports/growth-deep";
import TechDeepReport from "@/platform/reports/tech-deep";

interface PersonDetailViewProps {
  person: Person;
  onBack: () => void;
  getStatusColor: (status: string) => string;
  getRankNumber: (record: any) => number;
  getRankingDescription: (record: any) => string;
  getInitials: (name: string | null | undefined) => string;
  sourceSection?: string;
  // Navigation props for Speedrun
  currentIndex?: number;
  totalRecords?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onMarkCompleted?: () => void;
  isCompleted?: boolean;
  // Company click handler
  onCompanyClick?: (companyName: string) => void;
}

interface ValueIdea {
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  type: string;
}

// Generate pain intelligence data for the enhanced pain component
const generatePainIntelligenceData = (person: Person): PainIntelligenceData => {
  const personKey = `${(person.name || 'unknown').toLowerCase().replace(' ', '-')}-${person.company?.toLowerCase().replace(' ', '-') || 'company'}`;
  
  // Check if we have example data for this person
  if (ExamplePainData[personKey]) {
    return ExamplePainData[personKey];
  }
  
  // Generate default pain intelligence data based on role and company
  const customFields = (person as any).customFields || {};
  const role = customFields.buyerGroupRole || "Stakeholder";
  const company = person.company || "Company";
  const painSummary = (person as any).painSummary || "";
  
  // Create basic pain data if no example exists
  return {
    personId: person.id || personKey,
    personName: person.name,
    role: person.title || "Professional",
    company: company,
    totalPainPoints: 3,
    criticalPainPoints: [
      {
        id: `${personKey}-default-pain`,
        category: "operational",
        title: "Process Efficiency Challenges",
        description: painSummary || `${person.name} faces operational challenges that impact their role as ${person.title || 'Professional'} at ${company}.`,
        quantifiedImpact: 500000,
        urgency: "medium",
        timeline: "Next quarter",
        sources: [
          {
            source: "Industry Analysis",
            type: "external",
            confidence: 75,
            lastUpdated: new Date().toISOString().split('T')[0],
            data: `Market research indicates common challenges in ${person.department || 'technology'} roles similar to ${person.title || 'Professional'}.`
          },
          {
            source: "Profile Analysis",
            type: "discovery",
            confidence: 70,
            lastUpdated: new Date().toISOString().split('T')[0],
            data: painSummary || "Based on role and seniority level, typical operational challenges identified."
          }
        ],
        evidence: [
          "Industry benchmarks show efficiency gaps",
          "Role-specific challenges documented",
          "Company size and stage indicators"
        ],
        consequences: [
          "Continued operational inefficiency",
          "Competitive disadvantage",
          "Resource allocation challenges"
        ]
      }
    ],
    externalDataPercentage: 75,
    discoveryDataPercentage: 25,
    lastAnalyzed: new Date().toLocaleDateString(),
    confidenceScore: 72
  };
};

// Generate detailed directional intelligence for deal advancement
const generateDirectionalIntelligence = (person: Person): string => {
  const customFields = (person as any).customFields || {};
  const role = customFields.buyerGroupRole || "Stakeholder";
  const company = person.company || "Company";
  const name = person.name;
  const hasValidTitle = person['title'] && 
    person.title.toLowerCase() !== 'unknown' && 
    person.title.toLowerCase() !== 'unknown title' && 
    person.title !== '-' && 
    person.title.trim() !== '';
  const title = hasValidTitle ? person.title : null;
  const department = person.department || "Team";
  const seniority = person.seniority || "Manager";
  const painSummary = (person as any).painSummary || "";

  // Generate role-specific directional intelligence
  if (role === "Decision Maker") {
    if (company === "ADP") {
      return `${name} (CTO) controls $300M technology modernization budget with board-level visibility. Approach: (1) Schedule 30-min executive briefing focusing on payroll system uptime ROI and competitive advantage over Workday, (2) Present consolidated security metrics showing 99.9% uptime improvement, (3) Coordinate with CFO on budget allocation timing for Q1 implementation, (4) Leverage 24-billion transaction scale as proof point for enterprise readiness.`;
    }
    const titleText = title ? ` as ${title}` : '';
    return `${name}${titleText} has C-suite budget authority and strategic oversight. Approach: (1) Executive briefing focusing on business outcomes and competitive advantage, (2) ROI presentation with industry benchmarks, (3) Coordinate with finance team on budget cycles, (4) Address board-level concerns about implementation risks and timelines.`;
  }

  if (role === "Champion") {
    if (company === "ADP" && painSummary.includes("cloud-first transformation")) {
      return `${name} (VP Engineering) manages 2,000+ engineers through cloud transformation while competing against Workday losses. Approach: (1) Technical deep-dive showcasing cloud-native architecture and auto-scaling capabilities, (2) Developer productivity metrics showing 40% faster deployment cycles, (3) Integration roadmap with existing AWS/Azure infrastructure, (4) Proof-of-concept focused on microservices migration and engineering team adoption.`;
    }
    if (company === "ADP" && painSummary.includes("microservices")) {
      return `${name} (Platform Architecture) leads microservices migration for 24B+ transactions across 140 countries. Approach: (1) Architecture review session demonstrating API-first design and global scalability, (2) Performance benchmarks for high-transaction environments, (3) Security architecture alignment with zero-trust principles, (4) Phased rollout strategy matching international compliance requirements.`;
    }
    const titleText = title ? ` as ${title}` : '';
    return `${name}${titleText} influences technical evaluation and implementation. Approach: (1) Technical demonstration aligned with their architecture, (2) Proof-of-concept in their environment, (3) Integration planning with existing systems, (4) Developer adoption and training roadmap.`;
  }

  if (role === "Blocker") {
    if (company === "ADP" && painSummary.includes("SOC 2")) {
      return `${name} (Security/Compliance) faces SOC 2 Type II audit Q1 2025 with vendor assessment bottlenecks. Approach: (1) Security architecture review demonstrating SOC 2 compliance and automated audit reporting, (2) Vendor risk assessment documentation and third-party security certifications, (3) Compliance roadmap showing accelerated audit preparation, (4) Reference clients with similar regulatory requirements and successful implementations.`;
    }
    if (company === "ADP" && painSummary.includes("EU Digital Services Act")) {
      return `${name} (Chief Legal Officer) manages EU Digital Services Act compliance deadline February 2025 across 140 countries. Approach: (1) Legal and compliance briefing on data residency and cross-border data protection, (2) Regulatory compliance documentation and audit trail capabilities, (3) Risk mitigation strategies for international operations, (4) Legal team collaboration on contract terms and liability frameworks.`;
    }
    return `${name} as ${title} must approve security, compliance, and risk considerations. Approach: (1) Security assessment and certification review, (2) Compliance documentation and audit capabilities, (3) Risk mitigation strategies and contingency planning, (4) Legal and procurement team alignment on contract terms.`;
  }

  if (role === "Stakeholder") {
    if (company === "ADP" && painSummary.includes("security vulnerabilities")) {
      return `${name} (${title}) needs security-first development tools to advance to Principal level while addressing 40% engineering team vulnerabilities. Approach: (1) Security integration demonstration showing automated vulnerability scanning and remediation, (2) Developer workflow optimization reducing security friction, (3) Promotion readiness metrics through security leadership, (4) Team adoption plan with security training and best practices.`;
    }
    if (company === "ADP" && painSummary.includes("infrastructure")) {
      return `${name} (${title}) manages Q4 payroll peak demands with 2.5x scaling while AWS costs exceed budget by 30%. Approach: (1) Cost optimization analysis showing 30-40% infrastructure savings, (2) Auto-scaling capabilities for payroll peak periods, (3) Budget impact assessment for director-level promotion case, (4) Implementation timeline aligned with Q4 peak season preparation.`;
    }
    const titleText = title ? ` as ${title}` : '';
    return `${name}${titleText} influences team adoption and operational success. Approach: (1) User experience demonstration focused on daily workflows, (2) Team productivity improvements and efficiency gains, (3) Change management support and training programs, (4) Success metrics aligned with their performance objectives.`;
  }

  // Default for other roles
  const titleText = title ? ` as ${title}` : '';
  return `${name}${titleText} requires stakeholder alignment and consensus building. Approach: (1) Understand their specific concerns and success criteria, (2) Demonstrate relevant capabilities for their role, (3) Build coalition with other buyer group members, (4) Address adoption challenges and change management needs.`;
};

// Generate reports based on person's role and company
const generatePersonalizedReports = (person: Person): ValueIdea[] => {
  const customFields = (person as any).customFields || {};
  const role = customFields.buyerGroupRole || "Stakeholder";
  const company = person.company || "Company";
  
  // Role-based reports similar to LeadDetails
  const reportMap = {
    "Decision Maker": [
      {
        title: "Executive Decision Framework",
        description: "Strategic decision-making analysis and stakeholder influence mapping for accelerated consensus building.",
        urgency: "high" as const,
        type: "competitive",
      },
      {
        title: "Market Leadership Assessment",
        description: "Competitive positioning analysis and market expansion opportunities specific to your industry vertical.",
        urgency: "high" as const,
        type: "growth",
      },
      {
        title: "Revenue Acceleration Strategy",
        description: "Growth opportunities and strategic initiatives to drive sustainable revenue expansion.",
        urgency: "medium" as const,
        type: "industry",
      },
      {
        title: "Technology Modernization Plan",
        description: "Digital transformation roadmap and technology investment strategy for competitive advantage.",
        urgency: "medium" as const,
        type: "tech",
      },
    ],
    "Champion": [
      {
        title: "Technology Stack Optimization",
        description: "Platform evaluation and technology upgrade strategy for enhanced operational efficiency.",
        urgency: "high" as const,
        type: "tech",
      },
      {
        title: "Competitive Technology Analysis",
        description: "Market-leading technology solutions and implementation roadmap for competitive advantage.",
        urgency: "high" as const,
        type: "competitive",
      },
      {
        title: "Growth Technology Strategy",
        description: "Technology-driven growth opportunities and digital transformation initiatives.",
        urgency: "medium" as const,
        type: "growth",
      },
      {
        title: "Industry Innovation Trends",
        description: "Emerging technology trends and innovation opportunities in your industry sector.",
        urgency: "medium" as const,
        type: "industry",
      },
    ],
    "Stakeholder": [
      {
        title: "Industry Impact Analysis",
        description: "Market trend analysis and strategic implications for your organization's growth trajectory.",
        urgency: "medium" as const,
        type: "industry",
      },
      {
        title: "Operational Excellence Strategy",
        description: "Process optimization and efficiency improvement opportunities for enhanced performance.",
        urgency: "medium" as const,
        type: "growth",
      },
      {
        title: "Competitive Intelligence Brief",
        description: "Market positioning analysis and competitive threat assessment for strategic planning.",
        urgency: "medium" as const,
        type: "competitive",
      },
      {
        title: "Technology Readiness Assessment",
        description: "Technology adoption strategy and implementation roadmap for operational transformation.",
        urgency: "low" as const,
        type: "tech",
      },
    ],
    "Blocker": [
      {
        title: "Risk Mitigation Strategy",
        description: "Comprehensive risk assessment and mitigation framework for secure technology adoption.",
        urgency: "high" as const,
        type: "tech",
      },
      {
        title: "Compliance & Security Analysis",
        description: "Regulatory compliance framework and security assessment for technology implementations.",
        urgency: "high" as const,
        type: "competitive",
      },
      {
        title: "Industry Regulation Impact",
        description: "Regulatory landscape analysis and compliance strategy for your industry vertical.",
        urgency: "medium" as const,
        type: "industry",
      },
      {
        title: "Controlled Growth Strategy",
        description: "Risk-managed growth opportunities and controlled expansion framework.",
        urgency: "medium" as const,
        type: "growth",
      },
    ],
          "Openers": [
      {
        title: "Network Expansion Strategy",
        description: "Strategic networking opportunities and relationship building framework for business growth.",
        urgency: "medium" as const,
        type: "growth",
      },
      {
        title: "Industry Connection Analysis",
        description: "Key stakeholder mapping and influence network analysis for strategic positioning.",
        urgency: "medium" as const,
        type: "industry",
      },
      {
        title: "Partnership Opportunity Assessment",
        description: "Strategic partnership evaluation and collaboration framework for market expansion.",
        urgency: "medium" as const,
        type: "competitive",
      },
      {
        title: "Technology Introduction Plan",
        description: "Technology adoption strategy and change management framework for organizational transformation.",
        urgency: "low" as const,
        type: "tech",
      },
    ],
  };

  return reportMap[role as keyof typeof reportMap] || reportMap["Stakeholder"];
};

// Format relative date
const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

// Generate personal wants and needs
const generatePersonalWants = (person: Person): string => {
  const customFields = (person as any).customFields || {};
  const role = customFields.buyerGroupRole || "Stakeholder";
  const wantsMap = {
    "Decision Maker": "Strategic market leadership, sustainable growth, competitive advantage, and organizational transformation success.",
    "Champion": "Technology innovation, operational excellence, successful implementations, and recognition for driving change.",
    "Stakeholder": "Process efficiency, clear communication, reduced complexity, and successful project outcomes.",
    "Blocker": "Risk mitigation, regulatory compliance, security assurance, and controlled change management.",
          "Openers": "Network expansion, relationship building, collaboration opportunities, and strategic connections."
  };
  return wantsMap[role as keyof typeof wantsMap] || wantsMap["Stakeholder"];
};

const generatePersonalNeeds = (person: Person): string => {
  const customFields = (person as any).customFields || {};
  const role = customFields.buyerGroupRole || "Stakeholder";
  const needsMap = {
    "Decision Maker": "Data-driven insights, strategic clarity, stakeholder alignment, and measurable business outcomes.",
    "Champion": "Technical validation, implementation support, change management resources, and executive buy-in.",
    "Stakeholder": "Clear processes, adequate training, ongoing support, and measurable improvements.",
    "Blocker": "Comprehensive risk assessment, compliance documentation, security validation, and audit trails.",
          "Openers": "Relationship facilitation, networking opportunities, collaboration tools, and strategic introductions."
  };
  return needsMap[role as keyof typeof needsMap] || needsMap["Stakeholder"];
};

// Get role color
const getRoleColor = (role: string) => {
  return "bg-hover text-foreground border-border";
};

// Generate concise pain intelligence similar to directional intelligence format
const generatePainIntelligence = (person: Person): string => {
  const customFields = (person as any).customFields || {};
  const role = customFields.buyerGroupRole || "Stakeholder";
  const company = person.company || "Company";
  const name = person.name || "Professional";
  const hasValidTitle = person['title'] && 
    person.title.toLowerCase() !== 'unknown' && 
    person.title.toLowerCase() !== 'unknown title' && 
    person.title !== '-' && 
    person.title.trim() !== '';
  const title = hasValidTitle ? person.title : null;

  // Specific pain intelligence for known individuals
  if (name === "Michael Chen" && company === "ADP") {
    return `${name} (CTO) faces $8.5M cloud transformation pressure with 18-month delays while Workday gains market share. Pain: Legacy payroll infrastructure struggles with 24B+ transactions requiring 99.9% uptime. Impact: Board pressure for competitive response, $47M modernization costs, 40% higher operational expenses than cloud alternatives.`;
  }

  if (name === "Sarah Rodriguez" && company === "ADP") {
    return `${name} (VP Engineering) manages 2,000+ engineers through cloud-first transformation while competing against Workday losses. Pain: Development velocity 40% slower than cloud-native competitors, microservices migration complexity across 140 countries. Impact: Engineering productivity bottlenecks, talent retention challenges, delayed product launches affecting revenue.`;
  }

  if (name === "James Wilson" && company === "ADP") {
    return `${name} (Director Platform Architecture) architects microservices migration for 24 billion payroll transactions while promotion to Principal depends on security leadership. Pain: 847 high-critical vulnerabilities blocking deployments, 21-day resolution time vs 7-day target. Impact: Career advancement blocked, security risks accumulating, development team frustration.`;
  }

  if (name === "Jennifer Martinez" && company === "ADP") {
    return `${name} (VP Product Engineering) drives mobile-first security strategy competing for SVP Product role amid 15% customer data exposure risks. Pain: Product security gaps in mobile applications, competitive pressure from security-focused alternatives. Impact: Career advancement at risk, customer trust concerns, regulatory compliance challenges.`;
  }

  if (name === "Patricia Kim" && company === "ADP") {
    return `${name} (Sr Director Tech Procurement) oversees $50M+ annual technology procurement while evaluation processes lag 6 months behind schedule. Pain: Vendor assessment bottlenecks, accelerated technology adoption demands, competitive pressure for faster decisions. Impact: Procurement efficiency declining, business unit frustration, vendor relationship strain.`;
  }

  if (name === "Steve Ferro" && company.includes("DataCorp")) {
    return `${name} (VP Sales Operations) faces 15% deal velocity reduction while competitors accelerate customer acquisition through automated processes. Pain: Manual CRM processes, fragmented sales tools, 45-day sales cycles vs 30-day target. Impact: Revenue targets at risk, sales team productivity declining, competitive disadvantage in fast-moving deals.`;
  }

  if (name === "Susan Smith" && company.includes("DataCorp")) {
    return `${name} (Director IT Security) manages $2M+ security infrastructure budget with quantum computing threats emerging within 18 months. Pain: Legacy RSA-2048 encryption vulnerable to quantum attacks, no quantum-resistant algorithms implemented. Impact: Data breach risk from quantum-capable attackers, regulatory compliance gaps, customer trust vulnerability.`;
  }

  // Generic pain intelligence based on role and company context
  if (role === "Decision Maker") {
    const titleText = title ? ` as ${title}` : '';
    return `${name}${titleText} faces strategic pressure to modernize technology infrastructure while maintaining operational efficiency and managing budget constraints. Pain: Legacy system limitations, competitive pressure for innovation, ROI justification requirements. Impact: Strategic goals at risk, board accountability, market position threats.`;
  }

  if (role === "Champion") {
    const titleText = title ? ` as ${title}` : '';
    return `${name}${titleText} drives technical evaluation and implementation while balancing team productivity and innovation requirements. Pain: Technical debt accumulation, team capacity constraints, integration complexity with existing systems. Impact: Development velocity declining, team retention challenges, project delivery risks.`;
  }

  if (role === "Blocker") {
    const titleText = title ? ` as ${title}` : '';
    return `${name}${titleText} must ensure security, compliance, and risk management while enabling business innovation and growth. Pain: Regulatory compliance requirements, security vulnerability management, vendor risk assessment bottlenecks. Impact: Business agility constraints, audit preparation stress, reputation risk exposure.`;
  }

  if (role === "Stakeholder") {
    const titleText = title ? ` as ${title}` : '';
    return `${name}${titleText} needs operational efficiency improvements while managing day-to-day responsibilities and team performance. Pain: Manual process inefficiencies, tool fragmentation, productivity measurement challenges. Impact: Team performance declining, operational costs increasing, competitive efficiency gaps.`;
  }

  // Default for other roles
  const titleText = title ? ` as ${title}` : '';
  return `${name}${titleText} requires operational improvements and efficiency gains to meet performance objectives. Pain: Process inefficiencies, technology limitations, resource allocation challenges. Impact: Performance goals at risk, operational costs increasing, competitive positioning threatened.`;
};

// EmailInteractionItem component with expandable content
interface EmailInteractionItemProps {
  subject: string;
  date: string;
  status: string;
  preview: string;
  fullContent: string;
}

const EmailInteractionItem: React.FC<EmailInteractionItemProps> = ({
  subject,
  date,
  status,
  preview,
  fullContent
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'opened': return 'bg-success/10 text-success';
      case 'sent': return 'bg-primary/10 text-primary';
      case 'replied': return 'bg-info/10 text-info';
      case 'bounced': return 'bg-error/10 text-error';
      default: return 'bg-hover text-foreground';
    }
  };

  return (
    <div className="flex items-start gap-4 p-3 bg-hover rounded-lg">
      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
        <EnvelopeIcon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground">{subject}</h4>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted hover:text-foreground transition-colors"
              title={isExpanded ? "Collapse email" : "Expand email"}
            >
              {isExpanded ? (
                <ChevronLeftIcon className="w-4 h-4 rotate-90" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          <span className="text-sm text-muted">
            {formatRelativeDate(date)}
          </span>
        </div>
        
        {/* Preview text */}
        {!isExpanded && (
          <p className="text-sm text-muted mb-2">
            {preview}
          </p>
        )}
        
        {/* Full email content when expanded */}
        {isExpanded && (
          <div className="mt-3 p-3 bg-background border border-border rounded-lg">
            <div className="text-sm text-foreground whitespace-pre-line">
              {fullContent}
            </div>
          </div>
        )}
        
        <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>
    </div>
  );
};

export const PersonDetailView: React.FC<PersonDetailViewProps> = ({
  person,
  onBack,
  getStatusColor,
  getRankNumber,
  getRankingDescription,
  getInitials,
  sourceSection,
  currentIndex,
  totalRecords,
  onPrevious,
  onNext,
  onMarkCompleted,
  isCompleted,
  onCompanyClick,
}) => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Extract custom fields data for enhanced display
  const customFields = (person as any).customFields || {};
  const coresignalData = customFields.coresignalData || {};
  
  // Get company name from active experience
  const activeExperience = coresignalData.experience?.find((exp: any) => exp.active_experience === 1) || coresignalData.experience?.[0];
  const companyName = activeExperience?.company_name || person.company || 'Unknown Company';
  const department = activeExperience?.department || person.department || 'Unknown Department';
  const seniority = activeExperience?.management_level || person.seniority || 'Unknown';
  
  const enhancedPerson = {
    ...person,
    // Map custom fields to person properties for easier access
    influenceScore: customFields.influenceScore || 0,
    isDecisionMaker: customFields.isDecisionMaker || false,
    buyerGroupRole: customFields.buyerGroupRole || "Stakeholder",
    lastContact: customFields.lastContact ? new Date(customFields.lastContact) : null,
    nextAction: customFields.nextAction || "Schedule follow-up call",
    priority: customFields.priority || "medium",
    experience: customFields.experience || [],
    education: customFields.education || [],
    skills: customFields.skills || [],
    certifications: customFields.certifications || [],
    companySize: customFields.companySize || "Unknown",
    industry: customFields.industry || "Unknown",
    revenue: customFields.revenue || "Unknown",
    employeeCount: customFields.employeeCount || 0,
    founded: customFields.founded || "Unknown",
    headquarters: customFields.headquarters || "Unknown",
    stockSymbol: customFields.stockSymbol || "Unknown",
    marketCap: customFields.marketCap || "Unknown",
    interactionHistory: customFields.interactionHistory || [],
    painPoints: customFields.painPoints || [],
    goals: customFields.goals || [],
    budget: customFields.budget || "Unknown",
    timeline: customFields.timeline || "Unknown",
    decisionFactors: customFields.decisionFactors || [],
    // Ensure all person properties are available with CoreSignal data
    fullName: coresignalData.full_name || (person as any).fullName || person.name,
    jobTitle: coresignalData.active_experience_title || coresignalData.headline || (person as any).jobTitle || person.title,
    workEmail: coresignalData.primary_professional_email || (person as any).workEmail || person.email,
    linkedinUrl: coresignalData.linkedin_url || (person as any).linkedinUrl || person.linkedin,
    linkedinNavigatorUrl: (person as any).linkedinNavigatorUrl,
    linkedinConnectionDate: (person as any).linkedinConnectionDate,
    city: (person as any).city,
    state: (person as any).state,
    notes: (person as any).notes,
    // Use CoreSignal data for company, department, and seniority
    company: companyName,
    department: department,
    seniority: seniority
  };

  // Function to get the back button text based on source section
  const getBackButtonText = (section?: string) => {
    switch (section) {
      case "rtp":
      case "speedrun":
        return "Speedrun";
      case "companies":
        return "Companies";
      case "people":
        return "Contacts";
      case "sellers":
        return "Sellers";
      default:
        return "Buyer Group";
    }
  };
  const [dynamicReports, setDynamicReports] = useState<ValueIdea[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");

  // Get company intelligence data from authenticated user's workspace
  const { user } = useUnifiedAuth();
  const workspaceId = user?.activeWorkspaceId || user?.workspaces?.[0]?.id || 'demo-workspace';
  
  // 🚀 PERFORMANCE: Memoize company data to prevent unnecessary re-fetches
  const memoizedCompanyName = useMemo(() => person.company || '', [person.company]);
  const { companyData, loading: companyLoading, error: companyError } = useCompanyData(
    memoizedCompanyName,
    workspaceId
  );

  // 🚀 PERFORMANCE: Memoize report generation to prevent expensive recalculations
  const personalizedReports = useMemo(() => {
    return generatePersonalizedReports(person);
  }, [person.id, person.company, person.title, person.department]);

  // Generate reports on component mount (memoized)
  useEffect(() => {
    setDynamicReports(personalizedReports);
  }, [personalizedReports]);

  // Initialize notes from person data
  useEffect(() => {
    if ((person as any).notes) {
      setNotes([(person as any).notes]);
    }
  }, [(person as any).notes]);

  // Keyboard shortcut for completing Speedrun cards
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ⌘+Enter to mark as completed (only in Speedrun mode)
      if (sourceSection === "rtp" && (event.metaKey || event.ctrlKey) && event['key'] === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        if (onMarkCompleted) {
          onMarkCompleted();
          console.log('⌘+Enter pressed, speedrunng as completed');
        }
      }
      // Arrow keys for navigation (only in Speedrun mode)
      if (sourceSection === "rtp" && (!event.target || (event.target as HTMLElement).tagName !== 'INPUT')) {
        if (event['key'] === 'ArrowLeft' && onPrevious && currentIndex !== undefined && currentIndex > 0) {
          event.preventDefault();
          onPrevious();
        }
        if (event['key'] === 'ArrowRight' && onNext && currentIndex !== undefined && totalRecords !== undefined && currentIndex < totalRecords - 1) {
          event.preventDefault();
          onNext();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sourceSection, onMarkCompleted, onPrevious, onNext, currentIndex, totalRecords]);

  // 🚀 PERFORMANCE: Memoize workspace detection to prevent unnecessary API calls
  const [isRetailProductSolutions, setIsRetailProductSolutions] = useState(false);
  
  const checkWorkspace = useCallback(async () => {
    try {
      const context = await WorkspaceDataRouter.getWorkspaceContext();
      // Dano's Retail Product Solutions workspace
      const isDemoWorkspace = context.workspaceId?.includes('demo') || context.isDemo;
      setIsRetailProductSolutions(isDemoWorkspace);
    } catch (error) {
      console.error('Error checking workspace context:', error);
      setIsRetailProductSolutions(false);
    }
  }, []);
  
  useEffect(() => {
    checkWorkspace();
  }, [checkWorkspace]);

  // 🚀 PERFORMANCE: Set initial loading to false after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 100); // Small delay to show loading state
    
    return () => clearTimeout(timer);
  }, []);

  // Check for report parameter in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reportParam = urlParams.get('report');
    if (reportParam) {
      setActiveReport(reportParam);
    }
  }, []);

  const tabs = [
    "Overview",
    "Insights",
    "Profile",
    // Hide Buyer Group tab for Retail Product Solutions workspace
    ...(isRetailProductSolutions ? [] : ["Buyer Group"]),
    "Career",
    "Company",
    "History",
    "Notes",
  ];

  const handleReportClick = (reportType: string) => {
    console.log("📊 Opening Deep Value Report:", reportType);
    
    // Set the active report to show in the same panel
    setActiveReport(reportType);
    
    // Update the URL to include the report parameter
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('report', reportType);
    window.history.pushState({}, '', currentUrl.toString());
  };

  const handleBackFromReport = () => {
    setActiveReport(null);
    
    // Remove the report parameter from URL
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('report');
    window.history.pushState({}, '', currentUrl.toString());
  };

  const addNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote.trim()]);
      setNewNote("");
    }
  };

  // Handle inline field save for Monaco person records
  const handlePersonSave = async (field: string, value: string, recordId: string, recordType: string): Promise<void> => {
    try {
      console.log(`🔄 [MONACO PERSON] Saving ${field} = ${value} for ${recordType} ${recordId}`);
      
      // Use v1 people API for updates
      const response = await fetch(`/api/v1/people/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`✅ [MONACO PERSON] Successfully updated ${field} for person ${recordId}`);
        } else {
          throw new Error(result.error || 'Update failed');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [MONACO PERSON] Error updating person record:', error);
      throw error;
    }
  };

  // If showing a report, render the report component
  if (activeReport) {
    // Find the original report title from dynamicReports
    const originalReport = dynamicReports.find(report => 
      activeReport.includes(report.type) || 
      activeReport.includes(report.title.toLowerCase().replace(/\s+/g, '-'))
    );
    const reportTitle = originalReport?.title;
    
    // Get CoreSignal data for real company information
    const customFields = (person as any).customFields || {};
    const coresignalData = customFields.coresignalData || {};
    const activeExperience = coresignalData.experience?.find((exp: any) => exp.active_experience === 1) || coresignalData.experience?.[0];
    
    // Use real company data from CoreSignal
    const realCompanyName = activeExperience?.company_name || person.company || "Unknown Company";
    const realIndustry = activeExperience?.company_industry || "Manufacturing";
    const realCompanySize = activeExperience?.company_size_range || "501-1000 employees";
    const realEmployeeCount = activeExperience?.company_employees_count || 310;
    const realCompanyType = activeExperience?.company_type || "Public Company";
    const realCompanyWebsite = activeExperience?.company_website || "";
    const realCompanyLocation = activeExperience?.company_hq_full_address || "";
    
    const reportProps = {
      company: realCompanyName,
      title: reportTitle, // Pass the original report title
      industry: realIndustry,
      companySize: realCompanySize,
      employeeCount: realEmployeeCount,
      companyType: realCompanyType,
      website: realCompanyWebsite,
      location: realCompanyLocation,
      data: {
        marketSize: 150000,
        growthRate: 12,
        marketShare: 23,
        competitivePosition: "Leader",
        customerSatisfaction: 8.9,
        revenueGrowth: 15,
        digitalSales: 67,
        customerAcquisitionCost: 1250,
        systemHealth: 94,
        securityScore: 89,
        automationLevel: 76,
        competitors: [
          { name: "TechCorp", marketShare: 28 },
          { name: "InnovateCo", marketShare: 22 },
          { name: "GrowthTech", marketShare: 18 },
        ],
        trends: [
          "AI/ML Integration",
          "Cloud Migration",
          "Digital Transformation",
          "Automation Adoption",
        ],
        threats: [
          "Increased competition",
          "Technology disruption",
          "Regulatory changes",
        ],
        opportunities: [
          "Market expansion",
          "Technology innovation",
          "Strategic partnerships",
        ],
        swotAnalysis: {
          strengths: [
            "Market Leadership",
            "Technology Innovation",
            "Customer Satisfaction",
          ],
          weaknesses: [
            "High Customer Acquisition Cost",
            "Limited Geographic Presence",
            "Technology Debt",
          ],
          opportunities: [
            "International Expansion",
            "AI/ML Integration",
            "Strategic Acquisitions",
          ],
          threats: [
            "Competitive Pressure",
            "Technology Disruption",
            "Economic Uncertainty",
          ],
        },
        marketExpansion: [
          "North American Markets",
          "European Expansion",
          "Asia-Pacific Growth",
        ],
        growthDrivers: [
          "Product Innovation",
          "Market Expansion",
          "Strategic Partnerships",
        ],
        scalingChallenges: [
          "Talent Acquisition",
          "Infrastructure Scaling",
          "Regulatory Compliance",
        ],
        recommendations: [
          {
            action: "Implement AI-powered analytics",
            priority: "high" as const,
            impact: "25% efficiency improvement",
            timeline: "3 months",
          },
          {
            action: "Expand cloud infrastructure",
            priority: "medium" as const,
            impact: "30% cost reduction",
            timeline: "6 months",
          },
        ],
      },
      onBack: handleBackFromReport,
    };

    // Render appropriate report component based on type
    if (activeReport.includes("industry")) {
      return <IndustryDeepReport {...reportProps} />;
    } else if (activeReport.includes("competitive")) {
      return <CompetitiveDeepReport {...reportProps} />;
    } else if (activeReport.includes("growth")) {
      return <GrowthDeepReport {...reportProps} />;
    } else if (activeReport.includes("tech")) {
      return <TechDeepReport {...reportProps} />;
    }
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <>
            {/* Dynamic Pipeline Progress */}
            <div className="mb-8">
              <div className="bg-background p-4 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">Pipeline Progress</h3>
                <div className="text-sm text-muted">
                  Pipeline tracking temporarily unavailable
                </div>
              </div>
            </div>

            {/* At a Glance */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                At a Glance
              </h2>
              <div className="flex flex-wrap gap-4">
                <div className="bg-background border border-border rounded-lg p-4 min-w-[180px]">
                  <div className="font-semibold text-muted mb-1">Role</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(enhancedPerson.buyerGroupRole || "Stakeholder")}`}>
                    {enhancedPerson.buyerGroupRole || "Stakeholder"}
                  </span>
                </div>
                <div className="bg-background border border-border rounded-lg p-4 min-w-[180px]">
                  <div className="font-semibold text-muted mb-1">Last Engagement</div>
                  <div className="text-lg text-foreground">
                    {enhancedPerson.lastContact ? formatRelativeDate(enhancedPerson.lastContact.toISOString()) : "-"}
                  </div>
                </div>
                <div className="bg-background border border-border rounded-lg p-4 min-w-[180px]">
                  <div className="font-semibold text-muted mb-1">Next Step</div>
                  <div className="text-lg text-foreground">
                    {enhancedPerson.nextAction || "Schedule follow-up call"}
                  </div>
                </div>
              </div>
            </div>

            {/* Main info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted">
                      Name
                    </label>
                    <div className="mt-1">
                      <InlineEditField
                        value={enhancedPerson.fullName || enhancedPerson.name || ""}
                        field="fullName"
                        recordId={person.id || ''}
                        recordType="people"
                        placeholder="Enter full name"
                        onSave={handlePersonSave}
                        className="text-lg text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted">
                      Title
                    </label>
                    <div className="mt-1">
                      <InlineEditField
                        value={enhancedPerson.jobTitle || enhancedPerson.title || ""}
                        field="jobTitle"
                        recordId={person.id || ''}
                        recordType="people"
                        placeholder="Enter job title"
                        onSave={handlePersonSave}
                        className="text-lg text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted">
                      Email
                    </label>
                    <div className="mt-1">
                      <InlineEditField
                        value={enhancedPerson.workEmail || enhancedPerson.email || ""}
                        field="email"
                        recordId={person.id || ''}
                        recordType="people"
                        inputType="email"
                        placeholder="Enter email address"
                        onSave={handlePersonSave}
                        className="text-lg text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted">
                      Phone
                    </label>
                    <div className="mt-1">
                      <InlineEditField
                        value={enhancedPerson.phone || ""}
                        field="phone"
                        recordId={person.id || ''}
                        recordType="people"
                        inputType="tel"
                        placeholder="Enter phone number"
                        onSave={handlePersonSave}
                        className="text-lg text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted">
                      LinkedIn Profile
                    </label>
                    <div className="mt-1">
                      <InlineEditField
                        value={enhancedPerson.linkedinUrl || ""}
                        field="linkedinUrl"
                        recordId={person.id || ''}
                        recordType="people"
                        placeholder="Enter LinkedIn URL"
                        onSave={handlePersonSave}
                        className="text-lg text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted">
                      LinkedIn Navigator
                    </label>
                    <div className="mt-1">
                      <InlineEditField
                        value={enhancedPerson.linkedinNavigatorUrl || ""}
                        field="linkedinNavigatorUrl"
                        recordId={person.id || ''}
                        recordType="people"
                        placeholder="Enter LinkedIn Navigator URL"
                        onSave={handlePersonSave}
                        className="text-lg text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted">
                      LinkedIn Connection Date
                    </label>
                    <div className="mt-1">
                      <InlineEditField
                        value={enhancedPerson.linkedinConnectionDate ? new Date(enhancedPerson.linkedinConnectionDate).toISOString().split('T')[0] : ""}
                        field="linkedinConnectionDate"
                        recordId={person.id || ''}
                        recordType="people"
                        placeholder="YYYY-MM-DD"
                        onSave={handlePersonSave}
                        className="text-lg text-foreground"
                        inputType="date"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted">
                      College
                    </label>
                    <p className="mt-1 text-lg text-foreground">
                      {person.department || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Lead Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted">
                      Status
                    </label>
                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
                        person['status'] === "prospect"
                          ? "bg-[#ffc107] text-black"
                          : person['status'] === "contacted"
                            ? "bg-[#2563EB] text-white"
                            : person['status'] === "qualified"
                              ? "bg-[#2563EB] text-white"
                              : "bg-[#2563EB] text-white"
                      }`}
                    >
                      Opportunity
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted">
                      Source
                    </label>
                    <p className="mt-1 text-lg text-foreground">
                      Monaco Intelligence
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted">
                      Company
                    </label>
                    <p 
                      className="mt-1 text-lg font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer"
                      onClick={() => onCompanyClick?.(person.company || "ADP")}
                    >
                      {person.company || "ADP"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted">
                      Created At
                    </label>
                    <p className="mt-1 text-lg text-foreground">
                      {person.lastContact ? formatRelativeDate(person.lastContact) : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Wants and Needs */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="space-y-2">
                <div className="text-xl font-semibold text-foreground mb-1 flex items-center gap-2">
                  Wants
                </div>
                <div className="text-lg text-foreground">
                  {generatePersonalWants(person)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xl font-semibold text-foreground mb-1 flex items-center gap-2">
                  Needs
                </div>
                <div className="text-lg text-foreground">
                  {generatePersonalNeeds(person)}
                </div>
              </div>
            </div>

            {/* Deep Value Reports */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Deep Value Reports
              </h2>
              {isLoadingReports ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
                  <span className="ml-2 text-muted">
                    Generating personalized reports...
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dynamicReports.map((idea, index) => (
                    <div
                      key={index}
                      className="bg-background border border-border rounded-lg p-4 hover:border-[#2563EB] transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {idea.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted mb-4">
                        {idea.description}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReportClick(`${idea.title}|${idea.type}-mini`)}
                          className="text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer bg-none border-none p-0 hover:underline"
                        >
                          Mini Report
                        </button>
                        <button
                          onClick={() => handleReportClick(`${idea.title}|${idea.type}-deep`)}
                          className="text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors cursor-pointer bg-none border-none p-0 hover:underline"
                        >
                          Deep Value Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        );

      case "Insights":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              Professional Insights
            </h2>
            
            {/* Decision Power and Influence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-background border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Decision Power
                </h3>
                <div className="text-3xl font-bold text-foreground mb-2">
                  {person.decisionPower || 75}/100
                </div>
                <p className="text-sm text-muted">
                  Influence level in purchasing decisions
                </p>
              </div>
              <div className="bg-background border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Influence Level
                </h3>
                <div className="text-2xl font-bold text-foreground mb-2">
                  {person.influenceLevel || "Medium"}
                </div>
                <p className="text-sm text-muted">
                  Organizational influence rating
                </p>
              </div>
            </div>

            {/* Buyer Group Analysis */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Buyer Group Analysis
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted">
                    Role in Buyer Group
                  </label>
                  <p className="text-foreground">{enhancedPerson.buyerGroupRole || "Stakeholder"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">
                    Active Buyer Groups
                  </label>
                  <p className="text-foreground">{person.activeBuyerGroups || "1/1"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">
                    Engagement Strategy
                  </label>
                  <p className="text-foreground">
                    {enhancedPerson['buyerGroupRole'] === "Decision Maker" ? "Focus on executive-level value propositions and ROI demonstrations" : 
                     enhancedPerson['buyerGroupRole'] === "Champion" ? "Provide technical validation and implementation support" : 
                     enhancedPerson['buyerGroupRole'] === "Blocker" ? "Address concerns and focus on risk mitigation" : 
                     "Build stakeholder alignment and consensus"}
                  </p>
                </div>
              </div>
            </div>

            {/* Persona Profile */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Persona Profile
              </h3>
              <div className="space-y-4">
                {/* Persona Vector Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Direct (High) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">Direct</span>
                      <span className="text-sm font-bold text-foreground">85/100</span>
                    </div>
                    <div className="w-full bg-loading-bg rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                    <p className="text-xs text-muted">Efficiency-Driven Decision-Maker</p>
                  </div>

                  {/* Chatty (High) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">Chatty</span>
                      <span className="text-sm font-bold text-foreground">78/100</span>
                    </div>
                    <div className="w-full bg-loading-bg rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "78%" }}></div>
                    </div>
                    <p className="text-xs text-muted">Engaging Relationship-Builder</p>
                  </div>

                  {/* Rule-Follower (High) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">Rule-Follower</span>
                      <span className="text-sm font-bold text-foreground">82/100</span>
                    </div>
                    <div className="w-full bg-loading-bg rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "82%" }}></div>
                    </div>
                    <p className="text-xs text-muted">Process-Oriented Analyst</p>
                  </div>

                  {/* Friendly (Low) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">Friendly</span>
                      <span className="text-sm font-bold text-foreground">35/100</span>
                    </div>
                    <div className="w-full bg-loading-bg rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "35%" }}></div>
                    </div>
                    <p className="text-xs text-muted">Collaborative and People-Oriented</p>
                  </div>
                </div>

                {/* Persona Summary */}
                <div className="bg-panel-background/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Persona Summary</h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {enhancedPerson['buyerGroupRole'] === "Decision Maker" 
                      ? "Highly direct and process-oriented leader who values efficiency and structured communications. Prefers data-driven conversations with clear ROI metrics. Moderate relationship-building orientation."
                      : enhancedPerson['buyerGroupRole'] === "Champion"
                      ? "Balanced communicator who appreciates both analytical depth and engaging dialogue. Strong rule-following tendencies make them reliable advocates. Moderately relationship-focused."
                      : "Detail-oriented professional who favors systematic approaches and clear processes. Values direct communication while maintaining some collaborative elements."
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Communication Style */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Communication Style & Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Preferred Format */}
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Content Format
                    </label>
                    <p className="text-foreground">
                      {enhancedPerson['buyerGroupRole'] === "Decision Maker" 
                        ? "Bullet points with clear ROI metrics" 
                        : enhancedPerson['buyerGroupRole'] === "Champion"
                        ? "Detailed technical documentation with visuals"
                        : "Structured bullet points with supporting data"
                      }
                    </p>
                  </div>

                  {/* Communication Tone */}
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Preferred Tone
                    </label>
                    <p className="text-foreground">
                      {enhancedPerson['buyerGroupRole'] === "Decision Maker"
                        ? "Direct, business-focused, results-oriented"
                        : enhancedPerson['buyerGroupRole'] === "Champion" 
                        ? "Professional yet engaging, solution-focused"
                        : "Consultative, analytical, process-driven"
                      }
                    </p>
                  </div>

                  {/* Information Depth */}
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Information Depth
                    </label>
                    <p className="text-foreground">
                      {enhancedPerson['buyerGroupRole'] === "Decision Maker"
                        ? "Executive summary with key metrics"
                        : enhancedPerson['buyerGroupRole'] === "Champion"
                        ? "Comprehensive technical details"
                        : "Moderate detail with clear process steps"
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Preferred Channel */}
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Preferred Channel
                    </label>
                    <p className="text-foreground">
                      {enhancedPerson['buyerGroupRole'] === "Decision Maker" ? "Phone calls for decisions, email for updates" : 
                       enhancedPerson['buyerGroupRole'] === "Champion" ? "Email with detailed attachments" : 
                       "LinkedIn messaging with follow-up emails"}
                    </p>
                  </div>

                  {/* Decision Factors */}
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Key Decision Factors
                    </label>
                    <p className="text-foreground">
                      {enhancedPerson['buyerGroupRole'] === "Decision Maker"
                        ? "ROI, implementation timeline, risk mitigation"
                        : enhancedPerson['buyerGroupRole'] === "Champion"
                        ? "Technical fit, team adoption, support quality"
                        : "Process alignment, compliance, vendor stability"
                      }
                    </p>
                  </div>

                  {/* Meeting Preferences */}
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Meeting Style
                    </label>
                    <p className="text-foreground">
                      {enhancedPerson['buyerGroupRole'] === "Decision Maker"
                        ? "Agenda-driven, time-boxed discussions"
                        : enhancedPerson['buyerGroupRole'] === "Champion"
                        ? "Interactive demos with Q&A sessions"
                        : "Structured presentations with documentation"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Communication Do's and Don'ts */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">✅ Communication Do's</h4>
                  <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                    <li>• Lead with clear value proposition</li>
                    <li>• Use data-driven insights and metrics</li>
                    <li>• Provide structured, logical flow</li>
                    <li>• Include specific implementation details</li>
                  </ul>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">❌ Communication Don'ts</h4>
                  <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                    <li>• Avoid lengthy relationship building</li>
                    <li>• Don't overwhelm with emotional appeals</li>
                    <li>• Skip vague or abstract concepts</li>
                    <li>• Minimize social small talk</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "Buyer Group":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              Buyer Group Overview
            </h2>
            
            {/* Buyer Group Status */}
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Group Status
                  </h3>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    Active
                  </div>
                  <p className="text-sm text-muted">
                    Currently evaluating solutions
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Stage
                  </h3>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    Technical Evaluation
                  </div>
                  <p className="text-sm text-muted">
                    Reviewing technical requirements
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Members
                  </h3>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {person['company'] === "ADP" ? "7" : "5"} People
                  </div>
                  <p className="text-sm text-muted">
                    Stakeholders identified
                  </p>
                </div>
              </div>
            </div>

            {/* Buyer Group Members */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Key Stakeholders
              </h3>
              {intelligenceLoading ? (
                <div className="text-center py-4">
                  <div className="text-sm text-muted">Loading stakeholder data...</div>
                </div>
              ) : intelligenceError ? (
                <div className="text-center py-4">
                  <div className="text-sm text-red-600">Error loading stakeholder data</div>
                </div>
              ) : intelligence.stakeholders.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {intelligence.stakeholders.map((stakeholder, index) => (
                    <div
                      key={stakeholder.id || index}
                      className="bg-background border border-border rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors"
                      onClick={() => {
                        console.log(`Navigating to profile for ${stakeholder.name}`);
                        // This would navigate to the person's profile
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-foreground mb-1">
                            {stakeholder.name}
                          </h4>
                          <p className="text-sm text-muted mb-2">
                            {stakeholder.title}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-hover text-foreground">
                            {stakeholder.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-hover text-foreground">
                          {stakeholder.role}
                        </span>
                        <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-sm text-muted">No stakeholder data available</div>
                </div>
              )}
            </div>

            {/* Engagement Strategy */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Engagement Strategy
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Next Steps</h4>
                  <ul className="space-y-2 text-sm text-muted">
                    <li>• Schedule technical demo with engineering team</li>
                    <li>• Address security concerns with infrastructure team</li>
                    <li>• Provide ROI analysis for executive stakeholders</li>
                    <li>• Create implementation timeline for procurement review</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Key Messages</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-sm">For Decision Makers:</span>
                      <p className="text-sm text-muted">Focus on strategic value and competitive advantage</p>
                    </div>
                    <div>
                      <span className="font-medium text-sm">For Champions:</span>
                      <p className="text-sm text-muted">Emphasize technical capabilities and ease of implementation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "Profile":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              Professional Profile
            </h2>
            
            {/* Personal Information */}
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted">
                        Full Name
                      </label>
                      <p className="text-foreground">{enhancedPerson.fullName || enhancedPerson.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted">
                        Job Title
                      </label>
                      <p className="text-foreground">{enhancedPerson.jobTitle || enhancedPerson.title || "Technology Executive"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted">
                        Email
                      </label>
                      <p className="text-foreground">{enhancedPerson.workEmail || enhancedPerson.email || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted">
                        Phone
                      </label>
                      <p className="text-foreground">{enhancedPerson.phone || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted">
                        Location
                      </label>
                      <p className="text-foreground">{enhancedPerson['city'] && enhancedPerson.state ? `${enhancedPerson.city}, ${enhancedPerson.state}` : enhancedPerson.location || "-"}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Professional Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted">
                        Department
                      </label>
                      <p className="text-foreground">{enhancedPerson.department || "Technology"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted">
                        Seniority Level
                      </label>
                      <p className="text-foreground">{enhancedPerson.seniority || "Senior"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted">
                        Company
                      </label>
                      <p className="text-foreground">{enhancedPerson.company || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted block mb-1">
                        Buyer Group Role
                      </label>
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-hover text-foreground">
                        {enhancedPerson.buyerGroupRole || "Stakeholder"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social and Professional Links */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Online Presence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted">
                    LinkedIn Profile
                  </label>
                  {enhancedPerson.linkedinUrl ? (
                    <a
                      href={enhancedPerson.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-muted hover:text-gray-700 hover:underline transition-colors"
                    >
                      View LinkedIn Profile
                    </a>
                  ) : (
                    <p className="text-muted">-</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">
                    LinkedIn Navigator
                  </label>
                  {enhancedPerson.linkedinNavigatorUrl ? (
                    <a
                      href={enhancedPerson.linkedinNavigatorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-muted hover:text-gray-700 hover:underline transition-colors"
                    >
                      View LinkedIn Navigator
                    </a>
                  ) : (
                    <p className="text-muted">-</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">
                    LinkedIn Connection Date
                  </label>
                  <p className="text-foreground">
                    {enhancedPerson.linkedinConnectionDate ? 
                      new Date(enhancedPerson.linkedinConnectionDate).toLocaleDateString() : 
                      '-'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">
                    Professional Status
                  </label>
                  <p className="text-foreground">{person.status || "Active"}</p>
                </div>
              </div>
            </div>

            {/* Engagement Summary */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Engagement Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted">
                    Last Contact
                  </label>
                  <p className="text-foreground">
                    {person.lastContact ? formatRelativeDate(person.lastContact) : "No recent contact"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">
                    Active Buyer Groups
                  </label>
                  <p className="text-foreground">{person.activeBuyerGroups || "1/1"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">
                    Lead Source
                  </label>
                  <p className="text-foreground">Monaco Intelligence</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "Career":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              Career Intelligence
            </h2>
            
            {/* Current Position & Trajectory */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Current Position & Growth Trajectory
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Current Position
                    </label>
                    <p className="text-lg text-foreground">
                      {enhancedPerson.jobTitle ? `${enhancedPerson.jobTitle} at ` : ''}{enhancedPerson.company || "ADP"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Department
                    </label>
                    <p className="text-lg text-foreground">
                      {enhancedPerson.department || "Technology"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Seniority Level
                    </label>
                    <p className="text-lg text-foreground">
                      {enhancedPerson.seniority || "Senior"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Career Stage
                    </label>
                    <p className="text-foreground">
                      {enhancedPerson['seniority'] === "C-Level" ? "Executive Leadership" : 
                       enhancedPerson['seniority'] === "VP" ? "Senior Management" : 
                       enhancedPerson['seniority'] === "Director" ? "Middle Management" : 
                       enhancedPerson['seniority'] === "Manager" ? "Team Leadership" : 
                       "Individual Contributor"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Promotion Potential
                    </label>
                    <p className="text-foreground">
                      {person['seniority'] === "C-Level" ? "Board/Advisory roles" : 
                       person['seniority'] === "VP" ? "C-Suite ready" : 
                       person['seniority'] === "Director" ? "VP track" : 
                       "Director track"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Estimated Tenure
                    </label>
                    <p className="text-foreground">2-3 years</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Achievements */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Professional Achievements & Motivations
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted">
                    Key Achievements
                  </label>
                  <ul className="text-foreground list-disc list-inside space-y-1">
                    {enhancedPerson['experience'] && enhancedPerson.experience.length > 0 ? (
                      enhancedPerson.experience.map((exp: any, index: number) => (
                        <li key={index}>{exp.achievement || exp.description || `${exp.title} at ${exp.company}`}</li>
                      ))
                    ) : (
                      <>
                        <li>Led digital transformation initiatives</li>
                        <li>Managed cross-functional teams of 10+ people</li>
                        <li>Delivered projects 20% under budget</li>
                        <li>Implemented security protocols across organization</li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">
                    Career Motivations
                  </label>
                  <p className="text-foreground">
                    {enhancedPerson['buyerGroupRole'] === "Decision Maker" ? "Strategic impact, organizational growth, innovation leadership" : 
                     enhancedPerson['buyerGroupRole'] === "Champion" ? "Technical excellence, process optimization, team empowerment" : 
                     enhancedPerson['buyerGroupRole'] === "Blocker" ? "Risk mitigation, compliance, organizational stability" : 
                     "Professional growth, skill development, team collaboration"}
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Network & Influence */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Network & Industry Influence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Industry Connections
                    </label>
                    <p className="text-foreground">500+ LinkedIn connections</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Speaking Engagements
                    </label>
                    <p className="text-foreground">2-3 conferences annually</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Publications
                    </label>
                    <p className="text-foreground">Industry thought leadership</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Peer Recognition
                    </label>
                    <p className="text-foreground">Industry awards recipient</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Mentorship
                    </label>
                    <p className="text-foreground">Mentors 3-5 junior professionals</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Board Positions
                    </label>
                    <p className="text-foreground">
                      {enhancedPerson['seniority'] === "C-Level" ? "Multiple advisory roles" : "None currently"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Career Transition Insights */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Career Transition Insights
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted">
                    Job Change Likelihood
                  </label>
                  <p className="text-foreground">
                    {enhancedPerson['seniority'] === "C-Level" ? "Low (focused on current role)" : 
                     enhancedPerson['seniority'] === "VP" ? "Medium (exploring opportunities)" : 
                     "High (career advancement focused)"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">
                    Decision Timeline
                  </label>
                  <p className="text-foreground">
                    {enhancedPerson['buyerGroupRole'] === "Decision Maker" ? "3-6 months (strategic planning)" : 
                     enhancedPerson['buyerGroupRole'] === "Champion" ? "1-3 months (technical evaluation)" : 
                     "6-12 months (consensus building)"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">
                    Budget Influence
                  </label>
                  <p className="text-foreground">
                    {person['seniority'] === "C-Level" ? "Direct budget authority ($1M+)" : 
                     person['seniority'] === "VP" ? "Significant influence ($500K+)" : 
                     person['seniority'] === "Director" ? "Department budget ($100K+)" : 
                     "Limited budget influence"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "Company":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              Company Information
            </h2>
            
            {companyLoading ? (
              <div className="text-center py-8">
                <div className="text-sm text-muted">Loading company data...</div>
              </div>
            ) : companyError ? (
              <div className="text-center py-8">
                <div className="text-sm text-red-600">Error loading company data: {companyError}</div>
              </div>
            ) : !companyData ? (
              <div className="text-center py-8">
                <div className="text-sm text-muted">No company data available for "{enhancedPerson.company}"</div>
              </div>
            ) : (
              <>
                {/* Company Overview */}
                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Company Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted">
                          Company Name
                        </label>
                        <p className="text-lg text-foreground">
                          {companyData.name || enhancedPerson.company || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted">
                          Industry
                        </label>
                        <p className="text-lg text-foreground">
                          {companyData.industry || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted">
                          Total Employees
                        </label>
                        <p className="text-lg text-foreground">
                          {companyData.employeeCount ? `${companyData.employeeCount.toLocaleString()}+ employees` :
                           companyData.size || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted">
                          Annual Revenue
                        </label>
                        <p className="text-lg text-foreground">
                          {companyData.revenue || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted">
                          HQ Location
                        </label>
                        <p className="text-lg text-foreground">
                          {companyData.hqLocation || 
                           (companyData.hqCity && companyData.hqState ? `${companyData.hqCity}, ${companyData.hqState}` : null) ||
                           companyData.hqCity || 
                           "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted">
                          Founded
                        </label>
                        <p className="text-lg text-foreground">
                          {companyData.foundedYear ? `${companyData.foundedYear} (${new Date().getFullYear() - companyData.foundedYear} years)` : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted">
                          Stock Symbol
                        </label>
                        <p className="text-lg text-foreground">
                          {companyData.stockSymbol || (companyData.isPublic ? "Public Company" : "Private Company")}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted">
                          Website
                        </label>
                        <p className="text-lg text-foreground">
                          {companyData.website ? (
                            <a 
                              href={companyData.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {companyData.website.replace(/^https?:\/\//, '')}
                            </a>
                          ) : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {companyData.description && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <label className="text-sm font-medium text-muted">
                        Description
                      </label>
                      <p className="text-foreground mt-1">
                        {companyData.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Technology Stack - Only show if we have data */}
                {companyData.techStack && companyData.techStack.length > 0 && (
                  <div className="bg-background border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Technology Stack
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {companyData.techStack.map((tech, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-hover text-foreground rounded-full text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Business Challenges & Opportunities - Only show if we have data */}
                {(companyData.businessChallenges && companyData.businessChallenges.length > 0) || 
                 (companyData.businessPriorities && companyData.businessPriorities.length > 0) ||
                 (companyData.competitiveAdvantages && companyData.competitiveAdvantages.length > 0) ||
                 (companyData.growthOpportunities && companyData.growthOpportunities.length > 0) ? (
                  <div className="bg-background border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Business Intelligence
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {companyData.businessChallenges && companyData.businessChallenges.length > 0 && (
                        <div>
                          <h4 className="font-medium text-red-600 mb-3">Key Challenges</h4>
                          <div className="space-y-3">
                            {companyData.businessChallenges.map((challenge, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                                <p className="text-sm text-foreground">{challenge}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {companyData.growthOpportunities && companyData.growthOpportunities.length > 0 && (
                        <div>
                          <h4 className="font-medium text-green-600 mb-3">Growth Opportunities</h4>
                          <div className="space-y-3">
                            {companyData.growthOpportunities.map((opportunity, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                                <p className="text-sm text-foreground">{opportunity}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        );


            

      case "History":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              Engagement Timeline
            </h2>
            
            {/* Engagement Overview */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Engagement Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {enhancedPerson.interactionHistory ? enhancedPerson.interactionHistory.length : (enhancedPerson.lastContact ? "5" : "0")}
                  </div>
                  <p className="text-sm text-muted">Total Interactions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {enhancedPerson.lastContact ? formatRelativeDate(enhancedPerson.lastContact.toISOString()) : "Never"}
                  </div>
                  <p className="text-sm text-muted">Last Contact</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {enhancedPerson['status'] === "qualified" ? "Hot" : enhancedPerson['status'] === "contacted" ? "Warm" : "Cold"}
                  </div>
                  <p className="text-sm text-muted">Engagement Temperature</p>
                </div>
              </div>
            </div>

            {/* Interaction Timeline */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Recent Interactions
              </h3>
              <div className="space-y-4">
                {enhancedPerson['interactionHistory'] && enhancedPerson.interactionHistory.length > 0 ? (
                  enhancedPerson.interactionHistory.map((interaction: any, index: number) => (
                    <EmailInteractionItem
                      key={index}
                      subject={interaction.subject || "Interaction"}
                      date={interaction.date || (enhancedPerson.lastContact ? enhancedPerson.lastContact.toISOString() : new Date().toISOString())}
                      status={interaction.status || "Completed"}
                      preview={interaction.preview || interaction.description || "Interaction details"}
                      fullContent={interaction.fullContent || interaction.description || `Interaction with ${enhancedPerson.fullName}`}
                    />
                  ))
                ) : enhancedPerson.lastContact ? (
                  <>
                    {/* Email Interaction with Expandable Content */}
                    <EmailInteractionItem
                      subject="Initial introduction and value proposition"
                      date={enhancedPerson.lastContact ? enhancedPerson.lastContact.toISOString() : new Date().toISOString()}
                      status="Opened"
                      preview="Hi {{firstName}}, I noticed your work at {{company}} and thought you might be interested in our solutions for..."
                      fullContent={`Hi ${enhancedPerson.fullName?.split(' ')[0] || 'there'},

I noticed your work at ${enhancedPerson.company} and thought you might be interested in our solutions for retail fixtures and optimization.

Our platform has helped companies like yours:
- Reduce inventory restocking time by 40%
- Improve product visibility and sales
- Streamline fixture management processes

Would you be open to a brief 15-minute conversation about how this might benefit ${enhancedPerson.company}?

Best regards,
Dan Mirolli
Retail Product Solutions`}
                    />
                    
                    {/* LinkedIn Interaction */}
                    <div className="flex items-start gap-4 p-3 bg-hover rounded-lg">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-foreground">LinkedIn Connection</h4>
                          <span className="text-sm text-muted">3 days ago</span>
                        </div>
                        <p className="text-sm text-muted">
                          Connected on LinkedIn with personalized message
                        </p>
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Accepted
                        </span>
                      </div>
                    </div>

                    {/* Follow-up Email with Expandable Content */}
                    <EmailInteractionItem
                      subject="Follow-up: Retail optimization discussion"
                      date={new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()}
                      status="Sent"
                      preview="Following up on my previous message about retail fixtures optimization..."
                      fullContent={`Hi ${person.name?.split(' ')[0] || 'there'},

Following up on my previous message about retail fixtures optimization for ${person.company}.

I wanted to share a quick case study from a similar company that achieved:
- 35% reduction in restocking labor costs
- 22% increase in product turnover
- Improved customer shopping experience

The implementation was straightforward and paid for itself within 3 months.

Would next Tuesday or Wednesday work for a brief call?

Best,
Dan`}
                    />
                    <div className="flex items-start gap-4 p-3 bg-hover rounded-lg">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-foreground">LinkedIn Connection</h4>
                          <span className="text-sm text-muted">3 days ago</span>
                        </div>
                        <p className="text-sm text-muted">
                          Connected on LinkedIn with personalized message
                        </p>
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Accepted
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-3 bg-hover rounded-lg">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-foreground">Meeting Scheduled</h4>
                          <span className="text-sm text-muted">1 week ago</span>
                        </div>
                        <p className="text-sm text-muted">
                          Discovery call scheduled for next week
                        </p>
                        <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          Upcoming
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted">No interactions recorded yet</p>
                    <button className="mt-4 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors">
                      Log First Interaction
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Communication Preferences */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Communication Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Response Rate
                    </label>
                    <p className="text-foreground">
                      {person.lastContact ? "75%" : "No data"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Preferred Channel
                    </label>
                    <p className="text-foreground">
                      {enhancedPerson['buyerGroupRole'] === "Decision Maker" ? "Phone calls" : 
                       enhancedPerson['buyerGroupRole'] === "Champion" ? "Email" : 
                       "LinkedIn messaging"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Best Time to Contact
                    </label>
                    <p className="text-foreground">
                      {person['seniority'] === "C-Level" ? "Early morning (8-9 AM)" : 
                       person['seniority'] === "VP" ? "Mid-morning (10-11 AM)" : 
                       "Afternoon (2-4 PM)"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Average Response Time
                    </label>
                    <p className="text-foreground">
                      {person['seniority'] === "C-Level" ? "2-3 days" : 
                       person['seniority'] === "VP" ? "1-2 days" : 
                       "Same day"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Meeting Preference
                    </label>
                    <p className="text-foreground">
                      {enhancedPerson['buyerGroupRole'] === "Decision Maker" ? "Executive briefing (30 min)" : 
                       enhancedPerson['buyerGroupRole'] === "Champion" ? "Technical demo (45 min)" : 
                       "Discovery call (15 min)"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Follow-up Frequency
                    </label>
                    <p className="text-foreground">
                      {person['seniority'] === "C-Level" ? "Monthly" : 
                       person['seniority'] === "VP" ? "Bi-weekly" : 
                       "Weekly"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-background border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Recommended Next Steps
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#2563EB] rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">
                      {enhancedPerson['buyerGroupRole'] === "Decision Maker" ? "Schedule Executive Briefing" : 
                       enhancedPerson['buyerGroupRole'] === "Champion" ? "Provide Technical Demo" : 
                       enhancedPerson['buyerGroupRole'] === "Blocker" ? "Address Security Concerns" : 
                       "Discovery Call"}
                    </h4>
                    <p className="text-sm text-muted">
                      {enhancedPerson['buyerGroupRole'] === "Decision Maker" ? "Present strategic value and ROI" : 
                       enhancedPerson['buyerGroupRole'] === "Champion" ? "Show technical capabilities and integration" : 
                       enhancedPerson['buyerGroupRole'] === "Blocker" ? "Discuss compliance and risk mitigation" : 
                       "Understand needs and challenges"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#2563EB] rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Connect with Key Stakeholders</h4>
                    <p className="text-sm text-muted">
                      Introduce other buyer group members to build consensus
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#2563EB] rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Proposal Development</h4>
                    <p className="text-sm text-muted">
                      Create customized proposal addressing their specific needs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "Notes":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              Notes & Observations
            </h2>
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Add Note
                  </label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your note here..."
                    className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    rows={3}
                  />
                  <button
                    onClick={addNote}
                    className="mt-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
                  >
                    Add Note
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-3">
                    Previous Notes
                  </h3>
                  {notes['length'] === 0 ? (
                    <p className="text-muted">No notes yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {notes.map((note, index) => (
                        <div key={index} className="p-3 bg-hover rounded-lg">
                          <p className="text-foreground">{note}</p>
                          <p className="text-xs text-muted mt-1">
                            Just now
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // 🚀 PERFORMANCE: Show loading skeleton while component initializes
  if (isInitialLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto invisible-scrollbar p-4">
          <div className="w-full px-0">
            {/* Loading skeleton */}
            <div className="animate-pulse">
              <div className="flex items-center justify-between mt-2 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-loading-bg rounded-full"></div>
                  <div>
                    <div className="h-6 bg-loading-bg rounded w-48 mb-2"></div>
                    <div className="h-4 bg-loading-bg rounded w-32"></div>
                  </div>
                </div>
                <div className="h-8 bg-loading-bg rounded w-20"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-loading-bg rounded w-full"></div>
                <div className="h-4 bg-loading-bg rounded w-3/4"></div>
                <div className="h-4 bg-loading-bg rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto invisible-scrollbar p-4">
        <div className="w-full px-0">
          {/* Header */}
          <div className="flex items-center justify-between mt-2 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Back
              </button>
              <div className="h-6 w-px bg-border"></div>
              <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-hover rounded-lg flex items-center justify-center text-foreground font-semibold text-lg border border-border">
                {getInitials(person.name)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {person.name}
                  </h1>
                  <p className="text-muted">
                    {person.title || ''}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Navigation Controls - Show only for Speedrun */}
            {sourceSection === "rtp" && currentIndex !== undefined && totalRecords !== undefined && (
              <div className="flex items-center gap-3">
                {/* Record Counter */}
                <span className="text-sm text-muted">
                  {currentIndex + 1} of {totalRecords}
                </span>
                
                {/* Navigation Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={onPrevious}
                    disabled={currentIndex === 0}
                    className={`px-3 py-2 rounded-lg border font-medium transition-colors ${
                      currentIndex === 0 
                        ? 'bg-panel-background text-gray-300 border-border cursor-not-allowed' 
                        : 'bg-hover text-gray-700 border-border hover:bg-loading-bg hover:text-foreground'
                    }`}
                    title="Previous record"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onNext}
                    disabled={currentIndex === totalRecords - 1}
                    className={`px-3 py-2 rounded-lg border font-medium transition-colors ${
                      currentIndex === totalRecords - 1 
                        ? 'bg-panel-background text-gray-300 border-border cursor-not-allowed' 
                        : 'bg-hover text-gray-700 border-border hover:bg-loading-bg hover:text-foreground'
                    }`}
                    title="Next record"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Completed Button */}
                <button
                  onClick={onMarkCompleted}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    isCompleted
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-hover text-gray-700 border-border hover:bg-loading-bg'
                  }`}
                  title={isCompleted ? "Completed" : createTooltipWithShortcut("Mark as completed", ['⌘+Enter', 'Ctrl+Enter'])}
                >
                  <div className="flex items-center gap-2">
                    <span>{isCompleted ? 'Completed' : 'Complete'}</span>
                    {!isCompleted && (
                      <Kbd variant="gray" size="sm">{formatShortcutForDisplay(['⌘⏎', 'Ctrl+Enter'])}</Kbd>
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div
            className="flex gap-2 mb-0 pb-2 border-b border-border"
            style={{
              borderColor: "var(--border)",
              marginTop: "-18px",
              borderBottomWidth: "1px",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-5 py-2 text-base font-semibold rounded-t-lg transition-colors focus:outline-none
                  ${
                    activeTab === tab
                      ? "bg-background border-x border-t border-border text-foreground z-10"
                      : "text-muted dark:text-muted hover:text-blue-600 dark:hover:text-blue-400 border border-transparent"
                  }
                `}
                style={{
                  borderBottom: activeTab === tab ? "none" : "none",
                  borderColor:
                    activeTab === tab ? "var(--border)" : "transparent",
                  marginBottom: activeTab === tab ? "-1px" : "0",
                  position: "relative",
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-background rounded-b-xl border-b border-border shadow-sm pt-0 px-6 pb-6 w-full min-h-[400px] -mt-2">
            <div className="pt-6">{renderTabContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
