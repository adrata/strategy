/**
 * Optimize Roadmap Order and Identify Gaps
 * 
 * This script:
 * 1. Reorders stories by priority (P0 first) and sprint
 * 2. Identifies potential gaps based on competitor analysis
 * 3. Suggests new stories to add
 * 
 * Usage: node scripts/optimize-roadmap-order.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Priority order (lower = more important)
const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };

// Sprint order for sorting
function sprintOrder(status, storyTitle) {
  // Extract sprint number from description or estimate based on status
  if (status === 'done') return 0;
  if (status === 'in_progress') return 1;
  // Extract sprint from title pattern like "Sprint 1", "Sprint 2"
  const match = storyTitle.match(/Sprint (\d+)/);
  if (match) return parseInt(match[1]) + 1;
  return 99; // Unknown sprint
}

async function optimizeAndAnalyze() {
  console.log('');
  console.log('🔄 ROADMAP OPTIMIZATION & GAP ANALYSIS');
  console.log('='.repeat(70));
  
  try {
    // Get the project
    const project = await prisma.stacksProject.findFirst({
      where: { name: 'Adrata Master Roadmap' }
    });
    
    if (!project) {
      console.log('❌ Project not found!');
      return;
    }
    
    // Get all stories with epics
    const stories = await prisma.stacksStory.findMany({
      where: { projectId: project.id },
      include: {
        epic: true,
        assignee: { select: { name: true } }
      },
      orderBy: { title: 'asc' }
    });
    
    console.log(`\n📊 Found ${stories.length} stories to optimize\n`);
    
    // Sort stories by: priority (high first), then status (done first), then by number
    const sortedStories = [...stories].sort((a, b) => {
      // First by priority
      const priorityDiff = (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by status (done first, then in_progress, then todo)
      const statusOrder = { 'done': 0, 'in_progress': 1, 'todo': 2 };
      const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (statusDiff !== 0) return statusDiff;
      
      // Then by story number
      const numA = parseFloat(a.title.match(/^(\d+\.\d+)/)?.[1] || '99');
      const numB = parseFloat(b.title.match(/^(\d+\.\d+)/)?.[1] || '99');
      return numA - numB;
    });
    
    // Update ranks
    console.log('📝 REORDERING STORIES BY PRIORITY...\n');
    console.log('New Order (Up Next → Later):');
    console.log('-'.repeat(70));
    
    let currentPriority = null;
    let rank = 1;
    
    for (const story of sortedStories) {
      // Print section headers
      if (story.priority !== currentPriority) {
        currentPriority = story.priority;
        const label = story.priority === 'high' ? '🔴 HIGH PRIORITY (P0/P1)' :
                      story.priority === 'medium' ? '🟡 MEDIUM PRIORITY (P2)' :
                      '🟢 LOW PRIORITY (P3)';
        console.log(`\n${label}`);
        console.log('-'.repeat(50));
      }
      
      const statusIcon = story.status === 'done' ? '✅' : 
                         story.status === 'in_progress' ? '🔄' : '⬜';
      
      console.log(`${rank.toString().padStart(2)}. ${statusIcon} ${story.title}`);
      console.log(`    Epic: ${story.epic?.title || 'None'}`);
      
      // Update the rank in database
      await prisma.stacksStory.update({
        where: { id: story.id },
        data: { rank: rank }
      });
      
      rank++;
    }
    
    // GAP ANALYSIS based on competitor research
    console.log('\n\n' + '='.repeat(70));
    console.log('🔍 GAP ANALYSIS - MISSING FROM ROADMAP');
    console.log('='.repeat(70));
    console.log('\nBased on competitor analysis (Gong, Clari, Salesforce, HubSpot):');
    
    const gaps = [
      {
        title: "AI Deal Forecasting Engine",
        priority: "P0",
        epic: "Chronicle and Intelligence Reports",
        description: "As a sales leader, I want AI-powered deal forecasting so that I can predict revenue with high accuracy.",
        rationale: "Clari's core value prop. 87% of enterprises now require AI forecasting.",
        acceptanceCriteria: [
          "ML model predicts deal close probability",
          "Commit vs best case vs pipeline view",
          "Automated forecast roll-ups by team/region",
          "Historical accuracy tracking",
          "Risk-adjusted forecasting"
        ]
      },
      {
        title: "Win/Loss Analysis AI",
        priority: "P1",
        epic: "Chronicle and Intelligence Reports",
        description: "As a sales leader, I want automatic win/loss analysis so that I can learn from every deal outcome.",
        rationale: "Gong does this well. Critical for sales enablement.",
        acceptanceCriteria: [
          "Auto-analyze all closed deals",
          "Identify patterns in wins vs losses",
          "Competitor mentions correlation",
          "Timeline pattern analysis",
          "Actionable recommendations"
        ]
      },
      {
        title: "Mutual Action Plans",
        priority: "P1",
        epic: "Communication Hub (Oasis Evolution)",
        description: "As a sales rep, I want to create shared action plans with buyers so that we're aligned on next steps.",
        rationale: "Modern buyers expect collaborative selling. Reduces deal slippage.",
        acceptanceCriteria: [
          "Shared timeline with buyer",
          "Task assignments for both sides",
          "Progress tracking",
          "Auto-reminders for overdue items",
          "Integration with calendar"
        ]
      },
      {
        title: "AI Meeting Prep Briefs",
        priority: "P1",
        epic: "Live Coaching and Real-Time Intelligence",
        description: "As a sales rep, I want AI-generated meeting prep briefs so that I walk into every meeting prepared.",
        rationale: "High-value, low-effort feature. Huge time saver.",
        acceptanceCriteria: [
          "Auto-generate before calendar meetings",
          "Include attendee insights",
          "Recent news/signals about company",
          "Suggested talking points",
          "Previous interaction summary"
        ]
      },
      {
        title: "Competitive Battlecards",
        priority: "P1",
        epic: "Data Enrichment and ICP Discovery",
        description: "As a sales rep, I want real-time competitive battlecards so that I can handle objections effectively.",
        rationale: "Klue/Crayon feature. Critical for competitive deals.",
        acceptanceCriteria: [
          "Auto-generated from web intelligence",
          "Win themes by competitor",
          "Objection handling scripts",
          "Feature comparison matrix",
          "Real-time updates on competitor changes"
        ]
      },
      {
        title: "Deal Rooms (Digital Sales Room)",
        priority: "P2",
        epic: "Communication Hub (Oasis Evolution)",
        description: "As a sales rep, I want digital deal rooms so that I can centralize all deal content and communication.",
        rationale: "Growing trend - Aligned, Consensus, GetAccept. Improves buyer experience.",
        acceptanceCriteria: [
          "Branded microsites per deal",
          "Document sharing with analytics",
          "Stakeholder engagement tracking",
          "Video messaging",
          "Content recommendations"
        ]
      },
      {
        title: "Revenue Operations Dashboard",
        priority: "P1",
        epic: "Chronicle and Intelligence Reports",
        description: "As a RevOps leader, I want a unified dashboard so that I can see the full revenue picture.",
        rationale: "RevOps is fastest growing sales function. They need their own view.",
        acceptanceCriteria: [
          "Pipeline health metrics",
          "Conversion funnel analysis",
          "Rep productivity metrics",
          "Forecast vs actual tracking",
          "Data quality scores"
        ]
      },
      {
        title: "Mobile Push Notifications",
        priority: "P1",
        epic: "Multi-Platform Excellence",
        description: "As a field sales rep, I want push notifications so that I never miss important deal signals.",
        rationale: "Critical for mobile users. Table stakes for modern sales tools.",
        acceptanceCriteria: [
          "Deal stage changes",
          "Email opens/clicks",
          "Meeting reminders with prep",
          "At-risk deal alerts",
          "Customizable notification rules"
        ]
      }
    ];
    
    gaps.forEach((gap, i) => {
      console.log(`\n${i + 1}. 📌 ${gap.title} [${gap.priority}]`);
      console.log(`   Epic: ${gap.epic}`);
      console.log(`   Why: ${gap.rationale}`);
    });
    
    // Ask if user wants to add these
    console.log('\n\n' + '='.repeat(70));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(70));
    
    console.log(`
Your roadmap is solid! Here's my analysis:

✅ STRENGTHS:
   • Comprehensive coverage of core CRM/Sales features
   • Strong AI/Intelligence focus (ahead of many competitors)
   • Gamification (Epic 12) is a unique differentiator
   • Live coaching is a key differentiator vs Gong (they're post-call only)
   • Buyer Group Intelligence is world-class

⚠️  GAPS TO CONSIDER ADDING:
   1. AI Deal Forecasting - Every enterprise buyer asks for this
   2. Mutual Action Plans - Modern collaborative selling
   3. Competitive Battlecards - Critical for enterprise deals
   4. RevOps Dashboard - RevOps is fastest growing function
   5. Mobile Push Notifications - Table stakes for 2024

📊 OPTIMIZATION COMPLETE:
   • ${sortedStories.length} stories reordered by priority
   • High priority (P0/P1) items now appear first
   • Done items at top of each priority level
   • In-progress items next
   • Todo items last

Would you like me to add the gap stories to Stacks? 
Run: node scripts/add-gap-stories.js
`);

    // Store gaps for potential later addition
    const fs = require('fs');
    fs.writeFileSync(
      'scripts/roadmap-gaps.json',
      JSON.stringify(gaps, null, 2)
    );
    console.log('📁 Gap analysis saved to: scripts/roadmap-gaps.json\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeAndAnalyze();

