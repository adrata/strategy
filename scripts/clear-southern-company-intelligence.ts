import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSouthernCompanyIntelligence() {
  console.log('🧹 CLEARING SOUTHERN COMPANY INTELLIGENCE');
  console.log('================================================================================\n');

  const SOUTHERN_COMPANY_ID = '01K9QD2ST0C0TTG34EMRD3M69H';

  try {
    // Fetch current company data
    const company = await prisma.companies.findUnique({
      where: {
        id: SOUTHERN_COMPANY_ID,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        descriptionEnriched: true,
        customFields: true,
      },
    });

    if (!company) {
      console.log('❌ Southern Company not found');
      return;
    }

    console.log(`📊 Company: ${company.name} (${company.id})\n`);

    const customFields = company.customFields as any || {};
    const hasCachedIntelligence = !!customFields.intelligence;
    const hasBadDescription = company.descriptionEnriched && (
      company.descriptionEnriched.toLowerCase().includes('ישראל') ||
      company.descriptionEnriched.toLowerCase().includes('israel') ||
      company.descriptionEnriched.toLowerCase().includes('כפר נופש') ||
      company.descriptionEnriched.toLowerCase().includes('resort')
    );

    console.log('📦 CURRENT STATE:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`Has Cached Intelligence: ${hasCachedIntelligence ? 'Yes' : 'No'}`);
    if (hasCachedIntelligence) {
      console.log(`   Version: ${customFields.intelligenceVersion || 'unknown'}`);
      console.log(`   Generated At: ${customFields.intelligenceGeneratedAt || 'unknown'}`);
    }
    console.log(`Has Description Enriched: ${company.descriptionEnriched ? 'Yes' : 'No'}`);
    if (hasBadDescription) {
      console.log(`⚠️  Description Enriched contains bad data (Israeli/resort content)`);
    }

    // Prepare updates
    const updates: any = {
      updatedAt: new Date(),
    };

    // Clear cached intelligence
    if (hasCachedIntelligence) {
      const newCustomFields = { ...customFields };
      delete newCustomFields.intelligence;
      delete newCustomFields.intelligenceVersion;
      delete newCustomFields.intelligenceGeneratedAt;
      
      updates.customFields = newCustomFields;
      console.log(`\n✅ Will clear cached intelligence`);
    }

    // Clear descriptionEnriched if it contains bad data
    if (hasBadDescription) {
      updates.descriptionEnriched = null;
      console.log(`✅ Will clear descriptionEnriched (contains bad data)`);
    }

    if (Object.keys(updates).length === 1) {
      // Only updatedAt was set, nothing to update
      console.log(`\n✅ No cleanup needed - company data is already clean`);
      return;
    }

    // Apply updates
    console.log(`\n🔄 Applying updates...`);
    await prisma.companies.update({
      where: { id: SOUTHERN_COMPANY_ID },
      data: updates,
    });

    console.log(`✅ Successfully cleared cached intelligence and bad descriptionEnriched`);
    console.log(`\n📝 Next Steps:`);
    console.log(`   1. View the company intelligence tab to regenerate intelligence`);
    console.log(`   2. The new intelligence will use validated data sources`);
    console.log(`   3. Run test script to verify: npx tsx scripts/test-southern-company-fix.ts`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSouthernCompanyIntelligence();

