# Pipeline Feasibility Analysis: WGU Retention Product Buyer Group Discovery

## Executive Summary

This analysis evaluates whether the Adrata buyer group discovery pipeline can successfully identify the buyer group for Western Governors University (WGU) for a retention-focused product priced between $500,000 and $1.4 million, with E&I Cooperative Services as the selling organization.

**Verdict: YES, the pipeline will work, but requires custom configuration for education/retention products.**

## Company Research

### E&I Cooperative Services (eandi.org)

**Organization Type:** Member-owned, non-profit sourcing cooperative  
**Mission:** Serve educational institutions by providing competitively solicited contracts  
**Services:** 
- Portfolio of 200+ competitively solicited contracts
- Procurement solutions for higher education and K-12 schools
- Categories include technology, facilities, and professional services
- Member Locator tool to identify member institutions
- Experience with student engagement and retention solutions (e.g., Pathify partnership)

**Role in This Scenario:** E&I would be facilitating the sale to WGU, likely as a member institution.

### Western Governors University (wgu.edu)

**Organization Type:** Accredited online university  
**Focus:** Competency-based education  
**Programs:** Business, education, technology, and health degree programs  
**Key Characteristics:**
- Online-only institution
- Strong emphasis on student retention and engagement (critical to success)
- Large employee base (likely 1,000+ employees based on typical university size)
- Departments relevant to retention:
  - Student Services
  - Academic Affairs
  - Enrollment Management
  - Institutional Research
  - Student Affairs

**Procurement Context:**
- May be an E&I member (verification needed via E&I Member Locator)
- Has procurement/purchasing department for large-scale purchases
- Budget range ($500K-$1.4M) is appropriate for enterprise education technology

## Pipeline Capabilities Analysis

### How the Pipeline Works

The buyer group discovery pipeline follows an 8-stage process:

1. **Company Intelligence** - Researches company data from database and Coresignal API
2. **Preview Search** - Discovers all stakeholders using Coresignal API (cheap preview mode)
3. **Smart Scoring** - Scores employees by relevance, influence, and department fit
4. **Adaptive Filtering** - Filters to relevant employees based on product category
5. **Role Assignment** - Assigns buyer group roles (decision maker, champion, stakeholder, etc.)
6. **Cross-Functional Coverage** - Ensures diverse representation across departments
7. **Cohesion Validation** - Validates buyer group makes sense as a unit
8. **Email/Phone Verification** - Verifies contact information using multi-source verification

### Pipeline Requirements

**Required Inputs:**
- Company identifier (LinkedIn URL, website, or company name)
- Deal size ($500K-$1.4M - **SUPPORTED**)
- Product category (default: 'sales', but supports custom)
- Workspace ID
- Optional: Custom filtering configuration

**Data Sources:**
- Coresignal API for employee discovery
- Database for cached company data
- Multi-source email verification (ZeroBounce, MyEmailVerifier, Prospeo, etc.)

### Current Product Category Support

The pipeline currently has built-in filtering for:
- `sales` - Sales and revenue operations
- `engineering-services` - Engineering and IT (with custom config example)
- Default fallback for other categories

**For retention products in education, custom filtering is required.**

## Feasibility Assessment

### ✅ What Will Work

1. **Company Discovery**
   - WGU has a public website (wgu.edu) and likely has a LinkedIn company page
   - Pipeline can use website or LinkedIn URL to find company in Coresignal
   - Company intelligence stage will gather WGU's organizational data

2. **Employee Discovery**
   - Coresignal API should have WGU employee data (universities typically well-covered)
   - Pipeline can discover all employees, then filter to relevant departments
   - Supports large organizations (WGU likely has 1,000+ employees)

3. **Deal Size Compatibility**
   - $500K-$1.4M is well within supported range (pipeline handles $150K-$500K+)
   - Pipeline adjusts buyer group size and depth based on deal size
   - Larger deals get more comprehensive buyer groups

4. **Custom Filtering Support**
   - Pipeline supports `customFiltering` configuration
   - Can specify departments, titles, and exclusions
   - Example configuration exists for engineering-services (can be adapted)

5. **Role Assignment**
   - AI reasoning module can determine optimal roles for retention products
   - Supports decision makers, champions, stakeholders, blockers, introducers
   - Adapts to product category and deal context

### ⚠️ What Needs Configuration

1. **Product Category**
   - No built-in 'retention' or 'education' category
   - Need to use 'custom' category with customFiltering configuration

2. **Department Filtering**
   - Need to configure departments relevant to student retention:
     - Primary: Student Services, Academic Affairs, Enrollment Management, Student Affairs
     - Secondary: Institutional Research, Student Success, Retention, Analytics
     - Exclude: Facilities, IT (unless retention-focused), Finance (unless budget-related)

