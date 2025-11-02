#!/usr/bin/env node

/**
 * Test: Find Buyer Group at Nike
 * 
 * Tests find_buyer_group.js functionality by mapping the complete buying committee
 * at Nike for selling $250k buyer group intelligence software.
 */

require('dotenv').config({path: '../.env'});

class TestBuyerGroupNike {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY;
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
    console.log('👥 Testing: Find Buyer Group at Nike');
    console.log('=' .repeat(50));
    
    try {
      // Step 1: Find Nike's LinkedIn URL
      console.log('🔍 Step 1: Finding Nike company LinkedIn URL...');
      const companySearchQuery = {
        "query": {
          "term": {
            "website.exact": "nike.com"
          }
        }
      };

      const companySearchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=1', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(companySearchQuery)
      });

      if (!companySearchResponse.ok) {
        throw new Error(`Company search failed: ${companySearchResponse.status} ${companySearchResponse.statusText}`);
      }

      const companySearchData = await companySearchResponse.json();
      this.testResults.creditsUsed++;
      console.log('✅ Company search completed');

      // Get company ID and collect profile
      let companyId;
      if (Array.isArray(companySearchData)) {
        companyId = companySearchData[0];
      } else if (companySearchData.hits?.hits) {
        companyId = companySearchData.hits.hits[0]._id || companySearchData.hits.hits[0]._source?.id;
      } else if (companySearchData.hits) {
        companyId = companySearchData.hits[0];
      }

      const companyCollectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      const companyData = await companyCollectResponse.json();
      this.testResults.creditsUsed++;
      
      const companyLinkedInUrl = companyData.company_linkedin_url;
      if (!companyLinkedInUrl) {
        throw new Error('Nike company LinkedIn URL not found');
      }

      console.log(`✅ Found Nike LinkedIn URL: ${companyLinkedInUrl}`);

      // Step 2: Discover employees using Preview API
      console.log('🔍 Step 2: Discovering employees using Preview API...');
      
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

      for (const department of targetDepartments) {
        console.log(`  🔍 Searching ${department}...`);
        
        let page = 1;
        let hasMore = true;
        let departmentEmployees = [];
        
        while (hasMore && page <= 5) { // Limit to 5 pages per department for testing
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

          const searchResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview?page=${page}&items_per_page=10`, {
            method: 'POST',
            headers: {
              'apikey': this.apiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(searchQuery)
          });

          if (!searchResponse.ok) {
            console.log(`    ❌ Page ${page} failed: ${searchResponse.status}`);
            hasMore = false;
            continue;
          }

          const searchData = await searchResponse.json();
          previewCredits++;

          const employees = Array.isArray(searchData) ? searchData : [];
          if (employees.length > 0) {
            departmentEmployees.push(...employees);
            page++;
          } else {
            hasMore = false;
          }

          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`    ✅ Found ${departmentEmployees.length} employees in ${department}`);
        allEmployees.push(...departmentEmployees);
      }

      // Remove duplicates
      const uniqueEmployees = this.removeDuplicateEmployees(allEmployees);
      this.testResults.creditsUsed += previewCredits;
      
      console.log(`✅ Total unique employees found: ${uniqueEmployees.length}`);

      if (uniqueEmployees.length < 10) {
        throw new Error(`Insufficient employees found: ${uniqueEmployees.length} (need at least 10)`);
      }

      // Step 3: Classify buyer group roles (simplified for testing)
      console.log('🎭 Step 3: Classifying buyer group roles...');
      
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

      // Step 4: Select top buyer group members
      console.log('👥 Step 4: Selecting top buyer group members...');
      
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

      // Step 5: Collect full profiles for buyer group (limited for testing)
      console.log('📋 Step 5: Collecting full profiles for buyer group...');
      
      const buyerGroupWithProfiles = [];
      let collectCredits = 0;
      
      // Limit to top 5 for testing to save credits
      const topMembers = selectedMembers.slice(0, 5);
      
      for (const member of topMembers) {
        try {
          const fullProfile = await this.collectFullProfile(member.id);
          buyerGroupWithProfiles.push({
            ...member,
            fullProfile
          });
          collectCredits++;
        } catch (error) {
          console.log(`    ❌ Failed to collect profile for ${member.full_name}: ${error.message}`);
          buyerGroupWithProfiles.push(member); // Add without full profile
        }
        
        // Small delay between collects
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      this.testResults.creditsUsed += collectCredits;

      // Step 6: Calculate buyer group composition
      const buyerGroupComposition = {
        decision_maker: 0,
        champion: 0,
        stakeholder: 0,
        blocker: 0,
        introducer: 0,
        total: buyerGroupWithProfiles.length
      };
      
      for (const member of buyerGroupWithProfiles) {
        buyerGroupComposition[member.role] = (buyerGroupComposition[member.role] || 0) + 1;
      }

      // Step 7: Display results
      console.log('\n👥 Nike Buyer Group Composition:');
      Object.entries(buyerGroupComposition).forEach(([role, count]) => {
        if (role !== 'total') {
          console.log(`  ${role}: ${count}`);
        }
      });
      
      console.log(`\n🏆 Top Buyer Group Members:`);
      buyerGroupWithProfiles.slice(0, 5).forEach((member, index) => {
        console.log(`  ${index + 1}. ${member.full_name} (${member.role}) - ${member.confidence}% confidence`);
        console.log(`     Title: ${member.active_experience_title}`);
        console.log(`     Department: ${member.active_experience_department}`);
        console.log(`     Management Level: ${member.active_experience_management_level}`);
      });

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

      console.log('\n📊 Validation Results:');
      Object.entries(validations).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
      });

      const allValid = Object.values(validations).every(v => v);
      
      if (!allValid) {
        throw new Error('Buyer group validation failed');
      }

      this.testResults.success = true;
      this.testResults.data = {
        totalEmployeesFound: uniqueEmployees.length,
        buyerGroupSize: buyerGroupComposition.total,
        composition: buyerGroupComposition,
        topMembers: buyerGroupWithProfiles.slice(0, 5).map(member => ({
          name: member.full_name,
          role: member.role,
          title: member.active_experience_title,
          department: member.active_experience_department,
          confidence: member.confidence
        }))
      };

      console.log('\n✅ Test PASSED: Successfully mapped Nike buyer group');
      
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
    
    // Management level scoring
    const level = employee.active_experience_management_level;
    if (level === 'C-Level') score += 40;
    else if (level === 'VP-Level') score += 30;
    else if (level === 'Director-Level') score += 20;
    else if (level === 'Manager-Level') score += 10;
    
    // LinkedIn engagement
    const connections = employee.connections_count || 0;
    const followers = employee.followers_count || 0;
    score += Math.min(30, (connections + followers) / 100);
    
    // Department influence
    const dept = employee.active_experience_department;
    if (dept === 'Sales and Business Development') score += 15;
    else if (dept === 'Operations') score += 10;
    else if (dept === 'Marketing') score += 5;
    
    return Math.min(100, score);
  }

  async collectFullProfile(personId) {
    const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/collect/${personId}`, {
      method: 'GET',
      headers: {
        'apikey': this.apiKey,
        'Accept': 'application/json'
      }
    });

    if (!collectResponse.ok) {
      throw new Error(`Coresignal collect failed: ${collectResponse.status} ${collectResponse.statusText}`);
    }

    return await collectResponse.json();
  }
}

// Run test if called directly
if (require.main === module) {
  const test = new TestBuyerGroupNike();
  test.run()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = TestBuyerGroupNike;
