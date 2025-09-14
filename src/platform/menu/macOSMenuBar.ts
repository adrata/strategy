/**
 * 🍎 COMPREHENSIVE macOS MENU BAR
 * Production-ready menu configuration for Adrata
 * Replaces default Cursor/VS Code menus with app-specific functionality
 */

export interface MenuAction {
  id: string;
  action: string;
  accelerator?: string;
  enabled?: boolean;
}

export interface MenuItem {
  id?: string;
  label?: string; // Optional for separators
  accelerator?: string;
  role?: string;
  type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  submenu?: MenuItem[];
  action?: string;
}

export interface MenuBarConfig {
  label: string;
  submenu: MenuItem[];
}

// Production Adrata menu configuration
export const ADRATA_MENU_CONFIG: MenuBarConfig[] = [
  // App Menu (appears as "Adrata" in top-left)
  {
    label: "Adrata",
    submenu: [
      {
        label: "About Adrata",
        action: "app:about",
      },
      {
        label: "Check for Updates...",
        action: "app:check-updates",
      },
      {
        type: "separator",
      },
      {
        label: "Preferences...",
        accelerator: "CmdOrCtrl+,",
        action: "app:preferences",
      },
      {
        type: "separator",
      },
      {
        label: "Services",
        role: "services",
        submenu: [],
      },
      {
        type: "separator",
      },
      {
        label: "Hide Adrata",
        accelerator: "CmdOrCtrl+H",
        role: "hide",
      },
      {
        label: "Hide Others",
        accelerator: "CmdOrCtrl+Alt+H",
        role: "hideothers",
      },
      {
        label: "Show All",
        role: "unhide",
      },
      {
        type: "separator",
      },
      {
        label: "Quit Adrata",
        accelerator: "CmdOrCtrl+Q",
        role: "quit",
      },
    ],
  },

  // File Menu
  {
    label: "File",
    submenu: [
      {
        label: "New Workspace",
        accelerator: "CmdOrCtrl+N",
        action: "file:new-workspace",
      },
      {
        label: "Open Workspace...",
        accelerator: "CmdOrCtrl+O",
        action: "file:open-workspace",
      },
      {
        label: "Recent Workspaces",
        submenu: [
          {
            label: "Clear Recent",
            action: "file:clear-recent",
          },
        ],
      },
      {
        type: "separator",
      },
      {
        label: "New Company Profile",
        accelerator: "CmdOrCtrl+Shift+N",
        action: "file:new-company",
      },
      {
        label: "Import Data...",
        accelerator: "CmdOrCtrl+I",
        action: "file:import-data",
      },
      {
        label: "Export Data...",
        accelerator: "CmdOrCtrl+E",
        action: "file:export-data",
      },
      {
        type: "separator",
      },
      {
        label: "Save Current View",
        accelerator: "CmdOrCtrl+S",
        action: "file:save-view",
      },
      {
        label: "Save All Changes",
        accelerator: "CmdOrCtrl+Shift+S",
        action: "file:save-all",
      },
      {
        type: "separator",
      },
      {
        label: "Print Report...",
        accelerator: "CmdOrCtrl+P",
        action: "file:print",
      },
    ],
  },

  // Edit Menu
  {
    label: "Edit",
    submenu: [
      {
        label: "Undo",
        accelerator: "CmdOrCtrl+Z",
        role: "undo",
      },
      {
        label: "Redo",
        accelerator: "CmdOrCtrl+Shift+Z",
        role: "redo",
      },
      {
        type: "separator",
      },
      {
        label: "Cut",
        accelerator: "CmdOrCtrl+X",
        role: "cut",
      },
      {
        label: "Copy",
        accelerator: "CmdOrCtrl+C",
        role: "copy",
      },
      {
        label: "Paste",
        accelerator: "CmdOrCtrl+V",
        role: "paste",
      },
      {
        label: "Select All",
        accelerator: "CmdOrCtrl+A",
        role: "selectall",
      },
      {
        type: "separator",
      },
      {
        label: "Find...",
        accelerator: "CmdOrCtrl+F",
        action: "edit:find",
      },
      {
        label: "Find and Replace...",
        accelerator: "CmdOrCtrl+Alt+F",
        action: "edit:find-replace",
      },
      {
        label: "Find Next",
        accelerator: "CmdOrCtrl+G",
        action: "edit:find-next",
      },
      {
        label: "Find Previous",
        accelerator: "CmdOrCtrl+Shift+G",
        action: "edit:find-previous",
      },
    ],
  },

  // View Menu
  {
    label: "View",
    submenu: [
      {
        label: "Command Palette",
        accelerator: "CmdOrCtrl+Shift+P",
        action: "view:command-palette",
      },
      {
        type: "separator",
      },
      {
        label: "Apps",
        submenu: [
          {
            label: "Acquire (Lead Intelligence)",
            accelerator: "CmdOrCtrl+1",
            action: "view:app-acquire",
          },
          {
            label: "Monaco (Company Analysis)",
            accelerator: "CmdOrCtrl+2",
            action: "view:app-monaco",
          },
          {
            label: "Speedrun (Communication)",
            accelerator: "CmdOrCtrl+3",
            action: "view:app-speedrun",
          },
          {
            label: "Pipeline (Opportunities)",
            accelerator: "CmdOrCtrl+4",
            action: "view:app-pipeline",
          },
          {
            label: "Navigate (Leadership)",
            accelerator: "CmdOrCtrl+5",
            action: "view:app-navigate",
          },
          {
            label: "Chessboard (VC/PE)",
            accelerator: "CmdOrCtrl+7",
            action: "view:app-chessboard",
          },
          {
            label: "Battleground (Competition)",
            accelerator: "CmdOrCtrl+6",
            action: "view:app-battleground",
          },
          {
            label: "Catalyst (Partnerships)",
            accelerator: "CmdOrCtrl+8",
            action: "view:app-catalyst",
          },
          {
            label: "Recruit (Hiring)",
            accelerator: "CmdOrCtrl+9",
            action: "view:app-recruit",
          },
          {
            type: "separator",
          },
          {
            label: "All Departmental Apps",
            accelerator: "CmdOrCtrl+Shift+A",
            action: "view:all-apps",
          },
        ],
      },
      {
        type: "separator",
      },
      {
        label: "Layout",
        submenu: [
          {
            label: "Grid Layout",
            accelerator: "CmdOrCtrl+Alt+1",
            action: "view:layout-grid",
            type: "radio",
            checked: true,
          },
          {
            label: "Column Layout",
            accelerator: "CmdOrCtrl+Alt+2",
            action: "view:layout-columns",
            type: "radio",
          },
          {
            label: "Stack Layout",
            accelerator: "CmdOrCtrl+Alt+3",
            action: "view:layout-stack",
            type: "radio",
          },
          {
            type: "separator",
          },
          {
            label: "Reset Layout",
            action: "view:layout-reset",
          },
        ],
      },
      {
        type: "separator",
      },
      {
        label: "Sidebar",
        submenu: [
          {
            label: "Show Sidebar",
            accelerator: "CmdOrCtrl+Shift+E",
            action: "view:toggle-sidebar",
            type: "checkbox",
            checked: true,
          },
          {
            label: "Show Activity Bar",
            action: "view:toggle-activity-bar",
            type: "checkbox",
            checked: true,
          },
        ],
      },
      {
        label: "Panels",
        submenu: [
          {
            label: "Terminal",
            accelerator: "CmdOrCtrl+`",
            action: "view:toggle-terminal",
          },
          {
            label: "Output",
            accelerator: "CmdOrCtrl+Shift+U",
            action: "view:toggle-output",
          },
          {
            label: "Debug Console",
            accelerator: "CmdOrCtrl+Shift+Y",
            action: "view:toggle-debug",
          },
          {
            label: "Intelligence Feed",
            accelerator: "CmdOrCtrl+Shift+I",
            action: "view:toggle-intelligence",
          },
        ],
      },
      {
        type: "separator",
      },
      {
        label: "Zoom In",
        accelerator: "CmdOrCtrl+Plus",
        action: "view:zoom-in",
      },
      {
        label: "Zoom Out",
        accelerator: "CmdOrCtrl+-",
        action: "view:zoom-out",
      },
      {
        label: "Reset Zoom",
        accelerator: "CmdOrCtrl+0",
        action: "view:zoom-reset",
      },
      {
        type: "separator",
      },
      {
        label: "Enter Full Screen",
        accelerator: "Ctrl+Cmd+F",
        role: "togglefullscreen",
      },
    ],
  },

  // Intelligence Menu
  {
    label: "Intelligence",
    submenu: [
      {
        label: "Run Monaco Pipeline",
        accelerator: "CmdOrCtrl+Shift+M",
        action: "intelligence:run-monaco",
      },
      {
        label: "Enrich Current Company",
        accelerator: "CmdOrCtrl+Shift+R",
        action: "intelligence:enrich-company",
      },
      {
        type: "separator",
      },
      {
        label: "Flight Risk Analysis",
        submenu: [
          {
            label: "Analyze All Contacts",
            action: "intelligence:flight-risk-all",
          },
          {
            label: "Analyze Current Contact",
            action: "intelligence:flight-risk-current",
          },
          {
            label: "View Risk Dashboard",
            action: "intelligence:flight-risk-dashboard",
          },
        ],
      },
      {
        label: "Strategic Analysis",
        submenu: [
          {
            label: "Company Strategy Assessment",
            action: "intelligence:strategy-assessment",
          },
          {
            label: "Competitive Analysis",
            action: "intelligence:competitive-analysis",
          },
          {
            label: "Market Intelligence",
            action: "intelligence:market-intelligence",
          },
        ],
      },
      {
        type: "separator",
      },
      {
        label: "AI Assistant",
        accelerator: "CmdOrCtrl+K",
        action: "intelligence:ai-assistant",
      },
      {
        label: "Smart Suggestions",
        accelerator: "CmdOrCtrl+Space",
        action: "intelligence:suggestions",
      },
      {
        type: "separator",
      },
      {
        label: "Data Sources",
        submenu: [
          {
            label: "Configure Sources...",
            action: "intelligence:configure-sources",
          },
          {
            label: "Test Connections",
            action: "intelligence:test-connections",
          },
          {
            label: "Sync All Data",
            action: "intelligence:sync-all",
          },
        ],
      },
    ],
  },

  // Tools Menu
  {
    label: "Tools",
    submenu: [
      {
        label: "Speedrun Campaign Builder",
        accelerator: "CmdOrCtrl+Alt+O",
        action: "tools:speedrun-builder",
      },
      {
        label: "Report Generator",
        accelerator: "CmdOrCtrl+Alt+R",
        action: "tools:report-generator",
      },
      {
        label: "Data Import Wizard",
        accelerator: "CmdOrCtrl+Alt+I",
        action: "tools:import-wizard",
      },
      {
        type: "separator",
      },
      {
        label: "Enterprise Tools",
        submenu: [
          {
            label: "User Management",
            action: "tools:user-management",
          },
          {
            label: "Workspace Settings",
            action: "tools:workspace-settings",
          },
          {
            label: "Security & Compliance",
            action: "tools:security-compliance",
          },
          {
            label: "API Configuration",
            action: "tools:api-config",
          },
        ],
      },
      {
        label: "Integration Hub",
        submenu: [
          {
            label: "Salesforce Sync",
            action: "tools:salesforce-sync",
          },
          {
            label: "HubSpot Integration",
            action: "tools:hubspot-integration",
          },
          {
            label: "LinkedIn Sales Navigator",
            action: "tools:linkedin-integration",
          },
          {
            label: "Custom Integrations",
            action: "tools:custom-integrations",
          },
        ],
      },
      {
        type: "separator",
      },
      {
        label: "Developer Tools",
        submenu: [
          {
            label: "Toggle Developer Tools",
            accelerator: "F12",
            role: "toggledevtools",
          },
          {
            label: "Reload",
            accelerator: "CmdOrCtrl+R",
            role: "reload",
          },
          {
            label: "Force Reload",
            accelerator: "CmdOrCtrl+Shift+R",
            role: "forcereload",
          },
        ],
      },
    ],
  },

  // Window Menu
  {
    label: "Window",
    submenu: [
      {
        label: "Minimize",
        accelerator: "CmdOrCtrl+M",
        role: "minimize",
      },
      {
        label: "Close",
        accelerator: "CmdOrCtrl+W",
        role: "close",
      },
      {
        type: "separator",
      },
      {
        label: "New Window",
        accelerator: "CmdOrCtrl+Shift+N",
        action: "window:new",
      },
      {
        label: "Duplicate Window",
        action: "window:duplicate",
      },
      {
        type: "separator",
      },
      {
        label: "Split Editor Right",
        accelerator: "CmdOrCtrl+\\",
        action: "window:split-right",
      },
      {
        label: "Split Editor Down",
        accelerator: "CmdOrCtrl+Shift+\\",
        action: "window:split-down",
      },
      {
        type: "separator",
      },
      {
        label: "Bring All to Front",
        role: "front",
      },
    ],
  },

  // Help Menu
  {
    label: "Help",
    submenu: [
      {
        label: "Welcome Guide",
        action: "help:welcome",
      },
      {
        label: "User Manual",
        accelerator: "F1",
        action: "help:manual",
      },
      {
        label: "Video Tutorials",
        action: "help:tutorials",
      },
      {
        label: "Keyboard Shortcuts",
        accelerator: "CmdOrCtrl+/",
        action: "help:shortcuts",
      },
      {
        type: "separator",
      },
      {
        label: "API Documentation",
        action: "help:api-docs",
      },
      {
        label: "Release Notes",
        action: "help:release-notes",
      },
      {
        type: "separator",
      },
      {
        label: "Contact Support",
        action: "help:contact-support",
      },
      {
        label: "Send Feedback",
        action: "help:send-feedback",
      },
      {
        label: "Feature Requests",
        action: "help:feature-requests",
      },
      {
        type: "separator",
      },
      {
        label: "Community Forum",
        action: "help:community",
      },
      {
        label: "Status Page",
        action: "help:status",
      },
      {
        type: "separator",
      },
      {
        label: "Privacy Policy",
        action: "help:privacy",
      },
      {
        label: "Terms of Service",
        action: "help:terms",
      },
    ],
  },
];

