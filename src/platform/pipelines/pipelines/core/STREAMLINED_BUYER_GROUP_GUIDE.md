# Streamlined Buyer Group Pipeline - Simple Guide

**Goal**: Simplicity and efficiency with the streamlined database schema

## 🎯 **Streamlined Approach**

Instead of separate buyer group tables, we simply add buyer group roles directly to the `people` table:

### **Database Schema**
```sql
-- Added to people table
buyerGroupRole    BuyerGroupRole?  -- decision, champion, stakeholder, blocker, introducer
buyerGroupConfidence Float?        -- 0-100 confidence score
influenceScore    Float?           -- 0-100 influence score
```

### **Benefits**
- ✅ **Simple**: No complex relationships or separate tables
- ✅ **Efficient**: Direct queries on people table
- ✅ **Flexible**: Easy to add/remove buyer group roles
- ✅ **Integrated**: Works seamlessly with existing people data

## 🚀 **How It Works**

### **1. Buyer Group Discovery**
- Pipeline discovers 8-12 buyer group members per company
- Assigns roles: decision, champion, stakeholder, blocker, introducer
- Enriches contact information (email, phone, LinkedIn)

### **2. Database Storage**
- **Existing People**: Updates their `buyerGroupRole` field
- **New People**: Creates new person records with buyer group roles
- **No Separate Tables**: Everything stored in the `people` table

### **3. Retrieval**
- Query people by `buyerGroupRole` to get buyer groups
- Group by company to see complete buyer groups
- Filter by workspace for multi-tenant support

## 📊 **Usage Examples**

### **Find All Decision Makers**
```sql
SELECT * FROM people 
WHERE buyerGroupRole = 'decision' 
AND workspaceId = 'your-workspace-id';
```

### **Get Complete Buyer Group for a Company**
```sql
SELECT * FROM people 
WHERE companyId = 'company-id' 
AND buyerGroupRole IS NOT NULL
ORDER BY buyerGroupConfidence DESC;
```

### **Count Buyer Group Members by Role**
```sql
SELECT buyerGroupRole, COUNT(*) 
FROM people 
WHERE buyerGroupRole IS NOT NULL 
GROUP BY buyerGroupRole;
```

## 🔧 **API Usage**

### **Single Company Processing**
```bash
curl -X POST /api/intelligence/buyer-group \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Salesforce", "website": "salesforce.com"}'
```

### **Retrieve Existing Buyer Group**
```bash
curl -X GET "/api/intelligence/buyer-group?company=Salesforce"
```

### **AI Chat**
```
"Find the buyer group for Salesforce"
```

## 📈 **Pipeline Execution**

### **CSV Processing**
```bash
cd src/platform/pipelines/pipelines/core
node buyer-group-pipeline.js ../../inputs/companies.csv
```

### **JSON Processing**
```bash
node buyer-group-pipeline.js ../../inputs/companies.json
```

### **Progress Monitoring**
```bash
node ../../scripts/check-buyer-group-progress.js
```

## 🎯 **Key Features**

### **Simple Database Model**
- No complex relationships
- Direct people table updates
- Easy to query and maintain

### **Multi-Format Input**
- CSV files (traditional)
- JSON files (structured)
- Single company API calls
- AI chat requests

### **Comprehensive Processing**
- 8-12 buyer group members per company
- Role assignment and validation
- Contact enrichment (email, phone, LinkedIn)
- Quality scoring and confidence metrics

### **Production Ready**
- Error handling and recovery
- Progress monitoring and checkpoints
- Database storage and retrieval
- API endpoints for all use cases

## 🔄 **Migration**

### **Database Migration**
```bash
# Run the migration to add buyer group fields
npx prisma migrate deploy
```

### **Schema Update**
The streamlined schema adds these fields to the `people` table:
- `buyerGroupRole` - The role in the buying committee
- `buyerGroupConfidence` - Confidence score (0-100)
- `influenceScore` - Influence score (0-100)

## 📋 **Best Practices**

### **Data Management**
- Always specify `workspaceId` for multi-tenant support
- Use confidence scores to prioritize outreach
- Regularly update buyer group roles as people change

### **Performance**
- Index on `buyerGroupRole` for fast queries
- Use `buyerGroupConfidence` for sorting
- Filter by workspace for tenant isolation

### **Integration**
- Use API endpoints for real-time processing
- Leverage AI chat for natural language requests
- Monitor progress with the progress checker script

## 🎉 **Benefits of Streamlined Approach**

1. **Simplicity**: No complex database relationships
2. **Performance**: Direct queries on people table
3. **Flexibility**: Easy to modify and extend
4. **Integration**: Works with existing people data
5. **Maintenance**: Simple to understand and maintain

---

**The streamlined buyer group pipeline provides all the functionality you need with maximum simplicity and efficiency!**
