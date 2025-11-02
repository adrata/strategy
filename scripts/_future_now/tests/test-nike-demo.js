#!/usr/bin/env node

/**
 * Nike Pipeline Validation Demo
 * 
 * Demonstrates the structure and flow of all 5 enrichment pipelines
 * without requiring actual API calls. Shows the value proposition
 * of Adrata's $250K Buyer Group Intelligence product.
 */

class NikePipelineDemo {
  constructor() {
    this.testResults = {
      success: true,
      totalCreditsUsed: 0,
      totalExecutionTime: 0,
      pipelineResults: {},
      dataFlow: {},
      errors: [],
      startTime: new Date().toISOString()
    };
    
    // Mock data for demonstration
    this.nikeCompanyId = 'mock-nike-company-id';
    this.nikeLinkedInUrl = 'https://linkedin.com/company/nike';
    this.nikeCompanyData = {
      company_name: 'Nike, Inc.',
      website: 'nike.com',
      company_industry: 'Apparel & Fashion',
      company_employees_count: 75000,
      company_size_range: '10,000+ employees',
      company_founded_year: 1964,
      company_hq_city: 'Beaverton',
      company_hq_state: 'Oregon',
      company_hq_country: 'United States',
      company_linkedin_url: 'https://linkedin.com/company/nike'
    };
  }

  async run() {
    const startTime = Date.now();
    console.log('🎯 Nike Pipeline Validation Demo');
    console.log('=' .repeat(60));
    console.log('Demonstrating all 5 enrichment pipelines with Nike (nike.com)');
    console.log('Showing $250K Buyer Group Intelligence value proposition\n');
    
    try {
      // Pipeline 1: Find Company
      console.log('🏢 PIPELINE 1: Find Company');
      console.log('-'.repeat(40));
      const companyResult = await this.demoFindCompany();
      this.testResults.pipelineResults.company = companyResult;
      
      // Pipeline 2: Find Person
      console.log('\n👤 PIPELINE 2: Find Person');
      console.log('-'.repeat(40));
      const personResult = await this.demoFindPerson();
      this.testResults.pipelineResults.person = personResult;
      
      // Pipeline 3: Find Role
      console.log('\n🎭 PIPELINE 3: Find Role');
      console.log('-'.repeat(40));
      const roleResult = await this.demoFindRole();
      this.testResults.pipelineResults.role = roleResult;
      
      // Pipeline 4: Find Buyer Group
      console.log('\n👥 PIPELINE 4: Find Buyer Group');
      console.log('-'.repeat(40));
      const buyerGroupResult = await this.demoFindBuyerGroup();
      this.testResults.pipelineResults.buyerGroup = buyerGroupResult;
      
      // Pipeline 5: Find Optimal Buyer Group
      console.log('\n🎯 PIPELINE 5: Find Optimal Buyer Group');
      console.log('-'.repeat(40));
      const optimalResult = await this.demoFindOptimalBuyerGroup();
      this.testResults.pipelineResults.optimal = optimalResult;
      
      // Generate comprehensive report
      this.generateComprehensiveReport();
      
      console.log('\n' + '='.repeat(60));
      console.log('🎯 NIKE PIPELINE VALIDATION DEMO COMPLETE');
      console.log('='.repeat(60));
      console.log('✅ All 5 pipelines demonstrated successfully');
      console.log('💡 Value proposition clearly shown');
      console.log('🚀 Ready for real API testing with valid credentials');
      
    } catch (error) {
      console.error('\n❌ Demo FAILED:', error.message);
      this.testResults.errors.push(error.message);
    } finally {
      this.testResults.totalExecutionTime = Date.now() - startTime;
      this.testResults.endTime = new Date().toISOString();
    }

    return this.testResults;
  }

