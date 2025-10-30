#!/usr/bin/env node

/**
 * Generate Comprehensive Intelligence Fields Script
 * 
 * This script generates intelligence fields for all record types (people, leads, prospects)
 * based on CoreSignal data and ensures consistent intelligence across all record types.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Enhanced intelligence generation functions
function generateInfluenceLevel(coresignalData) {
  const experience = coresignalData.experience || [];
  const skills = coresignalData.skills || [];
  const followersCount = coresignalData.followersCount || 0;
  const connectionsCount = coresignalData.connectionsCount || 0;
  const totalExperience = coresignalData.totalExperienceMonths || 0;
  
  let influenceScore = 0;
  
  // Experience factor (years of experience)
  const yearsExperience = totalExperience / 12;
  if (yearsExperience > 25) influenceScore += 35;
  else if (yearsExperience > 15) influenceScore += 25;
  else if (yearsExperience > 10) influenceScore += 15;
  else if (yearsExperience > 5) influenceScore += 10;
  
  // Skills factor (number and relevance of skills)
  if (skills.length > 20) influenceScore += 25;
  else if (skills.length > 15) influenceScore += 20;
  else if (skills.length > 10) influenceScore += 15;
  else if (skills.length > 5) influenceScore += 10;
  
  // Network factor (LinkedIn connections)
  if (connectionsCount > 2000) influenceScore += 25;
  else if (connectionsCount > 1000) influenceScore += 20;
  else if (connectionsCount > 500) influenceScore += 15;
  else if (connectionsCount > 100) influenceScore += 10;
  
  // Role factor (current position level)
  const currentExp = experience.find(exp => exp.active_experience === 1) || experience[0];
  if (currentExp) {
    const title = currentExp.position_title?.toLowerCase() || '';
    if (title.includes('director') || title.includes('vp') || title.includes('vice president') || title.includes('chief')) {
      influenceScore += 30;
    } else if (title.includes('manager') || title.includes('lead') || title.includes('senior')) {
      influenceScore += 20;
    } else if (title.includes('analyst') || title.includes('specialist') || title.includes('coordinator')) {
      influenceScore += 10;
    }
  }
  
  // Determine influence level
  if (influenceScore >= 80) return 'High';
  else if (influenceScore >= 50) return 'Medium';
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
  
  // Generate strategy based on role, department, and industry
  if (title.includes('director') || title.includes('vp') || title.includes('chief')) {
    return 'Executive-level strategic approach with ROI focus';
  } else if (title.includes('manager') || title.includes('lead')) {
    return 'Operational efficiency and team productivity focus';
  } else if (department.includes('finance') || department.includes('treasury') || title.includes('treasury')) {
    return 'Financial impact and cost-benefit analysis approach';
  } else if (department.includes('it') || department.includes('technology') || title.includes('technology')) {
    return 'Technical solution and integration approach';
  } else if (industry.includes('government') || industry.includes('public sector')) {
    return 'Compliance and public sector efficiency approach';
  } else if (department.includes('procurement') || department.includes('purchasing')) {
    return 'Vendor relationship and procurement optimization approach';
  } else {
    return 'Educational approach with use cases';
  }
}

function generateSeniority(coresignalData) {
  const totalExperience = coresignalData.totalExperienceMonths || 0;
  const yearsExperience = totalExperience / 12;
  const experience = coresignalData.experience || [];
  const currentExp = experience.find(exp => exp.active_experience === 1) || experience[0];
  
  if (currentExp) {
    const title = currentExp.position_title?.toLowerCase() || '';
    // C-suite and executive titles
    if (title.includes('ceo') || title.includes('president') || title.includes('founder')) {
      return 'Executive';
    } else if (title.includes('cfo') || title.includes('cto') || title.includes('coo') || title.includes('cmo')) {
      return 'Executive';
    } else if (title.includes('director') || title.includes('vp') || title.includes('vice president') || title.includes('chief')) {
      return 'Executive';
    } else if (title.includes('senior') || yearsExperience >= 10) {
      return 'Senior';
    } else if (title.includes('manager') || title.includes('lead') || yearsExperience >= 5) {
      return 'Mid-level';
    } else if (yearsExperience >= 2) {
      return 'Junior';
    } else {
      return 'Entry-level';
    }
  }
  
  if (yearsExperience >= 20) return 'Executive';
  else if (yearsExperience >= 10) return 'Senior';
  else if (yearsExperience >= 5) return 'Mid-level';
  else if (yearsExperience >= 2) return 'Junior';
  else return 'Entry-level';
}

function generateBuyerGroupStatus(coresignalData) {
  const experience = coresignalData.experience || [];
  const currentExp = experience.find(exp => exp.active_experience === 1) || experience[0];
  
  if (!currentExp) return { isBuyerGroupMember: false };
  
  const title = currentExp.position_title?.toLowerCase() || '';
  const department = currentExp.department?.toLowerCase() || '';
  const industry = currentExp.company_industry?.toLowerCase() || '';
  
  // Determine if likely buyer group member
  const isBuyerGroupMember = title.includes('director') || 
                            title.includes('manager') || 
                            title.includes('vp') ||
                            title.includes('chief') ||
                            department.includes('finance') ||
                            department.includes('procurement') ||
                            department.includes('it') ||
                            department.includes('operations') ||
                            title.includes('treasury');
  
  return { isBuyerGroupMember };
}

function generateInfluenceScore(coresignalData) {
  const experience = coresignalData.experience || [];
  const skills = coresignalData.skills || [];
  const totalExperience = coresignalData.totalExperienceMonths || 0;
  const connectionsCount = coresignalData.connectionsCount || 0;
  
  let score = 0;
  
  // Experience factor
  const yearsExperience = totalExperience / 12;
  if (yearsExperience > 25) score += 30;
  else if (yearsExperience > 15) score += 25;
  else if (yearsExperience > 10) score += 20;
  else if (yearsExperience > 5) score += 15;
  
  // Skills factor
  if (skills.length > 20) score += 25;
  else if (skills.length > 15) score += 20;
  else if (skills.length > 10) score += 15;
  else if (skills.length > 5) score += 10;
  
  // Network factor
  if (connectionsCount > 2000) score += 25;
  else if (connectionsCount > 1000) score += 20;
  else if (connectionsCount > 500) score += 15;
  else if (connectionsCount > 100) score += 10;
  
  // Role factor
  const currentExp = experience.find(exp => exp.active_experience === 1) || experience[0];
  if (currentExp) {
    const title = currentExp.position_title?.toLowerCase() || '';
    if (title.includes('director') || title.includes('vp') || title.includes('chief')) {
      score += 20;
    } else if (title.includes('manager') || title.includes('lead')) {
      score += 15;
    } else if (title.includes('senior')) {
      score += 10;
    }
  }
  
  return Math.min(100, Math.max(0, score));
}

function generateDecisionPower(coresignalData) {
  const experience = coresignalData.experience || [];
  const currentExp = experience.find(exp => exp.active_experience === 1) || experience[0];
  
  if (!currentExp) return 50;
  
  const title = currentExp.position_title?.toLowerCase() || '';
  const department = currentExp.department?.toLowerCase() || '';
  
  // Higher decision power for executive and finance roles
  if (title.includes('director') || title.includes('vp') || title.includes('chief')) {
    return 85 + Math.floor(Math.random() * 15); // 85-100
  } else if (title.includes('manager') || department.includes('finance')) {
    return 70 + Math.floor(Math.random() * 20); // 70-90
  } else if (title.includes('senior') || title.includes('lead')) {
    return 60 + Math.floor(Math.random() * 20); // 60-80
  } else {
    return 40 + Math.floor(Math.random() * 30); // 40-70
  }
}

async function generateComprehensiveIntelligence() {
  try {
    console.log('🔧 Starting comprehensive intelligence generation...');
    
    // Process all record types
    const recordTypes = ['leads', 'people', 'prospects'];
    
    for (const recordType of recordTypes) {
      console.log(`\n📊 Processing ${recordType}...`);
      
      const records = await prisma[recordType].findMany({
        where: {
          deletedAt: null,
          customFields: {
            path: ['coresignal'],
            not: null
          }
        },
        select: {
          id: true,
          fullName: true,
          customFields: true
        }
      });
      
      console.log(`📊 Found ${records.length} ${recordType} with CoreSignal data`);
      
      let updatedCount = 0;
      
      for (const record of records) {
        const coresignalData = record.customFields?.coresignal;
        
        if (!coresignalData || !coresignalData.experience || coresignalData.experience.length === 0) {
          continue;
        }
        
        // Generate intelligence fields
        const influenceLevel = generateInfluenceLevel(coresignalData);
        const engagementStrategy = generateEngagementStrategy(coresignalData, influenceLevel);
        const seniority = generateSeniority(coresignalData);
        const { isBuyerGroupMember } = generateBuyerGroupStatus(coresignalData);
        const influenceScore = generateInfluenceScore(coresignalData);
        const decisionPower = generateDecisionPower(coresignalData);
        
        // Get current experience data
        const currentExp = coresignalData.experience.find(exp => exp.active_experience === 1) || coresignalData.experience[0];
        const department = currentExp?.department || '-';
        const companyName = currentExp?.company_name || '-';
        
        // Update the record with intelligence fields
        const updatedCustomFields = {
          ...record.customFields,
          influenceLevel,
          engagementStrategy,
          seniority,
          isBuyerGroupMember,
          department,
          companyName,
          influenceScore,
          decisionPower,
          // Add role analysis
          primaryRole: currentExp?.position_title || 'Professional',
          engagementLevel: 'Neutral', // Default for now
          communicationStyle: 'Professional',
          decisionMaking: 'Data-driven',
          preferredContact: 'Email',
          responseTime: '24-48 hours'
        };
        
        await prisma[recordType].update({
          where: { id: record.id },
          data: { customFields: updatedCustomFields }
        });
        
        updatedCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`✅ Updated ${updatedCount} ${recordType} records`);
        }
      }
      
      console.log(`✅ Successfully updated ${updatedCount} ${recordType} records`);
    }
    
    // Verify Aaron Root specifically
    const aaronRoot = await prisma.leads.findFirst({
      where: { fullName: { contains: 'Aaron Root' } }
    });
    
    if (aaronRoot) {
      console.log('\n📊 AARON ROOT VERIFICATION:');
      console.log('Influence Level:', aaronRoot.customFields?.influenceLevel);
      console.log('Engagement Strategy:', aaronRoot.customFields?.engagementStrategy);
      console.log('Seniority:', aaronRoot.customFields?.seniority);
      console.log('Buyer Group Member:', aaronRoot.customFields?.isBuyerGroupMember);
      console.log('Buyer Group Optimized:', aaronRoot.customFields?.buyerGroupOptimized);
      console.log('Department:', aaronRoot.customFields?.department);
      console.log('Company Name:', aaronRoot.customFields?.companyName);
      console.log('Influence Score:', aaronRoot.customFields?.influenceScore);
      console.log('Decision Power:', aaronRoot.customFields?.decisionPower);
      console.log('Primary Role:', aaronRoot.customFields?.primaryRole);
    }
    
    console.log('\n🎉 Comprehensive intelligence generation completed!');
    
  } catch (error) {
    console.error('❌ Error generating comprehensive intelligence:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  generateComprehensiveIntelligence()
    .then(() => {
      console.log('🎉 Comprehensive intelligence generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Comprehensive intelligence generation failed:', error);
      process.exit(1);
    });
}

module.exports = { generateComprehensiveIntelligence };
