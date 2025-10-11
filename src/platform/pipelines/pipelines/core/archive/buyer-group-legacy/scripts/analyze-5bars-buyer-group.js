const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

class BuyerGroupAnalyzer {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.results = {
      companyId: this.companyId,
      analysisDate: new Date().toISOString(),
      buyerGroupAnalysis: null,
      peopleAnalysis: null,
      recommendations: null,
      errors: []
    };
  }

  async execute() {
    console.log('🎯 ANALYZING 5BARS SERVICES BUYER GROUP');
    console.log('=====================================');

    try {
      await this.getCompanyData();
      await this.analyzeCoreSignalPeople();
      await this.generateBuyerGroupInsights();
      await this.saveResultsToDatabase();
      await this.saveResultsToJson();

      this.printSummary();
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getCompanyData() {
    console.log('\n📊 STEP 1: Getting company data...');
    try {
      const company = await this.prisma.companies.findUnique({
        where: { id: this.companyId },
        select: {
          name: true,
          customFields: true,
          people: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              title: true,
              department: true,
              tags: true,
              customFields: true
            }
          }
        }
      });

      if (!company) {
        throw new Error('Company not found in database');
      }

      this.companyData = company;
      console.log(`   ✅ Found company: ${company.name}`);
      console.log(`   📋 Existing people in database: ${company.people.length}`);
      
      // Log existing people
      if (company.people.length > 0) {
        console.log('   👥 Existing people:');
        company.people.forEach(person => {
          console.log(`      - ${person.fullName} (${person.title || 'No title'})`);
        });
      }

    } catch (error) {
      console.error('   ❌ Error getting company data:', error.message);
      throw error;
    }
  }

  async analyzeCoreSignalPeople() {
    console.log('\n👔 STEP 2: Analyzing CoreSignal people data...');
    
    const coresignalData = this.companyData.customFields?.coresignalData;
    if (!coresignalData?.key_executives) {
      console.log('   ⚠️ No CoreSignal people data found');
      this.results.peopleAnalysis = {
        coresignalPeople: [],
        analysis: 'No CoreSignal people data available'
      };
      return;
    }

    const coresignalPeople = coresignalData.key_executives;
    console.log(`   📋 Found ${coresignalPeople.length} people in CoreSignal data:`);
    
    coresignalPeople.forEach(person => {
      console.log(`      - ${person.member_full_name} (${person.member_position_title})`);
    });

    // Analyze each person for buyer group potential
    const peopleAnalysis = coresignalPeople.map(person => {
      const role = person.member_position_title.toLowerCase();
      const name = person.member_full_name;
      
      // Determine buyer group role and influence
      let buyerGroupRole = 'Influencer';
      let influenceLevel = 'Medium';
      let decisionMakingPower = 'Medium';
      let engagementPriority = 'Medium';
      let painPoints = [];
      let valueProps = [];

      // CEO Analysis
      if (role.includes('chief executive officer') || role.includes('ceo')) {
        buyerGroupRole = 'Decision Maker';
        influenceLevel = 'High';
        decisionMakingPower = 'High';
        engagementPriority = 'High';
        painPoints = [
          'Company growth and scalability challenges',
          'Resource allocation and capacity planning',
          'Market expansion and competitive positioning',
          'Operational efficiency and cost management'
        ];
        valueProps = [
          'Strategic engineering talent acquisition',
          'Scalable project management solutions',
          'Technology modernization consulting',
          'Market expansion support'
        ];
      }
      
      // Project Director Analysis
      else if (role.includes('project director') || role.includes('director')) {
        buyerGroupRole = 'Champion';
        influenceLevel = 'High';
        decisionMakingPower = 'Medium';
        engagementPriority = 'High';
        painPoints = [
          'Project delivery and timeline management',
          'Resource coordination across multiple locations',
          'Quality control and safety compliance',
          'Technology integration and efficiency'
        ];
        valueProps = [
          'Project management expertise and tools',
          'Quality assurance and safety programs',
          'Technology consulting and implementation',
          'Process optimization and efficiency gains'
        ];
      }

      // Check if person already exists in our database
      const existingPerson = this.companyData.people.find(p => 
        p.fullName?.toLowerCase().includes(name.toLowerCase().split(' ')[0]) ||
        p.firstName?.toLowerCase() === name.toLowerCase().split(' ')[0]
      );

      return {
        coresignalId: person.parent_id,
        name: person.member_full_name,
        title: person.member_position_title,
        buyerGroupRole,
        influenceLevel,
        decisionMakingPower,
        engagementPriority,
        painPoints,
        valueProps,
        existsInDatabase: !!existingPerson,
        databasePerson: existingPerson || null,
        analysis: {
          isActive: true, // Assume active since in CoreSignal
          contactability: existingPerson ? 'High' : 'Medium',
          engagementStrategy: this.generateEngagementStrategy(buyerGroupRole, influenceLevel),
          nextSteps: this.generateNextSteps(buyerGroupRole, !!existingPerson)
        }
      };
    });

    this.results.peopleAnalysis = {
      coresignalPeople: peopleAnalysis,
      totalPeople: coresignalPeople.length,
      decisionMakers: peopleAnalysis.filter(p => p.buyerGroupRole === 'Decision Maker').length,
      champions: peopleAnalysis.filter(p => p.buyerGroupRole === 'Champion').length,
      influencers: peopleAnalysis.filter(p => p.buyerGroupRole === 'Influencer').length,
      existingInDatabase: peopleAnalysis.filter(p => p.existsInDatabase).length,
      newContacts: peopleAnalysis.filter(p => !p.existsInDatabase).length
    };

    console.log(`   ✅ Analyzed ${coresignalPeople.length} people from CoreSignal`);
    console.log(`   🎯 Decision Makers: ${this.results.peopleAnalysis.decisionMakers}`);
    console.log(`   🏆 Champions: ${this.results.peopleAnalysis.champions}`);
    console.log(`   💡 Influencers: ${this.results.peopleAnalysis.influencers}`);
    console.log(`   📋 Already in database: ${this.results.peopleAnalysis.existingInDatabase}`);
    console.log(`   🆕 New contacts to add: ${this.results.peopleAnalysis.newContacts}`);
  }

  generateEngagementStrategy(role, influence) {
    const strategies = {
      'Decision Maker': {
        'High': 'Direct executive engagement, strategic value proposition, ROI-focused discussions',
        'Medium': 'Executive briefings, strategic alignment discussions, partnership opportunities'
      },
      'Champion': {
        'High': 'Technical deep-dives, implementation support, success story sharing',
        'Medium': 'Solution demonstrations, pilot program discussions, reference customer connections'
      },
      'Influencer': {
        'High': 'Educational content, industry insights, peer networking opportunities',
        'Medium': 'Thought leadership content, industry trend discussions, best practice sharing'
      }
    };

    return strategies[role]?.[influence] || 'Standard engagement approach';
  }

  generateNextSteps(role, existsInDatabase) {
    if (existsInDatabase) {
      return [
        'Update existing contact with CoreSignal data',
        'Schedule follow-up meeting',
        'Share relevant case studies and success stories'
      ];
    } else {
      return [
        'Add new contact to database',
        'Research contact information and social profiles',
        'Develop personalized outreach strategy',
        'Create targeted value proposition'
      ];
    }
  }

  async generateBuyerGroupInsights() {
    console.log('\n🧠 STEP 3: Generating buyer group insights...');
    
    const peopleAnalysis = this.results.peopleAnalysis;
    if (!peopleAnalysis || peopleAnalysis.coresignalPeople.length === 0) {
      console.log('   ⚠️ No people data to analyze');
      return;
    }

    // Generate comprehensive buyer group analysis
    const buyerGroupAnalysis = {
      companyContext: {
        name: this.companyData.name,
        size: this.companyData.customFields?.coresignalData?.employees_count || 'Unknown',
        industry: this.companyData.customFields?.coresignalData?.industry || 'Unknown',
        foundedYear: this.companyData.customFields?.coresignalData?.founded_year || 'Unknown'
      },
      buyerGroupComposition: {
        totalMembers: peopleAnalysis.totalPeople,
        decisionMakers: peopleAnalysis.decisionMakers,
        champions: peopleAnalysis.champions,
        influencers: peopleAnalysis.influencers,
        coverage: this.calculateBuyerGroupCoverage(peopleAnalysis)
      },
      engagementStrategy: {
        primaryContact: this.identifyPrimaryContact(peopleAnalysis.coresignalPeople),
        engagementSequence: this.generateEngagementSequence(peopleAnalysis.coresignalPeople),
        keyMessages: this.generateKeyMessages(peopleAnalysis.coresignalPeople),
        successMetrics: this.defineSuccessMetrics(peopleAnalysis.coresignalPeople)
      },
      riskAssessment: {
        decisionComplexity: this.assessDecisionComplexity(peopleAnalysis.coresignalPeople),
        timelineFactors: this.assessTimelineFactors(peopleAnalysis.coresignalPeople),
        competitiveThreats: this.assessCompetitiveThreats(peopleAnalysis.coresignalPeople),
        mitigationStrategies: this.generateMitigationStrategies(peopleAnalysis.coresignalPeople)
      },
      opportunityAnalysis: {
        dealSize: this.estimateDealSize(peopleAnalysis.coresignalPeople),
        salesCycle: this.estimateSalesCycle(peopleAnalysis.coresignalPeople),
        probability: this.calculateWinProbability(peopleAnalysis.coresignalPeople),
        nextActions: this.generateNextActions(peopleAnalysis.coresignalPeople)
      }
    };

    this.results.buyerGroupAnalysis = buyerGroupAnalysis;
    console.log('   ✅ Generated comprehensive buyer group analysis');
  }

  calculateBuyerGroupCoverage(peopleAnalysis) {
    const total = peopleAnalysis.totalPeople;
    const decisionMakers = peopleAnalysis.decisionMakers;
    const champions = peopleAnalysis.champions;
    
    if (total === 0) return 'No coverage';
    if (decisionMakers > 0 && champions > 0) return 'Complete coverage';
    if (decisionMakers > 0 || champions > 0) return 'Partial coverage';
    return 'Limited coverage';
  }

  identifyPrimaryContact(people) {
    // Prioritize Decision Makers, then Champions, then Influencers
    const decisionMakers = people.filter(p => p.buyerGroupRole === 'Decision Maker');
    const champions = people.filter(p => p.buyerGroupRole === 'Champion');
    const influencers = people.filter(p => p.buyerGroupRole === 'Influencer');

    if (decisionMakers.length > 0) {
      return {
        person: decisionMakers[0],
        reason: 'Decision Maker with highest influence',
        engagementApproach: 'Executive-level strategic discussions'
      };
    } else if (champions.length > 0) {
      return {
        person: champions[0],
        reason: 'Champion with project influence',
        engagementApproach: 'Technical solution discussions'
      };
    } else if (influencers.length > 0) {
      return {
        person: influencers[0],
        reason: 'Influencer for relationship building',
        engagementApproach: 'Educational and relationship building'
      };
    }

    return null;
  }

  generateEngagementSequence(people) {
    const sequence = [];
    
    // Sort by priority: Decision Makers first, then Champions, then Influencers
    const sortedPeople = people.sort((a, b) => {
      const priority = { 'Decision Maker': 1, 'Champion': 2, 'Influencer': 3 };
      return priority[a.buyerGroupRole] - priority[b.buyerGroupRole];
    });

    sortedPeople.forEach((person, index) => {
      sequence.push({
        step: index + 1,
        person: person.name,
        role: person.buyerGroupRole,
        approach: person.analysis.engagementStrategy,
        timeline: this.estimateEngagementTimeline(person.buyerGroupRole),
        successCriteria: this.defineSuccessCriteria(person.buyerGroupRole)
      });
    });

    return sequence;
  }

  generateKeyMessages(people) {
    const messages = {
      valueProposition: 'TOP Engineering Plus provides specialized engineering talent and project management expertise for telecommunications infrastructure projects, helping companies like 5 Bars Services scale operations and improve project delivery.',
      painPoints: [
        'Limited capacity for large-scale projects',
        'Skilled labor shortage in specialized telecom infrastructure',
        'Project management and coordination challenges',
        'Technology modernization needs'
      ],
      solutions: [
        'Engineering talent acquisition and placement',
        'Project management consulting and support',
        'Technology consulting and implementation',
        'Process optimization and efficiency improvements'
      ],
      proofPoints: [
        'Proven track record with telecommunications companies',
        'Specialized expertise in infrastructure projects',
        'Flexible engagement models for small to mid-size companies',
        'Strong safety and quality focus'
      ]
    };

    return messages;
  }

  defineSuccessMetrics(people) {
    return {
      engagement: {
        meetingsScheduled: people.length,
        meetingsCompleted: 0,
        followUpMeetings: 0,
        proposalPresentations: 0
      },
      relationship: {
        championsIdentified: people.filter(p => p.buyerGroupRole === 'Champion').length,
        decisionMakersEngaged: people.filter(p => p.buyerGroupRole === 'Decision Maker').length,
        influencersActivated: people.filter(p => p.buyerGroupRole === 'Influencer').length
      },
      business: {
        opportunitiesIdentified: 1,
        proposalsSubmitted: 0,
        dealsClosed: 0,
        revenueGenerated: 0
      }
    };
  }

  assessDecisionComplexity(people) {
    const decisionMakers = people.filter(p => p.buyerGroupRole === 'Decision Maker').length;
    const champions = people.filter(p => p.buyerGroupRole === 'Champion').length;
    
    if (decisionMakers > 1) return 'High - Multiple decision makers';
    if (decisionMakers === 1 && champions > 0) return 'Medium - Single decision maker with champions';
    if (decisionMakers === 1) return 'Low - Single decision maker';
    return 'Unknown - No clear decision makers identified';
  }

  assessTimelineFactors(people) {
    return {
      urgency: 'Medium - 10-year company with growth aspirations',
      budgetCycle: 'Unknown - Need to determine fiscal year',
      projectTimeline: 'Medium-term - Infrastructure projects typically 3-12 months',
      decisionTimeline: '3-6 months estimated based on company size'
    };
  }

  assessCompetitiveThreats(people) {
    return {
      internal: [
        'Existing vendor relationships',
        'Internal resource constraints',
        'Budget limitations'
      ],
      external: [
        'Larger engineering firms with more resources',
        'Technology companies offering integrated solutions',
        'Local competitors with established relationships'
      ],
      mitigation: [
        'Emphasize specialized telecom expertise',
        'Highlight flexible engagement models',
        'Demonstrate proven track record with similar companies',
        'Offer pilot programs to reduce risk'
      ]
    };
  }

  generateMitigationStrategies(people) {
    return [
      'Develop strong champion relationships early',
      'Create compelling ROI and business case',
      'Offer flexible engagement models',
      'Provide references from similar companies',
      'Demonstrate deep industry expertise'
    ];
  }

  estimateDealSize(people) {
    // Based on company size (13 employees) and industry
    return {
      range: '$50,000 - $150,000',
      factors: [
        'Small company size (13 employees)',
        'Telecommunications infrastructure focus',
        'Multiple service categories requiring expertise',
        'Growth aspirations and expansion plans'
      ]
    };
  }

  estimateSalesCycle(people) {
    return {
      duration: '3-6 months',
      phases: [
        'Initial engagement and relationship building (1-2 months)',
        'Needs assessment and solution design (1-2 months)',
        'Proposal and negotiation (1-2 months)'
      ]
    };
  }

  calculateWinProbability(people) {
    const decisionMakers = people.filter(p => p.buyerGroupRole === 'Decision Maker').length;
    const champions = people.filter(p => p.buyerGroupRole === 'Champion').length;
    const existingContacts = people.filter(p => p.existsInDatabase).length;
    
    let probability = 25; // Base probability
    
    if (decisionMakers > 0) probability += 30;
    if (champions > 0) probability += 25;
    if (existingContacts > 0) probability += 20;
    
    return Math.min(probability, 95); // Cap at 95%
  }

  generateNextActions(people) {
    const actions = [];
    
    people.forEach(person => {
      if (!person.existsInDatabase) {
        actions.push({
          priority: 'High',
          action: `Add ${person.name} to database`,
          owner: 'Sales Team',
          timeline: '1 week',
          description: `Create new contact record for ${person.name} (${person.title})`
        });
      }
      
      actions.push({
        priority: person.buyerGroupRole === 'Decision Maker' ? 'High' : 'Medium',
        action: `Schedule meeting with ${person.name}`,
        owner: 'Sales Team',
        timeline: '2 weeks',
        description: `Initial engagement meeting to discuss ${person.painPoints[0]}`
      });
    });

    return actions;
  }

  estimateEngagementTimeline(role) {
    const timelines = {
      'Decision Maker': '1-2 weeks',
      'Champion': '2-3 weeks',
      'Influencer': '3-4 weeks'
    };
    return timelines[role] || '2-3 weeks';
  }

  defineSuccessCriteria(role) {
    const criteria = {
      'Decision Maker': 'Agreement to move forward with proposal or pilot program',
      'Champion': 'Commitment to support and advocate for solution',
      'Influencer': 'Willingness to provide insights and make introductions'
    };
    return criteria[role] || 'Positive engagement and follow-up meeting scheduled';
  }

  async saveResultsToDatabase() {
    console.log('\n💾 STEP 4: Saving results to database...');
    
    try {
      const currentCustomFields = this.companyData.customFields || {};
      const updatedCustomFields = {
        ...currentCustomFields,
        buyerGroupAnalysis: this.results.buyerGroupAnalysis,
        peopleAnalysis: this.results.peopleAnalysis,
        analysisDate: new Date().toISOString()
      };

      await this.prisma.companies.update({
        where: { id: this.companyId },
        data: {
          customFields: updatedCustomFields,
          updatedAt: new Date()
        }
      });

      console.log('   ✅ Buyer group analysis saved to database');
    } catch (error) {
      console.error('   ❌ Error saving to database:', error.message);
      this.results.errors.push(`Database save error: ${error.message}`);
    }
  }

  async saveResultsToJson() {
    console.log('\n📄 STEP 5: Saving results to JSON...');
    
    try {
      const filename = `5bars-buyer-group-analysis-${new Date().toISOString().split('T')[0]}.json`;
      const filepath = path.join(process.cwd(), filename);
      
      fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
      console.log(`   ✅ Results saved to: ${filename}`);
    } catch (error) {
      console.error('   ❌ Error saving JSON:', error.message);
      this.results.errors.push(`JSON save error: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n📊 BUYER GROUP ANALYSIS SUMMARY');
    console.log('===============================');
    
    if (this.results.peopleAnalysis) {
      const analysis = this.results.peopleAnalysis;
      console.log(`👥 People Analyzed: ${analysis.totalPeople}`);
      console.log(`🎯 Decision Makers: ${analysis.decisionMakers}`);
      console.log(`🏆 Champions: ${analysis.champions}`);
      console.log(`💡 Influencers: ${analysis.influencers}`);
      console.log(`📋 Already in Database: ${analysis.existingInDatabase}`);
      console.log(`🆕 New Contacts: ${analysis.newContacts}`);
    }

    if (this.results.buyerGroupAnalysis) {
      const bg = this.results.buyerGroupAnalysis;
      console.log(`\n🎯 Buyer Group Coverage: ${bg.buyerGroupComposition.coverage}`);
      console.log(`💰 Estimated Deal Size: ${bg.opportunityAnalysis.dealSize.range}`);
      console.log(`⏱️ Sales Cycle: ${bg.opportunityAnalysis.salesCycle.duration}`);
      console.log(`📈 Win Probability: ${bg.opportunityAnalysis.probability}%`);
      
      if (bg.engagementStrategy.primaryContact) {
        console.log(`\n🎯 Primary Contact: ${bg.engagementStrategy.primaryContact.person.name}`);
        console.log(`   Role: ${bg.engagementStrategy.primaryContact.person.buyerGroupRole}`);
        console.log(`   Approach: ${bg.engagementStrategy.primaryContact.engagementApproach}`);
      }
    }

    if (this.results.errors.length > 0) {
      console.log(`\n⚠️ Errors encountered: ${this.results.errors.length}`);
      this.results.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('\n✅ Analysis complete!');
  }
}

// Execute the analysis
new BuyerGroupAnalyzer().execute();
