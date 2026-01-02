# Triangulated PULL Intelligence Architecture

## Executive Summary

This document outlines a next-generation PULL detection system that triangulates data from multiple sources to identify companies with **blocked demand** - the ~5% of companies that would "rip your product out of your hands."

The key insight: **PULL isn't found in a single data point. It's triangulated from the intersection of:**
1. A **Champion** who knows the right answer (from their career history)
2. A **Pain Point** being addressed the wrong way (from hiring patterns)
3. **Timeline Pressure** that forces action (from public signals)

---

## The NexusLogistics Pattern (Gold Standard)

```
Target: NexusLogistics
PULL Score: 98/100

NexusLogistics is currently bleeding margin due to shipping errors—a pain
point explicitly cited in their Q3 earnings miss. To stop the bleeding,
they installed a new VP of Ops, Marcus Thorne, just 4 weeks ago.

The Conflict: Marcus spent 5 years at Flexport (a highly automated rival),
yet his new team at Nexus is currently trying to patch the problem by
manually hiring 20+ "Data Entry Clerks."

The PULL: Marcus knows from his Flexport days that throwing bodies at this
problem destroys unit economics, but he doesn't have 9 months to install a
new ERP before Q1 board meeting. He urgently needs a "third option."

Strategy: Don't pitch "Digital Transformation" (too long).
Pitch "Enforcing 99% accuracy by next month without hiring more staff."

Evidence:
- Trigger: Q3 Earnings Transcript — "margin erosion via error rates"
- Champion: Marcus Thorne — Joined Oct 2024, prev VP Automation at Flexport
- Bad Option: 22 Active Job Posts — "Data Entry Clerk - Urgent", 3 days ago
```

---

## Data Sources & Mapping

### 1. CHAMPION DETECTION (Coresignal Employee API)

**What we get:**
- Employee name, title, company
- Start date (tenure calculation)
- Previous employers + titles
- Career trajectory
- Seniority level changes

**Triangulation Logic:**
```javascript
const ChampionSignals = {
  // New executive in relevant area
  newLeadership: {
    condition: "tenure < 90 days AND seniority in ['VP', 'Director', 'Head', 'C-Suite']",
    strength: 85,
    data: "Coresignal Employee API - employment_history"
  },

  // Champion from advanced/competitor company
  competitorBackground: {
    condition: "previous_employer in [list of advanced competitors]",
    strength: 90,
    data: "Coresignal Employee API - employment_history[].company_name"
  },

  // Champion who built this before
  priorExperience: {
    condition: "previous_title contains [relevant keywords]",
    strength: 95,
    data: "Coresignal Employee API - employment_history[].title"
  }
}
```

**API Call:**
```javascript
// Get recent leadership hires at target company
GET /company/search
{
  "company_id": "nexuslogistics-linkedin-id",
  "filters": {
    "current_employee": true,
    "seniority": ["VP", "Director", "C-Suite"],
    "start_date_after": "2024-09-01" // last 90 days
  }
}
```

### 2. BAD OPTION DETECTION (Coresignal Jobs API)

**What we get:**
- Active job postings
- Job titles and descriptions
- Post date (urgency marker: "Urgent", "ASAP")
- Department hiring patterns
- Seniority mix

**Triangulation Logic:**
```javascript
const BadOptionSignals = {
  // Manual labor roles for automation-solvable problems
  manualRoleSurge: {
    condition: "job_titles match ['Data Entry', 'Manual QC', 'Document Processing']",
    strength: 90,
    reasoning: "Company trying to solve problem with bodies instead of automation"
  },

  // Urgency markers in postings
  urgentHiring: {
    condition: "job_description contains ['Urgent', 'ASAP', 'Immediate Start']",
    strength: 85,
    reasoning: "Pain is acute - they're throwing money at it"
  },

  // Volume indicates scale of problem
  highVolume: {
    condition: "similar_roles_count > 10",
    strength: 80,
    reasoning: "Not a one-off - systemic problem"
  }
}
```

**API Call:**
```javascript
// Get active job postings for manual labor roles
POST /jobs/search/filter
{
  "company_id": "nexuslogistics-linkedin-id",
  "filters": {
    "posted_after": "2024-11-01", // last 60 days
    "keywords": ["data entry", "manual", "clerk", "processor"]
  }
}
```

### 3. PAIN TRIGGER DETECTION (Perplexity Sonar Deep Research)

**What we get:**
- Earnings call transcripts
- Press releases and news
- Executive quotes
- Analyst reports
- Industry commentary

**Triangulation Logic:**
```javascript
const PainTriggerSignals = {
  // Explicit pain mentioned in public filings
  earningsPainPoint: {
    query: "site:seekingalpha.com OR site:sec.gov [company] earnings transcript pain challenges issues",
    strength: 95,
    reasoning: "Public admission of problem creates internal pressure to fix"
  },

  // Leadership quotes about challenges
  executiveAdmission: {
    query: "[company] CEO OR CFO OR COO challenges problems solving",
    strength: 90,
    reasoning: "Executive publicly addressing issue = it's on the board agenda"
  },

  // Industry analyst concerns
  analystConcerns: {
    query: "[company] analyst concerns risks operational issues",
    strength: 75,
    reasoning: "External pressure creates internal urgency"
  }
}
```

