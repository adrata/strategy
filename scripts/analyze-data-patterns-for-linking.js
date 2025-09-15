#!/usr/bin/env node

/**
 * DATA PATTERN ANALYSIS FOR MAXIMUM ACTION LINKING
 * 
 * This script analyzes the data patterns to understand:
 * 1. How leads/prospects/opportunities relate to people/companies
 * 2. Email patterns and linking opportunities
 * 3. Action type patterns and their typical relationships
 * 4. Content analysis for intelligent linking
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeDataPatterns() {
  console.log('🔍 DATA PATTERN ANALYSIS FOR MAXIMUM LINKING');
  console.log('=============================================\n');

  try {
    // 1. Analyze leads relationship patterns
    await analyzeLeadsPatterns();
    
    // 2. Analyze prospects relationship patterns
    await analyzeProspectsPatterns();
    
    // 3. Analyze opportunities relationship patterns
    await analyzeOpportunitiesPatterns();
    
    // 4. Analyze email patterns
    await analyzeEmailPatterns();
    
    // 5. Analyze action type patterns
    await analyzeActionTypePatterns();
    
    // 6. Analyze content patterns for linking
    await analyzeContentPatterns();
    
    // 7. Generate linking strategy recommendations
    await generateLinkingStrategy();

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function analyzeLeadsPatterns() {
  console.log('🎯 LEADS RELATIONSHIP PATTERNS:');
  console.log('===============================');
  
  // Get sample of leads with their relationships
  const leads = await prisma.leads.findMany({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
    select: {
      id: true,
      fullName: true,
      email: true,
      workEmail: true,
      company: true,
      companyDomain: true,
      personId: true,
      companyId: true
    },
    take: 20
  });
  
  console.log(`\n📊 Sample of ${leads.length} leads:`);
  leads.forEach(lead => {
    console.log(`  ${lead.fullName}:`);
    console.log(`    Email: ${lead.email || lead.workEmail || 'N/A'}`);
    console.log(`    Company: ${lead.company || 'N/A'}`);
    console.log(`    Domain: ${lead.companyDomain || 'N/A'}`);
    console.log(`    personId: ${lead.personId || 'N/A'}`);
    console.log(`    companyId: ${lead.companyId || 'N/A'}`);
  });
  
  // Count leads with relationships
  const leadsWithPerson = await prisma.leads.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      personId: { not: null }
    }
  });
  
  const leadsWithCompany = await prisma.leads.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      companyId: { not: null }
    }
  });
  
  const totalLeads = await prisma.leads.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  
  console.log(`\n📈 Leads Relationship Stats:`);
  console.log(`  Total Leads: ${totalLeads}`);
  console.log(`  With personId: ${leadsWithPerson} (${((leadsWithPerson/totalLeads)*100).toFixed(1)}%)`);
  console.log(`  With companyId: ${leadsWithCompany} (${((leadsWithCompany/totalLeads)*100).toFixed(1)}%)`);
  
  console.log('');
}

async function analyzeProspectsPatterns() {
  console.log('🎯 PROSPECTS RELATIONSHIP PATTERNS:');
  console.log('===================================');
  
  // Get sample of prospects with their relationships
  const prospects = await prisma.prospects.findMany({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
    select: {
      id: true,
      fullName: true,
      email: true,
      workEmail: true,
      company: true,
      companyDomain: true,
      personId: true,
      companyId: true
    },
    take: 20
  });
  
  console.log(`\n📊 Sample of ${prospects.length} prospects:`);
  prospects.forEach(prospect => {
    console.log(`  ${prospect.fullName}:`);
    console.log(`    Email: ${prospect.email || prospect.workEmail || 'N/A'}`);
    console.log(`    Company: ${prospect.company || 'N/A'}`);
    console.log(`    Domain: ${prospect.companyDomain || 'N/A'}`);
    console.log(`    personId: ${prospect.personId || 'N/A'}`);
    console.log(`    companyId: ${prospect.companyId || 'N/A'}`);
  });
  
  // Count prospects with relationships
  const prospectsWithPerson = await prisma.prospects.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      personId: { not: null }
    }
  });
  
  const prospectsWithCompany = await prisma.prospects.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      companyId: { not: null }
    }
  });
  
  const totalProspects = await prisma.prospects.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  
  console.log(`\n📈 Prospects Relationship Stats:`);
  console.log(`  Total Prospects: ${totalProspects}`);
  console.log(`  With personId: ${prospectsWithPerson} (${((prospectsWithPerson/totalProspects)*100).toFixed(1)}%)`);
  console.log(`  With companyId: ${prospectsWithCompany} (${((prospectsWithCompany/totalProspects)*100).toFixed(1)}%)`);
  
  console.log('');
}

async function analyzeOpportunitiesPatterns() {
  console.log('🎯 OPPORTUNITIES RELATIONSHIP PATTERNS:');
  console.log('=======================================');
  
  // Get sample of opportunities with their relationships
  const opportunities = await prisma.opportunities.findMany({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
    select: {
      id: true,
      name: true,
      personId: true,
      companyId: true
    },
    take: 20
  });
  
  console.log(`\n📊 Sample of ${opportunities.length} opportunities:`);
  opportunities.forEach(opp => {
    console.log(`  ${opp.name}:`);
    console.log(`    personId: ${opp.personId || 'N/A'}`);
    console.log(`    companyId: ${opp.companyId || 'N/A'}`);
  });
  
  // Count opportunities with relationships
  const oppsWithPerson = await prisma.opportunities.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      personId: { not: null }
    }
  });
  
  const oppsWithCompany = await prisma.opportunities.count({
    where: { 
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      companyId: { not: null }
    }
  });
  
  const totalOpps = await prisma.opportunities.count({
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
  });
  
  console.log(`\n📈 Opportunities Relationship Stats:`);
  console.log(`  Total Opportunities: ${totalOpps}`);
  console.log(`  With personId: ${oppsWithPerson} (${((oppsWithPerson/totalOpps)*100).toFixed(1)}%)`);
  console.log(`  With companyId: ${oppsWithCompany} (${((oppsWithCompany/totalOpps)*100).toFixed(1)}%)`);
  
  console.log('');
}

async function analyzeEmailPatterns() {
  console.log('📧 EMAIL PATTERNS FOR LINKING:');
  console.log('==============================');
  
  // Get sample emails
  const emails = await prisma.email_messages.findMany({
    where: {
      accountId: {
        in: await prisma.email_accounts.findMany({
          where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
          select: { id: true }
        }).then(accounts => accounts.map(a => a.id))
      }
    },
    select: {
      id: true,
      subject: true,
      fromEmail: true,
      toEmail: true,
      body: true
    },
    take: 10
  });
  
  console.log(`\n📊 Sample of ${emails.length} emails:`);
  emails.forEach(email => {
    console.log(`  Subject: ${email.subject}`);
    console.log(`    From: ${email.fromEmail}`);
    console.log(`    To: ${email.toEmail}`);
    console.log(`    Body preview: ${email.body?.substring(0, 100)}...`);
  });
  
  // Analyze email domain patterns
  const emailDomains = await prisma.email_messages.findMany({
    where: {
      accountId: {
        in: await prisma.email_accounts.findMany({
          where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
          select: { id: true }
        }).then(accounts => accounts.map(a => a.id))
      }
    },
    select: {
      fromEmail: true,
      toEmail: true
    },
    take: 100
  });
  
  const domainCounts = {};
  emailDomains.forEach(email => {
    const fromDomain = email.fromEmail?.split('@')[1];
    const toDomain = email.toEmail?.split('@')[1];
    
    if (fromDomain) domainCounts[fromDomain] = (domainCounts[fromDomain] || 0) + 1;
    if (toDomain) domainCounts[toDomain] = (domainCounts[toDomain] || 0) + 1;
  });
  
  console.log(`\n📈 Top email domains:`);
  Object.entries(domainCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count} emails`);
    });
  
  console.log('');
}

async function analyzeActionTypePatterns() {
  console.log('🎯 ACTION TYPE PATTERNS:');
  console.log('========================');
  
  // Get action types with their typical relationships
  const actionTypes = await prisma.actions.groupBy({
    by: ['type'],
    _count: { type: true },
    where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
    orderBy: { _count: { type: 'desc' } },
    take: 15
  });
  
  console.log(`\n📊 Action types and their typical relationships:`);
  
  for (const actionType of actionTypes) {
    const sampleActions = await prisma.actions.findMany({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        type: actionType.type
      },
      select: {
        type: true,
        subject: true,
        personId: true,
        companyId: true,
        leadId: true,
        opportunityId: true,
        prospectId: true
      },
      take: 5
    });
    
    console.log(`\n  ${actionType.type} (${actionType._count.type} total):`);
    sampleActions.forEach(action => {
      const relationships = [];
      if (action.personId) relationships.push('person');
      if (action.companyId) relationships.push('company');
      if (action.leadId) relationships.push('lead');
      if (action.opportunityId) relationships.push('opportunity');
      if (action.prospectId) relationships.push('prospect');
      
      console.log(`    "${action.subject}" -> [${relationships.join(', ')}]`);
    });
  }
  
  console.log('');
}

async function analyzeContentPatterns() {
  console.log('📝 CONTENT PATTERNS FOR LINKING:');
  console.log('================================');
  
  // Get sample orphaned actions to analyze content
  const orphanedActions = await prisma.actions.findMany({
    where: {
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
      AND: [
        { personId: null },
        { companyId: null },
        { leadId: null },
        { opportunityId: null },
        { prospectId: null }
      ]
    },
    select: {
      id: true,
      type: true,
      subject: true,
      description: true
    },
    take: 20
  });
  
  console.log(`\n📊 Sample of ${orphanedActions.length} orphaned actions:`);
  orphanedActions.forEach(action => {
    console.log(`  ${action.type}: "${action.subject}"`);
    console.log(`    Description: ${action.description?.substring(0, 100)}...`);
    
    // Extract potential linking clues
    const content = `${action.subject} ${action.description || ''}`.toLowerCase();
    const emailMatches = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
    const phoneMatches = content.match(/(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g);
    
    if (emailMatches) console.log(`    📧 Emails found: ${emailMatches.join(', ')}`);
    if (phoneMatches) console.log(`    📞 Phones found: ${phoneMatches.join(', ')}`);
  });
  
  console.log('');
}

async function generateLinkingStrategy() {
  console.log('🎯 LINKING STRATEGY RECOMMENDATIONS:');
  console.log('====================================');
  
  console.log(`
📋 INTELLIGENT LINKING STRATEGY:

1. 🎯 ACTION TYPE-BASED LINKING:
   - person_created/contact_created → Link to personId (primary), companyId (secondary)
   - company_created → Link to companyId (primary)
   - email/email_sent → Extract emails, link to personId + companyId
   - phone_call → Extract names/companies, link to personId + companyId
   - linkedin_* → Link to personId + companyId
   - note_added → Link to existing personId/companyId from note

2. 📧 EMAIL-BASED LINKING:
   - Extract email addresses from subject/description
   - Match against people.email, workEmail, personalEmail
   - Match against companies.email
   - Use domain matching for company linking

3. 🏢 COMPANY-BASED LINKING:
   - Extract company names from content
   - Fuzzy match against companies.name, legalName, tradingName
   - Use domain matching from email addresses
   - Link to companyId when company context is clear

4. 👤 PERSON-BASED LINKING:
   - Extract names from subject/description
   - Match against people.fullName, firstName, lastName
   - Use email addresses for person matching
   - Link to personId when person context is clear

5. 🔗 INHERITANCE LINKING:
   - If action has leadId → inherit personId/companyId from lead
   - If action has prospectId → inherit personId/companyId from prospect
   - If action has opportunityId → inherit personId/companyId from opportunity

6. 📝 CONTENT ANALYSIS:
   - Use NLP to extract entities (names, companies, emails)
   - Pattern matching for common business terms
   - Context analysis to determine primary vs secondary relationships

7. 🎯 PRIORITY ORDER:
   1. Direct relationships (personId, companyId already set)
   2. Email-based matching (highest confidence)
   3. Name-based matching (medium confidence)
   4. Company-based matching (medium confidence)
   5. Content-based inference (lower confidence)
   6. Fallback to least-connected entities (spread the load)

8. 🔄 BATCH PROCESSING:
   - Process in batches of 100 for performance
   - Add delays between batches to prevent system overload
   - Track progress and provide real-time feedback
   - Retry failed links with different strategies
`);

  console.log('🎉 Data pattern analysis complete!');
}

// Run the analysis
analyzeDataPatterns().catch(console.error);

