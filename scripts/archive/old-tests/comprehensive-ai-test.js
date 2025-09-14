#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE AI UNDERSTANDING TEST
 * 
 * Tests what users want to KNOW, ASK, and DO:
 * - KNOW: Pipeline status, lead details, opportunities
 * - ASK: Questions about data, insights, recommendations
 * - DO: CRUD operations, actions, workflow automation
 */

const { PrismaClient } = require('@prisma/client');

async function testAIComprehensiveUnderstanding() {
  console.log('🧪 COMPREHENSIVE AI UNDERSTANDING TEST\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Test specific lead from URL
    const kevinMartinezId = 'cmedlsuy9000npcbgp8x27nid';
    
    console.log('=== TESTING SPECIFIC LEAD UNDERSTANDING ===');
    console.log(`Testing lead: ${kevinMartinezId}`);
    
    const kevinLead = await prisma.lead.findUnique({
      where: { id: kevinMartinezId },
      include: {
        opportunities: true,
        leadNotes: true,
        activities: true
      }
    });
    
    if (kevinLead) {
      console.log('✅ Found Kevin Martinez:', {
        name: kevinLead.fullName,
        company: kevinLead.company,
        title: kevinLead.jobTitle,
        email: kevinLead.email,
        status: kevinLead.status,
        opportunities: kevinLead.opportunities?.length || 0,
        notes: kevinLead.leadNotes?.length || 0
      });
    } else {
      console.log('❌ Kevin Martinez lead not found');
    }
    
    // Test AI scenarios for what users want to KNOW
    console.log('\n=== TESTING: WHAT USERS WANT TO KNOW ===');
    
    const knowScenarios = [
      {
        question: "What's Kevin Martinez's current status and next steps?",
        context: kevinLead,
        expectedKnowledge: ['status', 'next actions', 'timeline', 'priority']
      },
      {
        question: "Show me my pipeline health today",
        context: null,
        expectedKnowledge: ['lead counts', 'conversion rates', 'bottlenecks', 'opportunities']
      },
      {
        question: "What opportunities are in my pipeline?",
        context: null,
        expectedKnowledge: ['opportunity list', 'values', 'stages', 'close dates']
      }
    ];
    
    for (const scenario of knowScenarios) {
      console.log(`\n📊 KNOW Test: "${scenario.question}"`);
      await testAIScenario(scenario.question, scenario.context, 'know');
    }
    
    // Test AI scenarios for what users want to ASK
    console.log('\n=== TESTING: WHAT USERS WANT TO ASK ===');
    
    const askScenarios = [
      {
        question: "Why hasn't Kevin Martinez responded to my emails?",
        context: kevinLead,
        expectedInsights: ['engagement analysis', 'timing suggestions', 'alternative approaches']
      },
      {
        question: "Which leads should I prioritize this week?",
        context: null,
        expectedInsights: ['scoring criteria', 'urgency factors', 'revenue potential']
      },
      {
        question: "How can I improve my conversion rate?",
        context: null,
        expectedInsights: ['performance analysis', 'best practices', 'actionable recommendations']
      }
    ];
    
    for (const scenario of askScenarios) {
      console.log(`\n❓ ASK Test: "${scenario.question}"`);
      await testAIScenario(scenario.question, scenario.context, 'ask');
    }
    
    // Test AI scenarios for what users want to DO
    console.log('\n=== TESTING: WHAT USERS WANT TO DO ===');
    
    const doScenarios = [
      {
        action: "Update Kevin Martinez's status to 'qualified' and add a note",
        context: kevinLead,
        expectedCapabilities: ['CRUD operations', 'data validation', 'workflow automation']
      },
      {
        action: "Create a follow-up task for next Tuesday",
        context: kevinLead,
        expectedCapabilities: ['task creation', 'scheduling', 'reminders']
      },
      {
        action: "Generate a personalized email for Kevin Martinez",
        context: kevinLead,
        expectedCapabilities: ['content generation', 'personalization', 'template usage']
      }
    ];
    
    for (const scenario of doScenarios) {
      console.log(`\n⚡ DO Test: "${scenario.action}"`);
      await testAIScenario(scenario.action, scenario.context, 'do');
    }
    
    // Test CRUD Operations
    console.log('\n=== TESTING: CRUD OPERATIONS ===');
    
    const crudTests = [
      {
        operation: 'CREATE',
        request: 'Create a new lead for Sarah Johnson at Target, email sarah.johnson@target.com',
        expectedResult: 'Lead creation with proper validation'
      },
      {
        operation: 'READ',
        request: 'Show me all leads from retail companies with status "qualified"',
        expectedResult: 'Filtered lead list with relevant details'
      },
      {
        operation: 'UPDATE',
        request: 'Update Kevin Martinez priority to high and add note about upcoming meeting',
        expectedResult: 'Field updates with audit trail'
      },
      {
        operation: 'DELETE',
        request: 'Archive the duplicate lead for John Smith at Walmart',
        expectedResult: 'Safe deletion with confirmation'
      }
    ];
    
    for (const test of crudTests) {
      console.log(`\n🔧 CRUD ${test.operation}: "${test.request}"`);
      await testAIScenario(test.request, kevinLead, 'crud');
    }
    
    // Test Database Understanding
    console.log('\n=== TESTING: DATABASE UNDERSTANDING ===');
    
    const dbTests = [
      {
        query: 'What fields are available for leads?',
        expectedKnowledge: 'Schema understanding, field types, relationships'
      },
      {
        query: 'How are leads connected to opportunities?',
        expectedKnowledge: 'Relationship mapping, foreign keys, data flow'
      },
      {
        query: 'What validation rules apply to lead creation?',
        expectedKnowledge: 'Business rules, constraints, required fields'
      }
    ];
    
    for (const test of dbTests) {
      console.log(`\n🗄️ DB Test: "${test.query}"`);
      await testAIScenario(test.query, null, 'database');
    }
    
    // Test Real Pipeline Data
    console.log('\n=== TESTING: REAL PIPELINE DATA UNDERSTANDING ===');
    
    const pipelineStats = await getPipelineStats(prisma);
    console.log('📊 Current Pipeline Stats:', pipelineStats);
    
    const pipelineTests = [
      `I have ${pipelineStats.totalLeads} leads in my pipeline. What should I focus on?`,
      `My conversion rate is ${pipelineStats.conversionRate}%. How can I improve it?`,
      `I have ${pipelineStats.qualifiedLeads} qualified leads. Which ones should I call first?`
    ];
    
    for (const test of pipelineTests) {
      console.log(`\n📈 Pipeline Test: "${test}"`);
      await testAIScenario(test, pipelineStats, 'pipeline');
    }
    
    console.log('\n🎯 COMPREHENSIVE TEST SUMMARY:');
    console.log('✅ User KNOW scenarios - Tested');
    console.log('✅ User ASK scenarios - Tested');
    console.log('✅ User DO scenarios - Tested');
    console.log('✅ CRUD operations - Tested');
    console.log('✅ Database understanding - Tested');
    console.log('✅ Real pipeline data - Tested');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testAIScenario(message, context, type) {
  try {
    const testContext = {
      message,
      appType: "Pipeline",
      workspaceId: "01K1VBYV8ETM2RCQA4GNN9EG72",
      userId: "01K1VBYYV7TRPY04NW4TW4XWRB",
      conversationHistory: [],
      currentRecord: context,
      recordType: context ? 'pipeline-lead' : null
    };
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testContext)
    });
    
    if (response.ok) {
      const data = await response.json();
      const responseText = data.response || '';
      
      console.log(`  ✅ AI Response (${responseText.length} chars):`, 
        responseText.substring(0, 150) + (responseText.length > 150 ? '...' : ''));
      
      // Analyze response quality
      const quality = analyzeResponseQuality(responseText, type, context);
      console.log(`  📊 Quality Score: ${quality.score}/10`);
      console.log(`  🎯 Key Strengths: ${quality.strengths.join(', ')}`);
      
      if (quality.weaknesses.length > 0) {
        console.log(`  ⚠️ Areas for improvement: ${quality.weaknesses.join(', ')}`);
      }
      
    } else {
      console.log(`  ❌ API Error: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Test Error: ${error.message}`);
  }
}

