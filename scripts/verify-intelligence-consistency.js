require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyIntelligenceConsistency() {
  try {
    console.log('🔍 Verifying Intelligence Consistency Across Record Types...');
    
    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Check a sample of each record type
    const samplePeople = await prisma.people.findMany({
      where: { workspaceId },
      take: 5,
      select: {
        id: true,
        fullName: true,
        customFields: true
      }
    });
    
    const sampleLeads = await prisma.leads.findMany({
      where: { workspaceId },
      take: 5,
      select: {
        id: true,
        fullName: true,
        customFields: true
      }
    });
    
    const sampleProspects = await prisma.prospects.findMany({
      where: { workspaceId },
      take: 5,
      select: {
        id: true,
        fullName: true,
        customFields: true
      }
    });
    
    console.log('\n📊 PEOPLE RECORDS:');
    samplePeople.forEach((person, index) => {
      const hasIntelligence = person.customFields?.intelligenceSummary;
      const hasEngagementStrategy = person.customFields?.engagementStrategy;
      console.log(`${index + 1}. ${person.fullName}: Intelligence=${!!hasIntelligence}, Strategy=${!!hasEngagementStrategy}`);
      if (hasEngagementStrategy) {
        console.log(`   Strategy length: ${hasEngagementStrategy.length} chars`);
      }
    });
    
    console.log('\n📊 LEADS RECORDS:');
    sampleLeads.forEach((lead, index) => {
      const hasIntelligence = lead.customFields?.intelligenceSummary;
      const hasEngagementStrategy = lead.customFields?.engagementStrategy;
      console.log(`${index + 1}. ${lead.fullName}: Intelligence=${!!hasIntelligence}, Strategy=${!!hasEngagementStrategy}`);
      if (hasEngagementStrategy) {
        console.log(`   Strategy length: ${hasEngagementStrategy.length} chars`);
      }
    });
    
    console.log('\n📊 PROSPECTS RECORDS:');
    sampleProspects.forEach((prospect, index) => {
      const hasIntelligence = prospect.customFields?.intelligenceSummary;
      const hasEngagementStrategy = prospect.customFields?.engagementStrategy;
      console.log(`${index + 1}. ${prospect.fullName}: Intelligence=${!!hasIntelligence}, Strategy=${!!hasEngagementStrategy}`);
      if (hasEngagementStrategy) {
        console.log(`   Strategy length: ${hasEngagementStrategy.length} chars`);
      }
    });
    
    // Check for Aaron Adkins specifically
    console.log('\n🎯 AARON ADKINS CHECK:');
    const aaronPerson = await prisma.people.findFirst({
      where: { 
        workspaceId,
        fullName: { contains: 'Aaron Adkins' }
      },
      select: {
        id: true,
        fullName: true,
        customFields: true
      }
    });
    
    if (aaronPerson) {
      console.log(`Person: ${aaronPerson.fullName}`);
      console.log(`Intelligence: ${!!aaronPerson.customFields?.intelligenceSummary}`);
      console.log(`Engagement Strategy: ${!!aaronPerson.customFields?.engagementStrategy}`);
      if (aaronPerson.customFields?.engagementStrategy) {
        console.log(`Strategy: ${aaronPerson.customFields.engagementStrategy.substring(0, 100)}...`);
      }
    }
    
    const aaronLead = await prisma.leads.findFirst({
      where: { 
        workspaceId,
        fullName: { contains: 'Aaron Adkins' }
      },
      select: {
        id: true,
        fullName: true,
        customFields: true
      }
    });
    
    if (aaronLead) {
      console.log(`Lead: ${aaronLead.fullName}`);
      console.log(`Intelligence: ${!!aaronLead.customFields?.intelligenceSummary}`);
      console.log(`Engagement Strategy: ${!!aaronLead.customFields?.engagementStrategy}`);
    }
    
    const aaronProspect = await prisma.prospects.findFirst({
      where: { 
        workspaceId,
        fullName: { contains: 'Aaron Adkins' }
      },
      select: {
        id: true,
        fullName: true,
        customFields: true
      }
    });
    
    if (aaronProspect) {
      console.log(`Prospect: ${aaronProspect.fullName}`);
      console.log(`Intelligence: ${!!aaronProspect.customFields?.intelligenceSummary}`);
      console.log(`Engagement Strategy: ${!!aaronProspect.customFields?.engagementStrategy}`);
    }
    
    console.log('\n✅ Intelligence consistency check complete!');
    
  } catch (error) {
    console.error('❌ Error checking intelligence consistency:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyIntelligenceConsistency();
