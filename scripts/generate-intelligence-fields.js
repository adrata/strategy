#!/usr/bin/env node

/**
 * Generate Intelligence Fields Script
 * 
 * This script generates intelligence fields (influenceLevel, engagementStrategy, etc.)
 * based on CoreSignal data for records that are missing these fields.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Intelligence generation functions
function generateInfluenceLevel(coresignalData) {
  const experience = coresignalData.experience || [];
  const skills = coresignalData.skills || [];
  const followersCount = coresignalData.followersCount || 0;
  const connectionsCount = coresignalData.connectionsCount || 0;
  
  // Calculate influence based on multiple factors
  let influenceScore = 0;
  
  // Experience factor (years of experience)
  const totalExperience = coresignalData.totalExperienceMonths || 0;
  const yearsExperience = totalExperience / 12;
  if (yearsExperience > 20) influenceScore += 30;
  else if (yearsExperience > 10) influenceScore += 20;
  else if (yearsExperience > 5) influenceScore += 10;
  
  // Skills factor (number and relevance of skills)
  if (skills.length > 15) influenceScore += 20;
  else if (skills.length > 10) influenceScore += 15;
  else if (skills.length > 5) influenceScore += 10;
  
  // Network factor (LinkedIn connections)
  if (connectionsCount > 1000) influenceScore += 20;
  else if (connectionsCount > 500) influenceScore += 15;
  else if (connectionsCount > 100) influenceScore += 10;
  
  // Role factor (current position level)
  const currentExp = experience.find(exp => exp.active_experience === 1) || experience[0];
  if (currentExp) {
    const title = currentExp.position_title?.toLowerCase() || '';
    if (title.includes('director') || title.includes('vp') || title.includes('vice president')) {
      influenceScore += 25;
    } else if (title.includes('manager') || title.includes('lead') || title.includes('senior')) {
      influenceScore += 15;
    } else if (title.includes('analyst') || title.includes('specialist')) {
      influenceScore += 5;
    }
  }
  
  // Determine influence level
  if (influenceScore >= 70) return 'High';
  else if (influenceScore >= 40) return 'Medium';
  else return 'Low';
}

function generateEngagementStrategy(coresignalData, influenceLevel) {
  const experience = coresignalData.experience || [];
  const skills = coresignalData.skills || [];
  const currentExp = experience.find(exp => exp.active_experience === 1) || experience[0];
  
  if (!currentExp) return 'Standard outreach';
  
  const title = currentExp.position_title?.toLowerCase() || '';
  const department = currentExp.department?.toLowerCase() || '';
  const industry = currentExp.company_industry?.toLowerCase() || '';
  
  // Generate strategy based on role and industry
  if (title.includes('director') || title.includes('vp')) {
    return 'Executive-level strategic approach with ROI focus';
  } else if (title.includes('manager') || title.includes('lead')) {
    return 'Operational efficiency and team productivity focus';
  } else if (department.includes('finance') || department.includes('treasury')) {
    return 'Financial impact and cost-benefit analysis approach';
  } else if (department.includes('it') || department.includes('technology')) {
    return 'Technical solution and integration approach';
  } else if (industry.includes('government')) {
    return 'Compliance and public sector efficiency approach';
  } else {
    return 'Educational approach with use cases';
  }
}

function generateSeniority(coresignalData) {
  const totalExperience = coresignalData.totalExperienceMonths || 0;
  const yearsExperience = totalExperience / 12;
  
  if (yearsExperience >= 15) return 'Senior';
  else if (yearsExperience >= 8) return 'Mid-level';
  else if (yearsExperience >= 3) return 'Junior';
  else return 'Entry-level';
}

function generateBuyerGroupStatus(coresignalData) {
  const experience = coresignalData.experience || [];
  const currentExp = experience.find(exp => exp.active_experience === 1) || experience[0];
  
  if (!currentExp) return { isBuyerGroupMember: false, buyerGroupOptimized: false };
  
  const title = currentExp.position_title?.toLowerCase() || '';
  const department = currentExp.department?.toLowerCase() || '';
  
  // Determine if likely buyer group member
  const isBuyerGroupMember = title.includes('director') || 
                            title.includes('manager') || 
                            title.includes('vp') ||
                            department.includes('finance') ||
                            department.includes('procurement') ||
                            department.includes('it');
  
  // Determine if optimized for buyer group
  const buyerGroupOptimized = isBuyerGroupMember && (
    title.includes('director') || 
    title.includes('vp') ||
    department.includes('finance')
  );
  
  return { isBuyerGroupMember, buyerGroupOptimized };
}

async function generateIntelligenceFields() {
  try {
    console.log('🔧 Starting intelligence fields generation...');
    
    // Find records missing intelligence fields
    const recordsNeedingIntelligence = await prisma.leads.findMany({
      where: {
        deletedAt: null,
        customFields: {
          path: ['influenceLevel'],
          equals: null
        }
      },
      select: {
        id: true,
        fullName: true,
        customFields: true
      }
    });
    
    console.log(`📊 Found ${recordsNeedingIntelligence.length} leads needing intelligence fields`);
    
    // Process each record
    for (const record of recordsNeedingIntelligence) {
      const coresignalData = record.customFields?.coresignal;
      
      if (!coresignalData) {
        console.log(`⚠️ No CoreSignal data for ${record.fullName}, skipping`);
        continue;
      }
      
      // Generate intelligence fields
      const influenceLevel = generateInfluenceLevel(coresignalData);
      const engagementStrategy = generateEngagementStrategy(coresignalData, influenceLevel);
      const seniority = generateSeniority(coresignalData);
      const { isBuyerGroupMember, buyerGroupOptimized } = generateBuyerGroupStatus(coresignalData);
      
      // Update the record with intelligence fields
      const updatedCustomFields = {
        ...record.customFields,
        influenceLevel,
        engagementStrategy,
        seniority,
        isBuyerGroupMember,
        buyerGroupOptimized,
        department: coresignalData.experience?.find(exp => exp.active_experience === 1)?.department || 
                   coresignalData.experience?.[0]?.department || '-',
        companyName: coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || 
                    coresignalData.experience?.[0]?.company_name || '-'
      };
      
      await prisma.leads.update({
        where: { id: record.id },
        data: { customFields: updatedCustomFields }
      });
      
      console.log(`✅ Updated ${record.fullName}: ${influenceLevel} influence, ${engagementStrategy}`);
    }
    
    // Also process people records
    const peopleNeedingIntelligence = await prisma.people.findMany({
      where: {
        deletedAt: null,
        customFields: {
          path: ['influenceLevel'],
          equals: null
        }
      },
      select: {
        id: true,
        fullName: true,
        customFields: true
      }
    });
    
    console.log(`📊 Found ${peopleNeedingIntelligence.length} people needing intelligence fields`);
    
    // Process people records
    for (const record of peopleNeedingIntelligence) {
      const coresignalData = record.customFields?.coresignal;
      
      if (!coresignalData) {
        console.log(`⚠️ No CoreSignal data for ${record.fullName}, skipping`);
        continue;
      }
      
      // Generate intelligence fields
      const influenceLevel = generateInfluenceLevel(coresignalData);
      const engagementStrategy = generateEngagementStrategy(coresignalData, influenceLevel);
      const seniority = generateSeniority(coresignalData);
      const { isBuyerGroupMember, buyerGroupOptimized } = generateBuyerGroupStatus(coresignalData);
      
      // Update the record with intelligence fields
      const updatedCustomFields = {
        ...record.customFields,
        influenceLevel,
        engagementStrategy,
        seniority,
        isBuyerGroupMember,
        buyerGroupOptimized,
        department: coresignalData.experience?.find(exp => exp.active_experience === 1)?.department || 
                   coresignalData.experience?.[0]?.department || '-',
        companyName: coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || 
                    coresignalData.experience?.[0]?.company_name || '-'
      };
      
      await prisma.people.update({
        where: { id: record.id },
        data: { customFields: updatedCustomFields }
      });
      
      console.log(`✅ Updated ${record.fullName}: ${influenceLevel} influence, ${engagementStrategy}`);
    }
    
    // Verify Aaron Root specifically
    const aaronRoot = await prisma.leads.findFirst({
      where: { fullName: { contains: 'Aaron Root' } }
    });
    
    if (aaronRoot) {
      console.log('\\n📊 AARON ROOT VERIFICATION:');
      console.log('Influence Level:', aaronRoot.customFields?.influenceLevel);
      console.log('Engagement Strategy:', aaronRoot.customFields?.engagementStrategy);
      console.log('Seniority:', aaronRoot.customFields?.seniority);
      console.log('Buyer Group Member:', aaronRoot.customFields?.isBuyerGroupMember);
      console.log('Buyer Group Optimized:', aaronRoot.customFields?.buyerGroupOptimized);
      console.log('Department:', aaronRoot.customFields?.department);
      console.log('Company Name:', aaronRoot.customFields?.companyName);
    }
    
    console.log('\\n🎉 Intelligence fields generation completed!');
    
  } catch (error) {
    console.error('❌ Error generating intelligence fields:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  generateIntelligenceFields()
    .then(() => {
      console.log('🎉 Intelligence fields generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Intelligence fields generation failed:', error);
      process.exit(1);
    });
}

module.exports = { generateIntelligenceFields };
