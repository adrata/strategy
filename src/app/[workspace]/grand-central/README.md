# Grand Central - Integration Platform

A full-page, Olympus-style integration platform for connecting and orchestrating 500+ API integrations via Nango.

## Overview

Grand Central is a visual workflow builder that enables users to:
- Connect to 500+ APIs through Nango's unified integration platform
- Build integration workflows with a drag-and-drop interface
- Execute workflows in real-time with live monitoring
- Configure and manage API connections across multiple providers

## Architecture

### Core Components

#### **Layout (`layout.tsx`)**
- Full-page layout mirroring Olympus design
- Context provider for selected nodes
- Right panel for node configuration
- Integration with existing auth and workspace context

#### **Main Page (`page.tsx`)**
- Visual canvas for integration workflows
- Integration library popup for browsing 500+ APIs
- Toolbar with execute and code view options
- Real-time execution logs

#### **Services**

**NangoService** (`services/NangoService.ts`)
- Wrapper for Nango SDK operations
- Provider management and OAuth flows
- Operation execution via Nango proxy
- Integration categorization

**WorkflowEngine** (`services/WorkflowEngine.ts`)
- Executes integration workflows
- Traverses nodes and connections
- Handles different node types (trigger, action, transform, condition)
- Real-time execution logging

#### **Hooks**

**useIntegrationDrag** (`hooks/useIntegrationDrag.ts`)
- Drag and drop functionality for integration nodes
- Mouse event handling for canvas interactions

**useWorkflowExecution** (`hooks/useWorkflowExecution.ts`)
- Workflow execution state management
- Execution log tracking
- Start/stop execution controls

#### **Types**

**integration.ts**
- `IntegrationNode`: Individual integration step
- `IntegrationProvider`: API provider metadata
- `IntegrationOperation`: API operation definition

**workflow.ts**
- `Workflow`: Complete workflow definition
- `WorkflowExecution`: Execution state and logs
- `ExecutionLog`: Individual log entry

#### **Utilities**

**integrationCategories.ts**
- Pre-configured integration categories (CRM, Communication, Marketing, etc.)
- Popular providers for each category (Salesforce, HubSpot, Slack, etc.)
- Icon and color utilities

### Database Schema

```prisma
model grand_central_workflows {
  id          String   @id @default(ulid())
  workspaceId String   @db.VarChar(30)
  name        String
  description String?
  nodes       Json     // Integration nodes config
  connections Json     // Node connections
  status      String   @default("active")
  createdBy   String   @db.VarChar(30)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model grand_central_executions {
  id         String   @id @default(ulid())
  workflowId String   @db.VarChar(30)
  status     String   // running, completed, failed
  startedAt  DateTime @default(now())
  completedAt DateTime?
  logs       Json
  error      String?
}

model grand_central_connections {
  id                  String   @id @default(ulid())
  workspaceId         String   @db.VarChar(30)
  provider            String   // salesforce, hubspot, etc.
  nangoConnectionId   String
  metadata            Json
  status              String   @default("active")
  connectedAt         DateTime @default(now())
}
```

### API Routes

**Workflows**
- `GET /api/grand-central/workflows` - List workflows
- `POST /api/grand-central/workflows` - Create workflow
- `PUT /api/grand-central/workflows` - Update workflow
- `DELETE /api/grand-central/workflows` - Delete workflow

**Nango Operations**
- `GET /api/grand-central/nango/providers` - List available providers
- `POST /api/grand-central/nango/connect` - Initiate OAuth flow
- `POST /api/grand-central/nango/disconnect` - Disconnect provider
- `POST /api/grand-central/nango/execute` - Execute API operation

## Features

### Visual Workflow Builder
- Drag-and-drop interface for building integrations
- Real-time canvas with zoom and pan
- Visual connection lines between nodes
- Node type indicators (trigger, action, transform, condition)

### Integration Library
- Browse 500+ integrations categorized by type
- Quick search and filter capabilities
- One-click addition to workflow
- Provider connection status

### Execution Engine
- Real-time workflow execution
- Live execution logs with log levels
- Error handling and retry logic
- Support for parallel execution paths

### Node Types
- **Trigger**: Starts workflow (webhook, schedule, manual)
- **Action**: Executes API operation
- **Transform**: Data manipulation and mapping
- **Condition**: Branching logic

### Code View
- JSON representation of workflows
- Direct editing capability
- Import/export workflows

## Usage

### Creating a Workflow

1. Click "Add Integration" to open the integration library
2. Browse categories and select an integration
3. The integration node appears on the canvas
4. Drag nodes to position them
5. Click a node to configure it in the right panel
6. Click "Execute" to run the workflow

### Connecting to APIs

Integration connections are managed through Nango:

1. Select a provider from the library
2. Nango handles OAuth flow automatically
3. Connection status is tracked per workspace
4. Reconnect if token expires

### Executing Workflows

1. Configure all nodes in the workflow
2. Click "Execute" button
3. Watch real-time logs in bottom-right corner
4. View execution status and results

## Integration with Nango

Grand Central leverages Nango's unified API platform:

- **OAuth Management**: Nango handles all OAuth flows
- **Token Refresh**: Automatic token refresh handling
- **API Proxy**: Unified API calls across 500+ providers
- **Webhooks**: Real-time event triggers
- **Data Syncing**: Continuous data synchronization

### Supported Categories

- **CRM**: Salesforce, HubSpot, Pipedrive, Zoho CRM
- **Communication**: Slack, Microsoft Teams, Discord
- **Marketing**: Mailchimp, SendGrid
- **Productivity**: Google Workspace, Notion, Asana
- **Finance**: Stripe, QuickBooks
- **E-commerce**: Shopify, WooCommerce
- **Support**: Zendesk, Intercom
- **Analytics**: Google Analytics, Mixpanel

## Development

### Adding New Integrations

1. Add provider to `integrationCategories.ts`
2. Define operations with input/output schemas
3. Nango handles the API communication

### Extending Node Types

1. Update `IntegrationNode` type in `types/integration.ts`
2. Add execution logic to `WorkflowEngine.ts`
3. Update canvas rendering in `page.tsx`

### Custom Operations

For operations not supported by Nango:
1. Create custom operation in `services/NangoService.ts`
2. Add to provider's operations list
3. Implement execution in WorkflowEngine

## Future Enhancements

- [ ] Workflow templates library
- [ ] Scheduled execution (cron-like)
- [ ] Webhook triggers
- [ ] Error retry policies
- [ ] Workflow versioning
- [ ] Conditional branching UI
- [ ] Data transformation builder
- [ ] Execution history and analytics
- [ ] Collaboration and sharing
- [ ] Testing mode with mock data

## Navigation

Grand Central is accessible from:
- Profile menu dropdown
- Direct URL: `/[workspace]/grand-central`
- Keyboard shortcut: `Cmd+Shift+G`

## Performance

- Workflows stored in database with JSON fields
- Execution logs stored for audit trail
- Canvas optimized for 50+ nodes
- Real-time updates via execution callbacks

## Security

- Workspace-scoped workflows
- User-based access control
- OAuth tokens managed by Nango
- Encrypted API credentials
- Audit logging for all operations

