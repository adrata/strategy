const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
require('dotenv').config();

const prisma = new PrismaClient();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function showFullProfileData() {
  console.log('🔍 SHOWING FULL CORESIGNAL PROFILE DATA');
  console.log('=======================================');
  console.log('');

  try {
    // Get Alabama Power Company
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: 'TOP' } },
      select: { id: true, name: true }
    });
    
    const company = await prisma.companies.findFirst({
      where: {
        workspaceId: workspace.id,
        name: { contains: 'Alabama Power', mode: 'insensitive' },
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true
      }
    });
    
    if (!company) {
      throw new Error('Alabama Power Company not found');
    }
    
    const coresignalData = company.customFields?.coresignalData;
    const companyId = coresignalData?.id;
    
    console.log(`🏢 Company: ${company.name}`);
    console.log(`   CoreSignal ID: ${companyId}`);
    console.log('');
    
    // Search for a few people
    const searchQuery = {
      query: {
        bool: {
          must: [
            { term: { 'active_experience_company_id': companyId } },
            {
              nested: {
                path: 'experience',
                query: {
                  bool: {
                    must: [
                      { term: { 'experience.active_experience': 1 } },
                      { term: { 'experience.company_id': companyId } }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    };
    
    const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY
      },
      body: JSON.stringify(searchQuery)
    });
    
    const employeeIds = await response.json();
    console.log(`🔍 Found ${employeeIds.length} employee IDs`);
    console.log('');
    
    // Collect full profile for first person
    if (employeeIds.length > 0) {
      const employeeId = employeeIds[0];
      console.log(`📊 COLLECTING FULL PROFILE FOR EMPLOYEE ID: ${employeeId}`);
      console.log('─'.repeat(60));
      
      const profileResponse = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/collect/${employeeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CORESIGNAL_API_KEY
        }
      });
      
      const fullProfile = await profileResponse.json();
      
      console.log('📋 FULL PROFILE DATA STRUCTURE:');
      console.log('================================');
      console.log('');
      
      // Show key sections of the profile
      console.log('👤 BASIC INFORMATION:');
      console.log(`   ID: ${fullProfile.id}`);
      console.log(`   Full Name: ${fullProfile.full_name}`);
      console.log(`   First Name: ${fullProfile.first_name}`);
      console.log(`   Last Name: ${fullProfile.last_name}`);
      console.log(`   Headline: ${fullProfile.headline}`);
      console.log(`   Summary: ${fullProfile.summary?.substring(0, 100)}...`);
      console.log(`   Picture URL: ${fullProfile.picture_url}`);
      console.log('');
      
      console.log('🏢 CURRENT EXPERIENCE:');
      console.log(`   Company ID: ${fullProfile.active_experience_company_id}`);
      console.log(`   Title: ${fullProfile.active_experience_title}`);
      console.log(`   Department: ${fullProfile.active_experience_department}`);
      console.log(`   Management Level: ${fullProfile.active_experience_management_level}`);
      console.log(`   Is Decision Maker: ${fullProfile.is_decision_maker}`);
      console.log(`   Is Working: ${fullProfile.is_working}`);
      console.log('');
      
      console.log('📧 CONTACT INFORMATION:');
      console.log(`   Primary Email: ${fullProfile.primary_professional_email}`);
      console.log(`   LinkedIn URL: ${fullProfile.professional_network_url}`);
      console.log(`   Location: ${fullProfile.location_full}`);
      console.log(`   Country: ${fullProfile.location_country}`);
      console.log('');
      
      console.log('🔗 SOCIAL & NETWORK:');
      console.log(`   Connections Count: ${fullProfile.connections_count}`);
      console.log(`   Followers Count: ${fullProfile.followers_count}`);
      console.log('');
      
      console.log('🎯 SKILLS & EXPERTISE:');
      console.log(`   Inferred Skills: ${JSON.stringify(fullProfile.inferred_skills?.slice(0, 5))}`);
      console.log(`   Interests: ${JSON.stringify(fullProfile.interests?.slice(0, 3))}`);
      console.log('');
      
      console.log('💼 EXPERIENCE HISTORY:');
      if (fullProfile.experience && fullProfile.experience.length > 0) {
        console.log(`   Total Experience Records: ${fullProfile.experience.length}`);
        fullProfile.experience.slice(0, 3).forEach((exp, index) => {
          console.log(`   ${index + 1}. ${exp.company_name} - ${exp.position_title} (${exp.department})`);
          console.log(`      Duration: ${exp.duration_months} months`);
          console.log(`      Active: ${exp.active_experience ? 'Yes' : 'No'}`);
        });
      }
      console.log('');
      
      console.log('💰 COMPENSATION DATA:');
      console.log(`   Base Salary P25: ${fullProfile.projected_base_salary_p25}`);
      console.log(`   Base Salary Median: ${fullProfile.projected_base_salary_median}`);
      console.log(`   Base Salary P75: ${fullProfile.projected_base_salary_p75}`);
      console.log(`   Total Salary P75: ${fullProfile.projected_total_salary_p75}`);
      console.log('');
      
      console.log('📈 ACTIVITY & ENGAGEMENT:');
      console.log(`   Total Experience Duration: ${fullProfile.total_experience_duration_months} months`);
      console.log(`   Profile Changes: ${fullProfile.profile_root_field_changes_summary}`);
      console.log('');
      
      console.log('🏆 ACHIEVEMENTS:');
      if (fullProfile.awards && fullProfile.awards.length > 0) {
        console.log(`   Awards: ${fullProfile.awards.length} awards`);
      }
      if (fullProfile.patents && fullProfile.patents.length > 0) {
        console.log(`   Patents: ${fullProfile.patents.length} patents`);
      }
      if (fullProfile.publications && fullProfile.publications.length > 0) {
        console.log(`   Publications: ${fullProfile.publications.length} publications`);
      }
      console.log('');
      
      console.log('📊 ALL AVAILABLE FIELDS:');
      console.log('========================');
      const allFields = Object.keys(fullProfile);
      console.log(`Total fields available: ${allFields.length}`);
      console.log('Key field categories:');
      
      const categories = {
        'Identity': allFields.filter(f => f.includes('name') || f.includes('id') || f.includes('profile')),
        'Contact': allFields.filter(f => f.includes('email') || f.includes('phone') || f.includes('location')),
        'Experience': allFields.filter(f => f.includes('experience') || f.includes('title') || f.includes('department')),
        'Skills': allFields.filter(f => f.includes('skill') || f.includes('interest') || f.includes('education')),
        'Social': allFields.filter(f => f.includes('connection') || f.includes('follower') || f.includes('linkedin')),
        'Compensation': allFields.filter(f => f.includes('salary') || f.includes('compensation')),
        'Activity': allFields.filter(f => f.includes('activity') || f.includes('change') || f.includes('recent'))
      };
      
      Object.entries(categories).forEach(([category, fields]) => {
        if (fields.length > 0) {
          console.log(`   ${category}: ${fields.length} fields`);
        }
      });
      
      console.log('');
      console.log('✅ FULL PROFILE DATA COLLECTION COMPLETE!');
      console.log('This shows the comprehensive data we get for each person in the buyer group.');
      
    } else {
      console.log('❌ No employee IDs found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showFullProfileData();
