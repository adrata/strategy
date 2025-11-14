# SBI RFP Analysis: Adrata Strategic Positioning

## Executive Summary

This analysis evaluates Adrata's capabilities against SBI's RFP requirements and identifies strategic questions to position Adrata as the best long-term partner. Adrata's core differentiator is **buyer group intelligence** - we don't just provide contact data, we identify and map entire buying committees with roles, influence levels, and decision-making dynamics.

---

## Adrata's Strengths vs RFP Requirements

### Use Case 1: SBI SFDC Data Enrichment

#### ✅ STRENGTHS

**Data Enrichment Capabilities:**
- Multi-source enrichment pipeline (CoreSignal, Perplexity AI, Lusha)
- Comprehensive firmographic data: industry, revenue, employee count, location, ownership status, funding information
- Real-time trigger event detection: M&A announcements, funding rounds, executive changes, hiring signals
- Public/private tagging with automatic updates
- Data quality scoring (0-100) with source tracking
- Persona move detection: tracks executive arrivals/departures

**Technical Capabilities:**
- RESTful API architecture (`/api/v1/enrich`, `/api/enrichment/unified`)
- Webhook support for real-time updates
- Field mapping infrastructure (existing in codebase)
- Database access APIs (`/api/database/tables/[tableName]/data`, `/api/database/query`)

**Intelligence Layer (Differentiator):**
- Buyer group discovery engine with role classification (Economic Buyer, Technical Buyer, Champion, Influencer)
- Influence level scoring (High, Medium, Low)
- Decision power analysis (0-100)
- Engagement level tracking
- 30-step Monaco intelligence pipeline

**Real-Time Data Strategy (Key Differentiator):**
- **Churn Prediction:** AI-powered prediction of when key personas will leave based on career history patterns
- **Smart Refresh Scheduling:** Color-coded refresh system (Red/Orange/Green) that optimizes data freshness vs. API costs
  - 🔴 **Red (Daily):** High churn risk contacts - refreshed daily to catch departures early
  - 🟠 **Orange (Weekly):** Medium churn risk - refreshed weekly to track changes
  - 🟢 **Green (Monthly):** Low churn risk - refreshed monthly for cost optimization
- **Automated Refresh:** Scheduled data updates based on churn risk, not arbitrary timeframes
- **Change Intelligence:** Tracks not just what changed, but why it matters (e.g., "Key persona left, buyer group needs re-mapping")
- **Buyer Group Auto-Revalidation:** Automatically re-runs buyer group discovery when key personas leave

#### ⚠️ GAPS

**Integration:**
- No native Salesforce integration (currently have Zoho CRM integration pattern)
- No Salesloft integration
- No Zapier integration (though webhook architecture supports it)

**Admin Portal:**
- Field mapping exists in codebase but no dedicated admin UI
- Workflow configuration requires engineering support currently

### Use Case 2: Wayforge Data Lake Provider

#### ✅ STRENGTHS

**Data Coverage:**
- **Firmographic:** Industry, sub-industry, revenue, employee size, location, ownership type, funding, year founded, fiscal year, employee growth rate
- **Technographic:** Technologies used, tech stack, technology spend indicators
- **Buyergraphic:** Buyer group roles, tenure in position, decision-makers, influence levels, engagement levels

**Data Infrastructure:**
- PostgreSQL database with full API access
- RESTful APIs for bulk enrichment (`/api/v1/enrich` supports batch operations)
- Database query API for direct data access
- Monthly refresh capability (data quality tracking with `lastEnriched` timestamps)

**Data Quality:**
- Multi-source validation (CoreSignal + Perplexity + Lusha)
- Data quality scoring per record
- Source attribution tracking
- Cross-validation between sources

#### ⚠️ GAPS

**Scale:**
- Need to verify 50-100K account processing capacity
- May need optimization for bulk operations

**Data Lake Format:**
- Currently PostgreSQL database, not traditional "data lake" format
- Can provide API access or database exports

### Use Case 3: Client-Specific Account Segmentation

#### ✅ STRENGTHS

**Segmentation Intelligence:**
- Buyer group analysis provides natural segmentation (by role, influence, decision power)
- AI-powered relevance filtering
- Product-specific buyer group matching
- Account scoring capabilities

**API Integration:**
- Enrichment API accepts account name, website, or other identifiers
- Returns comprehensive enriched data
- Supports batch processing

#### ⚠️ GAPS

**Client-Specific Customization:**
- Segmentation logic may need customization per client
- Would require configuration layer

---

## Evaluation Criteria Analysis

### Commercial Terms (25% Weight)

**Adrata's Position:**
- API-based pricing model (can be structured as credit-based)
- Flexible pricing for enterprise partnerships
- No per-record pricing complexity

