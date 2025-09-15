#!/usr/bin/env node

/**
 * 🔍 DETAILED DANO ACTION ANALYSIS
 * 
 * This script provides deeper insights into:
 * 1. Why there's no back-and-forth communication detected
 * 2. Entity linking patterns and issues
 * 3. Email conversation analysis
 * 4. Action type linking completeness
 */

const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

// Dano's workspace and user details
const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
const DANO_EMAIL = 'dano@retail-products.com';

async function detailedDanoActionAnalysis() {
  console.log('🔍 DETAILED DANO ACTION ANALYSIS');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 1. EMAIL CONVERSATION DEEP DIVE
    await analyzeEmailConversations();
    
    // 2. ENTITY LINKING DEEP DIVE
    await analyzeEntityLinkingPatterns();
    
    // 3. ACTION TYPE LINKING ANALYSIS
    await analyzeActionTypeLinking();
    
    // 4. COMMUNICATION DIRECTION ANALYSIS
    await analyzeCommunicationDirection();
    
    // 5. SAMPLE ACTION EXAMPLES
    await showSampleActions();
    
    // 6. LINKING RECOMMENDATIONS
    await provideLinkingRecommendations();

  } catch (error) {
    console.error('❌ Error in detailed analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function analyzeEmailConversations() {
  console.log('📧 EMAIL CONVERSATION DEEP DIVE');
  console.log('-'.repeat(40));
  
  // Get sample email conversations with metadata
  const emailConversations = await prisma.actions.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: 'email_conversation'
    },
    select: {
      id: true,
      subject: true,
      metadata: true,
      personId: true,
      companyId: true,
      leadId: true,
      prospectId: true,
      createdAt: true
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`   Sample Email Conversations (showing first 10):`);
  emailConversations.forEach((action, index) => {
    const metadata = action.metadata || {};
    const direction = metadata.direction || 'unknown';
    const from = metadata.from || 'unknown';
    const to = metadata.to || 'unknown';
    
    console.log(`   ${index + 1}. [${direction}] ${action.subject}`);
    console.log(`      From: ${from}`);
    console.log(`      To: ${to}`);
    console.log(`      Person: ${action.personId || 'none'}`);
    console.log(`      Company: ${action.companyId || 'none'}`);
    console.log(`      Date: ${action.createdAt.toISOString().split('T')[0]}`);
    console.log('');
  });
  
  // Analyze email conversation metadata
  const allEmailConversations = await prisma.actions.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: 'email_conversation',
      metadata: { not: Prisma.JsonNull }
    },
    select: {
      metadata: true
    }
  });
  
  let outboundCount = 0;
  let inboundCount = 0;
  let unknownDirection = 0;
  let withFromField = 0;
  let withToField = 0;
  
  allEmailConversations.forEach(action => {
    const metadata = action.metadata || {};
    
    if (metadata.direction === 'outbound') {
      outboundCount++;
    } else if (metadata.direction === 'inbound') {
      inboundCount++;
    } else {
      unknownDirection++;
    }
    
    if (metadata.from) withFromField++;
    if (metadata.to) withToField++;
  });
  
  console.log(`   Email Conversation Metadata Analysis:`);
  console.log(`   Total with Metadata: ${allEmailConversations.length.toLocaleString()}`);
  console.log(`   Outbound: ${outboundCount.toLocaleString()}`);
  console.log(`   Inbound: ${inboundCount.toLocaleString()}`);
  console.log(`   Unknown Direction: ${unknownDirection.toLocaleString()}`);
  console.log(`   With From Field: ${withFromField.toLocaleString()}`);
  console.log(`   With To Field: ${withToField.toLocaleString()}`);
  console.log('');
}

async function analyzeEntityLinkingPatterns() {
  console.log('🔗 ENTITY LINKING PATTERNS ANALYSIS');
  console.log('-'.repeat(40));
  
  // Analyze which action types are most likely to be linked
  const actionTypeLinking = await prisma.actions.groupBy({
    by: ['type'],
    where: { workspaceId: DANO_WORKSPACE_ID },
    _count: { type: true }
  });
  
  console.log(`   Action Type Linking Patterns:`);
  for (const action of actionTypeLinking.slice(0, 15)) {
    const total = action._count.type;
    const withPerson = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        type: action.type,
        personId: { not: null }
      }
    });
    const withCompany = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        type: action.type,
        companyId: { not: null }
      }
    });
    
    console.log(`   ${action.type}:`);
    console.log(`      Total: ${total.toLocaleString()}`);
    console.log(`      With Person: ${withPerson.toLocaleString()} (${((withPerson / total) * 100).toFixed(1)}%)`);
    console.log(`      With Company: ${withCompany.toLocaleString()} (${((withCompany / total) * 100).toFixed(1)}%)`);
    console.log('');
  }
}

