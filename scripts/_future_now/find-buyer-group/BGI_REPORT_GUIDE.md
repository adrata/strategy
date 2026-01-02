# Buyer Group Intelligence (BGI) Report Generation Guide

## Overview

This guide provides step-by-step instructions for generating a professional Buyer Group Intelligence Report for sales teams. These reports identify key stakeholders at target accounts and provide strategic guidance for engagement.

---

## 1. Understanding the Request

When a user requests a BGI Report, gather:

| Required Information | Example |
|---------------------|---------|
| **Seller Company** | ITC Systems, HR Acuity |
| **Seller Website** | https://itcsystems.com |
| **Seller Product/Service** | OneCard Campus Solutions |
| **Buyer Company** | Idaho State University, Google |
| **Industry/Vertical** | Higher Education, Enterprise Tech |
| **Estimated Deal Size** | $250,000 |

---

## 2. Research Process

### Step 2a: Research the Seller
Use web search to understand:
- What products/services they sell
- Their value proposition
- Target market/vertical
- Key differentiators
- Branding colors (for report customization)

**Example Search:** `"ITC Systems" products campus card solutions`

### Step 2b: Research the Buyer Organization
Identify relevant departments based on product type:

| Product Type | Key Departments to Research |
|-------------|---------------------------|
| **Campus Card/ID** | IT, Auxiliary Services, Finance, Student Affairs, Security |
| **HR Software** | People Ops, HR, Legal, Compliance, IT |
| **Sales Tools** | Sales, Revenue Ops, Marketing, IT |
| **Security** | CISO, IT, Compliance, Legal, Risk |
| **Finance** | CFO, Controller, Treasury, Accounting, IT |

### Step 2c: Identify Key Stakeholders
Search for leadership in each relevant department:

```
"[Company Name]" CIO OR "Chief Information Officer"
"[Company Name]" "VP Finance" OR "CFO"
"[Company Name]" "[Relevant Title]" site:linkedin.com
```

**For each stakeholder, gather:**
- Full name
- Exact title
- Department
- LinkedIn URL (if available)
- Email/phone (if publicly available)
- Background (tenure, previous roles)

### Step 2d: Verify All Data
**CRITICAL:** Use Google search to verify each person:
- Confirm they still work at the company
- Confirm their current title
- Check for recent news/announcements

```
"[Full Name]" "[Company Name]" [Title]
```

---

## 3. Role Assignment

Assign each stakeholder one of these roles:

| Role | Definition | Typical Titles |
|------|-----------|----------------|
| **DECISION MAKER** | Has budget authority and final sign-off | CEO, CFO, CIO, VP, SVP, C-Suite |
| **CHAMPION** | Internal advocate who will push for your solution | Directors, Senior Managers, Team Leads |
| **BLOCKER** | Will scrutinize/potentially block; must address concerns | Security, Legal, Compliance, Procurement |
| **STAKEHOLDER** | Influenced by decision but doesn't decide | Managers, Individual Contributors, End Users |
| **INTRODUCER** | Can make introductions but limited influence | Advisors, Board Members, Consultants |

### Role Assignment Logic

For each person, write a `roleReasoning` explaining WHY they have this role:

```javascript
{
  name: 'Paula Renae Scott',
  title: 'Chief Information Officer',
  role: 'decision',
  roleConfidence: 95,
  roleReasoning: 'CIO with 30+ years IT experience in higher education. Ultimate technology decision maker. Previously CIO at University of Montana.'
}
```

---

## 4. Pain Points Analysis

For each stakeholder, identify 1-3 pain points your product solves:

```javascript
painPoints: [
  {
    title: 'Legacy System Integration Challenges',
    description: 'Managing multiple disconnected systems creates operational inefficiency.',
    impact: 'IT team spends excessive time maintaining integrations.',
    urgency: 'high' // high, medium, low
  }
]
```

**Pain points should be:**
- Specific to their role/department
- Relevant to the seller's product
- Based on industry knowledge and research

---

## 5. Report Template Structure

The BGI Report follows this exact structure:

### Page 1: Cover
- Badge: "BUYER GROUP INTELLIGENCE"
- Title: "Your path into [Buyer Company]"
- Subtitle: "[X] verified stakeholders with clear logic..."
- Stats Row 1: Seller | Target | Deal Size | Product | Date
- Stats Row 2: Total | Decision Makers | Champions | Blockers | Verified

