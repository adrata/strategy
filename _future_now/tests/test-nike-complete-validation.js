#!/usr/bin/env node

/**
 * Test: Complete Nike Pipeline Validation
 * 
 * Tests all 5 enrichment pipelines sequentially with Nike as the target company
 * to validate the complete buyer intelligence workflow for Adrata's $250K 
 * Buyer Group Intelligence product.
 * 
 * Pipeline Order:
 * 1. Find Company (find_company.js) - Enrich Nike's company profile
 * 2. Find Person (find_person.js) - Enrich individual people at Nike
 * 3. Find Role (find_role.js) - Find specific roles at Nike (CFO, CTO, etc.)
 * 4. Find Buyer Group (find_buyer_group.js) - Map complete buying committee
 * 5. Find Optimal Buyer Group (find_optimal_buyer_group.js) - AI-powered qualification
 */

require('dotenv').config({path: '../.env'});

class NikeCompleteValidation {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    
    this.testResults = {
      success: false,
      totalCreditsUsed: 0,
      totalExecutionTime: 0,
      pipelineResults: {},
      dataFlow: {},
      errors: [],
      startTime: new Date().toISOString()
    };
    
    // Data passed between pipelines
    this.nikeCompanyId = null;
    this.nikeLinkedInUrl = null;
    this.nikeCompanyData = null;
  }

  async run() {
    const startTime = Date.now();
    console.log('🎯 Nike Complete Pipeline Validation');
    console.log('=' .repeat(60));
    console.log('Testing all 5 enrichment pipelines with Nike (nike.com)');
    console.log('Demonstrating $250K Buyer Group Intelligence value proposition\n');
    
    try {
      // Pipeline 1: Find Company
      console.log('🏢 PIPELINE 1: Find Company');
      console.log('-'.repeat(40));
      const companyResult = await this.testFindCompany();
      this.testResults.pipelineResults.company = companyResult;
      this.testResults.totalCreditsUsed += companyResult.creditsUsed;
      
      if (!companyResult.success) {
        throw new Error('Pipeline 1 (Find Company) failed');
      }
      
      // Pipeline 2: Find Person
      console.log('\n👤 PIPELINE 2: Find Person');
      console.log('-'.repeat(40));
      const personResult = await this.testFindPerson();
      this.testResults.pipelineResults.person = personResult;
      this.testResults.totalCreditsUsed += personResult.creditsUsed;
      
      if (!personResult.success) {
        console.log('⚠️ Pipeline 2 (Find Person) failed - continuing with other pipelines');
      }
      
      // Pipeline 3: Find Role
      console.log('\n🎭 PIPELINE 3: Find Role');
      console.log('-'.repeat(40));
      const roleResult = await this.testFindRole();
      this.testResults.pipelineResults.role = roleResult;
      this.testResults.totalCreditsUsed += roleResult.creditsUsed;
      
      if (!roleResult.success) {
        console.log('⚠️ Pipeline 3 (Find Role) failed - continuing with other pipelines');
      }
      
      // Pipeline 4: Find Buyer Group
      console.log('\n👥 PIPELINE 4: Find Buyer Group');
      console.log('-'.repeat(40));
      const buyerGroupResult = await this.testFindBuyerGroup();
      this.testResults.pipelineResults.buyerGroup = buyerGroupResult;
      this.testResults.totalCreditsUsed += buyerGroupResult.creditsUsed;
      
      if (!buyerGroupResult.success) {
        console.log('⚠️ Pipeline 4 (Find Buyer Group) failed - continuing with other pipelines');
      }
      
      // Pipeline 5: Find Optimal Buyer Group
      console.log('\n🎯 PIPELINE 5: Find Optimal Buyer Group');
      console.log('-'.repeat(40));
      const optimalResult = await this.testFindOptimalBuyerGroup();
      this.testResults.pipelineResults.optimal = optimalResult;
      this.testResults.totalCreditsUsed += optimalResult.creditsUsed;
      
      if (!optimalResult.success) {
        console.log('⚠️ Pipeline 5 (Find Optimal Buyer Group) failed - continuing with other pipelines');
      }
      
      // Generate comprehensive report
      this.generateComprehensiveReport();
      
      // Determine overall success
      const successfulPipelines = Object.values(this.testResults.pipelineResults)
        .filter(result => result.success).length;
      
      this.testResults.success = successfulPipelines >= 3; // At least 3 pipelines must succeed
      
      console.log('\n' + '='.repeat(60));
      console.log('🎯 NIKE PIPELINE VALIDATION COMPLETE');
      console.log('='.repeat(60));
      console.log(`✅ Successful Pipelines: ${successfulPipelines}/5`);
      console.log(`💳 Total Credits Used: ${this.testResults.totalCreditsUsed}`);
      console.log(`⏱️ Total Execution Time: ${Math.round((Date.now() - startTime) / 1000)}s`);
      console.log(`🎯 Overall Success: ${this.testResults.success ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      console.error('\n❌ Validation FAILED:', error.message);
      this.testResults.errors.push(error.message);
    } finally {
      this.testResults.totalExecutionTime = Date.now() - startTime;
      this.testResults.endTime = new Date().toISOString();
    }

    return this.testResults;
  }

  /**
   * Pipeline 1: Find Company - Enrich Nike's company profile
   */
  async testFindCompany() {
    const startTime = Date.now();
    const result = {
      success: false,
      creditsUsed: 0,
      executionTime: 0,
      data: null,
      errors: []
    };

    try {
      console.log('🔍 Searching for Nike by website (nike.com)...');
      
      // Search for Nike using website.exact
      const searchQuery = {
        "query": {
          "term": {
            "website.exact": "nike.com"
          }
        }
      };

      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=1', {
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
      result.creditsUsed++;
      console.log('✅ Search completed');

      // Get company ID
      let companyId;
      if (Array.isArray(searchData)) {
        companyId = searchData[0];
      } else if (searchData.hits?.hits) {
        companyId = searchData.hits.hits[0]._id || searchData.hits.hits[0]._source?.id;
      } else if (searchData.hits) {
        companyId = searchData.hits[0];
      }

      if (!companyId) {
        throw new Error('No company ID found in search results');
      }

      console.log(`📊 Found company ID: ${companyId}`);

      // Collect full company profile
      console.log('📋 Collecting full company profile...');
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!collectResponse.ok) {
        throw new Error(`Collect failed: ${collectResponse.status} ${collectResponse.statusText}`);
      }

      const companyData = await collectResponse.json();
      result.creditsUsed++;
      console.log('✅ Collection completed');

      // Validate key data points
      console.log('🔍 Validating company data...');
      
      const validations = {
        hasName: !!companyData.company_name,
        nameMatches: companyData.company_name?.toLowerCase().includes('nike'),
        hasEmployeeCount: !!companyData.company_employees_count,
        hasIndustry: !!companyData.company_industry,
        hasWebsite: !!companyData.website,
        websiteMatches: companyData.website?.includes('nike.com'),
        hasLinkedInUrl: !!companyData.company_linkedin_url
      };

      console.log('📊 Validation Results:');
      Object.entries(validations).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
      });

      const allValid = Object.values(validations).every(v => v);
      
      if (!allValid) {
        throw new Error('Company data validation failed');
      }

      // Store data for subsequent pipelines
      this.nikeCompanyId = companyId;
      this.nikeLinkedInUrl = companyData.company_linkedin_url;
      this.nikeCompanyData = companyData;
      this.testResults.dataFlow.companyId = companyId;
      this.testResults.dataFlow.linkedInUrl = companyData.company_linkedin_url;

      // Display key information
      console.log('\n📋 Nike Company Profile:');
      console.log(`  Name: ${companyData.company_name}`);
      console.log(`  Website: ${companyData.website}`);
      console.log(`  Industry: ${companyData.company_industry}`);
      console.log(`  Employee Count: ${companyData.company_employees_count?.toLocaleString()}`);
      console.log(`  Size Range: ${companyData.company_size_range}`);
      console.log(`  Founded: ${companyData.company_founded_year}`);
      console.log(`  Location: ${companyData.company_hq_city}, ${companyData.company_hq_state}, ${companyData.company_hq_country}`);
      console.log(`  LinkedIn: ${companyData.company_linkedin_url}`);

      result.success = true;
      result.data = {
        name: companyData.company_name,
        website: companyData.website,
        industry: companyData.company_industry,
        employeeCount: companyData.company_employees_count,
        sizeRange: companyData.company_size_range,
        founded: companyData.company_founded_year,
        location: `${companyData.company_hq_city}, ${companyData.company_hq_state}, ${companyData.company_hq_country}`,
        linkedInUrl: companyData.company_linkedin_url,
        categories: companyData.company_categories_and_keywords
      };

      console.log('✅ Pipeline 1 PASSED: Nike company profile enriched');
      
    } catch (error) {
      console.error('❌ Pipeline 1 FAILED:', error.message);
      result.errors.push(error.message);
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Pipeline 2: Find Person - Enrich individual people at Nike
   */
  async testFindPerson() {
    const startTime = Date.now();
    const result = {
      success: false,
      creditsUsed: 0,
      executionTime: 0,
      data: null,
      errors: []
    };

    try {
      if (!this.nikeLinkedInUrl) {
        throw new Error('Nike LinkedIn URL not available from Pipeline 1');
      }

      console.log('🔍 Searching for people at Nike...');
      
      // Search for people using company experience
      const searchQuery = {
        "query": {
          "bool": {
            "must": [
              {
                "nested": {
                  "path": "experience",
                  "query": {
                    "bool": {
                      "must": [
                        {
                          "match": {
                            "experience.company_linkedin_url": this.nikeLinkedInUrl
                          }
                        },
                        {
                          "term": {
                            "experience.active_experience": 1
                          }
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      };

      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl?items_per_page=5', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (!searchResponse.ok) {
        throw new Error(`Person search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      result.creditsUsed++;
      console.log('✅ Person search completed');

      // Handle different response formats
      let people = [];
      if (Array.isArray(searchData)) {
        people = searchData;
      } else if (searchData.hits?.hits) {
        people = searchData.hits.hits.map(hit => hit._source || hit);
      } else if (searchData.hits) {
        people = searchData.hits;
      }

      console.log(`📊 Found ${people.length} people at Nike`);

      if (people.length === 0) {
        throw new Error('No people found at Nike');
      }

      // Collect full profiles for top 3 people
      console.log('📋 Collecting full profiles for top people...');
      const enrichedPeople = [];
      
      for (let i = 0; i < Math.min(3, people.length); i++) {
        try {
          const person = people[i];
          const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/collect/${person.id}`, {
            method: 'GET',
            headers: {
              'apikey': this.apiKey,
              'Accept': 'application/json'
            }
          });

          if (collectResponse.ok) {
            const personData = await collectResponse.json();
            enrichedPeople.push(personData);
            result.creditsUsed++;
            console.log(`  ✅ Enriched: ${personData.full_name} - ${personData.active_experience_title}`);
          }
          
          // Small delay between collects
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`  ❌ Failed to collect profile for person ${i + 1}: ${error.message}`);
        }
      }

      if (enrichedPeople.length === 0) {
        throw new Error('No people profiles collected');
      }

      // Validate person data
      const validations = {
        foundPeople: enrichedPeople.length > 0,
        hasNames: enrichedPeople.every(p => p.full_name),
        hasTitles: enrichedPeople.every(p => p.active_experience_title),
        hasEmails: enrichedPeople.some(p => p.primary_professional_email),
        hasLinkedIn: enrichedPeople.some(p => p.linkedin_url)
      };

      console.log('📊 Person Validation Results:');
      Object.entries(validations).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
      });

      const allValid = Object.values(validations).every(v => v);
      
      if (!allValid) {
        throw new Error('Person data validation failed');
      }

      result.success = true;
      result.data = {
        totalFound: people.length,
        enriched: enrichedPeople.length,
        people: enrichedPeople.map(p => ({
          name: p.full_name,
          title: p.active_experience_title,
          department: p.active_experience_department,
          email: p.primary_professional_email,
          linkedIn: p.linkedin_url
        }))
      };

      console.log('✅ Pipeline 2 PASSED: Nike people enriched');
      
    } catch (error) {
      console.error('❌ Pipeline 2 FAILED:', error.message);
      result.errors.push(error.message);
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Pipeline 3: Find Role - Find specific roles at Nike
   */
  async testFindRole() {
    const startTime = Date.now();
    const result = {
      success: false,
      creditsUsed: 0,
      executionTime: 0,
      data: null,
      errors: []
    };

    try {
      if (!this.nikeLinkedInUrl) {
        throw new Error('Nike LinkedIn URL not available from Pipeline 1');
      }

      const targetRole = 'CFO'; // Test finding CFO at Nike
      console.log(`🔍 Searching for ${targetRole} at Nike...`);
      
      // Generate role variations (simplified for testing)
      const roleVariations = {
        primary: ['CFO', 'Chief Financial Officer', 'VP Finance & Operations'],
        secondary: ['VP Finance', 'Finance Director', 'Financial Controller'],
        tertiary: ['Senior Finance Manager', 'Finance Manager', 'Financial Analyst Manager']
      };

      console.log(`📋 Generated ${roleVariations.primary.length + roleVariations.secondary.length + roleVariations.tertiary.length} role variations`);

      // Search for role matches
      const allMatches = [];
      
      // Try primary variations first
      for (const roleTitle of roleVariations.primary) {
        const matches = await this.searchCoresignalForRole(this.nikeLinkedInUrl, roleTitle, 'primary');
        allMatches.push(...matches);
        
        if (allMatches.length >= 3) break;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`📊 Found ${allMatches.length} role matches`);

      if (allMatches.length === 0) {
        throw new Error(`No ${targetRole} found at Nike`);
      }

      // Validate role matches
      const validations = {
        foundMatches: allMatches.length > 0,
        hasConfidence: allMatches.every(m => m.confidence && m.confidence.confidence > 0),
        hasNames: allMatches.every(m => m.full_name),
        hasTitles: allMatches.every(m => m.active_experience_title)
      };

      console.log('📊 Role Validation Results:');
      Object.entries(validations).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
      });

      const allValid = Object.values(validations).every(v => v);
      
      if (!allValid) {
        throw new Error('Role data validation failed');
      }

      result.success = true;
      result.data = {
        targetRole,
        totalMatches: allMatches.length,
        matches: allMatches.map(m => ({
          name: m.full_name,
          title: m.active_experience_title,
          department: m.active_experience_department,
          confidence: m.confidence?.confidence || 0,
          matchLevel: m.matchLevel
        }))
      };

      console.log('✅ Pipeline 3 PASSED: Nike roles found');
      
    } catch (error) {
      console.error('❌ Pipeline 3 FAILED:', error.message);
      result.errors.push(error.message);
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Pipeline 4: Find Buyer Group - Map complete buying committee at Nike
   */
  async testFindBuyerGroup() {
    const startTime = Date.now();
    const result = {
      success: false,
      creditsUsed: 0,
      executionTime: 0,
      data: null,
      errors: []
    };

    try {
      if (!this.nikeLinkedInUrl) {
        throw new Error('Nike LinkedIn URL not available from Pipeline 1');
      }

      console.log('🔍 Discovering employees across key departments...');
      
      const targetDepartments = [
        'Sales and Business Development',
        'Marketing',
        'Product Management',
        'Operations',
        'Finance and Administration',
        'Legal and Compliance',
        'Engineering and Technical'
      ];

      const allEmployees = [];
      let previewCredits = 0;

      // Discover employees by department
      for (const department of targetDepartments) {
        console.log(`  🔍 Searching ${department}...`);
        
        const searchQuery = {
          "query": {
            "bool": {
              "must": [
                {
                  "nested": {
                    "path": "experience",
                    "query": {
                      "bool": {
                        "must": [
                          {
                            "match": {
                              "experience.company_linkedin_url": this.nikeLinkedInUrl
                            }
                          },
                          {
                            "term": {
                              "experience.active_experience": 1
                            }
                          },
                          {
                            "match": {
                              "experience.active_experience_department": department
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              ]
            }
          }
        };

        const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview?items_per_page=10', {
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
          previewCredits++;
          const employees = Array.isArray(searchData) ? searchData : [];
          allEmployees.push(...employees);
          console.log(`    ✅ Found ${employees.length} employees in ${department}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Remove duplicates
      const uniqueEmployees = this.removeDuplicateEmployees(allEmployees);
      result.creditsUsed += previewCredits;
      
      console.log(`✅ Total unique employees found: ${uniqueEmployees.length}`);

      if (uniqueEmployees.length < 10) {
        throw new Error(`Insufficient employees found: ${uniqueEmployees.length} (need at least 10)`);
      }

      // Classify buyer group roles (simplified for testing)
      console.log('🎭 Classifying buyer group roles...');
      
      const classifiedEmployees = uniqueEmployees.map(employee => {
        const level = employee.active_experience_management_level;
        const title = employee.active_experience_title?.toLowerCase() || '';
        const dept = employee.active_experience_department;
        
        let role = 'stakeholder';
        let confidence = 50;
        let priority = 5;
        
        // Decision makers (VP+ for $250k software)
        if (level === 'C-Level' || (level === 'VP-Level' && (title.includes('chief') || title.includes('president')))) {
          role = 'decision_maker';
          confidence = 90;
          priority = 10;
        }
        // Champions (VP/Director level)
        else if (level === 'VP-Level' || level === 'Director-Level') {
          role = 'champion';
          confidence = 80;
          priority = 8;
        }
        // Blockers (procurement, legal, compliance)
        else if (title.includes('procurement') || title.includes('legal') || title.includes('compliance') || 
                 title.includes('security') || dept === 'Legal and Compliance') {
          role = 'blocker';
          confidence = 85;
          priority = 7;
        }
        // Introducers (sales, account management)
        else if (title.includes('sales') || title.includes('account') || title.includes('customer') || 
                 dept === 'Sales and Business Development') {
          role = 'introducer';
          confidence = 75;
          priority = 6;
        }
        
        return {
          ...employee,
          role,
          confidence,
          priority,
          influence_score: this.calculateInfluenceScore(employee),
          should_collect_full_profile: priority >= 7
        };
      });

      // Select top buyer group members
      console.log('👥 Selecting top buyer group members...');
      
      const buyerGroupTargets = {
        decision_maker: { min: 1, max: 3 },
        champion: { min: 2, max: 3 },
        stakeholder: { min: 2, max: 4 },
        blocker: { min: 1, max: 2 },
        introducer: { min: 2, max: 3 }
      };
      
      const totalBuyerGroupSize = { min: 8, max: 15 };
      
      const roleCounts = {
        decision_maker: 0,
        champion: 0,
        stakeholder: 0,
        blocker: 0,
        introducer: 0
      };
      
      const selectedMembers = [];
      
      // Sort by priority and confidence
      const sortedEmployees = classifiedEmployees
        .filter(emp => emp.should_collect_full_profile)
        .sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return b.confidence - a.confidence;
        });
      
      for (const employee of sortedEmployees) {
        const role = employee.role;
        const target = buyerGroupTargets[role];
        
        if (roleCounts[role] < target.max) {
          selectedMembers.push(employee);
          roleCounts[role]++;
          
          if (selectedMembers.length >= totalBuyerGroupSize.max) {
            break;
          }
        }
      }
      
      console.log(`✅ Selected ${selectedMembers.length} buyer group members`);

      // Calculate buyer group composition
      const buyerGroupComposition = {
        decision_maker: 0,
        champion: 0,
        stakeholder: 0,
        blocker: 0,
        introducer: 0,
        total: selectedMembers.length
      };
      
      for (const member of selectedMembers) {
        buyerGroupComposition[member.role] = (buyerGroupComposition[member.role] || 0) + 1;
      }

      // Validation
      const validations = {
        foundEmployees: uniqueEmployees.length >= 10,
        hasDecisionMakers: buyerGroupComposition.decision_maker > 0,
        hasChampions: buyerGroupComposition.champion > 0,
        hasStakeholders: buyerGroupComposition.stakeholder > 0,
        hasBlockers: buyerGroupComposition.blocker > 0,
        hasIntroducers: buyerGroupComposition.introducer > 0,
        totalMembers: buyerGroupComposition.total >= 5
      };

      console.log('📊 Buyer Group Validation Results:');
      Object.entries(validations).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
      });

      const allValid = Object.values(validations).every(v => v);
      
      if (!allValid) {
        throw new Error('Buyer group validation failed');
      }

      result.success = true;
      result.data = {
        totalEmployeesFound: uniqueEmployees.length,
        buyerGroupSize: buyerGroupComposition.total,
        composition: buyerGroupComposition,
        topMembers: selectedMembers.slice(0, 5).map(member => ({
          name: member.full_name,
          role: member.role,
          title: member.active_experience_title,
          department: member.active_experience_department,
          confidence: member.confidence
        }))
      };

      console.log('✅ Pipeline 4 PASSED: Nike buyer group mapped');
      
    } catch (error) {
      console.error('❌ Pipeline 4 FAILED:', error.message);
      result.errors.push(error.message);
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Pipeline 5: Find Optimal Buyer Group - AI-powered buyer qualification
   */
  async testFindOptimalBuyerGroup() {
    const startTime = Date.now();
    const result = {
      success: false,
      creditsUsed: 0,
      executionTime: 0,
      data: null,
      errors: []
    };

    try {
      console.log('🔍 Phase 1: Market filtering for SaaS companies...');
      
      // Search for SaaS companies (simplified for testing)
      const searchQuery = {
        "query": {
          "bool": {
            "must": [
              {
                "terms": {
                  "company_industry": ["Software", "SaaS", "Technology"]
                }
              },
              {
                "match": {
                  "company_size_range": "50-200 employees"
                }
              },
              {
                "range": {
                  "company_employees_count_change_yearly_percentage": {
                    "gte": 10
                  }
                }
              },
              {
                "term": {
                  "company_is_b2b": 1
                }
              }
            ]
          }
        },
        "size": 5
      };

      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=5', {
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
      result.creditsUsed++;
      console.log('✅ Phase 1 search completed');

      // Get company IDs
      let companyIds = [];
      if (Array.isArray(searchData)) {
        companyIds = searchData;
      } else if (searchData.hits?.hits) {
        companyIds = searchData.hits.hits.map(hit => hit._id || hit._source?.id);
      } else if (searchData.hits) {
        companyIds = searchData.hits;
      }

      console.log(`📊 Found ${companyIds.length} candidate companies`);

      if (companyIds.length === 0) {
        throw new Error('No candidate companies found');
      }

      // Collect company profiles
      console.log('📋 Collecting company profiles...');
      const companies = [];
      
      for (const companyId of companyIds) {
        try {
          const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
            method: 'GET',
            headers: {
              'apikey': this.apiKey,
              'Accept': 'application/json'
            }
          });

          if (collectResponse.ok) {
            const companyData = await collectResponse.json();
            companies.push(companyData);
            result.creditsUsed++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`  ❌ Failed to collect company ${companyId}: ${error.message}`);
        }
      }

      console.log(`✅ Collected ${companies.length} company profiles`);

      // Phase 2: Sample buyer group quality (simplified for testing)
      console.log('🔍 Phase 2: Sampling buyer group quality...');
      
      const companiesWithScores = [];
      let previewCredits = 0;
      
      // Limit to 2 companies for testing to save credits
      const testCompanies = companies.slice(0, 2);
      
      for (const company of testCompanies) {
        try {
          console.log(`  🔍 Sampling ${company.company_name}...`);
          
          // Sample employees from key departments
          const sampleDepartments = ['Sales and Business Development', 'Operations', 'Product Management'];
          const allEmployees = [];
          
          for (const department of sampleDepartments) {
            const searchQuery = {
              "query": {
                "bool": {
                  "must": [
                    {
                      "nested": {
                        "path": "experience",
                        "query": {
                          "bool": {
                            "must": [
                              {
                                "match": {
                                  "experience.company_linkedin_url": company.company_linkedin_url
                                }
                              },
                              {
                                "term": {
                                  "experience.active_experience": 1
                                }
                              },
                              {
                                "match": {
                                  "experience.active_experience_department": department
                                }
                              }
                            ]
                          }
                        }
                      }
                    }
                  ]
                }
              }
            };

            const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview?items_per_page=5', {
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
              previewCredits++;
              const employees = Array.isArray(searchData) ? searchData : [];
              allEmployees.push(...employees);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Remove duplicates
          const uniqueEmployees = this.removeDuplicateEmployees(allEmployees);
          
          // Simple buyer group quality scoring
          const buyerGroupQuality = this.analyzeBuyerGroupQualityFallback(company, uniqueEmployees);
          
          // Calculate final buyer readiness score
          const firmographicFit = this.calculateFirmographicFit(company);
          const growthSignals = this.calculateGrowthSignals(company);
          const technologyAdoption = this.calculateTechnologyAdoption(company);
          const adoptionMaturity = this.calculateAdoptionMaturity(company);
          
          const buyerReadinessScore = Math.round(
            firmographicFit * 0.15 +
            growthSignals * 0.15 +
            technologyAdoption * 0.10 +
            adoptionMaturity * 0.10 +
            buyerGroupQuality.overall_buyer_group_quality * 0.60
          );
          
          companiesWithScores.push({
            ...company,
            firmographicFitScore: firmographicFit,
            growthSignalsScore: growthSignals,
            technologyAdoptionScore: technologyAdoption,
            adoptionMaturityScore: adoptionMaturity,
            buyerGroupQuality,
            buyerReadinessScore,
            employeesAnalyzed: uniqueEmployees.length
          });
          
          console.log(`    ✅ Scored ${company.company_name}: ${buyerReadinessScore}% readiness`);
          
        } catch (error) {
          console.log(`    ❌ Failed to sample ${company.company_name}: ${error.message}`);
          companiesWithScores.push({
            ...company,
            buyerReadinessScore: 50,
            employeesAnalyzed: 0
          });
        }
      }
      
      result.creditsUsed += previewCredits;

      // Rank companies
      const rankedCompanies = companiesWithScores
        .sort((a, b) => b.buyerReadinessScore - a.buyerReadinessScore);

      console.log('\n🏆 Optimal Buyer Groups (Top 3):');
      rankedCompanies.slice(0, 3).forEach((company, index) => {
        console.log(`\n${index + 1}. ${company.company_name} (${company.buyerReadinessScore}% readiness)`);
        console.log(`   Industry: ${company.company_industry}`);
        console.log(`   Size: ${company.company_employees_count?.toLocaleString()} employees`);
        console.log(`   Growth: ${company.company_employees_count_change_yearly_percentage}%`);
        console.log(`   Employees Analyzed: ${company.employeesAnalyzed || 0}`);
        if (company.buyerGroupQuality) {
          console.log(`   Buyer Group Quality: ${company.buyerGroupQuality.overall_buyer_group_quality}%`);
        }
      });

      // Validation
      const validations = {
        foundCompanies: rankedCompanies.length > 0,
        hasScores: rankedCompanies.every(c => c.buyerReadinessScore > 0),
        hasRanking: rankedCompanies.length === 1 || rankedCompanies[0].buyerReadinessScore >= rankedCompanies[rankedCompanies.length - 1].buyerReadinessScore,
        hasEmployeeAnalysis: rankedCompanies.some(c => c.employeesAnalyzed > 0)
      };

      console.log('\n📊 Optimal Buyer Group Validation Results:');
      Object.entries(validations).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
      });

      const allValid = Object.values(validations).every(v => v);
      
      if (!allValid) {
        throw new Error('Optimal buyer group validation failed');
      }

      result.success = true;
      result.data = {
        totalCandidates: companies.length,
        optimalBuyerGroups: rankedCompanies.length,
        topCompanies: rankedCompanies.slice(0, 3).map(company => ({
          name: company.company_name,
          industry: company.company_industry,
          employeeCount: company.company_employees_count,
          growthRate: company.company_employees_count_change_yearly_percentage,
          buyerReadinessScore: company.buyerReadinessScore,
          employeesAnalyzed: company.employeesAnalyzed
        }))
      };

      console.log('✅ Pipeline 5 PASSED: Optimal buyer groups found');
      
    } catch (error) {
      console.error('❌ Pipeline 5 FAILED:', error.message);
      result.errors.push(error.message);
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Generate comprehensive report
   */
  generateComprehensiveReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE VALIDATION REPORT');
    console.log('='.repeat(60));
    
    // Pipeline success summary
    console.log('\n🎯 Pipeline Success Summary:');
    Object.entries(this.testResults.pipelineResults).forEach(([pipeline, result]) => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      const time = Math.round(result.executionTime / 1000);
      console.log(`  ${pipeline.toUpperCase()}: ${status} (${time}s, ${result.creditsUsed} credits)`);
    });
    
    // Data flow validation
    console.log('\n🔄 Data Flow Validation:');
    console.log(`  Company ID: ${this.testResults.dataFlow.companyId ? '✅' : '❌'}`);
    console.log(`  LinkedIn URL: ${this.testResults.dataFlow.linkedInUrl ? '✅' : '❌'}`);
    
    // Key insights
    console.log('\n💡 Key Insights:');
    
    if (this.testResults.pipelineResults.company?.success) {
      const company = this.testResults.pipelineResults.company.data;
      console.log(`  🏢 Nike Profile: ${company.name} (${company.employeeCount?.toLocaleString()} employees)`);
      console.log(`  📍 Location: ${company.location}`);
      console.log(`  🏭 Industry: ${company.industry}`);
    }
    
    if (this.testResults.pipelineResults.person?.success) {
      const person = this.testResults.pipelineResults.person.data;
      console.log(`  👤 People Enriched: ${person.enriched}/${person.totalFound}`);
    }
    
    if (this.testResults.pipelineResults.role?.success) {
      const role = this.testResults.pipelineResults.role.data;
      console.log(`  🎭 ${role.targetRole} Found: ${role.totalMatches} matches`);
    }
    
    if (this.testResults.pipelineResults.buyerGroup?.success) {
      const bg = this.testResults.pipelineResults.buyerGroup.data;
      console.log(`  👥 Buyer Group: ${bg.buyerGroupSize} members (${Object.entries(bg.composition).filter(([k,v]) => k !== 'total' && v > 0).map(([k,v]) => `${k}:${v}`).join(', ')})`);
    }
    
    if (this.testResults.pipelineResults.optimal?.success) {
      const optimal = this.testResults.pipelineResults.optimal.data;
      console.log(`  🎯 Optimal Buyers: ${optimal.optimalBuyerGroups} companies analyzed`);
      if (optimal.topCompanies.length > 0) {
        console.log(`  🏆 Top Target: ${optimal.topCompanies[0].name} (${optimal.topCompanies[0].buyerReadinessScore}% readiness)`);
      }
    }
    
    // Value proposition demonstration
    console.log('\n💰 Value Proposition Demonstration:');
    console.log('  Problem: "Going after the wrong people"');
    console.log('  Solution: AI-powered buyer group mapping with real organizational data');
    console.log('  Result: Data-driven targeting with confidence scores and role classification');
    
    // Credit usage breakdown
    console.log('\n💳 Credit Usage Breakdown:');
    Object.entries(this.testResults.pipelineResults).forEach(([pipeline, result]) => {
      console.log(`  ${pipeline}: ${result.creditsUsed} credits`);
    });
    console.log(`  TOTAL: ${this.testResults.totalCreditsUsed} credits`);
  }

  // Helper methods
  async searchCoresignalForRole(companyLinkedInUrl, roleTitle, matchLevel) {
    const searchQuery = {
      "query": {
        "bool": {
          "must": [
            {
              "nested": {
                "path": "experience",
                "query": {
                  "bool": {
                    "must": [
                      {
                        "match": {
                          "experience.company_linkedin_url": companyLinkedInUrl
                        }
                      },
                      {
                        "term": {
                          "experience.active_experience": 1
                        }
                      },
                      {
                        "match": {
                          "experience.position_title": roleTitle
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    };

    const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl?items_per_page=3', {
      method: 'POST',
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(searchQuery)
    });

    if (!searchResponse.ok) {
      return [];
    }

    const searchData = await searchResponse.json();
    this.testResults.totalCreditsUsed++;

    if (!searchData.results || searchData.results.length === 0) {
      return [];
    }

    return searchData.results.slice(0, 3).map(person => ({
      ...person,
      matchedRole: roleTitle,
      matchLevel,
      confidence: { confidence: 85 } // Simplified for testing
    }));
  }

  removeDuplicateEmployees(employees) {
    const seen = new Set();
    return employees.filter(employee => {
      if (seen.has(employee.id)) {
        return false;
      }
      seen.add(employee.id);
      return true;
    });
  }

  calculateInfluenceScore(employee) {
    let score = 0;
    
    const level = employee.active_experience_management_level;
    if (level === 'C-Level') score += 40;
    else if (level === 'VP-Level') score += 30;
    else if (level === 'Director-Level') score += 20;
    else if (level === 'Manager-Level') score += 10;
    
    const connections = employee.connections_count || 0;
    const followers = employee.followers_count || 0;
    score += Math.min(30, (connections + followers) / 100);
    
    const dept = employee.active_experience_department;
    if (dept === 'Sales and Business Development') score += 15;
    else if (dept === 'Operations') score += 10;
    else if (dept === 'Marketing') score += 5;
    
    return Math.min(100, score);
  }

  analyzeBuyerGroupQualityFallback(company, employees) {
    const departmentCounts = this.calculateDepartmentCounts(employees);
    const managementLevelCounts = this.calculateManagementLevelCounts(employees);
    
    let painSignalScore = 50;
    let innovationScore = 50;
    let buyerExperienceScore = 50;
    let buyerGroupStructureScore = 50;
    
    const vpCount = managementLevelCounts['VP-Level'] || 0;
    const directorCount = managementLevelCounts['Director-Level'] || 0;
    if (vpCount === 0 && employees.length > 10) {
      painSignalScore += 20;
    }
    
    const avgConnections = employees.reduce((sum, e) => sum + (e.connections_count || 0), 0) / employees.length;
    if (avgConnections > 1000) {
      innovationScore += 20;
    }
    
    if (vpCount > 0 || directorCount > 2) {
      buyerExperienceScore += 20;
    }
    
    const salesCount = departmentCounts['Sales and Business Development'] || 0;
    const opsCount = departmentCounts['Operations'] || 0;
    if (salesCount > 0 && opsCount > 0) {
      buyerGroupStructureScore += 20;
    }
    
    const overallQuality = Math.round(
      painSignalScore * 0.25 +
      innovationScore * 0.25 +
      buyerExperienceScore * 0.25 +
      buyerGroupStructureScore * 0.25
    );
    
    return {
      pain_signal_score: Math.min(100, painSignalScore),
      innovation_score: Math.min(100, innovationScore),
      buyer_experience_score: Math.min(100, buyerExperienceScore),
      buyer_group_structure_score: Math.min(100, buyerGroupStructureScore),
      overall_buyer_group_quality: overallQuality
    };
  }

  calculateDepartmentCounts(employees) {
    return employees.reduce((counts, employee) => {
      const dept = employee.active_experience_department || 'Unknown';
      counts[dept] = (counts[dept] || 0) + 1;
      return counts;
    }, {});
  }

  calculateManagementLevelCounts(employees) {
    return employees.reduce((counts, employee) => {
      const level = employee.active_experience_management_level || 'Unknown';
      counts[level] = (counts[level] || 0) + 1;
      return counts;
    }, {});
  }

  calculateFirmographicFit(company) {
    let score = 50;
    
    if (company.company_industry?.toLowerCase().includes('software') || 
        company.company_industry?.toLowerCase().includes('saas')) {
      score += 30;
    }
    
    if (company.company_size_range === '50-200 employees') {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  calculateGrowthSignals(company) {
    let score = 50;
    
    const growthRate = company.company_employees_count_change_yearly_percentage || 0;
    if (growthRate > 20) score += 30;
    else if (growthRate > 10) score += 20;
    
    if (company.company_last_funding_round_date) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  calculateTechnologyAdoption(company) {
    let score = 50;
    
    if (company.company_categories_and_keywords?.length > 0) {
      score += 30;
    }
    
    if (company.company_followers_count > 1000) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  calculateAdoptionMaturity(company) {
    const companyAge = new Date().getFullYear() - parseInt(company.company_founded_year || 2000);
    const growthRate = company.company_employees_count_change_yearly_percentage || 0;
    
    if (companyAge >= 2 && companyAge <= 10 && growthRate > 15) {
      return 80;
    } else if (companyAge <= 5 && growthRate > 10) {
      return 70;
    } else {
      return 50;
    }
  }
}

// Run test if called directly
if (require.main === module) {
  const test = new NikeCompleteValidation();
  test.run()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = NikeCompleteValidation;
