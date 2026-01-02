# OBP Product Configuration Guide

## Overview

Organizational Behavioral Physics (OBP) is designed to work with **any B2B product**. To use OBP for your product, you need to create a product configuration file that tells the system:

1. **What you sell** - Your product context
2. **Who you sell to** - Target buyer profile
3. **What signals matter** - PULL triggers for your market
4. **How to identify champions** - Title patterns and department focus
5. **What "healthy" looks like** - Staffing ratio benchmarks

## Quick Start

1. Copy `template.json` to `your-product.json`
2. Fill in all sections (see detailed guide below)
3. Run: `node run-obp-report.js --product your-product --company "Target Company"`

---

## Configuration Schema

### 1. Product Context

```json
{
  "product": {
    "name": "Your Product Name",
    "company": "Your Company Name",
    "category": "compliance|sales|hr|security|devops|finance|marketing",
    "tagline": "One-line value proposition",
    "problemStatement": "The core problem you solve",
    "quickWinMetric": "Key metric that shows fast value",
    "averageDealSize": 50000,
    "typicalSalesCycle": "30-90 days"
  }
}
```

**Why this matters:** The product context drives the internal dialogue simulation. OBP will generate conversations about YOUR specific value proposition.

---

### 2. Target Buyer Profile

```json
{
  "targetBuyer": {
    "primaryDepartments": ["security", "compliance"],
    "championTitles": [
      "CISO", "Head of Security", "VP Security"
    ],
    "economicBuyerTitles": [
      "CFO", "CTO", "CEO"
    ],
    "targetCompanySize": {
      "min": 50,
      "max": 5000,
      "sweet_spot": { "min": 200, "max": 1000 }
    },
    "targetFundingStages": ["series_a", "series_b", "series_c"],
    "targetIndustries": ["B2B SaaS", "FinTech", "HealthTech"]
  }
}
```

**Department Categories:**
- `security` - InfoSec, Security Engineering, SOC
- `compliance` - GRC, Compliance, Audit, Risk
- `engineering` - Software Engineering, DevOps, Platform
- `sales` - Sales, Business Development, Account Management
- `marketing` - Marketing, Growth, Demand Gen
- `hr` - HR, People Ops, Recruiting, L&D
- `finance` - Finance, Accounting, FP&A
- `legal` - Legal, Contracts, IP
- `customer_success` - CS, Support, Implementation
- `product` - Product Management, Design, UX
- `operations` - Ops, RevOps, BizOps
- `it` - IT, Help Desk, Infrastructure
- `data` - Data Science, Analytics, BI

---

### 3. PULL Signals

```json
{
  "pullSignals": {
    "triggers": [
      {
        "name": "New Leader",
        "description": "New department leader in last 90 days",
        "weight": 0.30,
        "urgencyMultiplier": 1.5,
        "messaging": "Quick win for your first 90 days"
      }
    ],
    "disqualifiers": [
      "Already using competitor product",
      "Company too small"
    ]
  }
}
```

**Standard Triggers (adjust weights for your market):**

| Trigger | Description | Typical Weight |
|---------|-------------|----------------|
| New Leader | Champion in 90-day window | 0.25-0.35 |
| Ratio Imbalance | Department understaffed | 0.20-0.30 |
| Hypergrowth | Company growing 30%+ YoY | 0.15-0.25 |
| Post-Funding | Recent funding round | 0.10-0.20 |
| Enterprise Motion | Upmarket push | 0.05-0.15 |

---

### 4. Competitors & Mature Companies

```json
{
  "competitors": {
    "direct": ["Competitor A", "Competitor B"],
    "indirect": ["Manual processes", "Consultants"],
    "matureCompanies": [
      "Companies known for excellence in your category"
    ]
  }
}
```

**Mature Companies:** These are companies where someone coming FROM them would experience "ratio shock" at a less mature company. For a security product, this might be Stripe, Datadog, or Okta. For an HR product, this might be Google, Netflix, or Gusto.

---

### 5. Staffing Ratio Benchmarks

```json
{
  "ratios": {
    "primary_department_to_company": {
      "healthy": { "min": 0.015, "max": 0.025, "label": "1:40 to 1:67" },
      "concerning": { "min": 0.008, "max": 0.015, "label": "1:67 to 1:125" },
      "critical": { "max": 0.008, "label": "worse than 1:125" }
    }
  }
}
```

**Industry Benchmarks by Department:**

| Department | Healthy Ratio | Source |
|------------|--------------|--------|
| Security:Company | 1:40 to 1:67 | ISACA, Gartner |
| Security:Engineering | 1:10 to 1:20 | Industry standard |
| HR:Company | 1:50 to 1:100 | SHRM |
| Sales:Revenue | Varies by ACV | - |
| CS:Customers | 1:50 to 1:200 | Depends on touch model |

---

### 6. Messaging & Objection Handling

```json
{
  "messaging": {
    "valueProps": [
      "Value proposition 1",
      "Value proposition 2"
    ],
    "objectionHandling": {
      "price": "Response to price objection",
      "build_vs_buy": "Response to 'we can build this'",
      "timing": "Response to 'not the right time'",
      "competitor": "Response to competitor comparison"
    }
  }
}
```

---

### 7. Report Branding

```json
{
  "reportBranding": {
    "primaryColor": "#6366F1",
    "secondaryColor": "#4F46E5",
    "accentColor": "#818CF8",
    "gradientStart": "#6366F1",
    "gradientEnd": "#8B5CF6",
    "logo": "https://yourcompany.com/logo.png",
    "companyWebsite": "https://yourcompany.com"
  }
}
```

---

## Example Configurations

See these example configs for reference:
- `adrata.json` - Compliance automation (B2B SaaS)
- `template.json` - Blank template to copy

---

## Running OBP Analysis

```bash
# Single company analysis with report
node run-obp-report.js --product adrata --company "Ramp" --output ./reports

# Batch analysis
node run-obp-report.js --product adrata --companies companies.csv --output ./reports

# Interactive mode (prompts for inputs)
node run-obp-report.js --interactive
```

---

## How OBP Uses Your Config

1. **Champion Detection:** Uses `championTitles` to identify potential champions
2. **Ratio Analysis:** Uses `ratios` to calculate tension scores
3. **Internal Dialogue:** Uses `product`, `messaging`, and `competitors` to generate realistic conversations
4. **Scoring:** Uses `pullSignals.triggers` weights to calculate PULL score
5. **Disqualification:** Uses `pullSignals.disqualifiers` to flag companies to skip
6. **Report Generation:** Uses `reportBranding` for visual customization
