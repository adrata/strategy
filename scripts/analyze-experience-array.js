#!/usr/bin/env node

/**
 * 🔍 ANALYZE EXPERIENCE ARRAY IN CORESIGNAL DATA
 * 
 * The organizations field is empty, but we have experience data
 * Let's analyze the experience array to find current company information
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class AnalyzeExperienceArray {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async analyzeExperienceArray() {
    console.log('🔍 ANALYZING EXPERIENCE ARRAY IN CORESIGNAL DATA');
    console.log('===============================================');
    console.log('The organizations field is empty, analyzing experience array');
    console.log('');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    // Get one person for detailed analysis
    const person = await this.getOnePersonForAnalysis();
    
    if (person) {
      await this.analyzePersonExperience(person);
    }
    
    await this.prisma.$disconnect();
  }

  async getOnePersonForAnalysis() {
    // Get one person who was recently enriched with CoreSignal data
    const person = await this.prisma.people.findFirst({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        customFields: {
          path: ['coresignalData'],
          not: null
        },
        linkedinUrl: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        linkedinUrl: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });
    
    return person;
  }

  async analyzePersonExperience(person) {
    console.log(`🔍 ANALYZING EXPERIENCE FOR: ${person.fullName}`);
    console.log('===============================================');
    console.log(`   Our Company: ${person.company?.name || 'Unknown'}`);
    console.log(`   LinkedIn: ${person.linkedinUrl}`);
    console.log('');
    
    try {
      // Get fresh CoreSignal data
      const coresignalData = await this.getCoreSignalData(person.linkedinUrl);
      
      if (coresignalData) {
        console.log('   📊 CORESIGNAL EXPERIENCE ANALYSIS:');
        console.log('   ===================================');
        
        // Show active experience fields
        console.log('   Active Experience Fields:');
        console.log(`     active_experience_company_id: ${coresignalData.active_experience_company_id}`);
        console.log(`     active_experience_title: ${coresignalData.active_experience_title}`);
        console.log(`     active_experience_company: ${coresignalData.active_experience_company}`);
        console.log('');
        
        // Analyze experience array
        if (coresignalData.experience && Array.isArray(coresignalData.experience)) {
          console.log(`   Experience Array Count: ${coresignalData.experience.length}`);
          console.log('');
          
          coresignalData.experience.forEach((exp, index) => {
            console.log(`   Experience ${index + 1}:`);
            console.log(`     Company: ${exp.company || 'None'}`);
            console.log(`     Company Name: ${exp.company_name || 'None'}`);
            console.log(`     Title: ${exp.title || 'None'}`);
            console.log(`     Position: ${exp.position || 'None'}`);
            console.log(`     Job Title: ${exp.job_title || 'None'}`);
            console.log(`     Start Date: ${exp.start_date || 'None'}`);
            console.log(`     End Date: ${exp.end_date || 'None'}`);
            console.log(`     Is Current: ${exp.is_current || 'None'}`);
            console.log(`     Current: ${exp.current || 'None'}`);
            console.log(`     Active: ${exp.active || 'None'}`);
            console.log(`     Company ID: ${exp.company_id || 'None'}`);
            console.log(`     Organization ID: ${exp.organization_id || 'None'}`);
            console.log(`     All Fields: ${Object.keys(exp).join(', ')}`);
            console.log('');
          });
          
          // Try to find current experience
          console.log('   Current Experience Analysis:');
          console.log('   ============================');
          
          const currentExperience = coresignalData.experience.find(exp => 
            exp.is_current || exp.current || exp.active
          );
          
          if (currentExperience) {
            console.log('   ✅ CURRENT EXPERIENCE FOUND:');
            console.log(`     Company: ${currentExperience.company || currentExperience.company_name}`);
            console.log(`     Title: ${currentExperience.title || currentExperience.position}`);
            console.log(`     Start Date: ${currentExperience.start_date}`);
            console.log(`     End Date: ${currentExperience.end_date}`);
            console.log(`     Is Current: ${currentExperience.is_current}`);
          } else {
            console.log('   ❌ NO CURRENT EXPERIENCE FOUND');
            console.log('   All experiences appear to be past positions');
          }
          
          // Try to match with active company ID
          if (coresignalData.active_experience_company_id) {
            console.log('');
            console.log('   Active Company ID Matching:');
            console.log('   ===========================');
            console.log(`   Looking for company ID: ${coresignalData.active_experience_company_id}`);
            
            const matchingExp = coresignalData.experience.find(exp => 
              exp.company_id === coresignalData.active_experience_company_id ||
              exp.organization_id === coresignalData.active_experience_company_id
            );
            
            if (matchingExp) {
              console.log('   ✅ MATCHING EXPERIENCE FOUND:');
              console.log(`     Company: ${matchingExp.company || matchingExp.company_name}`);
              console.log(`     Title: ${matchingExp.title || matchingExp.position}`);
              console.log(`     Company ID: ${matchingExp.company_id}`);
              console.log(`     Organization ID: ${matchingExp.organization_id}`);
            } else {
              console.log('   ❌ NO MATCHING EXPERIENCE FOUND');
              console.log('   Available Company IDs in experience:');
              coresignalData.experience.forEach((exp, index) => {
                console.log(`     ${index + 1}. Company ID: ${exp.company_id}, Organization ID: ${exp.organization_id}, Company: ${exp.company || exp.company_name}`);
              });
            }
          }
          
        } else {
          console.log('   No experience array found');
        }
        
      } else {
        console.log('   ❌ NO CORESIGNAL DATA FOUND');
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('');
  }

  async getCoreSignalData(linkedinUrl) {
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                match: {
                  linkedin_url: linkedinUrl
                }
              }
            ]
          }
        }
      };

      const searchUrl = `${this.baseUrl}/employee_multi_source/search/es_dsl?items_per_page=1`;
      
      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        if (Array.isArray(searchData) && searchData.length > 0) {
          const employeeId = searchData[0];
          const collectUrl = `${this.baseUrl}/employee_multi_source/collect/${employeeId}`;
          
          const collectResponse = await fetch(collectUrl, {
            method: 'GET',
            headers: { 
              'apikey': this.apiKey,
              'Accept': 'application/json'
            }
          });

          if (collectResponse.ok) {
            return await collectResponse.json();
          }
        }
      }
      
      return null;
    } catch (error) {
      console.log(`     Error getting CoreSignal data: ${error.message}`);
      return null;
    }
  }
}

// Run experience array analysis
async function main() {
  const analyzer = new AnalyzeExperienceArray();
  await analyzer.analyzeExperienceArray();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AnalyzeExperienceArray;
