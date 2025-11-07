# Buyer Group Role Dropdown

## Overview

The Role field in buyer group records now uses an intelligent dropdown selector instead of free-text input. This ensures data consistency and helps users select the appropriate role based on enterprise sales best practices.

## Available Roles

The system supports five predefined buyer group roles based on enterprise sales research:

### 1. Decision Maker
- **Database Value**: `decision`
- **Description**: Has budget authority and final approval power for the purchase
- **Typical Count**: 1-3 per buyer group
- **Examples**: VP Sales, CRO, SVP Sales, VP Revenue Operations

### 2. Champion
- **Database Value**: `champion`
- **Description**: Internal advocate who actively promotes your solution within the company
- **Typical Count**: 2-3 per buyer group
- **Examples**: Director Sales Operations, Head of Sales Enablement, Director Revenue Operations

### 3. Stakeholder
- **Database Value**: `stakeholder`
- **Description**: Affected by or influences the purchase decision but lacks final authority
- **Typical Count**: 2-4 per buyer group
- **Examples**: VP Marketing, CTO, VP Customer Success, Director Analytics

### 4. Blocker
- **Database Value**: `blocker`
- **Description**: Can prevent or significantly delay the purchase through policy/process control
- **Typical Count**: 1-2 per buyer group
- **Examples**: Director Procurement, CISO, VP Legal, Chief Security Officer

### 5. Introducer
- **Database Value**: `introducer`
- **Description**: Has relationships and can facilitate access to decision makers and champions
- **Typical Count**: 2-3 per buyer group
- **Examples**: Account Executive, Territory Manager, Customer Success Manager

## Usage

### In Tables

When viewing buyer group members in a table:

1. **View Mode**: The role is displayed with its human-readable label (e.g., "Decision Maker")
2. **Hover**: A small dropdown icon appears to indicate the field is editable
3. **Edit Mode**: Click the edit icon or double-click the cell to open the dropdown
4. **Selection**: Choose from the five predefined roles
5. **Save**: Changes are saved automatically when you select a new role or click outside the dropdown

### Role Colors

Each role has a distinct color scheme for easy visual identification:

- **Decision Maker**: Red (high authority)
- **Champion**: Green (positive advocate)
- **Stakeholder**: Blue (neutral influence)
- **Blocker**: Orange (caution/risk)
- **Introducer**: Gray (access facilitator)

## Technical Implementation

### Database Schema

The role field uses a Postgres ENUM type:

```sql
CREATE TYPE "BuyerGroupRole" AS ENUM ('decision', 'champion', 'stakeholder', 'blocker', 'introducer');
```

### Prisma Model

```prisma
model BuyerGroupMembers {
  role BuyerGroupRole
  // ... other fields
}
```

### Constants File

All role definitions are centralized in `/src/platform/constants/buyer-group-roles.ts` for consistency across the application.

### Helper Functions

```typescript
import { getRoleLabel, getRoleValue, getRoleColorClasses } from '@/platform/constants/buyer-group-roles';

// Convert database value to display label
const label = getRoleLabel('decision'); // Returns: "Decision Maker"

// Convert display label to database value
const value = getRoleValue('Decision Maker'); // Returns: "decision"

// Get color classes for badges
const colors = getRoleColorClasses('champion'); // Returns: "bg-success/10 text-success border border-success"
```

## Best Practices

1. **Decision Makers**: Limit to 1-3 to avoid decision paralysis
2. **Champions**: Always identify at least one primary champion and one backup
3. **Blockers**: Identify early in the sales process to mitigate risk
4. **Introducers**: Use for initial relationship building and access
5. **Stakeholders**: Include key influencers but avoid overwhelming the group

## Optimal Buyer Group Composition

For enterprise deals (8-15 total members):
- Decision Makers: 1-3
- Champions: 2-3
- Stakeholders: 2-4
- Blockers: 1-2
- Introducers: 2-3

## Role Identification Criteria

### Authority Signals
- Budget approval levels
- P&L responsibility
- Team size and scope
- Executive titles (VP+, C-Level)

### Influence Signals
- Cross-functional collaboration
- LinkedIn connections within company
- Speaking at industry events
- Published thought leadership

### Access Signals
- Customer-facing roles
- Field-based positions
- Relationship management responsibilities
- Partnership/alliance roles

## Related Documentation

- [Role Definitions](/src/platform/pipelines/pipelines/core/archive/buyer-group-legacy/services/role-definitions.md)
- [Buyer Group Guide](/src/platform/pipelines/pipelines/core/STREAMLINED_BUYER_GROUP_GUIDE.md)

