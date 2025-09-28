#!/usr/bin/env node

/**
 * 🧪 TEST EMAIL-BASED CORESIGNAL ENRICHMENT
 * 
 * This script specifically tests the email-based enrichment approach
 * using the exact method that worked for Michael Bayle
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class TestEmailEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus workspace
  }

  async testEmailEnrichment() {
    try {
      console.log('🧪 TESTING EMAIL-BASED CORESIGNAL ENRICHMENT');
      console.log('============================================');
      console.log(`📊 Workspace ID: ${this.workspaceId}`);
      console.log(`🔑 CoreSignal API Key: ${this.coresignalApiKey ? 'Configured' : 'Missing'}`);
      console.log('');

      if (!this.coresignalApiKey) {
        throw new Error('CORESIGNAL_API_KEY not found in environment variables');
      }

      // Get people with emails but no LinkedIn (email-only category)
      const emailOnlyPeople = await this.prisma.people.findMany({
        where: {
          workspaceId: this.workspaceId,
          OR: [
            { email: { not: null } },
            { workEmail: { not: null } },
            { personalEmail: { not: null } }
          ],
          linkedinUrl: null
        },
        include: {
          company: {
            select: {
              name: true
            }
          }
        },
        take: 5, // Test with 5 people
        orderBy: {
          fullName: 'asc'
        }
      });

      console.log(`📋 Found ${emailOnlyPeople.length} people with emails but no LinkedIn`);
      console.log('');

      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < emailOnlyPeople.length; i++) {
        const person = emailOnlyPeople[i];
        const email = person.email || person.workEmail || person.personalEmail;
        
        console.log(`   ${i + 1}/${emailOnlyPeople.length} - ${person.fullName}`);
        console.log(`      Email: ${email}`);
        console.log(`      Company: ${person.company?.name || 'Unknown'}`);
        
        try {
          // Test the exact email search approach that worked
          const employeeId = await this.searchByExactEmail(email);
          
          if (employeeId) {
            const profileData = await this.collectEmployeeProfile(employeeId);
            
            if (profileData) {
              console.log(`      ✅ SUCCESS: Found CoreSignal data`);
              console.log(`         Name: ${profileData.full_name}`);
              console.log(`         Title: ${profileData.active_experience_title}`);
              console.log(`         Company: ${profileData.experience?.[0]?.company_name}`);
              console.log(`         LinkedIn: ${profileData.linkedin_url}`);
              console.log(`         Skills: ${profileData.inferred_skills?.slice(0, 3).join(', ')}`);
              console.log(`         Location: ${profileData.location_full}`);
              
              successCount++;
            } else {
              console.log(`      ⚠️  Found employee ID but no profile data`);
              failureCount++;
            }
          } else {
            console.log(`      ❌ No CoreSignal match found`);
            failureCount++;
          }
          
        } catch (error) {
          console.log(`      ❌ Error: ${error.message}`);
          failureCount++;
        }
        
        // Rate limiting
        if (i < emailOnlyPeople.length - 1) {
          await this.delay(200);
        }
        
        console.log('');
      }

      // Summary
      console.log('📊 EMAIL ENRICHMENT TEST RESULTS');
      console.log('=================================');
      console.log(`   Total tested: ${emailOnlyPeople.length}`);
      console.log(`   Successful: ${successCount} (${Math.round((successCount / emailOnlyPeople.length) * 100)}%)`);
      console.log(`   Failed: ${failureCount}`);
      console.log('');
      
      if (successCount > 0) {
        console.log('🎯 RECOMMENDATION:');
        console.log('   ✅ Email-based enrichment is working!');
        console.log('   🚀 Ready to proceed with full enrichment');
      } else {
        console.log('🎯 RECOMMENDATION:');
        console.log('   ⚠️  Email-based enrichment needs investigation');
        console.log('   🔍 Consider checking email quality or search strategies');
      }

    } catch (error) {
      console.error('❌ CRITICAL ERROR:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async searchByExactEmail(email) {
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                term: {
                  "primary_professional_email.exact": email
                }
              }
            ]
          }
        }
      };

      const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.coresignalApiKey
        },
        body: JSON.stringify(searchQuery)
      });

      if (response.ok) {
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async collectEmployeeProfile(employeeId) {
    try {
      const response = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
        method: 'GET',
        headers: {
          'apikey': this.coresignalApiKey,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test
async function main() {
  const tester = new TestEmailEnrichment();
  await tester.testEmailEnrichment();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestEmailEnrichment;
