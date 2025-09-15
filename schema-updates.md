# Data Model Updates for Action Model Standardization

## Current State Analysis

Based on the schema analysis, here's the current state of `lastAction` and `lastActionDate` fields:

### Companies Model ✅
- `lastAction: String?`
- `lastActionDate: DateTime?`

### People Model ✅  
- `lastAction: String?`
- `lastActionDate: DateTime?`

### Leads Model ⚠️
- `lastAction: String?` ✅
- `lastActionDate: DateTime?` ❌ **MISSING**

### Prospects Model ⚠️
- `lastAction: String?` ❌ **MISSING**
- `lastActionDate: DateTime?` ✅

### Opportunities Model ⚠️
- `lastAction: String?` ❌ **MISSING** 
- `lastActionDate: DateTime?` ✅

## Required Schema Changes

### 1. Add missing fields to Leads model
```prisma
model leads {
  // ... existing fields ...
  lastAction        String?
  lastActionDate    DateTime?   // ADD THIS FIELD
  nextAction        String?
  nextActionDate    DateTime?
  // ... rest of fields ...
}
```

### 2. Add missing fields to Prospects model  
```prisma
model prospects {
  // ... existing fields ...
  lastAction        String?     // ADD THIS FIELD
  lastActionDate    DateTime?
  nextAction        String?
  nextActionDate    DateTime?
  // ... rest of fields ...
}
```

### 3. Add missing fields to Opportunities model
```prisma
model opportunities {
  // ... existing fields ...
  lastAction        String?     // ADD THIS FIELD
  lastActionDate    DateTime?
  nextAction        String?
  nextActionDate    DateTime?
  // ... rest of fields ...
}
```

## Database Migration

The SQL migration script `update-action-model-schema.sql` has been created to add these fields:

```sql
-- Add lastAction field to prospects table
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS lastAction VARCHAR(50);

-- Add lastActionDate field to leads table  
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lastActionDate TIMESTAMP(6);

-- Add lastAction field to opportunities table
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS lastAction VARCHAR(50);
```

## Benefits of Standardization

1. **Consistent Data Model**: All entities will have the same action tracking fields
2. **Simplified Code**: No need for conditional logic based on entity type
3. **Better Analytics**: Consistent reporting across all entity types
4. **AI Integration**: Easier to implement AI-powered next action generation
5. **Timeline Accuracy**: All entities can track both action type and date

## Implementation Steps

1. ✅ Run the database migration
2. ✅ Update Prisma schema
3. ✅ Regenerate Prisma client
4. ✅ Update the action model implementation script
5. ✅ Test the complete action model
6. ✅ Generate comprehensive report

This standardization will enable the complete action model implementation to work seamlessly across all entity types.
