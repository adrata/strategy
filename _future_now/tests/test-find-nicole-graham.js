#!/usr/bin/env node

/**
 * Test: Find Nicole Graham by LinkedIn URL
 * 
 * Tests find_person.js functionality by searching for Nicole Graham
 * using her LinkedIn URL: https://www.linkedin.com/in/nicolehubbardgraham
 */

require('dotenv').config({path: '../.env'});

class TestFindNicoleGraham {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.testResults = {
      success: false,
      creditsUsed: 0,
      executionTime: 0,
      data: null,
      errors: []
    };
  }

  async run() {
    const startTime = Date.now();
    console.log('👤 Testing: Find Nicole Graham by LinkedIn URL');
    console.log('=' .repeat(50));
    
    try {
      const linkedinUrl = 'https://www.linkedin.com/in/nicolehubbardgraham';
      console.log(`🔍 Searching for: ${linkedinUrl}`);

      // Step 1: Search for person by LinkedIn URL
      console.log('🔍 Step 1: Searching for person by LinkedIn URL...');
      
      const searchQuery = {
        "query": {
          "term": {
            "linkedin_url": linkedinUrl
          }
        }
      };

      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl?items_per_page=1', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      this.testResults.creditsUsed++;
      console.log('✅ Search completed');

      // Handle different response formats
      let personId;
      if (Array.isArray(searchData)) {
        personId = searchData[0];
      } else if (searchData.hits?.hits) {
        personId = searchData.hits.hits[0]._id || searchData.hits.hits[0]._source?.id;
      } else if (searchData.hits) {
        personId = searchData.hits[0];
      }

      if (!personId) {
        throw new Error('No person ID found in search results');
      }

      console.log(`📊 Found person ID: ${personId}`);

      // Step 2: Collect full person profile
      console.log('📋 Step 2: Collecting full person profile...');
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/collect/${personId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!collectResponse.ok) {
        throw new Error(`Collect failed: ${collectResponse.status} ${collectResponse.statusText}`);
      }

      const personData = await collectResponse.json();
      this.testResults.creditsUsed++;
      console.log('✅ Collection completed');

      // Step 3: Validate key data points
      console.log('🔍 Step 3: Validating person data...');
      
      const validations = {
        hasName: !!personData.full_name,
        nameContainsNicole: personData.full_name?.toLowerCase().includes('nicole'),
        nameContainsGraham: personData.full_name?.toLowerCase().includes('graham') || 
                           personData.full_name?.toLowerCase().includes('hubbard'),
        hasLinkedIn: !!personData.linkedin_url,
        linkedinMatches: personData.linkedin_url === linkedinUrl,
        hasEmail: !!(personData.primary_professional_email || personData.professional_emails_collection?.length > 0),
        hasNikeExperience: personData.experience?.some(exp => 
          exp.company_name?.toLowerCase().includes('nike') || 
          exp.company_linkedin_url?.includes('nike')
        )
      };

      console.log('📊 Validation Results:');
      Object.entries(validations).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
      });

      const criticalValidations = [
        validations.hasName,
        validations.nameContainsNicole,
        validations.hasLinkedIn,
        validations.linkedinMatches
      ];
      
      const allCritical = criticalValidations.every(v => v);
      
      if (!allCritical) {
        throw new Error('Critical person data validation failed');
      }

      // Step 4: Display key information
      console.log('\n👤 Nicole Graham Profile:');
      console.log(`  Name: ${personData.full_name}`);
      console.log(`  LinkedIn: ${personData.linkedin_url}`);
      console.log(`  Email: ${personData.primary_professional_email || 'Not available'}`);
      console.log(`  Current Title: ${personData.active_experience_title || 'Not available'}`);
      console.log(`  Current Company: ${personData.active_experience_company_name || 'Not available'}`);
      console.log(`  Department: ${personData.active_experience_department || 'Not available'}`);
      console.log(`  Management Level: ${personData.active_experience_management_level || 'Not available'}`);
      console.log(`  Connections: ${personData.connections_count?.toLocaleString() || 'N/A'}`);
      console.log(`  Followers: ${personData.followers_count?.toLocaleString() || 'N/A'}`);
      console.log(`  Headline: ${personData.headline || 'Not available'}`);

      // Show Nike experience if found
      const nikeExperience = personData.experience?.find(exp => 
        exp.company_name?.toLowerCase().includes('nike') || 
        exp.company_linkedin_url?.includes('nike')
      );

      if (nikeExperience) {
        console.log(`\n🏢 Nike Experience:`);
        console.log(`  Title: ${nikeExperience.position_title}`);
        console.log(`  Company: ${nikeExperience.company_name}`);
        console.log(`  Duration: ${nikeExperience.start_date} - ${nikeExperience.end_date || 'Present'}`);
        console.log(`  Active: ${nikeExperience.active_experience ? 'Yes' : 'No'}`);
      }

      this.testResults.success = true;
      this.testResults.data = {
        name: personData.full_name,
        linkedinUrl: personData.linkedin_url,
        email: personData.primary_professional_email,
        currentTitle: personData.active_experience_title,
        currentCompany: personData.active_experience_company_name,
        department: personData.active_experience_department,
        managementLevel: personData.active_experience_management_level,
        connections: personData.connections_count,
        followers: personData.followers_count,
        headline: personData.headline,
        nikeExperience: nikeExperience
      };

      console.log('\n✅ Test PASSED: Successfully found and validated Nicole Graham profile');
      
    } catch (error) {
      console.error('\n❌ Test FAILED:', error.message);
      this.testResults.errors.push(error.message);
    } finally {
      this.testResults.executionTime = Date.now() - startTime;
      console.log(`\n📊 Test Summary:`);
      console.log(`  Success: ${this.testResults.success ? '✅' : '❌'}`);
      console.log(`  Credits Used: ${this.testResults.creditsUsed}`);
      console.log(`  Execution Time: ${this.testResults.executionTime}ms`);
      if (this.testResults.errors.length > 0) {
        console.log(`  Errors: ${this.testResults.errors.join(', ')}`);
      }
    }

    return this.testResults;
  }
}

// Run test if called directly
if (require.main === module) {
  const test = new TestFindNicoleGraham();
  test.run()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = TestFindNicoleGraham;
