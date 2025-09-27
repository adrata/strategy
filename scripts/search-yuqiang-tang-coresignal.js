#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL SEARCH FOR YUQIANG TANG
 * 
 * Search CoreSignal API for additional information on Yuqiang Tang
 * at Southern California Edison Company
 */

const { PrismaClient } = require('@prisma/client');

class CoreSignalSearcher {
  constructor() {
    this.prisma = new PrismaClient();
    this.config = {
      CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
      BASE_URL: 'https://api.coresignal.com/cdapi/v2',
      MAX_RETRIES: 3,
      RATE_LIMIT_DELAY: 1000
    };
  }

  async searchYuqiangTang() {
    console.log('🔍 SEARCHING CORESIGNAL FOR YUQIANG TANG');
    console.log('==========================================');
    
    try {
      // First, get the person from our database
      const person = await this.prisma.people.findUnique({
        where: { id: '01K5D6B8YE869KSN9NXKFRMV3Q' },
        include: { company: true }
      });

      if (!person) {
        console.log('❌ Person not found in database');
        return;
      }

      console.log(`👤 Searching for: ${person.fullName}`);
      console.log(`🏢 Company: ${person.company?.name}`);
      console.log(`📞 Phone: ${person.phone}`);
      console.log('');

      // Search CoreSignal by name and company
      const searchResults = await this.searchPersonByNameAndCompany(
        person.fullName,
        person.company?.name
      );

      if (searchResults && searchResults.length > 0) {
        console.log('✅ FOUND MATCHES IN CORESIGNAL:');
        console.log('===============================');
        
        for (let i = 0; i < searchResults.length; i++) {
          const result = searchResults[i];
          console.log(`\n${i + 1}. MATCH FOUND:`);
          console.log(`   ID: ${result.id}`);
          console.log(`   Full Name: ${result.full_name}`);
          console.log(`   Job Title: ${result.active_experience_title || 'Not specified'}`);
          console.log(`   Company: ${result.active_experience_company || 'Not specified'}`);
          console.log(`   Email: ${result.primary_professional_email || 'Not available'}`);
          console.log(`   LinkedIn: ${result.linkedin_url || 'Not available'}`);
          console.log(`   Phone: ${result.phone || 'Not available'}`);
          console.log(`   Location: ${result.location || 'Not available'}`);
          
          if (result.experience && result.experience.length > 0) {
            console.log(`   Experience:`);
            result.experience.slice(0, 3).forEach((exp, idx) => {
              console.log(`     ${idx + 1}. ${exp.title} at ${exp.company_name} (${exp.start_date} - ${exp.end_date || 'Present'})`);
            });
          }

          // Get detailed data for the best match
          if (i === 0) {
            console.log('\n🔍 GETTING DETAILED DATA FOR BEST MATCH...');
            const detailedData = await this.getPersonDetails(result.id);
            if (detailedData) {
              this.displayDetailedPersonData(detailedData);
            }
          }
        }
      } else {
        console.log('❌ NO MATCHES FOUND IN CORESIGNAL');
        console.log('Trying alternative search methods...');
        
        // Try searching by just name
        const nameOnlyResults = await this.searchPersonByNameOnly(person.fullName);
        if (nameOnlyResults && nameOnlyResults.length > 0) {
          console.log('✅ FOUND MATCHES BY NAME ONLY:');
          nameOnlyResults.slice(0, 3).forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.full_name} at ${result.active_experience_company || 'Unknown Company'}`);
          });
        }
      }

    } catch (error) {
      console.error('❌ Error searching CoreSignal:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async searchPersonByNameAndCompany(fullName, companyName) {
    console.log('🔍 Searching by name and company...');
    
    try {
      const params = new URLSearchParams({
        name: fullName,
        company: companyName,
        limit: 10
      });

      const response = await this.makeCoreSignalRequest(`/people/search?${params}`);
      return response?.data || [];
    } catch (error) {
      console.log(`   ❌ Search error: ${error.message}`);
      return [];
    }
  }

  async searchPersonByNameOnly(fullName) {
    console.log('🔍 Searching by name only...');
    
    try {
      const params = new URLSearchParams({
        name: fullName,
        limit: 10
      });

      const response = await this.makeCoreSignalRequest(`/people/search?${params}`);
      return response?.data || [];
    } catch (error) {
      console.log(`   ❌ Search error: ${error.message}`);
      return [];
    }
  }

  async getPersonDetails(personId) {
    console.log(`🔍 Getting detailed data for person ID: ${personId}`);
    
    try {
      const response = await this.makeCoreSignalRequest(`/people/${personId}`);
      return response;
    } catch (error) {
      console.log(`   ❌ Details error: ${error.message}`);
      return null;
    }
  }

  displayDetailedPersonData(data) {
    console.log('\n📊 DETAILED CORESIGNAL DATA:');
    console.log('============================');
    console.log(`👤 Full Name: ${data.full_name}`);
    console.log(`📧 Email: ${data.primary_professional_email || 'Not available'}`);
    console.log(`📞 Phone: ${data.phone || 'Not available'}`);
    console.log(`🔗 LinkedIn: ${data.linkedin_url || 'Not available'}`);
    console.log(`📍 Location: ${data.location || 'Not available'}`);
    console.log(`🏢 Current Company: ${data.active_experience_company || 'Not available'}`);
    console.log(`💼 Current Title: ${data.active_experience_title || 'Not available'}`);
    console.log(`📅 Start Date: ${data.active_experience_start_date || 'Not available'}`);
    
    if (data.experience && data.experience.length > 0) {
      console.log('\n💼 WORK EXPERIENCE:');
      data.experience.forEach((exp, index) => {
        console.log(`   ${index + 1}. ${exp.title} at ${exp.company_name}`);
        console.log(`      Period: ${exp.start_date} - ${exp.end_date || 'Present'}`);
        if (exp.description) {
          console.log(`      Description: ${exp.description.substring(0, 100)}...`);
        }
      });
    }

    if (data.education && data.education.length > 0) {
      console.log('\n🎓 EDUCATION:');
      data.education.forEach((edu, index) => {
        console.log(`   ${index + 1}. ${edu.degree} from ${edu.school_name} (${edu.graduation_year || 'Unknown'})`);
      });
    }

    if (data.skills && data.skills.length > 0) {
      console.log('\n🛠️ SKILLS:');
      console.log(`   ${data.skills.slice(0, 10).join(', ')}`);
    }
  }

  async makeCoreSignalRequest(endpoint) {
    for (let attempt = 1; attempt <= this.config.MAX_RETRIES; attempt++) {
      try {
        const url = `${this.config.BASE_URL}${endpoint}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': this.config.CORESIGNAL_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          console.log(`   ✅ CoreSignal API call successful`);
          await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY));
          return await response.json();
        } else {
          console.log(`   ❌ CoreSignal API error: ${response.status} - ${response.statusText}`);
          if (attempt < this.config.MAX_RETRIES) {
            console.log(`   🔄 Retrying in ${this.config.RATE_LIMIT_DELAY * 2}ms...`);
            await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY * 2));
          }
        }
      } catch (error) {
        console.log(`   ❌ Request error: ${error.message}`);
        if (attempt < this.config.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY * 2));
        }
      }
    }
    return null;
  }
}

// Run the search
async function main() {
  const searcher = new CoreSignalSearcher();
  await searcher.searchYuqiangTang();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalSearcher;
