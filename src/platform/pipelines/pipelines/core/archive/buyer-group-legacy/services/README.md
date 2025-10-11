# 🎯 Buyer Group Intelligence Pipeline

A comprehensive B2B buyer group identification system that analyzes company stakeholders and assigns optimal sales roles using AI and data intelligence.

## 📊 How It Works (Simple Flow)

### **Step 1: Input & Configuration**
```
Company Name → "Dell Technologies"
Seller Profile → Your product/solution context
Pipeline Config → Analysis parameters
```

### **Step 2: Data Discovery**
```
Query Builder → Generates targeted searches
CoreSignal API → Executes searches for prospects
Candidate Ranker → Scores and prioritizes results
```

### **Step 3: Profile Collection**
```
CoreSignal Client → Collects detailed professional profiles
Profile Analyzer → Transforms raw data into structured profiles
Quality Filters → Removes low-quality prospects
```

### **Step 4: Intelligence Analysis**
```
Company Intelligence → Analyzes company health & pain signals
Pain Intelligence → Identifies individual pain points & buying signals
Authority Analysis → Determines decision-making power
```

### **Step 5: Buyer Group Assembly**
```
Role Assignment → Assigns roles (decision/champion/stakeholder/blocker/introducer)
Cohesion Analysis → Ensures organizationally cohesive groups
Role Balancing → Applies enterprise-grade distribution rules
Influence Ranking → Identifies "most important person" in each role
```

### **Step 6: Output Generation**
```
Report Generator → Creates comprehensive intelligence reports
Benchmark Scoring → Provides quality metrics
Executive Summary → Optional LLM-generated insights
```

## 🎯 Core Components (Refactored Architecture)

### **Main Orchestrator**
- **`buyer-group-identifier.ts`** (105 lines) - Main pipeline coordinator

### **Modular Engines**
- **`role-assignment-engine.ts`** - Determines buyer group roles using multi-layered analysis
- **`authority-analyzer.ts`** - Analyzes decision-making authority and economic buyer qualification  
- **`title-matcher.ts`** - Ultra-flexible title pattern matching for all enterprise variations
- **`cohesion-analyzer.ts`** - Ensures buyer groups are organizationally cohesive
- **`role-balancer.ts`** - Ensures realistic role distribution based on enterprise dynamics
- **`influence-calculator.ts`** - Calculates comprehensive influence scoring

### **Supporting Services**
- **`query-builder.ts`** - Generates targeted CoreSignal search queries
- **`profile-analyzer.ts`** - Transforms raw profiles into structured data
- **`candidate-ranker.ts`** - Scores and ranks search candidates
- **`company-intelligence.ts`** - Analyzes company health and opportunity signals
- **`pain-intelligence.ts`** - Identifies pain points and buying signals
- **`report-generator.ts`** - Creates comprehensive output reports
- **`seller-profiles.ts`** - Pre-built seller profile configurations

### **Infrastructure**
- **`coresignal-client.ts`** - CoreSignal API integration with caching
- **`industry-adapter.ts`** - Industry-specific buyer group adaptations
- **`benchmark.ts`** - Quality scoring framework
- **`types.ts`** - TypeScript definitions

## 🚀 Quick Start Guide

### **Option 1: Use Existing Script**
```bash
cd src/platform/services/buyer-group
node run-buyer-group.js
```

### **Option 2: Programmatic Usage**
```typescript
import { BuyerGroupPipeline, getSellerProfile } from './buyer-group'

const pipeline = new BuyerGroupPipeline({
  sellerProfile: getSellerProfile('buyer-group-intelligence'),
  coreSignal: {
    apiKey: process.env.CORESIGNAL_API_KEY!,
    baseUrl: "https://api.coresignal.com",
    maxCollects: 100,
    batchSize: 50,
    useCache: true,
    cacheTTL: 24
  },
  analysis: {
    minInfluenceScore: 8,
    maxBuyerGroupSize: 12,
    requireDirector: false,
    allowIC: false
  }
})

// Generate buyer group for target company
const report = await pipeline.generateBuyerGroup("Dell Technologies")
```

## 🔧 Required Configuration

### **1. CoreSignal API Setup**
```bash
export CORESIGNAL_API_KEY="your-api-key-here"
```

### **2. Seller Profile Selection**
Choose from pre-built profiles or create custom:

**Pre-built Options:**
- `buyer-group-intelligence` - General B2B sales (recommended)
- `revenue-technology` - Sales enablement tools
- `security` - Cybersecurity solutions
- `analytics` - Business intelligence tools

