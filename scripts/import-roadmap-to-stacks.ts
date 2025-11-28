/**
 * Import Adrata Master Roadmap to Stacks
 * 
 * This script imports the roadmap from ADRATA_MASTER_ROADMAP.md into the Stacks
 * project management system, creating epics and stories with acceptance criteria.
 * 
 * Usage: npx ts-node scripts/import-roadmap-to-stacks.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const WORKSPACE_SLUG = 'adrata';
const ASSIGNEE_NAME = 'ross'; // Will match by name containing 'ross'
const PROJECT_NAME = 'Adrata Master Roadmap';

// Priority mapping from roadmap format to Stacks format
const priorityMap: Record<string, string> = {
  'P0': 'high',
  'P1': 'high', 
  'P2': 'medium',
  'P3': 'low'
};

// Status mapping from percentage to Stacks status
function percentToStatus(percent: number): string {
  if (percent === 100) return 'done';
  if (percent >= 50) return 'in_progress';
  if (percent > 0) return 'todo';
  return 'todo';
}

// Epic data from the roadmap
interface EpicData {
  number: number;
  title: string;
  theme: string;
  status: number; // percentage
  stories: StoryData[];
}

interface StoryData {
  number: string; // e.g., "1.1"
  title: string;
  priority: string; // P0, P1, P2, P3
  status: number; // percentage
  sprint: string;
  description: string;
  acceptanceCriteria: string[];
}

// All roadmap data extracted from ADRATA_MASTER_ROADMAP.md
const roadmapData: EpicData[] = [
  {
    number: 1,
    title: "AI-Powered Revenue Intelligence",
    theme: "Transform data into action",
    status: 52,
    stories: [
      {
        number: "1.1",
        title: "ICP Finder and Scoring",
        priority: "P0",
        status: 60,
        sprint: "1",
        description: "As a sales rep, I want the AI to automatically identify and rank ideal customer profiles so that I can focus on the highest-value prospects.",
        acceptanceCriteria: [
          "Find optimal companies matching ICP criteria",
          "Rank prospects by DM (Decision Maker) reach accessibility",
          "Score based on 45+ ICP threshold",
          "Factor in age of key personnel and leadership changes",
          "Consider PE/VC ownership for buying authority",
          "Display scores on Monaco company cards",
          "Enable filtering/sorting by ICP score"
        ]
      },
      {
        number: "1.2",
        title: "Buyer Group Intelligence",
        priority: "P0",
        status: 100,
        sprint: "Done",
        description: "As a sales rep, I want to ask 'Who is this?' and have Adrata map the entire buying group so that I understand the organizational dynamics.",
        acceptanceCriteria: [
          "AI identifies all stakeholders in a deal",
          "Maps organizational structure automatically",
          "Identifies Champions by title/role analysis",
          "Detects leadership changes and transitions",
          "Provides relationship mapping (Graph network nodes)",
          "3-level progressive enrichment (identify, enrich, deep research)"
        ]
      },
      {
        number: "1.3",
        title: "AI Controls Your Screen",
        priority: "P1",
        status: 30,
        sprint: "4",
        description: "As a user, I want AI to take control and perform actions on my behalf so that I can focus on strategic work.",
        acceptanceCriteria: [
          "AI can navigate through the application",
          "Execute commands on the dial panel",
          "Configure settings automatically",
          "Perform bulk actions (contact multiple by email)",
          "AI acts to organize notes into sheets",
          "Voice commands (200+ implemented)"
        ]
      },
      {
        number: "1.4",
        title: "Directional Intelligence Recommendations",
        priority: "P0",
        status: 70,
        sprint: "3",
        description: "As a sales rep, I want AI to provide specific next actions with strategic reasoning so that I always know what to do next.",
        acceptanceCriteria: [
          "Generate directional intelligence for each lead/opportunity",
          "Provide stage-based recommendations (AFM stages)",
          "Calculate URF scores for retention risk",
          "Suggest expansion pathways",
          "Include strategic reasoning, not just tasks",
          "Display on ALL record types (coverage incomplete)"
        ]
      },
      {
        number: "1.5",
        title: "Beautiful Real-Time Dashboards",
        priority: "P1",
        status: 40,
        sprint: "2",
        description: "As a sales leader, I want stunning real-time dashboards so that I can visualize pipeline health at a glance.",
        acceptanceCriteria: [
          "RT (real-time) updates via Pusher",
          "Deal process benchmarking (Mike Manzi benchmarks)",
          "Pipeline flow visualization",
          "Metrics and KPI tracking",
          "Export capabilities"
        ]
      }
    ]
  },
  {
    number: 2,
    title: "Multi-Platform Excellence",
    theme: "Native everywhere",
    status: 43,
    stories: [
      {
        number: "2.1",
        title: "Every Language, Every Platform",
        priority: "P1",
        status: 20,
        sprint: "5",
        description: "As a global user, I want Adrata to work seamlessly in every language on mobile, desktop, tablet, and watch.",
        acceptanceCriteria: [
          "Full internationalization support (i18n)",
          "Native mobile app (iOS/Android)",
          "Native desktop app (macOS/Windows/Linux via Tauri)",
          "Tablet-optimized interface",
          "Watch companion app for notifications and quick actions",
          "Sub 200ms page loads across all platforms"
        ]
      },
      {
        number: "2.2",
        title: "World-Class Desktop Application",
        priority: "P0",
        status: 90,
        sprint: "Done",
        description: "As a power user, I want a menu bar application with instant access so that I can access Adrata without context switching.",
        acceptanceCriteria: [
          "Menu bar presence (macOS/Windows)",
          "Menu store for quick actions",
          "Offline mode with sync",
          "Global keyboard shortcuts",
          "Native notifications",
          "Window management (monitor with hide)"
        ]
      },
      {
        number: "2.3",
        title: "World-Class CI/CD Pipeline",
        priority: "P1",
        status: 60,
        sprint: "4",
        description: "As a developer, I want world-class CI/CD so that we can ship quality updates rapidly.",
        acceptanceCriteria: [
          "Test all major runtimes",
          "Automated deployment pipelines",
          "Docstring writing tool integration",
          "Multi-platform build support",
          "Performance monitoring"
        ]
      },
      {
        number: "2.4",
        title: "App Marketplace",
        priority: "P3",
        status: 0,
        sprint: "8+",
        description: "As a user, I want to buy and install apps built on the Adrata platform so that I can extend functionality.",
        acceptanceCriteria: [
          "Marketplace for third-party apps",
          "Apps built on the platform (Adrata Matt Shell)",
          "Broker pages on the platform",
          "Revenue sharing for developers",
          "Easy installation and configuration"
        ]
      }
    ]
  },
  {
    number: 3,
    title: "Communication Hub (Oasis Evolution)",
    theme: "Unified communications",
    status: 40,
    stories: [
      {
        number: "3.1",
        title: "Unified DM and Email Interface",
        priority: "P0",
        status: 70,
        sprint: "3",
        description: "As a sales rep, I want all my communications (email, DM, LinkedIn) in one place so that I never miss a touchpoint.",
        acceptanceCriteria: [
          "Unified inbox across channels",
          "Email sync with Gmail/Outlook",
          "LinkedIn DM integration",
          "WhatsApp integration",
          "Auto-link communications to deals/contacts",
          "Separate email domains (a domain or out)"
        ]
      },
      {
        number: "3.2",
        title: "Video Call Integration",
        priority: "P1",
        status: 50,
        sprint: "4",
        description: "As a sales rep, I want native video calling so that I can have face-to-face conversations within Adrata.",
        acceptanceCriteria: [
          "Cell/Video cell capability",
          "Cal.com integration for scheduling",
          "Meeting recording and transcription",
          "Video call from deal records",
          "Oasis Video features"
        ]
      },
      {
        number: "3.3",
        title: "Audio Notes on Deal Records",
        priority: "P1",
        status: 40,
        sprint: "4",
        description: "As a sales rep, I want to leave audio notes on deals so that I can capture insights quickly.",
        acceptanceCriteria: [
          "Voice recording on any record (Deepgram)",
          "Automatic transcription",
          "AI summarization",
          "Voice add card/note",
          "Search audio content",
          "Attach to deal records"
        ]
      },
      {
        number: "3.4",
        title: "Photo-to-Notes Intelligence",
        priority: "P2",
        status: 0,
        sprint: "6",
        description: "As a sales rep, I want to take a photo of handwritten notes and have Adrata organize them so that I can capture whiteboard sessions.",
        acceptanceCriteria: [
          "Camera capture of notes",
          "OCR processing",
          "AI organization into structured data",
          "Link to relevant deals/contacts",
          "Storybook in the app, audio books"
        ]
      }
    ]
  },
  {
    number: 4,
    title: "Live Coaching and Real-Time Intelligence",
    theme: "Real-time AI assistance",
    status: 35,
    stories: [
      {
        number: "4.1",
        title: "Live Call Coaching",
        priority: "P0",
        status: 30,
        sprint: "3",
        description: "As a sales rep, I want real-time coaching during calls so that I can improve my pitch on the fly.",
        acceptanceCriteria: [
          "Real-time transcription (Deepgram working)",
          "Live coaching suggestions overlay",
          "70% listen indicator (talk ratio)",
          "1 of 6 openers suggestions",
          "10 questions to ask prompts",
          "Objection handling tips",
          "Combo system for good performance (OCTALYSIS)"
        ]
      },
      {
        number: "4.2",
        title: "Call Reset and Playbook",
        priority: "P1",
        status: 20,
        sprint: "4",
        description: "As a sales rep, I want to 'reset the call' feature so that I can pivot when things go off track.",
        acceptanceCriteria: [
          "Call reset suggestions",
          "Playbook by Company",
          "Dynamic talk tracks",
          "Buyer-specific guidance",
          "Conversational prompts (not lists)"
        ]
      },
      {
        number: "4.3",
        title: "Dialer with Incoming Call Intelligence",
        priority: "P1",
        status: 80,
        sprint: "Done",
        description: "As a sales rep, I want intelligent caller ID so that I know who's calling before I answer.",
        acceptanceCriteria: [
          "Native dialer integration",
          "Incoming call detection",
          "Contact lookup and display",
          "Deal context shown",
          "Quick notes during call"
        ]
      },
      {
        number: "4.4",
        title: "Coach Role and Training",
        priority: "P2",
        status: 10,
        sprint: "6",
        description: "As a sales leader, I want a coach role so that I can monitor and train my team.",
        acceptanceCriteria: [
          "Coach dashboard",
          "Live call monitoring (with permission)",
          "Performance benchmarking",
          "Training content integration",
          "Onboarding VideoCast"
        ]
      }
    ]
  },
  {
    number: 5,
    title: "Data Enrichment and ICP Discovery",
    theme: "Intelligent data",
    status: 43,
    stories: [
      {
        number: "5.1",
        title: "Vector Database Intelligence",
        priority: "P1",
        status: 0,
        sprint: "5",
        description: "As a user, I want AI models trained on our data so that predictions are personalized to our business.",
        acceptanceCriteria: [
          "Vector database for semantic search (Pinecone/Weaviate)",
          "Model training on company data",
          "Ability to predict outcomes",
          "Adrata Falcon intelligence engine",
          "Runner for automated processing"
        ]
      },
      {
        number: "5.2",
        title: "Company Leadership Intelligence",
        priority: "P0",
        status: 60,
        sprint: "2",
        description: "As a sales rep, I want automatic tracking of leadership changes so that I know when to reach out.",
        acceptanceCriteria: [
          "Age of key personnel tracking",
          "Change of leadership detection",
          "Leadership style analysis",
          "Role growth tracking to rank",
          "Executive transition alerts"
        ]
      },
      {
        number: "5.3",
        title: "PE/VC Ownership Analysis",
        priority: "P1",
        status: 30,
        sprint: "5",
        description: "As a sales rep, I want to know if a company has PE/VC backing so that I understand their buying capacity.",
        acceptanceCriteria: [
          "PE ownership detection",
          "VC funding rounds tracking",
          "Buying authority assessment",
          "Investment timeline analysis",
          "$100 that will buy threshold analysis"
        ]
      },
      {
        number: "5.4",
        title: "Multi-Provider Enrichment Waterfall",
        priority: "P1",
        status: 80,
        sprint: "Done",
        description: "As a system, I want to use multiple data providers in a waterfall pattern so that data quality is maximized.",
        acceptanceCriteria: [
          "Hunter.io integration",
          "Prospeo integration",
          "ContactOut integration",
          "ZeroBounce validation",
          "Cost optimization per enrichment"
        ]
      }
    ]
  },
  {
    number: 6,
    title: "Automation and Workflows (Olympus)",
    theme: "Smart workflows",
    status: 35,
    stories: [
      {
        number: "6.1",
        title: "Auto-Trigger System",
        priority: "P0",
        status: 40,
        sprint: "2",
        description: "As a user, I want automatic triggers based on events so that workflows run without manual intervention.",
        acceptanceCriteria: [
          "Event-based triggers (basic)",
          "Email open/click triggers",
          "Lead score change triggers",
          "Deal stage change triggers",
          "Time-based triggers (follow-up reminders)",
          "External signal triggers (LinkedIn activity)"
        ]
      },
      {
        number: "6.2",
        title: "Email Sequences",
        priority: "P0",
        status: 50,
        sprint: "2",
        description: "As a sales rep, I want automated email sequences so that follow-ups happen automatically.",
        acceptanceCriteria: [
          "Multi-step sequence generation",
          "Personalization with AI",
          "A/B testing",
          "Auto-pause on reply",
          "Auto-scheduling (timed sends)",
          "Contact multiple by email (bulk)"
        ]
      },
      {
        number: "6.3",
        title: "Pipeline Flow Telemetry",
        priority: "P1",
        status: 30,
        sprint: "4",
        description: "As an admin, I want visibility into automation performance so that I can optimize workflows.",
        acceptanceCriteria: [
          "Pipeline flow visualization",
          "Telemetry and metrics",
          "Rules engine",
          "Performance monitoring",
          "Error handling and alerts"
        ]
      },
      {
        number: "6.4",
        title: "Insights and Industry Discovery",
        priority: "P2",
        status: 20,
        sprint: "6",
        description: "As a sales rep, I want AI to find tools and trends in my industry so that I stay informed.",
        acceptanceCriteria: [
          "Industry trend detection",
          "Competitive intelligence",
          "Tool discovery",
          "Custom mode for specific industries",
          "New industry alerts"
        ]
      }
    ]
  },
  {
    number: 7,
    title: "Stacks (Project Management Integration)",
    theme: "Project management",
    status: 67,
    stories: [
      {
        number: "7.1",
        title: "Epics and Stories Management",
        priority: "P1",
        status: 90,
        sprint: "Done",
        description: "As a product manager, I want to manage epics and stories so that development aligns with sales feedback.",
        acceptanceCriteria: [
          "Epic creation and management",
          "Story breakdown",
          "Priority ranking (rank system)",
          "Status tracking",
          "Integration with deal feedback"
        ]
      },
      {
        number: "7.2",
        title: "Kanban Board",
        priority: "P1",
        status: 90,
        sprint: "Done",
        description: "As a team member, I want a kanban view so that I can visualize work in progress.",
        acceptanceCriteria: [
          "Drag and drop columns",
          "Custom stages",
          "WIP limits",
          "Swimlanes by epic/assignee",
          "Multi-player edits with Speedway progress bars"
        ]
      },
      {
        number: "7.3",
        title: "Customer Feedback Loop",
        priority: "P2",
        status: 20,
        sprint: "6",
        description: "As a product manager, I want customer feedback linked to stories so that we build what customers need.",
        acceptanceCriteria: [
          "Link deals to feature requests",
          "Vote/priority from customers",
          "Feedback aggregation",
          "Impact scoring",
          "Add goals to product (cool/fail tracking)"
        ]
      }
    ]
  },
  {
    number: 8,
    title: "Grand Central (Integration Hub)",
    theme: "Integration hub",
    status: 45,
    stories: [
      {
        number: "8.1",
        title: "Graph Network Integration",
        priority: "P1",
        status: 40,
        sprint: "5",
        description: "As a user, I want all my tools connected as a graph so that data flows seamlessly.",
        acceptanceCriteria: [
          "Graph network nodes architecture",
          "Bi-directional sync (email/calendar)",
          "Real-time updates (Pusher)",
          "Conflict resolution",
          "API rate limit management"
        ]
      },
      {
        number: "8.2",
        title: "Native Integrations",
        priority: "P0",
        status: 70,
        sprint: "Done",
        description: "As a user, I want native integrations with key tools so that I don't need Zapier.",
        acceptanceCriteria: [
          "Gmail/Outlook email",
          "Google/Outlook calendar",
          "Slack integration (partial)",
          "LinkedIn integration",
          "Dropbox (Sage - Dropbox)",
          "Cal.com for scheduling"
        ]
      },
      {
        number: "8.3",
        title: "Stripe Integration",
        priority: "P1",
        status: 30,
        sprint: "5",
        description: "As an admin, I want Stripe integration so that billing is connected to deals.",
        acceptanceCriteria: [
          "Stripe Bundle integration",
          "Payment tracking",
          "Subscription management",
          "Revenue recognition",
          "Get paid your date feature"
        ]
      },
      {
        number: "8.4",
        title: "Co-Action Model with Callbacks",
        priority: "P2",
        status: 20,
        sprint: "6",
        description: "As a developer, I want webhook callbacks so that I can build custom integrations.",
        acceptanceCriteria: [
          "Co-Action model architecture",
          "Webhook callbacks (basic)",
          "API toolkit",
          "Full Adrata-beans wrapper",
          "Multi-thread support for search/stacks"
        ]
      }
    ]
  },
  {
    number: 9,
    title: "Chronicle and Intelligence Reports",
    theme: "Reports and insights",
    status: 28,
    stories: [
      {
        number: "9.1",
        title: "Deep Vibe Reports",
        priority: "P1",
        status: 30,
        sprint: "4",
        description: "As a sales leader, I want deep relationship health reports so that I understand account sentiment.",
        acceptanceCriteria: [
          "Vibe/sentiment analysis (service exists)",
          "Relationship strength scoring",
          "Engagement tracking",
          "Risk indicators",
          "Trend analysis over time"
        ]
      },
      {
        number: "9.2",
        title: "Deal Process Benchmarking",
        priority: "P1",
        status: 20,
        sprint: "4",
        description: "As a sales leader, I want to benchmark our deal process so that I can identify improvement areas.",
        acceptanceCriteria: [
          "Stage duration analysis",
          "Conversion rate benchmarks",
          "Win/loss analysis",
          "Process comparison",
          "Mike Manzi industry benchmarks"
        ]
      },
      {
        number: "9.3",
        title: "Metrics and KPI Dashboard",
        priority: "P0",
        status: 40,
        sprint: "1",
        description: "As a sales leader, I want real-time KPIs so that I can track performance.",
        acceptanceCriteria: [
          "Customizable KPIs",
          "Real-time updates",
          "Goal tracking (10% bonus threshold)",
          "Team performance",
          "Pipeline metrics (450, 1500 jobs targets)",
          "Forecast accuracy display"
        ]
      },
      {
        number: "9.4",
        title: "Adrata PA (Excel Analyst)",
        priority: "P3",
        status: 0,
        sprint: "8",
        description: "As an analyst, I want AI-powered Excel analysis so that I can get insights from spreadsheets.",
        acceptanceCriteria: [
          "Excel file upload",
          "AI analysis of data",
          "Visualization suggestions",
          "Export capabilities",
          "Shared AI results"
        ]
      }
    ]
  },
  {
    number: 10,
    title: "Enterprise and Scale Features",
    theme: "Enterprise security",
    status: 56,
    stories: [
      {
        number: "10.1",
        title: "Enterprise Admin Console",
        priority: "P1",
        status: 50,
        sprint: "4",
        description: "As an enterprise admin, I want centralized control across all devices so that I can manage the organization.",
        acceptanceCriteria: [
          "Enterprise admin dashboard (basic)",
          "All devices management",
          "User provisioning",
          "Audit logging",
          "Compliance reporting"
        ]
      },
      {
        number: "10.2",
        title: "Role-Based Access Control",
        priority: "P0",
        status: 80,
        sprint: "Done",
        description: "As an admin, I want granular permissions so that users only see what they need.",
        acceptanceCriteria: [
          "Role-adapted privileges",
          "Custom role creation",
          "Field-level permissions",
          "Data isolation by workspace",
          "5-tier hosted control"
        ]
      },
      {
        number: "10.3",
        title: "Session and Security Management",
        priority: "P0",
        status: 70,
        sprint: "3",
        description: "As an admin, I want session controls so that I can enforce security policies.",
        acceptanceCriteria: [
          "Session sharing controls",
          "SSO integration",
          "2FA enforcement (partial)",
          "Session timeout policies",
          "IP restrictions"
        ]
      },
      {
        number: "10.4",
        title: "Multi-Tenant Architecture",
        priority: "P1",
        status: 70,
        sprint: "Done",
        description: "As a platform, I want true multi-tenancy so that enterprises can have isolated environments.",
        acceptanceCriteria: [
          "Workspace isolation",
          "Data segregation",
          "Custom domains",
          "White-labeling options",
          "Adrata Express (lightweight tier)"
        ]
      },
      {
        number: "10.5",
        title: "Parallel Hook System",
        priority: "P2",
        status: 30,
        sprint: "6",
        description: "As a developer, I want parallel processing hooks so that integrations are performant.",
        acceptanceCriteria: [
          "Parallel webhook processing",
          "Event queuing (basic)",
          "Rate limiting",
          "Error recovery",
          "Detailed logging"
        ]
      }
    ]
  },
  {
    number: 11,
    title: "Power Writing AI (Persuasion Engine)",
    theme: "AI content generation",
    status: 20,
    stories: [
      {
        number: "11.1",
        title: "7 Power Writing Rules",
        priority: "P0",
        status: 20,
        sprint: "2",
        description: "Embed into all AI-generated content following Shaan Puri's Power Writing framework.",
        acceptanceCriteria: [
          "Grade Level: 5th-8th grade (Flesch-Kincaid 60-70)",
          "No Adverbs: Remove -ly words",
          "Active Voice: Subject first",
          "Visual Language: Concrete over abstract",
          "Rhythm: Allow rhymes and alliteration",
          "Personal: Use 'I' and 'you'",
          "Focus: 20%+ time on first/last line"
        ]
      },
      {
        number: "11.2",
        title: "Story Brand Formula for Pitches",
        priority: "P0",
        status: 20,
        sprint: "2",
        description: "When generating any pitch, use the Story Brand structure.",
        acceptanceCriteria: [
          "PROBLEM: 'Most [target] struggle with...'",
          "SOLUTION: 'That's why we made...'",
          "ENDING: Paint the happy ending",
          "Auto-generate from company description",
          "Templates by industry/role"
        ]
      },
      {
        number: "11.3",
        title: "AIDA Cold Email Framework",
        priority: "P0",
        status: 30,
        sprint: "2",
        description: "Structure all cold emails with AIDA framework.",
        acceptanceCriteria: [
          "Attention: Curiosity gap subject line",
          "Personal: Reference something specific",
          "Offer: What's in it for THEM",
          "Credibility: Social proof without bragging",
          "Goal: 1-word reply (yes/interested)"
        ]
      },
      {
        number: "11.4",
        title: "Mike Manzi Email Templates",
        priority: "P1",
        status: 10,
        sprint: "3",
        description: "Add Official Sales System templates to AI.",
        acceptanceCriteria: [
          "14 First Email templates (Oddly Personalized, Forward, Peers, etc.)",
          "12 Follow-Up templates",
          "4 Breakup templates",
          "LinkedIn voice note script",
          "Text/WhatsApp templates",
          "Reply handling templates"
        ]
      },
      {
        number: "11.5",
        title: "25 Headlines Generator",
        priority: "P1",
        status: 0,
        sprint: "4",
        description: "Before any content goes out, generate variations.",
        acceptanceCriteria: [
          "Generate 25 headline variations",
          "User picks top 3",
          "A/B test the finalists",
          "Learn from performance data",
          "Apply to subject lines"
        ]
      },
      {
        number: "11.6",
        title: "Follow-Up Sequencer",
        priority: "P1",
        status: 30,
        sprint: "2",
        description: "80% of magic is in the follow-up.",
        acceptanceCriteria: [
          "Day 1: Polite bump",
          "Day 3: Add new value/news",
          "Day 5: Create urgency/scarcity",
          "Auto-stop on reply detection",
          "Customizable timing"
        ]
      },
      {
        number: "11.7",
        title: "Landing Page / Proposal Boosters",
        priority: "P2",
        status: 0,
        sprint: "5",
        description: "5 boosters for all proposals.",
        acceptanceCriteria: [
          "Level-Up: Show how it helps",
          "Trust: Logos, testimonials, case studies",
          "But-Killer: Pre-empt objections",
          "Action: ONE clear CTA",
          "Personal: Origin story, attitude"
        ]
      },
      {
        number: "11.8",
        title: "Swipe File Database",
        priority: "P3",
        status: 0,
        sprint: "7",
        description: "User-curated library of great content.",
        acceptanceCriteria: [
          "Great openers collection",
          "Great closers collection",
          "Transition phrases",
          "Analogies that work",
          "AI learns from swipe file"
        ]
      }
    ]
  },
  {
    number: 12,
    title: "Player Experience (Gamification)",
    theme: "Make work feel like a video game",
    status: 15,
    stories: [
      {
        number: "12.1",
        title: "Achievement and Badge System",
        priority: "P0",
        status: 15,
        sprint: "1",
        description: "As a user, I want to earn achievements so that I feel accomplished and can show my progress.",
        acceptanceCriteria: [
          "50+ achievements across categories",
          "Badge library with rarity levels (Common, Uncommon, Rare, Epic, Legendary)",
          "Achievement unlocked animations",
          "Profile badge display",
          "Shareable accomplishments",
          "Achievement categories: Prospector, Closer, Streaker, Communicator, Intelligence, Team Player"
        ]
      },
      {
        number: "12.2",
        title: "Daily Quest System",
        priority: "P0",
        status: 30,
        sprint: "1",
        description: "As a user, I want daily quests so that I have clear goals each day.",
        acceptanceCriteria: [
          "Daily Quest UI wrapper around Speedrun",
          "Clear objective display ('Close $50K today' or 'Move 3 deals forward')",
          "Progress bar that fills as you work",
          "Quest complete celebration",
          "XP gained per action",
          "Bonus quests for overachievers"
        ]
      },
      {
        number: "12.3",
        title: "Streak and Momentum Tracking",
        priority: "P1",
        status: 40,
        sprint: "2",
        description: "As a user, I want to maintain streaks so that I stay consistent.",
        acceptanceCriteria: [
          "Current streak tracking (EngagementGrid has this)",
          "Longest streak tracking",
          "Streak protection (1 free miss per week)",
          "Visual flame/momentum indicator",
          "Streak milestone celebrations (7, 30, 100 days)",
          "Streak leaderboard"
        ]
      },
      {
        number: "12.4",
        title: "The Scoreboard (Leaderboard)",
        priority: "P1",
        status: 0,
        sprint: "3",
        description: "As a user, I want to see how I compare so that I'm motivated by healthy competition.",
        acceptanceCriteria: [
          "Team leaderboard (optional participation)",
          "Personal bests tracking",
          "Weekly/monthly/all-time views",
          "Multiple categories (revenue, activities, streaks)",
          "Anonymous mode option",
          "Rank changes highlighted"
        ]
      },
      {
        number: "12.5",
        title: "Celebration Moments",
        priority: "P1",
        status: 10,
        sprint: "2",
        description: "As a user, I want celebrations when I accomplish things so that wins feel meaningful.",
        acceptanceCriteria: [
          "Confetti on deal close",
          "'Quest Complete' animation",
          "Level up celebration",
          "Streak milestone celebration",
          "Sound effects (optional)",
          "Share to team option"
        ]
      },
      {
        number: "12.6",
        title: "XP and Leveling System",
        priority: "P2",
        status: 0,
        sprint: "4",
        description: "As a user, I want to level up so that I feel progression over time.",
        acceptanceCriteria: [
          "XP earned per action (calls, emails, deals)",
          "Level progression (1-100)",
          "Level titles (Rookie, Closer, Master, Legend)",
          "Level-up animation",
          "Unlocks at certain levels",
          "XP multipliers for streaks"
        ]
      },
      {
        number: "12.7",
        title: "At-Risk Deal Alerts",
        priority: "P1",
        status: 0,
        sprint: "2",
        description: "As a user, I want alerts for at-risk deals so that I don't let things slip.",
        acceptanceCriteria: [
          "Stalled deal detection (no activity in X days)",
          "Competitor mention detection",
          "Engagement drop detection",
          "Red flag visual indicators",
          "Notification system",
          "'Deal Doctor' intervention suggestions"
        ]
      },
      {
        number: "12.8",
        title: "Boss Battle Mode",
        priority: "P2",
        status: 0,
        sprint: "5",
        description: "As a user, I want big deals treated as boss battles so that they feel epic.",
        acceptanceCriteria: [
          "Deals over $X get 'Boss Battle' treatment",
          "Special UI framing",
          "Buyer group as 'characters to unlock'",
          "Stage progression visualization",
          "Victory celebration on close",
          "Battle history/archive"
        ]
      }
    ]
  }
];

async function main() {
  console.log('🚀 Starting Adrata Roadmap Import to Stacks...\n');

  try {
    // 1. Find the workspace
    console.log(`📍 Looking for workspace: ${WORKSPACE_SLUG}`);
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { slug: WORKSPACE_SLUG },
          { name: { contains: WORKSPACE_SLUG, mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      console.error(`❌ Workspace "${WORKSPACE_SLUG}" not found!`);
      console.log('\nAvailable workspaces:');
      const workspaces = await prisma.workspaces.findMany({
        select: { id: true, name: true, slug: true }
      });
      workspaces.forEach(w => console.log(`  - ${w.name} (${w.slug}) [${w.id}]`));
      process.exit(1);
    }
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // 2. Find Ross user
    console.log(`👤 Looking for user: ${ASSIGNEE_NAME}`);
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { name: { contains: ASSIGNEE_NAME, mode: 'insensitive' } },
          { email: { contains: ASSIGNEE_NAME, mode: 'insensitive' } },
          { firstName: { contains: ASSIGNEE_NAME, mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      console.error(`❌ User "${ASSIGNEE_NAME}" not found!`);
      console.log('\nAvailable users:');
      const users = await prisma.users.findMany({
        select: { id: true, name: true, email: true },
        take: 10
      });
      users.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.id}]`));
      process.exit(1);
    }
    console.log(`✅ Found user: ${user.name} (${user.id})\n`);

    // 3. Get or create the project
    console.log(`📁 Setting up project: ${PROJECT_NAME}`);
    let project = await prisma.stacksProject.findFirst({
      where: {
        workspaceId: workspace.id,
        name: PROJECT_NAME
      }
    });

    if (!project) {
      project = await prisma.stacksProject.create({
        data: {
          workspaceId: workspace.id,
          name: PROJECT_NAME,
          description: 'Adrata Master Roadmap - System of Record for product development. Vision: Build the best system - not the system with the most features, but the magical experience.'
        }
      });
      console.log(`✅ Created new project: ${project.name} (${project.id})\n`);
    } else {
      console.log(`✅ Using existing project: ${project.name} (${project.id})\n`);
    }

    // 4. Check for existing epics to avoid duplicates
    const existingEpics = await prisma.stacksEpic.findMany({
      where: { projectId: project.id },
      select: { id: true, title: true }
    });
    const existingEpicTitles = new Set(existingEpics.map(e => e.title.toLowerCase().trim()));
    console.log(`📊 Found ${existingEpics.length} existing epics in project\n`);

    // 5. Check for existing stories to avoid duplicates
    const existingStories = await prisma.stacksStory.findMany({
      where: { projectId: project.id },
      select: { id: true, title: true }
    });
    const existingStoryTitles = new Set(existingStories.map(s => s.title.toLowerCase().trim()));
    console.log(`📊 Found ${existingStories.length} existing stories in project\n`);

    // Stats tracking
    let epicsCreated = 0;
    let epicsSkipped = 0;
    let storiesCreated = 0;
    let storiesSkipped = 0;

    // 6. Import each epic and its stories
    console.log('📥 Importing roadmap data...\n');
    console.log('=' .repeat(60));

    for (const epicData of roadmapData) {
      const epicTitle = `Epic ${epicData.number}: ${epicData.title}`;
      console.log(`\n🏛️  ${epicTitle}`);
      console.log(`   Theme: ${epicData.theme}`);

      // Check if epic already exists
      if (existingEpicTitles.has(epicTitle.toLowerCase().trim())) {
        console.log(`   ⏭️  Epic already exists - skipping`);
        epicsSkipped++;
        
        // Still need to get the epic ID for stories
        const existingEpic = existingEpics.find(
          e => e.title.toLowerCase().trim() === epicTitle.toLowerCase().trim()
        );
        
        if (existingEpic) {
          // Import stories for this epic
          for (const storyData of epicData.stories) {
            const storyTitle = `${storyData.number}: ${storyData.title}`;
            
            if (existingStoryTitles.has(storyTitle.toLowerCase().trim())) {
              console.log(`      ⏭️  Story ${storyData.number} already exists - skipping`);
              storiesSkipped++;
              continue;
            }

            const story = await prisma.stacksStory.create({
              data: {
                projectId: project.id,
                epicId: existingEpic.id,
                title: storyTitle,
                description: storyData.description,
                acceptanceCriteria: storyData.acceptanceCriteria.map((ac, i) => `- [ ] ${ac}`).join('\n'),
                status: percentToStatus(storyData.status),
                priority: priorityMap[storyData.priority] || 'medium',
                assigneeId: user.id,
                statusChangedAt: new Date()
              }
            });
            console.log(`      ✅ Created story: ${storyTitle}`);
            storiesCreated++;
            existingStoryTitles.add(storyTitle.toLowerCase().trim());
          }
        }
        continue;
      }

      // Create the epic
      const epic = await prisma.stacksEpic.create({
        data: {
          projectId: project.id,
          title: epicTitle,
          description: `**Theme:** ${epicData.theme}\n\n**Status:** ${epicData.status}% complete`,
          status: percentToStatus(epicData.status),
          priority: 'high',
          rank: epicData.number
        }
      });
      console.log(`   ✅ Created epic (${epic.id})`);
      epicsCreated++;
      existingEpicTitles.add(epicTitle.toLowerCase().trim());

      // Create stories for this epic
      for (const storyData of epicData.stories) {
        const storyTitle = `${storyData.number}: ${storyData.title}`;
        
        if (existingStoryTitles.has(storyTitle.toLowerCase().trim())) {
          console.log(`      ⏭️  Story ${storyData.number} already exists - skipping`);
          storiesSkipped++;
          continue;
        }

        const story = await prisma.stacksStory.create({
          data: {
            projectId: project.id,
            epicId: epic.id,
            title: storyTitle,
            description: storyData.description,
            acceptanceCriteria: storyData.acceptanceCriteria.map((ac, i) => `- [ ] ${ac}`).join('\n'),
            status: percentToStatus(storyData.status),
            priority: priorityMap[storyData.priority] || 'medium',
            assigneeId: user.id,
            statusChangedAt: new Date()
          }
        });
        console.log(`      ✅ Story ${storyData.number}: ${storyData.title} [${storyData.priority}]`);
        storiesCreated++;
        existingStoryTitles.add(storyTitle.toLowerCase().trim());
      }
    }

    // 7. Print summary
    console.log('\n' + '=' .repeat(60));
    console.log('\n📊 IMPORT SUMMARY');
    console.log('=' .repeat(60));
    console.log(`\n   Workspace: ${workspace.name}`);
    console.log(`   Project:   ${PROJECT_NAME}`);
    console.log(`   Assignee:  ${user.name}`);
    console.log('\n   Results:');
    console.log(`   ├─ Epics created:   ${epicsCreated}`);
    console.log(`   ├─ Epics skipped:   ${epicsSkipped}`);
    console.log(`   ├─ Stories created: ${storiesCreated}`);
    console.log(`   └─ Stories skipped: ${storiesSkipped}`);
    console.log(`\n   Total items: ${epicsCreated + storiesCreated} created, ${epicsSkipped + storiesSkipped} skipped`);
    console.log('\n✅ Import complete!\n');

  } catch (error) {
    console.error('\n❌ Error during import:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

