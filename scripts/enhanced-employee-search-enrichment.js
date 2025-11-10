/**
 * 🚀 ENHANCED EMPLOYEE SEARCH ENRICHMENT
 * 
 * Uses the working employee_multi_source endpoint to find and enrich people
 * This replaces the basic person endpoint with the more comprehensive employee search
 */

const { PrismaClient } = require('@prisma/client');

class EnhancedEmployeeSearchEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY || 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  /**
   * 🚀 MAIN EXECUTION - Enhanced employee search enrichment
   */
  async enrichPersonWithEmployeeSearch(personName) {
    console.log('🔍 ENHANCED EMPLOYEE SEARCH ENRICHMENT');
    console.log('=' .repeat(60));

    try {
      // Get the person from our database
      const person = await this.getPersonFromDatabase(personName);
      if (!person) {
        console.log('❌ Person not found in database');
        return;
      }

      console.log(`👤 Enriching: ${person.fullName}`);
      console.log(`   Email: ${person.workEmail || person.email}`);
      console.log(`   LinkedIn: ${person.linkedinUrl}`);
      console.log(`   Company: ${person.company?.name || 'None'}`);

      // Try different search strategies with employee endpoint
      const searchResults = await this.searchPersonWithEmployeeEndpoint(person);
      
      if (!searchResults || searchResults.length === 0) {
        console.log('❌ No results found with employee search');
        return;
      }

      console.log(`✅ Found ${searchResults.length} results`);
      
      // Get detailed data for the best match
      const bestMatch = searchResults[0];
      console.log(`🎯 Best match: ${bestMatch.full_name} (ID: ${bestMatch.id})`);
      
      // Update the person with complete data
      await this.updatePersonWithEmployeeData(person, bestMatch);
      
      console.log('✅ Person enriched successfully!');

    } catch (error) {
      console.error('❌ Enrichment failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Get person from database
   */
  async getPersonFromDatabase(personName) {
    return await this.prisma.people.findFirst({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        fullName: personName
      },
      include: {
        company: true
      }
    });
  }

  /**
   * Search person using employee endpoint with multiple strategies
   */
  async searchPersonWithEmployeeEndpoint(person) {
    console.log('\n🔍 SEARCHING WITH EMPLOYEE ENDPOINT...');
    
    const searchStrategies = [
      {
        name: 'LinkedIn URL Search',
        data: {
          query: {
            bool: {
              must: [
                {
                  match_phrase: {
                    linkedin_url: person.linkedinUrl
                  }
                }
              ]
            }
          }
        }
      },
      {
        name: 'Email Search',
        data: {
          query: {
            bool: {
              must: [
                {
                  query_string: {
                    query: person.workEmail || person.email,
                    default_field: "primary_professional_email",
                    default_operator: "and"
                  }
                }
              ]
            }
          }
        }
      },
      {
        name: 'Full Name Search',
        data: {
          query: {
            bool: {
              must: [
                {
                  query_string: {
                    query: person.fullName,
                    default_field: "full_name",
                    default_operator: "and"
                  }
                }
              ]
            }
          }
        }
      },
      {
        name: 'First + Last Name Search',
        data: {
          query: {
            bool: {
              must: [
                {
                  query_string: {
                    query: person.firstName || person.fullName.split(' ')[0],
                    default_field: "first_name",
                    default_operator: "and"
                  }
                },
                {
                  query_string: {
                    query: person.lastName || person.fullName.split(' ').slice(-1)[0],
                    default_field: "last_name",
                    default_operator: "and"
                  }
                }
              ]
            }
          }
        }
      },
      {
        name: 'Name + Company Search',
        data: {
          query: {
            bool: {
              must: [
                {
                  query_string: {
                    query: person.fullName,
                    default_field: "full_name",
                    default_operator: "and"
                  }
                },
                {
                  query_string: {
                    query: person.company?.name || '',
                    default_field: "active_experience_company",
                    default_operator: "and"
                  }
                }
              ]
            }
          }
        }
      }
    ];

    for (const strategy of searchStrategies) {
      console.log(`   🔍 Trying: ${strategy.name}`);
      
      try {
        const results = await this.performEmployeeSearch(strategy.data);
        
        if (results && results.length > 0) {
          console.log(`   ✅ Found ${results.length} results with ${strategy.name}`);
          return results;
        } else {
          console.log(`   ❌ No results with ${strategy.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Error with ${strategy.name}: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Perform employee search
   */
  async performEmployeeSearch(query) {
    const url = `${this.baseUrl}/employee_multi_source/search/es_dsl`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.coresignalApiKey
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.hits?.hits?.map(hit => hit._source) || [];
  }

  /**
   * Update person with employee data
   */
  async updatePersonWithEmployeeData(person, employeeData) {
    console.log('\n💾 UPDATING PERSON WITH EMPLOYEE DATA...');
    
    try {
      // Parse location data
      const locationParts = this.parseLocation(employeeData.location_full);
      
      // Extract best current title using company-matched logic
      const { extractBestCurrentTitleFromCoreSignal } = require('./utils/title-extraction');
      const companyName = typeof person.company === 'string' 
        ? person.company 
        : (person.company?.name || null);
      const bestTitle = extractBestCurrentTitleFromCoreSignal(
        employeeData,
        companyName,
        null, // company ID if available
        person.jobTitle // manual title
      );
      
      // Prepare update data
      const updateData = {
        // Core fields
        workEmail: employeeData.primary_professional_email || person.workEmail,
        workPhone: employeeData.phone || person.workPhone,
        jobTitle: bestTitle || employeeData.active_experience_title || person.jobTitle,
        linkedinUrl: employeeData.linkedin_url || person.linkedinUrl,
        profilePictureUrl: employeeData.picture_url || person.profilePictureUrl,
        
        // Location fields
        address: employeeData.location_full || person.address,
        city: locationParts.city || person.city,
        state: locationParts.state || person.state,
        country: locationParts.country || person.country,
        postalCode: locationParts.postalCode || person.postalCode,
        
        // Store complete employee data
        customFields: {
          ...person.customFields,
          coresignalEmployeeData: {
            ...employeeData,
            lastEnrichedAt: new Date().toISOString(),
            enrichmentSource: 'CoreSignal Employee API - Enhanced Search',
            totalFields: Object.keys(employeeData).length,
            dataQuality: this.assessDataQuality(employeeData)
          }
        },
        
        // Update enrichment sources
        enrichmentSources: [
          ...(person.enrichmentSources || []),
          'coresignal-employee-enhanced'
        ].filter((source, index, array) => array.indexOf(source) === index),
        
        lastEnriched: new Date()
      };

      // Update the person
      const updatedPerson = await this.prisma.people.update({
        where: { id: person.id },
        data: updateData
      });

      console.log('   ✅ Person updated successfully');
      console.log(`   📊 Data quality: ${updateData.customFields.coresignalEmployeeData.dataQuality.completeness}% complete`);
      console.log(`   📊 Experience: ${employeeData.experience?.length || 0} positions`);
      console.log(`   📊 Education: ${employeeData.education?.length || 0} degrees`);
      console.log(`   📊 Skills: ${employeeData.skills?.length || 0} skills`);
      
      return updatedPerson;
      
    } catch (error) {
      console.error('   ❌ Error updating person:', error.message);
      throw error;
    }
  }

  /**
   * Parse location string into components
   */
  parseLocation(locationString) {
    if (!locationString) return {};
    
    const parts = locationString.split(',').map(part => part.trim());
    
    return {
      city: parts[0] || null,
      state: parts[1] || null,
      country: parts[2] || null,
      postalCode: null
    };
  }

  /**
   * Assess data quality
   */
  assessDataQuality(data) {
    const criticalFields = [
      'full_name', 'primary_professional_email', 'linkedin_url',
      'active_experience_title', 'active_experience_company',
      'phone', 'location_full', 'experience', 'education', 'skills'
    ];
    
    const populatedFields = criticalFields.filter(field => {
      const value = data[field];
      return value !== null && value !== undefined && value !== '' && value !== 'N/A';
    });
    
    const completeness = (populatedFields.length / criticalFields.length) * 100;
    
    return {
      completeness: Math.round(completeness),
      populatedFields: populatedFields.length,
      totalFields: criticalFields.length,
      hasExperience: data.experience && data.experience.length > 0,
      hasEducation: data.education && data.education.length > 0,
      hasSkills: data.skills && data.skills.length > 0,
      hasContactInfo: !!(data.primary_professional_email || data.phone),
      hasSocialData: !!(data.linkedin_url || data.followers_count)
    };
  }

  /**
   * Enrich multiple people in batch
   */
  async enrichMultiplePeople(personNames) {
    console.log(`🚀 BATCH ENRICHMENT: ${personNames.length} people`);
    
    for (const personName of personNames) {
      console.log(`\n📋 Processing: ${personName}`);
      await this.enrichPersonWithEmployeeSearch(personName);
    }
    
    console.log('\n✅ Batch enrichment complete!');
  }
}

// Export for use
module.exports = { EnhancedEmployeeSearchEnrichment };

// Example usage
async function enrichAaronAdkins() {
  const enrichment = new EnhancedEmployeeSearchEnrichment();
  await enrichment.enrichPersonWithEmployeeSearch('Aaron Adkins');
}

// Run if called directly
if (require.main === module) {
  enrichAaronAdkins().catch(console.error);
}
