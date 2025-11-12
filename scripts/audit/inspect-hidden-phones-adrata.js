#!/usr/bin/env node

/**
 * Inspect the structure of hidden phones in Adrata to understand why they're not being extracted
 */

const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

function extractPhoneFromCoresignal(coresignalData) {
  if (!coresignalData || typeof coresignalData !== 'object') {
    return null;
  }
  if (coresignalData.phone) {
    return coresignalData.phone;
  }
  if (coresignalData.phone_numbers && Array.isArray(coresignalData.phone_numbers)) {
    const firstPhone = coresignalData.phone_numbers[0];
    if (firstPhone && firstPhone.phone_number) {
      return firstPhone.phone_number;
    }
  }
  return null;
}

function extractPhoneFromLusha(enrichedData) {
  if (!enrichedData || typeof enrichedData !== 'object') {
    return null;
  }
  if (enrichedData.directDialPhone) {
    return enrichedData.directDialPhone;
  }
  if (enrichedData.mobilePhone) {
    return enrichedData.mobilePhone;
  }
  if (enrichedData.workPhone) {
    return enrichedData.workPhone;
  }
  if (enrichedData.phone1) {
    return enrichedData.phone1;
  }
  if (enrichedData.phones && Array.isArray(enrichedData.phones) && enrichedData.phones.length > 0) {
    return enrichedData.phones[0].number;
  }
  return null;
}

async function inspectHiddenPhonesAdrata() {
  console.log("🔍 INSPECTING HIDDEN PHONES IN ADRATA");
  console.log("=====================================\n");

  try {
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [{ id: "adrata" }, { slug: "adrata" }, { name: "adrata" }],
      },
    });

    // Get people without phone but with enrichment data
    const people = await prisma.people.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        deletedAt: null,
        phone: null,
        mobilePhone: null,
        workPhone: null,
        OR: [
          { coresignalData: { not: null } },
          { enrichedData: { not: null } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        coresignalData: true,
        enrichedData: true,
      },
      take: 20,
    });

    console.log(`Found ${people.length} people without phone but with enrichment data\n`);

    for (const person of people) {
      console.log(`\n${person.fullName}:`);
      
      // Check Coresignal
      if (person.coresignalData) {
        console.log(`  Coresignal Data Keys: ${Object.keys(person.coresignalData).join(', ')}`);
        const csPhone = extractPhoneFromCoresignal(person.coresignalData);
        if (csPhone) {
          console.log(`  ✅ Coresignal Phone: ${csPhone}`);
        } else {
          console.log(`  ❌ No phone found in Coresignal`);
          // Show phone-related keys
          const phoneKeys = Object.keys(person.coresignalData).filter(k => 
            k.toLowerCase().includes('phone') || k.toLowerCase().includes('mobile')
          );
          if (phoneKeys.length > 0) {
            console.log(`  Phone-related keys: ${phoneKeys.join(', ')}`);
            phoneKeys.forEach(key => {
              console.log(`    ${key}: ${JSON.stringify(person.coresignalData[key]).substring(0, 100)}`);
            });
          }
        }
      } else {
        console.log(`  ❌ No Coresignal data`);
      }

      // Check Lusha
      if (person.enrichedData) {
        console.log(`  Lusha Data Keys: ${Object.keys(person.enrichedData).join(', ')}`);
        const lushaPhone = extractPhoneFromLusha(person.enrichedData);
        if (lushaPhone) {
          console.log(`  ✅ Lusha Phone: ${lushaPhone}`);
        } else {
          console.log(`  ❌ No phone found in Lusha`);
          // Show phone-related keys
          const phoneKeys = Object.keys(person.enrichedData).filter(k => 
            k.toLowerCase().includes('phone') || k.toLowerCase().includes('mobile')
          );
          if (phoneKeys.length > 0) {
            console.log(`  Phone-related keys: ${phoneKeys.join(', ')}`);
            phoneKeys.forEach(key => {
              const value = person.enrichedData[key];
              if (Array.isArray(value)) {
                console.log(`    ${key}: Array[${value.length}]`);
                if (value.length > 0) {
                  console.log(`      First item: ${JSON.stringify(value[0]).substring(0, 100)}`);
                }
              } else {
                console.log(`    ${key}: ${JSON.stringify(value).substring(0, 100)}`);
              }
            });
          }
        }
      } else {
        console.log(`  ❌ No Lusha data`);
      }
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

inspectHiddenPhonesAdrata()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

