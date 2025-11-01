import React, { useState, useEffect, useCallback } from "react";
import {
  UserIcon,
  BriefcaseIcon,
  HomeIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  ClockIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  TableCellsIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentIcon,
  PresentationChartBarIcon,
  PaperAirplaneIcon,
  CommandLineIcon,
  MapIcon,
  BookOpenIcon,
  Squares2X2Icon,
  XMarkIcon,
  NewspaperIcon,
  ShareIcon,
  StarIcon,
  TagIcon,
  FunnelIcon,
  MoonIcon,
  FolderOpenIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface ThinLeftPanelApp {
  name: string;
  slug: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  hasNotifications?: boolean;
  notificationCount?: number;
}

export interface ThinLeftPanelProfile {
  name?: string;
  initial?: string;
}

type AdrataPlatformApp = {
  name: string;
  slug: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  shortcut: string | null;
  category:
    | "core"
    | "productivity"
    | "networking"
    | "analytics"
    | "collaboration"
    | "communication"
    | "information"
    | "social"
    | "content"
    | "navigation"
    | "storage"
    | "specialized";
  downloadSize: string;
  rating: number;
  tags: string[];
};

interface ThinLeftPanelProps {
  apps: ThinLeftPanelApp[];
  activeApp: string;
  onAppClick: (slug: string) => void;
  profile: ThinLeftPanelProfile;
  onProfileClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  profileButtonClassName?: string;
  activeBgClass?: string;
  currentAppName?: string;
  currentAppIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  currentPlatformApp?: string;
  workspaceId?: string;
  workspace?: string;
}

// 🚀 STEAM DECK-STYLE PLATFORM APPS - Complete Enterprise Operating System
const platformApps: AdrataPlatformApp[] = [
  // 💼 CORE PLATFORM APPS
  {
    name: "Action Platform",
    slug: "aos",
    description: "Complete revenue lifecycle.",
    icon: BriefcaseIcon,
    color: "#6B7280",
    shortcut: "1",
    category: "core",
    downloadSize: "0 MB",
    rating: 5.0,
    tags: ["Pipeline", "Revenue", "Core"],
  },
  {
    name: "Speedrun",
    slug: "Speedrun",
    description: "Take better action.",
    icon: PaperAirplaneIcon,
    color: "#6B7280",
    shortcut: "2",
    category: "productivity",
    downloadSize: "0 MB",
    rating: 4.9,
    tags: ["Messaging", "Email", "Communication"],
  },
  {
    name: "Monaco",
    slug: "monaco",
    description: "Make connections.",
    icon: UserGroupIcon,
    color: "#2563EB",
    shortcut: "3",
    category: "networking",
    downloadSize: "0 MB",
    rating: 4.8,
    tags: ["Networking", "People", "Discovery"],
  },
  {
    name: "Co-Action",
    slug: "co-action",
    description: "Win together.",
    icon: UsersIcon,
    color: "#34C759",
    shortcut: "5",
    category: "collaboration",
    downloadSize: "0 MB",
    rating: 4.7,
    tags: ["Collaboration", "Teams", "Wins"],
  },
  {
    name: "Oasis",
    slug: "oasis",
    description: "Join the discussion.",
    icon: ChatBubbleLeftRightIcon,
    color: "#1E88E5",
    shortcut: "6",
    category: "communication",
    downloadSize: "0 MB",
    rating: 4.8,
    tags: ["Chat", "Communication", "Social"],
  },

  // 🏢 DEPARTMENTAL STANDALONE APPS - Complete Enterprise Suite
  {
    name: "Pulse",
    slug: "pulse",
    description: "Marketing campaigns & demand generation.",
    icon: NewspaperIcon,
    color: "#8B5CF6",
    shortcut: "p",
    category: "core",
    downloadSize: "0 MB",
    rating: 4.9,
    tags: ["Marketing", "Campaigns", "Demand Gen"],
  },
  {
    name: "Stacks",
    slug: "stacks",
    description: "Product + Engineering collaboration.",
    icon: Squares2X2Icon,
    color: "#7C3AED",
    shortcut: "9",
    category: "productivity",
    downloadSize: "0 MB",
    rating: 4.9,
    tags: ["Product", "Engineering", "Collaboration"],
  },
  {
    name: "Garage",
    slug: "garage",
    description: "VS Code-like development environment.",
    icon: CommandLineIcon,
    color: "#0891B2",
    shortcut: "g",
    category: "productivity",
    downloadSize: "0 MB",
    rating: 4.8,
    tags: ["Development", "Code", "VS Code"],
  },
  {
    name: "Vault",
    slug: "vault",
    description: "Financial planning & treasury.",
    icon: BookOpenIcon,
    color: "#059669",
    shortcut: "v",
    category: "core",
    downloadSize: "0 MB",
    rating: 4.8,
    tags: ["Finance", "Budgets", "Treasury"],
  },
  {
    name: "Navigate",
    slug: "navigate",
    description: "Strategic leadership & insights.",
    icon: MapIcon,
    color: "#B91C1C",
    shortcut: "0",
    category: "core",
    downloadSize: "0 MB",
    rating: 4.9,
    tags: ["Strategy", "Leadership", "Executive"],
  },
  {
    name: "Chessboard",
    slug: "chessboard",
    description: "VC/PE portfolio intelligence.",
    icon: MapIcon,
    color: "#7C3AED",
    shortcut: "0",
    category: "analytics",
    downloadSize: "0 MB",
    rating: 4.8,
    tags: ["VC", "PE", "Investment"],
  },
  {
    name: "Harmony",
    slug: "harmony",
    description: "HR & people operations.",
    icon: UsersIcon,
    color: "#DC2626",
    shortcut: null,
    category: "core",
    downloadSize: "0 MB",
    rating: 4.7,
    tags: ["HR", "People", "Team Development"],
  },
  {
    name: "Shield",
    slug: "shield",
    description: "IT infrastructure & security.",
    icon: UserIcon,
    color: "#1F2937",
    shortcut: null,
    category: "productivity",
    downloadSize: "0 MB",
    rating: 4.6,
    tags: ["IT", "Security", "Infrastructure"],
  },
  {
    name: "Tower",
    slug: "tower",
    description: "Operations control center.",
    icon: ChartBarIcon,
    color: "#8B5CF6",
    shortcut: "4",
    category: "analytics",
    downloadSize: "0 MB",
    rating: 4.5,
    tags: ["Operations", "Control", "Optimization"],
  },
  {
    name: "Workshop",
    slug: "workshop",
    description: "Document collaboration & management.",
    icon: DocumentIcon,
    color: "#10B981",
    shortcut: "a",
    category: "productivity",
    downloadSize: "0 MB",
    rating: 4.7,
    tags: ["Documents", "Collaboration", "Management"],
  },
  {
    name: "Particle",
    slug: "particle",
    description: "A/B testing & experimentation platform.",
    icon: SparklesIcon,
    color: "#F59E0B",
    shortcut: "p",
    category: "analytics",
    downloadSize: "0 MB",
    rating: 4.6,
    tags: ["Testing", "Experimentation", "Analytics"],
  },
  {
    name: "Grand Central",
    slug: "grand-central",
    description: "Integration hub & workflow automation.",
    icon: Cog6ToothIcon,
    color: "#8B5CF6",
    shortcut: "gc",
    category: "productivity",
    downloadSize: "0 MB",
    rating: 4.8,
    tags: ["Integrations", "Automation", "Workflows"],
  },
  {
    name: "Olympus",
    slug: "olympus",
    description: "Workflow orchestration & execution.",
    icon: PresentationChartBarIcon,
    color: "#DC2626",
    shortcut: "o",
    category: "productivity",
    downloadSize: "0 MB",
    rating: 4.7,
    tags: ["Workflows", "Orchestration", "Execution"],
  },
  {
    name: "Encode",
    slug: "encode",
    description: "Code editor & development environment.",
    icon: CommandLineIcon,
    color: "#0891B2",
    shortcut: "e",
    category: "productivity",
    downloadSize: "0 MB",
    rating: 4.8,
    tags: ["Code", "Development", "Editor"],
  },
  {
    name: "Database",
    slug: "database",
    description: "Database management & query interface.",
    icon: TableCellsIcon,
    color: "#059669",
    shortcut: "db",
    category: "productivity",
    downloadSize: "0 MB",
    rating: 4.6,
    tags: ["Database", "Queries", "Management"],
  },
  {
    name: "Docs",
    slug: "docs",
    description: "Documentation & knowledge base.",
    icon: BookOpenIcon,
    color: "#7C3AED",
    shortcut: "d",
    category: "information",
    downloadSize: "0 MB",
    rating: 4.5,
    tags: ["Documentation", "Knowledge", "Reference"],
  },
  {
    name: "Battleground",
    slug: "battleground",
    description: "Strategic intelligence & market warfare.",
    icon: MapIcon,
    color: "#10B981",
    shortcut: "b",
    category: "analytics",
    downloadSize: "0 MB",
    rating: 4.9,
    tags: ["Strategy", "Intelligence", "Competitive"],
  },
  {
    name: "Nightlife",
    slug: "nightlife",
    description: "Complete nightlife data platform.",
    icon: MoonIcon,
    color: "#7C3AED",
    shortcut: "n",
    category: "specialized",
    downloadSize: "0 MB",
    rating: 4.9,
    tags: ["Hospitality", "Events", "Analytics"],
  },
  {
    name: "Briefcase",
    slug: "briefcase",
    description: "Business intelligence & presentations.",
    icon: BriefcaseIcon,
    color: "#F59E0B",
    shortcut: null,
    category: "content",
    downloadSize: "0 MB",
    rating: 4.8,
    tags: ["Business", "Intelligence", "Presentations"],
  },

  // 📰 INTELLIGENCE & CONTENT APPS
  {
    name: "News",
    slug: "news",
    description: "Stay informed and ahead.",
    icon: NewspaperIcon,
    color: "#DC2626",
    shortcut: "n",
    category: "information",
    downloadSize: "0 MB",
    rating: 4.6,
    tags: ["News", "Industry", "Intelligence"],
  },
  {
    name: "Social",
    slug: "social",
    description: "Connect and collaborate.",
    icon: ShareIcon,
    color: "#7C3AED",
    shortcut: "s",
    category: "social",
    downloadSize: "0 MB",
    rating: 4.5,
    tags: ["Social", "Feed", "Collaboration"],
  },

  // 🎨 CONTENT & PRODUCTIVITY TOOLS
  {
    name: "Pitch",
    slug: "pitch",
    description: "Create your slides.",
    icon: PresentationChartBarIcon,
    color: "#FF6B35",
    shortcut: "7",
    category: "content",
    downloadSize: "0 MB",
    rating: 4.4,
    tags: ["Presentations", "Slides", "Content"],
  },
  {
    name: "Paper",
    slug: "paper",
    description: "Jot your ideas.",
    icon: FolderOpenIcon,
    color: "#F1C40F",
    shortcut: "8",
    category: "content",
    downloadSize: "0 MB",
    rating: 4.6,
    tags: ["Notes", "Ideas", "Writing"],
  },
  {
    name: "Tempo",
    slug: "tempo",
    description: "Master your time.",
    icon: ClockIcon,
    color: "#F59E0B",
    shortcut: null,
    category: "productivity",
    downloadSize: "0 MB",
    rating: 4.2,
    tags: ["Time", "Schedule", "Productivity"],
  },
];

// Quick App Switcher (5 most common apps)
function QuickAppSwitcher({
  isOpen,
  onClose,
  currentApp,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentApp: string;
}) {
  const router = useRouter();

  // Get current user for admin access check
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  
  useEffect(() => {
    // Get user email from localStorage or auth context
    const userEmail = localStorage.getItem('userEmail') || 
                     (typeof window !== 'undefined' && window.location.search.includes('user=') ? 
                      new URLSearchParams(window.location.search).get('user') : null);
    setCurrentUserEmail(userEmail);
  }, []);

  // Check if user is admin (dan@adrata.com has restrictions, not full admin)
  const ADMIN_EMAILS = ['ross@adrata.com', 'todd@adrata.com'];
  const isAdminUser = currentUserEmail && ADMIN_EMAILS.includes(currentUserEmail);

  // 5 most common apps - Include workspace apps for admin users
  const quickApps = isAdminUser ? [
    platformApps.find((app) => app['slug'] === "aos"),
    platformApps.find((app) => app['slug'] === "stacks"),
    platformApps.find((app) => app['slug'] === "workshop"),
    platformApps.find((app) => app['slug'] === "tower"),
    platformApps.find((app) => app['slug'] === "grand-central"),
  ].filter((app): app is AdrataPlatformApp => app !== undefined) : [
    platformApps.find((app) => app['slug'] === "aos"),
    platformApps.find((app) => app['slug'] === "tower"),
    platformApps.find((app) => app['slug'] === "oasis"),
    platformApps.find((app) => app['slug'] === "battleground"),
    platformApps.find((app) => app['slug'] === "briefcase"),
  ].filter((app): app is AdrataPlatformApp => app !== undefined);

  const handleAppClick = useCallback(
    (appSlug: string) => {
      onClose();
      if (appSlug !== currentApp) {
        router.push(`/${appSlug}`);
      }
    },
    [onClose, currentApp, router],
  );

  const handleAllAppsClick = useCallback(() => {
    onClose();
    router.push("/store");
  }, [onClose, router]);

  // Click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e['target'] === e.currentTarget) {
      onClose();
    }
  };

  // Keyboard shortcut handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e['key'] === "Escape") {
        onClose();
      }
      // REMOVED: CMD+1-5 shortcuts to avoid conflict with browser tab switching
      // Use keyboard navigation with arrow keys or Tab instead
      // Tab or Space for All Apps
      if (e['key'] === "Tab" || e['key'] === " ") {
        e.preventDefault();
        handleAllAppsClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleAppClick, handleAllAppsClick, onClose, quickApps]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl w-96">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Adrata Applications
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Apps */}
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-2">
            {quickApps.map((app, index) => {
              const Icon = app.icon;
              const isCurrentApp = app['slug'] === currentApp;
              return (
                <button
                  key={app.slug}
                  onClick={() => handleAppClick(app.slug)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group text-left ${
                    isCurrentApp
                      ? "bg-[var(--hover-bg)]"
                      : "hover:bg-[var(--hover-bg)]"
                  }`}
                  style={
                    isCurrentApp
                      ? {
                          boxShadow: `0 0 0 2px ${app.color}20`,
                        }
                      : {}
                  }
                >
                  {/* App Icon */}
                  <div
                    className="w-10 h-10 flex items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
                    style={{
                      backgroundColor: app.color + "15",
                      color: app.color,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* App Info */}
                  <div className="flex-1">
                    <div className="text-base font-medium text-[var(--foreground)]">
                      {app.name}
                    </div>
                    <div className="text-sm text-[var(--muted)] leading-tight">
                      {app.description}
                    </div>
                  </div>

                  {/* Keyboard Shortcut */}
                  <div className="flex items-center gap-1">
                    <div className="text-xs font-medium text-[var(--muted)]">
                      ⌘
                    </div>
                    <div
                      className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded"
                      style={{
                        backgroundColor: app.color + "15",
                        color: app.color,
                      }}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Current App Indicator */}
                  {isCurrentApp && (
                    <div
                      className="w-2 h-2 rounded-full ml-2"
                      style={{ backgroundColor: app.color }}
                    />
                  )}
                </button>
              );
            })}

            {/* All Apps Button */}
            <div className="border-t border-[var(--border)] mt-2 pt-2">
              <button
                onClick={handleAllAppsClick}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--hover-bg)] transition-colors duration-200 text-left"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--hover-bg)]">
                  <Squares2X2Icon className="w-5 h-5 text-[var(--muted)]" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-[var(--foreground)]">
                    Adrata Store
                  </div>
                  <div className="text-sm text-[var(--muted)] leading-tight">
                    View all Adrata applications
                  </div>
                </div>
                <div className="text-xs text-[var(--muted)] font-medium">
                  Tab
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎮 MAGICAL STEAM DECK-STYLE APP SWITCHER
function FullAppSwitcher({
  isOpen,
  onClose,
  currentApp,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentApp: string;
}) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  const categories = [
    { id: "all", name: "All Apps", icon: Squares2X2Icon },
    { id: "core", name: "Core", icon: BriefcaseIcon },
    { id: "productivity", name: "Productivity", icon: CommandLineIcon },
    {
      id: "communication",
      name: "Communication",
      icon: ChatBubbleLeftRightIcon,
    },
    { id: "analytics", name: "Analytics", icon: ChartBarIcon },
    { id: "content", name: "Content", icon: FolderOpenIcon },
  ];

  const filteredApps = platformApps.filter((app) => {
    const matchesCategory =
      selectedCategory === "all" || app['category'] === selectedCategory;
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchesCategory && matchesSearch;
  });

  const handleAppClick = useCallback(
    (appSlug: string) => {
      onClose();
      if (appSlug !== currentApp) {
        router.push(`/${appSlug}`);
      }
    },
    [onClose, currentApp, router],
  );

  // Click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e['target'] === e.currentTarget) {
      onClose();
    }
  };

  // Keyboard shortcut handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle zoom shortcuts
      if (
        (e.metaKey || e.ctrlKey) &&
        (e['key'] === "=" || e['key'] === "+" || e['key'] === "-" || e['key'] === "_")
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey) {
        const pressedKey = e.key;
        const app = platformApps.find((app) => app['shortcut'] === pressedKey);
        if (app) {
          e.preventDefault();
          handleAppClick(app.slug);
        }
      }
      if (e['key'] === "Escape") {
        onClose();
        setSearchQuery("");
        setSelectedCategory("all");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleAppClick, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-3xl shadow-2xl w-full max-w-8xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-2">
              Adrata Store
            </h2>
            <p className="text-[var(--muted)] text-lg">
              Discover and launch powerful applications
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-[var(--hover-bg)] rounded-xl transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-[var(--muted)]" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-8 py-6 bg-[var(--hover-bg)]/30 border-b border-[var(--border)]">
          <div className="flex gap-6 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Category Filters */}
            <div className="flex gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-240px)]">
          <div className="grid grid-cols-5 gap-6">
            {filteredApps.map((app) => {
              const Icon = app.icon;
              const isCurrentApp = app['slug'] === currentApp;
              const isHovered = hoveredApp === app.slug;

              return (
                <button
                  key={app.slug}
                  onClick={() => handleAppClick(app.slug)}
                  onMouseEnter={() => setHoveredApp(app.slug)}
                  onMouseLeave={() => setHoveredApp(null)}
                  className={`relative flex flex-col items-center gap-4 p-6 rounded-2xl transition-all duration-300 group ${
                    isCurrentApp
                      ? "bg-[var(--hover-bg)] ring-2 ring-blue-500/50"
                      : "hover:bg-[var(--hover-bg)] hover:scale-105"
                  }`}
                  style={
                    isCurrentApp
                      ? {
                          boxShadow: `0 0 0 3px ${app.color}20, 0 8px 25px -5px ${app.color}30`,
                        }
                      : isHovered
                        ? {
                            boxShadow: `0 8px 25px -5px ${app.color}20`,
                          }
                        : {}
                  }
                >
                  {/* App Icon */}
                  <div
                    className="w-16 h-16 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 relative"
                    style={{
                      backgroundColor: app.color + "15",
                      color: app.color,
                      borderRadius: "16px",
                    }}
                  >
                    <Icon className="w-8 h-8" />

                    {/* Shine effect on hover */}
                    {isHovered && (
                      <div
                        className="absolute inset-0 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"
                        style={{
                          background: `linear-gradient(135deg, transparent 0%, ${app.color}50 50%, transparent 100%)`,
                        }}
                      />
                    )}
                  </div>

                  {/* App Info */}
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[var(--foreground)] mb-1">
                      {app.name}
                    </div>
                    <div className="text-sm text-[var(--muted)] leading-tight mb-2">
                      {app.description}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-3 h-3 ${i < Math.floor(app.rating) ? "text-yellow-400 fill-current" : "text-[var(--muted)]"}`}
                        />
                      ))}
                      <span className="text-xs text-[var(--muted)] ml-1">
                        {app.rating}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 justify-center">
                      {app.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: app.color + "10",
                            color: app.color,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Keyboard Shortcut */}
                  {app['shortcut'] && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-[var(--muted)] text-xs">⌘</span>
                      <span
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded-lg"
                        style={{
                          backgroundColor: app.color + "15",
                          color: app.color,
                        }}
                      >
                        {app.shortcut}
                      </span>
                    </div>
                  )}

                  {/* Current App Indicator */}
                  {isCurrentApp && (
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: app.color }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{ color: app.color }}
                      >
                        Active
                      </span>
                    </div>
                  )}

                  {/* Install/Launch Button */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-center transition-all duration-200 group-hover:scale-105"
                      style={{
                        backgroundColor: app.color,
                        color: "white",
                      }}
                    >
                      {isCurrentApp ? "Active" : "Launch"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* No Results */}
          {filteredApps['length'] === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--hover-bg)] flex items-center justify-center">
                <FunnelIcon className="w-8 h-8 text-[var(--muted)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                No apps found
              </h3>
              <p className="text-[var(--muted)]">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Function to generate workspace shorthand
