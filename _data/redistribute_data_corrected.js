#!/usr/bin/env node

/**
 * Corrected Data Redistribution Script
 * 
 * This script redistributes the uploaded people data to the correct tables
 * based on engagement scores and funnel stages:
 * - Engagement score 2-4 → Prospect
 * - Engagement score 5-7 → Lead  
 * - Engagement score 8-13 → Opportunity
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function getFunnelStageFromEngagementScore(score) {
  if (score >= 8) return 'Opportunity';
  if (score >= 5) return 'Lead';
  return 'Prospect';
}

async function redistributeData() {
  try {
    console.log('🔄 Starting corrected data redistribution...');
    
    // Get all people from the database
    const people = await prisma.people.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', // TOP Engineering Plus workspace
        deletedAt: null
      }
    });
    
    console.log(`📊 Found ${people.length} people to redistribute`);
    
    // Group people by corrected funnel stage
    const prospects = [];
    const leads = [];
    const opportunities = [];
    
    people.forEach(person => {
      let funnelStage = person.funnelStage;
      
      // If funnel stage is not properly set, use engagement score
      if (!funnelStage || funnelStage === 'Prospect' || typeof funnelStage === 'number') {
        const engagementScore = person.engagementScore || 0;
        funnelStage = getFunnelStageFromEngagementScore(engagementScore);
      }
      
      // Map to correct arrays
      if (funnelStage === 'Prospect') {
        prospects.push(person);
      } else if (funnelStage === 'Lead') {
        leads.push(person);
      } else if (funnelStage === 'Opportunity') {
        opportunities.push(person);
      } else {
        // Default to prospect for unknown stages
        prospects.push(person);
      }
    });
    
    console.log(`📈 Corrected distribution: ${prospects.length} prospects, ${leads.length} leads, ${opportunities.length} opportunities`);
    
    // Create prospects records
    if (prospects.length > 0) {
      console.log(`🔄 Creating ${prospects.length} prospect records...`);
      for (const person of prospects) {
        try {
          await prisma.prospects.create({
            data: {
              id: person.id,
              workspaceId: person.workspaceId,
              fullName: person.fullName,
              firstName: person.firstName,
              lastName: person.lastName,
              email: person.email,
              workEmail: person.workEmail,
              personalEmail: person.personalEmail,
              phone: person.phone,
              mobilePhone: person.mobilePhone,
              workPhone: person.workPhone,
              jobTitle: person.jobTitle,
              title: person.jobTitle,
              department: person.department,
              address: person.address,
              city: person.city,
              state: person.state,
              country: person.country,
              postalCode: person.postalCode,
              linkedinUrl: person.linkedinUrl,
              notes: person.notes,
              tags: person.tags,
              status: 'new',
              priority: 'medium',
              source: 'import',
              enrichmentScore: person.engagementScore || 0,
              buyerGroupRole: 'Stakeholder',
              currentStage: 'Prospect',
              createdAt: person.createdAt,
              updatedAt: person.updatedAt,
              assignedUserId: person.assignedUserId,
              company: person.company,
              industry: person.industry,
              vertical: person.vertical,
              companySize: person.companySize,
              timezone: person.timezone,
              engagementLevel: person.engagementLevel,
              dataCompleteness: person.dataCompleteness,
              communicationStyle: person.communicationStyle,
              decisionMakingStyle: person.decisionMakingStyle,
              companyId: person.companyId
            }
          });
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`⚠️ Prospect ${person.id} already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }
      console.log(`✅ Created ${prospects.length} prospect records`);
    }
    
    // Create leads records
    if (leads.length > 0) {
      console.log(`🔄 Creating ${leads.length} lead records...`);
      for (const person of leads) {
        try {
          await prisma.leads.create({
            data: {
              id: person.id,
              workspaceId: person.workspaceId,
              fullName: person.fullName,
              firstName: person.firstName,
              lastName: person.lastName,
              email: person.email,
              workEmail: person.workEmail,
              personalEmail: person.personalEmail,
              phone: person.phone,
              mobilePhone: person.mobilePhone,
              workPhone: person.workPhone,
              jobTitle: person.jobTitle,
              title: person.jobTitle,
              department: person.department,
              address: person.address,
              city: person.city,
              state: person.state,
              country: person.country,
              postalCode: person.postalCode,
              linkedinUrl: person.linkedinUrl,
              notes: person.notes,
              tags: person.tags,
              status: 'new',
              priority: 'high',
              source: 'import',
              enrichmentScore: person.engagementScore || 0,
              buyerGroupRole: 'Stakeholder',
              currentStage: 'Lead',
              createdAt: person.createdAt,
              updatedAt: person.updatedAt,
              assignedUserId: person.assignedUserId,
              company: person.company,
              industry: person.industry,
              vertical: person.vertical,
              companySize: person.companySize,
              timezone: person.timezone,
              engagementLevel: person.engagementLevel,
              dataCompleteness: person.dataCompleteness,
              communicationStyle: person.communicationStyle,
              decisionMakingStyle: person.decisionMakingStyle,
              companyId: person.companyId
            }
          });
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`⚠️ Lead ${person.id} already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }
      console.log(`✅ Created ${leads.length} lead records`);
    }
    
    // Create opportunities records
    if (opportunities.length > 0) {
      console.log(`🔄 Creating ${opportunities.length} opportunity records...`);
      for (const person of opportunities) {
        try {
          await prisma.opportunities.create({
            data: {
              id: person.id,
              workspaceId: person.workspaceId,
              name: person.fullName,
              description: person.notes || `Opportunity with ${person.fullName}`,
              stage: 'Prospecting',
              amount: 0,
              probability: 25,
              closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: 'active',
              priority: 'high',
              source: 'import',
              notes: person.notes,
              tags: person.tags,
              createdAt: person.createdAt,
              updatedAt: person.updatedAt,
              assignedUserId: person.assignedUserId,
              company: person.company,
              industry: person.industry,
              vertical: person.vertical,
              companySize: person.companySize,
              timezone: person.timezone,
              engagementLevel: person.engagementLevel,
              dataCompleteness: person.dataCompleteness,
              communicationStyle: person.communicationStyle,
              decisionMakingStyle: person.decisionMakingStyle,
              companyId: person.companyId,
              contactName: person.fullName,
              contactEmail: person.email,
              contactPhone: person.phone,
              contactTitle: person.jobTitle
            }
          });
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`⚠️ Opportunity ${person.id} already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }
      console.log(`✅ Created ${opportunities.length} opportunity records`);
    }
    
    console.log('🎉 Data redistribution completed successfully!');
    
    // Verify the results
    const finalCounts = await Promise.all([
      prisma.prospects.count({ where: { workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', deletedAt: null } }),
      prisma.leads.count({ where: { workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', deletedAt: null } }),
      prisma.opportunities.count({ where: { workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', deletedAt: null } }),
      prisma.people.count({ where: { workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', deletedAt: null } }),
      prisma.companies.count({ where: { workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', deletedAt: null } })
    ]);
    
    console.log('📊 Final counts:');
    console.log(`  - Prospects: ${finalCounts[0]}`);
    console.log(`  - Leads: ${finalCounts[1]}`);
    console.log(`  - Opportunities: ${finalCounts[2]}`);
    console.log(`  - People: ${finalCounts[3]}`);
    console.log(`  - Companies: ${finalCounts[4]}`);
    
  } catch (error) {
    console.error('❌ Error during data redistribution:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
redistributeData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
