#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NOTARY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';
const USER_ID = '01K1VBYZG41K9QA0D9CF06KNRG'; // Dan's user ID

async function convertLeadsToProspects() {
  try {
    console.log('🔄 Starting lead to prospect conversion for Notary Everyday workspace...');
    
    // Get all leads from the Notary Everyday workspace
    const leads = await prisma.leads.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📊 Found ${leads.length} leads to convert`);
    
    if (leads.length === 0) {
      console.log('✅ No leads to convert');
      return;
    }
    
    let convertedCount = 0;
    let errorCount = 0;
    
    // Process leads in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leads.length / batchSize)} (${batch.length} leads)`);
      
      for (const lead of batch) {
        try {
          // Check if prospect already exists
          const existingProspect = await prisma.prospects.findFirst({
            where: {
              workspaceId: NOTARY_WORKSPACE_ID,
              fullName: lead.fullName,
              email: lead.email || lead.workEmail || lead.personalEmail
            }
          });
          
          if (existingProspect) {
            console.log(`⚠️  Prospect already exists for ${lead.fullName}, skipping`);
            continue;
          }
          
          // Create prospect from lead
          const prospectData = {
            id: `pros_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            workspaceId: lead.workspaceId,
            assignedUserId: lead.assignedUserId,
            firstName: lead.firstName,
            lastName: lead.lastName,
            fullName: lead.fullName,
            displayName: lead.displayName,
            email: lead.email,
            workEmail: lead.workEmail,
            personalEmail: lead.personalEmail,
            phone: lead.phone,
            mobilePhone: lead.mobilePhone,
            workPhone: lead.workPhone,
            company: lead.company,
            companyDomain: lead.companyDomain,
            industry: lead.industry,
            companySize: lead.companySize,
            jobTitle: lead.jobTitle,
            title: lead.title,
            department: lead.department,
            linkedinUrl: lead.linkedinUrl,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            country: lead.country,
            postalCode: lead.postalCode,
            status: lead.status === 'active' ? 'engaged' : 'new', // Convert active leads to engaged prospects
            priority: lead.priority,
            source: lead.source || 'Lead Conversion',
            estimatedValue: lead.estimatedValue,
            currency: lead.currency,
            notes: lead.notes,
            description: lead.description,
            tags: lead.tags,
            customFields: lead.customFields,
            preferredLanguage: lead.preferredLanguage,
            timezone: lead.timezone,
            lastEnriched: lead.lastEnriched,
            enrichmentSources: lead.enrichmentSources,
            emailVerified: lead.emailVerified,
            phoneVerified: lead.phoneVerified,
            mobileVerified: lead.mobileVerified,
            enrichmentScore: lead.enrichmentScore,
            emailConfidence: lead.emailConfidence,
            phoneConfidence: lead.phoneConfidence,
            dataCompleteness: lead.dataCompleteness,
            createdAt: lead.createdAt,
            updatedAt: new Date(),
            personId: lead.personId
          };
          
          await prisma.prospects.create({
            data: prospectData
          });
          
          // Soft delete the original lead
          await prisma.leads.update({
            where: { id: lead.id },
            data: { 
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          convertedCount++;
          
          if (convertedCount % 100 === 0) {
            console.log(`✅ Converted ${convertedCount} leads so far...`);
          }
          
        } catch (error) {
          console.error(`❌ Error converting lead ${lead.fullName}:`, error.message);
          errorCount++;
        }
      }
      
      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\n🎉 Conversion complete!`);
    console.log(`✅ Successfully converted: ${convertedCount} leads to prospects`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Verify the conversion
    const remainingLeads = await prisma.leads.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    const newProspects = await prisma.prospects.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`\n📊 Final counts:`);
    console.log(`- Remaining leads: ${remainingLeads}`);
    console.log(`- Total prospects: ${newProspects}`);
    
  } catch (error) {
    console.error('❌ Fatal error during conversion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the conversion
convertLeadsToProspects();
