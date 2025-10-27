/**
 * 🌟 KEYBOARD SHORTCUTS SYSTEM
 *
 * Inspired by VSCode, Figma, Notion, Linear, and Superhuman
 * Follows TRACK principles: Typing efficiency, Rememberability, Adherence to conventions, Coherence, Keyboard layout support
 */

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  category: ShortcutCategory;
  context?: ShortcutContext[];
  platform: Platform[];
  action: string;
  sequence?: boolean;
  confidence: number; // 0-1 based on memorability
  ergonomics: number; // 0-1 based on typing efficiency
}

export type ShortcutCategory =
  | "navigation"
  | "editing"
  | "view"
  | "file"
  | "intelligence"
  | "collaboration"
  | "system"
  | "search"
  | "help";

export type ShortcutContext =
  | "global"
  | "text-editor"
  | "dashboard"
  | "modal"
  | "command-palette"
  | "chat"
  | "canvas";

export type Platform = "web" | "desktop" | "mobile";

/**
 * TIER 1: UNIVERSAL SHORTCUTS (Must work everywhere)
 * These are the most important shortcuts that every user should know
 */
export const UNIVERSAL_SHORTCUTS: KeyboardShortcut[] = [
  // Command Palette (Universal Entry Point)
  {
    id: "command-palette",
    keys: ["⌘+K", "Ctrl+K"],
    description: "Open command palette",
    category: "system",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "open-command-palette",
    confidence: 0.95,
    ergonomics: 0.9,
  },

  // Quick Search
  {
    id: "quick-search",
    keys: ["⌘+/", "Ctrl+/"],
    description: "Quick search across all data",
    category: "search",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "open-quick-search",
    confidence: 0.9,
    ergonomics: 0.85,
  },

  // AI Assistant
  {
    id: "ai-assistant",
    keys: ["⌘+J", "Ctrl+J"],
    description: "Toggle AI assistant",
    category: "intelligence",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "toggle-ai-assistant",
    confidence: 0.85,
    ergonomics: 0.9,
  },

  // Focus Search Input
  {
    id: "focus-search",
    keys: ["/"],
    description: "Focus search input",
    category: "search",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "focus-search-input",
    confidence: 0.95,
    ergonomics: 0.95,
  },

  // Panel Controls
  {
    id: "toggle-left-panel",
    keys: ["⌘+B", "Ctrl+B"],
    description: "Toggle left sidebar",
    category: "view",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "toggle-left-panel",
    confidence: 0.95,
    ergonomics: 0.9,
  },

  {
    id: "toggle-right-panel",
    keys: ["⌘+Shift+B", "Ctrl+Shift+B"],
    description: "Toggle right panel (AI chat)",
    category: "view",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "toggle-right-panel",
    confidence: 0.8,
    ergonomics: 0.75,
  },

];

/**
 * TIER 2: NAVIGATION SHORTCUTS (Go-to patterns)
 * Following Linear/GitHub pattern: G + Letter for navigation
 */
export const NAVIGATION_SHORTCUTS: KeyboardShortcut[] = [
  // Core Applications (Cmd+Number pattern)
  {
    id: "go-aos",
    keys: ["⌘+1", "Ctrl+1"],
    description: "Go to AOS",
    category: "navigation",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "navigate-to-aos",
    confidence: 0.9,
    ergonomics: 0.95,
  },

  {
    id: "go-monaco",
    keys: ["⌘+2", "Ctrl+2"],
    description: "Go to Monaco",
    category: "navigation",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "navigate-to-monaco",
    confidence: 0.9,
    ergonomics: 0.95,
  },

  {
    id: "go-oasis",
    keys: ["⌘+3", "Ctrl+3"],
    description: "Go to Oasis",
    category: "navigation",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "navigate-to-oasis",
    confidence: 0.9,
    ergonomics: 0.95,
  },

  {
    id: "go-speedrun",
    keys: ["⌘+4", "Ctrl+4"],
    description: "Go to Speedrun",
    category: "navigation",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "navigate-to-speedrun",
    confidence: 0.9,
    ergonomics: 0.95,
  },

  {
    id: "go-briefcase",
    keys: ["⌘+5", "Ctrl+5"],
    description: "Go to Briefcase",
    category: "navigation",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "navigate-to-briefcase",
    confidence: 0.9,
    ergonomics: 0.95,
  },

  // Go-to Sequences (G + Letter pattern)
  {
    id: "go-tower",
    keys: ["G", "T"],
    description: "Go to Tower (Leadership)",
    category: "navigation",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "navigate-to-tower",
    sequence: true,
    confidence: 0.85,
    ergonomics: 0.8,
  },

  {
    id: "go-navigate",
    keys: ["G", "N"],
    description: "Go to Navigate (Strategy)",
    category: "navigation",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "navigate-to-navigate",
    sequence: true,
    confidence: 0.85,
    ergonomics: 0.8,
  },

  {
    id: "go-battleground",
    keys: ["G", "B"],
    description: "Go to Battleground (Competition)",
    category: "navigation",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "navigate-to-battleground",
    sequence: true,
    confidence: 0.85,
    ergonomics: 0.8,
  },

  {
    id: "go-chessboard",
    keys: ["G", "C"],
    description: "Go to Chessboard (VC/PE)",
    category: "navigation",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "navigate-to-chessboard",
    sequence: true,
    confidence: 0.85,
    ergonomics: 0.8,
  },

  {
    id: "go-grand-central",
    keys: ["G", "G"],
    description: "Go to Grand Central (Hub)",
    category: "navigation",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "navigate-to-grand-central",
    sequence: true,
    confidence: 0.9,
    ergonomics: 0.8,
  },

  {
    id: "go-store",
    keys: ["G", "S"],
    description: "Go to Store (All Apps)",
    category: "navigation",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "navigate-to-store",
    sequence: true,
    confidence: 0.85,
    ergonomics: 0.8,
  },
];

