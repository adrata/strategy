#!/usr/bin/env node

/**
 * Comprehensive audit of contact coverage (LinkedIn, Email, Phone) across workspace
 * Verifies that data is properly extracted from Coresignal/Lusha to main fields
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

function extractPhoneFromLusha(enrichedData) {
  if (!enrichedData || typeof enrichedData !== 'object') {
    return null;
  }
  // Priority: directDial > mobile > work > phone1
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
  if (enrichedData.personalEmail) {
    return enrichedData.personalEmail;
  }
  if (enrichedData.emails && Array.isArray(enrichedData.emails) && enrichedData.emails.length > 0) {
    return enrichedData.emails[0].email;
  }
  return null;
}

async function auditWorkspaceContactCoverage(workspaceSlug = 'adrata') {
  console.log("📊 COMPREHENSIVE CONTACT COVERAGE AUDIT");
  console.log("========================================\n");

  try {
    // Find workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { id: workspaceSlug },
          { slug: workspaceSlug },
          { name: { contains: workspaceSlug, mode: 'insensitive' } }
        ],
        deletedAt: null,
      },
    });

    if (!workspace) {
      throw new Error(`Workspace "${workspaceSlug}" not found`);
    }

    console.log(`Workspace: ${workspace.name} (${workspace.slug || workspace.id})\n`);

    // Get all people
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        linkedinUrl: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        coresignalData: true,
        enrichedData: true,
        dataSources: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    const total = allPeople.length;
    console.log(`Total People: ${total}\n`);

    // LinkedIn Coverage
    const withLinkedIn = allPeople.filter(p => p.linkedinUrl).length;
    const linkedInCoverage = total > 0 ? ((withLinkedIn / total) * 100).toFixed(1) : 0;

    // Email Coverage
    const withEmail = allPeople.filter(p => p.email || p.workEmail || p.personalEmail).length;
    const emailCoverage = total > 0 ? ((withEmail / total) * 100).toFixed(1) : 0;

    // Phone Coverage
    const withPhone = allPeople.filter(p => p.phone || p.mobilePhone || p.workPhone).length;
    const phoneCoverage = total > 0 ? ((withPhone / total) * 100).toFixed(1) : 0;

    // Check extraction status
    let emailsInDataOnly = 0;
    let phonesInDataOnly = 0;
    let emailsProperlyExtracted = 0;
    let phonesProperlyExtracted = 0;

    const extractionDetails = {
      emails: {
        inMainField: 0,
        inCoresignalOnly: 0,
        inLushaOnly: 0,
        inBothData: 0,
        notExtracted: 0,
      },
      phones: {
        inMainField: 0,
        inCoresignalOnly: 0,
        inLushaOnly: 0,
        inBothData: 0,
        notExtracted: 0,
      },
    };

    allPeople.forEach(person => {
      // Email extraction check
      const hasMainEmail = !!(person.email || person.workEmail || person.personalEmail);
      const csEmail = extractEmailFromCoresignal(person.coresignalData);
      const lushaEmail = extractEmailFromLusha(person.enrichedData);

      if (hasMainEmail) {
        extractionDetails.emails.inMainField++;
        emailsProperlyExtracted++;
      } else {
        if (csEmail && lushaEmail) {
          extractionDetails.emails.inBothData++;
          emailsInDataOnly++;
        } else if (csEmail) {
          extractionDetails.emails.inCoresignalOnly++;
          emailsInDataOnly++;
        } else if (lushaEmail) {
          extractionDetails.emails.inLushaOnly++;
          emailsInDataOnly++;
        } else {
          extractionDetails.emails.notExtracted++;
        }
      }

      // Phone extraction check
      const hasMainPhone = !!(person.phone || person.mobilePhone || person.workPhone);
      const csPhone = extractPhoneFromCoresignal(person.coresignalData);
      const lushaPhone = extractPhoneFromLusha(person.enrichedData);

      if (hasMainPhone) {
        extractionDetails.phones.inMainField++;
        phonesProperlyExtracted++;
      } else {
        if (csPhone && lushaPhone) {
          extractionDetails.phones.inBothData++;
          phonesInDataOnly++;
        } else if (csPhone) {
          extractionDetails.phones.inCoresignalOnly++;
          phonesInDataOnly++;
        } else if (lushaPhone) {
          extractionDetails.phones.inLushaOnly++;
          phonesInDataOnly++;
        } else {
          extractionDetails.phones.notExtracted++;
        }
      }
    });

    // Verification status
    const verifiedEmails = allPeople.filter(p => p.emailVerified === true).length;
    const verifiedPhones = allPeople.filter(p => p.phoneVerified === true).length;

    // Data sources
    const withCoresignal = allPeople.filter(p => 
      p.dataSources && Array.isArray(p.dataSources) && p.dataSources.includes('coresignal')
    ).length;
    const withLusha = allPeople.filter(p => 
      p.dataSources && Array.isArray(p.dataSources) && p.dataSources.includes('lusha')
    ).length;
    const withBoth = allPeople.filter(p => 
      p.dataSources && Array.isArray(p.dataSources) && 
      p.dataSources.includes('coresignal') && p.dataSources.includes('lusha')
    ).length;

    // Print results
    console.log("📊 COVERAGE SUMMARY");
    console.log("===================");
    console.log(`LinkedIn: ${withLinkedIn}/${total} (${linkedInCoverage}%)`);
    console.log(`Email:   ${withEmail}/${total} (${emailCoverage}%)`);
    console.log(`Phone:   ${withPhone}/${total} (${phoneCoverage}%)`);

    console.log("\n✅ EXTRACTION STATUS");
    console.log("====================");
    console.log(`Emails properly extracted: ${emailsProperlyExtracted}/${total} (${((emailsProperlyExtracted / total) * 100).toFixed(1)}%)`);
    console.log(`Phones properly extracted: ${phonesProperlyExtracted}/${total} (${((phonesProperlyExtracted / total) * 100).toFixed(1)}%)`);

    if (emailsInDataOnly > 0 || phonesInDataOnly > 0) {
      console.log("\n⚠️  EXTRACTION ISSUES");
      console.log("=====================");
      if (emailsInDataOnly > 0) {
        console.log(`Emails in data but not extracted: ${emailsInDataOnly}`);
        console.log(`  - In Coresignal only: ${extractionDetails.emails.inCoresignalOnly}`);
        console.log(`  - In Lusha only: ${extractionDetails.emails.inLushaOnly}`);
        console.log(`  - In both: ${extractionDetails.emails.inBothData}`);
      }
      if (phonesInDataOnly > 0) {
        console.log(`Phones in data but not extracted: ${phonesInDataOnly}`);
        console.log(`  - In Coresignal only: ${extractionDetails.phones.inCoresignalOnly}`);
        console.log(`  - In Lusha only: ${extractionDetails.phones.inLushaOnly}`);
        console.log(`  - In both: ${extractionDetails.phones.inBothData}`);
      }
    } else {
      console.log("\n✅ All emails and phones are properly extracted!");
    }

    console.log("\n🔍 VERIFICATION STATUS");
    console.log("======================");
    console.log(`Verified emails: ${verifiedEmails}/${withEmail} (${withEmail > 0 ? ((verifiedEmails / withEmail) * 100).toFixed(1) : 0}%)`);
    console.log(`Verified phones: ${verifiedPhones}/${withPhone} (${withPhone > 0 ? ((verifiedPhones / withPhone) * 100).toFixed(1) : 0}%)`);

    console.log("\n📦 DATA SOURCES");
    console.log("===============");
    console.log(`With Coresignal: ${withCoresignal} (${((withCoresignal / total) * 100).toFixed(1)}%)`);
    console.log(`With Lusha: ${withLusha} (${((withLusha / total) * 100).toFixed(1)}%)`);
    console.log(`With both: ${withBoth} (${((withBoth / total) * 100).toFixed(1)}%)`);

    // Overall assessment
    console.log("\n📈 OVERALL ASSESSMENT");
    console.log("====================");
    
    const coverageScore = (
      (parseFloat(linkedInCoverage) * 0.3) +
      (parseFloat(emailCoverage) * 0.4) +
      (parseFloat(phoneCoverage) * 0.3)
    ).toFixed(1);

    const extractionScore = (
      ((emailsProperlyExtracted / total) * 50) +
      ((phonesProperlyExtracted / total) * 50)
    ).toFixed(1);

    console.log(`Coverage Score: ${coverageScore}%`);
    console.log(`Extraction Score: ${extractionScore}%`);

    if (parseFloat(coverageScore) >= 80 && parseFloat(extractionScore) >= 90) {
      console.log("\n✅ EXCELLENT: Good coverage and proper extraction!");
    } else if (parseFloat(coverageScore) >= 70 && parseFloat(extractionScore) >= 80) {
      console.log("\n✅ GOOD: Decent coverage and extraction");
    } else if (parseFloat(coverageScore) >= 60) {
      console.log("\n⚠️  FAIR: Coverage could be improved");
    } else {
      console.log("\n❌ NEEDS IMPROVEMENT: Low coverage or extraction issues");
    }

    // Sample issues if any
    if (emailsInDataOnly > 0 || phonesInDataOnly > 0) {
      console.log("\n📋 SAMPLE RECORDS WITH EXTRACTION ISSUES");
      console.log("========================================");
      let count = 0;
      for (const person of allPeople) {
        if (count >= 5) break;
        
        const hasMainEmail = !!(person.email || person.workEmail || person.personalEmail);
        const hasMainPhone = !!(person.phone || person.mobilePhone || person.workPhone);
        const csEmail = extractEmailFromCoresignal(person.coresignalData);
        const lushaEmail = extractEmailFromLusha(person.enrichedData);
        const csPhone = extractPhoneFromCoresignal(person.coresignalData);
        const lushaPhone = extractPhoneFromLusha(person.enrichedData);

        if ((!hasMainEmail && (csEmail || lushaEmail)) || (!hasMainPhone && (csPhone || lushaPhone))) {
          count++;
          console.log(`\n${count}. ${person.fullName}`);
          if (!hasMainEmail && (csEmail || lushaEmail)) {
            console.log(`   Email: ${csEmail || lushaEmail} (in ${csEmail ? 'Coresignal' : 'Lusha'} data, not extracted)`);
          }
          if (!hasMainPhone && (csPhone || lushaPhone)) {
            console.log(`   Phone: ${csPhone || lushaPhone} (in ${csPhone ? 'Coresignal' : 'Lusha'} data, not extracted)`);
          }
        }
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

// Get workspace from command line or default to 'adrata'
const workspaceSlug = process.argv[2] || 'adrata';

auditWorkspaceContactCoverage(workspaceSlug)
  .then(() => {
    console.log("\n✨ Audit completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Audit failed:", error);
    process.exit(1);
  });