### Page 2: Why This Buyer Group
- Product-Market Fit callout box
- Composition grid (counts by role)

### Page 3: Buyer Group Profiles
- Profile cards for each stakeholder
- Sorted by role: Decision → Champion → Blocker → Stakeholder

### Page 4: Recommended Strategy
- 5 numbered strategic recommendations
- Personalized to specific stakeholders

### Footer
- Seller branding/logo

---

## 6. Report Styling

### Use the Left-Aligned Template
The report uses CSS variables for consistent styling:

```css
:root {
  --navy: #1e3a5f;        /* Primary dark */
  --orange: #ed8936;      /* Accent */
  --teal: #4ecdc4;        /* Alternative accent */
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-700: #334155;
  --gray-900: #0f172a;
}
```

### Customize for Seller Branding
Update colors based on seller's brand:

| Company | Primary | Accent |
|---------|---------|--------|
| ITC Systems | #1e3a5f (navy) | #ed8936 (orange) |
| HR Acuity | #1e3a5f (navy) | #4ecdc4 (teal) |

### Role Pill Colors
```javascript
const roleColorMap = {
  decision: '#dc2626',   // Red
  champion: '#16a34a',   // Green
  blocker: '#f97316',    // Orange
  stakeholder: '#1e3a5f', // Navy
  introducer: '#9333ea'  // Purple
};
```

---

## 7. File Structure

Create/modify these files:

```
scripts/_future_now/find-buyer-group/
├── run-[seller]-[buyer].js      # Main generation script
├── save-[seller]-[buyer]-pdf.js # PDF conversion script
├── output/
│   ├── [seller]-[buyer]-buyer-group-YYYY-MM-DD.html
│   └── [seller]-[buyer]-buyer-group-YYYY-MM-DD.json
└── BGI_REPORT_GUIDE.md          # This guide
```

---

## 8. Script Template

Use this template for new reports:

```javascript
#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
const fs = require('fs');

class [Seller][Buyer]Runner {
  constructor(options = {}) {
    // Seller branding colors
    this.brandColors = {
      primary: '#1e3a5f',
      secondary: '#2c5282',
      accent: '#ed8936',
      light: '#edf2f7'
    };

    // Configuration
    this.config = {
      seller: {
        name: '[Seller Name]',
        website: 'https://...',
        tagline: '[Tagline]',
        product: '[Product Name]',
        valueProposition: '[Value prop]',
        solutions: [
          'Solution 1',
          'Solution 2'
        ]
      },
      buyer: {
        name: '[Buyer Name]',
        website: 'https://...',
        industry: '[Industry]',
        size: '[Size]',
        location: '[Location]',
        relevantDivisions: [
          'Division 1',
          'Division 2'
        ]
      },
      dealSize: 250000,
      dealSizeRange: { min: 150000, max: 400000 }
    };

    // Buyer Group - researched stakeholders
    this.buyerGroup = [
      {
        name: '[Full Name]',
        title: '[Title]',
        department: '[Department]',
        role: 'decision', // decision, champion, blocker, stakeholder, introducer
        roleConfidence: 95,
        roleReasoning: '[Why this role]',
        linkedin: 'https://linkedin.com/in/...',
        email: null,
        phone: null,
        painPoints: [
          {
            title: '[Pain Point]',
            description: '[Description]',
            impact: '[Business Impact]',
            urgency: 'high'
          }
        ]
      }
      // ... more stakeholders
    ];
  }

  generateHTMLReport() {
    // Use the left-aligned template from run-itc-idaho-state.js
    // Copy the generateHTMLReport() method
  }

  async run() {
    // Generate HTML, save to output folder and Desktop
    // Copy the run() method
  }
}

// CLI
async function main() {
  const runner = new [Seller][Buyer]Runner();
  await runner.run();
}

module.exports = { [Seller][Buyer]Runner };

if (require.main === module) {
  main().catch(console.error);
}
```

---

## 9. PDF Generation

Use Puppeteer to convert HTML to PDF:

```javascript
#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function savePDF() {
  const htmlPath = path.join(__dirname, 'output', '[filename].html');
  const pdfPath = '/Users/rosssylvester/Desktop/[OutputName].pdf';
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Wait for fonts to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  
  await browser.close();
  console.log('✅ PDF saved to:', pdfPath);
}

savePDF().catch(console.error);
```

