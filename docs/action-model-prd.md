# Action Model System - Product Requirements Document

## Overview
Build a comprehensive action model that connects all sales activities (emails, calls, LinkedIn, CRUD operations) to people and companies, enabling intelligent timeline views and automated next action recommendations.

## Current State
- **Total People**: 2,438
- **Total Companies**: 4,609
- **Total Actions**: 9,059
- **Orphaned Actions**: 1,638 (18.1%) - not connected to people/companies
- **People without lastAction**: 1,664 (68.3%)
- **Companies without lastAction**: 4,293 (93.1%)
- **Total Emails**: 15,588 (not yet linked to actions)
- **Total Notes**: 181 (not yet linked to actions)

## End State Goals

### 1. Complete Action Linking
- **All actions connected** to people and/or companies
- **Zero orphaned actions** (currently 18.1% are orphaned)
- **Email integration** - existing emails linked to actions
- **Timeline view** showing chronological actions for each person/company

### 2. Intelligent Action Tracking
- **lastAction field** populated for all people and companies
- **lastActionDate** showing when the most recent action occurred
- **nextAction field** with AI-generated recommendations
- **nextActionDate** with suggested timing

### 3. Timeline Integration
- **Unified timeline** showing all action types (emails, calls, LinkedIn, CRUD)
- **Email actions** integrated into timeline (not separate)
- **Chronological ordering** of all activities
- **Action context** and details visible in timeline

## Technical Requirements

### Database Schema
- ✅ `actions` table exists with `personId`, `companyId` fields
- ✅ `people` table has `lastAction`, `lastActionDate`, `nextAction`, `nextActionDate`
- ✅ `companies` table has `lastAction`, `lastActionDate`, `nextAction`, `nextActionDate`
- ✅ Deprecated `contacts`/`accounts` models removed

### Action Types to Support
- **Email Actions**: `email_sent`, `email_received`, `email_conversation`
- **Call Actions**: `phone_call`, `cold_call`, `follow_up_call`
- **LinkedIn Actions**: `linkedin_connection_request`, `linkedin_message`, `linkedin_inmail`
- **CRUD Actions**: `person_created`, `company_created`, `lead_created`, `prospect_created`
- **Meeting Actions**: `meeting_scheduled`, `meeting_completed`
- **Note Actions**: `note_added`

### Linking Strategy
1. **Email Linking**: Match email addresses to people records
2. **Company Linking**: Use company names and email domains
3. **Action Inheritance**: Leads/prospects/opportunities inherit actions from their people/companies
4. **External ID System**: Use `externalId` field to prevent duplicates

## Success Metrics
- **0% orphaned actions** (down from 18.1%)
- **100% lastAction coverage** for people and companies
- **90%+ nextAction coverage** with intelligent recommendations
- **Timeline view** showing all actions chronologically
- **Email integration** complete in timeline

## Implementation Phases

### Phase 1: Database Cleanup ✅
- Remove deprecated contacts/accounts models
- Clean up schema references
- Regenerate Prisma client

### Phase 2: Action Linking (In Progress)
- Link orphaned actions to people/companies
- Create actions for existing emails
- Implement email-to-action linking

### Phase 3: lastAction Population
- Populate lastAction for all people
- Populate lastAction for all companies
- Ensure lastActionDate is accurate

### Phase 4: nextAction Generation
- Implement AI-powered nextAction recommendations
- Set appropriate nextActionDate timing
- Create strategy guide system

### Phase 5: Timeline Integration
- Build unified timeline component
- Integrate all action types
- Ensure chronological ordering

## Current Blockers
1. **Terminal Performance**: Complex database queries causing timeouts
2. **Orphaned Actions**: 1,638 actions need linking logic
3. **Email Integration**: Need to create actions for existing emails
4. **Batch Processing**: Need efficient processing for large datasets

## Next Steps
1. Run simple database queries to understand current state
2. Create efficient linking algorithms
3. Implement batch processing for large updates
4. Test timeline integration with real data
