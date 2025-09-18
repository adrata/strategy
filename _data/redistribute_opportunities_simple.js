#!/usr/bin/env node

/**
 * Simple Opportunity Redistribution Script
 * 
 * This script redistributes the data correctly using only fields that exist in the schema:
 * - Prospects: Individual people with no engagement (engagement score 2-4)
 * - Leads: Individual people who are engaged (engagement score 5-7)
 * - Opportunities: Business deals per company (engagement score 8-13, grouped by company)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function redistributeOpportunitiesSimple() {
  try {
    console.log('🔄 Starting simple opportunity redistribution...');
    
    // First, clear existing records to start fresh
    console.log('🧹 Clearing existing records...');
    await prisma.prospects.deleteMany({
      where: { workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1' }
    });
    await prisma.leads.deleteMany({
      where: { workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1' }
    });
    await prisma.opportunities.deleteMany({
      where: { workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1' }
    });
    
    // Get all people from the database
    const people = await prisma.people.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        deletedAt: null
      }
    });
    
    console.log(`📊 Found ${people.length} people to redistribute`);
    
    // Group people by engagement level
    const prospects = people.filter(p => (p.engagementScore || 0) >= 2 && (p.engagementScore || 0) <= 4);
    const leads = people.filter(p => (p.engagementScore || 0) >= 5 && (p.engagementScore || 0) <= 7);
    const opportunityPeople = people.filter(p => (p.engagementScore || 0) >= 8 && (p.engagementScore || 0) <= 13);
    
    console.log(`📈 Distribution: ${prospects.length} prospects, ${leads.length} leads, ${opportunityPeople.length} opportunity people`);
    
    // Create prospects records (individual people)
    if (prospects.length > 0) {
      console.log(`🔄 Creating ${prospects.length} prospect records...`);
      for (const person of prospects) {
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
      }
      console.log(`✅ Created ${prospects.length} prospect records`);
    }
    
    // Create leads records (individual people)
    if (leads.length > 0) {
      console.log(`🔄 Creating ${leads.length} lead records...`);
      for (const person of leads) {
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
      }
      console.log(`✅ Created ${leads.length} lead records`);
    }
    
    // Create opportunities records (business deals per company)
    if (opportunityPeople.length > 0) {
      console.log(`🔄 Creating opportunity records grouped by company...`);
      
      // Group opportunity people by company
      const companyGroups = {};
      opportunityPeople.forEach(person => {
        const companyName = person.company || 'Unknown Company';
        if (!companyGroups[companyName]) {
          companyGroups[companyName] = [];
        }
        companyGroups[companyName].push(person);
      });
      
      console.log(`📊 Found ${Object.keys(companyGroups).length} companies with opportunity people`);
      
      let opportunityCount = 0;
      for (const [companyName, people] of Object.entries(companyGroups)) {
        // Calculate opportunity details based on the people
        const primaryContact = people[0]; // Use first person as primary contact
        const avgEngagementScore = people.reduce((sum, p) => sum + (p.engagementScore || 0), 0) / people.length;
        const allNotes = people.map(p => p.notes).filter(n => n).join('; ');
        const allTags = [...new Set(people.flatMap(p => p.tags || []))];
        
        // Determine opportunity amount based on engagement score
        let amount = 0;
        if (avgEngagementScore >= 12) amount = 100000; // High-value deal
        else if (avgEngagementScore >= 10) amount = 75000; // Medium-high value
        else if (avgEngagementScore >= 8) amount = 50000; // Medium value
        
        // Determine probability based on engagement score
        let probability = 0.25;
        if (avgEngagementScore >= 12) probability = 0.75;
        else if (avgEngagementScore >= 10) probability = 0.50;
        else if (avgEngagementScore >= 8) probability = 0.35;
        
        // Create opportunity using only fields that exist in the schema
        await prisma.opportunities.create({
          data: {
            workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
            name: `${companyName} - Business Opportunity`,
            description: `Business opportunity with ${companyName}. ${people.length} engaged contact${people.length > 1 ? 's' : ''}. ${allNotes || 'No additional notes.'}`,
            stage: 'Prospecting',
            amount: amount,
            probability: probability,
            expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            priority: 'high',
            source: 'import',
            notes: allNotes,
            tags: allTags,
            createdAt: primaryContact.createdAt,
            updatedAt: primaryContact.updatedAt,
            assignedUserId: primaryContact.assignedUserId,
            companyId: primaryContact.companyId,
            personId: primaryContact.id, // Link to primary contact
            // Store additional contacts in customFields
            customFields: {
              additionalContacts: people.length > 1 ? people.slice(1).map(p => ({
                name: p.fullName,
                email: p.email,
                phone: p.phone,
                title: p.jobTitle
              })) : [],
              companyName: companyName,
              totalContacts: people.length,
              avgEngagementScore: avgEngagementScore
            }
          }
        });
        
        opportunityCount++;
      }
      
      console.log(`✅ Created ${opportunityCount} opportunity records (business deals)`);
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
    console.log(`  - Prospects (individual people): ${finalCounts[0]}`);
    console.log(`  - Leads (individual people): ${finalCounts[1]}`);
    console.log(`  - Opportunities (business deals): ${finalCounts[2]}`);
    console.log(`  - People (total): ${finalCounts[3]}`);
    console.log(`  - Companies: ${finalCounts[4]}`);
    
  } catch (error) {
    console.error('❌ Error during data redistribution:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
redistributeOpportunitiesSimple()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