/**
 * TIER 3: PRODUCTIVITY SHORTCUTS
 * Context-aware shortcuts for specific workflows
 */
export const PRODUCTIVITY_SHORTCUTS: KeyboardShortcut[] = [
  // File Operations
  {
    id: "new-workspace",
    keys: ["⌘+N", "Ctrl+N"],
    description: "Create new workspace",
    category: "file",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "create-new-workspace",
    confidence: 0.95,
    ergonomics: 0.9,
  },

  {
    id: "save-view",
    keys: ["⌘+S", "Ctrl+S"],
    description: "Save current view/state",
    category: "file",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "save-current-view",
    confidence: 0.95,
    ergonomics: 0.9,
  },

  {
    id: "open-workspace",
    keys: ["⌘+O", "Ctrl+O"],
    description: "Open workspace",
    category: "file",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "open-workspace",
    confidence: 0.9,
    ergonomics: 0.9,
  },

  // Intelligence Operations
  {
    id: "run-monaco",
    keys: ["⌘+R", "Ctrl+R"],
    description: "Run Monaco pipeline",
    category: "intelligence",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "run-monaco-pipeline",
    confidence: 0.85,
    ergonomics: 0.9,
  },

  {
    id: "enrich-company",
    keys: ["⌘+Shift+R", "Ctrl+Shift+R"],
    description: "Enrich current company",
    category: "intelligence",
    context: ["dashboard"],
    platform: ["web", "desktop"],
    action: "enrich-current-company",
    confidence: 0.75,
    ergonomics: 0.7,
  },

  // Collaboration
  {
    id: "share-view",
    keys: ["⌘+Shift+S", "Ctrl+Shift+S"],
    description: "Share current view",
    category: "collaboration",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "share-current-view",
    confidence: 0.75,
    ergonomics: 0.7,
  },

  // Data Operations
  {
    id: "import-data",
    keys: ["⌘+I", "Ctrl+I"],
    description: "Import data",
    category: "file",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "import-data",
    confidence: 0.8,
    ergonomics: 0.9,
  },

  {
    id: "export-data",
    keys: ["⌘+E", "Ctrl+E"],
    description: "Export data",
    category: "file",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "export-data",
    confidence: 0.8,
    ergonomics: 0.9,
  },
];

/**
 * TIER 4: ADVANCED SHORTCUTS
 * Power user shortcuts for complex workflows
 */
export const ADVANCED_SHORTCUTS: KeyboardShortcut[] = [
  // Layout Controls
  {
    id: "layout-grid",
    keys: ["⌘+Option+1", "Ctrl+Alt+1"],
    description: "Switch to grid layout",
    category: "view",
    context: ["dashboard"],
    platform: ["web", "desktop"],
    action: "set-layout-grid",
    confidence: 0.6,
    ergonomics: 0.5,
  },

  {
    id: "layout-columns",
    keys: ["⌘+Option+2", "Ctrl+Alt+2"],
    description: "Switch to column layout",
    category: "view",
    context: ["dashboard"],
    platform: ["web", "desktop"],
    action: "set-layout-columns",
    confidence: 0.6,
    ergonomics: 0.5,
  },

  {
    id: "layout-stack",
    keys: ["⌘+Option+3", "Ctrl+Alt+3"],
    description: "Switch to stack layout",
    category: "view",
    context: ["dashboard"],
    platform: ["web", "desktop"],
    action: "set-layout-stack",
    confidence: 0.6,
    ergonomics: 0.5,
  },

  // Developer Tools
  {
    id: "toggle-devtools",
    keys: ["F12"],
    description: "Toggle developer tools",
    category: "system",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "toggle-devtools",
    confidence: 0.9,
    ergonomics: 0.95,
  },

  // Terminal/Console
  {
    id: "toggle-terminal",
    keys: ["⌘+`", "Ctrl+`"],
    description: "Toggle terminal/console",
    category: "system",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "toggle-terminal",
    confidence: 0.85,
    ergonomics: 0.7,
  },
];