async function analyzeActionTypeLinking() {
  console.log('🎯 ACTION TYPE LINKING COMPLETENESS');
  console.log('-'.repeat(40));
  
  // Get all action types and their linking status
  const actionTypes = await prisma.actions.groupBy({
    by: ['type'],
    where: { workspaceId: DANO_WORKSPACE_ID },
    _count: { type: true }
  });
  
  console.log(`   Action Type Linking Status:`);
  
  for (const actionType of actionTypes.slice(0, 20)) {
    const total = actionType._count.type;
    
    const linked = await prisma.actions.count({
      where: {
        workspaceId: DANO_WORKSPACE_ID,
        type: actionType.type,
        OR: [
          { personId: { not: null } },
          { companyId: { not: null } },
          { leadId: { not: null } },
          { prospectId: { not: null } },
          { opportunityId: { not: null } }
        ]
      }
    });
    
    const orphaned = total - linked;
    const linkingRate = ((linked / total) * 100).toFixed(1);
    
    console.log(`   ${actionType.type}:`);
    console.log(`      Total: ${total.toLocaleString()}`);
    console.log(`      Linked: ${linked.toLocaleString()} (${linkingRate}%)`);
    console.log(`      Orphaned: ${orphaned.toLocaleString()} (${(100 - parseFloat(linkingRate)).toFixed(1)}%)`);
    console.log('');
  }
}

async function analyzeCommunicationDirection() {
  console.log('🔄 COMMUNICATION DIRECTION ANALYSIS');
  console.log('-'.repeat(40));
  
  // Analyze email_sent vs email_received
  const emailSent = await prisma.actions.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: 'email_sent'
    },
    select: {
      id: true,
      subject: true,
      personId: true,
      companyId: true,
      metadata: true,
      createdAt: true
    },
    take: 5
  });
  
  const emailReceived = await prisma.actions.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: 'email_received'
    },
    select: {
      id: true,
      subject: true,
      personId: true,
      companyId: true,
      metadata: true,
      createdAt: true
    },
    take: 5
  });
  
  console.log(`   Sample Email Sent Actions:`);
  emailSent.forEach((action, index) => {
    console.log(`   ${index + 1}. ${action.subject}`);
    console.log(`      Person: ${action.personId || 'none'}`);
    console.log(`      Company: ${action.companyId || 'none'}`);
    console.log(`      Date: ${action.createdAt.toISOString().split('T')[0]}`);
    console.log('');
  });
  
  console.log(`   Sample Email Received Actions:`);
  emailReceived.forEach((action, index) => {
    console.log(`   ${index + 1}. ${action.subject}`);
    console.log(`      Person: ${action.personId || 'none'}`);
    console.log(`      Company: ${action.companyId || 'none'}`);
    console.log(`      Date: ${action.createdAt.toISOString().split('T')[0]}`);
    console.log('');
  });
  
  // Check if we have any email_received actions
  const emailReceivedCount = await prisma.actions.count({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      type: 'email_received'
    }
  });
  
  console.log(`   Email Received Count: ${emailReceivedCount.toLocaleString()}`);
  console.log('');
}

async function showSampleActions() {
  console.log('📋 SAMPLE ACTION EXAMPLES');
  console.log('-'.repeat(40));
  
  // Show sample actions with different linking patterns
  const sampleActions = await prisma.actions.findMany({
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      OR: [
        { personId: { not: null } },
        { companyId: { not: null } },
        { leadId: { not: null } },
        { prospectId: { not: null } }
      ]
    },
    select: {
      id: true,
      type: true,
      subject: true,
      personId: true,
      companyId: true,
      leadId: true,
      prospectId: true,
      createdAt: true
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`   Sample Linked Actions:`);
  sampleActions.forEach((action, index) => {
    const entities = [];
    if (action.personId) entities.push(`Person: ${action.personId}`);
    if (action.companyId) entities.push(`Company: ${action.companyId}`);
    if (action.leadId) entities.push(`Lead: ${action.leadId}`);
    if (action.prospectId) entities.push(`Prospect: ${action.prospectId}`);
    
    console.log(`   ${index + 1}. [${action.type}] ${action.subject}`);
    console.log(`      Entities: ${entities.join(', ')}`);
    console.log(`      Date: ${action.createdAt.toISOString().split('T')[0]}`);
    console.log('');
  });
}

async function provideLinkingRecommendations() {
  console.log('💡 LINKING RECOMMENDATIONS');
  console.log('-'.repeat(40));
  
  // Count orphaned actions by type
  const orphanedByType = await prisma.actions.groupBy({
    by: ['type'],
    where: {
      workspaceId: DANO_WORKSPACE_ID,
      personId: null,
      companyId: null,
      leadId: null,
      prospectId: null,
      opportunityId: null
    },
    _count: { type: true },
    orderBy: { _count: { type: 'desc' } }
  });
  
  console.log(`   Top Orphaned Action Types (Priority for Linking):`);
  orphanedByType.slice(0, 10).forEach((action, index) => {
    console.log(`   ${index + 1}. ${action.type}: ${action._count.type.toLocaleString()} orphaned actions`);
  });
  
  console.log('');
  console.log(`   Recommendations:`);
  console.log(`   1. Focus on linking email_conversation actions (${orphanedByType.find(a => a.type === 'email_conversation')?._count.type || 0} orphaned)`);
  console.log(`   2. Implement email parsing to extract person/company from email addresses`);
  console.log(`   3. Create automated linking based on email metadata`);
  console.log(`   4. Link person_created and company_created actions to their respective entities`);
  console.log(`   5. Implement back-and-forth detection using email thread analysis`);
  console.log('');
}

// Run the analysis
if (require.main === module) {
  detailedDanoActionAnalysis().catch(console.error);
}

module.exports = { detailedDanoActionAnalysis };
