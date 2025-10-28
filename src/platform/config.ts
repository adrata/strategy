import {
  PaperAirplaneIcon,
  ListBulletIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
  LockClosedIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  SparklesIcon,
  Cog6ToothIcon,
  HomeIcon,
  CalendarDaysIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type { RevenueOSApp } from "./types";
import { BullIcon } from "./ui/components/BullIcon";

export const REVENUE_OS_APPS: RevenueOSApp[] = [
  {
    id: "Speedrun",
    name: "Speedrun",
    description: "Prepare to win",
    icon: PaperAirplaneIcon,
    color: "#2563EB",
    sections: ["inbox", "prospects", "leads", "pipeline", "analytics", "settings"],
  },
  {
    id: "pipeline",
    name: "Pipeline",
    description: "Win major deals",
    icon: FunnelIcon,
    color: "#059669",
    sections: ["speedrun", "chronicle", "opportunities", "leads", "prospects", "clients", "partners", "companies", "people", "metrics"],
  },
  {
    id: "monaco",
    name: "Monaco",
    description: "Find your next customer",
    icon: UserGroupIcon,
    color: "#7C3AED",
    sections: ["companies", "people", "sellers", "sequences", "analytics"],
  },
  {
    id: "settings",
    name: "Settings",
    description: "Configure your workspace",
    icon: Cog6ToothIcon,
    color: "#6B7280",
    sections: ["apps", "preferences"],
  },
];

// Legacy aliases for backwards compatibility
export const ACTION_PLATFORM_APPS = REVENUE_OS_APPS;
export const ACQUISITION_OS_APPS = REVENUE_OS_APPS;

export const SECTION_TITLES: Record<string, string> = {
  leads: "Leads",
  prospects: "Prospects",
  opportunities: "Opportunities",
  clients: "Customers",
  accounts: "Accounts",
  contacts: "Contacts",
  catalyst: "Catalyst",
  partnerships: "Partnerships",
  buyerGroups: "Buyer Groups",
  healthScores: "Health Scores",
  renewals: "Renewals",
  expansionOpportunities: "Expansion Opportunities",
  champions: "Champions",
  decisionMakers: "Decision Makers",
  partners: "Partners",
  daily40: "Daily 40",
  weekly200: "Weekly 200",
  drafts: "Drafts",
  scheduled: "Scheduled",
  templates: "Templates",
  notes: "Notes",
  meetingNotes: "Meeting Notes",
  icp1: "High-Intent SaaS",
  icp2: "Scaling Enterprises",
  icp3: "Compliance-Driven",
  icp4: "Digital Transformation",
  companies: "Companies",
  people: "People",
  teams: "Teams",
  projects: "Projects",
  shared: "Shared",
  coordination: "Coordination",
  collaboration: "Collaboration",
  today: "Today",
  "this-week": "This Week",
  "this-month": "This Month",
  "this-quarter": "This Quarter",
  "all-time": "All Time",
  urgent: "Urgent",
  completed: "Completed",
  // Additional sections for core apps
  qualified: "Qualified",
  pipeline: "Pipeline",
  upsells: "Upsells",
  personal: "Personal",
  // RTP sections
  inbox: "Inbox",
  analytics: "Analytics",
  settings: "Settings",
  // Settings sections
  apps: "App Management",
  preferences: "Preferences",
};

export const QUICK_ACTIONS: Record<string, string[]> = {
  "Speedrun": [
    "Analyze today's prospects",
    "Draft personalized outreach",
    "Review buyer group intelligence",
    "Optimize prospecting strategy",
  ],
  pipeline: [
    "Analyze pipeline health",
    "Identify stalled opportunities",
    "Generate deal insights",
    "Create account strategies",
  ],
  monaco: [
    "Executive dashboard summary",
    "Show top prospects",
    "Start Speedrun mode",
    "Pipeline health check",
  ],
  stacks: [
    "Create a new story",
    "Move story to next column",
    "Organize backlog by priority",
    "Generate epic breakdown",
    "Update story status",
    "Assign story to team member",
  ],
  oasis: [
    "Send message to team",
    "Create new channel",
    "Schedule video call",
    "Share file in chat",
  ],
  atrium: [
    "Create new document",
    "Organize knowledge base",
    "Generate meeting notes",
    "Update project status",
  ],
  settings: ["Reorder apps", "Hide apps", "Reset layout", "Export settings"],
};

export const DEFAULT_FORM_DATA = {
  name: "",
  title: "",
  source: "Website",
  notes: "",
  // Opportunity-specific fields
  amount: "",
  probability: "",
  stage: "Discovery",
  closeDate: "",
  contact: "",
  // Partnership-specific fields
  partnerType: "",
  relationshipStatus: "",
  relationshipStrength: "",
  contactName: "",
  contactTitle: "",
  commissionStructure: "",
  website: "",
  lastContactDate: "",
  nextContactDate: "",
  // Customer-specific fields
  contractValue: "",
  renewalDate: "",
  contactIds: [],
  nextAction: "",
};
