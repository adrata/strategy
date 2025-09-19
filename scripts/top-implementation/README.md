# TOP Implementation Scripts
## 24-Hour Buyer Group Enrichment Implementation

**Client:** TOP Engineering Plus  
**Objective:** Complete buyer group enrichment with duplicate cleanup and archival  

---

## 🚀 **Quick Start Guide**

### **Step 1: Apply Database Schema Enhancements**
```bash
# Apply schema changes
psql $DATABASE_URL -f scripts/top-implementation/enhance-top-schema.sql

# Or using Prisma
npx prisma db push
```

### **Step 2: Test with Sample Data (RECOMMENDED)**
```bash
# Test with 3-5 companies first
node scripts/top-implementation/test-top-sample.js
```

### **Step 3: Run Full Enrichment (After successful testing)**
```bash
# Full 24-hour enrichment
node scripts/top-implementation/top-24h-enrichment.js
```

### **Step 4: Cleanup Duplicates (After enrichment)**
```bash
# Smart duplicate cleanup with archival
node scripts/top-implementation/cleanup-duplicates.js
```

---

## 📁 **File Overview**

| File | Purpose | When to Use |
|------|---------|-------------|
| `enhance-top-schema.sql` | Database schema enhancements | **FIRST** - Apply before any processing |
| `test-top-sample.js` | Sample testing with 3-5 companies | **SECOND** - Validate approach |
| `top-24h-enrichment.js` | Full production enrichment | **THIRD** - After successful testing |
| `cleanup-duplicates.js` | Smart duplicate cleanup | **FOURTH** - After enrichment complete |
| `validate-results.js` | Final validation and reporting | **FIFTH** - Verify final results |

---

## ⚡ **Performance Configuration**

### **Ultra-Parallel Settings**
```javascript
const ULTRA_CONFIG = {
  maxConcurrency: 15,        // 15 parallel operations
  batchSize: 20,             // 20 companies per batch
  apiTimeout: 10000,         // 10 second timeout
  retryAttempts: 2,          // 2 retry attempts
  delayBetweenBatches: 1000, // 1 second between batches
  
  // Provider-specific rate limits
  coreSignalLimit: 8,        // 8 parallel CoreSignal calls
  hunterLimit: 10,           // 10 parallel Hunter.io calls
  prospeoLimit: 6,           // 6 parallel Prospeo calls
  perplexityLimit: 5         // 5 parallel Perplexity calls
};
```

### **Expected Performance**
- **Companies per Hour**: 20-30
- **Total in 24 Hours**: 400-600 companies
- **Processing Time**: <3 minutes per company
- **Cost per Company**: <$2.00
- **Success Rate**: 85%+

---

## 🔍 **Testing Strategy**

### **Sample Test Validation**
The sample test validates:
- ✅ Buyer group generation works
- ✅ New people are added correctly
- ✅ Existing people are enriched
- ✅ Contact validation is working
- ✅ Performance is within targets
- ✅ Costs are reasonable

### **Success Criteria for Testing**
- **80%+ companies** process successfully
- **70%+ average confidence** in buyer groups
- **<3 minutes** processing time per company
- **<$2.00 cost** per company
- **5+ members** per buyer group

### **If Tests Fail**
1. Check API keys and rate limits
2. Verify TOP workspace ID
3. Review error messages for patterns
4. Adjust concurrency settings if needed
5. Test individual API calls manually

---

## 📊 **Monitoring & Validation**

### **Real-Time Monitoring**
```bash
# Monitor database changes
watch "psql $DATABASE_URL -c \"SELECT COUNT(*) as companies_with_buyer_groups FROM companies WHERE buyerGroupsGenerated = true;\""

# Monitor people enrichment
watch "psql $DATABASE_URL -c \"SELECT COUNT(*) as people_with_roles FROM people WHERE buyerGroupRole IS NOT NULL;\""

# Monitor processing logs
tail -f logs/top-enrichment-$(date +%Y-%m-%d).log
```

### **Validation Queries**
```sql
-- Check buyer group completeness
SELECT 
  c.name,
  bg.confidence,
  bg.completeness,
  COUNT(bgp.personId) as members
FROM companies c
JOIN buyer_groups bg ON c.id = bg.companyId  
LEFT JOIN BuyerGroupToPerson bgp ON bg.id = bgp.buyerGroupId
WHERE c.workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'
GROUP BY c.id, c.name, bg.confidence, bg.completeness
ORDER BY bg.confidence DESC;

-- Check role distribution
SELECT 
  bgp.role,
  COUNT(*) as count
FROM BuyerGroupToPerson bgp
JOIN buyer_groups bg ON bgp.buyerGroupId = bg.id
JOIN companies c ON bg.companyId = c.id
WHERE c.workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'
GROUP BY bgp.role
ORDER BY count DESC;

-- Check data quality
SELECT 
  COUNT(*) as total_people,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
  COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,
  COUNT(CASE WHEN buyerGroupRole IS NOT NULL THEN 1 END) as with_buyer_group_role,
  ROUND(AVG(buyerGroupConfidence), 2) as avg_confidence
FROM people 
WHERE workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP' 
  AND deletedAt IS NULL;
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **"No companies found for processing"**
```sql
-- Check TOP workspace data
SELECT COUNT(*) FROM companies WHERE workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
```

#### **"API key errors"**
```bash
# Verify environment variables
echo "CoreSignal: ${CORESIGNAL_API_KEY:0:10}..."
echo "Hunter: ${HUNTER_API_KEY:0:10}..."
echo "Prospeo: ${PROSPEO_API_KEY:0:10}..."
echo "Perplexity: ${PERPLEXITY_API_KEY:0:10}..."
```

#### **"Rate limit exceeded"**
- Reduce `maxConcurrency` from 15 to 10
- Increase `delayBetweenBatches` from 1000 to 2000
- Reduce `batchSize` from 20 to 15

#### **"Low buyer group quality"**
- Check company names are accurate
- Verify websites are correct
- Review seller profile configuration
- Lower `minInfluenceScore` threshold

### **Recovery Commands**
```bash
# If something goes wrong, restore from archive
psql $DATABASE_URL -c "TRUNCATE people CASCADE;"
psql $DATABASE_URL -c "COPY people FROM '/path/to/archive/people_snapshot.json';"
```

---

## 📈 **Success Metrics**

### **Target Metrics**
- **Email Accuracy**: 90%+ (Perplexity-verified)
- **Phone Accuracy**: 85%+ (Multi-provider)
- **Buyer Group Completeness**: 80%+ with 8+ members
- **Role Confidence**: 80%+ average
- **Processing Speed**: 20-30 companies/hour
- **Cost Efficiency**: <$2 per company

### **Final Deliverables**
- [ ] Complete buyer groups for all TOP companies
- [ ] Enhanced people records with buyer group roles
- [ ] Accurate contact information (email/phone)
- [ ] Clean database with zero duplicates
- [ ] Complete historical archives
- [ ] Comprehensive final report

---

**🎯 Ready to execute! Start with the sample test, then proceed to full enrichment once validated.**
