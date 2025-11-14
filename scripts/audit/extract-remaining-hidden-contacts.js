#!/usr/bin/env node

/**
 * Extract remaining hidden emails and phones from Coresignal/Lusha data
 * Fixes the 17 hidden phones in Adrata and 1 hidden email in E&I Cooperative
 */

const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

function extractEmailFromCoresignal(coresignalData) {
  if (!coresignalData || typeof coresignalData !== 'object') {
    return null;
  }
  if (coresignalData.primary_professional_email) {
    return coresignalData.primary_professional_email;
  }
  if (coresignalData.professional_emails_collection && Array.isArray(coresignalData.professional_emails_collection)) {
    const firstEmail = coresignalData.professional_emails_collection[0];
    if (firstEmail && firstEmail.professional_email) {
      return firstEmail.professional_email;
    }
  }
  if (coresignalData.email) {
    return coresignalData.email;
  }
  return null;
}

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

function extractEmailFromLusha(enrichedData) {
  if (!enrichedData || typeof enrichedData !== 'object') {
    return null;
  }
  if (enrichedData.primaryEmail) {
    return enrichedData.primaryEmail;
  }
  if (enrichedData.email) {
    return enrichedData.email;
  }
  if (enrichedData.workEmail) {
    return enrichedData.workEmail;
  }
  if (enrichedData.emails && Array.isArray(enrichedData.emails) && enrichedData.emails.length > 0) {
    return enrichedData.emails[0].email;
  }
  return null;
}

function extractPhoneFromLusha(enrichedData) {
  if (!enrichedData || typeof enrichedData !== 'object') {
    return null;
  }
  // Priority: directDialPhone > mobilePhone > workPhone > phone1
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

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // Basic phone validation - at least 10 digits
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

async function extractRemainingHiddenContacts() {
  console.log("🔄 EXTRACTING REMAINING HIDDEN CONTACTS");
  console.log("======================================\n");

  try {
    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });

    const allStats = {
      workspaces: [],
      totalEmailsExtracted: 0,
      totalPhonesExtracted: 0,
    };

    for (const workspace of workspaces) {
      console.log(`\n📊 Processing ${workspace.name}...`);

      // Get people without email/phone but with enrichment data
      const people = await prisma.people.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          OR: [
            {
              AND: [
                { email: null },
                { workEmail: null },
                { personalEmail: null },
                { OR: [
                  { coresignalData: { not: null } },
                  { enrichedData: { not: null } },
                ]},
              ],
            },
            {
              AND: [
                { phone: null },
                { mobilePhone: null },
                { workPhone: null },
                { OR: [
                  { coresignalData: { not: null } },
                  { enrichedData: { not: null } },
                ]},
              ],
            },
          ],
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          workEmail: true,
          personalEmail: true,
          phone: true,
          mobilePhone: true,
          workPhone: true,
          coresignalData: true,
          enrichedData: true,
        },
      });

      const workspaceStats = {
        workspaceName: workspace.name,
        emailsExtracted: 0,
        phonesExtracted: 0,
      };

      for (const person of people) {
        const updateData = {};

        // Check for hidden email
        if (!person.email && !person.workEmail && !person.personalEmail) {
          const csEmail = extractEmailFromCoresignal(person.coresignalData);
          const lushaEmail = extractEmailFromLusha(person.enrichedData);
          const email = csEmail || lushaEmail;

          if (email && isValidEmail(email)) {
            updateData.email = email;
            updateData.emailVerified = true;
            workspaceStats.emailsExtracted++;
            allStats.totalEmailsExtracted++;
            console.log(`   ✅ ${person.fullName}: Email extracted (${csEmail ? 'Coresignal' : 'Lusha'})`);
          }
        }

        // Check for hidden phone
        if (!person.phone && !person.mobilePhone && !person.workPhone) {
          const csPhone = extractPhoneFromCoresignal(person.coresignalData);
          const lushaPhone = extractPhoneFromLusha(person.enrichedData);
          const phone = csPhone || lushaPhone;

          if (phone && isValidPhone(phone)) {
            // Determine phone type from Lusha data if available
            if (lushaPhone && person.enrichedData && typeof person.enrichedData === 'object') {
              const ed = person.enrichedData;
              if (ed.directDialPhone === phone) {
                updateData.phone = phone;
                updateData.phoneVerified = true;
                updateData.phoneConfidence = 0.9;
              } else if (ed.mobilePhone === phone) {
                updateData.mobilePhone = phone;
                updateData.phone = phone; // Also set main phone
                updateData.phoneVerified = true;
                updateData.phoneConfidence = 0.85;
              } else if (ed.workPhone === phone) {
                updateData.workPhone = phone;
                updateData.phone = phone; // Also set main phone
                updateData.phoneVerified = true;
                updateData.phoneConfidence = 0.8;
              } else {
                updateData.phone = phone;
                updateData.phoneVerified = true;
                updateData.phoneConfidence = 0.75;
              }
            } else {
              // From Coresignal or unknown source
              updateData.phone = phone;
              updateData.phoneVerified = true;
              updateData.phoneConfidence = 0.7;
            }

            workspaceStats.phonesExtracted++;
            allStats.totalPhonesExtracted++;
            console.log(`   ✅ ${person.fullName}: Phone extracted (${csPhone ? 'Coresignal' : 'Lusha'})`);
          }
        }

        // Update if we found anything
        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date();
          await prisma.people.update({
            where: { id: person.id },
            data: updateData,
          });
        }
      }

      if (workspaceStats.emailsExtracted > 0 || workspaceStats.phonesExtracted > 0) {
        allStats.workspaces.push(workspaceStats);
        console.log(`   ✅ Extracted ${workspaceStats.emailsExtracted} emails, ${workspaceStats.phonesExtracted} phones`);
      } else {
        console.log(`   ✅ No hidden contacts found`);
      }
    }

    // Summary
    console.log("\n\n📊 EXTRACTION SUMMARY");
    console.log("====================");
    console.log(`Total emails extracted: ${allStats.totalEmailsExtracted}`);
    console.log(`Total phones extracted: ${allStats.totalPhonesExtracted}`);

    if (allStats.totalEmailsExtracted > 0 || allStats.totalPhonesExtracted > 0) {
      console.log(`\n📋 BY WORKSPACE:`);
      allStats.workspaces.forEach(ws => {
        if (ws.emailsExtracted > 0 || ws.phonesExtracted > 0) {
          console.log(`   ${ws.workspaceName}: ${ws.emailsExtracted} emails, ${ws.phonesExtracted} phones`);
        }
      });
    }

    console.log(`\n\n✅ All remaining hidden contacts have been extracted!`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

extractRemainingHiddenContacts()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });


