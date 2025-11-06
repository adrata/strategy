# Data Refresh System with Color-Coded Priority

## Overview

The buyer group pipeline now includes an intelligent data refresh system that automatically schedules refresh frequency based on churn risk. This ensures we have fresh data for high-risk contacts while optimizing API costs for low-risk contacts.

## Color-Coded Refresh System

### 🔴 Red (High Priority) - Daily Refresh
**Criteria:**
- Churn risk score >= 60
- OR predicted departure within 3 months

**Refresh Frequency:** Daily (every 1 day)
**Reasoning:** High-risk contacts need daily monitoring to catch departures early

### 🟠 Orange (Medium Priority) - Weekly Refresh
**Criteria:**
- Churn risk score 40-59
- OR predicted departure within 6 months

**Refresh Frequency:** Weekly (every 7 days)
**Reasoning:** Medium-risk contacts need weekly monitoring to track changes

### 🟢 Green (Low Priority) - Monthly Refresh
**Criteria:**
- Churn risk score < 40
- AND predicted departure > 6 months away

**Refresh Frequency:** Monthly (every 30 days)
**Reasoning:** Low-risk contacts align with Coresignal's standard monthly refresh cycle

## Data Storage

### In `customFields.churnPrediction`:
```json
{
  "churnPrediction": {
    "refreshPriority": "high|medium|low",
    "refreshColor": "red|orange|green",
    "refreshFrequency": "daily|weekly|monthly",
    "refreshFrequencyDays": 1|7|30,
    "nextRefreshDate": "2025-11-07T00:00:00.000Z",
    "lastRefreshDate": "2025-11-06T00:00:00.000Z"
  }
}
```

### In `aiIntelligence.refreshStatus`:
```json
{
  "refreshStatus": {
    "priority": "high",
    "color": "red",
    "frequency": "daily",
    "nextRefreshDate": "2025-11-07T00:00:00.000Z",
    "lastRefreshDate": "2025-11-06T00:00:00.000Z"
  }
}
```

### Direct Database Fields:
- `dataLastVerified`: DateTime - Last time data was refreshed
- `yearsInRole`: Int - Years in current role

## Refresh Scheduler

A dedicated script (`refresh-scheduler.js`) queries the database to find people who need refresh:

```bash
# Get all people needing refresh
node refresh-scheduler.js --workspace-id "xxx" --all

# Get only red priority (daily)
node refresh-scheduler.js --workspace-id "xxx" --priority red

# Get only orange priority (weekly)
node refresh-scheduler.js --workspace-id "xxx" --priority orange

# Get only green priority (monthly)
node refresh-scheduler.js --workspace-id "xxx" --priority green
```

## Coresignal Refresh Rate

Based on research:
- **Coresignal standard refresh:** Monthly
- **Our system:** 
  - Red: Daily (more frequent for high-risk)
  - Orange: Weekly (more frequent for medium-risk)
  - Green: Monthly (aligns with Coresignal)

## Implementation Details

### Automatic Calculation
The refresh schedule is automatically calculated when:
1. Buyer group is discovered
2. Churn prediction is calculated
3. Person record is saved to database

### Refresh Workflow
1. **Query for refresh candidates** using `refresh-scheduler.js`
2. **Refresh data** via Coresignal API for those people
3. **Update refresh dates** using `updateRefreshDate()` function
4. **Re-calculate churn prediction** with fresh data

### Benefits

1. **Cost Optimization**: Only refresh high-risk contacts daily
2. **Data Freshness**: High-risk contacts always have recent data
3. **Automated Scheduling**: No manual intervention needed
4. **Queryable**: Easy to find people needing refresh by color/priority
5. **Real-Time Tags**: Color-coded system for quick visual identification

## Example Queries

### Find all red priority people needing refresh:
```javascript
const people = await prisma.people.findMany({
  where: {
    workspaceId: workspaceId,
    customFields: {
      path: ['churnPrediction', 'refreshColor'],
      equals: 'red'
    }
  }
});
// Then filter by nextRefreshDate <= now
```

### Find people by refresh frequency:
```javascript
// Get all people and filter by customFields.churnPrediction.refreshFrequency
const allPeople = await prisma.people.findMany({
  where: { workspaceId: workspaceId }
});

const daily = allPeople.filter(p => 
  p.customFields?.churnPrediction?.refreshFrequency === 'daily'
);
```

## Integration with Buyer Group Pipeline

The refresh system is fully integrated:
- ✅ Calculated automatically for all buyer group members
- ✅ Stored in database (customFields + aiIntelligence)
- ✅ Queryable by color, priority, or frequency
- ✅ Ready for automated refresh workflows
- ✅ `dataLastVerified` field tracks last refresh time

## Usage Example

```javascript
// After refreshing data via Coresignal API
const { updateRefreshDate } = require('./refresh-scheduler');

// Update refresh date after refresh
await updateRefreshDate(personId, {
  frequency: 'daily',
  frequencyDays: 1,
  color: 'red',
  priority: 'high'
});
```
