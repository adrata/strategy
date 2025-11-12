#!/usr/bin/env node

/**
 * Comprehensive Lusha Enrichment for Dan's Leads
 * 
 * Enriches leads with full Lusha data including:
 * - Email addresses
 * - Phone numbers
 * - Professional information
 * - Company information
 * - Skills and education
 * 
 * Based on find-buyer-group pipeline Lusha implementation
 */

const fetch = require('node-fetch');
const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

// Helper functions
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function isTempEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const tempPatterns = ['@coresignal.temp', '@temp.', 'placeholder', 'example.com', 'test.com', 'fake.com'];
  return tempPatterns.some(pattern => email.toLowerCase().includes(pattern));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate phone data quality score (0-100)
 * Same logic as find-buyer-group pipeline
 */
function calculatePhoneQuality(phones) {
  if (phones.length === 0) return 0;
  
  let quality = 30; // Base score for having any phone
  
  // Bonus for phone types (business value) - using Lusha's phoneType field
  const hasDirectDial = phones.some(p => p.phoneType === 'direct' || p.phoneType === 'direct_dial');
  const hasMobile = phones.some(p => p.phoneType === 'mobile');
  const hasWork = phones.some(p => p.phoneType === 'work' || p.phoneType === 'office');
  
  if (hasDirectDial) quality += 30; // Direct dial is most valuable
  if (hasMobile) quality += 20;     // Mobile is very valuable
  if (hasWork) quality += 15;       // Work phone is valuable
  
  // Bonus for verification (Lusha uses doNotCall: false as verification)
  const verifiedPhones = phones.filter(p => !p.doNotCall).length;
  quality += verifiedPhones * 5; // 5 points per verified phone
  
  // Bonus for multiple phone numbers
  if (phones.length >= 2) quality += 10;
  if (phones.length >= 3) quality += 5;
  
  return Math.min(quality, 100);
}

/**
 * Enrich contact with Lusha using LinkedIn URL
 * Returns full Lusha data including emails, phones, and professional info
 */
async function enrichWithLushaLinkedIn(linkedinUrl, apiKey) {
  try {
    if (!linkedinUrl || !apiKey) {
      return null;
    }

    // Clean API key
    const cleanedKey = (apiKey || '').trim().replace(/\n/g, '').replace(/\r/g, '');
    
    const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(linkedinUrl)}`, {
      method: 'GET',
      headers: {
        'api_key': cleanedKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ⚠️  Lusha API error: ${response.status} - ${errorText.substring(0, 100)}`);
      return null;
    }

    const data = await response.json();

    // Lusha v2 response format: { contact: { data: {...}, error: {...}, isCreditCharged: boolean } }
    if (data.contact && data.contact.data && !data.contact.error) {
      const personData = data.contact.data;
      
      // Extract all available data
      const enrichedData = {
        // Basic info
        fullName: personData.fullName || null,
        firstName: personData.firstName || null,
        lastName: personData.lastName || null,
        middleName: personData.middleName || null,
        
        // Professional info
        jobTitle: personData.jobTitle?.title || personData.jobTitle || null,
        seniority: personData.seniority || null,
        department: personData.department || null,
        function: personData.function || null,
        managementLevel: personData.managementLevel || null,
        yearsInRole: personData.yearsInRole || null,
        yearsAtCompany: personData.yearsAtCompany || null,
        
        // Company info
        companyName: personData.companyName || null,
        companyDomain: personData.companyDomain || null,
        companySize: personData.companySize || null,
        companyIndustry: personData.companyIndustry || null,
        
        // Contact info - EMAILS
        emails: [],
        primaryEmail: null,
        workEmail: null,
        personalEmail: null,
        
        // Contact info - PHONES
        phones: [],
        phone1: null,
        phone1Type: null,
        phone1Verified: null,
        phone1Extension: null,
        phone2: null,
        phone2Type: null,
        phone2Verified: null,
        phone2Extension: null,
        directDialPhone: null,
        mobilePhone: null,
        mobilePhoneVerified: null,
        workPhone: null,
        workPhoneVerified: null,
        phoneDataQuality: 0,
        
        // Location
        location: personData.location || null,
        country: personData.country || null,
        city: personData.city || null,
        state: personData.state || null,
        
        // Skills and education
        skills: personData.skills || [],
        technologies: personData.technologies || [],
        certifications: personData.certifications || [],
        languages: personData.languages || [],
        education: personData.education || [],
        
        // Metadata
        linkedinUrl: personData.linkedinUrl || linkedinUrl,
        creditCharged: data.contact.isCreditCharged || false,
        enrichmentDate: new Date().toISOString(),
        enrichmentSource: 'lusha_v2_linkedin',
      };

      // Extract emails
      if (personData.emailAddresses && Array.isArray(personData.emailAddresses)) {
        enrichedData.emails = personData.emailAddresses.map(e => ({
          email: e.email,
          type: e.type || 'unknown',
          confidence: e.confidence || null,
          isValid: e.isValid !== false,
          isPrimary: e.isPrimary || false,
          source: e.source || 'lusha',
        }));

        // Find primary email
        const primaryEmail = enrichedData.emails.find(e => e.isPrimary) || enrichedData.emails[0];
        if (primaryEmail) {
          enrichedData.primaryEmail = primaryEmail.email;
          
          // Categorize email
          if (primaryEmail.type === 'work' || primaryEmail.type === 'professional') {
            enrichedData.workEmail = primaryEmail.email;
          } else if (primaryEmail.type === 'personal') {
            enrichedData.personalEmail = primaryEmail.email;
          }
        }
      }

      // Extract phones (same logic as find-buyer-group)
      if (personData.phoneNumbers && Array.isArray(personData.phoneNumbers)) {
        const phones = personData.phoneNumbers;
        
        enrichedData.phones = phones.map(p => ({
          number: p.number,
          type: p.phoneType || p.type || 'unknown',
          country: p.country || null,
          verified: !p.doNotCall,
          extension: p.extension || null,
          doNotCall: p.doNotCall || false,
        }));

        // Lusha v2 uses 'phoneType' not 'type', and different type values
        // Priority: direct > mobile > work > main (same as find-buyer-group)
        const directDial = phones.find(p => p.phoneType === 'direct' || p.phoneType === 'direct_dial');
        const mobile = phones.find(p => p.phoneType === 'mobile');
        const work = phones.find(p => p.phoneType === 'work' || p.phoneType === 'office');
        const main = phones.find(p => p.phoneType === 'main' || p.phoneType === 'company');

        // Get the two most valuable phone numbers (same priority order as find-buyer-group)
        const prioritizedPhones = [directDial, mobile, work, main].filter(Boolean);

        // Set phone1 (highest priority)
        if (prioritizedPhones[0]) {
          enrichedData.phone1 = prioritizedPhones[0].number;
          enrichedData.phone1Type = prioritizedPhones[0].phoneType || prioritizedPhones[0].type;
          enrichedData.phone1Verified = !prioritizedPhones[0].doNotCall; // Lusha uses doNotCall flag
          enrichedData.phone1Extension = prioritizedPhones[0].extension || null;
        }

        // Set phone2 (second highest priority)
        if (prioritizedPhones[1]) {
          enrichedData.phone2 = prioritizedPhones[1].number;
          enrichedData.phone2Type = prioritizedPhones[1].phoneType || prioritizedPhones[1].type;
          enrichedData.phone2Verified = !prioritizedPhones[1].doNotCall;
          enrichedData.phone2Extension = prioritizedPhones[1].extension || null;
        }

        // Set specific phone type fields for quick access (same as find-buyer-group)
        if (directDial) {
          enrichedData.directDialPhone = directDial.number;
        }

        if (mobile) {
          enrichedData.mobilePhone = mobile.number;
          enrichedData.mobilePhoneVerified = !mobile.doNotCall;
        }

        if (work) {
          enrichedData.workPhone = work.number;
          enrichedData.workPhoneVerified = !work.doNotCall;
        }

        // Calculate phone data quality score (same logic as find-buyer-group)
        enrichedData.phoneDataQuality = calculatePhoneQuality(phones);
      }

      return enrichedData;
    } else if (data.contact && data.contact.error) {
      console.log(`   ⚠️  Lusha error: ${data.contact.error.message} (${data.contact.error.name})`);
      return null;
    }

    return null;
  } catch (error) {
    console.log(`   ⚠️  Lusha enrichment error: ${error.message}`);
    return null;
  }
}

/**
 * Update person record with Lusha data
 */
