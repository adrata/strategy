const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEnrichmentStatus() {
  try {
    const workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK'; // TOP Engineering Plus
    
    console.log('🔍 Checking enrichment status for workspace:', workspaceId);
    console.log('');
    
    // Check leads
    const leads = await prisma.people.findMany({
      where: {
        workspaceId,
        status: 'LEAD',
        deletedAt: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        lastEnriched: true,
        customFields: true,
        coresignalData: true,
        enrichmentScore: true,
        jobTitle: true,
        department: true,
        state: true,
        bio: true
      },
      take: 100 // Sample first 100
    });
    
    const totalLeads = await prisma.people.count({
      where: {
        workspaceId,
        status: 'LEAD',
        deletedAt: null
      }
    });
    
    const enrichedLeads = leads.filter(p => 
      p.lastEnriched || 
      (p.customFields && p.customFields.coresignalId) ||
      p.coresignalData
    );
    
    const leadsWithMissingData = leads.filter(p => {
      const hasIdentifier = p.firstName || p.lastName;
      const missingBasicData = !p.jobTitle || !p.department || !p.state || !p.bio;
      return hasIdentifier && missingBasicData;
    });
    
    console.log('📊 LEADS ENRICHMENT STATUS:');
    console.log(`   Total leads: ${totalLeads}`);
    console.log(`   Sample checked: ${leads.length}`);
    console.log(`   Enriched (has lastEnriched or coresignalId): ${enrichedLeads.length} (${Math.round(enrichedLeads.length / leads.length * 100)}%)`);
    console.log(`   With missing basic data (jobTitle/department/state/bio): ${leadsWithMissingData.length} (${Math.round(leadsWithMissingData.length / leads.length * 100)}%)`);
    console.log('');
    
    // Check a few sample records
    console.log('📋 SAMPLE RECORDS:');
    leads.slice(0, 5).forEach((lead, idx) => {
      const isEnriched = lead.lastEnriched || (lead.customFields && lead.customFields.coresignalId) || lead.coresignalData;
      const missingData = !lead.jobTitle || !lead.department || !lead.state || !lead.bio;
      console.log(`   ${idx + 1}. ${lead.firstName} ${lead.lastName}:`);
      console.log(`      - Enriched: ${isEnriched ? '✅' : '❌'}`);
      console.log(`      - lastEnriched: ${lead.lastEnriched || 'null'}`);
      console.log(`      - coresignalId: ${lead.customFields?.coresignalId || 'null'}`);
      console.log(`      - Missing basic data: ${missingData ? '⚠️' : '✅'}`);
      console.log(`      - jobTitle: ${lead.jobTitle || 'missing'}`);
      console.log(`      - department: ${lead.department || 'missing'}`);
      console.log(`      - state: ${lead.state || 'missing'}`);
      console.log(`      - bio: ${lead.bio ? 'present' : 'missing'}`);
      console.log('');
    });
    
    // Check prospects
    const prospects = await prisma.people.findMany({
      where: {
        workspaceId,
        status: 'PROSPECT',
        deletedAt: null
      },
      select: {
        id: true,
        lastEnriched: true,
        customFields: true,
        coresignalData: true
      },
      take: 50
    });
    
    const totalProspects = await prisma.people.count({
      where: {
        workspaceId,
        status: 'PROSPECT',
        deletedAt: null
      }
    });
    
    const enrichedProspects = prospects.filter(p => 
      p.lastEnriched || 
      (p.customFields && p.customFields.coresignalId) ||
      p.coresignalData
    );
    
    console.log('📊 PROSPECTS ENRICHMENT STATUS:');
    console.log(`   Total prospects: ${totalProspects}`);
    console.log(`   Sample checked: ${prospects.length}`);
    console.log(`   Enriched: ${enrichedProspects.length} (${Math.round(enrichedProspects.length / prospects.length * 100)}%)`);
    console.log('');
    
    // Check companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        lastVerified: true,
        customFields: true,
        coresignalId: true,
        industry: true,
        employeeCount: true,
        revenue: true
      },
      take: 50
    });
    
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId,
        deletedAt: null
      }
    });
    
    const enrichedCompanies = companies.filter(c => 
      c.lastVerified || 
      c.coresignalId ||
      (c.customFields && c.customFields.coresignalId)
    );
    
    console.log('📊 COMPANIES ENRICHMENT STATUS:');
    console.log(`   Total companies: ${totalCompanies}`);
    console.log(`   Sample checked: ${companies.length}`);
    console.log(`   Enriched (has lastVerified or coresignalId): ${enrichedCompanies.length} (${Math.round(enrichedCompanies.length / companies.length * 100)}%)`);
    console.log('');
    
    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   Leads: ${enrichedLeads.length}/${leads.length} enriched in sample (${Math.round(enrichedLeads.length / leads.length * 100)}%)`);
    console.log(`   Prospects: ${enrichedProspects.length}/${prospects.length} enriched in sample (${Math.round(enrichedProspects.length / prospects.length * 100)}%)`);
    console.log(`   Companies: ${enrichedCompanies.length}/${companies.length} enriched in sample (${Math.round(enrichedCompanies.length / companies.length * 100)}%)`);
    console.log('');
    
    if (enrichedLeads.length / leads.length > 0.8) {
      console.log('✅ CONCLUSION: Most records appear to be enriched. Auto-enrichment can be safely disabled.');
    } else {
      console.log('⚠️ CONCLUSION: Many records are not enriched. Consider keeping auto-enrichment enabled.');
    }
    
  } catch (error) {
    console.error('❌ Error checking enrichment status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnrichmentStatus();