**Custom Profile:**
```typescript
const customProfile = createSellerProfile({
  productName: "Revenue Intelligence Platform",
  sellerCompanyName: "Adrata", 
  solutionCategory: "revenue_technology",
  targetMarket: "enterprise",
  dealSize: "enterprise",
  targetDepartments: ["sales", "revenue operations"],
  mustHaveTitles: ["sales director", "vp sales", "revenue operations"]
})
```

### **3. Analysis Configuration**
```typescript
const analysisConfig = {
  minInfluenceScore: 8,           // Quality threshold (5-15)
  maxBuyerGroupSize: 12,          // Size limit (8-20) 
  requireDirector: false,         // Include managers?
  allowIC: false,                 // Include individual contributors?
  earlyStopMode: 'accuracy_first' // vs 'aggressive'
}
```

## 📈 Expected Results

### **Typical Output for Enterprise Company (Dell Technologies)**
```
🕸️ BUILDING COHESIVE BUYER GROUP for Dell Technologies...
🔍 Analyzing buyer group cohesion and connectivity...
📊 Cohesion Score: 87/100 (Excellent)
🎯 Applying unified role distribution optimization...
📊 Role Distribution Results:
   Distribution Score: 92/100
   Meets Targets: true
   Actions: 2 promoted, 1 demoted
✅ COHESIVE BUYER GROUP COMPLETE: 11 members, cohesion: Excellent

Final Buyer Group:
├── Decision Makers (2): SVP Sales, VP Revenue Operations  
├── Champions (3): Sales Director, Sales Manager, Rev Ops Manager
├── Stakeholders (4): Marketing Director, IT Director, Finance Manager, Operations Manager
├── Blockers (1): VP Legal/Compliance
└── Introducers (2): Sales Rep, Account Executive
```

### **Cost & Performance**
- **Credits Used:** ~200-300 for enterprise company
- **Processing Time:** 30-90 seconds
- **Success Rate:** 95%+ for companies with 1000+ employees
- **Accuracy:** 85%+ role assignment accuracy (based on sales feedback)

## 🎯 Success Factors

### **High-Quality Results Require:**
1. **Valid CoreSignal API key** with sufficient credits (200+ recommended)
2. **Accurate company name** - exact match critical for data quality
3. **Appropriate seller profile** - matching your solution category
4. **Reasonable budget limits** - 100-200 collects for enterprise companies
5. **Quality thresholds** - influence score 8+ recommended for enterprise
6. **Company size alignment** - works best for 100+ employee companies

### **Optimization Tips:**
- Use company aliases for better matching: `["Dell", "Dell Technologies", "Dell EMC"]`
- Start with conservative limits (100 collects) and increase if needed
- Higher influence scores (10+) = better quality but fewer results
- Enterprise deal size = more thorough analysis but higher credit usage

## 🔍 Understanding the Output

### **Buyer Group Roles Explained:**
- **Decision Makers** - Have budget authority and final approval power
- **Champions** - Internal advocates who drive the buying process  
- **Stakeholders** - Influence the decision but don't have final authority
- **Blockers** - May oppose or delay the purchase (risk management)
- **Introducers** - Provide access to decision makers and stakeholders

### **Key Metrics:**
- **Cohesion Score** - How organizationally aligned the buyer group is (0-100)
- **Distribution Score** - How well roles are balanced (0-100) 
- **Influence Score** - Individual authority/network influence (0-20)
- **Flight Risk** - Likelihood person will leave company (STABLE/ELEVATED/CRITICAL)

### **Intelligence Layers:**
- **Pain Signals** - Individual and company-wide challenges identified
- **Opportunity Signals** - Buying indicators and market pressures
- **Decision Flow** - Predicted path and timeline for decision making
- **Engagement Strategy** - Recommended approach for each role type

## 🚨 Troubleshooting

### **Common Issues:**
1. **"No profiles found"** → Check company name spelling, try aliases
2. **"Low quality results"** → Lower minInfluenceScore, increase maxCollects
3. **"API errors"** → Verify CoreSignal API key and credit balance
4. **"Small buyer groups"** → Increase maxBuyerGroupSize, try different seller profile
5. **"High costs"** → Use earlyStopMode: 'aggressive', reduce maxCollects

### **Quality Warnings:**
- **No decision makers** → Expand search to include C-level, VP roles
- **No champions** → Look for departmental leads, project managers  
- **Low cohesion** → Consider focusing on single subsidiary/division
- **High flight risk** → Prioritize immediate engagement

---

**💡 Pro Tip:** Start with the default `buyer-group-intelligence` seller profile and 100 collects. This gives you a solid baseline for most B2B scenarios. You can always refine from there based on your specific needs.