  async demoFindCompany() {
    console.log('🔍 Searching for Nike by website (nike.com)...');
    await this.delay(1000);
    console.log('✅ Search completed');
    
    console.log('📋 Collecting full company profile...');
    await this.delay(1000);
    console.log('✅ Collection completed');
    
    console.log('🔍 Validating company data...');
    console.log('📊 Validation Results:');
    console.log('  ✅ hasName: true');
    console.log('  ✅ nameMatches: true');
    console.log('  ✅ hasEmployeeCount: true');
    console.log('  ✅ hasIndustry: true');
    console.log('  ✅ hasWebsite: true');
    console.log('  ✅ websiteMatches: true');
    console.log('  ✅ hasLinkedInUrl: true');
    
    console.log('\n📋 Nike Company Profile:');
    console.log(`  Name: ${this.nikeCompanyData.company_name}`);
    console.log(`  Website: ${this.nikeCompanyData.website}`);
    console.log(`  Industry: ${this.nikeCompanyData.company_industry}`);
    console.log(`  Employee Count: ${this.nikeCompanyData.company_employees_count?.toLocaleString()}`);
    console.log(`  Size Range: ${this.nikeCompanyData.company_size_range}`);
    console.log(`  Founded: ${this.nikeCompanyData.company_founded_year}`);
    console.log(`  Location: ${this.nikeCompanyData.company_hq_city}, ${this.nikeCompanyData.company_hq_state}, ${this.nikeCompanyData.company_hq_country}`);
    console.log(`  LinkedIn: ${this.nikeCompanyData.company_linkedin_url}`);
    
    console.log('✅ Pipeline 1 PASSED: Nike company profile enriched');
    
    return {
      success: true,
      creditsUsed: 2,
      executionTime: 2000,
      data: this.nikeCompanyData
    };
  }

  async demoFindPerson() {
    console.log('🔍 Searching for people at Nike...');
    await this.delay(1000);
    console.log('✅ Person search completed');
    
    console.log('📋 Collecting full profiles for top people...');
    await this.delay(2000);
    
    const mockPeople = [
      {
        full_name: 'John Donahoe',
        active_experience_title: 'President & CEO',
        active_experience_department: 'Executive',
        primary_professional_email: 'john.donahoe@nike.com',
        linkedin_url: 'https://linkedin.com/in/johndonahoe',
        location: 'Beaverton, Oregon',
        connections_count: 5000,
        followers_count: 10000
      },
      {
        full_name: 'Matthew Friend',
        active_experience_title: 'Chief Financial Officer',
        active_experience_department: 'Finance and Administration',
        primary_professional_email: 'matthew.friend@nike.com',
        linkedin_url: 'https://linkedin.com/in/matthewfriend',
        location: 'Beaverton, Oregon',
        connections_count: 3000,
        followers_count: 5000
      },
      {
        full_name: 'Heidi O\'Neill',
        active_experience_title: 'President of Consumer, Product & Brand',
        active_experience_department: 'Marketing',
        primary_professional_email: 'heidi.oneill@nike.com',
        linkedin_url: 'https://linkedin.com/in/heidi-oneill',
        location: 'Beaverton, Oregon',
        connections_count: 4000,
        followers_count: 8000
      }
    ];
    
    mockPeople.forEach((person, index) => {
      console.log(`  ✅ Enriched: ${person.full_name} - ${person.active_experience_title}`);
    });
    
    console.log('📊 Person Validation Results:');
    console.log('  ✅ foundPeople: true');
    console.log('  ✅ enrichedPeople: true');
    console.log('  ✅ hasNames: true');
    console.log('  ✅ hasTitles: true');
    console.log('  ✅ hasEmails: true');
    console.log('  ✅ hasLinkedIn: true');
    
    console.log('✅ Pipeline 2 PASSED: Nike people enriched');
    
    return {
      success: true,
      creditsUsed: 5,
      executionTime: 3000,
      data: {
        totalFound: 10,
        enriched: 3,
        people: mockPeople
      }
    };
  }

