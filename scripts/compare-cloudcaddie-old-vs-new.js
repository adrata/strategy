#!/usr/bin/env node

/**
 * 🔍 CLOUDCADDIE OLD vs NEW DATA COMPARISON
 * 
 * Compares CloudCaddie data between old SBI database and new streamlined database
 */

const { PrismaClient } = require('@prisma/client');

// Database connections
const SBI_DATABASE_URL = 'postgresql://neondb_owner:npg_lt0xGowzW5yV@ep-damp-math-a8ht5oj3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const sbiPrisma = new PrismaClient({
  datasources: {
    db: {
      url: SBI_DATABASE_URL
    }
  }
});

const newPrisma = new PrismaClient();

async function compareCloudCaddieData() {
  try {
    console.log('🔍 CLOUDCADDIE OLD vs NEW DATA COMPARISON');
    console.log('==========================================\n');
    
    // Connect to both databases
    await sbiPrisma.$connect();
    await newPrisma.$connect();
    console.log('✅ Connected to both databases!\n');

    // Find CloudCaddie workspace in both databases
    console.log('📋 FINDING CLOUDCADDIE WORKSPACE:');
    
    const sbiWorkspace = await sbiPrisma.$queryRaw`
      SELECT id, name, slug, timezone, description, "createdAt", "updatedAt"
      FROM workspaces 
      WHERE name ILIKE '%cloudcaddie%'
      LIMIT 1;
    `;
    
    const newWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { name: { contains: 'Cloud Caddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } }
        ]
      }
    });

    if (!sbiWorkspace || sbiWorkspace.length === 0) {
      console.log('❌ CloudCaddie workspace not found in SBI database!');
      return;
    }

    if (!newWorkspace) {
      console.log('❌ CloudCaddie workspace not found in new database!');
      return;
    }

    console.log(`✅ SBI Workspace: ${sbiWorkspace[0].name} (${sbiWorkspace[0].id})`);
    console.log(`✅ New Workspace: ${newWorkspace.name} (${newWorkspace.id})\n`);

    // Compare companies
    console.log('🏢 COMPANIES COMPARISON:');
    console.log('========================');
    
    const sbiCompanies = await sbiPrisma.$queryRaw`
      SELECT COUNT(*) as count FROM companies 
      WHERE "workspaceId" = ${sbiWorkspace[0].id};
    `;
    
    const newCompanies = await newPrisma.companies.count({
      where: { workspaceId: newWorkspace.id }
    });

    console.log(`📊 SBI Database: ${sbiCompanies[0].count} companies`);
    console.log(`📊 New Database: ${newCompanies} companies`);
    console.log(`📈 Migration Rate: ${newCompanies}/${Number(sbiCompanies[0].count)} (${((newCompanies / Number(sbiCompanies[0].count)) * 100).toFixed(1)}%)\n`);

    // Get sample companies from both databases
    const sbiSampleCompanies = await sbiPrisma.$queryRaw`
      SELECT name, domain, industry, status, "companyIntelligence", "businessChallenges", 
             "businessPriorities", "competitiveAdvantages", "growthOpportunities", "strategicInitiatives", 
             "successMetrics", "marketPosition", "digitalMaturity", "techStack", competitors, 
             "lastEnriched", "enrichmentScore", "createdAt", "updatedAt"
      FROM companies 
      WHERE "workspaceId" = ${sbiWorkspace[0].id}
      ORDER BY "createdAt" DESC
      LIMIT 5;
    `;

    const newSampleCompanies = await newPrisma.companies.findMany({
      where: { workspaceId: newWorkspace.id },
      select: {
        name: true,
        domain: true,
        industry: true,
        status: true,
        priority: true,
        companyIntelligence: true,
        businessChallenges: true,
        businessPriorities: true,
        competitiveAdvantages: true,
        growthOpportunities: true,
        strategicInitiatives: true,
        successMetrics: true,
        marketPosition: true,
        digitalMaturity: true,
        techStack: true,
        competitors: true,
        lastVerified: true,
        confidence: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('📋 SBI Sample Companies:');
    console.table(sbiSampleCompanies.map(c => ({
      name: c.name,
      domain: c.domain,
      industry: c.industry,
      status: c.status,
      intelligence: c.companyIntelligence ? 'Yes' : 'No',
      enrichment: c.enrichmentScore || 'N/A',
      lastEnriched: c.lastEnriched ? c.lastEnriched.toISOString().split('T')[0] : 'Never'
    })));

    console.log('\n📋 New Sample Companies:');
    console.table(newSampleCompanies.map(c => ({
      name: c.name,
      domain: c.domain,
      industry: c.industry,
      status: c.status,
      priority: c.priority,
      intelligence: c.companyIntelligence ? 'Yes' : 'No',
      confidence: c.confidence || 'N/A',
      lastVerified: c.lastVerified ? c.lastVerified.toISOString().split('T')[0] : 'Never'
    })));

    // Compare people
    console.log('\n👥 PEOPLE COMPARISON:');
    console.log('=====================');
    
    const sbiPeople = await sbiPrisma.$queryRaw`
      SELECT COUNT(*) as count FROM people 
      WHERE "workspaceId" = ${sbiWorkspace[0].id};
    `;
    
    const newPeople = await newPrisma.people.count({
      where: { workspaceId: newWorkspace.id }
    });

    console.log(`📊 SBI Database: ${sbiPeople[0].count} people`);
    console.log(`📊 New Database: ${newPeople} people`);
    console.log(`📈 Migration Rate: ${newPeople}/${Number(sbiPeople[0].count)} (${((newPeople / Number(sbiPeople[0].count)) * 100).toFixed(1)}%)\n`);

    // Get sample people from both databases
    const sbiSamplePeople = await sbiPrisma.$queryRaw`
      SELECT "fullName", "jobTitle", email, "companyId", status, "enrichmentScore", 
             "lastEnriched", "buyerGroupRole", "decisionPower", "influenceLevel", "engagementLevel", 
             "buyerGroupStatus", "isBuyerGroupMember", "buyerGroupOptimized", "decisionMaking", 
             "communicationStyle", "engagementStrategy", "coresignalData", "enrichedData", 
             "createdAt", "updatedAt"
      FROM people 
      WHERE "workspaceId" = ${sbiWorkspace[0].id}
      ORDER BY "createdAt" DESC
      LIMIT 5;
    `;

    const newSamplePeople = await newPrisma.people.findMany({
      where: { workspaceId: newWorkspace.id },
      select: {
        fullName: true,
        jobTitle: true,
        email: true,
        companyId: true,
        status: true,
        priority: true,
        enrichmentScore: true,
        lastEnriched: true,
        buyerGroupRole: true,
        decisionPower: true,
        influenceLevel: true,
        engagementLevel: true,
        buyerGroupStatus: true,
        isBuyerGroupMember: true,
        buyerGroupOptimized: true,
        decisionMaking: true,
        communicationStyle: true,
        engagementStrategy: true,
        coresignalData: true,
        enrichedData: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('📋 SBI Sample People:');
    console.table(sbiSamplePeople.map(p => ({
      name: p.fullName,
      title: p.jobTitle,
      email: p.email,
      companyId: p.companyId,
      status: p.status,
      priority: p.priority,
      enrichment: p.enrichmentScore || 'N/A',
      lastEnriched: p.lastEnriched ? p.lastEnriched.toISOString().split('T')[0] : 'Never',
      buyerGroup: p.buyerGroupRole || 'N/A'
    })));

    console.log('\n📋 New Sample People:');
    console.table(newSamplePeople.map(p => ({
      name: p.fullName,
      title: p.jobTitle,
      email: p.email,
      companyId: p.companyId,
      status: p.status,
      priority: p.priority,
      enrichment: p.enrichmentScore || 'N/A',
      lastEnriched: p.lastEnriched ? p.lastEnriched.toISOString().split('T')[0] : 'Never',
      buyerGroup: p.buyerGroupRole || 'N/A'
    })));

    // Check enrichment status in both databases
    console.log('\n🧠 ENRICHMENT STATUS COMPARISON:');
    console.log('=================================');

    const sbiEnrichedCompanies = await sbiPrisma.$queryRaw`
      SELECT COUNT(*) as count FROM companies 
      WHERE "workspaceId" = ${sbiWorkspace[0].id} AND "lastEnriched" IS NOT NULL;
    `;

    const sbiEnrichedPeople = await sbiPrisma.$queryRaw`
      SELECT COUNT(*) as count FROM people 
      WHERE "workspaceId" = ${sbiWorkspace[0].id} AND "lastEnriched" IS NOT NULL;
    `;

    const newEnrichedCompanies = await newPrisma.companies.count({
      where: { 
        workspaceId: newWorkspace.id,
        lastVerified: { not: null }
      }
    });

    const newEnrichedPeople = await newPrisma.people.count({
      where: { 
        workspaceId: newWorkspace.id,
        lastEnriched: { not: null }
      }
    });

    console.log(`🏢 SBI Enriched Companies: ${Number(sbiEnrichedCompanies[0].count)} / ${Number(sbiCompanies[0].count)} (${((Number(sbiEnrichedCompanies[0].count) / Number(sbiCompanies[0].count)) * 100).toFixed(1)}%)`);
    console.log(`🏢 New Enriched Companies: ${newEnrichedCompanies} / ${newCompanies} (${((newEnrichedCompanies / newCompanies) * 100).toFixed(1)}%)`);
    console.log(`👥 SBI Enriched People: ${Number(sbiEnrichedPeople[0].count)} / ${Number(sbiPeople[0].count)} (${((Number(sbiEnrichedPeople[0].count) / Number(sbiPeople[0].count)) * 100).toFixed(1)}%)`);
    console.log(`👥 New Enriched People: ${newEnrichedPeople} / ${newPeople} (${((newEnrichedPeople / newPeople) * 100).toFixed(1)}%)\n`);

    // Check company-people relationships
    console.log('🔗 COMPANY-PEOPLE RELATIONSHIPS:');
    console.log('=================================');

    const sbiLinkedPeople = await sbiPrisma.$queryRaw`
      SELECT COUNT(*) as count FROM people 
      WHERE "workspaceId" = ${sbiWorkspace[0].id} AND "companyId" IS NOT NULL;
    `;

    const newLinkedPeople = await newPrisma.people.count({
      where: { 
        workspaceId: newWorkspace.id,
        companyId: { not: null }
      }
    });

    console.log(`📊 SBI Linked People: ${Number(sbiLinkedPeople[0].count)} / ${Number(sbiPeople[0].count)} (${((Number(sbiLinkedPeople[0].count) / Number(sbiPeople[0].count)) * 100).toFixed(1)}%)`);
    console.log(`📊 New Linked People: ${newLinkedPeople} / ${newPeople} (${((newLinkedPeople / newPeople) * 100).toFixed(1)}%)\n`);

    // Summary and recommendations
    console.log('🎯 SUMMARY & RECOMMENDATIONS:');
    console.log('==============================');
    
    if (newCompanies < Number(sbiCompanies[0].count)) {
      console.log(`⚠️  WARNING: ${Number(sbiCompanies[0].count) - newCompanies} companies missing from new database`);
    } else {
      console.log('✅ All companies migrated successfully');
    }

    if (newPeople < Number(sbiPeople[0].count)) {
      console.log(`⚠️  WARNING: ${Number(sbiPeople[0].count) - newPeople} people missing from new database`);
    } else {
      console.log('✅ All people migrated successfully');
    }

    if (newEnrichedCompanies < Number(sbiEnrichedCompanies[0].count)) {
      console.log(`⚠️  WARNING: ${Number(sbiEnrichedCompanies[0].count) - newEnrichedCompanies} enriched companies lost in migration`);
    } else {
      console.log('✅ Company enrichment data preserved');
    }

    if (newEnrichedPeople < Number(sbiEnrichedPeople[0].count)) {
      console.log(`⚠️  WARNING: ${Number(sbiEnrichedPeople[0].count) - newEnrichedPeople} enriched people lost in migration`);
    } else {
      console.log('✅ People enrichment data preserved');
    }

    console.log('\n🎉 Comparison complete!');

  } catch (error) {
    console.error('❌ Error during comparison:', error);
  } finally {
    await sbiPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

// Run the comparison
if (require.main === module) {
  compareCloudCaddieData();
}

module.exports = { compareCloudCaddieData };
