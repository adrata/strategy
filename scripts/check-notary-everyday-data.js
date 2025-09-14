const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNotaryEverydayData() {
  try {
    console.log('🔍 Checking Notary Everyday workspace data...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk'; // Notary Everyday workspace
    
    // Check accounts in this workspace
    const accounts = await prisma.accounts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      take: 10,
      select: {
        id: true,
        name: true,
        state: true,
        industry: true,
        city: true,
        country: true
      }
    });
    
    console.log('🏢 Sample accounts in Notary Everyday workspace:');
    accounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.name} - State: ${account.state || 'null'} - Industry: ${account.industry || 'null'}`);
    });
    
    // Check leads with accountId in this workspace
    const leadsWithAccounts = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId,
        accountId: { not: null },
        deletedAt: null
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        company: true,
        state: true,
        accountId: true,
        jobTitle: true
      }
    });
    
    console.log('\n👥 Sample leads with accountId in Notary Everyday workspace:');
    leadsWithAccounts.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} (${lead.company}) - Lead State: ${lead.state || 'null'} - AccountId: ${lead.accountId} - Title: ${lead.jobTitle || 'null'}`);
    });
    
    // Check if leads have wrong company data (department names instead of company names)
    const leadsWithDepartmentNames = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        OR: [
          { company: 'Operations' },
          { company: 'Legal' },
          { company: 'Finance & Accounting' },
          { company: 'C-Suite' },
          { company: 'Engineering' },
          { company: 'Technology' },
          { company: 'Security' },
          { company: 'Product' }
        ]
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        company: true,
        accountId: true,
        jobTitle: true
      }
    });
    
    console.log('\n⚠️ Leads with department names as company:');
    leadsWithDepartmentNames.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} - Company: "${lead.company}" (should be actual company name) - AccountId: ${lead.accountId || 'null'}`);
    });
    
    // Check contacts in this workspace
    const contacts = await prisma.contacts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      take: 5,
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        accountId: true,
        department: true
      }
    });
    
    console.log('\n👤 Sample contacts in Notary Everyday workspace:');
    contacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.fullName} - Title: ${contact.jobTitle || 'null'} - AccountId: ${contact.accountId || 'null'} - Department: ${contact.department || 'null'}`);
    });
    
    // Check if we can get state from accounts for leads
    console.log('\n🔍 Checking if we can get state from accounts for leads...');
    const leadsNeedingState = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId,
        state: null,
        accountId: { not: null },
        deletedAt: null
      },
      take: 5,
      select: {
        id: true,
        fullName: true,
        state: true,
        accountId: true
      }
    });
    
    for (const lead of leadsNeedingState) {
      const account = await prisma.accounts.findUnique({
        where: { id: lead.accountId },
        select: { name: true, state: true }
      });
      
      console.log(`Lead: ${lead.fullName} - Lead State: ${lead.state || 'null'} - Account: ${account?.name || 'not found'} - Account State: ${account?.state || 'null'}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking Notary Everyday data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotaryEverydayData();