---

## 10. Quality Checklist

Before delivering the report, verify:

- [ ] All stakeholder names are correctly spelled
- [ ] All titles are current and accurate (web verified)
- [ ] All roles have clear reasoning
- [ ] Pain points are relevant to the seller's product
- [ ] Strategy recommendations are personalized
- [ ] Branding colors match seller
- [ ] HTML renders correctly
- [ ] PDF generates without errors
- [ ] Report saved to user's Desktop

---

## 11. Example Workflow

```
User Request:
"Create a BGI Report for [Seller] targeting [Buyer]"

Step 1: Research seller (products, branding)
Step 2: Research buyer (org structure, leadership)
Step 3: Identify 6-12 key stakeholders
Step 4: Verify each person via Google search
Step 5: Assign roles with reasoning
Step 6: Identify pain points for each
Step 7: Create script file based on template
Step 8: Generate HTML report
Step 9: Convert to PDF
Step 10: Save to Desktop
Step 11: Confirm with user
```

---

## 12. Reference Reports

| Report | Script | Output |
|--------|--------|--------|
| HR Acuity → Google | `run-hracuity-google.js` | `hracuity-google-verified-final.html` |
| ITC → Idaho State | `run-itc-idaho-state.js` | `itc-idaho-state-buyer-group-*.html` |

Use these as templates for styling and structure.

---

## 13. Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Person no longer at company | Remove from buyer group, find replacement |
| Title changed | Update title, verify on LinkedIn |
| No LinkedIn found | Mark as "Research needed" in report |
| API errors (Coresignal) | Use manual web research instead |
| PDF fonts not loading | Increase wait time before PDF generation |
| Centered layout | Use left-aligned template from this guide |

---

## 14. Sales Org Segmentation (CRITICAL for Sales Tool Sales)

When targeting a company's sales organization, understand their segment structure:

### Common Sales Org Segments

| Segment | Role Type | Focus | Example Titles |
|---------|-----------|-------|----------------|
| **Commercial** | HUNTERS | New business acquisition | RVP Commercial, Commercial AE |
| **Enterprise** | MIXED | Mid-market acquisition + expansion | Enterprise AE, RVP Enterprise |
| **Majors/Strategic** | FARMERS | Single account expansion | Strategic AE, Global Account Exec |
| **SMB** | HUNTERS | High-volume small deals | SMB AE, Inside Sales |

### Snowflake Case Study

**Problem:** Initial buyer group included "Strategic Account Executives" who are:
- Badged at ONE client site (e.g., one big bank)
- Focused on EXPANSION (farming), not acquisition (hunting)
- Wrong fit for sales tools that help with prospecting/new business

**Solution:** Retarget to Commercial segment:
- Adam Rosenbloom: RVP Commercial Sales - US West & Canada ✅
- Ben Compton: RVP Commercial East ✅

**Key Insight:** Ariel Fleming (Strategic AE in Majors) gave us insider intel:
> "You should target RVPs of the Commercial segment"

### Filtering Configuration for Sales Orgs

```javascript
// For targeting HUNTERS (new business)
const COMMERCIAL_SALES_PROFILE = {
  targetTitles: [
    'regional vice president',
    'rvp',
    'commercial sales',
    'commercial account',
    'business development',
    'acquisition'
  ],
  excludeTitles: [
    'strategic account',      // Majors (farmers)
    'global account',         // Farmers
    'enterprise account',     // May be mixed
    'account manager',        // Farmers
    'customer success',       // Not sales
    'expansion',              // Farmers
    'renewal'                 // Farmers
  ]
};
```

### Questions to Ask About Sales Org

1. What segments exist? (Commercial, Enterprise, Majors, SMB?)
2. Which segment does ACQUISITION? (Usually Commercial/SMB)
3. Which segment does EXPANSION? (Usually Strategic/Majors)
4. Who are the RVPs/VPs for each segment?
5. What's the typical deal size per segment?

---

## Summary

1. **Research thoroughly** - Web search seller and buyer
2. **Verify everything** - Google search each stakeholder
3. **Understand sales org segments** - Hunters vs Farmers (see Section 14)
4. **Use the template** - Left-aligned style with CSS variables
5. **Customize branding** - Match seller's colors
6. **Generate both formats** - HTML and PDF
7. **Save to Desktop** - Always deliver to user's Desktop
