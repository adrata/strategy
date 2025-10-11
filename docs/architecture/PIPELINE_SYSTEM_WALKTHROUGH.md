# 🚀 Multi-Source Pipeline Verification System - Complete Walkthrough

## 📁 **System Architecture Overview**

The multi-source pipeline verification system is a comprehensive executive contact discovery and verification platform that processes companies to find CFO and CRO contacts with high confidence through multiple data sources.

## 🗂️ **File Structure & Locations**

```
src/platform/pipelines/
├── 📁 pipelines/core/                    # Main pipeline execution
│   ├── core-pipeline.js                 # 🎯 MAIN PIPELINE (Entry Point)
│   ├── test-multisource-pipeline.js     # 🧪 Test script for 3 companies
│   ├── EXECUTION_GUIDE.md              # 📖 How to run the pipeline
│   └── ROLE_SELECTION_LOGIC.md         # 🎯 CFO/CRO identification logic
│
├── 📁 modules/core/                     # Core verification modules
│   ├── CoreSignalMultiSource.js        # 🔍 Credit-efficient employee discovery
│   ├── MultiSourceVerifier.js          # ✅ Multi-source verification orchestration
│   ├── ApiCreditMonitor.js             # 💰 API usage tracking & credit limits
│   ├── ApiUsageLogger.js               # 📊 Structured logging & database records
│   ├── CompanyResolver.js              # 🏢 Company identity resolution
│   ├── ExecutiveResearch.js            # 👔 Executive discovery & research
│   ├── ExecutiveContactIntelligence.js # 📧 Contact enrichment & validation
│   ├── ContactValidator.js             # ✅ Contact validation engine
│   ├── ValidationEngine.js             # 🔍 Data quality assessment
│   ├── DataCache.js                    # 💾 Caching system for API efficiency
│   └── [Other supporting modules...]
│
├── 📁 scripts/                         # Utility scripts
│   ├── split-csv-by-role.js           # 📊 CSV splitter (Finance vs Revenue/Sales)
│   ├── api-usage-report.js            # 📈 API usage reporting
│   ├── version-manager.js             # 🔄 Version management
│   └── outputs/vX/                    # 📁 Versioned output directories
│
├── 📁 inputs/                          # Input data
│   └── example-companies.csv          # 📋 Sample company data
│
├── 📁 logs/                           # System logs
│   ├── api-usage.json                # 📊 Real-time API usage
│   ├── credit-alerts.json            # 🚨 Credit limit alerts
│   └── api-usage-db.json             # 🗄️ Structured database records
│
└── 📁 docs/                           # Documentation
    └── API_MONITORING_GUIDE.md       # 📖 API monitoring documentation
```

## 🔄 **How The System Works - Step by Step**

### **1. 🚀 Pipeline Initialization**
**File:** `pipelines/core/core-pipeline.js`

```javascript
// Entry Point: CorePipeline class
const pipeline = new CorePipeline();
await pipeline.runPipeline(inputFile);
```

**What happens:**
- Loads environment variables from `.env` file
- Initializes all verification modules with API keys
- Sets up API credit monitoring and logging
- Configures parallel processing (5 companies at once)

### **2. 📊 API Credit Monitoring (NEW)**
**Files:** `modules/core/ApiCreditMonitor.js`, `modules/core/ApiUsageLogger.js`

```javascript
// STEP 0: Check API credits and initialize monitoring
await this.initializeApiMonitoring();
```

**What happens:**
- Checks current API usage across all services
- Validates credit limits (CoreSignal: $1000, Lusha: $500, etc.)
- Logs usage to structured JSON database
- Stops pipeline if critical limits reached
- Displays real-time cost tracking

### **3. 📋 Company Loading**
**File:** `pipelines/core/core-pipeline.js` → `loadCompanies()`

```javascript
// STEP 1: Load companies from CSV
const companies = await this.loadCompanies();
```

**What happens:**
- Reads CSV file with company websites
- Parses company data (Website, Company Name)
- Validates input format
- Returns array of company objects

### **4. 🏢 Company Resolution (Parallel Processing)**
**File:** `modules/core/CompanyResolver.js`

