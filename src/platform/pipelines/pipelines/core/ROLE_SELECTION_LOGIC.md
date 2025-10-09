# Role Selection Logic for Acquired Companies

## 🏢 Overview

The pipeline uses sophisticated logic to handle executive role selection, especially when companies have been acquired. This ensures we find the most relevant CFO and CRO contacts even in complex corporate structures.

## 🔍 Acquisition Detection Process

### Step 1: Company Resolution
The pipeline first determines if a company has been acquired using multiple signals:

1. **Acquisition Database**: Built-in database of known acquisitions
2. **Domain Analysis**: Checks for redirects to parent company domains
3. **Perplexity AI**: Real-time verification of acquisition status
4. **Corporate Structure Analysis**: Identifies parent-subsidiary relationships

### Step 2: Acquisition Status Determination
```javascript
if (companyResolution.acquisitionInfo?.isAcquired) {
    // Company has been acquired - research parent company executives
    resolution.isAcquired = true;
    resolution.parentCompany = acquisitionInfo.parentCompany;
    resolution.companyStatus = 'acquired';
}
```

## 🎯 Role Selection Strategy

### Waterfall Approach for CFO (Finance Roles)

**Tier 1 - Primary Targets:**
- CFO (Chief Financial Officer)
- Chief Financial Officer

**Tier 2 - Senior Finance Leaders:**
- Controller
- Chief Accounting Officer

**Tier 3 - VP Level:**
- VP Finance
- Vice President Finance
- Finance Director

**Tier 4 - Manager Level:**
- Treasurer
- Chief Treasurer
- Finance Manager

**Tier 5 - Other Finance:**
- Any role containing "finance" or "accounting"

### Waterfall Approach for CRO (Revenue/Sales Roles)

**Tier 1 - Primary Targets:**
- CRO (Chief Revenue Officer)
- Chief Revenue Officer

**Tier 2 - Sales Leadership:**
- CSO (Chief Sales Officer)
- Chief Sales Officer

**Tier 3 - VP Level:**
- VP Sales
- VP Revenue
- Vice President Sales
- Vice President Revenue

**Tier 4 - Director Level:**
- Sales Director
- Revenue Director
- Head of Sales
- Head of Revenue

**Tier 5 - Other Sales/Revenue:**
- Any role containing "sales" or "revenue"

## 🏢 Post-Acquisition Executive Tracking

### When a Company is Acquired

1. **Parent Company Research**: Instead of researching the acquired company, the pipeline researches executives at the parent company
2. **Executive Tracking**: Tracks what happened to original executives:
   - Did they stay with the acquired company?
   - Did they move to the parent company?
   - Did they leave entirely?
   - Were they promoted/demoted?

### Executive Tracking Process
```javascript
if (companyResolution.acquisitionInfo?.isAcquired && 
    companyResolution.acquisitionInfo?.executiveTracking) {
    
    const executiveTracking = await this.companyResolver.trackPostAcquisitionExecutives(
        result.companyName,
        companyResolution.acquisitionInfo
    );
    
    // Tracks executives and their current status
    result.executiveTracking = executiveTracking;
}
```

### Tracking Results Include:
- **Executive Name**: Original executive's name
- **Current Status**: Where they are now
- **Current Company**: Their current employer
- **Current Role**: Their current title
- **Transition Date**: When they moved
- **Transition Type**: Promotion, lateral move, departure, etc.

## 🔄 Fallback Strategy

### If No CFO/CRO Found at Parent Company

1. **Role Expansion**: Look for equivalent roles:
   - For CFO: Controller, VP Finance, Treasurer
   - For CRO: CSO, VP Sales, VP Revenue

2. **Department Heads**: Find heads of relevant departments:
   - Finance Department Head
   - Sales Department Head

3. **Senior Leadership**: Look for any C-level executives who might have financial or revenue responsibilities

### Intelligent Executive Fallback
```javascript
// If primary research fails, use intelligent fallback
const fallbackResult = await this.researcher.intelligentExecutiveFallback(companyInfo);

// Maps other leadership roles if CFO/CRO not found
const mappedRoles = this.mapLeadershipRoles(companyInfo, fallbackResult);
```

## 📊 Confidence Scoring for Acquired Companies

### Higher Confidence Factors:
- **Current Employment**: Executive is still at the parent company
- **Role Continuity**: Same or similar role at parent company
- **Recent Transition**: Moved within last 2 years
- **Multiple Sources**: Confirmed by multiple data sources

### Lower Confidence Factors:
- **Old Data**: Executive information is outdated
- **Uncertain Status**: Unclear if still employed
- **Role Change**: Significant role change at parent company
- **Single Source**: Only one data source confirms

## 🎯 Example Scenarios

### Scenario 1: Company Acquired, Executives Moved to Parent
```
Original Company: TechStartup Inc.
Acquired By: BigCorp Inc.
CFO: John Smith (moved to BigCorp as VP Finance)
CRO: Jane Doe (moved to BigCorp as Sales Director)

Result: Research BigCorp executives, find John Smith and Jane Doe
```

### Scenario 2: Company Acquired, Executives Left
```
Original Company: SmallBiz Inc.
Acquired By: MegaCorp Inc.
CFO: Bob Johnson (left company, now at CompetitorCorp)
CRO: Alice Brown (left company, now at StartupXYZ)

Result: Research MegaCorp executives, find new CFO/CRO
```

### Scenario 3: Company Acquired, Mixed Outcomes
```
Original Company: MidSize Inc.
Acquired By: GlobalCorp Inc.
CFO: Carol White (stayed as Controller at MidSize division)
CRO: David Green (moved to GlobalCorp as VP Sales)

Result: Research both MidSize division and GlobalCorp
```

## 🔧 Configuration Options

### Acquisition Detection Sensitivity
- **High Sensitivity**: Detects all acquisitions, including partial ownership
- **Medium Sensitivity**: Detects majority acquisitions and mergers
- **Low Sensitivity**: Only detects complete acquisitions

### Executive Tracking Depth
- **Full Tracking**: Tracks all executives from acquired company
- **Key Executives Only**: Tracks only C-level and VP-level executives
- **CFO/CRO Only**: Tracks only finance and revenue executives

### Fallback Aggressiveness
- **Conservative**: Only looks for exact role matches
- **Moderate**: Includes similar roles (VP Finance for CFO)
- **Aggressive**: Includes any finance/sales related roles

## 📈 Success Metrics

### Acquisition Detection Accuracy
- **True Positives**: Correctly identified acquisitions
- **False Positives**: Incorrectly identified as acquired
- **False Negatives**: Missed actual acquisitions

### Executive Tracking Success
- **Tracking Rate**: Percentage of executives successfully tracked
- **Accuracy Rate**: Percentage of tracked executives with correct current status
- **Completeness Rate**: Percentage of tracked executives with complete information

### Role Selection Effectiveness
- **Primary Role Found**: Found exact CFO/CRO role
- **Fallback Success**: Found equivalent role when primary not available
- **No Match**: No suitable executive found

This sophisticated role selection logic ensures that even in complex corporate structures, the pipeline finds the most relevant and current executive contacts for your outreach needs.
