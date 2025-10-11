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

Ready to dive in? Check out the [Quick Start Guide](#quick-start) to begin.
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

- Explore the [Action Platform Guide](#action-platform)
- Learn about [Monaco Intelligence](#monaco)
- Set up [API integrations](#api-authentication)
`
        },
        {
          id: "action-platform",
          title: "Action Platform Guide",
          description: "Complete guide to pipeline management",
          lastUpdated: "2025-01-10",
          tags: ["action-platform", "pipeline", "crm"],
          content: `# Action Platform (Falcon)

Your main pipeline management tool with AI-powered insights and relationship intelligence.

## Overview

Action Platform is your central hub for managing the entire sales pipeline with advanced CRM capabilities, deal tracking, and AI-powered insights.

## Key Features

### Pipeline Management
- **Multi-stage pipeline** - Track deals through Prospects, Leads, Opportunities, Customers, and Partners
- **Custom fields** - Add custom data fields for your specific needs
- **Drag-and-drop** - Move deals between stages with simple drag-and-drop
- **Bulk actions** - Update multiple records at once

### AI-Powered Insights
- **Contact Intelligence** - AI-powered contact enrichment and validation
- **Buyer Group Analysis** - Understand decision-making units
- **Relationship Intelligence** - Track relationships and connections
- **Predictive Scoring** - AI-powered deal scoring and prioritization

### Collaboration
- **Team Notes** - Add notes and comments visible to your team
- **Activity Timeline** - Track all interactions and activities
- **Task Management** - Assign and track tasks
- **Mentions** - @mention team members in notes

## Getting Started

### Creating Your First Deal

1. Click **+ New** in the pipeline view
2. Select the stage (Prospect, Lead, Opportunity, etc.)
3. Fill in the required information:
   - Company name
   - Contact information
   - Deal value
   - Expected close date
4. Click **Create** to add to your pipeline

### Using AI Intelligence

1. Select a contact or company in your pipeline
2. Click the **Intelligence** button
3. Choose from:
   - **Enrich Contact** - Add missing information
   - **Find Decision Makers** - Identify key stakeholders
   - **Company Research** - Get company insights
   - **Competitive Intel** - Understand the competitive landscape

### Managing Your Pipeline

- **Filter** - Use filters to focus on specific deals
- **Sort** - Sort by value, close date, or custom fields
- **Search** - Quickly find deals, contacts, or companies
- **Export** - Export your pipeline data to CSV

## Best Practices

1. **Keep it updated** - Update deal statuses regularly
2. **Use AI wisely** - Leverage AI for research and enrichment
3. **Collaborate** - Use notes and mentions to keep team aligned
4. **Track activities** - Log all customer interactions
5. **Review regularly** - Weekly pipeline reviews with your team
`
        },
        {
          id: "monaco",
          title: "Monaco Intelligence",
          description: "Business intelligence and prospecting",
          lastUpdated: "2025-01-10",
          tags: ["monaco", "intelligence", "ai"],
          content: `# Monaco Intelligence

Business intelligence pipeline with alternative data sources and AI-powered prospecting tools.

## Overview

Monaco is your intelligent research assistant, combining multiple data sources with AI to find and analyze prospects, companies, and market opportunities.

## Key Features

### Multi-Source Intelligence
- **CoreSignal** - Professional data and company insights
- **Web Research** - AI-powered web scraping and analysis
- **Social Intelligence** - LinkedIn and social media insights
- **News Monitoring** - Track company news and events

### AI-Powered Research
- **Executive Discovery** - Find CFOs, CROs, and decision makers
- **Company Analysis** - Deep dive into company structure and financials
- **Market Intelligence** - Understand market trends and opportunities
- **Competitive Analysis** - Research competitors and positioning

### Research Automation
- **Automated Workflows** - Set up automated research pipelines
- **Batch Processing** - Research multiple companies at once
- **Smart Alerts** - Get notified of important changes
- **Data Enrichment** - Automatically enhance your CRM data

## Using Monaco

### Finding Decision Makers

1. Enter a company name or domain
2. Select **Executive Discovery**
3. Choose executive types (CFO, CRO, VP Sales, etc.)
4. Monaco will search across multiple data sources
5. Review and select the best matches
6. Export to Action Platform

### Company Research

1. Enter company name or domain
2. Select **Company Analysis**
3. Choose research depth (Quick, Standard, Deep)
4. Review the generated report including:
   - Company overview and size
   - Executive team
   - Recent news and events
   - Financial insights
   - Technology stack
   - Competitive landscape

### Batch Research

1. Upload a CSV with company names or domains
2. Select research type and depth
3. Monaco processes all companies in parallel
4. Download results as CSV or export to Action Platform

## AI Cost Optimization

Monaco uses intelligent model routing to achieve 95% cost savings:

- **Quick queries** - Fast models for simple lookups
- **Standard research** - Balanced models for most use cases
- **Deep analysis** - Advanced models (Claude, GPT-4) for complex research

The system automatically selects the optimal model based on query complexity.

## Best Practices

1. **Start with batch** - Research multiple companies at once
2. **Use filters** - Filter by company size, industry, location
3. **Verify data** - Always verify critical information
4. **Export strategically** - Export only high-priority prospects
5. **Monitor costs** - Check your AI usage in settings
`
        },
        {
          id: "grand-central",
          title: "Grand Central Integrations",
          description: "Integration hub and workflow builder",
          lastUpdated: "2025-01-10",
          tags: ["grand-central", "integrations", "automation"],
          content: `# Grand Central

Integration hub connecting 500+ applications and services through our unified Nango-powered platform.

## Overview

Grand Central is your integration command center, enabling you to connect external applications, sync data, and build automated workflows across your entire tech stack.

## Key Features

### 500+ Integrations
- **CRM** - Salesforce, HubSpot, Pipedrive, Zoho CRM, Close
- **Communication** - Slack, Microsoft Teams, Discord, Twilio, SendGrid
- **Marketing** - Mailchimp, Constant Contact, ActiveCampaign, Marketo
- **Productivity** - Google Workspace, Microsoft 365, Notion, Asana, Trello
- **Finance** - Stripe, QuickBooks, Xero, PayPal, Square
- **E-commerce** - Shopify, WooCommerce, BigCommerce, Magento
- **Support** - Zendesk, Intercom, Freshdesk, Help Scout
- **Analytics** - Google Analytics, Mixpanel, Amplitude, Segment

### Visual Workflow Builder
- **Drag-and-drop interface** - Build workflows visually
- **Pre-built templates** - Start with proven workflows
- **Conditional logic** - Add branching and decision points
- **Error handling** - Robust error handling and retry mechanisms

### Real-Time Monitoring
- **Live execution logs** - See workflows run in real-time
- **Performance metrics** - Track success rates and execution times
- **Error alerts** - Get notified of failures
- **Audit trail** - Complete history of all executions

## Setting Up Integrations

### Connect Your First Integration

1. Navigate to **Grand Central**
2. Click **Add Integration**
3. Browse or search for your application
4. Click **Connect**
5. Follow the OAuth flow to authorize
6. Name your connection
7. Click **Save**

### Building a Workflow

1. Click **Create Workflow**
2. Add a **Trigger** node (e.g., "New deal in Salesforce")
3. Add **Action** nodes (e.g., "Send Slack message", "Create task in Asana")
4. Connect the nodes by dragging between connection points
5. Configure each node's settings
6. Test the workflow with sample data
7. Activate the workflow

### Common Workflow Patterns

#### CRM Sync
Trigger: New deal in Adrata Action Platform
Actions:
- Create or update record in Salesforce
- Send notification to Slack
- Add to marketing automation

#### Lead Enrichment
Trigger: New contact added
Actions:
- Enrich with Monaco intelligence
- Validate email and phone
- Update CRM with enriched data
- Assign to sales rep

#### Customer Onboarding
Trigger: Deal marked as won
Actions:
- Create customer record
- Send welcome email
- Create onboarding tasks in project management tool
- Add to customer success platform

## Best Practices

1. **Start simple** - Begin with basic workflows and add complexity
2. **Test thoroughly** - Test with sample data before activating
3. **Monitor regularly** - Check execution logs for errors
4. **Use error handling** - Add retry logic and error notifications
5. **Document workflows** - Add descriptions to nodes and workflows
`
        },
        {
          id: "olympus",
          title: "Olympus Workflows",
          description: "Workflow automation and orchestration",
          lastUpdated: "2025-01-10",
          tags: ["olympus", "automation", "workflows"],
          content: `# Olympus

Workflow automation and orchestration platform for creating and executing complex multi-step processes.

## Overview

Olympus empowers you to automate complex business processes with a visual workflow designer and powerful execution engine.

## Key Features

### Visual Workflow Designer
- **Drag-and-drop interface** - Intuitive workflow building
- **Pre-built templates** - Start with proven workflow templates
- **Conditional logic** - Add branching and decision points
- **Error handling** - Built-in error handling and retry mechanisms

### Execution Engine
- **Parallel processing** - Execute multiple steps simultaneously
- **Queue management** - Manage workflow execution queues
- **Resource optimization** - Optimize resource usage and performance
- **Scalability** - Scale workflows to handle high volumes

### Integration Capabilities
- **Action Platform** - Trigger workflows from pipeline events
- **Monaco** - Use research data in workflow logic
- **Grand Central** - Connect to external systems
- **Speedrun** - Execute quick actions within workflows

## Creating Workflows

### Workflow Components

**Trigger Nodes**
- Manual trigger
- Schedule trigger (daily, weekly, monthly)
- Event trigger (pipeline events, webhook calls)
- Data trigger (when data changes)

**Action Nodes**
- Data operations (create, read, update, delete)
- API calls (REST, GraphQL)
- Email and notifications
- Data transformations
- File operations

**Condition Nodes**
- If/else logic
- Switch statements
- Loops and iterations
- Data filtering

**Transform Nodes**
- Data mapping
- Format conversions
- Calculations
- Aggregations

### Building Your First Workflow

1. Click **Create Workflow** in Olympus
2. Add a **Trigger** node
3. Add **Action** nodes for each step
4. Add **Condition** nodes for branching logic
5. Connect nodes by dragging between connection points
6. Configure each node's settings
7. Click **Test** to validate with sample data
8. Click **Activate** to enable the workflow

### Example: CFO/CRO Discovery Pipeline

This workflow automatically discovers and enriches executive contacts:

1. **Company Resolution** - Input company name, resolve domain/ID
2. **Executive Discovery** - Multi-strategy waterfall (CoreSignal → Research → AI)
3. **Contact Enrichment** - Enhance and validate contact data
4. **Parallel Verification** - Run email/phone/person verification simultaneously
5. **Result Aggregation** - Merge results with confidence scores
6. **Efficacy Tracking** - Monitor performance and costs
7. **Results Storage** - Save with full audit trail

## Best Practices

1. **Design for failure** - Add error handling to all critical nodes
2. **Use parallel processing** - Run independent steps simultaneously
3. **Monitor performance** - Track execution times and optimize bottlenecks
4. **Version your workflows** - Save versions before major changes
5. **Document thoroughly** - Add descriptions to complex workflows
`
        },
        {
          id: "speedrun",
          title: "Speedrun Actions",
          description: "Quick actions and communication",
          lastUpdated: "2025-01-10",
          tags: ["speedrun", "communication", "quick-actions"],
          content: `# Speedrun

Quick actions and communication platform for rapid execution and outreach.

## Overview

Speedrun enables you to perform rapid tasks, send communications, and execute quick workflows without the overhead of complex automation.

## Key Features

### Quick Actions
- **One-click tasks** - Execute common tasks with a single click
- **Keyboard shortcuts** - Lightning-fast actions with keyboard
- **Action templates** - Save and reuse action sequences
- **Batch operations** - Perform actions on multiple records

### Communication Tools
- **Email templates** - Pre-built email templates for common scenarios
- **Personalization** - Auto-personalize with contact data
- **Scheduling** - Schedule messages for optimal send times
- **Follow-up tracking** - Track opens, clicks, and responses

### Real-Time Priority
- **Priority inbox** - Focus on high-priority contacts
- **Smart suggestions** - AI-suggested next actions
- **Activity feed** - Real-time feed of important activities
- **Quick notes** - Capture notes and ideas instantly

## Using Speedrun

### Creating Quick Actions

1. Select a contact or deal
2. Click the **Speedrun** button
3. Choose an action:
   - Send email
   - Make call
   - Schedule meeting
   - Add note
   - Create task
   - Send LinkedIn message
4. Fill in any required details
5. Click **Execute**

### Email Templates

1. Navigate to **Speedrun Engine** settings
2. Click **Email Templates**
3. Click **Create Template**
4. Design your template with personalization variables:
   - \`{{firstName}}\` - Contact first name
   - \`{{company}}\` - Company name
   - \`{{title}}\` - Contact title
5. Save the template
6. Use it in any email action

### Batch Operations

1. Select multiple contacts in Action Platform
2. Click **Speedrun Batch**
3. Choose batch action:
   - Send bulk email (personalized)
   - Update status
   - Add tags
   - Assign to team member
   - Export to CSV
4. Review and confirm
5. Click **Execute**

## Keyboard Shortcuts

### Navigation
- \`Cmd/Ctrl + K\` - Open command palette
- \`Cmd/Ctrl + P\` - Quick search
- \`Cmd/Ctrl + /\` - Show shortcuts

### Actions
- \`E\` - Send email
- \`C\` - Make call
- \`M\` - Schedule meeting
- \`N\` - Add note
- \`T\` - Create task

### Pipeline
- \`→\` - Move to next stage
- \`←\` - Move to previous stage
- \`Cmd/Ctrl + Enter\` - Save and close

## Best Practices

1. **Use templates** - Create templates for common communications
2. **Personalize** - Always personalize, even with templates
3. **Track metrics** - Monitor open and response rates
4. **Optimize timing** - Send at optimal times for your audience
5. **Follow up** - Set reminders for follow-ups
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

### Refreshing Tokens

Access tokens expire after 1 hour. Use the refresh token to get a new access token:

\`\`\`bash
curl -X POST https://auth.adrata.com/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=refresh_token" \\
  -d "refresh_token=REFRESH_TOKEN" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET"
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
        },
        {
          id: "api-unified-data",
          title: "Unified Data API",
          description: "Access and manage data across the platform",
          lastUpdated: "2025-01-10",
          tags: ["api", "data", "crm"],
          content: `# Unified Data API

Access and manage contacts, companies, and pipeline data through our unified REST API.

## Base URL

\`\`\`
https://api.adrata.com/v1
\`\`\`

## Contacts API

### List Contacts

\`\`\`bash
GET /contacts
\`\`\`

Query parameters:
- \`limit\` - Number of results (default: 50, max: 100)
- \`offset\` - Pagination offset
- \`search\` - Search query
- \`filter\` - Filter by fields (e.g., \`title:CFO\`, \`company:Acme\`)
- \`sort\` - Sort by field (e.g., \`createdAt:desc\`)

Example:
\`\`\`bash
curl https://api.adrata.com/v1/contacts?limit=50&filter=title:CFO \\
  -H "Authorization: Bearer YOUR_API_KEY"
\`\`\`

Response:
\`\`\`json
{
  "data": [
    {
      "id": "cnt_123abc",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "title": "CFO",
      "company": "Acme Corp",
      "linkedinUrl": "https://linkedin.com/in/janesmith",
      "createdAt": "2025-01-10T10:00:00Z",
      "updatedAt": "2025-01-10T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
\`\`\`

### Get Contact

\`\`\`bash
GET /contacts/{id}
\`\`\`

### Create Contact

\`\`\`bash
POST /contacts
\`\`\`

Request body:
\`\`\`json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "title": "CRO",
  "company": "Example Inc",
  "phone": "+1-555-0100",
  "linkedinUrl": "https://linkedin.com/in/johndoe"
}
\`\`\`

### Update Contact

\`\`\`bash
PATCH /contacts/{id}
\`\`\`

### Delete Contact

\`\`\`bash
DELETE /contacts/{id}
\`\`\`

## Companies API

### List Companies

\`\`\`bash
GET /companies
\`\`\`

### Get Company

\`\`\`bash
GET /companies/{id}
\`\`\`

### Create Company

\`\`\`bash
POST /companies
\`\`\`

Request body:
\`\`\`json
{
  "name": "Acme Corp",
  "domain": "acme.com",
  "industry": "Technology",
  "size": "50-200",
  "location": "San Francisco, CA"
}
\`\`\`

## Pipeline API

### List Pipeline Records

\`\`\`bash
GET /pipeline
\`\`\`

Query parameters:
- \`stage\` - Filter by stage (prospect, lead, opportunity, customer, partner)
- \`status\` - Filter by status (active, won, lost)
- \`assignee\` - Filter by assignee user ID

### Get Pipeline Record

\`\`\`bash
GET /pipeline/{id}
\`\`\`

### Create Pipeline Record

\`\`\`bash
POST /pipeline
\`\`\`

Request body:
\`\`\`json
{
  "stage": "opportunity",
  "company": "Acme Corp",
  "contactId": "cnt_123abc",
  "value": 50000,
  "expectedCloseDate": "2025-03-01",
  "assignee": "usr_456def"
}
\`\`\`

### Update Pipeline Record

\`\`\`bash
PATCH /pipeline/{id}
\`\`\`

### Move Stage

\`\`\`bash
POST /pipeline/{id}/move
\`\`\`

Request body:
\`\`\`json
{
  "stage": "customer",
  "status": "won"
}
\`\`\`

## Webhooks

Subscribe to real-time events:

### Available Events

- \`contact.created\`
- \`contact.updated\`
- \`contact.deleted\`
- \`pipeline.created\`
- \`pipeline.updated\`
- \`pipeline.stage_changed\`
- \`pipeline.won\`
- \`pipeline.lost\`

See the [Webhooks documentation](#webhooks) for setup instructions.
`
        },
        {
          id: "api-intelligence",
          title: "Intelligence API",
          description: "AI-powered research and enrichment",
          lastUpdated: "2025-01-10",
          tags: ["api", "ai", "intelligence"],
          content: `# Intelligence API

Leverage Adrata's AI-powered research and enrichment capabilities through our API.

## Base URL

\`\`\`
https://api.adrata.com/v1/intelligence
\`\`\`

## Contact Enrichment

### Enrich Contact

\`\`\`bash
POST /enrich/contact
\`\`\`

Request body:
\`\`\`json
{
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "company": "Acme Corp"
}
\`\`\`

Response:
\`\`\`json
{
  "data": {
    "email": "jane@example.com",
    "emailValid": true,
    "firstName": "Jane",
    "lastName": "Smith",
    "title": "Chief Financial Officer",
    "company": "Acme Corp",
    "phone": "+1-555-0123",
    "linkedinUrl": "https://linkedin.com/in/janesmith",
    "location": "San Francisco, CA",
    "seniority": "executive",
    "department": "finance",
    "confidence": 0.95
  },
  "sources": ["coresignal", "linkedin", "web"],
  "creditsUsed": 1
}
\`\`\`

## Executive Discovery

### Find Executives

\`\`\`bash
POST /discover/executives
\`\`\`

Request body:
\`\`\`json
{
  "company": "Acme Corp",
  "domain": "acme.com",
  "titles": ["CFO", "CRO", "VP Sales", "VP Finance"],
  "maxResults": 10
}
\`\`\`

Response:
\`\`\`json
{
  "data": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "title": "Chief Financial Officer",
      "email": "jane@acme.com",
      "linkedinUrl": "https://linkedin.com/in/janesmith",
      "confidence": 0.95,
      "source": "coresignal"
    }
  ],
  "total": 3,
  "creditsUsed": 2
}
\`\`\`

## Company Research

### Research Company

\`\`\`bash
POST /research/company
\`\`\`

Request body:
\`\`\`json
{
  "company": "Acme Corp",
  "domain": "acme.com",
  "depth": "standard"
}
\`\`\`

Depth options:
- \`quick\` - Basic information (0.5 credits)
- \`standard\` - Comprehensive research (1 credit)
- \`deep\` - Detailed analysis with AI insights (2 credits)

Response:
\`\`\`json
{
  "data": {
    "name": "Acme Corp",
    "domain": "acme.com",
    "industry": "Technology",
    "size": "50-200 employees",
    "location": "San Francisco, CA",
    "founded": 2015,
    "revenue": "$10M-$50M",
    "description": "Leading provider of...",
    "technologies": ["React", "Node.js", "AWS"],
    "executives": [
      {
        "name": "Jane Smith",
        "title": "CFO",
        "linkedinUrl": "..."
      }
    ],
    "recentNews": [
      {
        "title": "Acme Corp Raises $20M Series B",
        "date": "2024-12-15",
        "url": "..."
      }
    ],
    "competitors": ["CompetitorA", "CompetitorB"]
  },
  "creditsUsed": 1
}
\`\`\`

## Batch Operations

### Batch Enrich

\`\`\`bash
POST /batch/enrich
\`\`\`

Request body:
\`\`\`json
{
  "contacts": [
    { "email": "jane@example.com", "company": "Acme Corp" },
    { "email": "john@example.com", "company": "Example Inc" }
  ]
}
\`\`\`

### Batch Executive Discovery

\`\`\`bash
POST /batch/discover
\`\`\`

Request body:
\`\`\`json
{
  "companies": [
    { "domain": "acme.com", "titles": ["CFO", "CRO"] },
    { "domain": "example.com", "titles": ["CFO", "CRO"] }
  ]
}
\`\`\`

## Credits and Billing

Intelligence operations consume credits based on complexity:

- **Contact Enrichment**: 1 credit
- **Executive Discovery**: 2 credits per company
- **Company Research (Quick)**: 0.5 credits
- **Company Research (Standard)**: 1 credit
- **Company Research (Deep)**: 2 credits

Check your credit balance:

\`\`\`bash
GET /credits
\`\`\`

Response:
\`\`\`json
{
  "available": 950,
  "used": 50,
  "limit": 1000,
  "resetDate": "2025-02-01T00:00:00Z"
}
\`\`\`
`
        },
        {
          id: "webhooks",
          title: "Webhooks",
          description: "Real-time event notifications",
          lastUpdated: "2025-01-10",
          tags: ["api", "webhooks", "events"],
          content: `# Webhooks

Subscribe to real-time events from Adrata to build reactive integrations.

## Overview

Webhooks allow you to receive HTTP POST notifications when events occur in your Adrata workspace.

## Setting Up Webhooks

### Create a Webhook

1. Navigate to **Settings** → **Webhooks**
2. Click **Create Webhook**
3. Enter your endpoint URL
4. Select events to subscribe to
5. (Optional) Add a secret for signature verification
6. Click **Save**

### Webhook Configuration

\`\`\`json
{
  "url": "https://your-app.com/webhooks/adrata",
  "events": [
    "contact.created",
    "contact.updated",
    "pipeline.stage_changed",
    "pipeline.won"
  ],
  "secret": "whsec_..." // For signature verification
}
\`\`\`

## Event Types

### Contact Events

- \`contact.created\` - New contact created
- \`contact.updated\` - Contact information updated
- \`contact.deleted\` - Contact deleted

### Pipeline Events

- \`pipeline.created\` - New pipeline record created
- \`pipeline.updated\` - Pipeline record updated
- \`pipeline.stage_changed\` - Deal moved to different stage
- \`pipeline.won\` - Deal marked as won
- \`pipeline.lost\` - Deal marked as lost

### Intelligence Events

- \`intelligence.enrichment_completed\` - Contact enrichment finished
- \`intelligence.research_completed\` - Company research finished
- \`intelligence.batch_completed\` - Batch operation finished

### Integration Events

- \`integration.connected\` - New integration connected
- \`integration.disconnected\` - Integration disconnected
- \`integration.sync_completed\` - Integration sync finished

## Webhook Payload

All webhooks follow this structure:

\`\`\`json
{
  "id": "evt_123abc",
  "type": "contact.created",
  "createdAt": "2025-01-10T10:00:00Z",
  "data": {
    // Event-specific data
  },
  "workspaceId": "wks_456def"
}
\`\`\`

### Example: Contact Created

\`\`\`json
{
  "id": "evt_123abc",
  "type": "contact.created",
  "createdAt": "2025-01-10T10:00:00Z",
  "data": {
    "id": "cnt_789ghi",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "title": "CFO",
    "company": "Acme Corp"
  },
  "workspaceId": "wks_456def"
}
\`\`\`

### Example: Pipeline Stage Changed

\`\`\`json
{
  "id": "evt_123abc",
  "type": "pipeline.stage_changed",
  "createdAt": "2025-01-10T10:00:00Z",
  "data": {
    "id": "pip_789ghi",
    "previousStage": "lead",
    "newStage": "opportunity",
    "company": "Acme Corp",
    "value": 50000,
    "assignee": "usr_111jkl"
  },
  "workspaceId": "wks_456def"
}
\`\`\`

## Signature Verification

Verify webhook authenticity using the \`X-Adrata-Signature\` header:

### Node.js Example

\`\`\`javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === computedSignature;
}

// In your webhook handler
app.post('/webhooks/adrata', (req, res) => {
  const signature = req.headers['x-adrata-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!verifyWebhook(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook
  const event = req.body;
  console.log('Received event:', event.type);
  
  res.status(200).send('OK');
});
\`\`\`

## Best Practices

1. **Verify signatures** - Always verify webhook signatures
2. **Respond quickly** - Return 200 status within 5 seconds
3. **Process async** - Queue webhooks for async processing
4. **Handle retries** - Webhooks are retried up to 3 times on failure
5. **Idempotency** - Use event IDs to handle duplicate deliveries
6. **Monitor failures** - Set up alerts for webhook failures

## Retry Policy

Failed webhooks are retried with exponential backoff:

- **Attempt 1**: Immediate
- **Attempt 2**: After 1 minute
- **Attempt 3**: After 5 minutes
- **Attempt 4**: After 30 minutes

After 4 failed attempts, the webhook is marked as failed and not retried.

## Testing Webhooks

Use our webhook testing tool:

1. Navigate to **Settings** → **Webhooks**
2. Select your webhook
3. Click **Test**
4. Choose an event type
5. Click **Send Test Event**

This sends a sample payload to your endpoint for testing.
`
        },
        {
          id: "rate-limits",
          title: "Rate Limits",
          description: "API rate limiting and best practices",
          lastUpdated: "2025-01-10",
          tags: ["api", "rate-limits", "performance"],
          content: `# Rate Limits

Understanding and working with Adrata API rate limits.

## Rate Limit Tiers

### Standard Plan
- **1,000 requests per hour**
- Per-workspace limit
- Shared across all API keys

### Professional Plan
- **5,000 requests per hour**
- Per-workspace limit
- Shared across all API keys

### Enterprise Plan
- **Custom limits**
- Dedicated capacity
- SLA guarantees

## Rate Limit Headers

Every API response includes rate limit information:

\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1704976800
\`\`\`

- \`X-RateLimit-Limit\` - Maximum requests per hour
- \`X-RateLimit-Remaining\` - Requests remaining in current window
- \`X-RateLimit-Reset\` - Unix timestamp when limit resets

## Handling Rate Limits

### 429 Too Many Requests

When you exceed the rate limit, the API returns:

\`\`\`json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Try again in 30 minutes.",
    "retryAfter": 1800
  }
}
\`\`\`

The \`Retry-After\` header indicates seconds until you can retry.

### Exponential Backoff

Implement exponential backoff for retries:

\`\`\`javascript
async function makeRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
      await sleep(retryAfter * 1000);
      continue;
    }
    
    return response;
  }
  
  throw new Error('Max retries exceeded');
}
\`\`\`

## Best Practices

### 1. Monitor Your Usage

Check rate limit headers in every response:

\`\`\`javascript
const remaining = response.headers.get('X-RateLimit-Remaining');
if (remaining < 100) {
  console.warn('Approaching rate limit:', remaining);
}
\`\`\`

### 2. Use Batch Endpoints

Instead of individual requests:

\`\`\`javascript
// ❌ Bad: Multiple individual requests
for (const contact of contacts) {
  await fetch(\`/contacts/\${contact.id}\`);
}

// ✅ Good: Single batch request
await fetch('/contacts/batch', {
  method: 'POST',
  body: JSON.stringify({ ids: contacts.map(c => c.id) })
});
\`\`\`

### 3. Cache Responses

Cache responses when data doesn't change frequently:

\`\`\`javascript
const cache = new Map();

async function getContact(id) {
  if (cache.has(id)) {
    return cache.get(id);
  }
  
  const response = await fetch(\`/contacts/\${id}\`);
  const contact = await response.json();
  
  cache.set(id, contact);
  setTimeout(() => cache.delete(id), 5 * 60 * 1000); // 5 minutes
  
  return contact;
}
\`\`\`

### 4. Use Webhooks

Instead of polling, use webhooks for real-time updates:

\`\`\`javascript
// ❌ Bad: Poll for changes every minute
setInterval(async () => {
  const contacts = await fetch('/contacts?updatedSince=...');
}, 60000);

// ✅ Good: Subscribe to webhook
// Webhook handler automatically notified of changes
app.post('/webhooks/adrata', (req, res) => {
  if (req.body.type === 'contact.updated') {
    handleContactUpdate(req.body.data);
  }
  res.sendStatus(200);
});
\`\`\`

### 5. Request Only What You Need

Use field selection to reduce response size:

\`\`\`javascript
// ❌ Bad: Request all fields
await fetch('/contacts?limit=100');

// ✅ Good: Request only needed fields
await fetch('/contacts?limit=100&fields=id,firstName,lastName,email');
\`\`\`

## Intelligence API Limits

Intelligence API has separate credit-based limits:

- **Contact Enrichment**: 1 credit per contact
- **Executive Discovery**: 2 credits per company
- **Company Research**: 0.5-2 credits depending on depth

Credits reset monthly based on your plan.

## Upgrade Your Limits

Need higher limits?

1. Navigate to **Settings** → **Billing**
2. Click **Upgrade Plan**
3. Select Professional or Enterprise plan
4. Or contact sales for custom limits

## Monitoring and Alerts

Set up monitoring for rate limits:

1. Navigate to **Settings** → **API**
2. Enable **Rate Limit Alerts**
3. Set threshold (e.g., alert at 80% usage)
4. Configure notification method (email, Slack, webhook)
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
        },
        {
          id: "v1-1-0",
          title: "v1.1.0 - December 2024",
          description: "Grand Central rebuild and optimizations",
          lastUpdated: "2024-12-15",
          tags: ["release", "v1.1.0"],
          content: `# Release v1.1.0 - December 2024

## 🎉 New Features

### Grand Central Rebuild
- Complete rebuild of integration platform
- New visual workflow builder with drag-and-drop
- Support for 500+ integrations via Nango
- Real-time execution monitoring
- Integration library with categorization

### Olympus Enhancements
- New workflow templates
- Improved node configuration
- Better execution logs
- Performance optimizations

### Monaco Updates
- Enhanced executive discovery
- Improved AI model selection
- Better batch processing
- Cost tracking dashboard

## 🚀 Improvements

- Faster page load times
- Better error handling
- Improved mobile experience
- Enhanced search functionality

## 🐛 Bug Fixes

- Fixed pipeline filtering issues
- Resolved Grand Central OAuth flow
- Corrected Monaco batch export
- Fixed Speedrun template saving

## 📦 Dependencies

- Updated to Next.js 15
- Updated authentication libraries
- Security package updates
`
        },
        {
          id: "v1-0-0",
          title: "v1.0.0 - November 2024",
          description: "Initial public release",
          lastUpdated: "2024-11-01",
          tags: ["release", "v1.0.0"],
          content: `# Release v1.0.0 - November 2024

## 🎉 Initial Public Release

### Core Features

#### Action Platform (Falcon)
- Complete pipeline management
- Multi-stage tracking
- Team collaboration
- Custom fields and filters

#### Monaco Intelligence
- Executive discovery
- Contact enrichment
- Company research
- AI-powered insights

#### Grand Central
- 500+ integrations
- OAuth connectivity
- Data synchronization
- Workflow automation

#### Olympus
- Visual workflow builder
- Multi-step orchestration
- Error handling
- Real-time execution

#### Speedrun
- Quick actions
- Email templates
- Batch operations
- Keyboard shortcuts

### API

- RESTful API
- OAuth 2.0 authentication
- Webhook support
- Comprehensive documentation

### Infrastructure

- Built on Next.js 14
- PostgreSQL database
- Redis caching
- Prisma ORM

## 🙏 Thank You

Thank you to our beta testers and early adopters!
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

## Editor Shortcuts

### Text Editing
- \`Cmd/Ctrl + B\` - Bold
- \`Cmd/Ctrl + I\` - Italic
- \`Cmd/Ctrl + U\` - Underline
- \`Cmd/Ctrl + K\` - Insert link
- \`Cmd/Ctrl + Shift + V\` - Paste without formatting

### Rich Text
- \`Cmd/Ctrl + Shift + 7\` - Ordered list
- \`Cmd/Ctrl + Shift + 8\` - Bullet list
- \`Cmd/Ctrl + ]\` - Indent
- \`Cmd/Ctrl + [\` - Outdent
- \`Cmd/Ctrl + Shift + X\` - Strikethrough

## Modal Shortcuts

### Dialog Actions
- \`Enter\` - Confirm/submit
- \`Esc\` - Cancel/close
- \`Tab\` - Next field
- \`Shift + Tab\` - Previous field
- \`Cmd/Ctrl + Enter\` - Quick save

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
        },
        {
          id: "power-user-tips",
          title: "Power User Tips",
          description: "Advanced techniques and workflows",
          lastUpdated: "2025-01-10",
          tags: ["tips", "advanced", "productivity"],
          content: `# Power User Tips

Advanced techniques to maximize your productivity with Adrata.

## Pipeline Mastery

### Custom Views
Create custom views for different scenarios:

1. **Today's Focus**
   - Filter: \`dueDate:today OR lastContact:<7days\`
   - Sort: Priority (High to Low)
   - Columns: Company, Contact, Last Activity, Next Step

2. **High-Value Opportunities**
   - Filter: \`stage:opportunity AND value:>50000\`
   - Sort: Expected Close Date (Nearest first)
   - Columns: Company, Value, Close Date, Probability

3. **Stale Leads**
   - Filter: \`stage:lead AND lastContact:>30days\`
   - Sort: Last Contact (Oldest first)
   - Columns: Company, Contact, Last Contact, Assigned To

### Bulk Operations
Save time with bulk operations:

1. Select multiple records (\`Cmd/Ctrl + Click\`)
2. Use \`Cmd/Ctrl + Shift + E\` for bulk edit
3. Common bulk actions:
   - Assign to team member
   - Update status
   - Add tags
   - Change stage
   - Export to CSV

### Smart Filters
Use advanced filter syntax:

- \`value:>50000\` - Value greater than 50k
- \`closeDate:<30days\` - Closing within 30 days
- \`stage:opportunity AND assignee:me\` - My opportunities
- \`tags:urgent OR priority:high\` - Urgent or high priority
- \`company:~tech\` - Company name contains "tech"

## Monaco Intelligence

### Batch Research Workflow

1. **Prepare your list**
   - Export target companies from your CRM
   - Create CSV with company names or domains
   - Include any known contact information

2. **Upload to Monaco**
   - Click **Batch Research**
   - Upload CSV file
   - Select research type (Executive Discovery, Company Analysis)
   - Choose depth level based on importance

3. **Review and refine**
   - Monaco processes all companies in parallel
   - Review results as they complete
   - Flag high-confidence matches
   - Discard low-confidence results

4. **Export to pipeline**
   - Select best results
   - Click **Export to Action Platform**
   - Choose stage (usually Prospect or Lead)
   - Assign to team members

### Cost Optimization

Monaco automatically optimizes AI costs, but you can help:

- **Use Quick depth** for basic lookups (0.5 credits)
- **Use Standard depth** for most research (1 credit)
- **Reserve Deep depth** for high-value targets (2 credits)
- **Batch operations** are more efficient than individual
- **Cache results** - Monaco remembers recent searches

### Executive Discovery Strategies

**Three-Tier Approach:**

1. **Tier 1: CoreSignal** (Fast, reliable, 2 credits)
   - Best for established companies
   - High accuracy for senior executives
   - Usually completes in 3-5 seconds

2. **Tier 2: LinkedIn Research** (Medium, 1.5 credits)
   - Good for mid-sized companies
   - Works when CoreSignal has no data
   - Takes 10-15 seconds

3. **Tier 3: AI Deep Research** (Comprehensive, 3 credits)
   - Best for hard-to-find executives
   - Combines multiple sources
   - Takes 30-60 seconds

Monaco automatically waterfall through tiers for best results.

## Grand Central Workflows

### Common Integration Patterns

**CRM Two-Way Sync:**

1. Trigger: New deal in Adrata
2. Action: Check if exists in Salesforce
3. Condition: If not exists
4. Action: Create in Salesforce
5. Action: Store Salesforce ID in Adrata
6. Reverse: Salesforce changes → Adrata updates

**Lead Enrichment Pipeline:**

1. Trigger: New contact added
2. Action: Monaco enrichment
3. Transform: Validate email and phone
4. Condition: If high confidence
5. Action: Update CRM with enriched data
6. Action: Notify sales rep via Slack
7. Action: Add to outreach sequence

**Customer Onboarding Automation:**

1. Trigger: Deal marked as won
2. Action: Create customer record
3. Action: Generate onboarding tasks in Asana
4. Action: Send welcome email via SendGrid
5. Action: Create Slack channel for customer
6. Action: Add to customer success platform
7. Action: Schedule kickoff meeting

### Error Handling Best Practices

Always add error handling to critical workflows:

\`\`\`
Try:
  → Create Salesforce record
Catch Error:
  → Log to error tracking
  → Send alert to admin via Slack
  → Queue for manual review
  → Continue workflow (don't fail)
\`\`\`

## Olympus Advanced Techniques

### Parallel Processing

Execute independent steps in parallel for faster workflows:

\`\`\`
Company Resolution
├── Executive Discovery (parallel)
│   ├── CoreSignal lookup
│   ├── LinkedIn search
│   └── Web research
├── Company Research (parallel)
└── Aggregation (waits for all parallel)
\`\`\`

This pattern completes in 1/3 the time of sequential execution.

### Dynamic Branching

Use conditional logic for smart workflows:

\`\`\`
Company Size Detection
├── If small (1-50): Simple enrichment
├── If medium (51-200): Standard research
└── If large (200+): Deep analysis + executive discovery
\`\`\`

### Workflow Reusability

Create modular workflows that can be reused:

1. **Base Template**: Generic workflow structure
2. **Parameter Inputs**: Make workflows configurable
3. **Sub-Workflows**: Break complex workflows into modules
4. **Version Control**: Save versions before major changes

## Speedrun Efficiency

### Email Template Variables

Use these variables for personalization:

- \`{{firstName}}\` - Contact first name
- \`{{lastName}}\` - Contact last name
- \`{{company}}\` - Company name
- \`{{title}}\` - Contact job title
- \`{{myName}}\` - Your name
- \`{{customField}}\` - Any custom field value

### Multi-Step Sequences

Create email sequences for nurturing:

1. **Day 0**: Introduction email
2. **Day 3**: Value proposition follow-up
3. **Day 7**: Case study share
4. **Day 14**: Final check-in
5. **Auto-stop**: If reply received at any point

### A/B Testing

Test email variations:

1. Create two template versions
2. Split your list 50/50
3. Send version A to group 1
4. Send version B to group 2
5. Track open and reply rates
6. Use winning version for future sends

## API Integration Patterns

### Webhook + API Workflow

Combine webhooks with API calls for real-time automation:

\`\`\`javascript
// Webhook handler
app.post('/webhooks/adrata', async (req, res) => {
  const event = req.body;
  
  if (event.type === 'pipeline.stage_changed') {
    // Get full details via API
    const deal = await adrata.pipeline.get(event.data.id);
    
    // Perform custom logic
    if (deal.stage === 'customer') {
      await createCustomerRecord(deal);
      await sendWelcomeEmail(deal);
      await notifyCustomerSuccess(deal);
    }
  }
  
  res.sendStatus(200);
});
\`\`\`

### Batch API Operations

Process multiple records efficiently:

\`\`\`javascript
// ❌ Bad: Sequential requests (slow)
for (const contact of contacts) {
  await api.enrichContact(contact.id);
}

// ✅ Good: Batch request (fast)
await api.batchEnrich({
  contacts: contacts.map(c => c.id)
});
\`\`\`

### Rate Limit Management

Smart rate limit handling:

\`\`\`javascript
class RateLimitManager {
  constructor(maxPerHour) {
    this.max = maxPerHour;
    this.queue = [];
    this.inProgress = 0;
  }
  
  async enqueue(fn) {
    this.queue.push(fn);
    await this.process();
  }
  
  async process() {
    if (this.inProgress >= this.max) {
      await this.waitForCapacity();
    }
    
    const fn = this.queue.shift();
    if (fn) {
      this.inProgress++;
      await fn();
      this.inProgress--;
      this.process(); // Continue processing
    }
  }
}
\`\`\`

## Hidden Features

### Command Palette Power

The command palette (\`Cmd/Ctrl + K\`) can do more than you think:

- **Calculator**: Type \`= 125 * 4\` to calculate
- **Date Math**: Type \`date + 30 days\` for future date
- **Quick Actions**: Type \`email john@example.com\` to compose
- **Filters**: Type \`filter:stage:opportunity\` to filter pipeline
- **Navigation**: Type \`go:settings\` to jump anywhere

### URL Shortcuts

Use URL parameters for quick access:

- \`/pipeline?stage=opportunity&assignee=me\` - My opportunities
- \`/monaco?mode=batch\` - Go directly to batch mode
- \`/grand-central?template=crm-sync\` - Load template
- \`/docs?page=api-authentication\` - Jump to specific doc page

### Browser Extensions

Install our browser extension for additional features:

1. **LinkedIn Integration**
   - Add prospects directly from LinkedIn
   - Enrich profiles with Monaco
   - See CRM data on LinkedIn profiles

2. **Email Integration**
   - Log emails automatically to pipeline
   - See contact history in Gmail
   - Quick add to CRM from inbox

3. **Calendar Integration**
   - See deal context in calendar
   - Auto-log meetings to pipeline
   - Pre-meeting intelligence briefs

## Pro Workflow: Full Cycle

Here's how a power user runs a complete sales cycle:

### 1. Prospecting (Monaco)
- Upload target account list
- Batch research all companies
- Executive discovery for decision makers
- Export high-quality leads to pipeline

### 2. Outreach (Speedrun)
- Create personalized email sequence
- Schedule send times for optimal open rates
- Track opens and clicks
- Auto-follow-up on non-responders

### 3. Engagement (Action Platform)
- Log all interactions
- Add notes after every call
- Update deal value and close date
- Move through pipeline stages

### 4. Automation (Grand Central + Olympus)
- Sync with CRM automatically
- Alert team on important milestones
- Trigger onboarding on won deals
- Generate reports and dashboards

### 5. Analysis (Tower)
- Review pipeline metrics
- Identify bottlenecks
- Optimize conversion rates
- Forecast revenue

This complete workflow, when mastered, can increase your productivity by 10x.
`
        },
        {
          id: "hidden-features",
          title: "Hidden Features",
          description: "Secret productivity boosters",
          lastUpdated: "2025-01-10",
          tags: ["hidden", "features", "secrets"],
          content: `# Hidden Features

Secret productivity boosters and lesser-known features that power users love.

## Command Palette Secrets

### Calculator Mode
Type \`=\` in the command palette to activate calculator mode:

- \`= 125 * 4\` → \`500\`
- \`= (500 + 250) / 3\` → \`250\`
- \`= 50000 * 0.20\` → \`10000\`

Perfect for quick commission calculations!

### Date Math
Calculate dates without leaving Adrata:

- \`date + 30 days\` → Date 30 days from now
- \`date - 1 week\` → Date 1 week ago
- \`date next monday\` → Next Monday's date
- \`date in 3 months\` → Date 3 months from now

### Quick Email Compose
Type an email address in command palette to quick-compose:

- \`john@example.com\` → Opens email composer to John
- Pre-populates from your pipeline contacts
- Includes recent interaction history

## Pipeline Hidden Features

### Smart Lists
Create dynamic smart lists that auto-update:

1. Create a custom filter
2. Click the star icon to save
3. Name it (e.g., "Hot Opportunities")
4. List auto-updates as data changes
5. Access from sidebar anytime

### Quick Add from Anywhere
Use the global quick-add shortcut:

1. Press \`Cmd/Ctrl + Shift + A\`
2. Start typing company or contact name
3. Hit Enter to create
4. Works from any page in Adrata

### Relationship Graph
See connection between contacts:

1. Open any contact record
2. Press \`Cmd/Ctrl + Shift + R\`
3. View visual relationship graph
4. See mutual contacts, connections
5. Find warm introduction paths

### Pipeline Swimlanes
Group your pipeline by custom criteria:

1. Click the view options (⋮)
2. Select "Group By"
3. Choose: Assignee, Tag, Source, Custom Field
4. Drag deals between swimlanes
5. Great for team views!

## Monaco Secret Powers

### Reverse Lookup
Find companies that match specific criteria:

1. Open Monaco
2. Press \`Cmd/Ctrl + Shift + F\`
3. Enter criteria:
   - Company size
   - Industry
   - Location
   - Technologies used
   - Executive titles
4. Monaco finds matching companies

### Contact Deduplication
Automatically merge duplicate contacts:

1. Go to Settings → Data Management
2. Click "Find Duplicates"
3. Monaco uses AI to identify duplicates
4. Review suggested merges
5. One-click merge with data consolidation

### Intelligence Cache
Monaco caches research for 90 days:

- Same company looked up = instant results
- No credit charge for cached results
- View cache in Settings → Intelligence Cache
- Clear cache manually if needed

### Confidence Score Calibration
Adjust Monaco's confidence thresholds:

1. Settings → Monaco → Confidence Settings
2. Set minimum confidence (default: 70%)
3. Higher = fewer but more accurate results
4. Lower = more results but some false positives
5. Adjust based on your use case

## Grand Central Hidden Gems

### Workflow Scheduler
Schedule workflows to run automatically:

1. Open any workflow
2. Click the clock icon
3. Set schedule (daily, weekly, monthly, custom)
4. Set time and timezone
5. Optional: Set end date

### Connection Sharing
Share integration connections across team:

1. Connect to an integration (e.g., Salesforce)
2. Check "Share with workspace"
3. Team members can use your connection
4. You control permissions
5. Great for avoiding duplicate connections

### Workflow Marketplace
Access community-built workflows:

1. Grand Central → Marketplace
2. Browse by category
3. Preview workflow before installing
4. One-click install and customize
5. Contribute your own workflows

### Debug Mode
Troubleshoot workflows in detail:

1. Open any workflow
2. Press \`Cmd/Ctrl + Shift + D\`
3. Enable debug mode
4. See detailed execution logs
5. Inspect variables at each step
6. Step through workflow manually

## Olympus Power Features

### Workflow Templates from AI
Generate workflows using natural language:

1. Click "New Workflow"
2. Select "Generate with AI"
3. Describe what you want:
   - "When a deal closes, create customer record and send welcome email"
4. AI generates complete workflow
5. Review and customize

### Variable Inspector
See all variables in real-time:

1. During workflow execution
2. Press \`Cmd/Ctrl + Shift + I\`
3. Opens variable inspector
4. See values at each step
5. Debug data transformation issues

### Workflow Diff
Compare workflow versions:

1. Open workflow version history
2. Select two versions
3. Click "Compare"
4. See visual diff of changes
5. Restore previous version if needed

### Sub-Workflow Import
Reuse workflows as sub-steps:

1. Create a workflow module
2. In another workflow, add "Sub-Workflow" node
3. Select your module
4. Pass parameters in/out
5. Maintains modularity and reusability

## Speedrun Ninja Tricks

### Quick Actions Menu
Custom quick action menu:

1. Select any contact
2. Right-click or \`Cmd/Ctrl + .\`
3. See custom quick actions
4. Add your own in Settings
5. Execute multi-step actions instantly

### Email Template Variables
Advanced template variables:

- \`{{firstName|capitalize}}\` - Capitalize first name
- \`{{company|upper}}\` - Company name in uppercase
- \`{{title|default:"Team Member"}}\` - Default value if empty
- \`{{customField|date}}\` - Format date field
- \`{{calc:value*0.20}}\` - Calculate on the fly

### Scheduled Send
Schedule emails for optimal times:

1. Compose email in Speedrun
2. Click the schedule icon
3. Choose:
   - Specific date/time
   - "Optimal time" (AI picks based on recipient)
   - Timezone-aware sending
4. Email sends automatically

### Smart Templates
Templates that adapt based on context:

\`\`\`
{{#if stage=="opportunity"}}
Looking forward to our discussion about the proposal.
{{else}}
Would love to explore how we can help {{company}}.
{{/if}}
\`\`\`

Conditional logic makes templates intelligent.

## Browser Extension Features

### LinkedIn Intelligence Panel
When viewing LinkedIn profiles:

- Shows if person is in your CRM
- Displays recent interactions
- One-click add to pipeline
- See mutual connections
- Quick email composer

### Gmail CRM Sidebar
In Gmail inbox:

- Auto-detects contacts from emails
- Shows CRM data in sidebar
- Log emails to pipeline automatically
- Create follow-up tasks
- See communication history

### Calendar Intelligence
In Google Calendar/Outlook:

- Shows deal context before meetings
- Pre-meeting intelligence briefs
- Auto-logs meetings to CRM
- Creates follow-up tasks
- Suggests next steps after meeting

## API Hidden Powers

### Webhook Replay
Replay failed webhooks:

1. Go to Settings → Webhooks
2. Click on any webhook
3. View delivery history
4. Click "Replay" on failed deliveries
5. Useful for debugging integrations

### API Playground
Test API calls interactively:

1. Settings → API → Playground
2. Choose endpoint and method
3. Fill in parameters
4. See live request/response
5. Generate code snippets

### Custom Endpoints
Create custom API endpoints:

1. Settings → API → Custom Endpoints
2. Define your endpoint logic
3. Use JavaScript for transformations
4. Deploy with one click
5. Great for custom integrations

## Theme and UI Secrets

### Hidden Themes
Unlock special themes:

1. Settings → Appearance
2. Click theme preview 10 times
3. Unlocks "Matrix", "Synthwave", "Midnight"
4. Or use cheat code: \`Cmd/Ctrl + Shift + T\` then type \`matrix\`

### Compact Mode
Extra dense UI for power users:

1. Settings → Appearance → Density
2. Select "Compact"
3. Fits 50% more content on screen
4. Perfect for large monitors

### Focus Mode
Distraction-free environment:

1. Press \`Cmd/Ctrl + Shift + F\`
2. Hides everything except main content
3. Press again to exit
4. Great for deep work sessions

## Data Export Secrets

### Advanced CSV Export
Export with formulas and formatting:

1. Select records to export
2. Click Export → Advanced
3. Choose:
   - Include formulas
   - Apply formatting
   - Custom column order
   - Filtered/grouped data
4. Generate Excel-ready exports

### API Export
Programmatically export data:

\`\`\`javascript
// Export entire pipeline with relationships
const export = await api.export({
  type: 'pipeline',
  include: ['contacts', 'companies', 'activities'],
  format: 'json',
  compressed: true
});
\`\`\`

## Bonus: Easter Eggs

### Konami Code
Type the Konami code in Adrata:

\`↑ ↑ ↓ ↓ ← → ← → B A\`

Unlocks retro theme and classic Adrata logo!

### Developer Console
In browser console, type:

\`\`\`javascript
adrata.version() // Shows detailed version info
adrata.stats() // Shows your usage statistics
adrata.disco() // 🕺 Surprise!
\`\`\`

### Achievement System
Track your Adrata mastery:

1. Settings → Profile → Achievements
2. Unlock achievements:
   - "First Deal Closed"
   - "Monaco Master" (100 enrichments)
   - "Workflow Wizard" (10 workflows created)
   - "API Ninja" (1000 API calls)
   - "Speedrun Champion" (500 quick actions)

## Pro Tip: Create Your Own Shortcuts

You can create custom shortcuts for anything:

1. Settings → Keyboard Shortcuts
2. Click "Add Custom Shortcut"
3. Name it
4. Assign key combination
5. Choose action or write JavaScript

Example custom shortcuts:
- \`Cmd/Ctrl + Shift + 1\` → "Add high-value opportunity"
- \`Cmd/Ctrl + Shift + 2\` → "Run weekly report"
- \`Cmd/Ctrl + Shift + 3\` → "Batch enrich selected"

The power users who master these hidden features can be 10x more productive!
`
        }
      ]
    }
  ]
};

