const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CoreSignal API configuration
const CORESIGNAL_API_KEY = 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2/employee_multi_source';

// Headers for CoreSignal API
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': CORESIGNAL_API_KEY
});

// Search by LinkedIn URL
async function searchByLinkedIn(linkedinUrl) {
  const url = `${CORESIGNAL_BASE_URL}/search/es_dsl`;
  const data = {
    "query": {
      "bool": {
        "must": [
          {
            "match_phrase": {
              "linkedin_url": linkedinUrl
            }
          }
        ]
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching by LinkedIn:', error);
    throw error;
  }
}

// Search by email
async function searchByEmail(email) {
  const url = `${CORESIGNAL_BASE_URL}/search/es_dsl`;
  const data = {
    "query": {
      "bool": {
        "should": [
          {
            "term": {
              "primary_professional_email.exact": email
            }
          },
          {
            "nested": {
              "path": "professional_emails_collection",
              "query": {
                "term": {
                  "professional_emails_collection.professional_email.exact": email
                }
              }
            }
          }
        ]
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching by email:', error);
    throw error;
  }
}

// Collect full employee data
async function collectEmployeeData(employeeId) {
  const url = `${CORESIGNAL_BASE_URL}/collect/${employeeId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error collecting employee data:', error);
    throw error;
  }
}

// Store comprehensive CoreSignal data
async function storeComprehensiveCoreSignalData(personId, coresignalData) {
  try {
    console.log(`📊 Storing comprehensive CoreSignal data for person ${personId}`);
    
    // Extract all the rich data from CoreSignal response
    const enrichedData = {
      // Basic profile data
      id: coresignalData.id,
      parent_id: coresignalData.parent_id,
      created_at: coresignalData.created_at,
      updated_at: coresignalData.updated_at,
      checked_at: coresignalData.checked_at,
      changed_at: coresignalData.changed_at,
      experience_change_last_identified_at: coresignalData.experience_change_last_identified_at,
      is_deleted: coresignalData.is_deleted,
      is_parent: coresignalData.is_parent,
      public_profile_id: coresignalData.public_profile_id,
      linkedin_url: coresignalData.linkedin_url,
      linkedin_shorthand_names: coresignalData.linkedin_shorthand_names,
      historical_ids: coresignalData.historical_ids,
      
      // Personal information
      full_name: coresignalData.full_name,
      first_name: coresignalData.first_name,
      first_name_initial: coresignalData.first_name_initial,
      middle_name: coresignalData.middle_name,
      middle_name_initial: coresignalData.middle_name_initial,
      last_name: coresignalData.last_name,
      last_name_initial: coresignalData.last_name_initial,
      headline: coresignalData.headline,
      summary: coresignalData.summary,
      picture_url: coresignalData.picture_url,
      
      // Location data
      location_country: coresignalData.location_country,
      location_country_iso2: coresignalData.location_country_iso2,
      location_country_iso3: coresignalData.location_country_iso3,
      location_full: coresignalData.location_full,
      location_regions: coresignalData.location_regions,
      
      // Skills and interests
      interests: coresignalData.interests,
      inferred_skills: coresignalData.inferred_skills,
      historical_skills: coresignalData.historical_skills,
      
      // Network data
      connections_count: coresignalData.connections_count,
      followers_count: coresignalData.followers_count,
      services: coresignalData.services,
      
      // Professional emails
      primary_professional_email: coresignalData.primary_professional_email,
      primary_professional_email_status: coresignalData.primary_professional_email_status,
      professional_emails_collection: coresignalData.professional_emails_collection,
      
      // Work status
      is_working: coresignalData.is_working,
      active_experience_company_id: coresignalData.active_experience_company_id,
      active_experience_title: coresignalData.active_experience_title,
      active_experience_description: coresignalData.active_experience_description,
      active_experience_department: coresignalData.active_experience_department,
      active_experience_management_level: coresignalData.active_experience_management_level,
      is_decision_maker: coresignalData.is_decision_maker,
      
      // Experience data
      total_experience_duration_months: coresignalData.total_experience_duration_months,
      total_experience_duration_months_breakdown_department: coresignalData.total_experience_duration_months_breakdown_department,
      total_experience_duration_months_breakdown_management_level: coresignalData.total_experience_duration_months_breakdown_management_level,
      experience: coresignalData.experience,
      
      // Salary data
      projected_base_salary_p25: coresignalData.projected_base_salary_p25,
      projected_base_salary_median: coresignalData.projected_base_salary_median,
      projected_base_salary_p75: coresignalData.projected_base_salary_p75,
      projected_base_salary_period: coresignalData.projected_base_salary_period,
      projected_base_salary_currency: coresignalData.projected_base_salary_currency,
      projected_base_salary_updated_at: coresignalData.projected_base_salary_updated_at,
      projected_additional_salary: coresignalData.projected_additional_salary,
      projected_additional_salary_period: coresignalData.projected_additional_salary_period,
      projected_additional_salary_currency: coresignalData.projected_additional_salary_currency,
      projected_additional_salary_updated_at: coresignalData.projected_additional_salary_updated_at,
      projected_total_salary_p25: coresignalData.projected_total_salary_p25,
      projected_total_salary_median: coresignalData.projected_total_salary_median,
      projected_total_salary_p75: coresignalData.projected_total_salary_p75,
      projected_total_salary_period: coresignalData.projected_total_salary_period,
      projected_total_salary_currency: coresignalData.projected_total_salary_currency,
      projected_total_salary_updated_at: coresignalData.projected_total_salary_updated_at,
      
      // Education data
      last_graduation_date: coresignalData.last_graduation_date,
      education_degrees: coresignalData.education_degrees,
      education: coresignalData.education,
      
      // Social data
      recommendations_count: coresignalData.recommendations_count,
      recommendations: coresignalData.recommendations,
      activity: coresignalData.activity,
      
      // Professional development
      awards: coresignalData.awards,
      courses: coresignalData.courses,
      certifications: coresignalData.certifications,
      languages: coresignalData.languages,
      
      // Technical data
      patents_count: coresignalData.patents_count,
      patents_topics: coresignalData.patents_topics,
      patents: coresignalData.patents,
      publications_count: coresignalData.publications_count,
      publications_topics: coresignalData.publications_topics,
      publications: coresignalData.publications,
      projects_count: coresignalData.projects_count,
      projects_topics: coresignalData.projects_topics,
      projects: coresignalData.projects,
      organizations: coresignalData.organizations,
      
      // GitHub data
      github_url: coresignalData.github_url,
      github_username: coresignalData.github_username,
      github_mapping_confidence: coresignalData.github_mapping_confidence,
      github_contributions_count: coresignalData.github_contributions_count,
      github_repos_summary: coresignalData.github_repos_summary,
      
      // Change tracking
      profile_root_field_changes_summary: coresignalData.profile_root_field_changes_summary,
      profile_collection_field_changes_summary: coresignalData.profile_collection_field_changes_summary,
      experience_recently_started: coresignalData.experience_recently_started,
      experience_recently_closed: coresignalData.experience_recently_closed,
      
      // Metadata
      enriched_at: new Date().toISOString(),
      enrichment_source: 'coresignal_comprehensive'
    };

    // Update the person record with comprehensive CoreSignal data
    await prisma.people.update({
      where: { id: personId },
      data: {
        customFields: {
          ...enrichedData,
          // Keep existing custom fields and merge
          coresignal: enrichedData
        },
        enrichmentSources: {
          push: 'coresignal_comprehensive'
        },
        lastEnriched: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Successfully stored comprehensive CoreSignal data for person ${personId}`);
    return true;

  } catch (error) {
    console.error(`❌ Error storing CoreSignal data for person ${personId}:`, error);
    throw error;
  }
}

// Main enrichment function
async function enrichPersonComprehensively(person) {
  try {
    console.log(`🔍 Enriching ${person.fullName} (${person.email})`);
    
    let coresignalData = null;
    let enrichmentMethod = '';

    // Try LinkedIn URL first if available
    if (person.linkedinUrl) {
      try {
        console.log(`📎 Searching by LinkedIn: ${person.linkedinUrl}`);
        const searchResult = await searchByLinkedIn(person.linkedinUrl);
        
        if (searchResult.hits && searchResult.hits.total > 0) {
          const employeeId = searchResult.hits.hits[0]._source.id;
          console.log(`✅ Found by LinkedIn, employee ID: ${employeeId}`);
          
          coresignalData = await collectEmployeeData(employeeId);
          enrichmentMethod = 'linkedin';
        }
      } catch (error) {
        console.log(`⚠️ LinkedIn search failed: ${error.message}`);
      }
    }

    // Try email if LinkedIn didn't work
    if (!coresignalData && person.email) {
      try {
        console.log(`📧 Searching by email: ${person.email}`);
        const searchResult = await searchByEmail(person.email);
        
        if (searchResult.hits && searchResult.hits.total > 0) {
          const employeeId = searchResult.hits.hits[0]._source.id;
          console.log(`✅ Found by email, employee ID: ${employeeId}`);
          
          coresignalData = await collectEmployeeData(employeeId);
          enrichmentMethod = 'email';
        }
      } catch (error) {
        console.log(`⚠️ Email search failed: ${error.message}`);
      }
    }

    if (coresignalData) {
      console.log(`📊 Storing comprehensive data (method: ${enrichmentMethod})`);
      await storeComprehensiveCoreSignalData(person.id, coresignalData);
      return { success: true, method: enrichmentMethod, data: coresignalData };
    } else {
      console.log(`❌ No CoreSignal data found for ${person.fullName}`);
      return { success: false, method: 'none', data: null };
    }

  } catch (error) {
    console.error(`❌ Error enriching ${person.fullName}:`, error);
    return { success: false, method: 'error', data: null, error: error.message };
  }
}

// Main execution function
async function runComprehensiveEnrichment() {
  try {
    console.log('🚀 Starting Comprehensive CoreSignal Enrichment');
    console.log('================================================');
    
    // Get TOP workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: 'TOP' } },
      select: { id: true, name: true }
    });
    
    if (!workspace) {
      console.log('❌ No TOP workspace found');
      return;
    }
    
    console.log(`📊 Workspace: ${workspace.name}`);
    
    // Get people to enrich (limit for testing)
    const people = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { email: { not: null } },
          { linkedinUrl: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        linkedinUrl: true
      },
      take: 5 // Start with 5 people for testing
    });
    
    console.log(`📋 Found ${people.length} people to enrich`);
    console.log('');
    
    const results = {
      total: people.length,
      successful: 0,
      failed: 0,
      byMethod: {
        linkedin: 0,
        email: 0,
        none: 0,
        error: 0
      }
    };
    
    // Enrich each person
    for (const person of people) {
      console.log(`\n🔄 Processing: ${person.fullName}`);
      console.log('─'.repeat(50));
      
      const result = await enrichPersonComprehensively(person);
      
      if (result.success) {
        results.successful++;
        results.byMethod[result.method]++;
        console.log(`✅ Success: ${person.fullName} (${result.method})`);
      } else {
        results.failed++;
        results.byMethod[result.method]++;
        console.log(`❌ Failed: ${person.fullName} (${result.method})`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 ENRICHMENT RESULTS');
    console.log('=====================');
    console.log(`Total processed: ${results.total}`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success rate: ${Math.round((results.successful / results.total) * 100)}%`);
    console.log('');
    console.log('By method:');
    console.log(`  LinkedIn: ${results.byMethod.linkedin}`);
    console.log(`  Email: ${results.byMethod.email}`);
    console.log(`  None found: ${results.byMethod.none}`);
    console.log(`  Errors: ${results.byMethod.error}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
runComprehensiveEnrichment();
