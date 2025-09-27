#!/usr/bin/env node

/**
 * 🔍 ANALYZE ORGANIZATIONS FIELD IN CORESIGNAL DATA
 * 
 * Deep dive into the organizations field to understand the data structure
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class AnalyzeOrganizationsField {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async analyzeOrganizationsField() {
    console.log('🔍 ANALYZING ORGANIZATIONS FIELD IN CORESIGNAL DATA');
    console.log('==================================================');
    console.log('Deep dive into the organizations field structure');
    console.log('');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    // Get one person for detailed analysis
    const person = await this.getOnePersonForAnalysis();
    
    if (person) {
      await this.analyzePersonOrganizations(person);
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

  async analyzePersonOrganizations(person) {
    console.log(`🔍 ANALYZING ORGANIZATIONS FOR: ${person.fullName}`);
    console.log('================================================');
    console.log(`   Our Company: ${person.company?.name || 'Unknown'}`);
    console.log(`   LinkedIn: ${person.linkedinUrl}`);
    console.log('');
    
    try {
      // Get fresh CoreSignal data
      const coresignalData = await this.getCoreSignalData(person.linkedinUrl);
      
      if (coresignalData) {
        console.log('   📊 CORESIGNAL DATA STRUCTURE:');
        console.log('   =============================');
        
        // Show active experience fields
        console.log('   Active Experience Fields:');
        console.log(`     active_experience_company_id: ${coresignalData.active_experience_company_id}`);
        console.log(`     active_experience_title: ${coresignalData.active_experience_title}`);
        console.log(`     active_experience_company: ${coresignalData.active_experience_company}`);
        console.log('');
        
        // Analyze organizations field
        console.log('   Organizations Field Analysis:');
        console.log('   =============================');
        
        if (coresignalData.organizations) {
          console.log(`   Organizations Type: ${typeof coresignalData.organizations}`);
          console.log(`   Organizations Is Array: ${Array.isArray(coresignalData.organizations)}`);
          
          if (Array.isArray(coresignalData.organizations)) {
            console.log(`   Organizations Count: ${coresignalData.organizations.length}`);
            
            coresignalData.organizations.forEach((org, index) => {
              console.log(`   Organization ${index + 1}:`);
              console.log(`     ID: ${org.id}`);
              console.log(`     Name: ${org.name}`);
              console.log(`     Company ID: ${org.company_id}`);
              console.log(`     Organization ID: ${org.organization_id}`);
              console.log(`     Is Current: ${org.is_current}`);
              console.log(`     Start Date: ${org.start_date}`);
              console.log(`     End Date: ${org.end_date}`);
              console.log(`     All Fields: ${Object.keys(org).join(', ')}`);
              console.log('');
            });
          } else {
            console.log('   Organizations is not an array');
            console.log(`   Organizations Content: ${JSON.stringify(coresignalData.organizations, null, 2)}`);
          }
        } else {
          console.log('   No organizations field found');
        }
        
        // Try to match active company ID with organizations
        if (coresignalData.active_experience_company_id && coresignalData.organizations && Array.isArray(coresignalData.organizations)) {
          console.log('   Company ID Matching:');
          console.log('   ====================');
          
          const activeCompanyId = coresignalData.active_experience_company_id;
          console.log(`   Looking for company ID: ${activeCompanyId}`);
          
          const matchingOrg = coresignalData.organizations.find(org => 
            org.id === activeCompanyId || 
            org.company_id === activeCompanyId ||
            org.organization_id === activeCompanyId
          );
          
          if (matchingOrg) {
            console.log('   ✅ MATCHING ORGANIZATION FOUND:');
            console.log(`     Name: ${matchingOrg.name}`);
            console.log(`     ID: ${matchingOrg.id}`);
            console.log(`     Company ID: ${matchingOrg.company_id}`);
            console.log(`     Is Current: ${matchingOrg.is_current}`);
            console.log(`     Start Date: ${matchingOrg.start_date}`);
            console.log(`     End Date: ${matchingOrg.end_date}`);
          } else {
            console.log('   ❌ NO MATCHING ORGANIZATION FOUND');
            console.log('   Available Organization IDs:');
            coresignalData.organizations.forEach((org, index) => {
              console.log(`     ${index + 1}. ID: ${org.id}, Company ID: ${org.company_id}, Name: ${org.name}`);
            });
          }
        }
        
        // Show all available fields
        console.log('   All Available Fields:');
        console.log('   ====================');
        Object.keys(coresignalData).forEach(field => {
          const value = coresignalData[field];
          const type = typeof value;
          const isArray = Array.isArray(value);
          const length = isArray ? value.length : (typeof value === 'string' ? value.length : 'N/A');
          
          console.log(`     ${field}: ${type}${isArray ? ` (array, length: ${length})` : ''}${type === 'string' ? ` (length: ${length})` : ''}`);
        });
        
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

// Run organizations field analysis
async function main() {
  const analyzer = new AnalyzeOrganizationsField();
  await analyzer.analyzeOrganizationsField();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AnalyzeOrganizationsField;
