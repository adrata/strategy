/**
 * 🏢 DEPARTMENTAL STANDALONE APPS
 * Complete enterprise operating system with inter-app collaboration
 */

import React from "react";
import {
  EyeIcon,
  ChartBarIcon,
  MicrophoneIcon,
  SparklesIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  UserGroupIcon,
  MegaphoneIcon,
  ArrowTrendingUpIcon,
  BuildingLibraryIcon,
  UsersIcon,
  CommandLineIcon,
  ShieldCheckIcon,
  CubeIcon,
  CodeBracketIcon,
  MapIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  MoonIcon,
  LifebuoyIcon,
  BoltIcon,
  PaintBrushIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";

// Import app components
// import { DesignApp } from "./studio/DesignApp"; // Module not found
// import { ChannelApp } from "./channel/ChannelApp"; // Module not found
// import { GarageApp } from "./garage/GarageApp"; // Module not found
// import { AcademyApp } from "./academy/AcademyApp"; // Module not found

// Inter-app collaboration types
export interface AppCollaboration {
  sourceApp: string;
  targetApp: string;
  collaborationType:
    | "data-sync"
    | "workflow"
    | "notification"
    | "approval"
    | "handoff";
  payload: any;
  permissions: string[];
}

export interface CrossAppWorkflow {
  id: string;
  name: string;
  description: string;
  apps: string[];
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
}

export interface WorkflowStep {
  id: string;
  app: string;
  action: string;
  assignedRole: string;
  dependencies: string[];
  autoExecute?: boolean;
}

export interface WorkflowTrigger {
  app: string;
  event: string;
  conditions: Record<string, any>;
}

// Departmental App interface
export interface DepartmentalApp {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: "core" | "departmental" | "specialized" | "enterprise";
  component: React.ComponentType<any>;
  features: string[];
  version: string;
  lastUpdated: string;
}

// Mock components for apps that don't have actual implementations yet
const MockApp: React['FC'] = () => <div>App Coming Soon</div>;

// Main departmental apps array
export const departmentalApps: DepartmentalApp[] = [
  // Core Applications (Primary business functions)
  {
    id: "falcon",
    name: "Falcon",
    description:
      "Advanced Pipeline with AI-powered insights and relationship intelligence",
    icon: <EyeIcon className="w-6 h-6" />,
    color: "from-blue-500 to-blue-700",
    category: "core",
    component: MockApp,
    features: [
      "Contact Management",
      "Deal Pipeline",
      "AI Insights",
      "Relationship Mapping",
    ],
    version: "2.1.0",
    lastUpdated: "2024-01-15",
  },
  {
    id: "monaco",
    name: "Monaco",
    description: "Business intelligence pipeline with alternative data sources",
    icon: <ChartBarIcon className="w-6 h-6" />,
    color: "from-purple-500 to-purple-700",
    category: "core",
    component: MockApp,
    features: [
      "Data Pipeline",
      "Intelligence Reports",
      "Alternative Data",
      "Business Analytics",
    ],
    version: "3.2.0",
    lastUpdated: "2024-01-20",
  },

  // Departmental Applications (Specialized functions)
  {
    id: "garage",
    name: "Garage",
    description: "Content creation and asset management workspace",
    icon: <DocumentTextIcon className="w-6 h-6" />,
    color: "from-orange-500 to-orange-700",
    category: "departmental",
    component: null, // GarageApp not available
    features: [
      "Content Creation",
      "Asset Library",
      "Template Management",
      "Brand Guidelines",
    ],
    version: "1.5.0",
    lastUpdated: "2024-01-10",
  },
  {
    id: "academy",
    name: "Academy",
    description:
      "YouTube-style learning platform with skill tracking and Action Rings integration",
    icon: <AcademicCapIcon className="w-6 h-6" />,
    color: "from-purple-500 to-purple-700",
    category: "departmental",
    component: null, // AcademyApp not available
    features: [
      "Video Content",
      "Articles",
      "Courses",
      "Skill Tracking",
      "Certificates",
      "Action Rings Integration",
    ],
    version: "1.0.0",
    lastUpdated: "2025-01-15",
  },
  {
    id: "channel",
    name: "Channel",
    description:
      "Partner management for multi-company selling and product bundling",
    icon: <UserGroupIcon className="w-6 h-6" />,
    color: "from-teal-500 to-teal-700",
    category: "departmental",
    component: null, // ChannelApp not available
    features: [
      "Pure Play Partners",
      "Product Bundling",
      "Strategic Alliances",
      "Commission Management",
    ],
    version: "1.0.0",
    lastUpdated: "2024-01-25",
  },
  {
    id: "steps",
    name: "Steps",
    description: "Conversation intelligence and sales coaching platform",
    icon: <MicrophoneIcon className="w-6 h-6" />,
    color: "from-green-500 to-green-700",
    category: "departmental",
    component: MockApp,
    features: [
      "Call Recording",
      "Conversation Analysis",
      "Sales Coaching",
      "Performance Metrics",
    ],
    version: "1.8.0",
    lastUpdated: "2024-01-12",
  },
  {
    id: "luna",
    name: "Luna",
    description: "Marketing automation and campaign management",
    icon: <SparklesIcon className="w-6 h-6" />,
    color: "from-indigo-500 to-indigo-700",
    category: "departmental",
    component: MockApp,
    features: [
      "Campaign Management",
      "Lead Scoring",
      "Email Automation",
      "Marketing Analytics",
    ],
    version: "2.0.0",
    lastUpdated: "2024-01-18",
  },
  {
    id: "portal",
    name: "Portal",
    description: "Customer portal and self-service platform",
    icon: <GlobeAltIcon className="w-6 h-6" />,
    color: "from-cyan-500 to-cyan-700",
    category: "departmental",
    component: MockApp,
    features: [
      "Customer Portal",
      "Self-Service",
      "Knowledge Base",
      "Ticket Management",
    ],
    version: "1.9.0",
    lastUpdated: "2024-01-14",
  },
  {
    id: "authority",
    name: "Authority",
    description: "Thought leadership and content strategy platform",
    icon: <AcademicCapIcon className="w-6 h-6" />,
    color: "from-red-500 to-red-700",
    category: "departmental",
    component: MockApp,
    features: [
      "Content Strategy",
      "Thought Leadership",
      "Social Media",
      "Influence Tracking",
    ],
    version: "1.3.0",
    lastUpdated: "2024-01-16",
  },

  // Enterprise Applications
  {
    id: "design",
    name: "Studio",
    description:
      "Figma-inspired design platform with whiteboard, 3D modeling, and Garage integration",
    icon: <PaintBrushIcon className="w-6 h-6" />,
    color: "from-yellow-500 to-yellow-700",
    category: "enterprise",
    component: null, // DesignApp not available
    features: [
      "Design Tools",
      "Whiteboard",
      "3D Modeling",
      "Garage Integration",
    ],
    version: "1.0.0",
    lastUpdated: "2024-01-25",
  },
];

// Department app registry for internal use
export const DEPARTMENTAL_APPS = {
  // REVENUE ENGINE
  pulse: {
    id: "pulse",
    name: "Pulse",
    category: "revenue",
    department: "marketing",
    description: "Market pulse, campaigns, and demand generation",
    icon: "MegaphoneIcon",
    color: "#8B5CF6",
    collaborates: ["monaco", "expand", "vault"],
    workflows: ["lead-handoff", "campaign-budget", "attribution-tracking"],
  },

  expand: {
    id: "expand",
    name: "Expand",
    category: "revenue",
    department: "customerSuccess",
    description: "Customer expansion, retention, and success",
    icon: "ArrowTrendingUpIcon",
    color: "#10B981",
    collaborates: ["monaco", "pulse", "vault"],
    workflows: ["expansion-opportunity", "churn-prevention", "success-metrics"],
  },

  // OPERATIONS
  vault: {
    id: "vault",
    name: "Vault",
    category: "operations",
    department: "finance",
    description: "Financial planning, budgets, and treasury",
    icon: "BuildingLibraryIcon",
    color: "#059669",
    collaborates: ["pulse", "tower", "navigate"],
    workflows: ["budget-approval", "expense-tracking", "revenue-forecasting"],
  },

  harmony: {
    id: "harmony",
    name: "Harmony",
    category: "operations",
    department: "hr",
    description: "People operations, culture, and development",
    icon: "UsersIcon",
    color: "#DC2626",
    collaborates: ["tower", "stacks", "navigate"],
    workflows: ["hiring-pipeline", "performance-review", "team-development"],
  },

  tower: {
    id: "tower",
    name: "Tower",
    category: "operations",
    department: "operations",
    description: "Operations control center and optimization",
    icon: "CommandLineIcon",
    color: "#6B7280",
    collaborates: ["vault", "harmony", "shield"],
    workflows: [
      "process-optimization",
      "resource-allocation",
      "performance-monitoring",
    ],
  },

  // TECHNOLOGY
  shield: {
    id: "shield",
    name: "Shield",
    category: "technology",
    department: "it",
    description: "IT infrastructure, security, and systems",
    icon: "ShieldCheckIcon",
    color: "#1F2937",
    collaborates: ["garage", "tower", "navigate"],
    workflows: [
      "security-compliance",
      "system-deployment",
      "access-management",
    ],
  },

  stacks: {
    id: "stacks",
    name: "Stacks",
    category: "technology",
    department: "product",
    description: "Product + Engineering collaboration hub",
    icon: "CubeIcon",
    color: "#7C3AED",
    collaborates: ["garage", "pulse", "navigate"],
    workflows: [
      "product-planning",
      "feature-development",
      "release-coordination",
    ],
  },

  garage: {
    id: "garage",
    name: "Garage",
    category: "technology",
    department: "engineering",
    description: "Development environment and code collaboration",
    icon: "CodeBracketIcon",
    color: "#0891B2",
    collaborates: ["stacks", "shield", "tower"],
    workflows: ["code-review", "deployment-pipeline", "technical-debt"],
  },

  // LEADERSHIP
  navigate: {
    id: "navigate",
    name: "Navigate",
    category: "leadership",
    department: "leadership",
    description: "Strategic direction and executive insights",
    icon: "MapIcon",
    color: "#B91C1C",
    collaborates: ["vault", "tower", "stacks"],
    workflows: ["strategic-planning", "executive-reporting", "goal-setting"],
  },

  chessboard: {
    id: "chessboard",
    name: "Chessboard",
    category: "intelligence",
    department: "investment",
    description: "VC/PE portfolio analysis and market intelligence",
    icon: "PuzzlePieceIcon",
    color: "#7C3AED",
    collaborates: ["navigate", "vault", "monaco"],
    workflows: ["portfolio-analysis", "market-intelligence", "due-diligence"],
  },

  // STRATEGIC
  catalyst: {
    id: "catalyst",
    name: "Catalyst",
    category: "strategic",
    department: "partnerships",
    description: "Influence & partnership intelligence for key relationships",
    icon: "RocketLaunchIcon",
    color: "#8B5CF6",
    collaborates: ["monaco", "pulse", "expand"],
    workflows: [
      "influencer-campaigns",
      "partner-referrals",
      "relationship-nurturing",
    ],
  },

  recruit: {
    id: "recruit",
    name: "Recruit",
    category: "strategic",
    department: "hr",
    description: "Intelligent hiring and talent acquisition platform",
    icon: "UsersIcon",
    color: "#059669",
    collaborates: ["harmony", "monaco", "vault"],
    workflows: ["candidate-sourcing", "interview-process", "hiring-analytics"],
  },

  nightlife: {
    id: "nightlife",
    name: "Nightlife",
    category: "specialized",
    department: "hospitality",
    description:
      "Complete nightlife data platform with integrated analytics from Posh, Partiful, and TablelistPro",
    icon: "MoonIcon",
    color: "#8B5CF6",
    collaborates: ["pulse", "vault", "tower"],
    workflows: [
      "venue-optimization",
      "event-coordination",
      "customer-analytics",
    ],
  },

  // ENTERPRISE FOUNDATION APPLICATIONS
  beacon: {
    id: "beacon",
    name: "Beacon",
    category: "enterprise",
    department: "it",
    description:
      "Enterprise support and ticketing platform with Shield integration",
    icon: "LifebuoyIcon",
    color: "#10B981",
    collaborates: ["shield", "harmony", "Speedrun"],
    workflows: ["support-routing", "escalation-management", "knowledge-base"],
  },

  forms: {
    id: "forms",
    name: "Forms",
    category: "enterprise",
    department: "operations",
    description: "Visual form builder with workflow integration and analytics",
    icon: "DocumentTextIcon",
    color: "#3B82F6",
    collaborates: ["flow", "beacon", "monaco"],
    workflows: ["data-collection", "lead-capture", "employee-onboarding"],
  },

  flow: {
    id: "flow",
    name: "Flow",
    category: "enterprise",
    department: "automation",
    description: "Intelligent automation platform connecting all applications",
    icon: "BoltIcon",
    color: "#8B5CF6",
    collaborates: ["all-apps"],
    workflows: ["cross-app-automation", "process-optimization", "ai-workflows"],
  },

  canvas: {
    id: "canvas",
    name: "Canvas",
    category: "enterprise",
    department: "development",
    description: "Low-code/no-code custom application builder platform",
    icon: "PaintBrushIcon",
    color: "#F59E0B",
    collaborates: ["all-apps"],
    workflows: [
      "app-development",
      "business-process-apps",
      "data-collection-apps",
    ],
  },

  marketplace: {
    id: "marketplace",
    name: "Marketplace",
    category: "enterprise",
    department: "platform",
    description: "Steam-inspired app distribution and discovery platform",
    icon: "BuildingStorefrontIcon",
    color: "#6366F1",
    collaborates: ["canvas", "flow", "all-apps"],
    workflows: ["app-distribution", "version-management", "licensing"],
  },

  design: {
    id: "design",
    name: "Studio",
    category: "enterprise",
    department: "design",
    description:
      "Figma-inspired design platform with whiteboard, 3D modeling, and Garage integration",
    icon: "PaintBrushIcon",
    color: "#F59E0B",
    collaborates: ["garage", "canvas", "stacks"],
    workflows: ["design-to-code", "component-sync", "design-review"],
  },
} as const;

// Cross-app workflow templates
export const WORKFLOW_TEMPLATES = {
  "lead-handoff": {
    name: "Marketing to Sales Lead Handoff",
    description: "Seamless lead qualification and handoff process",
    apps: ["pulse", "monaco"],
    steps: [
      { app: "pulse", action: "qualify-lead", role: "marketer" },
      { app: "pulse", action: "score-lead", role: "ai-system" },
      { app: "monaco", action: "accept-lead", role: "sales-rep" },
      { app: "monaco", action: "initial-outreach", role: "sales-rep" },
    ],
  },

  "expansion-opportunity": {
    name: "Customer Expansion Workflow",
    description: "Identify and execute expansion opportunities",
    apps: ["expand", "monaco", "vault"],
    steps: [
      { app: "expand", action: "identify-expansion", role: "cs-manager" },
      {
        app: "monaco",
        action: "create-opportunity",
        role: "account-executive",
      },
      { app: "vault", action: "approve-pricing", role: "finance-manager" },
    ],
  },

  "product-planning": {
    name: "Product Feature Planning",
    description: "Collaborative product development workflow",
    apps: ["stacks", "garage", "pulse"],
    steps: [
      { app: "pulse", action: "market-research", role: "product-marketer" },
      {
        app: "stacks",
        action: "feature-specification",
        role: "product-manager",
      },
      { app: "garage", action: "technical-design", role: "tech-lead" },
      { app: "garage", action: "development", role: "engineer" },
    ],
  },

  "budget-approval": {
    name: "Department Budget Approval",
    description: "Multi-level budget approval process",
    apps: ["vault", "navigate", "tower"],
    steps: [
      {
        app: "vault",
        action: "create-budget-request",
        role: "department-manager",
      },
      { app: "tower", action: "operational-review", role: "ops-manager" },
      { app: "navigate", action: "executive-approval", role: "executive" },
    ],
  },

  "design-to-code": {
    name: "Design to Code Workflow",
    description:
      "Seamless handoff from design to development with component sync",
    apps: ["design", "garage", "stacks"],
    steps: [
      { app: "design", action: "create-component", role: "designer" },
      { app: "design", action: "export-design-tokens", role: "ai-system" },
      { app: "garage", action: "generate-component-code", role: "ai-system" },
      { app: "garage", action: "create-pull-request", role: "ai-system" },
      { app: "stacks", action: "review-implementation", role: "tech-lead" },
    ],
  },
};

export type DepartmentalAppId = keyof typeof DEPARTMENTAL_APPS;
