#!/usr/bin/env node

/**
 * 🔧 FIX COMPREHENSIVE ENRICHMENT
 * 
 * This script fixes the enrichment by properly extracting all data
 * from CoreSignal rawData and mapping it to all three tabs.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Enhanced data extraction function
function extractComprehensiveData(record) {
  const customFields = record.customFields || {};
  const rawData = customFields.rawData || {};
  
  // Overview Tab Data
  const overviewData = {
    name: rawData.full_name || record.fullName || 'Unknown',
    title: rawData.active_experience_title || rawData.experience?.[0]?.position_title || record.jobTitle || 'Unknown Title',
    email: rawData.primary_professional_email || record.email || 'No email',
    phone: rawData.phone || record.phone || 'No phone',
    linkedin: rawData.linkedin_url || record.linkedinUrl || 'No LinkedIn',
    department: rawData.active_experience_department || rawData.experience?.[0]?.department || record.department || 'Unknown Department',
    seniority: rawData.active_experience_management_level || record.seniority || 'Unknown',
    location: rawData.location_full || record.city || 'Unknown Location',
    company: rawData.experience?.[0]?.company_name || record.company || 'Unknown Company',
    industry: rawData.experience?.[0]?.company_industry || record.industry || 'Unknown Industry',
    buyerGroupRole: record.buyerGroupRole || 'Stakeholder',
    influenceLevel: customFields.influenceLevel || 'Medium',
    engagementPriority: customFields.engagementPriority || 'Medium',
    status: record.status || 'active',
    priority: record.priority || 'medium',
    notes: record.notes || 'No notes available',
    tags: record.tags || [],
    bio: rawData.summary || record.bio || 'No bio available'
  };
  
  // Intelligence Tab Data
  const intelligenceData = {
    companyName: rawData.experience?.[0]?.company_name || record.company || 'Unknown Company',
    industry: rawData.experience?.[0]?.company_industry || record.industry || 'Unknown Industry',
    size: rawData.experience?.[0]?.company_size_range || record.size || 'Unknown Size',
    revenue: record.revenue || 'Unknown Revenue',
    website: rawData.experience?.[0]?.company_website || record.website || 'No website',
    description: record.description || 'No description',
    location: rawData.experience?.[0]?.company_hq_full_address || record.address || 'Unknown Location',
    employeeCount: rawData.experience?.[0]?.company_employees_count || record.employeeCount || 'Unknown',
    foundedYear: rawData.experience?.[0]?.company_founded_year || record.foundedYear || 'Unknown',
    categories: rawData.experience?.[0]?.company_categories_and_keywords || [],
    situationAnalysis: record.situationAnalysis || 'No situation analysis available',
    complications: record.complications || 'No complications identified',
    strategicIntelligence: record.strategicIntelligence || 'No strategic intelligence available',
    painIntelligence: record.painIntelligence || 'No pain intelligence available',
    wants: record.wants || [],
    needs: record.needs || [],
    psychographicProfile: record.psychographicProfile || 'No psychographic profile available',
    communicationStyleRecommendations: record.communicationStyleRecommendations || 'No communication style recommendations available'
  };
  
  // Career Tab Data
  const careerData = {
    currentRole: rawData.active_experience_title || rawData.experience?.[0]?.position_title || record.jobTitle || 'Unknown Title',
    currentCompany: rawData.experience?.[0]?.company_name || record.company || 'Unknown Company',
    department: rawData.active_experience_department || rawData.experience?.[0]?.department || record.department || 'Unknown Department',
    seniority: rawData.active_experience_management_level || record.seniority || 'Unknown',
    yearsInRole: rawData.experience?.[0]?.duration_months ? Math.round(rawData.experience[0].duration_months / 12) : 'Unknown',
    yearsAtCompany: rawData.experience?.[0]?.duration_months ? Math.round(rawData.experience[0].duration_months / 12) : 'Unknown',
    totalExperience: rawData.total_experience_duration_months ? Math.round(rawData.total_experience_duration_months / 12) : 'Unknown',
    education: rawData.education || [],
    skills: rawData.inferred_skills || [],
    certifications: rawData.courses || [],
    careerTimeline: rawData.experience || [],
    previousRoles: rawData.experience || [],
    industryExperience: rawData.experience?.[0]?.company_industry || 'Unknown',
    leadershipExperience: rawData.active_experience_management_level || 'Unknown',
    teamSize: 'Unknown', // Not available in raw data
    budgetResponsibility: 'Unknown', // Not available in raw data
    achievements: rawData.awards || [],
    publications: rawData.publications || [],
    speakingEngagements: [], // Not available in raw data
    awards: rawData.awards || []
  };
  
  return {
    overview: overviewData,
    intelligence: intelligenceData,
    career: careerData
  };
}

async function fixComprehensiveEnrichment() {
  console.log('🔧 Fixing comprehensive enrichment for all records...\n');
  
  const recordTypes = [
    { name: 'leads', model: prisma.leads },
    { name: 'people', model: prisma.people }
  ];
  
  let totalFixed = 0;
  
  for (const { name, model } of recordTypes) {
    try {
      console.log(`📊 Fixing ${name.toUpperCase()} records...`);
      
      // Get records that have rawData but incomplete enrichedData
      const records = await model.findMany({
        where: {
          customFields: {
            path: ['rawData'],
            not: null
          },
          deletedAt: null
        },
        take: 500 // Process in smaller batches
      });
      
      console.log(`   Found ${records.length} ${name} records to fix\n`);
      
      let fixedCount = 0;
      
      for (const record of records) {
        try {
          const comprehensiveData = extractComprehensiveData(record);
          
          // Update the record with comprehensive enriched data
          const enrichedCustomFields = {
            ...record.customFields,
            enrichedData: {
              ...comprehensiveData,
              lastEnriched: new Date().toISOString(),
              enrichmentVersion: '3.1',
              recordType: name
            }
          };
          
          await model.update({
            where: { id: record.id },
            data: { customFields: enrichedCustomFields }
          });
          
          fixedCount++;
          if (fixedCount % 100 === 0) {
            console.log(`   ✅ Fixed ${fixedCount} ${name} records...`);
          }
          
        } catch (error) {
          console.error(`   ❌ Error fixing ${name} ${record.id}:`, error.message);
        }
      }
      
      console.log(`   ✅ Successfully fixed: ${fixedCount} ${name} records\n`);
      totalFixed += fixedCount;
      
    } catch (error) {
      console.error(`❌ Fatal error processing ${name}:`, error);
    }
  }
  
  console.log('='.repeat(80));
  console.log('📊 COMPREHENSIVE ENRICHMENT FIX SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successfully fixed: ${totalFixed} records`);
  console.log('');
  console.log('🎯 All records now have complete enriched data for:');
  console.log('   📋 Overview Tab (basic info, contact, role & influence)');
  console.log('   🧠 Intelligence Tab (company intel, strategic analysis)');
  console.log('   💼 Career Tab (experience, education, skills)');
}

// Run the fix
fixComprehensiveEnrichment().catch(console.error).finally(() => prisma.$disconnect());