**API Call (Perplexity Sonar Pro):**
```javascript
POST /chat/completions
{
  "model": "sonar-pro",
  "messages": [{
    "role": "user",
    "content": `Research NexusLogistics recent earnings calls and press releases.
    Extract:
    1. Any operational challenges or issues mentioned
    2. Executive quotes about problems they're solving
    3. Analyst concerns about the company
    4. Timeline pressures (board meetings, audits, deadlines)

    Return structured JSON with evidence and sources.`
  }]
}
```

### 4. TIMELINE PRESSURE DETECTION (Multiple Sources)

**What we get:**
- Board meeting schedules (SEC filings)
- Funding round timelines
- Compliance deadlines
- Contract renewals
- Fiscal year patterns

**Triangulation Logic:**
```javascript
const TimelinePressureSignals = {
  // Board meeting approaching
  boardPressure: {
    source: "Perplexity research + SEC filings",
    condition: "board_meeting < 90 days AND pain_point_active",
    strength: 95,
    reasoning: "Must show progress before board - creates buying urgency"
  },

  // Audit/compliance deadline
  complianceDeadline: {
    source: "Industry patterns + Perplexity research",
    condition: "audit_cycle < 60 days",
    strength: 90,
    reasoning: "Can't miss compliance deadlines - creates hard deadline"
  },

  // Recent funding with investor expectations
  investorPressure: {
    source: "Coresignal Company API - funding_rounds",
    condition: "funding_round < 180 days AND growth_pressure",
    strength: 85,
    reasoning: "Investors expect progress on metrics - creates accountability"
  }
}
```

### 5. COMPETITOR CONTEXT (Perplexity Research)

**What we get:**
- What technology did champion's previous employer use?
- How did they solve this problem?
- Why can't current company use same approach?

**API Call:**
```javascript
POST /chat/completions
{
  "model": "sonar-pro",
  "messages": [{
    "role": "user",
    "content": `Research Flexport's approach to shipping accuracy and automation.
    What technology/processes do they use that competitors lack?
    What results have they achieved?
    Return specific technology names and metrics.`
  }]
}
```

---

## Composite PULL Score Calculation

```javascript
function calculateTriangulatedPULL(company, championData, hiringData, painTriggers, timeline) {
  const signals = {
    // PROJECT: Champion + Pain = Active Priority
    project: {
      weight: 0.25,
      score: combineSignals([
        painTriggers.earningsPainPoint,    // Pain exists publicly
        championData.newLeadership,         // Someone owns fixing it
        hiringData.relatedRoles             // Resources being allocated
      ])
    },

    // URGENCY: Timeline Pressure + Champion Window
    urgency: {
      weight: 0.35,
      score: combineSignals([
        timeline.boardPressure,             // Hard deadline approaching
        championData.newLeadershipTenure,   // New leader needs quick win
        painTriggers.executiveAdmission     // Public pressure to fix
      ])
    },

    // LIST: They're considering options (including bad ones)
    list: {
      weight: 0.15,
      score: combineSignals([
        hiringData.manualRoleSurge,         // Considering wrong option
        // G2/Bombora intent would go here
        // Website visits would go here
      ])
    },

    // LIMITATIONS: Bad options have severe limitations
    limitations: {
      weight: 0.25,
      score: combineSignals([
        championData.competitorBackground,   // Champion KNOWS better way exists
        hiringData.urgentHiring,             // Current approach failing
        calculateManualApproachLimitations() // Bodies don't scale
      ])
    }
  };

  // Weighted sum
  const pullScore = Object.values(signals).reduce(
    (sum, s) => sum + s.score * s.weight, 0
  );

  // Classification
  return {
    pullScore,
    classification: pullScore >= 75 ? 'PULL' : pullScore >= 50 ? 'CONSIDERATION' : 'NOT_IN_MARKET',
    signals,
    champion: championData.bestCandidate,
    pitchAngle: generatePitchAngle(painTriggers, championData, timeline)
  };
}
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PULL Intelligence Pipeline                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  INPUT: Company Name or Domain                                        │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │   Coresignal │  │  Perplexity  │  │    Lusha     │                │
│  │  Company API │  │  Sonar Pro   │  │  Contact API │                │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                │
│         │                 │                 │                         │
│         ▼                 ▼                 ▼                         │
│  ┌──────────────────────────────────────────────────────┐            │
│  │              Data Aggregation Layer                   │            │
│  │  - Company firmographics                              │            │
│  │  - Employee/leadership changes                        │            │
│  │  - Job posting patterns                               │            │
│  │  - Public pain triggers                               │            │
│  │  - Timeline pressures                                 │            │
│  └──────────────────────────┬───────────────────────────┘            │
│                             │                                         │
│                             ▼                                         │
│  ┌──────────────────────────────────────────────────────┐            │
│  │            Champion Triangulation Engine              │            │
│  │                                                        │            │
│  │  FOR each recent leadership hire:                     │            │
│  │    1. Get career history (Coresignal)                 │            │
│  │    2. Research previous employer's approach           │            │
│  │    3. Compare to current company's approach           │            │
│  │    4. Identify knowledge/approach gaps                │            │
│  │    5. Score PULL potential                            │            │
│  └──────────────────────────┬───────────────────────────┘            │
│                             │                                         │
│                             ▼                                         │
│  ┌──────────────────────────────────────────────────────┐            │
│  │              Bad Option Detector                      │            │
│  │                                                        │            │
│  │  Analyze job postings for:                            │            │
│  │  - Manual labor solving automation problems           │            │
│  │  - Urgency markers ("ASAP", "Immediate")             │            │
│  │  - Volume indicating systemic problem                 │            │
│  │  - Department mismatch (hiring clerks, not engineers) │            │
│  └──────────────────────────┬───────────────────────────┘            │
│                             │                                         │
│                             ▼                                         │
│  ┌──────────────────────────────────────────────────────┐            │
│  │            Claude Analysis (Synthesis)                │            │
│  │                                                        │            │
│  │  Given all data, generate:                            │            │
│  │  - PULL score with confidence                         │            │
│  │  - Champion identification                            │            │
│  │  - Pitch angle (not transformation - quick win)       │            │
│  │  - Evidence citations                                 │            │
│  │  - Recommended approach                               │            │
│  └──────────────────────────┬───────────────────────────┘            │
│                             │                                         │
│                             ▼                                         │
│  OUTPUT:                                                              │
│  {                                                                    │
│    pullScore: 98,                                                     │
│    company: "NexusLogistics",                                         │
│    champion: {                                                        │
│      name: "Marcus Thorne",                                           │
│      title: "VP of Operations",                                       │
│      tenure: "4 weeks",                                               │
│      previousCompany: "Flexport",                                     │
│      insight: "Knows automation works - built it at Flexport"         │
│    },                                                                 │
│    painTrigger: {                                                     │
│      source: "Q3 Earnings Transcript",                                │
│      quote: "margin erosion via error rates",                         │
│      impact: "Primary cause of earnings miss"                         │
│    },                                                                 │
│    badOption: {                                                       │
│      hiring: "22 Data Entry Clerks - Urgent",                         │
│      posted: "3 days ago",                                            │
│      limitation: "Bodies don't scale, destroys unit economics"        │
│    },                                                                 │
│    timeline: {                                                        │
│      pressure: "Q1 board meeting",                                    │
│      urgency: "Can't wait 9 months for ERP"                          │
│    },                                                                 │
│    pitch: {                                                           │
│      angle: "99% accuracy by next month without more staff",          │
│      avoid: "Digital transformation (too long)"                       │
│    }                                                                  │
│  }                                                                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Provider Summary

| Provider | Data | PULL Signal | Cost |
|----------|------|-------------|------|
| **Coresignal Company API** | Firmographics, funding, growth | P (size/stage), U (funding) | ~$0.02/company |
| **Coresignal Employee API** | Leadership hires, tenure, history | P (champion), L (expertise gap) | ~$0.05/person |
| **Coresignal Jobs API** | Postings, urgency, department mix | P (project), L (bad options) | ~$0.03/search |
| **Perplexity Sonar Pro** | Earnings, news, competitor research | U (pain triggers), L (context) | ~$5/1000 queries |
| **Lusha** | Contact info for champion | - | ~$0.50/contact |
| **Bombora** (future) | Topic-level intent data | L (actively researching) | Enterprise |
| **G2** (future) | Software evaluation signals | L (evaluating solutions) | Enterprise |

---

## Implementation Phases

### Phase 1: Core Triangulation (Now)
- Coresignal Employee API for champion detection
- Coresignal Jobs API for bad option detection
- Perplexity Sonar for pain trigger research
- Claude for synthesis

### Phase 2: Intent Data (Q1)
- Bombora integration for topic-level intent
- G2 integration for software evaluation signals
- Website visitor identification

### Phase 3: Automation (Q2)
- Real-time monitoring of leadership changes
- Automated outreach when PULL score crosses threshold
- CRM integration for rep prioritization

---

## Key Insights

1. **PULL isn't demographic** - Company size, industry, and funding are not PULL. They're filters. PULL is behavioral.

2. **Champions have context** - A VP from Flexport at a manual-process company is MORE valuable than someone who's never seen automation.

3. **Bad options reveal urgency** - When a company hires 22 data entry clerks "urgently," they're in pain and willing to spend.

4. **Public pain = internal pressure** - If it's in the earnings call, the board is watching. That creates buying urgency.

5. **Quick wins beat transformations** - "99% accuracy next month" beats "digital transformation" when someone needs a Q1 board win.

---

## Sources

- [Perplexity Sonar API](https://www.perplexity.ai/hub/blog/introducing-the-sonar-pro-api)
- [Coresignal API Documentation](https://docs.coresignal.com/)
- [Bombora Intent Data](https://bombora.com/intent/)
- [G2 + Bombora Integration](https://documentation.g2.com/docs/g2-bombora-integration)