async function updatePersonWithLushaData(personId, lushaData) {
  try {
    const updateData = {
      updatedAt: new Date(),
      lastEnriched: new Date(),
    };

    // Update email if we found one and person doesn't have one
    const person = await prisma.people.findUnique({
      where: { id: personId },
      select: { email: true, workEmail: true, personalEmail: true, phone: true, mobilePhone: true, workPhone: true, jobTitle: true },
    });

    if (lushaData.primaryEmail && isValidEmail(lushaData.primaryEmail) && !isTempEmail(lushaData.primaryEmail)) {
      if (!person.email) {
        updateData.email = lushaData.primaryEmail;
        updateData.emailVerified = true; // Lusha emails are generally reliable
      }
    }

    if (lushaData.workEmail && isValidEmail(lushaData.workEmail) && !isTempEmail(lushaData.workEmail)) {
      if (!person.workEmail) {
        updateData.workEmail = lushaData.workEmail;
      }
    }

    if (lushaData.personalEmail && isValidEmail(lushaData.personalEmail) && !isTempEmail(lushaData.personalEmail)) {
      if (!person.personalEmail) {
        updateData.personalEmail = lushaData.personalEmail;
      }
    }

    // Update phones following find-buyer-group pattern
    // Priority: direct dial > mobile > work > phone1
    if (lushaData.directDialPhone && !person.phone) {
      updateData.phone = lushaData.directDialPhone;
      updateData.phoneVerified = true;
      updateData.phoneConfidence = 90; // Direct dial is highest confidence
    } else if (lushaData.mobilePhone && !person.phone) {
      updateData.phone = lushaData.mobilePhone;
      updateData.phoneVerified = true;
      updateData.phoneConfidence = 85; // Mobile is high confidence
    } else if (lushaData.workPhone && !person.phone) {
      updateData.phone = lushaData.workPhone;
      updateData.phoneVerified = true;
      updateData.phoneConfidence = 80; // Work phone is good confidence
    } else if (lushaData.phone1 && !person.phone) {
      updateData.phone = lushaData.phone1;
      updateData.phoneVerified = true;
      updateData.phoneConfidence = 75; // Default confidence
    }

    // Store specific phone types in their dedicated fields
    if (lushaData.mobilePhone && !person.mobilePhone) {
      updateData.mobilePhone = lushaData.mobilePhone;
    }

    if (lushaData.workPhone && !person.workPhone) {
      updateData.workPhone = lushaData.workPhone;
    }

    // Store phone quality score if available
    if (lushaData.phoneDataQuality !== undefined) {
      updateData.phoneQualityScore = lushaData.phoneDataQuality / 100; // Convert 0-100 to 0-1
    }

    // Update job title if missing
    if (lushaData.jobTitle && !person.jobTitle) {
      updateData.jobTitle = lushaData.jobTitle;
    }

    // Store full Lusha data in enrichedData field
    updateData.enrichedData = lushaData;

    // Update dataSources
    const currentPerson = await prisma.people.findUnique({
      where: { id: personId },
      select: { dataSources: true },
    });

    const dataSources = currentPerson?.dataSources || [];
    if (!dataSources.includes('lusha')) {
      dataSources.push('lusha');
    }
    updateData.dataSources = dataSources;

    await prisma.people.update({
      where: { id: personId },
      data: updateData,
    });

    return true;
  } catch (error) {
    console.error(`   ❌ Error updating person ${personId}: ${error.message}`);
    return false;
  }
}

/**
 * Main enrichment function
 */
