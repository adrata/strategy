# Company, Person & Role Enrichment Scripts

This folder contains scripts for enriching company, person, and role data using the Coresignal API with AI-powered intelligent matching.

## Files

### `find_company.js`
Main company enrichment script that processes companies in the Notary Everyday workspace.

**Features:**
- Multiple search strategies (website.exact, website, website.domain_only)
- Progress saving and resumability
- Confidence-based matching (90%+ threshold)
- Real-time progress tracking
- Batch processing with rate limiting

**Usage:**
```bash
node find_company.js
```

### `find_person.js`
Main person enrichment script that processes people in the Notary Everyday workspace.

**Features:**
- Direct email matching
- LinkedIn URL matching
- Company-based person search
- Progress saving and resumability
- Confidence-based matching (90%+ threshold)
- Real-time progress tracking
- Batch processing with rate limiting

**Usage:**
```bash
node find_person.js
```

### `find_role.js` 🆕
AI-powered role enrichment script that finds specific roles within companies using Claude AI.

**Features:**
- Claude AI-powered role variation generation
- Multi-layered hierarchical search fallback (primary → secondary → tertiary)
- Confidence-based matching system
- Progress tracking and resumability
- Real-time progress updates
- Modern ES2024+ JavaScript best practices

**Usage:**
```bash
# Find CFO at a specific company
node find_role.js "CFO" "01K7DNYR5VZ7JY36KGKKN76XZ1" 3

# Find CTO with default settings
node find_role.js "CTO"
```

**Configuration Options:**
- `targetRole` (required): The role to search for (e.g., "CFO", "CTO", "CMO")
- `companyId` (optional): Specific company ID to search within
- `maxResults` (optional): Maximum number of results to return (default: 1)
- `useAI` (optional): Enable/disable Claude AI (default: true)

### `find_optimal_buyer_group.js` 🆕 (Phase 1)
AI-powered buyer qualification script that identifies the best companies to target using two-phase analysis.

**Features:**
- **Phase 1**: Market filtering with firmographic + growth signals
- **Phase 2**: Real buyer group quality analysis using Preview API data
- AI-powered pain signal detection and innovation scoring
- Adoption Maturity Profile detection (Trailblazer → Traditionalist)
- Data-driven ranking based on actual employee data
- Progress tracking and resumability
- Modern ES2024+ JavaScript best practices

**Usage:**
```bash
# Find optimal buyer groups in SaaS industry (with Phase 2 analysis)
node find_optimal_buyer_group.js --industries "Software,SaaS" --size "50-200 employees" --location "United States" --minGrowth 15

# Find optimal buyers with custom sampling
node find_optimal_buyer_group.js --industries "FinTech" --employeeSampleSize 30 --sampleDepartments "Sales,Marketing,Operations"

# Disable Phase 2 sampling (traditional approach only)
node find_optimal_buyer_group.js --industries "Healthcare" --disable-buyer-group-sampling
```

**Configuration Options:**
- `industries` (required): Industries to target (e.g., "Software,SaaS")
- `sizeRange` (optional): Company size range (e.g., "50-200 employees")
- `locations` (optional): Target locations (e.g., "United States")
- `minGrowthRate` (optional): Minimum growth rate % (default: 10)
- `maxResults` (optional): Maximum results to return (default: 50)
- `minReadinessScore` (optional): Minimum buyer readiness score (default: 70)
- `enableBuyerGroupSampling` (optional): Enable Phase 2 analysis (default: true)
- `employeeSampleSize` (optional): Employees to sample per company (default: 25)
- `sampleDepartments` (optional): Departments to focus on (default: ["Sales", "Operations", "Product", "Marketing"])

### `find_buyer_group.js` 🆕 (Phase 2)
Deep buyer group mapping script that maps complete buying committees within target companies.

**Features:**
- Comprehensive employee discovery using Preview API
- AI-powered organizational hierarchy analysis
- Buyer group role classification (5 core roles: Champion, Decision Maker, Stakeholder, Blocker, Introducer)
- Selective full profile collection for buyer group members
- Progress tracking and resumability
- Modern ES2024+ JavaScript best practices

