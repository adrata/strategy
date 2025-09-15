# Action Model Implementation Plan

## Current Database State
- **2,438 people** - 1,664 (68.3%) missing lastAction
- **4,609 companies** - 4,293 (93.1%) missing lastAction  
- **9,059 actions** - 1,638 (18.1%) are orphaned
- **15,588 emails** - not linked to actions yet
- **181 notes** - not linked to actions yet

## Implementation Strategy

### Phase 1: Email Integration (Highest Impact)
**Goal**: Link 15,588 emails to actions and people/companies

**Approach**:
1. Create actions for existing emails using `externalId: "email_{emailId}"`
2. Match email addresses to people records
3. Link to companies through people relationships
4. Update lastAction for people/companies with email activity

**Expected Impact**: 
- Reduce orphaned actions significantly
- Populate lastAction for many people/companies
- Create foundation for timeline view

### Phase 2: Orphaned Action Linking
**Goal**: Link remaining 1,638 orphaned actions

**Approach**:
1. Use action names to match people by fullName
2. Use companyName to match companies
3. Implement fuzzy matching for better results
4. Manual review for unmatched actions

### Phase 3: lastAction Population
**Goal**: Populate lastAction for all people and companies

**Approach**:
1. Find most recent action for each person/company
2. Update lastAction and lastActionDate fields
3. Handle cases with no actions (set to "No recent activity")

### Phase 4: nextAction Generation
**Goal**: Generate intelligent next actions

**Approach**:
1. Simple rule-based system initially
2. AI-powered recommendations later
3. Set appropriate nextActionDate timing

## Technical Implementation

### Simple Email Linking Script
```javascript
// For each email:
// 1. Check if action already exists (externalId)
// 2. Find people by email addresses
// 3. Create action with personId/companyId
// 4. Update lastAction for linked people/companies
```

### Batch Processing
- Process 100 emails at a time
- Use transactions for data consistency
- Provide progress feedback
- Handle errors gracefully

### Timeline Integration
- Query actions by personId/companyId
- Include emails via externalId lookup
- Sort by createdAt for chronological order
- Display action type, description, and date

## Success Metrics
- **0 orphaned actions** (down from 1,638)
- **100% lastAction coverage** (up from 31.7% people, 6.9% companies)
- **Timeline view** showing emails and actions together
- **Performance**: All operations complete in <30 seconds

## Next Steps
1. Create email linking script
2. Test with small batch (100 emails)
3. Scale to full dataset
4. Build timeline component
5. Test end-to-end functionality