async function enrichDanLeadsWithLusha() {
  console.log("🚀 LUSHA ENRICHMENT FOR DAN'S LEADS");
  console.log("====================================\n");

  try {
    // Check for Lusha API key
    if (!process.env.LUSHA_API_KEY) {
      throw new Error("LUSHA_API_KEY environment variable is required");
    }

    // Find Dan user and workspace
    const danUser = await prisma.users.findFirst({
      where: { email: "dan@adrata.com" },
    });

    if (!danUser) {
      throw new Error("Dan user not found");
    }

    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [{ id: "adrata" }, { slug: "adrata" }, { name: "adrata" }],
      },
    });

    if (!adrataWorkspace) {
      throw new Error("Adrata workspace not found");
    }

    // Get leads that need enrichment (have LinkedIn but missing email or phone)
    const leadsToEnrich = await prisma.people.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        mainSellerId: danUser.id,
        deletedAt: null,
        linkedinUrl: { not: null },
        OR: [
          { email: null },
          { phone: null },
        ],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        linkedinUrl: true,
        dataSources: true,
        lastEnriched: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${leadsToEnrich.length} leads to enrich with Lusha\n`);

    const stats = {
      total: leadsToEnrich.length,
      processed: 0,
      enriched: 0,
      emailsFound: 0,
      phonesFound: 0,
      errors: 0,
      skipped: 0,
    };

    // Process in batches with rate limiting
    const batchSize = 5;
    for (let i = 0; i < leadsToEnrich.length; i += batchSize) {
      const batch = leadsToEnrich.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`\n📦 Processing batch ${batchNumber} (${batch.length} leads)...`);

      for (const lead of batch) {
        try {
          stats.processed++;
          console.log(`\n${stats.processed}. ${lead.fullName}`);
          console.log(`   LinkedIn: ${lead.linkedinUrl}`);

          // Check if already enriched recently (within 7 days)
          // FORCE RE-ENRICHMENT: Comment out this check to re-enrich everyone
          // if (lead.lastEnriched) {
          //   const daysSinceEnrichment = (Date.now() - new Date(lead.lastEnriched).getTime()) / (1000 * 60 * 60 * 24);
          //   if (daysSinceEnrichment < 7 && lead.dataSources?.includes('lusha')) {
          //     console.log(`   ⏭️  Skipped: Already enriched with Lusha ${Math.floor(daysSinceEnrichment)} days ago`);
          //     stats.skipped++;
          //     continue;
          //   }
          // }

          // Enrich with Lusha
          const lushaData = await enrichWithLushaLinkedIn(lead.linkedinUrl, process.env.LUSHA_API_KEY);

          if (!lushaData) {
            console.log(`   ⚠️  No Lusha data found`);
            stats.errors++;
            continue;
          }

          // Update person record
          const updated = await updatePersonWithLushaData(lead.id, lushaData);

          if (updated) {
            stats.enriched++;
            
            if (lushaData.primaryEmail) {
              stats.emailsFound++;
              console.log(`   ✅ Email: ${lushaData.primaryEmail}`);
            }
            
            if (lushaData.phone1 || lushaData.directDialPhone || lushaData.mobilePhone || lushaData.workPhone) {
              stats.phonesFound++;
              const phoneDisplay = lushaData.directDialPhone 
                ? `${lushaData.directDialPhone} (direct dial)`
                : lushaData.mobilePhone 
                ? `${lushaData.mobilePhone} (mobile)`
                : lushaData.workPhone
                ? `${lushaData.workPhone} (work)`
                : `${lushaData.phone1} (${lushaData.phone1Type})`;
              console.log(`   ✅ Phone: ${phoneDisplay}`);
              if (lushaData.phoneDataQuality > 0) {
                console.log(`   📊 Phone Quality: ${lushaData.phoneDataQuality}/100`);
              }
            }

            if (lushaData.jobTitle) {
              console.log(`   ✅ Title: ${lushaData.jobTitle}`);
            }

            console.log(`   ✅ Enriched successfully`);
          } else {
            stats.errors++;
          }

          // Rate limiting - Lusha allows ~100 requests/minute
          await delay(600); // 600ms = ~100 requests/minute

        } catch (error) {
          console.error(`   ❌ Error processing ${lead.fullName}: ${error.message}`);
          stats.errors++;
        }
      }

      // Longer delay between batches
      if (i + batchSize < leadsToEnrich.length) {
        console.log(`\n⏳ Waiting 2 seconds before next batch...`);
        await delay(2000);
      }
    }

    // Summary
    console.log("\n\n📊 ENRICHMENT RESULTS");
    console.log("====================");
    console.log(`Total leads: ${stats.total}`);
    console.log(`Processed: ${stats.processed}`);
    console.log(`Enriched: ${stats.enriched}`);
    console.log(`Emails found: ${stats.emailsFound}`);
    console.log(`Phones found: ${stats.phonesFound}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    console.log(`\n\n💡 NEXT STEPS`);
    console.log("=============");
    console.log(`1. ✅ ${stats.enriched} leads have been enriched with Lusha data`);
    console.log(`2. Run audit script to verify: node scripts/audit/audit-dan-lead-enrichment.js`);
    console.log(`3. Check enrichedData field for full Lusha data including professional info, skills, etc.`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run enrichment
enrichDanLeadsWithLusha()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