3. **Title Filtering**
   - Need to configure titles relevant to retention decisions:
     - Primary: VP Student Services, VP Academic Affairs, VP Enrollment, Director Retention, Chief Student Officer
     - Secondary: Director Student Success, Manager Retention, Director Analytics

4. **Industry Context**
   - Pipeline may need education industry context for better role assignment
   - AI reasoning should understand education-specific decision-making structures

## Recommended Configuration

### Pipeline Configuration for WGU Retention Product

```javascript
{
  dealSize: 950000, // Midpoint of $500K-$1.4M range
  dealSizeRange: { min: 500000, max: 1400000 },
  productCategory: 'custom',
  productName: 'Student Retention Solution',
  customFiltering: {
    departments: {
      primary: [
        'student services',
        'student affairs',
        'academic affairs',
        'enrollment management',
        'enrollment',
        'retention',
        'student success',
        'student engagement'
      ],
      secondary: [
        'institutional research',
        'analytics',
        'data',
        'research',
        'strategy',
        'planning',
        'operations',
        'student support'
      ],
      exclude: [
        'facilities',
        'maintenance',
        'custodial',
        'security',
        'dining',
        'housing' // Unless retention-focused
      ]
    },
    titles: {
      primary: [
        'vp student',
        'vice president student',
        'vp academic',
        'vice president academic',
        'vp enrollment',
        'vice president enrollment',
        'chief student officer',
        'cso',
        'director retention',
        'director student success',
        'director enrollment',
        'director student services',
        'director student affairs',
        'head of retention',
        'head of student success'
      ],
      secondary: [
        'director analytics',
        'director institutional research',
        'manager retention',
        'manager student success',
        'senior director',
        'associate vice president',
        'avp student',
        'director student engagement'
      ],
      exclude: []
    }
  },
  buyerGroupSizing: {
    min: 8,  // Larger deal = larger buyer group
    max: 15,
    ideal: 12
  },
  rolePriorities: {
    decision: 10,      // Critical - need decision makers
    champion: 9,       // Very important - internal champions
    stakeholder: 8,    // Important - stakeholders across departments
    blocker: 7,        // Important - procurement/legal/finance
    introducer: 5      // Nice to have - introducers
  },
  usaOnly: true // WGU is US-based
}
```

## Potential Challenges

### 1. Coresignal Data Coverage
**Risk:** WGU employee data may not be complete in Coresignal  
**Mitigation:** Pipeline has fallback mechanisms and can use alternative company identifiers

### 2. Education-Specific Titles
**Risk:** Education institutions use unique titles that may not match standard filters  
**Mitigation:** Custom filtering allows flexible matching, AI reasoning can interpret context

### 3. Procurement Process
**Risk:** Universities often have complex procurement processes with multiple stakeholders  
**Mitigation:** Pipeline finds cross-functional buyer groups, includes procurement/legal roles

### 4. E&I Membership Status
**Risk:** If WGU is not an E&I member, procurement path may differ  
**Mitigation:** Pipeline works regardless of E&I membership - finds buyer group within WGU

## Success Criteria

The pipeline will successfully work if:

1. ✅ WGU has a LinkedIn company page or public website (VERIFIED: wgu.edu exists)
2. ✅ Coresignal has WGU employee data (LIKELY: universities typically well-covered)
3. ✅ Custom filtering is configured for retention/education context (CONFIGURABLE)
4. ✅ Deal size is within supported range (VERIFIED: $500K-$1.4M supported)
5. ✅ Workspace and seller IDs are available (REQUIRED: need from E&I)

## Next Steps

1. **Verify E&I Workspace Access**
   - Confirm workspace ID for E&I Cooperative Services
   - Confirm main seller ID for the E&I representative

2. **Configure Pipeline**
   - Use the recommended configuration above
   - Test with a smaller deal first to validate filtering

3. **Run Pipeline**
   - Execute with WGU as target company (wgu.edu or LinkedIn URL)
   - Monitor for data quality and coverage

4. **Validate Results**
   - Review discovered buyer group for education/retention relevance
   - Verify contact information quality
   - Adjust filtering if needed

5. **E&I Integration**
   - If WGU is an E&I member, leverage E&I's Member Relations team
   - Use pipeline results to identify specific contacts within WGU

## Conclusion

**The pipeline WILL work for this use case** with proper configuration. The key requirements are:

- ✅ Company discovery: WGU is findable via website/LinkedIn
- ✅ Employee discovery: Coresignal should have WGU data
- ✅ Deal size: $500K-$1.4M is fully supported
- ⚙️ Custom filtering: Required for retention/education context (provided above)
- ✅ Role assignment: AI reasoning can adapt to education context

The main work is configuring the custom filtering to match education/retention departments and titles. Once configured, the pipeline should successfully identify a comprehensive buyer group at WGU for the retention product.

