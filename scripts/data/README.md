# Adrata Lead Data Import System

A comprehensive system for importing lead data into the Adrata CRM with smart qualification scoring, automatic ranking, and multi-environment support.

## 🚀 Quick Start

### For Development Environment

```bash
# From project root directory
./data-import/deploy.sh dev
```

### For Production Environment

```bash
# From project root directory
./data-import/deploy.sh prod
```

## 📋 Prerequisites

1. **Node.js** (v18 or later)
2. **PostgreSQL** access to target database
3. **Prisma CLI** installed globally or via npx
4. **Lead data CSV file** in `data-import/lead-data-full.csv`

## 🌍 Environment Configuration

The system supports two environments with pre-configured database connections:

### Development Environment

- **Database**: Local PostgreSQL (`localhost:5432/magic`)
- **User**: rosssylvester
- **Workspace ID**: `c854dff0-27db-4e79-a47b-787b0618a353`
- **User ID**: `672c8186-d014-4322-b9f7-b81ba7254aa2` (Dan)

### Production Environment

- **Database**: Neon PostgreSQL (cloud)
- **Connection**: Secure SSL connection
- **Workspace ID**: `c854dff0-27db-4e79-a47b-787b0618a353`
- **User ID**: `672c8186-d014-4322-b9f7-b81ba7254aa2` (Dan)

## 📊 Data Processing Features

### Smart Qualification Scoring (0-100)

- **Contact Information**: Email (+10), Phone (+5), LinkedIn (+5)
- **Role-based Scoring**: CRO/Chief (+25), VP (+20), Director (+15), Manager (+10)
- **Enterprise Company Bonus**: +15 for major SaaS companies
- **Engagement Bonus**: Demo booked (+20), Called (+10)
- **Geography Bonus**: +5 for US locations

### Lead Classification

- **Decision Maker**: C-level and VPs
- **Champion**: Directors and senior managers
- **Stakeholder**: Other sales professionals

### Stage Mapping

- **Generate**: Initial prospecting stage
- **Initiate**: First contact made
- **Educate**: Demo/deeper engagement

## 🗂️ Database Schema

The import creates records in two main tables:

### Person Table (Master Contact Record)

- Personal and professional details
- Social profiles and contact info
- Data quality and compliance flags
- Workspace isolation

### Lead Table (CRM Record)

- Sales-specific information
- Status and stage tracking
- Assignment and ownership
- Notes and qualification scores

## 🛠️ Manual Import Commands

If you prefer to run components individually:

### 1. Test Database Connection

```bash
# Development
DATABASE_URL="postgresql://rosssylvester:Themill08!@localhost:5432/magic" npx prisma db execute --stdin <<< "SELECT 1;"

# Production
DATABASE_URL="postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require" npx prisma db execute --stdin <<< "SELECT 1;"
```

### 2. Install Dependencies

```bash
cd data-import
npm install
cd ..
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Import Script

```bash
cd data-import
node import-lead-data.js dev    # For development
node import-lead-data.js prod   # For production
```

## 📈 Import Process

1. **Environment Validation**: Verifies database connection and workspace/user existence
2. **CSV Parsing**: Intelligent CSV parsing with quote handling
3. **Data Transformation**: Enriches data with qualification scores and buyer personas
4. **Batch Processing**: Processes leads in batches of 50 for optimal performance
5. **Transaction Safety**: Each lead import is wrapped in a database transaction
6. **Progress Tracking**: Real-time progress updates every 50 records
7. **Error Handling**: Comprehensive error reporting with detailed logs
8. **Final Report**: Complete summary with analytics and quality metrics

## 📊 Import Report Example

```
📊 IMPORT SUMMARY REPORT
==================================================
Environment: Production
Workspace ID: c854dff0-27db-4e79-a47b-787b0618a353
User ID: 672c8186-d014-4322-b9f7-b81ba7254aa2
Total Records Processed: 409
People Created/Updated: 409
Leads Created/Updated: 409
Errors: 0

🏢 TOP COMPANIES:
  • Atlassian: 6 leads
  • Adobe: 5 leads
  • Snowflake: 5 leads
  • Asana: 4 leads
  • BetterUp: 4 leads

🎯 LEAD QUALITY ANALYSIS:
  Average Qualification Score: 67.2/100
  High Quality Leads (70+): 178 (43.5%)
  Top Score: 95/100

✅ Import completed successfully!
```

## 🔍 Data Quality Features

### Deduplication

- Email-based deduplication within workspace
- Updates existing records instead of creating duplicates

### Data Enrichment

- Automatic name parsing (firstName/lastName)
- Location standardization (City, State, Country)
- Phone number consolidation (mobile/work/other)
- LinkedIn URL validation

### Compliance

- GDPR consent tracking
- Data source attribution
- Audit trail for all changes

## 🚨 Safety Features

### Development Safeguards

- Automatic database migrations
- Local environment isolation
- Non-destructive updates

### Production Safeguards

- Manual confirmation required
- Current record count display
- Backup recommendations
- Error rollback capabilities

## 🔧 Troubleshooting

### Connection Issues

```bash
# Test local database
psql -h localhost -U rosssylvester -d magic -c "SELECT 1;"

# Test production database (requires credentials)
psql "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require" -c "SELECT 1;"
```

### Common Issues

1. **Database Connection Failed**: Check network and credentials
2. **Workspace Not Found**: Verify workspace ID exists in target database
3. **User Not Found**: Verify user ID exists in target database
4. **CSV Parse Errors**: Check CSV format and encoding (UTF-8)
5. **Permission Errors**: Ensure user has read/write access to Lead and Person tables

### Log Analysis

Import logs provide detailed information about:

- Processing progress
- Individual record errors
- Database transaction status
- Qualification score calculations

## 🎯 Next Steps After Import

1. **Verify Import**: Check AOS at `/aos`
2. **Review Lead Rankings**: Top-qualified leads appear first
3. **Assign Leads**: Distribute leads to sales team
4. **Set Up Outbox**: Configure automated outreach sequences
5. **Monitor Metrics**: Track conversion rates by qualification score

## 📝 File Structure

```
data-import/
├── deploy.sh              # Main deployment script
├── import-lead-data.js     # Core import logic
├── package.json           # Dependencies
├── lead-data-full.csv     # Source data (409 leads)
└── README.md              # This documentation
```

## 🔐 Security Notes

- Database credentials are environment-specific
- Production access requires manual confirmation
- All imports are logged with user attribution
- Sensitive data is handled according to GDPR requirements

---

**Ready to import? Run `./data-import/deploy.sh [dev|prod]` from the project root!** 🚀
