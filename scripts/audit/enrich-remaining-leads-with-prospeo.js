#!/usr/bin/env node

/**
 * Enrich remaining leads with Prospeo email discovery
 * Uses the waterfall system to find emails for leads that Coresignal/Lusha couldn't find
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

function extractDomain(website) {
  if (!website) return null;
  return website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Discover email using Prospeo (waterfall system)
 * Based on ContactValidator.discoverWithProspeo
 */
async function discoverEmailWithProspeo(fullName, companyName, domain) {
  try {
    if (!process.env.PROSPEO_API_KEY) {
      console.log(`   ⚠️  Prospeo API key not configured`);
      return null;
    }

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    // Clean domain format for Prospeo
    const cleanDomain = domain ? domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : null;

    if (!cleanDomain) {
      console.log(`   ⚠️  No domain available for Prospeo discovery`);
      return null;
    }

    console.log(`   🔍 Prospeo: Discovering email for ${firstName} ${lastName} at ${cleanDomain}...`);

    const response = await fetch('https://api.prospeo.io/email-finder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KEY': process.env.PROSPEO_API_KEY.trim()
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        domain: cleanDomain,
        company: companyName || cleanDomain
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ⚠️  Prospeo API error: ${response.status} - ${errorText.substring(0, 100)}`);
      return null;
    }

    const data = await response.json();

    if (data.response && data.response.email) {
      const email = data.response.email;
      const confidence = data.response.confidence || 80;
      const isValid = data.response.email_status === 'valid' || data.response.email_status === 'deliverable';

      console.log(`   ✅ Prospeo found: ${email} (${confidence}% confidence, ${isValid ? 'valid' : 'unknown status'})`);

      return {
        email: email,
        confidence: confidence,
        isValid: isValid,
        source: 'prospeo',
        metadata: {
          verificationId: data.response.verification_id,
          emailStatus: data.response.email_status,
        }
      };
    } else {
      console.log(`   ⚠️  Prospeo: No email found`);
      return null;
    }

  } catch (error) {
    console.log(`   ⚠️  Prospeo discovery error: ${error.message}`);
    return null;
  }
}

/**
 * Verify email with Prospeo (if we want to verify discovered emails)
 */
async function verifyEmailWithProspeo(email) {
  try {
    if (!process.env.PROSPEO_API_KEY) {
      return null;
    }

    const response = await fetch('https://api.prospeo.io/email-verifier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KEY': process.env.PROSPEO_API_KEY.trim()
      },
      body: JSON.stringify({
        email: email
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.response) {
      return {
        isValid: data.response.email_status === 'valid' || data.response.email_status === 'deliverable',
        confidence: data.response.confidence || 80,
        status: data.response.email_status,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function enrichRemainingLeadsWithProspeo() {
  console.log("🚀 PROSPEO EMAIL DISCOVERY FOR REMAINING LEADS");
  console.log("==============================================\n");

  try {
    // Check for Prospeo API key
    if (!process.env.PROSPEO_API_KEY) {
      throw new Error("PROSPEO_API_KEY environment variable is required");
    }

    // Find Dan user and workspace
    const danUser = await prisma.users.findFirst({
      where: { email: "dan@adrata.com" },
    });

    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [{ id: "adrata" }, { slug: "adrata" }, { name: "adrata" }],
      },
    });

    // Get remaining leads without email
    const remainingLeads = await prisma.people.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        mainSellerId: danUser.id,
        deletedAt: null,
        linkedinUrl: { not: null },
        email: null,
        workEmail: null,
        personalEmail: null,
      },
      select: {
        id: true,
        fullName: true,
        linkedinUrl: true,
        company: {
          select: {
            name: true,
            website: true,
            domain: true,
          },
        },
      },
    });

    console.log(`Found ${remainingLeads.length} leads without email to try Prospeo discovery\n`);

    const stats = {
      total: remainingLeads.length,
      processed: 0,
      emailsFound: 0,
      emailsVerified: 0,
      errors: 0,
    };

    for (const lead of remainingLeads) {
      try {
        stats.processed++;
        console.log(`\n${stats.processed}. ${lead.fullName}`);
        console.log(`   Company: ${lead.company?.name || 'N/A'}`);
        
        const domain = lead.company?.domain || extractDomain(lead.company?.website);
        if (!domain) {
          console.log(`   ⚠️  No domain available, skipping Prospeo discovery`);
          continue;
        }

        console.log(`   Domain: ${domain}`);

        // Discover email with Prospeo
        const prospeoResult = await discoverEmailWithProspeo(
          lead.fullName,
          lead.company?.name || null,
          domain
        );

        if (!prospeoResult || !prospeoResult.email) {
          console.log(`   ❌ No email found via Prospeo`);
          continue;
        }

        // Validate email
        if (!isValidEmail(prospeoResult.email) || isTempEmail(prospeoResult.email)) {
          console.log(`   ⚠️  Invalid or temp email, skipping`);
          continue;
        }

        // Verify email if not already verified
        let emailVerified = prospeoResult.isValid;
        if (!emailVerified && prospeoResult.confidence >= 70) {
          // Try verification
          const verification = await verifyEmailWithProspeo(prospeoResult.email);
          if (verification) {
            emailVerified = verification.isValid;
            if (emailVerified) {
              stats.emailsVerified++;
            }
          }
        } else if (emailVerified) {
          stats.emailsVerified++;
        }

        // Update person record
        await prisma.people.update({
          where: { id: lead.id },
          data: {
            email: prospeoResult.email,
            emailVerified: emailVerified,
            emailConfidence: prospeoResult.confidence / 100, // Convert to 0-1 scale
            updatedAt: new Date(),
            lastEnriched: new Date(),
            dataSources: {
              push: 'prospeo',
            },
          },
        });

        stats.emailsFound++;
        console.log(`   ✅ Email saved: ${prospeoResult.email} (${prospeoResult.confidence}% confidence, ${emailVerified ? 'verified' : 'unverified'})`);

        // Rate limiting - Prospeo allows 100 requests/minute
        await delay(600); // 600ms = ~100 requests/minute

      } catch (error) {
        console.error(`   ❌ Error processing ${lead.fullName}: ${error.message}`);
        stats.errors++;
      }
    }

    // Summary
    console.log("\n\n📊 PROSPEO DISCOVERY RESULTS");
    console.log("============================");
    console.log(`Total leads: ${stats.total}`);
    console.log(`Processed: ${stats.processed}`);
    console.log(`Emails found: ${stats.emailsFound}`);
    console.log(`Emails verified: ${stats.emailsVerified}`);
    console.log(`Errors: ${stats.errors}`);

    console.log(`\n\n💡 NEXT STEPS`);
    console.log("=============");
    if (stats.emailsFound > 0) {
      console.log(`✅ Found ${stats.emailsFound} emails via Prospeo waterfall system`);
      console.log(`   Run audit script to verify: node scripts/audit/audit-dan-lead-enrichment.js`);
    } else {
      console.log(`⚠️  Prospeo didn't find emails for these leads`);
      console.log(`   These leads may not have publicly available emails`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

enrichRemainingLeadsWithProspeo()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });





