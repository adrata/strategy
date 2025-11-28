/**
 * Jobs-to-be-Done Analysis for Sellers and Managers
 * 
 * Deep analysis of daily struggles and missing features
 * 
 * Usage: node scripts/jtbd-analysis-and-gaps.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    JOBS-TO-BE-DONE DEEP ANALYSIS                            ║
║              Seller & Manager Daily Struggles → Missing Features             ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// =============================================================================
// SELLER JOBS-TO-BE-DONE
// =============================================================================

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SELLER JOBS-TO-BE-DONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MORNING: "Who should I focus on today?"
───────────────────────────────────────
  Current State: Sellers stare at 500+ accounts, paralyzed by choice
  Emotional: Overwhelmed, anxious about missing the right opportunity
  
  ✅ COVERED: Speedrun ranks prospects
  ✅ COVERED: ICP Scoring identifies best fits
  ⚠️  PARTIAL: Real-time signals could trigger reprioritization
  ❌ MISSING: "Your #1 priority changed because X just happened"

BEFORE A MEETING: "What do I need to know?"
───────────────────────────────────────────
  Current State: Scramble to Google the company, often go in cold
  Emotional: Anxious, unprepared, hoping to wing it
  
  ⚠️  PARTIAL: Company data exists but not summarized for meetings
  ❌ MISSING: AI Meeting Prep Brief - "Here's what you need to know in 2 min"
  ❌ MISSING: Stakeholder insights - "Sarah is analytical, lead with data"

DURING A CALL: "What should I say right now?"
─────────────────────────────────────────────
  Current State: Freeze when objection comes, fumble through pitch
  Emotional: Nervous, self-doubt, fear of rejection
  
  ✅ COVERED: Live Call Coaching (in roadmap)
  ✅ COVERED: Talk ratio indicator
  ⚠️  PARTIAL: Objection handling prompts
  ❌ MISSING: Real-time competitor response when competitor mentioned

AFTER A CALL: "Did that go well? What's next?"
──────────────────────────────────────────────
  Current State: Rush to next call, forget to log notes, lose context
  Emotional: Rushed, forgetful, dropping balls
  
  ✅ COVERED: Audio transcription
  ⚠️  PARTIAL: AI summarization
  ❌ MISSING: Auto-extract next steps and create tasks
  ❌ MISSING: Meeting sentiment score - "That was a 7/10 meeting"

WRITING OUTREACH: "What should I say to get a response?"
────────────────────────────────────────────────────────
  Current State: Stare at blank screen, copy-paste templates that don't work
  Emotional: Creative drain, imposter syndrome
  
  ✅ COVERED: Power Writing AI (Epic 11)
  ✅ COVERED: AIDA Framework
  ✅ COVERED: Mike Manzi templates
  ❌ MISSING: "Send at optimal time" - when is this person most likely to read?
  ❌ MISSING: Channel recommendation - "Email won't work, try LinkedIn"

MANAGING PIPELINE: "Is this deal going to close?"
─────────────────────────────────────────────────
  Current State: Guess at close dates, surprised when deals slip
  Emotional: Uncertainty, fear of missing quota
  
  ⚠️  PARTIAL: At-Risk Deal Alerts in roadmap
  ❌ MISSING: Deal health score with specific reasons
  ❌ MISSING: "This deal is 3 days from stalling - act now"
  ❌ MISSING: Close date prediction based on actual signals

MULTI-THREADING: "Who else should I talk to?"
─────────────────────────────────────────────
  Current State: Single-thread deals, surprised when champion leaves
  Emotional: Exposed, vulnerable
  
  ✅ COVERED: Buyer Group Intelligence (DONE!)
  ✅ COVERED: Champion identification
  ⚠️  PARTIAL: Stakeholder engagement tracking
  ❌ MISSING: "You haven't engaged the CFO - deals like this need finance buy-in"

END OF DAY: "Am I on track for quota?"
──────────────────────────────────────
  Current State: Check spreadsheet, do mental math, stress
  Emotional: Anxiety, uncertainty
  
  ⚠️  PARTIAL: KPI Dashboard in roadmap
  ❌ MISSING: Quota pacing - "You're 15% behind pace, here's how to catch up"
  ❌ MISSING: Daily/weekly progress celebration
`);

// =============================================================================
// MANAGER JOBS-TO-BE-DONE
// =============================================================================

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👔 MANAGER JOBS-TO-BE-DONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MONDAY MORNING: "How is my team's pipeline looking?"
────────────────────────────────────────────────────
  Current State: Manually pull reports, outdated by the time reviewed
  Emotional: Blind, reactive instead of proactive
  
  ⚠️  PARTIAL: Dashboards exist
  ❌ MISSING: AI pipeline summary - "3 things to worry about this week"
  ❌ MISSING: Pipeline movement alerts - "Deal X just went cold"

FORECAST CALL: "What number can I commit to?"
─────────────────────────────────────────────
  Current State: Roll up rep guesses, pad by 20%, still wrong
  Emotional: Exposed, credibility at risk
  
  ❌ MISSING: AI Deal Forecasting - predict based on signals not gut
  ❌ MISSING: Confidence intervals - "70% chance of $450K-$520K"
  ❌ MISSING: Forecast vs. Actual tracking over time

1:1 WITH REP: "What should I coach them on?"
────────────────────────────────────────────
  Current State: Ask "how's it going?", hear what rep wants to share
  Emotional: Missing opportunities to help
  
  ❌ MISSING: 1:1 Prep Brief - "Rep X struggling with discovery, 3 calls had low listen ratio"
  ❌ MISSING: Skill gap identification
  ❌ MISSING: Coaching suggestions based on call analysis

DEAL REVIEW: "Which deals need my help?"
────────────────────────────────────────
  Current State: Review all deals equally, run out of time
  Emotional: Spread thin, not adding value
  
  ⚠️  PARTIAL: Deal prioritization
  ❌ MISSING: "These 3 deals need your attention this week"
  ❌ MISSING: Executive sponsor request - "Deal X needs VP involvement"

POST-QUARTER: "Why did we win/lose?"
────────────────────────────────────
  Current State: Anecdotal feedback, no systematic analysis
  Emotional: Repeating mistakes, missing patterns
  
  ❌ MISSING: Win/Loss Analysis AI
  ❌ MISSING: Pattern detection - "We lose 70% of deals vs Competitor X"
  ❌ MISSING: Process improvement recommendations

HIRING: "How do I ramp new reps fast?"
──────────────────────────────────────
  Current State: Shadow calls, hope they figure it out
  Emotional: Frustrated with ramp time, losing revenue
  
  ❌ MISSING: Onboarding playbooks
  ❌ MISSING: Certification/skill tracking
  ❌ MISSING: "New Rep X is ready for live calls" indicator

TEAM MOTIVATION: "How do I keep energy high?"
─────────────────────────────────────────────
  Current State: Ring a bell for closed deals, that's it
  Emotional: Team burnout, attrition
  
  ✅ COVERED: Gamification (Epic 12!)
  ✅ COVERED: Achievements, streaks
  ⚠️  PARTIAL: Team leaderboard
  ❌ MISSING: Team celebrations - "Team hit 100% of weekly goal!"
`);

// =============================================================================
// MISSING STORIES BASED ON JTBD ANALYSIS
// =============================================================================

const missingStories = [
  // HIGH PRIORITY - SELLER CRITICAL
  {
    number: "NEW-1",
    title: "AI Meeting Prep Briefs",
    priority: "P0",
    epic: "Epic 4: Live Coaching and Real-Time Intelligence",
    description: "As a seller, I want an AI-generated meeting brief 30 minutes before every call so that I walk in prepared and confident.",
    acceptanceCriteria: [
      "Auto-trigger 30 min before calendar events",
      "Include: attendee profiles, company news, deal history",
      "Stakeholder personality insights (analytical vs relational)",
      "Suggested talking points based on deal stage",
      "Previous meeting summary and commitments",
      "Competitive intel if competitor mentioned in deal"
    ],
    jtbd: {
      functional: "Prepare for meetings efficiently",
      identity: "I'm a professional who does their homework",
      emotional: "Confident, not anxious before calls"
    }
  },
  {
    number: "NEW-2",
    title: "Deal Health Score & Stall Predictor",
    priority: "P0",
    epic: "Epic 1: AI-Powered Revenue Intelligence",
    description: "As a seller, I want to see a real-time deal health score with specific risk factors so that I know which deals need attention before they stall.",
    acceptanceCriteria: [
      "Health score 0-100 for every deal",
      "Specific risk factors explained (no activity, missing stakeholders, etc.)",
      "Stall prediction - 'This deal will stall in X days unless...'",
      "Recommended actions to improve health",
      "Historical comparison to similar deals",
      "Notification when health drops below threshold"
    ],
    jtbd: {
      functional: "Know which deals need attention",
      identity: "I'm in control of my pipeline",
      emotional: "Certainty instead of anxiety"
    }
  },
  {
    number: "NEW-3",
    title: "Auto-Extract Meeting Next Steps",
    priority: "P0",
    epic: "Epic 3: Communication Hub (Oasis Evolution)",
    description: "As a seller, I want meeting next steps automatically extracted and turned into tasks so that I never drop the ball after a call.",
    acceptanceCriteria: [
      "AI extracts commitments from transcripts",
      "Auto-create tasks with due dates",
      "Assign to rep or buyer",
      "Track completion",
      "Remind before overdue",
      "Surface in next meeting prep"
    ],
    jtbd: {
      functional: "Remember and execute follow-ups",
      identity: "I'm reliable and organized",
      emotional: "Peace of mind, nothing falls through cracks"
    }
  },
  
  // HIGH PRIORITY - MANAGER CRITICAL
  {
    number: "NEW-4",
    title: "AI Deal Forecasting Engine",
    priority: "P0",
    epic: "Epic 9: Chronicle and Intelligence Reports",
    description: "As a manager, I want AI-powered deal forecasting so that I can commit to accurate numbers with confidence.",
    acceptanceCriteria: [
      "Predict close probability based on signals (not gut)",
      "Confidence intervals (70% chance of $X-$Y)",
      "Commit vs Best Case vs Pipeline view",
      "Historical accuracy tracking",
      "Flag deals where rep forecast differs from AI",
      "Drill down into prediction factors"
    ],
    jtbd: {
      functional: "Predict revenue accurately",
      identity: "I'm a credible leader",
      emotional: "Confidence in forecast calls"
    }
  },
  {
    number: "NEW-5",
    title: "Manager 1:1 Prep Intelligence",
    priority: "P1",
    epic: "Epic 9: Chronicle and Intelligence Reports",
    description: "As a manager, I want AI-generated 1:1 prep briefs so that I can coach effectively instead of just checking in.",
    acceptanceCriteria: [
      "Rep performance summary (activity, results, trends)",
      "Skill gaps identified from call analysis",
      "Specific coaching recommendations",
      "Deals that need discussion",
      "Wins to celebrate",
      "Development goals progress"
    ],
    jtbd: {
      functional: "Coach reps effectively",
      identity: "I'm a leader who develops people",
      emotional: "Valuable, not just checking boxes"
    }
  },
  {
    number: "NEW-6",
    title: "Win/Loss Analysis AI",
    priority: "P1",
    epic: "Epic 9: Chronicle and Intelligence Reports",
    description: "As a manager, I want automatic win/loss analysis so that I can learn from every deal outcome and improve our process.",
    acceptanceCriteria: [
      "Auto-analyze all closed deals",
      "Pattern detection (why we win, why we lose)",
      "Competitor win/loss rates",
      "Process bottleneck identification",
      "Rep-level insights",
      "Actionable recommendations"
    ],
    jtbd: {
      functional: "Learn from outcomes",
      identity: "I'm a data-driven leader",
      emotional: "Learning, not repeating mistakes"
    }
  },
  
  // HIGH PRIORITY - SELLER EFFICIENCY
  {
    number: "NEW-7",
    title: "Smart Channel Recommendation",
    priority: "P1",
    epic: "Epic 6: Automation and Workflows (Olympus)",
    description: "As a seller, I want Adrata to recommend the best channel (email, call, LinkedIn) for each prospect so that I reach them where they're most responsive.",
    acceptanceCriteria: [
      "Analyze historical response rates by channel",
      "Consider persona (executives prefer X, ICs prefer Y)",
      "Time-of-day optimization",
      "Recommend specific channel for next touch",
      "Learn from outcomes"
    ],
    jtbd: {
      functional: "Reach prospects effectively",
      identity: "I'm smart about how I engage",
      emotional: "Efficient, not wasting time"
    }
  },
  {
    number: "NEW-8",
    title: "Quota Pacing & Recovery Suggestions",
    priority: "P1",
    epic: "Epic 9: Chronicle and Intelligence Reports",
    description: "As a seller, I want to see my quota pacing with specific suggestions to catch up so that I always know where I stand and what to do.",
    acceptanceCriteria: [
      "Daily/weekly/monthly pacing vs quota",
      "Visual progress indicator",
      "If behind: specific deals to accelerate",
      "If ahead: deals to pull forward",
      "Historical comparison (better/worse than last month)",
      "Celebration when hitting milestones"
    ],
    jtbd: {
      functional: "Track progress toward goal",
      identity: "I'm hitting my numbers",
      emotional: "In control, not surprised at month end"
    }
  },
  {
    number: "NEW-9",
    title: "Competitive Mention Alerts & Battlecards",
    priority: "P1",
    epic: "Epic 5: Data Enrichment and ICP Discovery",
    description: "As a seller, I want instant alerts when a competitor is mentioned in a deal, with battlecard responses, so that I can handle competitive situations confidently.",
    acceptanceCriteria: [
      "Detect competitor mentions in calls/emails",
      "Instant notification to rep",
      "Pull up relevant battlecard",
      "Win themes vs this competitor",
      "Trap questions to ask",
      "Track competitive deal outcomes"
    ],
    jtbd: {
      functional: "Win competitive deals",
      identity: "I know how to beat competitors",
      emotional: "Confident in competitive situations"
    }
  },
  {
    number: "NEW-10",
    title: "Engagement Signal Alerts",
    priority: "P1",
    epic: "Epic 6: Automation and Workflows (Olympus)",
    description: "As a seller, I want real-time alerts when prospects engage (email opens, doc views, website visits) so that I can strike while the iron is hot.",
    acceptanceCriteria: [
      "Email open/click notifications",
      "Proposal/document view alerts",
      "Website visit tracking",
      "Multiple opens = hot signal",
      "Suggest immediate action",
      "Integrate with Speedrun priority"
    ],
    jtbd: {
      functional: "Act on buyer interest signals",
      identity: "I respond when buyers are engaged",
      emotional: "Opportunistic, not missing moments"
    }
  },
  
  // MEDIUM PRIORITY - PLATFORM
  {
    number: "NEW-11",
    title: "Mobile Push Notifications",
    priority: "P1",
    epic: "Epic 2: Multi-Platform Excellence",
    description: "As a field seller, I want push notifications on mobile so that I never miss important deal signals or meeting reminders.",
    acceptanceCriteria: [
      "Deal stage changes",
      "Email opens/clicks",
      "Meeting reminders with prep summary",
      "At-risk deal alerts",
      "Achievement unlocks",
      "Customizable notification rules"
    ],
    jtbd: {
      functional: "Stay informed on the go",
      identity: "I'm always on top of my deals",
      emotional: "Connected, not missing things"
    }
  },
  {
    number: "NEW-12",
    title: "Mutual Action Plans",
    priority: "P1",
    epic: "Epic 3: Communication Hub (Oasis Evolution)",
    description: "As a seller, I want to create shared action plans with buyers so that we're aligned on the path to close.",
    acceptanceCriteria: [
      "Collaborative timeline with buyer",
      "Tasks for both sides",
      "Progress tracking visible to all",
      "Auto-reminders for overdue items",
      "Integration with deal stages",
      "Branded, shareable view"
    ],
    jtbd: {
      functional: "Align with buyers on next steps",
      identity: "I run a professional process",
      emotional: "Control, mutual commitment"
    }
  }
];

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RECOMMENDED NEW STORIES (Based on JTBD Analysis)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

missingStories.forEach((story, i) => {
  console.log(`
${i+1}. ${story.title} [${story.priority}]
   Epic: ${story.epic}
   
   "${story.description}"
   
   JTBD:
   ├─ Functional: ${story.jtbd.functional}
   ├─ Identity:   ${story.jtbd.identity}
   └─ Emotional:  ${story.jtbd.emotional}
`);
});

// Summary
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT ROADMAP COVERAGE:
  ✅ Strong: Prospecting (Speedrun, ICP, Buyer Groups)
  ✅ Strong: Communication (Oasis, Email)
  ✅ Strong: Gamification (unique differentiator!)
  ✅ Strong: AI Writing (Power Writing, frameworks)
  
  ⚠️  Partial: Manager tools (need more coaching support)
  ⚠️  Partial: Deal intelligence (health, forecasting)
  ⚠️  Partial: Mobile experience
  
  ❌ Missing: Meeting prep automation
  ❌ Missing: AI forecasting
  ❌ Missing: Win/loss analysis
  ❌ Missing: Engagement signals
  ❌ Missing: Competitive intelligence

RECOMMENDED ADDITIONS: 12 new stories
  P0 (Critical):  3 stories
  P1 (High):      9 stories

These additions would make Adrata truly complete for:
  • Individual sellers doing daily prospecting
  • Account executives managing complex deals
  • SDRs doing high-volume outreach
  • Sales managers coaching teams
  • VP Sales forecasting revenue
  • RevOps analyzing performance
`);

// Save analysis
const fs = require('fs');
fs.writeFileSync(
  'scripts/jtbd-missing-stories.json',
  JSON.stringify(missingStories, null, 2)
);

console.log(`
📁 Analysis saved to: scripts/jtbd-missing-stories.json

Would you like me to add these 12 stories to Stacks?
Run: node scripts/add-jtbd-stories.js
`);

process.exit(0);