**Question Opportunity:** Position as strategic partnership vs transactional vendor

### % of SBI Cases Solved (20% Weight)

**Adrata's Position:**
- **Use Case 1:** 80% - Missing native Salesforce/Salesloft integration (but can build)
- **Use Case 2:** 95% - Strong data coverage, may need scale optimization
- **Use Case 3:** 90% - Strong API, may need customization

**Overall:** ~88% of use cases solvable with current platform + targeted development

### Data Accuracy (20% Weight)

**Adrata's Strengths:**
- Multi-source validation (3 sources: CoreSignal, Perplexity, Lusha)
- Data quality scoring (0-100) per record
- Cross-validation between sources
- Real-time validation capabilities
- Source reliability tracking

**Differentiator:** We validate not just data accuracy, but **relevance** - are these the right people to contact?

### Time to Implement (15% Weight)

**Adrata's Position:**
- API-first architecture = faster integration
- Existing webhook infrastructure
- Can prioritize Salesforce integration for SBI
- Admin portal can be built in parallel

**Risk:** Native Salesforce integration requires development time

### Partnership Potential (15% Weight)

**Adrata's Strengths:**
- Willing to build custom features (Revenue Cloud example)
- Strategic partnership approach
- Buyer group intelligence aligns with SBI's Wayforge AI capability
- Long-term value vs transactional relationship

### Business Maturity (5% Weight)

**Adrata's Position:**
- Newer company (lower score here)
- But: Modern tech stack, production-ready platform
- Active development = faster feature delivery

---

## Strategic Positioning Questions

### Category 1: Elevating from Data to Intelligence

**Question 1: Buyer Group Effectiveness**
"Do you have any requirements for downstream effectiveness of the people and company data provided? For example, are you looking for data on individuals with high influence in purchasing decisions, or do you need to identify entire buying committees with their roles and decision-making dynamics? We believe the most valuable data isn't just accurate contact information, but intelligence about who actually makes decisions and how they influence each other."

**Strategic Value:** Positions Adrata's buyer group intelligence as the differentiator

**Question 2: Decision-Maker Relevance**
"Beyond basic firmographic and technographic data, how important is it to identify the specific decision-makers and influencers for each account? For your Wayforge AI platform, would buyer group intelligence (knowing who the Economic Buyer, Technical Buyer, and Champion are for each account) provide more strategic value than just having contact lists?"

**Strategic Value:** Highlights Adrata's unique capability vs competitors

**Question 3: Account Scoring Intelligence**
"For your 50-100K account data lake, are you looking for just enriched data fields, or would you benefit from account scoring that identifies which accounts are most likely to engage based on buyer group composition, recent trigger events, and decision-making patterns?"

**Strategic Value:** Positions Adrata as strategic partner vs data vendor

### Category 2: Integration & Automation Strategy

**Question 4: Workflow Automation Depth**
"For your Salesforce workflows, are you looking for simple field updates, or would you benefit from intelligent workflows that can identify when a key persona leaves (and automatically backfill with the new decision-maker), detect buying signals from trigger events, and route opportunities based on buyer group engagement levels?"

**Strategic Value:** Shows Adrata can provide more than basic automation

**Question 5: Real-Time vs Batch Processing**
"For your trigger event monitoring (M&A, funding, hiring), what's your tolerance for latency? We can provide real-time webhook notifications, but we're also curious if you'd benefit from predictive intelligence that identifies accounts likely to have trigger events before they're publicly announced. Additionally, our churn prediction system allows us to proactively refresh data for high-risk contacts (people likely to leave) on a daily basis, while optimizing costs by refreshing low-risk contacts monthly. This smart refresh strategy ensures you always have fresh data when it matters most."

**Strategic Value:** Positions Adrata as forward-thinking vs reactive, highlights cost optimization

**Question 6: Integration Flexibility**
"Regarding Salesforce integration, are you open to a phased approach where we start with API/webhook integration (faster implementation) and then build a native Salesforce app based on your specific workflow needs? This would allow you to begin benefiting from our data immediately while we customize the integration to your exact requirements."

**Strategic Value:** Shows flexibility and partnership approach

### Category 3: Data Quality & Strategic Value

**Question 7: Data Quality Metrics**
"Beyond basic accuracy metrics, how do you measure data quality? For example, do you track whether contacts are actually decision-makers vs. just having their titles, or whether accounts are in your ideal customer profile vs. just having firmographic matches? We provide data quality scores that include relevance and decision-making authority, not just completeness."

**Strategic Value:** Elevates conversation from accuracy to strategic value

