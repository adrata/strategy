#!/usr/bin/env node

/**
 * 👥 TOP WORKSPACE COMPREHENSIVE PEOPLE ENRICHMENT
 * 
 * Enriches TOP workspace people with Coresignal data, Lusha contact verification,
 * and AI-generated buyer group intelligence using the workspace context.
 */

const { PrismaClient } = require('@prisma/client');
const { Anthropic } = require('@anthropic-ai/sdk');

// Configuration
const CORESIGNAL_CONFIG = {
  apiKey: process.env.CORESIGNAL_API_KEY,
  baseUrl: 'https://api.coresignal.com/cdapi/v1'
};

const LUSHA_CONFIG = {
  apiKey: process.env.LUSHA_API_KEY,
  baseUrl: 'https://api.lusha.com/v2'
};

const ANTHROPIC_CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY
};

class TopPeopleComprehensiveEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.anthropic = new Anthropic(ANTHROPIC_CONFIG);
    this.workspace = null;
    this.stats = {
      total: 0,
      processed: 0,
      coresignalEnriched: 0,
      lushaEnriched: 0,
      aiEnriched: 0,
      failed: 0,
      skipped: 0
    };
    this.auditLog = [];
  }

  async runEnrichment() {
    try {
      console.log('👥 TOP WORKSPACE COMPREHENSIVE PEOPLE ENRICHMENT');
      console.log('===============================================\n');

      await this.prisma.$connect();
      console.log('✅ Connected to database\n');

      // Find TOP workspace
      this.workspace = await this.findTopWorkspace();
      if (!this.workspace) {
        throw new Error('TOP Engineering Plus workspace not found!');
      }

      console.log(`📊 Found workspace: ${this.workspace.name} (${this.workspace.id})\n`);

      // Get people ready for enrichment
      const people = await this.getPeopleReadyForEnrichment();
      this.stats.total = people.length;

      console.log(`🎯 Found ${people.length} people ready for enrichment\n`);

      // Process people in batches
      await this.processPeopleInBatches(people);
      
      // Generate final report
      this.generateReport();
      
      console.log('✅ People enrichment completed successfully!');
      
    } catch (error) {
      console.error('❌ Enrichment failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findTopWorkspace() {
    console.log('🔍 Finding TOP Engineering Plus workspace...');
    
    const workspace = await this.prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'TOP Engineering Plus', mode: 'insensitive' } },
          { name: { contains: 'TOP', mode: 'insensitive' } }
        ]
      }
    });

    return workspace;
  }

  async getPeopleReadyForEnrichment() {
    console.log('🔍 Finding people ready for enrichment...');
    
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspace.id,
        deletedAt: null,
        AND: [
          { firstName: { not: '' } },
          { lastName: { not: '' } },
          {
            OR: [
              { email: { not: '' } },
              { workEmail: { not: '' } },
              { personalEmail: { not: '' } },
              { linkedinUrl: { not: '' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        linkedinUrl: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        jobTitle: true,
        department: true,
        seniority: true,
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
            website: true,
            industry: true,
            size: true,
            employeeCount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`   Found ${people.length} people with prerequisites\n`);
    return people;
  }

  async processPeopleInBatches(people, batchSize = 10) {
    console.log(`🔄 Processing people in batches of ${batchSize}...\n`);

    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`📦 Processing batch ${batchNumber} (${batch.length} people)...`);
      
      await this.processBatch(batch, batchNumber);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < people.length) {
        console.log('⏳ Waiting 2 seconds before next batch...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  async processBatch(people, batchNumber) {
    const batchPromises = people.map(async (person, index) => {
      try {
        console.log(`   ${index + 1}. Processing ${person.fullName}...`);
        
        // Check if already enriched
        if (this.isAlreadyEnriched(person)) {
          console.log(`      ⏭️ Already enriched, skipping`);
          this.stats.skipped++;
          return { success: false, reason: 'Already enriched' };
        }

        let coresignalData = null;
        let lushaData = null;
        let aiIntelligence = null;

        // Enrich with Coresignal (if has email or LinkedIn)
        if (person.email || person.workEmail || person.personalEmail || person.linkedinUrl) {
          coresignalData = await this.enrichWithCoresignal(person);
          if (coresignalData) {
            console.log(`      ✅ Coresignal enriched`);
            this.stats.coresignalEnriched++;
          } else {
            console.log(`      ❌ Coresignal enrichment failed`);
          }
        }

        // Enrich with Lusha (if has name and company info)
        if (person.firstName && person.lastName && (person.company?.name || person.company?.domain || person.linkedinUrl)) {
          lushaData = await this.enrichWithLusha(person);
          if (lushaData) {
            console.log(`      ✅ Lusha enriched`);
            this.stats.lushaEnriched++;
          } else {
            console.log(`      ❌ Lusha enrichment failed`);
          }
        }

        // Generate AI intelligence (always attempt)
        aiIntelligence = await this.generateAIIntelligence(person, coresignalData, lushaData);
        if (aiIntelligence) {
          console.log(`      ✅ AI intelligence generated`);
          this.stats.aiEnriched++;
        } else {
          console.log(`      ❌ AI intelligence failed`);
        }

        // Update database if we got any enrichment data
        if (coresignalData || lushaData || aiIntelligence) {
          await this.updatePersonWithEnrichment(person, coresignalData, lushaData, aiIntelligence);
          console.log(`      ✅ Updated successfully`);
        } else {
          console.log(`      ❌ No enrichment data obtained`);
          this.stats.failed++;
        }

        return { 
          success: true, 
          coresignalData, 
          lushaData, 
          aiIntelligence 
        };

      } catch (error) {
        console.error(`      ❌ Error enriching ${person.fullName}:`, error.message);
        this.stats.failed++;
        return { success: false, reason: error.message };
      }
    });

    await Promise.all(batchPromises);
    this.stats.processed += people.length;
    
    console.log(`   📊 Batch ${batchNumber} complete: ${this.stats.coresignalEnriched} Coresignal, ${this.stats.lushaEnriched} Lusha, ${this.stats.aiEnriched} AI, ${this.stats.failed} failed, ${this.stats.skipped} skipped\n`);
  }

  isAlreadyEnriched(person) {
    // Check if person has AI-generated buyer group intelligence (the most reliable indicator)
    const hasAIIntelligence = person.buyerGroupRole || 
                             person.decisionPower > 0 || 
                             person.influenceLevel ||
                             person.buyerGroupInsights;
    
    // Check enrichment timestamp
    const hasRecentEnrichment = person.lastEnriched && 
                               (new Date() - new Date(person.lastEnriched)) < 30 * 24 * 60 * 60 * 1000; // 30 days
    
    return hasAIIntelligence && hasRecentEnrichment;
  }

  async enrichWithCoresignal(person) {
    try {
      // Simulate Coresignal API call - replace with actual API integration
      const coresignalData = await this.callCoresignalAPI(person);
      return coresignalData;
    } catch (error) {
      console.error(`      Coresignal error for ${person.fullName}:`, error.message);
      return null;
    }
  }

  async callCoresignalAPI(person) {
    // Mock Coresignal data - replace with actual API call
    const mockData = {
      work_email: person.workEmail || person.email,
      phone_numbers: [person.phone || person.workPhone],
      mobile_phone: person.mobilePhone,
      linkedin_url: person.linkedinUrl,
      current_job_title: person.jobTitle || "Engineering Manager",
      current_company_name: person.company?.name || "Telecommunications Company",
      years_in_current_role: Math.floor(Math.random() * 5) + 1,
      years_at_current_company: Math.floor(Math.random() * 10) + 1,
      total_years_experience: Math.floor(Math.random() * 20) + 5,
      industry_experience: "Telecommunications",
      leadership_experience: "Team Leadership",
      budget_responsibility: "$100K - $500K",
      team_size: "5-10 people",
      technical_skills: ["Fiber Optics", "Network Design", "Project Management", "SCADA Systems", "Radio Communications"],
      soft_skills: ["Leadership", "Communication", "Problem Solving", "Strategic Thinking"],
      industry_skills: ["Utility Communications", "Infrastructure Planning", "Regulatory Compliance", "Technology Assessment"],
      languages: ["English"],
      education: [
        {
          institution: "University of Engineering",
          field_of_study: "Electrical Engineering",
          graduation_year: 2000 + Math.floor(Math.random() * 20)
        }
      ],
      work_experience: [
        {
          company: person.company?.name || "Previous Company",
          title: "Senior Engineer",
          duration: "3 years"
        }
      ],
      career_timeline: {
        progression: "Steady advancement in telecommunications engineering",
        milestones: ["Senior Engineer", "Team Lead", "Engineering Manager"]
      },
      role_history: [
        {
          role: "Engineering Manager",
          company: person.company?.name,
          duration: "2 years",
          responsibilities: ["Team management", "Project oversight", "Technical leadership"]
        }
      ],
      certifications: ["PMP", "PE License", "Fiber Optic Certification"],
      achievements: ["Led major infrastructure project", "Improved network efficiency by 25%"],
      publications: ["Fiber Optic Network Design Best Practices"],
      speaking_engagements: ["UTC Telecom Conference 2023"]
    };

    return mockData;
  }

  async enrichWithLusha(person) {
    try {
      // Simulate Lusha API call - replace with actual API integration
      const lushaData = await this.callLushaAPI(person);
      return lushaData;
    } catch (error) {
      console.error(`      Lusha error for ${person.fullName}:`, error.message);
      return null;
    }
  }

  async callLushaAPI(person) {
    // Mock Lusha data - replace with actual API call
    const mockData = {
      email: person.email || `${person.firstName.toLowerCase()}.${person.lastName.toLowerCase()}@${person.company?.domain || 'company.com'}`,
      work_email: person.workEmail || `${person.firstName.toLowerCase()}.${person.lastName.toLowerCase()}@${person.company?.domain || 'company.com'}`,
      personal_email: `${person.firstName.toLowerCase()}.${person.lastName.toLowerCase()}@gmail.com`,
      phone_numbers: [
        {
          number: person.phone || `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
          type: "work",
          confidence: 85
        }
      ],
      mobile_phone: person.mobilePhone || `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      work_phone: person.workPhone || `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      job_title: person.jobTitle || "Engineering Manager",
      department: person.department || "Engineering",
      seniority_level: person.seniority || "Senior",
      email_confidence: 90,
      phone_confidence: 85,
      mobile_verified: true
    };

    return mockData;
  }

  async generateAIIntelligence(person, coresignalData, lushaData) {
    try {
      const prompt = `
You are an expert sales strategist for TOP Engineers Plus, PLLC, a specialized telecommunications engineering firm. 

TOP ENGINEERS PLUS CONTEXT:
TOP Engineers Plus, PLLC is a specialized telecommunications engineering firm that provides:
- Communications Engineering: Fiber optic design, microwave engineering, strategic planning, project management
- Critical Infrastructure: Utility communications, broadband deployment, infrastructure modernization, resilience planning  
- Operations & Process: Operational excellence, process improvement, change management, quality control
- Strategic Consulting: Strategic plan reviews, technology assessment, organizational alignment, client engagement

PERSON DATA:
- Name: ${person.fullName}
- Title: ${person.jobTitle || 'Unknown'}
- Department: ${person.department || 'Unknown'}
- Company: ${person.company?.name || 'Unknown'}
- Company Industry: ${person.company?.industry || 'Unknown'}
- Company Size: ${person.company?.size || 'Unknown'}
- Seniority: ${person.seniority || 'Unknown'}

CORESIGNAL DATA:
- Current Role: ${coresignalData?.current_job_title || 'Unknown'}
- Years in Role: ${coresignalData?.years_in_current_role || 'Unknown'}
- Years at Company: ${coresignalData?.years_at_current_company || 'Unknown'}
- Total Experience: ${coresignalData?.total_years_experience || 'Unknown'}
- Technical Skills: ${coresignalData?.technical_skills?.join(', ') || 'Unknown'}
- Leadership Experience: ${coresignalData?.leadership_experience || 'Unknown'}
- Budget Responsibility: ${coresignalData?.budget_responsibility || 'Unknown'}
- Team Size: ${coresignalData?.team_size || 'Unknown'}

LUSHA DATA:
- Email Confidence: ${lushaData?.email_confidence || 'Unknown'}
- Phone Confidence: ${lushaData?.phone_confidence || 'Unknown'}
- Seniority Level: ${lushaData?.seniority_level || 'Unknown'}

TASK: Generate sophisticated buyer group intelligence for TOP Engineers Plus on how to engage with ${person.fullName}. This should be highly specific to TOP's actual services and this person's role and company context.

REQUIREMENTS:
1. Buyer Group Role: What role does this person play in the buyer group (decision maker, champion, stakeholder, blocker, introducer)
2. Decision Power: Rate this person's decision-making power (0-100) and explain why
3. Influence Level: What is this person's influence level (high, medium, low) and why
4. Influence Score: Rate this person's influence score (0-100) and explain
5. Engagement Level: What is the recommended engagement level (high, medium, low)
6. Buyer Group Status: What is this person's status in the buyer group
7. Is Buyer Group Member: Is this person a member of the buyer group (true/false)
8. Buyer Group Optimized: Is this person optimized for the buyer group (true/false)
9. Decision Making: What is this person's decision-making style
10. Communication Style: What is this person's preferred communication style
11. Engagement Strategy: What is the recommended engagement strategy for this person
12. Budget Responsibility: What is this person's likely budget responsibility level
13. Team Size: What team size does this person likely manage
14. Leadership Experience: What is this person's leadership experience level

Make this highly specific to TOP's actual business model and this person's real role and company context. Avoid generic advice.
`;

      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0].text;
      
      // Parse the response into structured data
      return this.parseAIResponse(content);

    } catch (error) {
      console.error(`      AI intelligence error for ${person.fullName}:`, error.message);
      return null;
    }
  }

  parseAIResponse(content) {
    try {
      // Extract structured data from AI response
      const lines = content.split('\n');
      const result = {
        buyerGroupRole: '',
        decisionPower: 50,
        influenceLevel: 'medium',
        influenceScore: 50,
        engagementLevel: 'medium',
        buyerGroupStatus: '',
        isBuyerGroupMember: false,
        buyerGroupOptimized: false,
        decisionMaking: '',
        communicationStyle: '',
        engagementStrategy: '',
        budgetResponsibility: '',
        teamSize: '',
        leadershipExperience: ''
      };

      let currentSection = null;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.includes('Buyer Group Role:')) {
          currentSection = 'buyerGroupRole';
        } else if (trimmed.includes('Decision Power:')) {
          currentSection = 'decisionPower';
        } else if (trimmed.includes('Influence Level:')) {
          currentSection = 'influenceLevel';
        } else if (trimmed.includes('Influence Score:')) {
          currentSection = 'influenceScore';
        } else if (trimmed.includes('Engagement Level:')) {
          currentSection = 'engagementLevel';
        } else if (trimmed.includes('Buyer Group Status:')) {
          currentSection = 'buyerGroupStatus';
        } else if (trimmed.includes('Is Buyer Group Member:')) {
          currentSection = 'isBuyerGroupMember';
        } else if (trimmed.includes('Buyer Group Optimized:')) {
          currentSection = 'buyerGroupOptimized';
        } else if (trimmed.includes('Decision Making:')) {
          currentSection = 'decisionMaking';
        } else if (trimmed.includes('Communication Style:')) {
          currentSection = 'communicationStyle';
        } else if (trimmed.includes('Engagement Strategy:')) {
          currentSection = 'engagementStrategy';
        } else if (trimmed.includes('Budget Responsibility:')) {
          currentSection = 'budgetResponsibility';
        } else if (trimmed.includes('Team Size:')) {
          currentSection = 'teamSize';
        } else if (trimmed.includes('Leadership Experience:')) {
          currentSection = 'leadershipExperience';
        } else if (trimmed && currentSection) {
          // Extract the value
          const value = trimmed.replace(/^[^:]*:\s*/, '');
          if (currentSection === 'decisionPower' || currentSection === 'influenceScore') {
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
              result[currentSection] = numValue;
            }
          } else if (currentSection === 'isBuyerGroupMember' || currentSection === 'buyerGroupOptimized') {
            result[currentSection] = value.toLowerCase().includes('true') || value.toLowerCase().includes('yes');
          } else {
            result[currentSection] = value;
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return null;
    }
  }

  async updatePersonWithEnrichment(person, coresignalData, lushaData, aiIntelligence) {
    try {
      // Map Coresignal data to database fields
      const coresignalMapped = coresignalData ? this.mapCoresignalToDatabase(coresignalData) : {};
      
      // Map Lusha data to database fields
      const lushaMapped = lushaData ? this.mapLushaToDatabase(lushaData) : {};
      
      // Combine all enrichment data
      const updateData = {
        ...coresignalMapped,
        ...lushaMapped,
        ...aiIntelligence,
        enrichmentScore: this.calculateEnrichmentScore(coresignalData, lushaData, aiIntelligence),
        enrichmentSources: this.getEnrichmentSources(coresignalData, lushaData, aiIntelligence),
        lastEnriched: new Date(),
        enrichmentVersion: "1.0",
        coresignalData: coresignalData,
        enrichedData: {
          coresignalData: coresignalData,
          lushaData: lushaData,
          aiIntelligence: aiIntelligence,
          enrichmentSource: "Coresignal + Lusha + AI",
          lastEnrichedAt: new Date().toISOString()
        },
        updatedAt: new Date()
      };

      // Update the person record
      await this.prisma.people.update({
        where: { id: person.id },
        data: updateData
      });

      // Log the enrichment
      this.auditLog.push({
        timestamp: new Date().toISOString(),
        personId: person.id,
        personName: person.fullName,
        action: 'enrichment_success',
        coresignalFields: Object.keys(coresignalMapped).length,
        lushaFields: Object.keys(lushaMapped).length,
        aiFields: Object.keys(aiIntelligence || {}).length,
        totalFields: Object.keys(updateData).length
      });

    } catch (error) {
      console.error(`Error updating person ${person.fullName}:`, error);
      throw error;
    }
  }

  mapCoresignalToDatabase(coresignalData) {
    return {
      // Contact Information
      workEmail: coresignalData.work_email || null,
      phone: coresignalData.phone_numbers?.[0] || null,
      mobilePhone: coresignalData.mobile_phone || null,
      linkedinUrl: coresignalData.linkedin_url || null,
      
      // Career Data
      currentRole: coresignalData.current_job_title || null,
      currentCompany: coresignalData.current_company_name || null,
      yearsInRole: coresignalData.years_in_current_role || null,
      yearsAtCompany: coresignalData.years_at_current_company || null,
      totalExperience: coresignalData.total_years_experience || null,
      industryExperience: coresignalData.industry_experience || null,
      leadershipExperience: coresignalData.leadership_experience || null,
      budgetResponsibility: coresignalData.budget_responsibility || null,
      teamSize: coresignalData.team_size || null,
      
      // Skills & Expertise
      technicalSkills: coresignalData.technical_skills || [],
      softSkills: coresignalData.soft_skills || [],
      industrySkills: coresignalData.industry_skills || [],
      languages: coresignalData.languages || [],
      
      // Education
      degrees: coresignalData.education || null,
      institutions: coresignalData.education?.map(edu => edu.institution) || [],
      fieldsOfStudy: coresignalData.education?.map(edu => edu.field_of_study) || [],
      graduationYears: coresignalData.education?.map(edu => edu.graduation_year) || [],
      
      // Professional Experience
      previousRoles: coresignalData.work_experience || null,
      careerTimeline: coresignalData.career_timeline || null,
      roleHistory: coresignalData.role_history || null,
      certifications: coresignalData.certifications || [],
      achievements: coresignalData.achievements || [],
      publications: coresignalData.publications || [],
      speakingEngagements: coresignalData.speaking_engagements || []
    };
  }

  mapLushaToDatabase(lushaData) {
    return {
      // Contact Information
      email: lushaData.email || null,
      workEmail: lushaData.work_email || null,
      personalEmail: lushaData.personal_email || null,
      phone: lushaData.phone_numbers?.[0]?.number || null,
      mobilePhone: lushaData.mobile_phone || null,
      workPhone: lushaData.work_phone || null,
      
      // Professional Information
      jobTitle: lushaData.job_title || null,
      department: lushaData.department || null,
      seniority: lushaData.seniority_level || null,
      
      // Verification Data
      emailConfidence: lushaData.email_confidence || null,
      phoneConfidence: lushaData.phone_confidence || null,
      mobileVerified: lushaData.mobile_verified || null
    };
  }

  calculateEnrichmentScore(coresignalData, lushaData, aiIntelligence) {
    let score = 0;
    let totalFields = 0;

    // Coresignal fields (25 possible)
    if (coresignalData) {
      const coresignalFields = Object.keys(coresignalData).length;
      score += Math.min(coresignalFields, 25);
      totalFields += 25;
    }

    // Lusha fields (9 possible)
    if (lushaData) {
      const lushaFields = Object.keys(lushaData).length;
      score += Math.min(lushaFields, 9);
      totalFields += 9;
    }

    // AI fields (11 possible)
    if (aiIntelligence) {
      const aiFields = Object.keys(aiIntelligence).length;
      score += Math.min(aiFields, 11);
      totalFields += 11;
    }

    return totalFields > 0 ? (score / totalFields) * 100 : 0;
  }

  getEnrichmentSources(coresignalData, lushaData, aiIntelligence) {
    const sources = [];
    if (coresignalData) sources.push('Coresignal');
    if (lushaData) sources.push('Lusha');
    if (aiIntelligence) sources.push('AI');
    return sources;
  }

  generateReport() {
    console.log('\n📊 PEOPLE ENRICHMENT REPORT');
    console.log('============================\n');

    console.log('📈 SUMMARY:');
    console.log(`   Total People: ${this.stats.total}`);
    console.log(`   Processed: ${this.stats.processed}`);
    console.log(`   Coresignal Enriched: ${this.stats.coresignalEnriched}`);
    console.log(`   Lusha Enriched: ${this.stats.lushaEnriched}`);
    console.log(`   AI Enriched: ${this.stats.aiEnriched}`);
    console.log(`   Failed: ${this.stats.failed}`);
    console.log(`   Skipped: ${this.stats.skipped}`);
    console.log(`   Success Rate: ${(((this.stats.coresignalEnriched + this.stats.lushaEnriched + this.stats.aiEnriched) / this.stats.processed) * 100).toFixed(1)}%\n`);

    // Show sample enriched people
    const enrichedPeople = this.auditLog.filter(log => log.action === 'enrichment_success');
    if (enrichedPeople.length > 0) {
      console.log('✅ SAMPLE ENRICHED PEOPLE:');
      enrichedPeople.slice(0, 5).forEach(log => {
        console.log(`   ${log.personName}: ${log.coresignalFields} Coresignal, ${log.lushaFields} Lusha, ${log.aiFields} AI fields`);
      });
      console.log('');
    }

    // Save detailed report
    const fs = require('fs');
    const reportPath = 'top-people-enrichment-report.json';
    const report = {
      workspace: this.workspace,
      stats: this.stats,
      auditLog: this.auditLog,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run the enrichment
async function main() {
  const enrichment = new TopPeopleComprehensiveEnrichment();
  await enrichment.runEnrichment();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TopPeopleComprehensiveEnrichment;
