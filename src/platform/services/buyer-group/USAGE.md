# 🚀 How to Run the Buyer Group Intelligence Pipeline

## 🎯 Quick Start (Recommended)

### **1. Set Your API Key**
```bash
export CORESIGNAL_API_KEY="your-api-key-here"
```

### **2. Run Quick Analysis**
```bash
# Quick test with Dell Technologies (50 collects)
cd src/platform/services/buyer-group
node quick-run.js "Dell Technologies"

# Custom company with different collect limit
node quick-run.js "Microsoft" 100
```

### **3. Full Interactive CLI**
```bash
# Launch full-featured CLI with all options
cd src/platform/services/buyer-group
node run-pipeline.js
```

## 📋 CLI Options Explained

### **Interactive CLI Features:**
- ✅ **Single or batch company analysis**
- ✅ **Upload companies from file (.txt or .csv)**
- ✅ **Choose from 4 pre-built seller profiles**
- ✅ **Create custom seller profiles** 
- ✅ **Adjust analysis parameters**
- ✅ **Multiple output formats** (JSON, CSV, both)
- ✅ **Cost estimation** before running
- ✅ **Progress tracking** for batch runs

### **Quick Run Features:**
- ✅ **One-command execution**
- ✅ **Minimal configuration** 
- ✅ **Default settings** optimized for most use cases
- ✅ **Instant results** with summary display

## 🔧 Configuration Options

### **Seller Profiles Available:**
1. **`buyer-group-intelligence`** - General B2B sales (recommended for most cases)
2. **`revenue-technology`** - Sales enablement, CRM, revenue tools
3. **`security`** - Cybersecurity solutions
4. **`analytics`** - Business intelligence, data tools
5. **`custom`** - Create your own with specific targeting

### **Analysis Parameters:**
- **`maxCollects`** (50-500) - Number of profiles to analyze per company
- **`minInfluenceScore`** (5-15) - Quality threshold for prospects
- **`maxBuyerGroupSize`** (8-20) - Final buyer group size limit
- **`earlyStopMode`** - When to stop collecting ('accuracy_first' vs 'aggressive')

### **Output Formats:**
- **JSON** - Full detailed report with all metadata
- **CSV** - Spreadsheet format for easy filtering/sorting
- **Both** - Get both formats automatically

## 💰 Cost Management

### **Credit Usage:**
- **Search Credits:** ~5-20 per company (finding candidates)
- **Collect Credits:** ~50-300 per company (detailed profiles)
- **Total Cost:** Usually $5-30 per enterprise company

### **Cost Optimization Tips:**
1. **Start small:** Use 50 collects first, then increase if needed
2. **Higher influence scores:** Fewer but higher quality results
3. **Use caching:** Re-running same company uses cached results
4. **Batch processing:** More efficient for multiple companies

## 📊 Understanding Results

### **Buyer Group Roles:**
- **Decision Makers** (1-2) - Final approval authority, budget control
- **Champions** (2-3) - Internal advocates, drive the process
- **Stakeholders** (2-4) - Influence decision, provide input
- **Blockers** (0-2) - May oppose or delay purchase
- **Introducers** (2-3) - Provide access to decision makers

### **Quality Metrics:**
- **Cohesion Score** (0-100) - How organizationally aligned the group is
- **Distribution Score** (0-100) - How well balanced the roles are  
- **Confidence Score** (0-100) - Accuracy of role assignments
- **Flight Risk** (STABLE/ELEVATED/CRITICAL) - Likelihood of job changes

### **Success Indicators:**
- ✅ **Cohesion Score >70** - Well-aligned buyer group
- ✅ **Distribution Score >80** - Realistic role balance
- ✅ **8-12 total members** - Optimal buyer group size
- ✅ **At least 1 decision maker** - Can actually close deals
- ✅ **2+ champions** - Internal selling support

## 🎯 Real Usage Examples

### **Example 1: Testing a New Company**
```bash
# Quick test to see if we can find good prospects
node quick-run.js "Snowflake Inc" 25
```

### **Example 2: Full Analysis for Important Prospect**
```bash
# Use interactive CLI for comprehensive analysis
node run-pipeline.js
# Choose: Single company → "Salesforce" → revenue-technology profile → 150 collects
```

### **Example 3: Batch Processing for Territory Planning**
```bash
# Upload list of 50 target companies from CSV
node run-pipeline.js
# Choose: Upload from file → companies.csv → buyer-group-intelligence → 100 collects each
```

### **Example 4: Custom Solution Analysis**
```bash
# Create custom profile for specialized product
node run-pipeline.js
# Choose: Custom profile → specify your exact targeting criteria
```

## 🚨 Troubleshooting

### **Common Issues & Solutions:**

| Issue | Solution |
|-------|----------|
| "No profiles found" | Check company name spelling, try aliases like ["Microsoft", "Microsoft Corporation"] |
| "Low quality results" | Lower minInfluenceScore from 8 to 6, increase maxCollects |
| "API errors" | Verify CoreSignal API key, check credit balance |
| "Small buyer groups" | Increase maxBuyerGroupSize, try different seller profile |
| "High costs" | Use earlyStopMode: 'aggressive', reduce maxCollects to 50 |

### **Quality Warnings:**
- **No decision makers** → Try including C-level and VP search terms
- **No champions** → Look for department leads, project managers
- **Low cohesion score** → Focus on single subsidiary/division
- **High flight risk** → Prioritize immediate engagement

### **Performance Tips:**
- **Cache hits** save 90% of costs on repeat runs
- **Company aliases** improve data quality significantly  
- **Seller profile alignment** is critical for accurate role assignment
- **Higher influence scores** = better quality but fewer results

## 📁 Output Files

### **JSON Report Structure:**
```json
{
  "companyName": "Dell Technologies",
  "buyerGroup": {
    "totalMembers": 11,
    "roles": { "decision": [...], "champion": [...] },
    "cohesion": { "score": 87, "level": "Excellent" }
  },
  "painIntelligence": { "aggregatedChallenges": [...] },
  "engagementStrategy": { "primaryApproach": "..." },
  "metadata": { "creditsUsed": 156, "processingTime": 45000 }
}
```

### **CSV Export Columns:**
- Name, Title, Department, Role, Score, Confidence, Seniority, Influence

---

**💡 Pro Tip:** Start with `quick-run.js` to test the pipeline, then use the full CLI for production analysis. The pipeline is optimized for companies with 100+ employees and works best with enterprise organizations.
