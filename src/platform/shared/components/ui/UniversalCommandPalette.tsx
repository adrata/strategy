"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { formatShortcutForDisplay } from '@/platform/utils/keyboard-shortcut-display';
import {
  Search,
  Zap,
  Navigation,
  FileText,
  Users,
  Settings,
  Sparkles,
  BarChart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspaceNavigation } from "@/platform/hooks/useWorkspaceNavigation";
import { useUnifiedAuth } from "@/platform/auth";

interface Command {
  id: string;
  title: string;
  description: string;
  category: "navigation" | "action" | "search" | "ai" | "recent";
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
  shortcut?: string;
  priority: number;
}

interface UniversalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleAI?: () => void;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
}

export default function UniversalCommandPalette({
  isOpen,
  onClose,
  onToggleAI,
  onToggleLeftPanel,
  onToggleRightPanel,
}: UniversalCommandPaletteProps) {
  const router = useRouter();
  const { navigateToAOS, navigateToMonaco } = useWorkspaceNavigation();
  const { user: authUser } = useUnifiedAuth();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  // Check if user is in Adrata workspace
  const isAdrataWorkspace = () => {
    const activeWorkspace = authUser?.workspaces?.find(
      w => w['id'] === authUser?.activeWorkspaceId
    );
    return activeWorkspace?.name?.toLowerCase() === 'adrata';
  };

  // Load recent commands from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const recent = JSON.parse(
        localStorage.getItem("adrata-recent-commands") || "[]",
      );
      setRecentCommands(recent);
    }
  }, []);

  // All available commands
  const allCommands: Command[] = useMemo(
    () => [
      // Navigation Commands
      {
        id: "nav-aos",
        title: "Action Platform",
        description: "Strategic execution and project management",
        category: "navigation",
        icon: <Zap className="w-4 h-4" />,
        action: () => {
          const { navigateToAOS } = useWorkspaceNavigation();
          navigateToAOS();
        },
        keywords: ["action", "platform", "strategy", "execution"],
        shortcut: formatShortcutForDisplay(['⌘+1', 'Ctrl+1']),
        priority: 10,
      },
      {
        id: "nav-monaco",
        title: "Monaco",
        description: "Company intelligence and data enrichment",
        category: "navigation",
        icon: <Search className="w-4 h-4" />,
        action: () => {
          const { navigateToMonaco } = useWorkspaceNavigation();
          navigateToMonaco();
        },
        keywords: ["monaco", "intelligence", "data", "company"],
        shortcut: formatShortcutForDisplay(['⌘+2', 'Ctrl+2']),
        priority: 10,
      },
      {
        id: "nav-oasis",
        title: "Oasis",
        description: "Customer relationship management",
        category: "navigation",
        icon: <Users className="w-4 h-4" />,
        action: () => router.push("/oasis"),
        keywords: ["oasis", "pipeline", "clients", "relationships"],
        shortcut: formatShortcutForDisplay(['⌘+3', 'Ctrl+3']),
        priority: 10,
      },
      {
        id: "nav-speedrun",
        title: "Speedrun",
        description: "Communication and outreach management",
        category: "navigation",
        icon: <FileText className="w-4 h-4" />,
        action: () => router.push("/speedrun"),
        keywords: ["Speedrun", "communication", "outreach", "email"],
        shortcut: formatShortcutForDisplay(['⌘+4', 'Ctrl+4']),
        priority: 10,
      },
      {
        id: "nav-briefcase",
        title: "Briefcase",
        description: "Document and file management",
        category: "navigation",
        icon: <FileText className="w-4 h-4" />,
        action: () => router.push("/briefcase"),
        keywords: ["briefcase", "documents", "files", "storage"],
        shortcut: formatShortcutForDisplay(['⌘+5', 'Ctrl+5']),
        priority: 10,
      },
      {
        id: "nav-tower",
        title: "Tower",
        description: "Leadership and organizational management",
        category: "navigation",
        icon: <Navigation className="w-4 h-4" />,
        action: () => router.push("/tower"),
        keywords: ["tower", "leadership", "organization", "management"],
        shortcut: "GT",
        priority: 8,
      },
      {
        id: "nav-store",
        title: "Store",
        description: "Browse all applications",
        category: "navigation",
        icon: <Settings className="w-4 h-4" />,
        action: () => router.push("/store"),
        keywords: ["store", "apps", "applications", "browse"],
        shortcut: "GS",
        priority: 8,
      },
      {
        id: "nav-olympus",
        title: "Olympus",
        description: "Advanced analytics and intelligence hub",
        category: "navigation",
        icon: <BarChart className="w-4 h-4" />,
        action: () => router.push("./olympus"),
        keywords: ["olympus", "analytics", "intelligence", "insights", "ai"],
        shortcut: "GO",
        priority: 8,
      },

      // AI Commands
      {
        id: "ai-assistant",
        title: "Toggle AI Assistant",
        description: "Open or close the AI assistant panel",
        category: "ai",
        icon: <Sparkles className="w-4 h-4" />,
        action: () => onToggleAI?.(),
        keywords: ["ai", "assistant", "help", "chat"],
        shortcut: formatShortcutForDisplay(['⌘+J', 'Ctrl+J']),
        priority: 9,
      },

      // View Commands
      {
        id: "toggle-left-panel",
        title: "Toggle Left Sidebar",
        description: "Show or hide the left navigation panel",
        category: "action",
        icon: <Navigation className="w-4 h-4" />,
        action: () => onToggleLeftPanel?.(),
        keywords: ["sidebar", "left", "panel", "navigation"],
        shortcut: formatShortcutForDisplay(['⌘+Shift+E', 'Ctrl+Shift+E']),
        priority: 7,
      },
      {
        id: "toggle-right-panel",
        title: "Toggle Right Panel",
        description: "Show or hide the right AI chat panel",
        category: "action",
        icon: <Sparkles className="w-4 h-4" />,
        action: () => onToggleRightPanel?.(),
        keywords: ["sidebar", "right", "panel", "ai", "chat"],
        shortcut: formatShortcutForDisplay(['⌘+Shift+B', 'Ctrl+Shift+B']),
        priority: 7,
      },

      // Quick Actions
      {
        id: "new-workspace",
        title: "New Workspace",
        description: "Create a new workspace",
        category: "action",
        icon: <FileText className="w-4 h-4" />,
        action: () => {
          // Implement new workspace creation
          console.log("Creating new workspace...");
        },
        keywords: ["new", "workspace", "create"],
        shortcut: formatShortcutForDisplay(['⌘+N', 'Ctrl+N']),
        priority: 6,
      },
      {
        id: "preferences",
        title: "Preferences",
        description: "Open application preferences",
        category: "action",
        icon: <Settings className="w-4 h-4" />,
        action: () => router.push("./grand-central/profile"),
        keywords: ["preferences", "settings", "config"],
        shortcut: formatShortcutForDisplay(['⌘+,', 'Ctrl+,']),
        priority: 5,
      },
    ],
    [router, navigateToAOS, navigateToMonaco, onToggleAI, onToggleLeftPanel, onToggleRightPanel, authUser],
  );

  // Filter and sort commands
  const filteredCommands = useMemo(() => {
    let filtered = allCommands;

    // Filter out Oasis for non-Adrata workspace users
    if (!isAdrataWorkspace()) {
      filtered = filtered.filter(command => command.id !== "nav-oasis");
    }

    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(
        (command) =>
          command.title.toLowerCase().includes(searchTerm) ||
          command.description.toLowerCase().includes(searchTerm) ||
          command.keywords.some((keyword) =>
            keyword.toLowerCase().includes(searchTerm),
          ),
      );
    }

    // Sort by priority and recent usage
    return filtered.sort((a, b) => {
      const aRecent = recentCommands.includes(a.id) ? 1 : 0;
      const bRecent = recentCommands.includes(b.id) ? 1 : 0;

      if (aRecent !== bRecent) return bRecent - aRecent;
      return b.priority - a.priority;
    });
  }, [allCommands, query, recentCommands]);

  // Handle command execution
  const executeCommand = useCallback(
    (command: Command) => {
      // Track recent commands
      const newRecent = [
        command.id,
        ...recentCommands.filter((id) => id !== command.id),
      ].slice(0, 10);
      setRecentCommands(newRecent);
      localStorage.setItem("adrata-recent-commands", JSON.stringify(newRecent));

      // Execute the command
      command.action();
      onClose();
    },
    [recentCommands, onClose],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredCommands.length - 1),
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose, executeCommand]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-start justify-center pt-[20vh] px-4">
        <div className="w-full max-w-2xl bg-[var(--background)] dark:bg-[var(--foreground)] rounded-xl shadow-2xl border border-[var(--border)] dark:border-[var(--border)] overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-[var(--border)] dark:border-[var(--border)]">
            <input
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[var(--foreground)] placeholder-[var(--muted)] ml-3"
              autoFocus
            />
            <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
              <kbd className="px-2 py-1 bg-[var(--hover)] rounded border">
                ↵
              </kbd>
              <span>to select</span>
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands['length'] === 0 ? (
              <div className="px-4 py-8 text-center text-[var(--muted)]">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No commands found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              <div className="py-2">
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={() => executeCommand(command)}
                    className={`w-full flex items-center px-4 py-3 text-left hover:bg-[var(--panel-background)] transition-colors ${
                      index === selectedIndex
                        ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--hover)] mr-3">
                      {command.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[var(--foreground)] dark:text-[var(--foreground)] truncate">
                          {command.title}
                        </h3>
                        {recentCommands.includes(command.id) && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                            Recent
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)] truncate">
                        {command.description}
                      </p>
                    </div>
                    {command['shortcut'] && (
                      <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                        {command.shortcut.split("").map((key, i) => (
                          <kbd
                            key={i}
                            className="px-2 py-1 bg-[var(--hover)] rounded border"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-[var(--panel-background)] border-t border-[var(--border)] dark:border-[var(--border)]">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-[var(--background)] rounded border">
                    ↑↓
                  </kbd>
                  <span>to navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-[var(--background)] rounded border">
                    esc
                  </kbd>
                  <span>to close</span>
                </div>
              </div>
              <div className="text-[var(--muted)]">
                {filteredCommands.length} commands
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
