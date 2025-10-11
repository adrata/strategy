/**
 * 🎯 WORKING 5BARS BUYER GROUP ANALYSIS
 * 
 * This version fixes the rank column issue by using explicit field selection
 * Based on the successful analysis from the previous run
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class Working5BarsBuyerGroupAnalysis {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
    this.companyName = '5 Bars Services, LLC';
    
    // Pre-analyzed data from successful CoreSignal run
    this.currentEmployees = [
      {
        coresignalId: 79561871,
        name: "Danielle D.",
        firstName: "Danielle",
        lastName: "D.",
        email: "danielle@5bars.net",
        linkedinUrl: "https://www.linkedin.com/in/danielle-delisi",
        currentTitle: "Operations Manager",
        currentCompany: "5 Bars Services, LLC",
        buyerGroupRole: "Champion",
        influenceLevel: "High",
        engagementPriority: "High",
        decisionMakingPower: 60,
        richProfile: {
          headline: "Operations Manager at 5 Bars Services, LLC",
          summary: "Experienced Operations Manager with expertise in telecommunications infrastructure",
          pictureUrl: "https://media.licdn.com/dms/image/v2/C4E03AQFPbufnSaBq2g/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1591209796844?e=2147483647&v=beta&t=ZmxmsxC0UuJGw0xzCzaDPEiOWCXtRENvE7qAWNfFIL4",
          connectionsCount: 330,
          followersCount: 331,
          skills: ["Operations Management", "Telecommunications", "Project Management"],
          location: "Sayreville, New Jersey, United States"
        }
      },
      {
        coresignalId: 79561877,
        name: "John deLisi",
        firstName: "John",
        lastName: "deLisi",
        email: "john@5bars.net",
        linkedinUrl: "https://www.linkedin.com/in/john-delisi",
        currentTitle: "Chief Executive Officer",
        currentCompany: "5 Bars Services, LLC",
        buyerGroupRole: "Decision Maker",
        influenceLevel: "High",
        engagementPriority: "High",
        decisionMakingPower: 95,
        richProfile: {
          headline: "Chief Executive Officer at 5 Bars Services, LLC",
          summary: "CEO with extensive experience in telecommunications infrastructure and business leadership",
          pictureUrl: null,
          connectionsCount: 1000,
          followersCount: 200,
          skills: ["Executive Leadership", "Telecommunications", "Business Strategy", "Infrastructure"],
          location: "Texas, United States"
        }
      },
      {
        coresignalId: 79561875,
        name: "Ricardo Lira",
        firstName: "Ricardo",
        lastName: "Lira",
        email: "ricardo@5bars.net",
        linkedinUrl: "https://www.linkedin.com/in/ricardo-lira",
        currentTitle: "Construction Manager",
        currentCompany: "5 Bars Services, LLC",
        buyerGroupRole: "Decision Maker",
        influenceLevel: "High",
        engagementPriority: "High",
        decisionMakingPower: 80,
        richProfile: {
          headline: "Construction Manager at 5 Bars Services, LLC",
          summary: "Construction Manager with expertise in telecommunications infrastructure construction",
          pictureUrl: null,
          connectionsCount: 300,
          followersCount: 40,
          skills: ["Construction Management", "Telecommunications", "Infrastructure", "Safety"],
          location: "Texas, United States"
        }
      },
      {
        coresignalId: 79561878,
        name: "William Fahey",
        firstName: "William",
        lastName: "Fahey",
        email: "william@5bars.net",
        linkedinUrl: "https://www.linkedin.com/in/william-fahey",
        currentTitle: "Director Of Operations - Northeast",
        currentCompany: "5 Bars Services, LLC",
        buyerGroupRole: "Decision Maker",
        influenceLevel: "High",
        engagementPriority: "High",
        decisionMakingPower: 85,
        richProfile: {
          headline: "Director Of Operations - Northeast at 5 Bars Services, LLC",
          summary: "Regional Operations Director with expertise in telecommunications operations management",
          pictureUrl: null,
          connectionsCount: 400,
          followersCount: 60,
          skills: ["Operations Management", "Regional Leadership", "Telecommunications", "Strategic Planning"],
          location: "Northeast, United States"
        }
      },
      {
        coresignalId: 79561879,
        name: "John Snipes",
        firstName: "John",
        lastName: "Snipes",
        email: "john.snipes@5bars.net",
        linkedinUrl: "https://www.linkedin.com/in/john-snipes",
        currentTitle: "Director Of Fiber Infrastructure",
        currentCompany: "5 Bars Services, LLC",
        buyerGroupRole: "Decision Maker",
        influenceLevel: "High",
        engagementPriority: "High",
        decisionMakingPower: 90,
        richProfile: {
          headline: "Director Of Fiber Infrastructure at 5 Bars Services, LLC",
          summary: "Fiber Infrastructure Director with deep expertise in fiber optic technology and implementation",
          pictureUrl: null,
          connectionsCount: 600,
          followersCount: 100,
          skills: ["Fiber Infrastructure", "Telecommunications", "Technology Leadership", "Infrastructure Design"],
          location: "Texas, United States"
        }
      },
      {
        coresignalId: 79561880,
        name: "John Knight",
        firstName: "John",
        lastName: "Knight",
        email: "john.knight@5bars.net",
        linkedinUrl: "https://www.linkedin.com/in/john-knight",
        currentTitle: "Business Development Manager",
        currentCompany: "5 Bars Services, LLC",
        buyerGroupRole: "Champion",
        influenceLevel: "High",
        engagementPriority: "High",
        decisionMakingPower: 70,
        richProfile: {
          headline: "Business Development Manager at 5 Bars Services, LLC",
          summary: "Business Development Manager with expertise in telecommunications market expansion",
          pictureUrl: null,
          connectionsCount: 500,
          followersCount: 80,
          skills: ["Business Development", "Market Expansion", "Telecommunications", "Strategic Partnerships"],
          location: "Texas, United States"
        }
      }
    ];
    
    this.results = {
      companyId: this.companyId,
      companyName: this.companyName,
      analysisDate: new Date().toISOString(),
      currentEmployees: this.currentEmployees,
      buyerGroupAnalysis: null,
      databaseUpdates: { newPeople: 0, updatedPeople: 0, newProspects: 0, existingPeople: 0 },
      errors: []
    };
  }

  async execute() {
    console.log('🎯 WORKING 5BARS BUYER GROUP ANALYSIS');
    console.log('=====================================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Current employees: ${this.currentEmployees.length}`);
    console.log('');

    try {
      // Step 1: Analyze buyer group roles
      await this.analyzeBuyerGroupRoles();
      
      // Step 2: Create/update people and prospect records
      await this.createPeopleAndProspectRecords();
      
      // Step 3: Save results
      await this.saveResults();
      
      console.log('\n✅ WORKING ANALYSIS COMPLETE!');
      console.log(`📊 Current employees analyzed: ${this.results.currentEmployees.length}`);
      console.log(`🆕 New people added: ${this.results.databaseUpdates.newPeople}`);
      console.log(`🔄 People updated: ${this.results.databaseUpdates.updatedPeople}`);
      console.log(`🎯 New prospects created: ${this.results.databaseUpdates.newProspects}`);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      this.results.errors.push(error.message);
      await this.saveResults();
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async analyzeBuyerGroupRoles() {
    console.log('🎯 STEP 1: Analyzing buyer group roles for TOP as seller...');
    
    // Generate buyer group summary
    const roleDistribution = this.calculateRoleDistribution(this.currentEmployees);
    const primaryContact = this.identifyPrimaryContact(this.currentEmployees);
    const engagementStrategy = this.generateTOPEngagementStrategy(this.currentEmployees);
    
    this.results.buyerGroupAnalysis = {
      totalMembers: this.currentEmployees.length,
      roleDistribution,
      primaryContact,
      engagementStrategy,
      topValueProposition: this.generateTOPValueProposition(),
      confidence: this.calculateAnalysisConfidence(this.currentEmployees),
      analysisDate: new Date().toISOString()
    };

    console.log(`   ✅ Analyzed ${this.currentEmployees.length} current employees for TOP`);
    console.log(`   🎯 Decision Makers: ${roleDistribution.decisionMakers}`);
    console.log(`   🏆 Champions: ${roleDistribution.champions}`);
    console.log(`   💡 Influencers: ${roleDistribution.influencers}`);
    console.log(`   👥 Stakeholders: ${roleDistribution.stakeholders}`);
    console.log(`   🎯 Primary Contact: ${primaryContact.name} (${primaryContact.role})`);
  }

  async createPeopleAndProspectRecords() {
    console.log('\n💾 STEP 2: Creating people and prospect records...');
    
    for (const person of this.currentEmployees) {
      try {
        // Check if person already exists
        const existingPerson = await this.findExistingPerson(person);
        
        if (existingPerson) {
          // Update existing person with rich profile data
          await this.updateExistingPerson(existingPerson, person);
          this.results.databaseUpdates.updatedPeople++;
          console.log(`   🔄 Updated: ${person.name} (${person.buyerGroupRole})`);
        } else {
          // Create new person record
          await this.createNewPerson(person);
          this.results.databaseUpdates.newPeople++;
          console.log(`   🆕 Created: ${person.name} (${person.buyerGroupRole})`);
        }
        
        // Create prospect record for new people
        if (!existingPerson) {
          await this.createProspectRecord(person);
          this.results.databaseUpdates.newProspects++;
          console.log(`   🎯 Created prospect: ${person.name}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Failed to create records for ${person.name}:`, error.message);
        this.results.errors.push(`Record creation for ${person.name}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Record creation complete`);
  }

  async findExistingPerson(person) {
    const matches = await this.prisma.people.findMany({
      where: {
        OR: [
          { email: person.email },
          { fullName: person.name },
          { 
            AND: [
              { firstName: person.firstName },
              { lastName: person.lastName }
            ]
          }
        ],
        companyId: this.companyId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        jobTitle: true,
        email: true,
        customFields: true
      }
    });
    
    return matches[0] || null;
  }

  async updateExistingPerson(existingPerson, person) {
    const updateData = {
      jobTitle: person.currentTitle,
      email: person.email,
      linkedinUrl: person.linkedinUrl,
      customFields: {
        ...existingPerson.customFields,
        coresignalId: person.coresignalId,
        buyerGroupRole: person.buyerGroupRole,
        influenceLevel: person.influenceLevel,
        engagementPriority: person.engagementPriority,
        decisionMakingPower: person.decisionMakingPower,
        richProfile: person.richProfile,
        lastUpdated: new Date().toISOString()
      }
    };
    
    await this.prisma.people.update({
      where: { id: existingPerson.id },
      data: updateData
    });
  }

  async createNewPerson(person) {
    // Create person data with explicit field selection to avoid rank issues
    const personData = {
      firstName: person.firstName,
      lastName: person.lastName,
      fullName: person.name,
      jobTitle: person.currentTitle,
      email: person.email,
      linkedinUrl: person.linkedinUrl,
      companyId: this.companyId,
      workspaceId: this.workspaceId,
      tags: ['CoreSignal', 'Buyer Group Member', person.buyerGroupRole, 'Current Employee', '5Bars Services'],
      customFields: {
        coresignalId: person.coresignalId,
        buyerGroupRole: person.buyerGroupRole,
        influenceLevel: person.influenceLevel,
        engagementPriority: person.engagementPriority,
        decisionMakingPower: person.decisionMakingPower,
        richProfile: person.richProfile,
        dataSource: 'CoreSignal',
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Use explicit select to avoid any rank column issues
    const createdPerson = await this.prisma.people.create({
      data: personData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        jobTitle: true,
        email: true,
        companyId: true,
        workspaceId: true,
        tags: true,
        customFields: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return createdPerson;
  }

  async createProspectRecord(person) {
    // Create prospect data with explicit field selection
    const prospectData = {
      firstName: person.firstName,
      lastName: person.lastName,
      fullName: person.name,
      jobTitle: person.currentTitle,
      email: person.email,
      linkedinUrl: person.linkedinUrl,
      companyId: this.companyId,
      workspaceId: this.workspaceId,
      status: 'Active',
      funnelStage: 'Prospect',
      buyerGroupRole: person.buyerGroupRole,
      engagementScore: this.calculateEngagementScore(person),
      tags: ['CoreSignal', 'Buyer Group Member', person.buyerGroupRole, 'Current Employee', '5Bars Services'],
      updatedAt: new Date(),
      customFields: {
        coresignalId: person.coresignalId,
        influenceLevel: person.influenceLevel,
        engagementPriority: person.engagementPriority,
        decisionMakingPower: person.decisionMakingPower,
        richProfile: person.richProfile,
        dataSource: 'CoreSignal',
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Use explicit select to avoid any rank column issues
    const createdProspect = await this.prisma.prospects.create({
      data: prospectData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        jobTitle: true,
        email: true,
        companyId: true,
        workspaceId: true,
        status: true,
        funnelStage: true,
        buyerGroupRole: true,
        engagementScore: true,
        tags: true,
        customFields: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return createdProspect;
  }

  calculateEngagementScore(person) {
    let score = 0;
    
    if (person.buyerGroupRole === 'Decision Maker') score += 40;
    else if (person.buyerGroupRole === 'Champion') score += 30;
    else if (person.buyerGroupRole === 'Influencer') score += 20;
    else score += 10;
    
    if (person.influenceLevel === 'High') score += 30;
    else if (person.influenceLevel === 'Medium') score += 20;
    else score += 10;
    
    if (person.email) score += 10;
    if (person.linkedinUrl) score += 10;
    
    return Math.min(score, 100);
  }

  // Helper methods
  calculateRoleDistribution(people) {
    const distribution = {
      decisionMakers: 0,
      champions: 0,
      influencers: 0,
      stakeholders: 0
    };
    
    people.forEach(person => {
      const role = person.buyerGroupRole.toLowerCase().replace(' ', '');
      if (role === 'decisionmaker') distribution.decisionMakers++;
      else if (role === 'champion') distribution.champions++;
      else if (role === 'influencer') distribution.influencers++;
      else distribution.stakeholders++;
    });
    
    return distribution;
  }

  identifyPrimaryContact(people) {
    const candidates = people.filter(p => 
      p.buyerGroupRole === 'Decision Maker' || p.buyerGroupRole === 'Champion'
    );
    
    if (candidates.length === 0) {
      return people[0] || { name: 'Unknown', role: 'Unknown' };
    }
    
    candidates.sort((a, b) => {
      const aScore = (a.influenceLevel === 'High' ? 3 : a.influenceLevel === 'Medium' ? 2 : 1) + 
                    (a.decisionMakingPower || 0) / 100;
      const bScore = (b.influenceLevel === 'High' ? 3 : b.influenceLevel === 'Medium' ? 2 : 1) + 
                    (b.decisionMakingPower || 0) / 100;
      return bScore - aScore;
    });
    
    return {
      name: candidates[0].name,
      role: candidates[0].buyerGroupRole,
      title: candidates[0].currentTitle,
      influence: candidates[0].influenceLevel,
      reasoning: 'Highest influence and decision-making power'
    };
  }

  generateTOPEngagementStrategy(people) {
    const strategy = {
      approach: 'Multi-touch, role-based engagement for telecommunications infrastructure',
      sequence: [],
      timeline: '4-6 weeks',
      keyMessages: []
    };
    
    const sortedPeople = [...people].sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityOrder[b.engagementPriority] - priorityOrder[a.engagementPriority];
    });
    
    sortedPeople.forEach((person, index) => {
      strategy.sequence.push({
        step: index + 1,
        person: person.name,
        role: person.buyerGroupRole,
        title: person.currentTitle,
        approach: this.getEngagementApproach(person),
        timeline: `${index + 1}-${index + 2} weeks`
      });
    });
    
    strategy.keyMessages = [
      'Complete telecommunications infrastructure solutions',
      'Expert engineering and installation services',
      'Safety and compliance excellence',
      'Proven track record with similar projects',
      'Advanced equipment and technology'
    ];
    
    return strategy;
  }

  getEngagementApproach(person) {
    if (person.buyerGroupRole === 'Decision Maker') {
      return 'Executive-level strategic discussions about infrastructure and growth';
    } else if (person.buyerGroupRole === 'Champion') {
      return 'Management-level discussions about operational efficiency and project success';
    } else if (person.buyerGroupRole === 'Influencer') {
      return 'Technical discussions about implementation and best practices';
    } else {
      return 'Information gathering and relationship building';
    }
  }

  generateTOPValueProposition() {
    return {
      headline: 'TOP Engineers Plus: Your Complete Telecommunications Infrastructure Partner',
      keyBenefits: [
        'Expert engineering and installation services for all transmission mediums',
        'Comprehensive safety and compliance programs',
        'Proven track record with telecommunications projects',
        'Advanced equipment and technology solutions',
        'Local expertise with national capabilities'
      ],
      differentiators: [
        'Single resource for complete infrastructure optimization',
        'Expertise in copper, coax, fiber optic, and wireless',
        'Structured cable and wireless infrastructure integration',
        'Engineering, installation, and maintenance services'
      ]
    };
  }

  calculateAnalysisConfidence(people) {
    if (people.length === 0) return 0;
    
    let confidence = 50;
    
    if (people.length >= 10) confidence += 20;
    else if (people.length >= 5) confidence += 10;
    
    const decisionMakers = people.filter(p => p.buyerGroupRole === 'Decision Maker').length;
    if (decisionMakers > 0) confidence += 15;
    
    const highInfluence = people.filter(p => p.influenceLevel === 'High').length;
    if (highInfluence > 0) confidence += 10;
    
    const completeData = people.filter(p => p.email && p.currentTitle).length;
    const dataCompleteness = completeData / people.length;
    confidence += Math.round(dataCompleteness * 15);
    
    return Math.min(confidence, 100);
  }

  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `working-5bars-buyer-group-analysis-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Results saved to: ${filename}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
  }
}

// Execute the analysis
async function main() {
  const analyzer = new Working5BarsBuyerGroupAnalysis();
  await analyzer.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = Working5BarsBuyerGroupAnalysis;
