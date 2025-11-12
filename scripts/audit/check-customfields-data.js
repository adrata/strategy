#!/usr/bin/env node

/**
 * Check customFields for Coresignal and Lusha data that may contain emails
 */

const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

async function checkCustomFieldsData() {
  console.log("🔍 CHECKING CUSTOMFIELDS FOR CORESIGNAL/LUSHA DATA");
  console.log("====================================================\n");

  try {
    // Find Dan user
    const danUser = await prisma.users.findFirst({
      where: { email: "dan@adrata.com" },
    });

    if (!danUser) {
      throw new Error("Dan user not found");
    }

    // Find Adrata workspace
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { id: "adrata" },
          { slug: "adrata" },
          { name: "adrata" },
        ],
      },
    });

    if (!adrataWorkspace) {
      throw new Error("Adrata workspace not found");
    }

    // Get leads that were enriched (have dataSources) but no email
    const enrichedLeadsWithoutEmail = await prisma.people.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        mainSellerId: danUser.id,
        deletedAt: null,
        linkedinUrl: { not: null },
        email: null,
        dataSources: { has: "coresignal" }, // Has coresignal data
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        linkedinUrl: true,
        dataSources: true,
        customFields: true,
        coresignalData: true,
        enrichedData: true,
        lastEnriched: true,
      },
      take: 10, // Check first 10
    });

    console.log(`Found ${enrichedLeadsWithoutEmail.length} enriched leads without email to inspect\n`);

    enrichedLeadsWithoutEmail.forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.fullName}`);
      console.log(`   LinkedIn: ${lead.linkedinUrl}`);
      console.log(`   Data Sources: ${lead.dataSources?.join(', ') || 'None'}`);
      console.log(`   Last Enriched: ${lead.lastEnriched ? new Date(lead.lastEnriched).toLocaleDateString() : 'Never'}`);
      console.log(`   Email fields: email=${lead.email || 'null'}, workEmail=${lead.workEmail || 'null'}, personalEmail=${lead.personalEmail || 'null'}`);
      
      // Check coresignalData field (separate Json field, not in customFields)
      if (lead.coresignalData && typeof lead.coresignalData === 'object') {
        console.log(`   \n   📊 CORESIGNAL DATA FIELD FOUND:`);
        const cs = lead.coresignalData;
        console.log(`      Keys: ${Object.keys(cs).slice(0, 30).join(', ')}${Object.keys(cs).length > 30 ? '...' : ''}`);
        
        // Check for email fields
        if (cs.primary_professional_email) {
          console.log(`      ✅ primary_professional_email: ${cs.primary_professional_email}`);
        }
        if (cs.email) {
          console.log(`      ✅ email: ${cs.email}`);
        }
        if (cs.work_email) {
          console.log(`      ✅ work_email: ${cs.work_email}`);
        }
        if (cs.personal_email) {
          console.log(`      ✅ personal_email: ${cs.personal_email}`);
        }
        if (cs.professional_emails_collection) {
          const emails = Array.isArray(cs.professional_emails_collection) 
            ? cs.professional_emails_collection 
            : (cs.professional_emails_collection?.professional_email ? [cs.professional_emails_collection] : []);
          if (emails.length > 0) {
            console.log(`      ✅ professional_emails_collection: ${emails.map(e => e.professional_email || e.email || e).join(', ')}`);
          }
        }
        if (cs.emails && Array.isArray(cs.emails)) {
          console.log(`      ✅ emails array: ${cs.emails.slice(0, 5).join(', ')}${cs.emails.length > 5 ? '...' : ''}`);
        }
      }
      
      // Check enrichedData field (this is where Lusha data is stored)
      if (lead.enrichedData && typeof lead.enrichedData === 'object') {
        console.log(`   \n   📊 ENRICHED DATA FIELD FOUND (Lusha data):`);
        const ed = lead.enrichedData;
        console.log(`      Keys: ${Object.keys(ed).slice(0, 30).join(', ')}${Object.keys(ed).length > 30 ? '...' : ''}`);
        
        if (ed.email) {
          console.log(`      ✅ email: ${ed.email}`);
        }
        if (ed.workEmail) {
          console.log(`      ✅ workEmail: ${ed.workEmail}`);
        }
        if (ed.personalEmail) {
          console.log(`      ✅ personalEmail: ${ed.personalEmail}`);
        }
        if (ed.contact) {
          if (ed.contact.email) {
            console.log(`      ✅ contact.email: ${ed.contact.email}`);
          }
          if (ed.contact.workEmail) {
            console.log(`      ✅ contact.workEmail: ${ed.contact.workEmail}`);
          }
        }
        if (ed.phone) {
          console.log(`      📞 phone: ${ed.phone}`);
        }
      }
      
      if (lead.customFields && typeof lead.customFields === 'object') {
        console.log(`   \n   CustomFields keys: ${Object.keys(lead.customFields).join(', ')}`);
        
        // Check coresignalData
        if (lead.customFields.coresignalData) {
          console.log(`   \n   📊 CORESIGNAL DATA FOUND:`);
          const cs = lead.customFields.coresignalData;
          console.log(`      Keys: ${Object.keys(cs).slice(0, 20).join(', ')}${Object.keys(cs).length > 20 ? '...' : ''}`);
          
          // Check for email fields
          if (cs.primary_professional_email) {
            console.log(`      ✅ primary_professional_email: ${cs.primary_professional_email}`);
          }
          if (cs.email) {
            console.log(`      ✅ email: ${cs.email}`);
          }
          if (cs.work_email) {
            console.log(`      ✅ work_email: ${cs.work_email}`);
          }
          if (cs.personal_email) {
            console.log(`      ✅ personal_email: ${cs.personal_email}`);
          }
          if (cs.professional_emails_collection) {
            console.log(`      ✅ professional_emails_collection: ${JSON.stringify(cs.professional_emails_collection).substring(0, 200)}...`);
          }
          if (cs.emails) {
            console.log(`      ✅ emails: ${JSON.stringify(cs.emails).substring(0, 200)}...`);
          }
        }
        
        // Check coresignal (alternative key)
        if (lead.customFields.coresignal) {
          console.log(`   \n   📊 CORESIGNAL (alt key) FOUND:`);
          const cs = lead.customFields.coresignal;
          console.log(`      Keys: ${Object.keys(cs).slice(0, 20).join(', ')}${Object.keys(cs).length > 20 ? '...' : ''}`);
          
          if (cs.primary_professional_email) {
            console.log(`      ✅ primary_professional_email: ${cs.primary_professional_email}`);
          }
          if (cs.email) {
            console.log(`      ✅ email: ${cs.email}`);
          }
        }
        
        // Check enrichedData
        if (lead.customFields.enrichedData) {
          console.log(`   \n   📊 ENRICHED DATA FOUND:`);
          const ed = lead.customFields.enrichedData;
          console.log(`      Keys: ${Object.keys(ed).join(', ')}`);
          
          if (ed.email) {
            console.log(`      ✅ email: ${ed.email}`);
          }
          if (ed.workEmail) {
            console.log(`      ✅ workEmail: ${ed.workEmail}`);
          }
          if (ed.personalEmail) {
            console.log(`      ✅ personalEmail: ${ed.personalEmail}`);
          }
          if (ed.contact) {
            console.log(`      ✅ contact: ${JSON.stringify(ed.contact).substring(0, 200)}...`);
          }
        }
        
        // Check lushaData
        if (lead.customFields.lushaData) {
          console.log(`   \n   📊 LUSHA DATA FOUND:`);
          const ld = lead.customFields.lushaData;
          console.log(`      Keys: ${Object.keys(ld).join(', ')}`);
          
          if (ld.email) {
            console.log(`      ✅ email: ${ld.email}`);
          }
          if (ld.contact) {
            console.log(`      ✅ contact: ${JSON.stringify(ld.contact).substring(0, 200)}...`);
          }
        }
        
        // Check for any other email-related fields
        const emailKeys = Object.keys(lead.customFields).filter(key => 
          key.toLowerCase().includes('email') || 
          key.toLowerCase().includes('mail')
        );
        if (emailKeys.length > 0) {
          console.log(`   \n   📧 Other email-related keys: ${emailKeys.join(', ')}`);
          emailKeys.forEach(key => {
            const value = lead.customFields[key];
            if (typeof value === 'string') {
              console.log(`      ${key}: ${value}`);
            } else {
              console.log(`      ${key}: ${JSON.stringify(value).substring(0, 200)}...`);
            }
          });
        }
        
        // Full customFields dump for first lead (for debugging)
        if (index === 0) {
          console.log(`   \n   🔍 FULL CUSTOMFIELDS (first lead only):`);
          console.log(JSON.stringify(lead.customFields, null, 2).substring(0, 2000));
        }
      } else {
        console.log(`   ⚠️  No customFields or customFields is not an object`);
      }
    });

    // Summary
    console.log(`\n\n📊 SUMMARY`);
    console.log("===========");
    
    let foundEmails = 0;
    let coresignalDataCount = 0;
    let enrichedDataCount = 0;
    let lushaDataCount = 0;
    
    enrichedLeadsWithoutEmail.forEach(lead => {
      // Check coresignalData field (separate Json field)
      if (lead.coresignalData && typeof lead.coresignalData === 'object') {
        coresignalDataCount++;
        const cs = lead.coresignalData;
        if (cs.primary_professional_email || cs.email || cs.work_email || cs.personal_email) {
          foundEmails++;
        }
        // Also check professional_emails_collection
        if (cs.professional_emails_collection) {
          const emails = Array.isArray(cs.professional_emails_collection) 
            ? cs.professional_emails_collection 
            : (cs.professional_emails_collection?.professional_email ? [cs.professional_emails_collection] : []);
          if (emails.some(e => e.professional_email || e.email)) {
            foundEmails++;
          }
        }
      }
      
      // Check enrichedData field (Lusha data)
      if (lead.enrichedData && typeof lead.enrichedData === 'object') {
        enrichedDataCount++;
        const ed = lead.enrichedData;
        if (ed.email || ed.workEmail || ed.personalEmail || (ed.contact && (ed.contact.email || ed.contact.workEmail))) {
          foundEmails++;
        }
      }
      
      // Also check customFields (for completeness)
      if (lead.customFields && typeof lead.customFields === 'object') {
        if (lead.customFields.coresignalData || lead.customFields.coresignal) {
          const cs = lead.customFields.coresignalData || lead.customFields.coresignal;
          if (cs && (cs.primary_professional_email || cs.email || cs.work_email || cs.personal_email)) {
            foundEmails++;
          }
        }
        if (lead.customFields.lushaData) {
          lushaDataCount++;
          const ld = lead.customFields.lushaData;
          if (ld.email) {
            foundEmails++;
          }
        }
      }
    });
    
    console.log(`Leads checked: ${enrichedLeadsWithoutEmail.length}`);
    console.log(`Leads with Coresignal data: ${coresignalDataCount}`);
    console.log(`Leads with EnrichedData: ${enrichedDataCount}`);
    console.log(`Leads with Lusha data: ${lushaDataCount}`);
    console.log(`Leads with email in customFields: ${foundEmails}`);
    
    if (foundEmails > 0) {
      console.log(`\n✅ FOUND ${foundEmails} leads with email data in customFields that needs extraction!`);
    } else {
      console.log(`\n⚠️  No email data found in customFields - enrichment may not have found emails for these leads.`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomFieldsData()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