```javascript
// Process 5 companies in parallel
const batch = companies.slice(0, 5);
const results = await Promise.all(batch.map(company => this.processCompany(company)));
```

**What happens:**
- **URL Resolution:** Canonicalizes website URLs
- **Acquisition Detection:** Identifies if company was acquired
- **Company Name Resolution:** Determines official company name
- **Status Determination:** Public/Private, employee count, industry
- **Parent Company Mapping:** Links to parent companies if acquired

### **5. 🔍 Multi-Source Executive Discovery**
**Files:** `modules/core/CoreSignalMultiSource.js`, `modules/core/ExecutiveResearch.js`

```javascript
// STEP 3: Multi-Source Executive Discovery
const executives = await this.coresignalMultiSource.discoverExecutives(companyName, ['CFO', 'CRO']);
```

**What happens:**
- **CoreSignal Preview API:** Gets 100 employee preview (costs 1 credit vs 51 for full)
- **Role Filtering:** Identifies CFO and CRO from employee list
- **Confidence Scoring:** Rates each executive match (0-100%)
- **Fallback Research:** Uses other sources if CoreSignal fails
- **Credit Optimization:** Only gets full profiles for high-confidence matches

### **6. 📧 Contact Intelligence & Enrichment**
**File:** `modules/core/ExecutiveContactIntelligence.js`

```javascript
// STEP 4: Contact Intelligence
const contactData = await this.executiveContactIntelligence.enhanceContacts(executives, company);
```

**What happens:**
- **Email Discovery:** Finds email addresses through multiple methods
- **Phone Discovery:** Locates phone numbers via Lusha, People Data Labs
- **LinkedIn Mapping:** Links to LinkedIn profiles
- **Alternative Contacts:** Finds backup email addresses
- **Contact Validation:** Validates email/phone format and deliverability

### **7. ✅ Multi-Source Verification (NEW)**
**File:** `modules/core/MultiSourceVerifier.js`

```javascript
// STEP 6: Multi-Source Verification
const verification = await this.multiSourceVerifier.verifyContacts(contactData);
```

**What happens:**
- **Person Identity Verification (2-3x sources):**
  - CoreSignal employment data
  - Lusha person lookup
  - Perplexity AI real-time verification
- **Email Multi-Layer Verification (2-3x layers):**
  - Syntax validation
  - Domain validation
  - SMTP verification
  - Prospeo additional validation
- **Phone Verification (2x sources):**
  - Lusha phone lookup
  - People Data Labs verification
- **Confidence Consolidation:** Combines all sources into overall confidence score

### **8. 📊 Data Validation & Quality Assessment**
**Files:** `modules/core/ContactValidator.js`, `modules/core/ValidationEngine.js`

```javascript
// STEP 7: Data Validation
const validation = await this.validationEngine.validateContacts(verifiedContacts);
```

**What happens:**
- **Contact Validation:** Verifies email/phone deliverability
- **Data Quality Assessment:** Rates overall data quality (A/B/C/D/F)
- **Risk Assessment:** Identifies potential data issues
- **Confidence Scoring:** Final confidence scores for each contact
- **Quality Recommendations:** Suggests improvements

### **9. 📈 CSV Generation & Output**
**File:** `pipelines/core/core-pipeline.js` → `generateContactCSV()`

```javascript
// STEP 4: Generate Core Contact CSV
await this.generateContactCSV(version);
```

**What happens:**
- **Main CSV:** Creates `core-cro-cfo-contacts.csv` with all data
- **JSON Backup:** Creates `core-cro-cfo-data.json` with detailed records
- **Version Management:** Saves to versioned directory (v1, v2, v3...)
- **Column Structure:** 50+ columns with detailed verification data

### **10. 📊 CSV Splitting by Role (NEW)**
**File:** `scripts/split-csv-by-role.js`

```javascript
// STEP 4.5: Split CSV by Role
await this.splitCsvByRole(version);
```