const generateWorkspaceShorthand = (workspaceId?: string): string => {
  if (!workspaceId) return "ADR"; // Default to Adrata
  
  switch (workspaceId.toLowerCase()) {
    case "retailproductsolutions":
      return "RPS";
    case "adrata":
      return "ADR";
    case "zeropoint":
      return "ZPT";
    default:
      // Generate shorthand from workspace name
      const words = workspaceId.split(/[^a-zA-Z]/).filter(word => word.length > 0);
      
      if (words.length >= 3) {
        // If we have 3+ words, use first letter of each
        return words.slice(0, 3).map(word => word.charAt(0).toUpperCase()).join("");
      } else if (words['length'] === 2) {
        // If we have 2 words, use first letter of first + first 2 letters of second
        return (words[0].charAt(0) + words[1].substring(0, 2)).toUpperCase();
      } else if (words['length'] === 1) {
        // If we have 1 word, use first 3 letters
        return words[0].substring(0, 3).toUpperCase();
      } else {
        return "WSP"; // Fallback to "WSP" for workspace
      }
  }
};

export function ThinLeftPanel({
  apps,
  activeApp,
  onAppClick,
  profile,
  onProfileClick,
  profileButtonClassName,
  activeBgClass,
  currentAppName = "Pipeline",
  currentAppIcon = BriefcaseIcon,
  currentPlatformApp,
  workspaceId,
  workspace,
}: ThinLeftPanelProps) {
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false);
  const [isFullSwitcherOpen, setIsFullSwitcherOpen] = useState(false);
  const CurrentIcon = currentAppIcon;
  const router = useRouter();
  
  // Generate workspace shorthand instead of using icon
  const workspaceShorthand = generateWorkspaceShorthand(workspaceId);

  // Get current app color dynamically
  const currentAppColor =
    platformApps.find((app) => app['name'] === currentAppName)?.color || "#ff9800";

  // Preload all platform apps for lightning-fast switching
  useEffect(() => {
    platformApps.forEach((app) => {
      router.prefetch(`/${app.slug}`);
    });
  }, [router]);

  // Global keyboard shortcuts for app switching
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const pressedKey = e.key;
        const app = platformApps.find((app) => app['shortcut'] === pressedKey);
        if (app && app.slug !== currentPlatformApp) {
          e.preventDefault();
          router.push(`/${app.slug}`);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [currentPlatformApp, router]);

  return (
    <>
      {/* Hidden preloading links for lightning-fast app switching */}
      <div style={{ display: "none" }}>
        {platformApps.map((app) => (
          <Link key={app.slug} href={`/${app.slug}`} prefetch={true} />
        ))}
      </div>

      <div className="flex flex-col justify-start items-center h-full w-full py-4 bg-[var(--background)] border-r border-[var(--border)] relative">
        <div className="flex flex-col items-center w-full mb-2">
          {/* Adrata branding */}
          <div className="flex items-center gap-1 mt-1 mb-1">
            <span className="text-xl font-semibold text-[var(--foreground)]">Adrata</span>
            <span className="bg-[var(--panel-background)]0 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Pro
            </span>
          </div>
          <div className="text-xs text-[var(--muted)] font-medium">Sales Acceleration</div>
          
          <div
            className="w-8 h-px rounded-full mt-2 mb-3"
            style={{ background: "#e5e7eb", opacity: 1 }}
          />
        </div>
        <div className="flex flex-col gap-4 items-center mt-[-8px]">
          {apps.map((app) => {
            const Icon = app.icon || HomeIcon;
            const isActive = activeApp === app.slug;
            return (
              <button
                key={app.slug}
                className={`flex flex-col items-center transition-colors relative ${
                  isActive
                    ? "text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                style={{ gap: ".5px" }}
                onClick={() => onAppClick(app.slug)}
                aria-label={app.name}
                title={app.name}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors relative"
                  style={
                    isActive
                      ? {
                          backgroundColor: "var(--hover-bg)",
                          color: "var(--foreground)",
                        }
                      : {}
                  }
                >
                  <Icon className="w-6 h-6" />
                  {/* Notification badge */}
                  {app['hasNotifications'] && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-10">
                      {app['notificationCount'] && app.notificationCount > 0 ? (
                        <span className="text-white text-xs font-bold">
                          {app.notificationCount > 99
                            ? "99+"
                            : app.notificationCount}
                        </span>
                      ) : (
                        <div className="w-2 h-2 bg-[var(--background)] rounded-full"></div>
                      )}
                    </div>
                  )}
                </div>
                <span className="font-medium" style={{ fontSize: "10px" }}>
                  {app.name}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
        <button
          className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-400 bg-[var(--background)] text-[var(--muted)] mb-2 absolute left-1/2 -translate-x-1/2 bottom-1 ${profileButtonClassName || ""}`}
          onClick={onProfileClick}
          aria-label="Profile"
          title={profile.name}
        >
          <span className="w-8 h-8 flex items-center justify-center text-lg font-medium rounded-xl">
            {profile.initial || <UserIcon className="w-6 h-6" />}
          </span>
        </button>
      </div>
      <QuickAppSwitcher
        isOpen={isQuickSwitcherOpen}
        onClose={() => setIsQuickSwitcherOpen(false)}
        currentApp={currentPlatformApp || activeApp}
      />
    </>
  );
}