**Usage:**
```bash
# Find buyer group for specific company (by database ID)
node find_buyer_group.js --company-id "01K7DNYR5VZ7JY36KGKKN76XZ1"

# Find buyer group by LinkedIn URL
node find_buyer_group.js --linkedin-url "https://www.linkedin.com/company/acme"

# Custom department targeting
node find_buyer_group.js --company-id "01K7DNYR5VZ7JY36KGKKN76XZ1" --departments "Sales,Marketing,Engineering"

# Disable AI analysis (use rule-based)
node find_buyer_group.js --company-id "01K7DNYR5VZ7JY36KGKKN76XZ1" --disable-ai
```

**Configuration Options:**
- `targetCompanyId` (optional): Target company ID from database
- `targetCompanyLinkedInUrl` (optional): Target company LinkedIn URL
- `targetDepartments` (optional): Departments to search (default: all relevant departments)
- `maxPreviewPages` (optional): Maximum preview pages to search (default: 20)
- `useAI` (optional): Enable/disable AI analysis (default: true)

### Progress Files
- `enrichment-progress.json` - Company enrichment progress tracking
- `person-enrichment-progress.json` - Person enrichment progress tracking
- `role-enrichment-progress.json` - Role enrichment progress tracking
- `optimal-buyer-group-progress.json` - Optimal buyer group progress tracking (Phase 1)
- `buyer-group-progress.json` - Buyer group discovery progress tracking (Phase 2)

All files automatically save the current state of the enrichment process and allow scripts to resume from where they left off if interrupted.

## Environment Variables Required

- `CORESIGNAL_API_KEY`: Your Coresignal API key
- `ANTHROPIC_API_KEY`: Your Claude AI API key (for role enrichment and optimal buyer scoring)

## How Company Enrichment Works

1. **Search Strategy**: The script tries multiple search approaches in order:
   - `website.exact` - Most precise domain matching
   - `website` - Broader website matching
   - `website.domain_only` - Domain-only matching

2. **Confidence Matching**: Only companies with 90%+ confidence matches are enriched

3. **Progress Saving**: Progress is saved every 5 companies to prevent data loss

4. **Resumability**: If the script is interrupted, it can resume from the last saved progress

## How Person Enrichment Works

1. **Search Strategy**: The script tries multiple search approaches in order:
   - `email_direct` - Direct email matching
   - `linkedin_direct` - LinkedIn URL matching
   - `company_experience` - Company-based person search

2. **Confidence Matching**: Only people with 90%+ confidence matches are enriched

3. **Progress Saving**: Progress is saved every 5 people to prevent data loss

4. **Resumability**: If the script is interrupted, it can resume from the last saved progress

## How Two-Phase Buyer Discovery Works 🆕

### Phase 1: Optimal Buyer Group Finding (`find_optimal_buyer_group.js`)

**Step 1: Market Filtering**
1. **Buyer Qualification Criteria**: Define target industries, company size, locations, and growth signals
2. **Elasticsearch Filtering**: Use Coresignal Multi-source Company API with firmographic + growth filters
3. **Get Top Candidates**: Retrieve 100-200 candidate companies from market

**Step 2: Buyer Group Quality Sampling** 🆕
1. **Preview API Sampling**: Sample 20-30 employees from each candidate company using Preview API
2. **Focus on Target Departments**: Sales, Operations, Product Management, Marketing
3. **AI Analysis of Preview Data**: Claude AI analyzes employee data for:
   - **Pain Signal Score**: Evidence of operational challenges, growth pains, need for solutions
   - **Innovation Score**: Forward-thinking culture, modern titles, high LinkedIn engagement
   - **Buyer Experience Score**: Sophisticated, experienced buyers with modern roles
   - **Buyer Group Structure Score**: Ideal composition for enterprise sales (2-3 VPs, 5-8 Directors)
4. **Real Data Ranking**: Rank companies by ACTUAL buyer group quality signals
5. **Progress Tracking**: Save progress every 10 companies with resumability

### Phase 2: Deep Buyer Group Mapping (`find_buyer_group.js`)

