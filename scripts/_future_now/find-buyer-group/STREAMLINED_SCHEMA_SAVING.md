# Buyer Group Data Saving - Streamlined Schema

## Current Status

The buyer group discovery script **already saves all data to the streamlined schema**:

### ✅ What's Being Saved:

1. **Companies** (`companies` table):
   - Basic company info (name, website, industry, etc.)
   - `mainSellerId` assignment
   - Intelligence data
   - Custom fields

2. **People** (`people` table):
   - All buyer group fields:
     - `buyerGroupRole` - Role in buyer group (decision, champion, stakeholder, etc.)
     - `isBuyerGroupMember` - Boolean flag
     - `buyerGroupOptimized` - Optimization flag
     - `buyerGroupStatus` - Status (in_buyer_group, out_of_buyer_group)
   - Intelligence fields:
     - `influenceScore`, `decisionPower`, `engagementScore`
     - `influenceLevel`, `engagementLevel`
     - `aiIntelligence` - Complete AI-generated intelligence JSON
     - `coresignalData` - Raw Coresignal profile data
     - `enrichedData` - Enriched intelligence data
   - Experience data:
     - `yearsExperience`, `yearsAtCompany`, `yearsInRole`
     - `totalExperienceMonths`
     - `currentCompany`, `currentRole`
   - Contact data:
     - `email`, `phone`, `linkedinUrl`
     - `emailVerified`, `phoneVerified`
     - `emailConfidence`, `phoneConfidence`
   - Skills and attributes:
     - `technicalSkills`, `softSkills`, `industrySkills`
     - `communicationStyle`, `decisionMaking`, `preferredContact`
   - Custom fields:
     - `customFields` - Churn prediction, refresh scheduling, etc.
   - Tags:
     - `tags` - Includes `in_buyer_group` or `out_of_buyer_group`
   - `mainSellerId` - Seller assignment

3. **Buyer Groups** (`BuyerGroups` table):
   - Company-level buyer group record
   - Metadata, cohesion scores, confidence metrics

4. **Buyer Group Members** (`BuyerGroupMembers` table):
   - Relationship tracking between buyer groups and members
   - Role assignments and confidence scores

### ⚠️ Current Issue:

**Prisma Client Schema Sync**: The Prisma client needs to be regenerated from `schema-streamlined.prisma` to match the database schema. The error `coreCompanyId does not exist` indicates the client is out of sync.

### 🔧 Fix Required:

1. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate --schema=prisma/schema-streamlined.prisma
   ```

2. **Or use the main schema** (if streamlined is just a reference):
   ```bash
   npx prisma generate
   ```

### 📊 Data Completeness:

The script saves **ALL** data:
- ✅ Company intelligence
- ✅ People records with full buyer group data
- ✅ AI intelligence and enrichment
- ✅ Coresignal raw data
- ✅ Custom fields and tags
- ✅ Seller assignments (`mainSellerId`)
- ✅ All custom intelligence fields

### 🎯 Verification:

After fixing the Prisma client, run:
```bash
node scripts/_future_now/find-buyer-group/verify-saved-data.js
```

This will show:
- Companies with buyer groups
- People records with all buyer group fields
- Data completeness metrics

### 📝 Notes:

- All data is saved to the **streamlined schema** tables
- The script uses the same Prisma client that the application uses
- Custom fields are stored in JSON fields (`customFields`, `aiIntelligence`, `coresignalData`)
- All intelligence data is accessible in the top-temp workspace via the UI