/**
 * MOBILE SHORTCUTS (Gesture-based)
 * For mobile interfaces, we use gesture shortcuts
 */
export const MOBILE_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: "mobile-command-palette",
    keys: ["Long press search"],
    description: "Open command palette",
    category: "system",
    context: ["global"],
    platform: ["mobile"],
    action: "open-command-palette",
    confidence: 0.7,
    ergonomics: 0.8,
  },

  {
    id: "mobile-ai-assistant",
    keys: ["Double tap AI button"],
    description: "Quick AI assistant",
    category: "intelligence",
    context: ["global"],
    platform: ["mobile"],
    action: "quick-ai-assistant",
    confidence: 0.8,
    ergonomics: 0.9,
  },

  {
    id: "mobile-app-switcher",
    keys: ["Swipe up from bottom"],
    description: "App switcher",
    category: "navigation",
    context: ["global"],
    platform: ["mobile"],
    action: "open-app-switcher",
    confidence: 0.85,
    ergonomics: 0.9,
  },
];

/**
 * HELP & SYSTEM SHORTCUTS
 */
export const HELP_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: "help-shortcuts",
    keys: ["⌘+/", "Ctrl+/", "?"],
    description: "Show keyboard shortcuts",
    category: "help",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "show-shortcuts-help",
    confidence: 0.9,
    ergonomics: 0.85,
  },

  {
    id: "help-manual",
    keys: ["F1"],
    description: "Open user manual",
    category: "help",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "open-user-manual",
    confidence: 0.95,
    ergonomics: 0.95,
  },

  {
    id: "preferences",
    keys: ["⌘+,", "Ctrl+,"],
    description: "Open preferences",
    category: "system",
    context: ["global"],
    platform: ["web", "desktop"],
    action: "open-preferences",
    confidence: 0.9,
    ergonomics: 0.85,
  },
];

// Combine all shortcuts
export const ALL_SHORTCUTS = [
  ...UNIVERSAL_SHORTCUTS,
  ...NAVIGATION_SHORTCUTS,
  ...PRODUCTIVITY_SHORTCUTS,
  ...ADVANCED_SHORTCUTS,
  ...MOBILE_SHORTCUTS,
  ...HELP_SHORTCUTS,
];

/**
 * CONFLICT DETECTION
 * Check for conflicts with browser/OS shortcuts
 */
export const BROWSER_CONFLICTS = {
  "Ctrl+T": "New tab (reserved)",
  "Ctrl+W": "Close tab (reserved)",
  "Ctrl+N": "New window (overrideable)",
  "Ctrl+R": "Reload page (overrideable in app context)",
  "Ctrl+F": "Find in page (should not override)",
  "Ctrl+A": "Select all (context-dependent)",
  "Ctrl+Z": "Undo (context-dependent)",
  "Ctrl+Y": "Redo (context-dependent)",
};

/**
 * ERGONOMICS SCORING
 * Rate shortcuts based on typing efficiency
 */
export function calculateErgonomics(keys: string[]): number {
  let score = 1.0;

  // Penalize multiple modifiers
  const modifierCount = (keys[0]?.split("+").length || 1) - 1;
  if (modifierCount > 2) score -= 0.3;
  if (modifierCount > 1) score -= 0.1;

  // Reward home row keys
  const homeRowKeys = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
  const lastKey = keys[0]?.split("+").pop()?.toUpperCase();
  if (lastKey && homeRowKeys.includes(lastKey)) score += 0.1;

  // Penalize sequences
  if (keys.length > 1) score -= 0.2;

  return Math.max(0, Math.min(1, score));
}

/**
 * MEMORABILITY SCORING
 * Rate shortcuts based on how easy they are to remember
 */
export function calculateMemorability(shortcut: KeyboardShortcut): number {
  let score = 0.5; // Base score

  // Reward conventional shortcuts
  if (
    shortcut.keys.some(
      (k) =>
        k.includes("Ctrl+C") || k.includes("Ctrl+V") || k.includes("Ctrl+Z"),
    )
  ) {
    score += 0.4;
  }

  // Reward mnemonic shortcuts (first letter matches)
  const action = shortcut.action.toLowerCase();
  const key = shortcut['keys'][0]?.split("+").pop()?.toLowerCase();
  if (key && action.startsWith(key)) {
    score += 0.3;
  }

  // Reward go-to patterns
  if (shortcut['sequence'] && shortcut['keys'][0] === "G") {
    score += 0.2;
  }

  return Math.max(0, Math.min(1, score));
}

const keyboardShortcuts = {
  ALL_SHORTCUTS,
  UNIVERSAL_SHORTCUTS,
  NAVIGATION_SHORTCUTS,
  PRODUCTIVITY_SHORTCUTS,
  ADVANCED_SHORTCUTS,
  MOBILE_SHORTCUTS,
  HELP_SHORTCUTS,
  BROWSER_CONFLICTS,
  calculateErgonomics,
  calculateMemorability,
};

export default keyboardShortcuts;
