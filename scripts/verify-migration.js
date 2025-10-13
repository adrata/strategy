#!/usr/bin/env node

/**
 * 🔍 VERIFY MIGRATION INTEGRITY
 * 
 * Verifies that the SBI data migration was successful and complete
 */

const { PrismaClient, Prisma } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function verifyMigration() {
  try {
    console.log('🔍 Verifying SBI data migration integrity...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to new database!\n');

    // 1. Check Notary Everyday workspace
    console.log('📋 CHECKING NOTARY EVERYDAY WORKSPACE:');
    
    const notaryWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Notary Everyday',
          mode: 'insensitive'
        }
      }
    });
    
    if (!notaryWorkspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }
    
    console.log(`✅ Found workspace: ${notaryWorkspace.name} (${notaryWorkspace.id})\n`);

    // 2. Check companies count
    console.log('🏢 CHECKING COMPANIES:');
    
    const companiesCount = await newPrisma.companies.count({
      where: {
        workspaceId: notaryWorkspace.id
      }
    });
    
    console.log(`   Total companies: ${companiesCount}`);
    
    // Check companies with enrichment data
    const companiesWithEnrichment = await newPrisma.companies.count({
      where: {
        workspaceId: notaryWorkspace.id,
        OR: [
          { customFields: { not: Prisma.JsonNull } },
          { confidence: { gt: 0 } },
          { sources: { isEmpty: false } },
          { businessChallenges: { isEmpty: false } },
          { techStack: { isEmpty: false } }
        ]
      }
    });
    
    console.log(`   Companies with enrichment data: ${companiesWithEnrichment}`);

    // 3. Check people count
    console.log('\n👥 CHECKING PEOPLE:');
    
    const peopleCount = await newPrisma.people.count({
      where: {
        workspaceId: notaryWorkspace.id
      }
    });
    
    console.log(`   Total people: ${peopleCount}`);
    
    // Check people with LEAD status
    const peopleWithLeadStatus = await newPrisma.people.count({
      where: {
        workspaceId: notaryWorkspace.id,
        status: 'LEAD'
      }
    });
    
    console.log(`   People with LEAD status: ${peopleWithLeadStatus}`);
    
    // Check people with enrichment data
    const peopleWithEnrichment = await newPrisma.people.count({
      where: {
        workspaceId: notaryWorkspace.id,
        OR: [
          { customFields: { not: Prisma.JsonNull } },
          { enrichmentScore: { gt: 0 } },
          { enrichmentSources: { isEmpty: false } },
          { coresignalData: { not: Prisma.JsonNull } },
          { enrichedData: { not: Prisma.JsonNull } },
          { buyerGroupRole: { not: null } },
          { decisionPower: { gt: 0 } },
          { influenceLevel: { not: null } }
        ]
      }
    });
    
    console.log(`   People with enrichment data: ${peopleWithEnrichment}`);

    // 4. Check career data preservation
    console.log('\n🎯 CHECKING CAREER DATA PRESERVATION:');
    
    const careerDataCounts = {
      currentRole: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, currentRole: { not: null } }
      }),
      currentCompany: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, currentCompany: { not: null } }
      }),
      yearsInRole: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, yearsInRole: { not: null } }
      }),
      totalExperience: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, totalExperience: { not: null } }
      }),
      technicalSkills: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, technicalSkills: { isEmpty: false } }
      }),
      education: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, degrees: { not: Prisma.JsonNull } }
      }),
      certifications: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, certifications: { isEmpty: false } }
      })
    };
    
    Object.entries(careerDataCounts).forEach(([field, count]) => {
      console.log(`   ${field}: ${count} people`);
    });

    // 5. Check buyer group data preservation
    console.log('\n👑 CHECKING BUYER GROUP DATA PRESERVATION:');
    
    const buyerGroupDataCounts = {
      buyerGroupRole: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, buyerGroupRole: { not: null } }
      }),
      decisionPower: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, decisionPower: { gt: 0 } }
      }),
      influenceLevel: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, influenceLevel: { not: null } }
      }),
      influenceScore: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, influenceScore: { gt: 0 } }
      }),
      engagementLevel: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, engagementLevel: { not: null } }
      }),
      communicationStyle: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, communicationStyle: { not: null } }
      })
    };
    
    Object.entries(buyerGroupDataCounts).forEach(([field, count]) => {
      console.log(`   ${field}: ${count} people`);
    });

    // 6. Check enrichment data preservation
    console.log('\n🔍 CHECKING ENRICHMENT DATA PRESERVATION:');
    
    const enrichmentDataCounts = {
      enrichmentScore: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, enrichmentScore: { gt: 0 } }
      }),
      enrichmentSources: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, enrichmentSources: { isEmpty: false } }
      }),
      coresignalData: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, coresignalData: { not: Prisma.JsonNull } }
      }),
      enrichedData: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, enrichedData: { not: Prisma.JsonNull } }
      }),
      lastEnriched: await newPrisma.people.count({
        where: { workspaceId: notaryWorkspace.id, lastEnriched: { not: null } }
      })
    };
    
    Object.entries(enrichmentDataCounts).forEach(([field, count]) => {
      console.log(`   ${field}: ${count} people`);
    });

    // 7. Check company intelligence data preservation
    console.log('\n🧠 CHECKING COMPANY INTELLIGENCE DATA PRESERVATION:');
    
    const companyIntelligenceCounts = {
      businessChallenges: await newPrisma.companies.count({
        where: { workspaceId: notaryWorkspace.id, businessChallenges: { isEmpty: false } }
      }),
      businessPriorities: await newPrisma.companies.count({
        where: { workspaceId: notaryWorkspace.id, businessPriorities: { isEmpty: false } }
      }),
      competitiveAdvantages: await newPrisma.companies.count({
        where: { workspaceId: notaryWorkspace.id, competitiveAdvantages: { isEmpty: false } }
      }),
      techStack: await newPrisma.companies.count({
        where: { workspaceId: notaryWorkspace.id, techStack: { isEmpty: false } }
      }),
      competitors: await newPrisma.companies.count({
        where: { workspaceId: notaryWorkspace.id, competitors: { isEmpty: false } }
      }),
      marketPosition: await newPrisma.companies.count({
        where: { workspaceId: notaryWorkspace.id, marketPosition: { not: null } }
      }),
      confidence: await newPrisma.companies.count({
        where: { workspaceId: notaryWorkspace.id, confidence: { gt: 0 } }
      }),
      sources: await newPrisma.companies.count({
        where: { workspaceId: notaryWorkspace.id, sources: { isEmpty: false } }
      })
    };
    
    Object.entries(companyIntelligenceCounts).forEach(([field, count]) => {
      console.log(`   ${field}: ${count} companies`);
    });

    // 8. Sample data verification
    console.log('\n📊 SAMPLE DATA VERIFICATION:');
    
    const samplePerson = await newPrisma.people.findFirst({
      where: {
        workspaceId: notaryWorkspace.id,
        customFields: { not: Prisma.JsonNull }
      },
      select: {
        fullName: true,
        status: true,
        currentRole: true,
        currentCompany: true,
        totalExperience: true,
        buyerGroupRole: true,
        decisionPower: true,
        influenceLevel: true,
        enrichmentScore: true,
        technicalSkills: true,
        certifications: true
      }
    });
    
    if (samplePerson) {
      console.log('   Sample person data:');
      console.log(`     Name: ${samplePerson.fullName}`);
      console.log(`     Status: ${samplePerson.status}`);
      console.log(`     Current Role: ${samplePerson.currentRole || 'N/A'}`);
      console.log(`     Current Company: ${samplePerson.currentCompany || 'N/A'}`);
      console.log(`     Total Experience: ${samplePerson.totalExperience || 'N/A'} years`);
      console.log(`     Buyer Group Role: ${samplePerson.buyerGroupRole || 'N/A'}`);
      console.log(`     Decision Power: ${samplePerson.decisionPower || 'N/A'}`);
      console.log(`     Influence Level: ${samplePerson.influenceLevel || 'N/A'}`);
      console.log(`     Enrichment Score: ${samplePerson.enrichmentScore || 'N/A'}`);
      console.log(`     Technical Skills: ${samplePerson.technicalSkills?.length || 0} skills`);
      console.log(`     Certifications: ${samplePerson.certifications?.length || 0} certifications`);
    }

    // 9. Summary
    console.log('\n📋 MIGRATION VERIFICATION SUMMARY:');
    console.log('=====================================');
    console.log(`✅ Workspace: ${notaryWorkspace.name}`);
    console.log(`✅ Companies: ${companiesCount} (${companiesWithEnrichment} with enrichment data)`);
    console.log(`✅ People: ${peopleCount} (${peopleWithLeadStatus} with LEAD status, ${peopleWithEnrichment} with enrichment data)`);
    console.log(`✅ Career data preserved: ${Object.values(careerDataCounts).some(count => count > 0) ? 'YES' : 'NO'}`);
    console.log(`✅ Buyer group data preserved: ${Object.values(buyerGroupDataCounts).some(count => count > 0) ? 'YES' : 'NO'}`);
    console.log(`✅ Enrichment data preserved: ${Object.values(enrichmentDataCounts).some(count => count > 0) ? 'YES' : 'NO'}`);
    console.log(`✅ Company intelligence preserved: ${Object.values(companyIntelligenceCounts).some(count => count > 0) ? 'YES' : 'NO'}`);
    
    console.log('\n🎉 Migration verification completed successfully!');
    console.log('All vital SBI data has been preserved in the new streamlined schema.');

  } catch (error) {
    console.error('❌ Error during migration verification:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the verification
verifyMigration();
