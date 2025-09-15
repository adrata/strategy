#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function auditCoreActions() {
  const prisma = new PrismaClient();
  
  console.log('🔍 AUDITING CORE ACTION TYPES FOR DANO');
  console.log('======================================');
  console.log('Workspace: Retail Product Solutions (01K1VBYV8ETM2RCQA4GNN9EG72)');
  console.log('User: Dano (dano@retail-products.com)');
  
  const stats = {
    email: { total: 0, linked: 0, sample: [] },
    linkedin: { total: 0, linked: 0, sample: [] },
    call: { total: 0, linked: 0, sample: [] },
    meeting: { total: 0, linked: 0, sample: [] }
  };
  
  try {
    // STEP 1: Check Email Actions
    console.log('\n📧 EMAIL ACTIONS AUDIT');
    console.log('======================');
    
    const emailActions = await prisma.actions.findMany({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        type: 'email'
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    stats.email.linked = emailActions.length;
    stats.email.sample = emailActions.map(a => ({
      subject: a.subject,
      companyId: a.companyId,
      personId: a.personId,
      externalRefType: a.externalRefType
    }));
    
    console.log(`✅ Email actions found: ${stats.email.linked}`);
    if (stats.email.sample.length > 0) {
      console.log('Sample email actions:');
      stats.email.sample.forEach((action, i) => {
        console.log(`  ${i+1}. "${action.subject}" (Company: ${action.companyId || 'none'}, Person: ${action.personId || 'none'})`);
      });
    }
    
    // STEP 2: Check LinkedIn Actions
    console.log('\n💼 LINKEDIN ACTIONS AUDIT');
    console.log('=========================');
    
    const linkedinActions = await prisma.actions.findMany({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        OR: [
          { type: 'linkedin_dm' },
          { type: 'linkedin_inmail' },
          { type: 'linkedin_message' },
          { description: { contains: 'linkedin', mode: 'insensitive' } }
        ]
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    stats.linkedin.linked = linkedinActions.length;
    stats.linkedin.sample = linkedinActions.map(a => ({
      type: a.type,
      subject: a.subject,
      companyId: a.companyId,
      personId: a.personId
    }));
    
    console.log(`✅ LinkedIn actions found: ${stats.linkedin.linked}`);
    if (stats.linkedin.sample.length > 0) {
      console.log('Sample LinkedIn actions:');
      stats.linkedin.sample.forEach((action, i) => {
        console.log(`  ${i+1}. Type: ${action.type}, Subject: "${action.subject}"`);
      });
    }
    
    // STEP 3: Check Call Actions
    console.log('\n📞 CALL ACTIONS AUDIT');
    console.log('=====================');
    
    const callActions = await prisma.actions.findMany({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        OR: [
          { type: 'call' },
          { type: 'phone_call' },
          { description: { contains: 'call', mode: 'insensitive' } }
        ]
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    stats.call.linked = callActions.length;
    stats.call.sample = callActions.map(a => ({
      type: a.type,
      subject: a.subject,
      companyId: a.companyId,
      personId: a.personId
    }));
    
    console.log(`✅ Call actions found: ${stats.call.linked}`);
    if (stats.call.sample.length > 0) {
      console.log('Sample call actions:');
      stats.call.sample.forEach((action, i) => {
        console.log(`  ${i+1}. Type: ${action.type}, Subject: "${action.subject}"`);
      });
    }
    
    // STEP 4: Check Meeting Actions
    console.log('\n📅 MEETING ACTIONS AUDIT');
    console.log('========================');
    
    const meetingActions = await prisma.actions.findMany({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        OR: [
          { type: 'meeting' },
          { type: 'calendar_meeting' },
          { description: { contains: 'meeting', mode: 'insensitive' } },
          { description: { contains: 'calendly', mode: 'insensitive' } }
        ]
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    stats.meeting.linked = meetingActions.length;
    stats.meeting.sample = meetingActions.map(a => ({
      type: a.type,
      subject: a.subject,
      companyId: a.companyId,
      personId: a.personId
    }));
    
    console.log(`✅ Meeting actions found: ${stats.meeting.linked}`);
    if (stats.meeting.sample.length > 0) {
      console.log('Sample meeting actions:');
      stats.meeting.sample.forEach((action, i) => {
        console.log(`  ${i+1}. Type: ${action.type}, Subject: "${action.subject}"`);
      });
    }
    
    // STEP 5: Check for raw data sources
    console.log('\n🔍 RAW DATA SOURCES AUDIT');
    console.log('==========================');
    
    // Check email_messages table
    const emailMessages = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM email_messages 
      WHERE "accountId" IN (
        SELECT entity_id FROM companies 
        WHERE "workspaceId" = '01K1VBYV8ETM2RCQA4GNN9EG72'
      )
    `;
    stats.email.total = parseInt(emailMessages[0].count);
    console.log(`📧 Email messages in database: ${stats.email.total}`);
    
    // Check for LinkedIn data (if we have a LinkedIn table)
    try {
      const linkedinData = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM linkedin_messages 
        WHERE "workspaceId" = '01K1VBYV8ETM2RCQA4GNN9EG72'
      `;
      stats.linkedin.total = parseInt(linkedinData[0].count);
      console.log(`💼 LinkedIn messages in database: ${stats.linkedin.total}`);
    } catch (error) {
      console.log(`💼 LinkedIn messages table: Not found`);
    }
    
    // Check for call data (if we have a calls table)
    try {
      const callData = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM calls 
        WHERE "workspaceId" = '01K1VBYV8ETM2RCQA4GNN9EG72'
      `;
      stats.call.total = parseInt(callData[0].count);
      console.log(`📞 Calls in database: ${stats.call.total}`);
    } catch (error) {
      console.log(`📞 Calls table: Not found`);
    }
    
    // Check for meeting data (if we have a meetings table)
    try {
      const meetingData = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM meetings 
        WHERE "workspaceId" = '01K1VBYV8ETM2RCQA4GNN9EG72'
      `;
      stats.meeting.total = parseInt(meetingData[0].count);
      console.log(`📅 Meetings in database: ${stats.meeting.total}`);
    } catch (error) {
      console.log(`📅 Meetings table: Not found`);
    }
    
    // STEP 6: Summary Report
    console.log('\n📊 CORE ACTIONS SUMMARY FOR DANO');
    console.log('=================================');
    console.log('Action Type    | Raw Data | Linked | Status');
    console.log('---------------|----------|--------|--------');
    console.log(`Email          | ${stats.email.total.toString().padStart(8)} | ${stats.email.linked.toString().padStart(6)} | ${stats.email.linked > 0 ? '✅ Ready' : '❌ Missing'}`);
    console.log(`LinkedIn       | ${stats.linkedin.total.toString().padStart(8)} | ${stats.linkedin.linked.toString().padStart(6)} | ${stats.linkedin.linked > 0 ? '✅ Ready' : '❌ Missing'}`);
    console.log(`Call           | ${stats.call.total.toString().padStart(8)} | ${stats.call.linked.toString().padStart(6)} | ${stats.call.linked > 0 ? '✅ Ready' : '❌ Missing'}`);
    console.log(`Meeting        | ${stats.meeting.total.toString().padStart(8)} | ${stats.meeting.linked.toString().padStart(6)} | ${stats.meeting.linked > 0 ? '✅ Ready' : '❌ Missing'}`);
    
    // STEP 7: Recommendations
    console.log('\n🎯 RECOMMENDATIONS');
    console.log('==================');
    
    if (stats.email.total > 0 && stats.email.linked === 0) {
      console.log('📧 EMAIL: Need to link email messages to actions table');
    }
    if (stats.linkedin.total === 0) {
      console.log('💼 LINKEDIN: No LinkedIn data found - need to set up LinkedIn integration');
    }
    if (stats.call.total === 0) {
      console.log('📞 CALLS: No call data found - need to set up call tracking');
    }
    if (stats.meeting.total === 0) {
      console.log('📅 MEETINGS: No meeting data found - need to set up Calendly integration');
    }
    
  } catch (error) {
    console.error('💥 Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditCoreActions().catch(console.error);