**What happens:**
- **Finance Contacts:** Creates `finance-contacts-[date].csv` (CFO only)
- **Revenue/Sales Contacts:** Creates `revenue-sales-contacts-[date].csv` (CRO only)
- **Summary Report:** Creates `contacts-summary-[date].json` with statistics
- **Role Filtering:** Separates contacts by executive role

### **11. 📊 Final Reporting & Logging**
**Files:** `modules/core/ApiUsageLogger.js`, `scripts/api-usage-report.js`

```javascript
// STEP 5: Pipeline Summary & Logging
await this.logPipelineCompletion(pipelineResults);
```

**What happens:**
- **API Usage Logging:** Records all API calls and costs
- **Daily Summary:** Creates daily usage reports
- **Credit Alerts:** Logs any credit limit warnings
- **Performance Metrics:** Tracks processing speed and success rates
- **Cost Analysis:** Detailed breakdown of API costs per company

## 🎯 **Key Features & Innovations**

### **1. 💰 Credit-Efficient Discovery**
- **CoreSignal Preview API:** 94% credit savings (3 credits vs 51 per company)
- **Smart Batching:** 5 companies processed in parallel
- **Selective Full Profiles:** Only gets full profiles for high-confidence matches

### **2. 🔍 Multi-Source Verification**
- **Person Verification:** 2-3 sources (CoreSignal + Lusha + Perplexity)
- **Email Verification:** 2-3 layers (Syntax + Domain + SMTP + Prospeo)
- **Phone Verification:** 2 sources (Lusha + People Data Labs)

### **3. 📊 Real-Time Monitoring**
- **API Credit Tracking:** Real-time cost monitoring
- **Automatic Stopping:** Pipeline stops at credit limits
- **Structured Logging:** JSON database records for all activities
- **Performance Metrics:** Speed, success rates, cost analysis

### **4. 🎯 Role-Based Output**
- **Finance Contacts:** CFO-focused CSV file
- **Revenue/Sales Contacts:** CRO-focused CSV file
- **Detailed Confidence:** Multi-source confidence scoring
- **Quality Grades:** A/B/C/D/F quality assessment

## 🚀 **How to Run the System**

### **Quick Test (5 minutes):**
```bash
cd src/platform/pipelines/pipelines/core
node test-multisource-pipeline.js
```

### **Full Pipeline (30-40 minutes):**
```bash
node core-pipeline.js ../../inputs/1000-companies.csv
```

### **API Usage Report:**
```bash
cd src/platform/pipelines/scripts
node api-usage-report.js
```

## 📊 **Output Files Generated**

### **Main Outputs:**
- `core-cro-cfo-contacts.csv` - Complete contact data (50+ columns)
- `core-cro-cfo-data.json` - Detailed JSON records
- `finance-contacts-[date].csv` - CFO contacts only
- `revenue-sales-contacts-[date].csv` - CRO contacts only
- `contacts-summary-[date].json` - Statistics and metrics

### **Logging & Monitoring:**
- `api-usage.json` - Real-time API usage
- `credit-alerts.json` - Credit limit alerts
- `api-usage-db.json` - Structured database records
- `api-usage-export.json` - Exportable usage data

## 🔧 **Configuration & Environment**

### **Required API Keys (.env file):**
```bash
CORESIGNAL_API_KEY=your_key_here
LUSHA_API_KEY=your_key_here
ZEROBOUNCE_API_KEY=your_key_here
PERPLEXITY_API_KEY=your_key_here
PEOPLE_DATA_LABS_API_KEY=your_key_here
```

### **Credit Limits (Configurable):**
- CoreSignal: $1000/month
- Lusha: $500/month
- ZeroBounce: $200/month
- Perplexity: $100/month
- People Data Labs: $300/month

## 🎯 **Success Metrics**

### **Target Performance:**
- **Processing Speed:** 20-25 companies per minute
- **Success Rate:** 80%+ CFO/CRO discovery
- **Data Quality:** 90%+ A/B grade contacts
- **Cost Efficiency:** <$0.50 per company processed
- **API Optimization:** 94% credit savings vs traditional methods

This system represents a state-of-the-art approach to executive contact discovery with comprehensive verification, real-time monitoring, and cost optimization.
