import { DocSection } from "../types/docs";

export const docsContent: { sections: DocSection[] } = {
  sections: [
    {
      id: "overview",
      title: "Overview",
      description: "User guides and getting started",
      icon: "book",
      pages: [
        {
          id: "introduction",
          title: "Introduction",
          description: "Welcome to Adrata",
          lastUpdated: "2025-01-10",
          tags: ["getting-started", "overview"],
          content: `# Introduction to Adrata

Welcome to Adrata, the comprehensive business intelligence and sales platform that combines AI-powered insights, pipeline management, and integration capabilities.

## What is Adrata?

Adrata is an all-in-one platform that provides:

- **Action Platform (Falcon)** - Advanced pipeline management with AI-powered insights and relationship intelligence
- **Monaco** - Business intelligence with alternative data sources and prospecting tools
- **Grand Central** - Integration hub connecting 500+ applications and services
- **Olympus** - Workflow automation and orchestration platform
- **Speedrun** - Quick actions and communication platform for rapid execution

## Key Features

### AI-Powered Intelligence
Leverage Claude, GPT-4, and Gemini for intelligent prospect research and buyer group analysis with 95% cost optimization.

### Pipeline Management
Manage your entire sales pipeline with advanced CRM capabilities, deal tracking, and relationship intelligence.

### Integration Hub
Connect with 500+ applications through our Nango-powered integration platform.

### Workflow Automation
Automate complex workflows and orchestrate multi-step processes with visual builders.

## Getting Started

1. **Set up your workspace** - Configure your team and permissions
2. **Connect integrations** - Link your CRM, email, and other tools
3. **Import your data** - Bring in existing contacts and deals
4. **Start using AI** - Leverage our intelligence features

Ready to dive in? Check out the Quick Start Guide to begin.
`
        },
        {
          id: "quick-start",
          title: "Quick Start",
          description: "Get up and running in minutes",
          lastUpdated: "2025-01-10",
          tags: ["getting-started", "tutorial"],
          content: `# Quick Start Guide

Get started with Adrata in just a few minutes.

## Prerequisites

Before you begin, make sure you have:
- A valid Adrata account
- Access to a workspace
- Basic understanding of sales and business processes

## Step 1: Access Your Workspace

1. Log in to your Adrata account
2. Select your workspace from the profile menu
3. You'll be taken to your workspace dashboard

## Step 2: Explore the Applications

### Action Platform (Falcon)
Your main pipeline management tool for tracking deals and opportunities.

### Monaco
Business intelligence and prospecting with alternative data sources.

### Grand Central
Integration hub for connecting external applications.

### Olympus
Workflow automation for creating automated processes.

### Speedrun
Quick actions for performing rapid tasks and communications.

## Step 3: Set Up Your First Integration

1. Navigate to **Grand Central**
2. Click **Add Integration**
3. Select from 500+ available integrations
4. Follow the setup wizard to connect your account

## Step 4: Create Your First Workflow

1. Go to **Olympus**
2. Click **Create Workflow**
3. Add nodes for triggers and actions
4. Connect them to create your workflow
5. Test and activate your workflow

## Step 5: Import Your Data

1. Navigate to **Action Platform**
2. Use the import tools to bring in your existing data
3. Map your data fields to Adrata's structure
4. Review and confirm the import

## Next Steps

- Explore the Action Platform Guide
- Learn about Monaco Intelligence
- Set up API integrations
`
        }
      ]
    },
    {
      id: "api",
      title: "API Reference",
      description: "Developer documentation and API guides",
      icon: "code",
      pages: [
        {
          id: "api-authentication",
          title: "Authentication",
          description: "API authentication and authorization",
          lastUpdated: "2025-01-10",
          tags: ["api", "authentication", "security"],
          content: `# API Authentication

Learn how to authenticate with the Adrata API using API keys and OAuth 2.0.

## Authentication Methods

Adrata supports two authentication methods:

1. **API Keys** - For server-to-server integrations
2. **OAuth 2.0** - For user-authorized applications

## API Keys

### Obtaining an API Key

1. Log in to your Adrata workspace
2. Navigate to **Settings** → **API Keys**
3. Click **Generate New Key**
4. Name your API key
5. Copy the key (it will only be shown once)
6. Store it securely

### Using API Keys

Include your API key in the \`Authorization\` header:

\`\`\`bash
curl https://api.adrata.com/v1/contacts \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

### Best Practices

- **Never commit API keys** - Use environment variables
- **Rotate regularly** - Change keys every 90 days
- **Use separate keys** - Different keys for dev/staging/production
- **Restrict scope** - Only grant necessary permissions
- **Monitor usage** - Track API key usage for anomalies

## OAuth 2.0

### Authorization Code Flow

1. **Redirect user to authorization URL**

\`\`\`
https://auth.adrata.com/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=contacts:read contacts:write pipeline:read pipeline:write
\`\`\`

2. **User authorizes your application**

3. **Receive authorization code at redirect URI**

4. **Exchange code for access token**

\`\`\`bash
curl -X POST https://auth.adrata.com/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=AUTHORIZATION_CODE" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET" \\
  -d "redirect_uri=YOUR_REDIRECT_URI"
\`\`\`

5. **Use access token for API calls**

\`\`\`bash
curl https://api.adrata.com/v1/contacts \\
  -H "Authorization: Bearer ACCESS_TOKEN"
\`\`\`

## Scopes

Request only the scopes you need:

- \`contacts:read\` - Read contact data
- \`contacts:write\` - Create and update contacts
- \`pipeline:read\` - Read pipeline data
- \`pipeline:write\` - Create and update pipeline records
- \`intelligence:read\` - Access AI intelligence features
- \`intelligence:write\` - Run intelligence operations
- \`integrations:read\` - Read integration connections
- \`integrations:write\` - Create and manage integrations

## Rate Limits

- **Standard Plan**: 1,000 requests per hour
- **Professional Plan**: 5,000 requests per hour
- **Enterprise Plan**: Custom limits

Rate limit headers:
- \`X-RateLimit-Limit\` - Maximum requests per hour
- \`X-RateLimit-Remaining\` - Remaining requests
- \`X-RateLimit-Reset\` - Time when limit resets (Unix timestamp)

## Error Codes

- \`401 Unauthorized\` - Invalid or missing API key
- \`403 Forbidden\` - Valid key but insufficient permissions
- \`429 Too Many Requests\` - Rate limit exceeded
`
        }
      ]
    },
    {
      id: "release-notes",
      title: "Release Notes",
      description: "Version history and updates",
      icon: "document",
      pages: [
        {
          id: "latest-release",
          title: "Latest Release (v1.2.0)",
          description: "January 2025 - New features and improvements",
          lastUpdated: "2025-01-10",
          tags: ["release", "v1.2.0"],
          content: `# Release v1.2.0 - January 2025

## 🎉 New Features

### Custom Documentation System
- Built-in documentation accessible from profile menu
- 3-panel layout with navigation, content, and table of contents
- Comprehensive guides for all platform features
- API reference and developer documentation
- Searchable content with syntax highlighting

### Enhanced Intelligence API
- New batch operations for executive discovery
- Improved AI model routing for 95% cost savings
- Support for custom research depth levels
- Real-time credit usage monitoring

### Workflow Automation Improvements
- Parallel node execution in Olympus
- New workflow templates for common use cases
- Enhanced error handling and retry logic
- Workflow versioning and rollback

### Grand Central Updates
- Added 100+ new integration providers
- Improved OAuth connection flow
- Real-time integration sync monitoring
- Connection health checks and alerts

## 🚀 Improvements

### Performance
- 40% faster pipeline loading
- Reduced API response times by 35%
- Optimized database queries
- Improved caching strategy

### UI/UX
- Refreshed theme system with semantic colors
- Improved mobile responsiveness
- Better keyboard navigation
- Enhanced accessibility features

### API
- New webhook events for intelligence operations
- Improved error messages and debugging
- Better rate limit handling
- Enhanced API documentation

## 🐛 Bug Fixes

- Fixed issue with contact enrichment for international phone numbers
- Resolved pipeline stage transition animations
- Fixed Grand Central connection status display
- Corrected Monaco batch processing progress indicator
- Fixed Speedrun email template variable replacement

## 🔒 Security

- Updated authentication token expiration handling
- Improved API key rotation process
- Enhanced webhook signature verification
- Security audit and vulnerability fixes

## 📚 Documentation

- Complete platform documentation in-app
- New API examples and tutorials
- Updated integration guides
- Expanded troubleshooting section

## ⚡ Performance Metrics

- API response time: 150ms → 98ms (35% improvement)
- Pipeline load time: 2.1s → 1.3s (38% improvement)
- Intelligence enrichment: 8s → 5s (37% improvement)
- Database query optimization: 40% faster

## 🔄 Breaking Changes

None in this release.

## 📦 Dependencies

- Updated Next.js to 15.1.0
- Updated React to 19.0.0
- Updated Prisma to 6.0.0
- Updated various security packages

## 🙏 Thank You

Thank you to all our users for your feedback and bug reports that made this release possible!
`
        }
      ]
    },
    {
      id: "cheat-codes",
      title: "Cheat Codes",
      description: "Power user tips and shortcuts",
      icon: "sparkles",
      pages: [
        {
          id: "keyboard-shortcuts",
          title: "Keyboard Shortcuts",
          description: "Lightning-fast navigation and actions",
          lastUpdated: "2025-01-10",
          tags: ["shortcuts", "productivity"],
          content: `# Keyboard Shortcuts

Master Adrata with these keyboard shortcuts for lightning-fast productivity.

## Global Shortcuts

### Navigation
- \`Cmd/Ctrl + K\` - Open command palette
- \`Cmd/Ctrl + P\` - Quick search
- \`Cmd/Ctrl + /\` - Show all shortcuts
- \`Cmd/Ctrl + B\` - Toggle left panel
- \`Cmd/Ctrl + .\` - Toggle right panel
- \`Cmd/Ctrl + ,\` - Open settings

### Applications
- \`G then P\` - Go to Pipeline
- \`G then M\` - Go to Monaco
- \`G then G\` - Go to Grand Central
- \`G then O\` - Go to Olympus
- \`G then S\` - Go to Speedrun

### Actions
- \`C\` - Create new record
- \`E\` - Edit selected record
- \`D\` - Delete selected record
- \`F\` - Open search/filter
- \`?\` - Show context help

## Pipeline Shortcuts

### Navigation
- \`→\` or \`L\` - Move to next stage
- \`←\` or \`H\` - Move to previous stage
- \`J\` - Select next record
- \`K\` - Select previous record
- \`Enter\` - Open selected record

### Actions
- \`N\` - Add new note
- \`T\` - Create task
- \`E\` - Send email
- \`M\` - Schedule meeting
- \`A\` - Assign to team member

### Filtering
- \`F\` - Open filter panel
- \`Cmd/Ctrl + F\` - Search within pipeline
- \`Alt + 1-5\` - Quick filter by stage
- \`Cmd/Ctrl + Shift + F\` - Advanced filter

### Bulk Operations
- \`Cmd/Ctrl + A\` - Select all
- \`Shift + Click\` - Select range
- \`Cmd/Ctrl + Click\` - Multi-select
- \`Cmd/Ctrl + Shift + E\` - Bulk edit
- \`Cmd/Ctrl + Shift + D\` - Bulk delete

## Monaco Shortcuts

### Research
- \`R\` - Start new research
- \`E\` - Enrich selected contact
- \`D\` - Discover executives
- \`C\` - Company analysis
- \`B\` - Batch operations

### Results
- \`A\` - Add to pipeline
- \`X\` - Export results
- \`S\` - Save to favorites
- \`Enter\` - View details

## Grand Central Shortcuts

### Workflow Builder
- \`N\` - Add new node
- \`C\` - Add connection
- \`D\` - Delete selected
- \`Cmd/Ctrl + Z\` - Undo
- \`Cmd/Ctrl + Shift + Z\` - Redo
- \`Cmd/Ctrl + D\` - Duplicate node

### Execution
- \`P\` or \`Cmd/Ctrl + Enter\` - Play/execute
- \`S\` - Stop execution
- \`L\` - View logs
- \`T\` - Test workflow

### View
- \`V\` - Toggle code view
- \`Cmd/Ctrl + +\` - Zoom in
- \`Cmd/Ctrl + -\` - Zoom out
- \`Cmd/Ctrl + 0\` - Reset zoom

## Olympus Shortcuts

### Workflow Designer
- \`A\` - Add step
- \`Delete\` - Remove selected step
- \`Cmd/Ctrl + C\` - Copy step
- \`Cmd/Ctrl + V\` - Paste step
- \`Cmd/Ctrl + D\` - Duplicate step

### Execution
- \`P\` - Play workflow
- \`S\` - Stop execution
- \`Cmd/Ctrl + Enter\` - Start with commentary
- \`Esc\` - Cancel execution

### Tools
- \`H\` - Hand tool (pan)
- \`V\` - Cursor tool (select)
- \`C\` - Comment tool
- \`Cmd/Ctrl + F\` - Find in workflow

## Speedrun Shortcuts

### Quick Actions
- \`E\` - Send email
- \`C\` - Make call
- \`M\` - Schedule meeting
- \`N\` - Add note
- \`T\` - Create task

### Templates
- \`Cmd/Ctrl + T\` - Open template picker
- \`Cmd/Ctrl + Shift + T\` - Save as template
- \`Cmd/Ctrl + E\` - Edit template

### Batch
- \`Cmd/Ctrl + Shift + B\` - Batch actions
- \`Cmd/Ctrl + Shift + S\` - Batch send
- \`Cmd/Ctrl + Shift + U\` - Batch update

## Pro Tips

### Command Palette (\`Cmd/Ctrl + K\`)
The command palette is your Swiss Army knife:
- Type to search for any action
- Recent commands appear first
- Works across all applications
- Fuzzy search supported

### Sequential Keys
Some shortcuts use sequential keys (not held together):
- \`G then P\` means: Press G, release, then press P
- This is called "vim-style" navigation

### Context-Aware
Many shortcuts change based on context:
- \`E\` in pipeline = Edit record
- \`E\` in Monaco = Enrich contact
- Check the tooltip for context-specific shortcuts

### Customization
Customize shortcuts in settings:
1. \`Cmd/Ctrl + ,\` - Open settings
2. Navigate to **Keyboard Shortcuts**
3. Click on any shortcut to rebind
4. Save your changes
`
        }
      ]
    }
  ]
};