function analyzeResponseQuality(response, type, context) {
  const analysis = {
    score: 0,
    strengths: [],
    weaknesses: []
  };
  
  const lowerResponse = response.toLowerCase();
  
  // Base score
  analysis.score = 5;
  
  // Context awareness
  if (context && (lowerResponse.includes(context.fullName?.toLowerCase()) || 
                  lowerResponse.includes(context.company?.toLowerCase()))) {
    analysis.score += 2;
    analysis.strengths.push('Context-aware');
  } else if (context) {
    analysis.weaknesses.push('Missing context reference');
  }
  
  // Specificity
  if (lowerResponse.includes('pipeline') || lowerResponse.includes('lead') || 
      lowerResponse.includes('opportunity')) {
    analysis.score += 1;
    analysis.strengths.push('Domain-specific');
  }
  
  // Actionability
  if (lowerResponse.includes('recommend') || lowerResponse.includes('suggest') || 
      lowerResponse.includes('next step') || lowerResponse.includes('should')) {
    analysis.score += 1;
    analysis.strengths.push('Actionable');
  }
  
  // Data references
  if (/\d+/.test(response)) {
    analysis.score += 1;
    analysis.strengths.push('Data-driven');
  }
  
  // Length appropriateness
  if (response.length > 100 && response.length < 500) {
    analysis.strengths.push('Appropriate length');
  } else if (response.length < 50) {
    analysis.weaknesses.push('Too brief');
  } else if (response.length > 800) {
    analysis.weaknesses.push('Too verbose');
  }
  
  return analysis;
}

async function getPipelineStats(prisma) {
  const totalLeads = await prisma.lead.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  
  const qualifiedLeads = await prisma.lead.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      status: 'qualified'
    }
  });
  
  const opportunities = await prisma.opportunity.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  
  return {
    totalLeads,
    qualifiedLeads,
    opportunities,
    conversionRate: totalLeads > 0 ? Math.round((opportunities / totalLeads) * 100) : 0
  };
}

// Run the comprehensive test
testAIComprehensiveUnderstanding().catch(console.error);