**Step 1: Comprehensive Employee Discovery**
1. **Preview API Pagination**: Search all departments with pagination (100-200 employees)
2. **Department-Based Search**: Target Sales, Marketing, Product, Operations, Finance, Legal, Engineering
3. **Duplicate Removal**: Remove duplicate employees across departments

**Step 2: AI-Powered Organizational Analysis** (Parallel Processing)
1. **Hierarchy Analysis**: Map reporting structures and seniority tiers
2. **Department Mapping**: Analyze department sizes and relationships
3. **Working Relationships**: Identify key collaborators and influence networks
4. **Influence Pattern Detection**: Find decision makers, champions, and gatekeepers

**Step 3: Buyer Group Role Classification**
1. **AI Role Classification**: Claude AI classifies each employee into 5 core roles:
   - **Decision Maker**: Budget authority, final approval power (VP+)
   - **Champion**: Internal advocate, operational impact (Director+)
   - **Stakeholder**: Influences decision, controls implementation (Manager+)
   - **Blocker**: Prevents/delays purchase, policy control (Procurement, Legal)
   - **Introducer**: Facilitates access, customer-facing (Sales, Account Management)
2. **Confidence Scoring**: Rate classification confidence (0-100%)
3. **Priority Ranking**: Rank by outreach priority (1-10)

**Step 4: Selective Full Profile Collection**
1. **Top Buyer Group Selection**: Select 8-15 highest priority members
2. **Full Profile Collection**: Collect complete Coresignal profiles for buyer group
3. **Database Integration**: Save buyer group to database with role classifications

## Two-Phase Workflow Integration

```bash
# Phase 1: Find optimal companies with real buyer group quality
node find_optimal_buyer_group.js --industries "Software,SaaS" --size "50-200 employees"

# Phase 2: Deep dive into top companies
node find_buyer_group.js --company-id "01K7DNYR5VZ7JY36KGKKN76XZ1"
```

**Key Benefits:**
- **Data-Driven Ranking**: Use REAL employee data, not assumptions
- **Cost Effective**: Preview API is cheaper than full collection
- **Pain Signal Detection**: Find companies that actually need your solution
- **Innovation Targeting**: Prioritize pioneering, forward-thinking buyers
- **Two-Phase Efficiency**: Quick filter → Deep dive only on winners

## How Role Enrichment Works 🆕

1. **AI-Powered Role Variations**: Claude AI generates hierarchical role variations:
   - **Primary**: Exact equivalents (CFO, Chief Financial Officer)
   - **Secondary**: One level down (VP Finance, Finance Director)
   - **Tertiary**: Two levels down (Senior Finance Manager, Finance Manager)

2. **Multi-Layered Search**: Searches Coresignal using nested experience queries:
   - Tries all primary variations first
   - Falls back to secondary if no results
   - Falls back to tertiary if still no results

3. **Confidence Scoring**: Calculates match confidence based on:
   - Match level (primary: +90, secondary: +75, tertiary: +60)
   - Active experience (+10)
   - LinkedIn URL present (+5)
   - Professional email present (+5)

4. **Smart Fallback**: If Claude AI is unavailable, uses static role dictionaries

5. **Progress Tracking**: Saves progress every 5 role searches with resumability

## API Integration

All scripts use the **Coresignal Multi-source Employee API** (v2) for:
- Richer data structure with professional emails, skills, experience details
- Better search capabilities with nested queries
- Enhanced contact information and workplace details
- Improved data quality and accuracy

## Monitoring Progress

Check company enrichment progress:
```bash
node check-enrichment-progress.js
```

Check person enrichment progress:
```bash
node check-person-progress.js
```

Check role enrichment progress:
```bash
node check-role-progress.js
```

Check optimal buyer group progress:
```bash
node check-optimal-buyer-progress.js
```

The scripts will show:
- Total companies/people/roles/buyer groups processed
- Successfully enriched records
- Failed enrichments
- Credits used
- Latest enriched records with details
- AI vs fallback usage statistics
- Confidence score distributions
- Buyer readiness score distributions
- Adoption maturity profile analysis
