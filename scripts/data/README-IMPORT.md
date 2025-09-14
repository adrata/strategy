# Lead Data Import for Adrata Workspace

This script prepares and imports lead data for Dan in the Adrata workspace, transforming CSV data into proper Person and Lead records for your CRM system.

## 📋 Overview

The import script processes your lead data and:

- Creates **Person** records with professional details
- Creates **Lead** records with qualification scoring
- Maps lead stages (Generate → Initiate → Educate)
- Assigns all leads to Dan in the Adrata workspace
- Generates clean SQL for database insertion

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install csv-parser uuid
```

### 2. Configure the Script

Edit `import-lead-data.js` and update:

```javascript
const CONFIG = {
  workspace: {
    id: "adrata_workspace", // Replace with actual workspace ID
    name: "Adrata",
  },
  user: {
    id: "dan_user_id", // Replace with Dan's actual user ID
    name: "Dan",
  },
  csvFile: "lead-data.csv",
};
```

### 3. Run the Import

```bash
node import-lead-data.js
```

## 📊 Data Transformation

### Lead Status Mapping

| Original Status                   | Mapped Status | Description                      |
| --------------------------------- | ------------- | -------------------------------- |
| Called                            | Contacted     | Lead has been contacted          |
| Intro call or demo booked or held | Qualified     | Lead is qualified and engaged    |
| Incorrect company/phone data      | Unqualified   | Data quality issues              |
| Have not called                   | New           | Fresh lead, no contact yet       |
| Skipped bc they're CROs...        | Research      | Requires research before contact |

### Lead Stage Pipeline

- **Generate**: Initial prospecting stage
- **Initiate**: First contact and qualification
- **Educate**: Demo and discovery process

### Qualification Scoring

The system calculates qualification scores (0-100) based on:

- **Role Influence**: Decision Maker (+40), Champion (+30), Stakeholder (+20), Opener (+10)
- **Title Seniority**: C-Level (+25), VP (+20), Director (+15), Manager (+10)
- **Engagement**: Demo booked (+20), Called (+10), Data issues (-20)

### Buyer Personas

- **Executive Decision Maker**: C-level executives and CROs
- **Internal Champion**: Identified champions
- **Key Stakeholder**: Important influencers
- **Initial Contact**: Entry-level contacts

## 📁 Output Files

### `lead-import.sql`

Production-ready SQL with transaction safety:

```sql
-- Lead Data Import for Dan @ Adrata
-- Generated on: 2024-06-16T18:00:00.000Z
-- Total records: 409 persons, 409 leads

BEGIN;

-- Insert Person records
INSERT INTO "Person" (
  "id", "firstName", "lastName", "fullName", "email", "phone",
  -- ... additional fields
) VALUES (
  'uuid-here', 'Jordan', 'Daniel', 'Jordan Daniel', 'jordan.daniel@airtable.com', '+1 516-232-6121',
  -- ... additional values
);

-- Insert Lead records
INSERT INTO "Lead" (
  "id", "personId", "companyName", "status", "source", "currentStage",
  -- ... additional fields
) VALUES (
  'uuid-here', 'person-uuid', 'Airtable', 'Contacted', 'Data Import', 'Generate',
  -- ... additional values
);

COMMIT;
```

### `lead-data-processed.json`

Human-readable JSON for review and verification.

## 🛡️ Safety Features

- **Transaction Safety**: All inserts wrapped in BEGIN/COMMIT
- **Data Validation**: Skips records with missing required fields
- **Error Handling**: Graceful handling of malformed data
- **SQL Injection Protection**: Proper string escaping
- **Unique IDs**: UUID generation for all records

## 📈 Expected Results

From your 409-record dataset, expect:

- ~300+ successfully imported leads
- ~50+ different companies
- Smart ranking based on qualification scores
- Proper stage progression tracking

### Status Distribution (Estimated)

- **Contacted**: ~250 leads
- **Qualified**: ~20 leads (demos booked)
- **New**: ~30 leads (not yet called)
- **Research**: ~15 leads (CROs requiring intelligence)
- **Unqualified**: ~5 leads (data issues)

## 🔧 Database Execution

### Local Environment

```bash
psql -d your_local_db -f lead-import.sql
```

### Production Environment

```bash
# Backup first!
pg_dump your_prod_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Then import
psql -d your_prod_db -f lead-import.sql
```

## ✅ Verification Steps

1. **Check Import Success**:

   ```sql
   SELECT COUNT(*) FROM "Person" WHERE "workspaceId" = 'adrata_workspace';
   SELECT COUNT(*) FROM "Lead" WHERE "assignedToUserId" = 'dan_user_id';
   ```

2. **Verify Data Quality**:

   ```sql
   SELECT status, COUNT(*) FROM "Lead" GROUP BY status;
   SELECT currentStage, COUNT(*) FROM "Lead" GROUP BY currentStage;
   ```

3. **Action Platform Verification**:
   - Navigate to Action Platform > Acquire > Leads
   - Verify leads are visible and assigned to Dan
   - Check lead cards show proper progression stages
   - Test search and filtering functionality

## 🎯 Next Steps After Import

1. **Lead Review**: Dan should review high-scoring leads first
2. **Pipeline Management**: Use the stage progression to track progress
3. **Smart Ranking**: System will auto-rank based on scores and activity
4. **Follow-up Actions**: Use the "Next:" field for guided next steps

## 🔧 Troubleshooting

### Common Issues

**CSV Parsing Errors**:

- Ensure CSV has proper headers
- Check for special characters in data
- Verify file encoding (UTF-8)

**Database Errors**:

- Ensure Person and Lead tables exist
- Check workspace and user IDs exist
- Verify database permissions

**Missing Data**:

- Review skipped records in console output
- Check `lead-data-processed.json` for data quality
- Verify required fields (name, email, company)

### Support

For issues or questions about the import process, check:

1. Console output for specific error messages
2. Generated JSON file for data verification
3. Database logs for SQL execution errors

---

**Generated by Adrata Lead Import System**  
_Optimized for enterprise CRM workflows_