// Menu action handlers
export const MENU_ACTIONS = {
  // App actions
  "app:about": () => {
    // Show about dialog
    console.log("Show about dialog");
  },
  "app:check-updates": () => {
    // Check for updates
    console.log("Check for updates");
  },
  "app:preferences": () => {
    // Open preferences
    console.log("Open preferences");
  },

  // File actions
  "file:new-workspace": () => {
    // Create new workspace
    console.log("Create new workspace");
  },
  "file:open-workspace": () => {
    // Open workspace dialog
    console.log("Open workspace dialog");
  },
  "file:new-company": () => {
    // Create new company profile
    console.log("Create new company profile");
  },
  "file:import-data": () => {
    // Open import wizard
    console.log("Open import wizard");
  },
  "file:export-data": () => {
    // Open export dialog
    console.log("Open export dialog");
  },

  // View actions
  "view:command-palette": () => {
    // Open command palette
    console.log("Open command palette");
  },
  "view:app-acquire": () => {
    // Navigate to Acquire app
    console.log("Navigate to Acquire app");
  },
  "view:app-monaco": () => {
    // Navigate to Monaco app
    console.log("Navigate to Monaco app");
  },
  "view:app-speedrun": () => {
    // Navigate to Speedrun app
    console.log("Navigate to Speedrun app");
  },
  "view:app-catalyst": () => {
    // Navigate to Catalyst app
    console.log("Navigate to Catalyst app");
  },
  "view:app-recruit": () => {
    // Navigate to Recruit app
    console.log("Navigate to Recruit app");
  },
  "view:toggle-sidebar": () => {
    // Toggle sidebar visibility
    console.log("Toggle sidebar");
  },

  // Intelligence actions
  "intelligence:run-monaco": () => {
    // Run Monaco pipeline
    console.log("Run Monaco pipeline");
  },
  "intelligence:enrich-company": () => {
    // Enrich current company
    console.log("Enrich current company");
  },
  "intelligence:ai-assistant": () => {
    // Open AI assistant
    console.log("Open AI assistant");
  },

  // Tools actions
  "tools:speedrun-builder": () => {
    // Open speedrun campaign builder
    console.log("Open speedrun builder");
  },
  "tools:report-generator": () => {
    // Open report generator
    console.log("Open report generator");
  },

  // Help actions
  "help:welcome": () => {
    // Show welcome guide
    console.log("Show welcome guide");
  },
  "help:manual": () => {
    // Open user manual
    console.log("Open user manual");
  },
  "help:shortcuts": () => {
    // Show keyboard shortcuts
    console.log("Show keyboard shortcuts");
  },
  "help:contact-support": () => {
    // Open support contact
    console.log("Contact support");
  },
};

