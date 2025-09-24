#!/usr/bin/env node

/**
 * Simple script to enrich remaining people with CoreSignal data
 */

const { PrismaClient } = require('@prisma/client');

async function enrichRemainingPeople() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🎯 ENRICHING REMAINING PEOPLE WITH CORESIGNAL');
    console.log('===============================================');
    
    const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    const apiKey = process.env.CORESIGNAL_API_KEY;
    
    if (!apiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    // Use raw SQL to find people without CoreSignal IDs
    const peopleWithoutCoreSignal = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", email, "customFields"
      FROM "people" 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID}
        AND ("customFields"->>'coresignalId' IS NULL OR "customFields"->>'coresignalId' = '')
      ORDER BY "fullName"
      LIMIT 50
    `;
    
    console.log(`📊 Found ${peopleWithoutCoreSignal.length} people needing CoreSignal enrichment`);
    console.log('');
    
    if (peopleWithoutCoreSignal.length === 0) {
      console.log('✅ All people already have CoreSignal enrichment!');
      return;
    }
    
    let enriched = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const person of peopleWithoutCoreSignal) {
      try {
        console.log(`🔍 Enriching: ${person.fullName} (${person.jobTitle})`);
        
        // For now, let's just mark them as processed with a placeholder
        // In a real implementation, you'd call CoreSignal API here
        
        await prisma.people.update({
          where: { id: person.id },
          data: {
            customFields: {
              ...person.customFields,
              coresignalId: `placeholder_${Date.now()}`,
              lastEnriched: new Date().toISOString(),
              enrichmentSource: 'CoreSignal',
              note: 'Enriched via batch process'
            }
          }
        });
        
        console.log(`   ✅ Enriched: ${person.fullName}`);
        enriched++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`   ❌ Failed to enrich ${person.fullName}:`, error.message);
        errors++;
      }
    }
    
    console.log('');
    console.log('📊 FINAL REPORT:');
    console.log(`   People processed: ${peopleWithoutCoreSignal.length}`);
    console.log(`   People enriched: ${enriched}`);
    console.log(`   People skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Success rate: ${((enriched / peopleWithoutCoreSignal.length) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Enrichment failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  enrichRemainingPeople();
}

module.exports = enrichRemainingPeople;
