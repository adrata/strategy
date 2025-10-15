#!/usr/bin/env node

/**
 * ☁️ CLOUDCADDIE COMPREHENSIVE ENRICHMENT
 * 
 * Enriches CloudCaddie workspace companies and people with:
 * - AI-generated intelligence based on CloudCaddie's IT staffing business model
 * - Company and people intelligence for sales readiness
 */

const { PrismaClient } = require('@prisma/client');
const { Anthropic } = require('@anthropic-ai/sdk');

// Configuration
const ANTHROPIC_CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY
};

class CloudCaddieComprehensiveEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.anthropic = new Anthropic(ANTHROPIC_CONFIG);
    this.workspace = null;
    this.stats = {
      totalCompanies: 0,
      totalPeople: 0,
      companiesProcessed: 0,
      peopleProcessed: 0,
      companiesEnriched: 0,
      peopleEnriched: 0,
      failed: 0,
      skipped: 0
    };
  }

  async runEnrichment() {
    try {
      console.log('☁️ Starting CloudCaddie comprehensive enrichment...\n');
      
      // Find CloudCaddie workspace
      this.workspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
            { name: { contains: 'Cloud Caddie', mode: 'insensitive' } },
            { slug: { contains: 'cloudcaddie', mode: 'insensitive' } }
          ]
        }
      });

      if (!this.workspace) {
        console.log('❌ CloudCaddie workspace not found!');
        return;
      }

      console.log(`✅ Found workspace: ${this.workspace.name} (${this.workspace.id})\n`);

      // Get counts
      this.stats.totalCompanies = await this.prisma.companies.count({
        where: { workspaceId: this.workspace.id }
      });
      
      this.stats.totalPeople = await this.prisma.people.count({
        where: { workspaceId: this.workspace.id }
      });

      console.log(`📊 Found ${this.stats.totalCompanies} companies and ${this.stats.totalPeople} people to enrich\n`);

      // Enrich companies
      await this.enrichCompanies();
      
      // Enrich people
      await this.enrichPeople();

      // Final summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Error during enrichment:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async enrichCompanies() {
    console.log('🏢 ENRICHING COMPANIES:');
    console.log('========================\n');

    const companies = await this.prisma.companies.findMany({
      where: { workspaceId: this.workspace.id },
      include: {
        people: {
          select: {
            fullName: true,
            jobTitle: true,
            department: true,
            seniority: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      try {
        console.log(`${i + 1}/${companies.length}. Processing ${company.name}...`);
        
        // Check if already enriched
        if (this.isCompanyAlreadyEnriched(company)) {
          console.log(`   ⏭️ Already enriched, skipping`);
          this.stats.skipped++;
          continue;
        }

        // Generate AI intelligence
        const aiIntelligence = await this.generateCompanyAIIntelligence(company);
        
        if (aiIntelligence) {
          // Update company with intelligence
          await this.prisma.companies.update({
            where: { id: company.id },
            data: {
              ...aiIntelligence,
              lastVerified: new Date(),
              confidence: 0.85, // High confidence for AI-generated intelligence
              updatedAt: new Date()
            }
          });
          
          console.log(`   ✅ Company intelligence generated and saved`);
          this.stats.companiesEnriched++;
        } else {
          console.log(`   ❌ Failed to generate company intelligence`);
          this.stats.failed++;
        }

        this.stats.companiesProcessed++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`   ❌ Error processing ${company.name}: ${error.message}`);
        this.stats.failed++;
      }
    }

    console.log(`\n✅ Company enrichment complete: ${this.stats.companiesEnriched} enriched, ${this.stats.skipped} skipped, ${this.stats.failed} failed\n`);
  }

  async enrichPeople() {
    console.log('👥 ENRICHING PEOPLE:');
    console.log('====================\n');

    const people = await this.prisma.people.findMany({
      where: { workspaceId: this.workspace.id },
      include: {
        company: {
          select: {
            name: true,
            industry: true,
            size: true,
            description: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      try {
        console.log(`${i + 1}/${people.length}. Processing ${person.fullName}...`);
        
        // Check if already enriched
        if (this.isPersonAlreadyEnriched(person)) {
          console.log(`   ⏭️ Already enriched, skipping`);
          this.stats.skipped++;
          continue;
        }

        // Generate AI intelligence
        const aiIntelligence = await this.generatePersonAIIntelligence(person);
        
        if (aiIntelligence) {
          // Update person with intelligence
          await this.prisma.people.update({
            where: { id: person.id },
            data: {
              ...aiIntelligence,
              lastEnriched: new Date(),
              enrichmentScore: 0.85, // High confidence for AI-generated intelligence
              updatedAt: new Date()
            }
          });
          
          console.log(`   ✅ Person intelligence generated and saved`);
          this.stats.peopleEnriched++;
        } else {
          console.log(`   ❌ Failed to generate person intelligence`);
          this.stats.failed++;
        }

        this.stats.peopleProcessed++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`   ❌ Error processing ${person.fullName}: ${error.message}`);
        this.stats.failed++;
      }
    }

    console.log(`\n✅ People enrichment complete: ${this.stats.peopleEnriched} enriched, ${this.stats.skipped} skipped, ${this.stats.failed} failed\n`);
  }

  isCompanyAlreadyEnriched(company) {
    return company.companyIntelligence && 
           company.businessChallenges?.length > 0 && 
           company.businessPriorities?.length > 0;
  }

  isPersonAlreadyEnriched(person) {
    return person.buyerGroupRole && 
           person.decisionPower && 
           person.influenceLevel;
  }

  async generateCompanyAIIntelligence(company) {
    try {
      const prompt = `
You are an expert sales strategist for CloudCaddie Consulting, an IT staffing and talent acquisition firm.

CLOUDCADDIE CONSULTING CONTEXT:
CloudCaddie Consulting is an IT staffing and talent acquisition firm that provides:
- IT Staffing Solutions: Direct hire placement, contract staffing, contract-to-hire
- Talent Acquisition Strategy: Proactive recruiting, technology team building, hiring strategy consulting
- Specialized Services: Testing & evaluations, hiring forecasting, technology team assessment
- Industry Focus: Technology companies, software development, IT services, fintech, healthcare technology, SaaS, digital agencies, startups, enterprise technology

UNIQUE VALUE PROPOSITION:
- Proactive recruiting model for high-performing technology teams
- Tailored solutions to meet unique hiring needs
- Expert recruiting team with deep technology knowledge
- Focus on building teams that cater to specific requirements
- Always ready to assist with next hire
- Delivering top talent consistently

TARGET COMPANY DATA:
- Name: ${company.name}
- Industry: ${company.industry || 'Unknown'}
- Size: ${company.size || 'Unknown'}
- Description: ${company.description || 'No description available'}
- Website: ${company.website || 'No website'}
- Domain: ${company.domain || 'No domain'}
- Total Employees: ${company.employeeCount || 'Unknown'}
- Founded Year: ${company.foundedYear || 'Unknown'}
- Revenue: ${company.revenue || 'Unknown'}
- Location: ${company.city || 'Unknown'}, ${company.state || 'Unknown'}, ${company.country || 'Unknown'}

PEOPLE AT COMPANY:
${company.people?.map(p => `- ${p.fullName}: ${p.jobTitle} (${p.department || 'Unknown dept'}, ${p.seniority || 'Unknown level'})`).join('\n') || 'No people data available'}

TASK: Generate sophisticated sales intelligence for CloudCaddie Consulting on how to position and sell IT staffing services to ${company.name}. This should be highly specific to CloudCaddie's actual services and the target company's real needs.

REQUIREMENTS:
1. Business Challenges: 4 specific hiring/IT challenges this company likely faces that CloudCaddie can address
2. Business Priorities: 4 strategic priorities this company has that align with CloudCaddie's services
3. Competitive Advantages: 4 ways CloudCaddie can differentiate when selling to this company
4. Growth Opportunities: 4 growth opportunities for this company that CloudCaddie can support
5. Strategic Initiatives: 4 strategic initiatives this company should consider that CloudCaddie can help with
6. Success Metrics: 4 key metrics this company should track that CloudCaddie can influence
7. Market Threats: 4 market threats this company faces that CloudCaddie can help mitigate
8. Key Influencers: Who are the key decision makers and influencers at this company for hiring decisions
9. Decision Timeline: What is the typical decision timeline for this type of company for IT staffing
10. Market Position: How does this company position itself in the market
11. Digital Maturity: Rate this company's digital maturity (0-100) and explain why
12. Tech Stack Analysis: What technologies should this company consider adopting
13. Competitors: Who are this company's main competitors

Make this highly specific to CloudCaddie's actual business model and the target company's real data. Focus on IT staffing, talent acquisition, and technology team building opportunities.
`;

      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0].text;
      
      // Parse the response into structured data
      return this.parseCompanyAIResponse(content);

    } catch (error) {
      console.error(`      AI intelligence error for ${company.name}:`, error.message);
      return null;
    }
  }

  async generatePersonAIIntelligence(person) {
    try {
      const prompt = `
You are an expert sales strategist for CloudCaddie Consulting, an IT staffing and talent acquisition firm.

CLOUDCADDIE CONSULTING CONTEXT:
CloudCaddie Consulting is an IT staffing and talent acquisition firm that provides:
- IT Staffing Solutions: Direct hire placement, contract staffing, contract-to-hire
- Talent Acquisition Strategy: Proactive recruiting, technology team building, hiring strategy consulting
- Specialized Services: Testing & evaluations, hiring forecasting, technology team assessment
- Industry Focus: Technology companies, software development, IT services, fintech, healthcare technology, SaaS, digital agencies, startups, enterprise technology

PERSON DATA:
- Name: ${person.fullName}
- Job Title: ${person.jobTitle || 'Unknown'}
- Department: ${person.department || 'Unknown'}
- Seniority: ${person.seniority || 'Unknown'}
- Email: ${person.email || 'Unknown'}
- Phone: ${person.phone || 'Unknown'}
- LinkedIn: ${person.linkedinUrl || 'Unknown'}
- Company: ${person.company?.name || 'Unknown'}
- Company Industry: ${person.company?.industry || 'Unknown'}
- Company Size: ${person.company?.size || 'Unknown'}

TASK: Generate sophisticated buyer group intelligence for CloudCaddie Consulting on how to engage with ${person.fullName}. This should be highly specific to CloudCaddie's actual services and this person's role and company context.

REQUIREMENTS:
1. Buyer Group Role: What role does this person play in the buyer group for IT staffing decisions (decision maker, champion, stakeholder, blocker, introducer)
2. Decision Power: Rate this person's decision-making power for hiring/IT staffing (0-100) and explain why
3. Influence Level: What is this person's influence level (high, medium, low) and why
4. Influence Score: Rate this person's influence score (0-100) and explain
5. Engagement Level: What is the recommended engagement level (high, medium, low)
6. Buyer Group Status: What is this person's status in the buyer group
7. Is Buyer Group Member: Is this person a member of the buyer group (true/false)
8. Buyer Group Optimized: Is this person optimized for the buyer group (true/false)
9. Decision Making: What is this person's decision-making style
10. Communication Style: What is this person's preferred communication style
11. Engagement Strategy: What is the recommended engagement strategy for this person
12. Budget Responsibility: What is this person's likely budget responsibility level for hiring
13. Team Size: What team size does this person likely manage
14. Leadership Experience: What is this person's leadership experience level

Make this highly specific to CloudCaddie's actual business model and this person's real role and company context. Focus on IT staffing and talent acquisition opportunities.
`;

      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0].text;
      
      // Parse the response into structured data
      return this.parsePersonAIResponse(content);

    } catch (error) {
      console.error(`      AI intelligence error for ${person.fullName}:`, error.message);
      return null;
    }
  }

  parseCompanyAIResponse(content) {
    try {
      // Extract structured data from AI response
      const businessChallenges = this.extractArrayFromText(content, 'Business Challenges');
      const businessPriorities = this.extractArrayFromText(content, 'Business Priorities');
      const competitiveAdvantages = this.extractArrayFromText(content, 'Competitive Advantages');
      const growthOpportunities = this.extractArrayFromText(content, 'Growth Opportunities');
      const strategicInitiatives = this.extractArrayFromText(content, 'Strategic Initiatives');
      const successMetrics = this.extractArrayFromText(content, 'Success Metrics');
      const marketThreats = this.extractArrayFromText(content, 'Market Threats');
      const keyInfluencers = this.extractTextFromContent(content, 'Key Influencers');
      const decisionTimeline = this.extractTextFromContent(content, 'Decision Timeline');
      const marketPosition = this.extractTextFromContent(content, 'Market Position');
      const digitalMaturity = this.extractNumberFromText(content, 'Digital Maturity');
      const techStack = this.extractArrayFromText(content, 'Tech Stack');
      const competitors = this.extractArrayFromText(content, 'Competitors');

      return {
        companyIntelligence: content,
        businessChallenges,
        businessPriorities,
        competitiveAdvantages,
        growthOpportunities,
        strategicInitiatives,
        successMetrics,
        marketThreats,
        keyInfluencers,
        decisionTimeline,
        marketPosition,
        digitalMaturity,
        techStack,
        competitors
      };

    } catch (error) {
      console.error('Error parsing company AI response:', error);
      return null;
    }
  }

  parsePersonAIResponse(content) {
    try {
      // Extract structured data from AI response
      const buyerGroupRole = this.extractTextFromContent(content, 'Buyer Group Role');
      const decisionPower = this.extractNumberFromText(content, 'Decision Power');
      const influenceLevel = this.extractTextFromContent(content, 'Influence Level');
      const influenceScore = this.extractNumberFromText(content, 'Influence Score');
      const engagementLevel = this.extractTextFromContent(content, 'Engagement Level');
      const buyerGroupStatus = this.extractTextFromContent(content, 'Buyer Group Status');
      const isBuyerGroupMember = this.extractBooleanFromText(content, 'Is Buyer Group Member');
      const buyerGroupOptimized = this.extractBooleanFromText(content, 'Buyer Group Optimized');
      const decisionMaking = this.extractTextFromContent(content, 'Decision Making');
      const communicationStyle = this.extractTextFromContent(content, 'Communication Style');
      const engagementStrategy = this.extractTextFromContent(content, 'Engagement Strategy');

      return {
        buyerGroupRole,
        decisionPower,
        influenceLevel,
        influenceScore,
        engagementLevel,
        buyerGroupStatus,
        isBuyerGroupMember,
        buyerGroupOptimized,
        decisionMaking,
        communicationStyle,
        engagementStrategy
      };

    } catch (error) {
      console.error('Error parsing person AI response:', error);
      return null;
    }
  }

  extractArrayFromText(content, fieldName) {
    const regex = new RegExp(`${fieldName}[:\\s]*([\\s\\S]*?)(?=\\n\\d+\\.|\\n[A-Z][a-z]+ [A-Z]|$)`, 'i');
    const match = content.match(regex);
    if (match) {
      const text = match[1].trim();
      return text.split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 4); // Limit to 4 items
    }
    return [];
  }

  extractTextFromContent(content, fieldName) {
    const regex = new RegExp(`${fieldName}[:\\s]*([^\\n]+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  extractNumberFromText(content, fieldName) {
    const regex = new RegExp(`${fieldName}[:\\s]*(\\d+)`, 'i');
    const match = content.match(regex);
    return match ? parseInt(match[1]) : null;
  }

  extractBooleanFromText(content, fieldName) {
    const regex = new RegExp(`${fieldName}[:\\s]*(true|false)`, 'i');
    const match = content.match(regex);
    return match ? match[1].toLowerCase() === 'true' : null;
  }

  printSummary() {
    console.log('🎉 CLOUDCADDIE ENRICHMENT SUMMARY');
    console.log('==================================');
    console.log(`📊 Total Companies: ${this.stats.totalCompanies}`);
    console.log(`📊 Total People: ${this.stats.totalPeople}`);
    console.log(`✅ Companies Enriched: ${this.stats.companiesEnriched}`);
    console.log(`✅ People Enriched: ${this.stats.peopleEnriched}`);
    console.log(`⏭️ Skipped: ${this.stats.skipped}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`📈 Success Rate: ${((this.stats.companiesEnriched + this.stats.peopleEnriched) / (this.stats.totalCompanies + this.stats.totalPeople) * 100).toFixed(1)}%`);
    console.log('\n🎯 CloudCaddie workspace is now ready for Notary Everyday!');
  }
}

// Run the enrichment
if (require.main === module) {
  const enrichment = new CloudCaddieComprehensiveEnrichment();
  enrichment.runEnrichment();
}

module.exports = { CloudCaddieComprehensiveEnrichment };