**Question 8: Segmentation Intelligence**
"For your client segmentation work, are you looking for basic firmographic segmentation, or would you benefit from buyer group-based segmentation that groups accounts by their decision-making patterns, buying committee composition, and engagement likelihood? This could help your clients prioritize which accounts to target first."

**Strategic Value:** Positions Adrata as providing strategic insights vs just data

**Question 9: Competitive Intelligence**
"In addition to account and contact data, would you benefit from competitive intelligence - knowing which of your target accounts are already using competitor solutions, or which accounts have recently evaluated similar solutions? This could inform your go-to-market strategy."

**Strategic Value:** Shows Adrata thinks beyond basic requirements

### Category 4: Partnership & Long-Term Value

**Question 10: Strategic Partnership Model**
"Are you looking for a transactional data vendor relationship, or a strategic partnership where we can co-develop features that enhance your Wayforge AI platform? For example, we could build buyer group intelligence APIs specifically for Wayforge, or develop custom trigger event detection based on your client delivery patterns."

**Strategic Value:** Positions Adrata as long-term partner vs vendor

**Question 11: Data Refresh Strategy**
"For your monthly data refresh requirement, are you looking for simple field updates, or would you benefit from change intelligence - understanding not just what changed, but why it matters (e.g., 'New CFO joined, likely to evaluate financial systems' vs. just 'CFO field updated')?"

**Strategic Value:** Shows Adrata provides context, not just updates

**Question 12: ROI Measurement**
"How do you measure ROI on third-party data? Is it based on data completeness, or on business outcomes like increased meeting rates, shorter sales cycles, or higher win rates? We can provide metrics on both data quality and downstream effectiveness."

**Strategic Value:** Aligns Adrata with SBI's business outcomes

---

## Recommended Implementation Approach

### Phase 1: Quick Wins (Weeks 1-2)
1. API integration for Use Case 2 (Wayforge Data Lake)
2. Webhook setup for trigger events
3. Bulk enrichment API for 50-100K accounts

### Phase 2: Core Integration (Weeks 3-6)
1. Salesforce webhook integration (API-based, not native)
2. Admin portal for field mapping
3. Workflow configuration UI

### Phase 3: Native Integration (Weeks 7-10)
1. Native Salesforce app (if needed)
2. Salesloft integration
3. Zapier connector

### Phase 4: Strategic Enhancements (Ongoing)
1. Buyer group intelligence APIs for Wayforge
2. Custom trigger event detection
3. Predictive account scoring

---

## Competitive Positioning

### vs. ZoomInfo (Current Vendor)

**Adrata Advantages:**
- Buyer group intelligence (not just contacts)
- Real-time trigger events with intelligence
- Strategic partnership model
- Custom development capability
- More flexible pricing

**ZoomInfo Advantages:**
- Larger database
- More mature platform
- Native Salesforce integration

**Positioning:** "We're not trying to replace ZoomInfo's database - we're enhancing it with buyer group intelligence and strategic insights that help you close deals faster."

### vs. Other Data Vendors

**Adrata Differentiators:**
- Focus on buyer groups vs. individual contacts
- AI-powered relevance scoring
- Strategic partnership approach
- Willingness to build custom features
- Integration with AI platforms (Wayforge)

---

## Risk Mitigation

### Technical Risks

1. **Salesforce Integration Timeline**
   - **Mitigation:** Start with API/webhook integration, build native app in parallel
   - **Timeline:** API integration in 2 weeks, native app in 6-8 weeks

2. **Scale for 50-100K Accounts**
   - **Mitigation:** Optimize bulk enrichment pipeline, implement batch processing
   - **Timeline:** Scale testing in Week 1, optimization in Week 2

3. **Admin Portal Development**
   - **Mitigation:** Build MVP admin portal first, iterate based on feedback
   - **Timeline:** MVP in 3 weeks, full version in 6 weeks

### Business Risks

1. **Business Maturity Score**
   - **Mitigation:** Emphasize modern tech stack, active development, partnership approach
   - **Positioning:** "We're newer, which means we can move faster and build exactly what you need"

2. **% of Cases Solved**
   - **Mitigation:** Commit to building missing integrations within 8 weeks
   - **Positioning:** "We can solve 100% of your use cases with targeted development"

---

## Conclusion

Adrata is well-positioned to win this RFP by:

1. **Differentiating on buyer group intelligence** - We don't just provide data, we provide strategic insights
2. **Partnership approach** - We're willing to build custom features (like Revenue Cloud)
3. **Technical flexibility** - API-first architecture allows rapid integration
4. **Strategic questions** - Elevate the conversation from data to intelligence

**Key Message:** "We're not just a data vendor - we're a strategic partner that helps you identify and engage the right buyer groups, not just the right contacts."