  async demoFindRole() {
    const targetRole = 'CFO';
    console.log(`🔍 Searching for ${targetRole} at Nike...`);
    
    console.log('📋 Generated 9 role variations');
    console.log('   🔍 Searching primary role variations...');
    await this.delay(1000);
    console.log('   🔍 Searching secondary role variations...');
    await this.delay(1000);
    
    const mockMatches = [
      {
        full_name: 'Matthew Friend',
        active_experience_title: 'Chief Financial Officer',
        active_experience_department: 'Finance and Administration',
        matchedRole: 'CFO',
        matchLevel: 'primary',
        confidence: { confidence: 95 }
      }
    ];
    
    console.log(`📊 Found ${mockMatches.length} role matches`);
    
    console.log('📊 Role Validation Results:');
    console.log('  ✅ foundMatches: true');
    console.log('  ✅ hasConfidence: true');
    console.log('  ✅ hasNames: true');
    console.log('  ✅ hasTitles: true');
    
    console.log('✅ Pipeline 3 PASSED: Nike roles found');
    
    return {
      success: true,
      creditsUsed: 3,
      executionTime: 2000,
      data: {
        targetRole,
        totalMatches: 1,
        matches: mockMatches
      }
    };
  }

  async demoFindBuyerGroup() {
    console.log('🔍 Discovering employees across key departments...');
    await this.delay(2000);
    
    const departments = [
      'Sales and Business Development',
      'Marketing',
      'Product Management',
      'Operations',
      'Finance and Administration',
      'Legal and Compliance',
      'Engineering and Technical'
    ];
    
    departments.forEach(dept => {
      console.log(`  🔍 Searching ${dept}...`);
      console.log(`    ✅ Found 15 employees in ${dept}`);
    });
    
    console.log('✅ Total unique employees found: 105');
    
    console.log('🎭 Classifying buyer group roles...');
    await this.delay(1000);
    
    console.log('👥 Selecting top buyer group members...');
    await this.delay(1000);
    
    const mockBuyerGroup = [
      { name: 'John Donahoe', role: 'decision_maker', title: 'President & CEO', department: 'Executive', confidence: 95 },
      { name: 'Matthew Friend', role: 'decision_maker', title: 'Chief Financial Officer', department: 'Finance', confidence: 90 },
      { name: 'Heidi O\'Neill', role: 'champion', title: 'President of Consumer, Product & Brand', department: 'Marketing', confidence: 85 },
      { name: 'Sarah Mensah', role: 'champion', title: 'VP of Global Sales', department: 'Sales', confidence: 80 },
      { name: 'Michael Spillane', role: 'stakeholder', title: 'VP of Product', department: 'Product', confidence: 75 },
      { name: 'Lisa MacCallum', role: 'stakeholder', title: 'VP of Operations', department: 'Operations', confidence: 70 },
      { name: 'John Slusher', role: 'blocker', title: 'Chief Legal Officer', department: 'Legal', confidence: 85 },
      { name: 'Nicole Graham', role: 'introducer', title: 'VP of Customer Success', department: 'Sales', confidence: 80 },
      { name: 'Tom Peddie', role: 'introducer', title: 'VP of Business Development', department: 'Sales', confidence: 75 }
    ];
    
    console.log(`✅ Selected ${mockBuyerGroup.length} buyer group members`);
    
    const composition = {
      decision_maker: 2,
      champion: 2,
      stakeholder: 2,
      blocker: 1,
      introducer: 2,
      total: 9
    };
    
    console.log('\n👥 Nike Buyer Group Composition:');
    Object.entries(composition).forEach(([role, count]) => {
      if (role !== 'total') {
        console.log(`  ${role}: ${count}`);
      }
    });
    
    console.log('\n🏆 Top Buyer Group Members:');
    mockBuyerGroup.slice(0, 5).forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.name} (${member.role}) - ${member.confidence}% confidence`);
      console.log(`     Title: ${member.title}`);
      console.log(`     Department: ${member.department}`);
    });
    
    console.log('📊 Buyer Group Validation Results:');
    console.log('  ✅ foundEmployees: true');
    console.log('  ✅ hasDecisionMakers: true');
    console.log('  ✅ hasChampions: true');
    console.log('  ✅ hasStakeholders: true');
    console.log('  ✅ hasBlockers: true');
    console.log('  ✅ hasIntroducers: true');
    console.log('  ✅ totalMembers: true');
    
    console.log('✅ Pipeline 4 PASSED: Nike buyer group mapped');
    
    return {
      success: true,
      creditsUsed: 15,
      executionTime: 4000,
      data: {
        totalEmployeesFound: 105,
        buyerGroupSize: 9,
        composition: composition,
        topMembers: mockBuyerGroup.slice(0, 5)
      }
    };
  }

  async demoFindOptimalBuyerGroup() {
    console.log('🔍 Phase 1: Market filtering for SaaS companies...');
    await this.delay(1000);
    console.log('✅ Phase 1 search completed');
    console.log('📊 Found 25 candidate companies');
    
    console.log('📋 Collecting company profiles...');
    await this.delay(2000);
    console.log('✅ Collected 25 company profiles');
    
    console.log('🔍 Phase 2: Sampling buyer group quality...');
    await this.delay(3000);
    
    const mockOptimalBuyers = [
      {
        company_name: 'Salesforce',
        company_industry: 'Software',
        company_employees_count: 50000,
        company_employees_count_change_yearly_percentage: 15,
        buyerReadinessScore: 85,
        employeesAnalyzed: 30
      },
      {
        company_name: 'HubSpot',
        company_industry: 'SaaS',
        company_employees_count: 5000,
        company_employees_count_change_yearly_percentage: 20,
        buyerReadinessScore: 82,
        employeesAnalyzed: 25
      },
      {
        company_name: 'Slack',
        company_industry: 'Technology',
        company_employees_count: 2000,
        company_employees_count_change_yearly_percentage: 25,
        buyerReadinessScore: 78,
        employeesAnalyzed: 20
      }
    ];
    
    console.log('\n🏆 Optimal Buyer Groups (Top 3):');
    mockOptimalBuyers.forEach((company, index) => {
      console.log(`\n${index + 1}. ${company.company_name} (${company.buyerReadinessScore}% readiness)`);
      console.log(`   Industry: ${company.company_industry}`);
      console.log(`   Size: ${company.company_employees_count?.toLocaleString()} employees`);
      console.log(`   Growth: ${company.company_employees_count_change_yearly_percentage}%`);
      console.log(`   Employees Analyzed: ${company.employeesAnalyzed || 0}`);
      console.log(`   Buyer Group Quality: 80%`);
    });
    
    console.log('\n📊 Optimal Buyer Group Validation Results:');
    console.log('  ✅ foundCompanies: true');
    console.log('  ✅ hasScores: true');
    console.log('  ✅ hasRanking: true');
    console.log('  ✅ hasEmployeeAnalysis: true');
    
    console.log('✅ Pipeline 5 PASSED: Optimal buyer groups found');
    
    return {
      success: true,
      creditsUsed: 30,
      executionTime: 6000,
      data: {
        totalCandidates: 25,
        optimalBuyerGroups: 3,
        topCompanies: mockOptimalBuyers
      }
    };
  }

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
    
    // Key insights
    console.log('\n💡 Key Insights:');
    console.log('  🏢 Nike Profile: Nike, Inc. (75,000 employees)');
    console.log('  📍 Location: Beaverton, Oregon, United States');
    console.log('  🏭 Industry: Apparel & Fashion');
    console.log('  👤 People Enriched: 3/10');
    console.log('  🎭 CFO Found: 1 matches');
    console.log('  👥 Buyer Group: 9 members (decision_maker:2, champion:2, stakeholder:2, blocker:1, introducer:2)');
    console.log('  🎯 Optimal Buyers: 3 companies analyzed');
    console.log('  🏆 Top Target: Salesforce (85% readiness)');
    
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
    console.log(`  TOTAL: 55 credits`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new NikePipelineDemo();
  demo.run()
    .then(results => {
      console.log('\n🎉 Demo completed successfully!');
      console.log('💡 This demonstrates the complete workflow without API calls');
      console.log('🚀 Run with real API keys to test actual functionality');
      process.exit(0);
    })
    .catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

module.exports = NikePipelineDemo;
