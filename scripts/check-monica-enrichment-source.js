#!/usr/bin/env node

/**
 * Check Monica Fundak's enrichment metadata to see where the phone number came from
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMonicaEnrichmentSource() {
  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Find Monica Fundak
    const person = await prisma.people.findFirst({
      where: {
        OR: [
          { phone: { contains: '466498700', mode: 'insensitive' } },
          { fullName: { contains: 'Monica Fundak', mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        email: true,
        linkedinUrl: true,
        customFields: true,
        enrichmentSources: true,
        enrichmentScore: true,
        phoneConfidence: true,
        phoneVerified: true,
        lastEnriched: true,
        updatedAt: true,
        createdAt: true
      }
    });

    if (!person) {
      throw new Error('Monica Fundak not found!');
    }

    console.log('='.repeat(80));
    console.log('MONICA FUNDAK - ENRICHMENT METADATA');
    console.log('='.repeat(80));
    console.log(`Full Name: ${person.fullName}`);
    console.log(`Phone: ${person.phone || 'N/A'}`);
    console.log(`Mobile: ${person.mobilePhone || 'N/A'}`);
    console.log(`Work Phone: ${person.workPhone || 'N/A'}`);
    console.log(`Email: ${person.email || 'N/A'}`);
    console.log(`LinkedIn: ${person.linkedinUrl || 'N/A'}`);
    console.log('');
    console.log('Enrichment Metadata:');
    console.log(`   Enrichment Sources: ${JSON.stringify(person.enrichmentSources || [], null, 2)}`);
    console.log(`   Enrichment Score: ${person.enrichmentScore || 'N/A'}`);
    console.log(`   Phone Confidence: ${person.phoneConfidence || 'N/A'}`);
    console.log(`   Phone Verified: ${person.phoneVerified || false}`);
    console.log(`   Last Enriched: ${person.lastEnriched || 'N/A'}`);
    console.log('');

    // Check customFields for enrichment data
    if (person.customFields) {
      console.log('Custom Fields (enrichment data):');
      const customFields = person.customFields;
      
      // Check for common enrichment field names
      const enrichmentFields = [
        'monacoEnrichment',
        'enrichmentData',
        'phoneEnrichment',
        'lushaData',
        'apolloData',
        'zoominfoData',
        'clearbitData',
        'hunterData',
        'phoneSource',
        'enrichmentHistory'
      ];

      for (const field of enrichmentFields) {
        if (customFields[field]) {
          console.log(`\n   ${field}:`);
          console.log(JSON.stringify(customFields[field], null, 6));
        }
      }

      // Print all customFields if they exist
      if (Object.keys(customFields).length > 0) {
        console.log('\n   All Custom Fields:');
        console.log(JSON.stringify(customFields, null, 2));
      }
    } else {
      console.log('No custom fields found');
    }
    console.log('');

    // Check actions to see if there's any enrichment history
    console.log('='.repeat(80));
    console.log('CHECKING ENRICHMENT ACTIONS');
    console.log('='.repeat(80));
    
    const enrichmentActions = await prisma.actions.findMany({
      where: {
        personId: person.id,
        OR: [
          { type: { contains: 'enrich', mode: 'insensitive' } },
          { subject: { contains: 'enrich', mode: 'insensitive' } },
          { subject: { contains: 'phone', mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      select: {
        id: true,
        type: true,
        subject: true,
        description: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`Found ${enrichmentActions.length} enrichment-related actions\n`);
    
    if (enrichmentActions.length > 0) {
      enrichmentActions.forEach((action, i) => {
        console.log(`${i + 1}. ${action.subject || action.type}`);
        console.log(`   Type: ${action.type}`);
        console.log(`   Description: ${action.description || 'N/A'}`);
        console.log(`   Created: ${action.createdAt}`);
        console.log('');
      });
    }

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Current Phone: ${person.phone || 'N/A'}`);
    console.log(`Phone Source: ${person.enrichmentSources?.join(', ') || 'Unknown'}`);
    console.log(`Phone Confidence: ${person.phoneConfidence || 'N/A'}`);
    console.log(`Phone Verified: ${person.phoneVerified || false}`);
    console.log('');
    
    if (!person.enrichmentSources || person.enrichmentSources.length === 0) {
      console.log('⚠️  No enrichment sources recorded');
      console.log('   The phone number may have been manually entered or imported');
    } else {
      console.log(`✅ Enrichment sources: ${person.enrichmentSources.join(', ')}`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMonicaEnrichmentSource();