// Utility function to create menu from config
export function createMenuFromConfig(config: MenuBarConfig[]): any {
  // This would be used with Tauri's menu API
  return config.map((menu) => ({
    label: menu.label,
    submenu: menu.submenu.map((item) => ({
      ...item,
      click: item.action
        ? MENU_ACTIONS[item.action as keyof typeof MENU_ACTIONS]
        : undefined,
    })),
  }));
}

// Keyboard shortcut mappings
export const KEYBOARD_SHORTCUTS = {
  "CmdOrCtrl+N": "file:new-workspace",
  "CmdOrCtrl+O": "file:open-workspace",
  "CmdOrCtrl+S": "file:save-view",
  "CmdOrCtrl+Shift+P": "view:command-palette",
  "CmdOrCtrl+K": "intelligence:ai-assistant",
  "CmdOrCtrl+Shift+M": "intelligence:run-monaco",
  F1: "help:manual",
  "CmdOrCtrl+/": "help:shortcuts",
  "CmdOrCtrl+1": "view:app-acquire",
  "CmdOrCtrl+2": "view:app-monaco",
  "CmdOrCtrl+3": "view:app-speedrun",
  "CmdOrCtrl+4": "view:app-pipeline",
  "CmdOrCtrl+5": "view:app-navigate",
  "CmdOrCtrl+7": "view:app-chessboard",
  "CmdOrCtrl+6": "view:app-battleground",
  "CmdOrCtrl+Shift+E": "view:toggle-sidebar",
  "CmdOrCtrl+`": "view:toggle-terminal",
};

export default ADRATA_MENU_CONFIG;
