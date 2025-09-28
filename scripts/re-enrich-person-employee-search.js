/**
 * 🔧 RE-ENRICH PERSON WITH EMPLOYEE SEARCH
 * 
 * Uses Coresignal employee_multi_source endpoint to get complete person data
 * This should provide much better data quality than the basic person endpoint
 */

const { PrismaClient } = require('@prisma/client');

class PersonReEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY || 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  /**
   * 🚀 MAIN EXECUTION - Re-enrich person with employee search
   */
  async reEnrichPerson() {
    console.log('🔧 RE-ENRICHING PERSON WITH EMPLOYEE SEARCH');
    console.log('=' .repeat(60));

    try {
      // Get the person to re-enrich
      const person = await this.getPersonToReEnrich();
      if (!person) {
        console.log('❌ Person not found');
        return;
      }

      console.log(`👤 Re-enriching: ${person.fullName}`);
      console.log(`   Email: ${person.workEmail || person.email}`);
      console.log(`   LinkedIn: ${person.linkedinUrl}`);
      console.log(`   Company: ${person.company?.name || 'None'}`);

      // Try different search strategies
      const searchResults = await this.searchPersonWithEmployeeEndpoint(person);
      
      if (!searchResults || searchResults.length === 0) {
        console.log('❌ No results found with employee search');
        return;
      }

      console.log(`✅ Found ${searchResults.length} results`);
      
      // Get detailed data for the best match
      const bestMatch = searchResults[0];
      console.log(`🎯 Best match: ${bestMatch.full_name} (ID: ${bestMatch.id})`);
      
      const detailedData = await this.getDetailedEmployeeData(bestMatch.id);
      
      if (!detailedData) {
        console.log('❌ Failed to get detailed data');
        return;
      }

      // Update the person with complete data
      await this.updatePersonWithCompleteData(person, detailedData);
      
      console.log('✅ Person re-enriched successfully!');

    } catch (error) {
      console.error('❌ Re-enrichment failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Get person to re-enrich
   */
  async getPersonToReEnrich() {
    return await this.prisma.people.findFirst({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        fullName: 'Adam Walukiewicz Robin'
      },
      include: {
        company: true
      }
    });
  }

  /**
   * Search person using employee endpoint
   */
  async searchPersonWithEmployeeEndpoint(person) {
    console.log('\n🔍 SEARCHING WITH EMPLOYEE ENDPOINT...');
    
    const searchStrategies = [
      {
        name: 'LinkedIn URL Search',
        query: {
          bool: {
            must: [
              {
                query_string: {
                  query: person.linkedinUrl,
                  default_field: "linkedin_url",
                  default_operator: "and"
                }
              }
            ]
          }
        }
      },
      {
        name: 'Email Search',
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
      },
      {
        name: 'Name + Company Search',
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
      },
      {
        name: 'Name + Job Title Search',
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
                  query: person.jobTitle || '',
                  default_field: "active_experience_title",
                  default_operator: "and"
                }
              }
            ]
          }
        }
      }
    ];

    for (const strategy of searchStrategies) {
      console.log(`   🔍 Trying: ${strategy.name}`);
      
      try {
        const results = await this.performEmployeeSearch(strategy.query);
        
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
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.hits?.hits?.map(hit => hit._source) || [];
  }

  /**
   * Get detailed employee data
   */
  async getDetailedEmployeeData(employeeId) {
    console.log(`\n📊 GETTING DETAILED DATA FOR EMPLOYEE ${employeeId}...`);
    
    try {
      const url = `${this.baseUrl}/employee_multi_source/enrich`;
      const params = new URLSearchParams({ id: employeeId });
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'apikey': this.coresignalApiKey
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`   ✅ Got detailed data with ${Object.keys(data).length} fields`);
      
      return data;
    } catch (error) {
      console.error(`   ❌ Error getting detailed data: ${error.message}`);
      return null;
    }
  }

  /**
   * Update person with complete data
   */
  async updatePersonWithCompleteData(person, coresignalData) {
    console.log('\n💾 UPDATING PERSON WITH COMPLETE DATA...');
    
    try {
      // Parse location data
      const locationParts = this.parseLocation(coresignalData.location_full);
      
      // Prepare update data
      const updateData = {
        // Core fields
        workEmail: coresignalData.primary_professional_email || person.workEmail,
        workPhone: coresignalData.phone || person.workPhone,
        jobTitle: coresignalData.active_experience_title || person.jobTitle,
        linkedinUrl: coresignalData.linkedin_url || person.linkedinUrl,
        profilePictureUrl: coresignalData.picture_url || person.profilePictureUrl,
        
        // Location fields
        address: coresignalData.location_full || person.address,
        city: locationParts.city || person.city,
        state: locationParts.state || person.state,
        country: locationParts.country || person.country,
        postalCode: locationParts.postalCode || person.postalCode,
        
        // Update company if we have better data
        ...(coresignalData.active_experience_company && {
          company: {
            connectOrCreate: {
              where: { name: coresignalData.active_experience_company },
              create: {
                name: coresignalData.active_experience_company,
                workspaceId: person.workspaceId
              }
            }
          }
        }),
        
        // Store complete Coresignal data
        customFields: {
          ...person.customFields,
          coresignalData: {
            ...coresignalData,
            lastEnrichedAt: new Date().toISOString(),
            enrichmentSource: 'CoreSignal Employee API - Complete Data',
            totalFields: Object.keys(coresignalData).length,
            dataQuality: this.assessDataQuality(coresignalData)
          }
        },
        
        // Update enrichment sources
        enrichmentSources: [
          ...(person.enrichmentSources || []),
          'coresignal-employee-complete'
        ].filter((source, index, array) => array.indexOf(source) === index),
        
        lastEnriched: new Date()
      };

      // Update the person
      const updatedPerson = await this.prisma.people.update({
        where: { id: person.id },
        data: updateData
      });

      console.log('   ✅ Person updated successfully');
      console.log(`   📊 Data quality: ${updateData.customFields.coresignalData.dataQuality.completeness}% complete`);
      console.log(`   📊 Experience: ${coresignalData.experience?.length || 0} positions`);
      console.log(`   📊 Education: ${coresignalData.education?.length || 0} degrees`);
      console.log(`   📊 Skills: ${coresignalData.skills?.length || 0} skills`);
      
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
      postalCode: null // Would need more sophisticated parsing
    };
  }

  /**
   * Assess data quality
   */
  assessDataQuality(data) {
    const criticalFields = [
      'full_name', 'primary_professional_email', 'linkedin_url',
      'active_experience_title', 'active_experience_company',
      'phone', 'location', 'experience', 'education', 'skills'
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
}

// Execute the re-enrichment
async function runReEnrichment() {
  const reEnrichment = new PersonReEnrichment();
  await reEnrichment.reEnrichPerson();
}

// Export for use
module.exports = { PersonReEnrichment, runReEnrichment };

// Run if called directly
if (require.main === module) {
  runReEnrichment().catch(console.error);
}
