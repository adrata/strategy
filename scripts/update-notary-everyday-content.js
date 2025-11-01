const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Comprehensive content for Notary Everyday sales enablement
const notaryContentLibrary = {
  'Sales Process Overview': `# Sales Process Overview

## Comprehensive Guide to Notary Everyday Sales Process

The Notary Everyday sales process is designed to systematically identify, engage, and convert prospects into satisfied customers. This guide provides a complete framework for effective notary service sales.

## The Notary Everyday Sales Methodology

### Phase 1: Prospecting & Lead Generation (Weeks 1-2)
**Objective**: Identify and qualify potential customers
- **Target Identification**: Research and identify potential clients
- **Lead Qualification**: Assess fit and potential value
- **Initial Outreach**: First contact and introduction
- **Needs Assessment**: Understand customer requirements

### Phase 2: Discovery & Qualification (Weeks 3-4)
**Objective**: Deep dive into customer needs and decision-making process
- **Stakeholder Mapping**: Identify all decision-makers and influencers
- **Needs Analysis**: Understand pain points and requirements
- **Budget Assessment**: Determine budget and purchasing authority
- **Timeline Evaluation**: Understand decision timeline and urgency

### Phase 3: Solution Presentation (Weeks 5-6)
**Objective**: Present tailored solution and demonstrate value
- **Solution Design**: Customize offering to customer needs
- **Value Proposition**: Articulate clear value and benefits
- **Demonstration**: Show capabilities and results
- **Proposal Development**: Create comprehensive proposal

### Phase 4: Negotiation & Closing (Weeks 7-8)
**Objective**: Address objections and secure commitment
- **Objection Handling**: Address concerns and resistance
- **Negotiation**: Work through terms and pricing
- **Contract Development**: Finalize agreement details
- **Closing**: Secure signed agreement

### Phase 5: Implementation & Success (Weeks 9-12)
**Objective**: Ensure successful implementation and customer satisfaction
- **Onboarding**: Smooth transition and setup
- **Training**: Customer education and support
- **Success Monitoring**: Track progress and results
- **Relationship Building**: Long-term partnership development

## Key Success Factors

### 1. Customer-Centric Approach
- **Listen First**: Understand before proposing
- **Tailor Solutions**: Customize to specific needs
- **Build Relationships**: Focus on long-term partnerships
- **Deliver Value**: Ensure measurable results

### 2. Systematic Process
- **Consistent Methodology**: Follow proven process
- **Document Everything**: Track all interactions
- **Regular Follow-up**: Maintain engagement
- **Continuous Improvement**: Learn and adapt

### 3. Value-Based Selling
- **Focus on Benefits**: Emphasize customer value
- **Quantify Results**: Use metrics and data
- **Address Pain Points**: Solve real problems
- **Demonstrate ROI**: Show return on investment

*This systematic approach ensures consistent results and customer success.*`,

  'Prospecting Strategies': `# Prospecting Strategies

## Effective Prospecting Techniques for Notary Services

Prospecting is the foundation of successful sales. This guide covers proven strategies for identifying and engaging potential customers for notary services.

## Target Market Identification

### Primary Target Markets
**Legal Services:**
- Law firms and attorneys
- Legal document preparation services
- Court reporting services
- Legal technology companies

**Real Estate:**
- Real estate agencies and brokers
- Title companies and escrow services
- Mortgage brokers and lenders
- Property management companies

**Financial Services:**
- Banks and credit unions
- Insurance companies
- Investment firms
- Financial advisors

**Healthcare:**
- Medical practices and clinics
- Healthcare systems
- Medical device companies
- Healthcare technology firms

### Secondary Target Markets
**Government:**
- Local government agencies
- State and federal offices
- Educational institutions
- Non-profit organizations

**Business Services:**
- Accounting firms
- Consulting companies
- Technology companies
- Manufacturing firms

## Prospecting Methods

### 1. Digital Prospecting
**LinkedIn Outreach:**
- Research target companies and decision-makers
- Connect with relevant professionals
- Share valuable content and insights
- Engage in industry discussions

**Email Campaigns:**
- Personalized email sequences
- Value-driven content and offers
- Follow-up and nurture campaigns
- A/B testing and optimization

**Social Media:**
- Industry-specific groups and forums
- Thought leadership content
- Engagement and relationship building
- Lead generation and qualification

### 2. Traditional Prospecting
**Cold Calling:**
- Targeted phone outreach
- Scripted and natural approaches
- Follow-up and persistence
- Appointment setting and qualification

**Networking Events:**
- Industry conferences and trade shows
- Local business events
- Professional associations
- Chamber of commerce meetings

**Referral Programs:**
- Customer referral incentives
- Partner referral programs
- Professional network referrals
- Word-of-mouth marketing

### 3. Content Marketing
**Educational Content:**
- Blog posts and articles
- White papers and case studies
- Webinars and presentations
- Video content and tutorials

**Thought Leadership:**
- Industry insights and trends
- Best practices and tips
- Regulatory updates and changes
- Technology innovations

## Prospecting Best Practices

### 1. Research and Preparation
**Company Research:**
- Company size and industry
- Recent news and developments
- Key decision-makers and influencers
- Current challenges and opportunities

**Individual Research:**
- Professional background and experience
- Current role and responsibilities
- Communication preferences
- Pain points and interests

### 2. Value-First Approach
**Educational Outreach:**
- Share relevant insights and information
- Provide helpful resources and tools
- Offer free consultations and assessments
- Demonstrate expertise and credibility

**Problem-Solving Focus:**
- Identify specific pain points
- Offer targeted solutions
- Provide immediate value
- Build trust and relationships

### 3. Consistent Follow-up
**Follow-up Sequences:**
- Multiple touchpoints over time
- Varied content and approaches
- Personalization and customization
- Persistence without being pushy

**Relationship Building:**
- Regular check-ins and updates
- Industry insights and information
- Event invitations and opportunities
- Long-term relationship development

## Prospecting Tools and Resources

### CRM and Tracking
**Lead Management:**
- Contact information and history
- Interaction tracking and notes
- Pipeline management and stages
- Follow-up scheduling and reminders

**Analytics and Reporting:**
- Prospecting activity tracking
- Conversion rates and metrics
- Performance analysis and optimization
- ROI measurement and improvement

### Content and Materials
**Sales Collateral:**
- Company overview and capabilities
- Service descriptions and benefits
- Case studies and testimonials
- Pricing and proposal templates

**Digital Assets:**
- Website and landing pages
- Social media profiles and content
- Email templates and sequences
- Presentation materials and demos

## Common Prospecting Mistakes

1. **Lack of Research**: Not understanding target market and customers
2. **Generic Approach**: One-size-fits-all messaging and outreach
3. **Insufficient Follow-up**: Not persisting with prospects
4. **Poor Timing**: Not considering optimal contact times
5. **No Value Proposition**: Leading with features instead of benefits

## Success Metrics

- **Lead Generation**: Number of qualified leads per month
- **Conversion Rates**: Percentage of leads that become opportunities
- **Response Rates**: Email and phone response percentages
- **Pipeline Value**: Total value of opportunities in pipeline
- **ROI**: Return on investment for prospecting activities

*Effective prospecting transforms cold contacts into warm relationships and qualified opportunities.*`,

  'Discovery Questions': `# Discovery Questions

## Key Questions to Uncover Customer Needs and Pain Points

Discovery is the most critical phase of the sales process. These questions help uncover customer needs, pain points, and decision-making criteria to tailor your solution effectively.

## Opening and Rapport Building

### Initial Engagement Questions
- "What's the biggest challenge you're facing with your current notary services?"
- "How do you currently handle document notarization for your clients?"
- "What would an ideal notary service solution look like for your organization?"
- "What's most important to you when selecting a notary service provider?"

### Understanding Current State
- "Tell me about your current notary service process."
- "How many documents do you typically need notarized per month?"
- "What types of documents require notarization most frequently?"
- "Who is responsible for coordinating notary services in your organization?"

## Pain Point Discovery

### Current Challenges
- "What's the most frustrating part of your current notary process?"
- "How much time does your team spend on notary-related tasks?"
- "What happens when you can't get documents notarized quickly?"
- "Have you ever lost a deal or client due to notary service delays?"

### Process Inefficiencies
- "How long does it typically take to get documents notarized?"
- "What's the cost of your current notary service approach?"
- "How often do you have to reschedule or delay meetings due to notary issues?"
- "What manual processes could be automated or streamlined?"

## Needs and Requirements

### Functional Requirements
- "What specific notary services do you need most often?"
- "Do you need mobile notary services or office-based services?"
- "What document types require notarization in your business?"
- "Do you need notary services for remote or virtual transactions?"

### Technical Requirements
- "What systems do you currently use for document management?"
- "Do you need integration with your existing software?"
- "What security and compliance requirements do you have?"
- "How do you currently track and manage notary transactions?"

## Decision-Making Process

### Stakeholder Identification
- "Who else is involved in the decision-making process?"
- "Who would be the primary users of the notary service?"
- "Who has the authority to approve this type of service?"
- "Are there any external advisors or consultants involved?"

### Decision Criteria
- "What factors are most important in your decision?"
- "How do you typically evaluate service providers?"
- "What would make this a 'must-have' vs. 'nice-to-have'?"
- "What would prevent you from moving forward with a solution?"

### Timeline and Urgency
- "When do you need to have this solution in place?"
- "What's driving the timeline for this decision?"
- "Are there any upcoming deadlines or events that affect timing?"
- "What happens if you don't solve this problem soon?"

## Budget and Resources

### Budget Questions
- "What budget range are you working with for notary services?"
- "How do you currently budget for notary-related expenses?"
- "What's the cost of not solving this problem?"
- "How do you measure ROI on service investments?"

### Resource Questions
- "Who would be responsible for implementing this solution?"
- "What internal resources are available for this project?"
- "Do you have any existing relationships with notary service providers?"
- "What support would you need during implementation?"

## Success and Outcomes

### Success Criteria
- "How would you measure success with a new notary service?"
- "What would make this solution a 'home run' for your organization?"
- "What specific outcomes are you hoping to achieve?"
- "How would this impact your team's productivity?"

### Future Vision
- "Where do you see your notary service needs in the next 2-3 years?"
- "How might your business growth affect notary service requirements?"
- "What other document-related challenges are you anticipating?"
- "How important is scalability and flexibility to your decision?"

## Objection Prevention

### Risk Assessment
- "What concerns do you have about changing notary service providers?"
- "What risks do you see with implementing a new solution?"
- "How do you typically handle service provider transitions?"
- "What would make you feel confident about this decision?"

### Competitive Questions
- "Are you evaluating other notary service providers?"
- "What other solutions have you considered?"
- "What do you like or dislike about your current approach?"
- "What would make one provider stand out from others?"

## Closing Questions

### Commitment and Next Steps
- "Based on what we've discussed, does this sound like something that could work for you?"
- "What would you need to see to feel confident moving forward?"
- "Who else would need to be involved in the next steps?"
- "What would be the best way to continue this conversation?"

### Timeline and Process
- "What would be the ideal timeline for making a decision?"
- "What information do you need to move forward?"
- "How would you like to proceed with the evaluation process?"
- "What would be the next logical step in this process?"

## Discovery Best Practices

### 1. Active Listening
- Listen more than you talk
- Ask follow-up questions
- Paraphrase to confirm understanding
- Take detailed notes

### 2. Open-Ended Questions
- Use "what," "how," "why," and "tell me about"
- Avoid yes/no questions
- Encourage detailed responses
- Explore deeper insights

### 3. Follow-Up and Clarification
- "Can you tell me more about that?"
- "What do you mean by...?"
- "How does that affect...?"
- "What's an example of...?"

*Effective discovery transforms prospects into qualified opportunities by understanding their real needs and challenges.*`
};

async function updateNotaryEverydayDocuments() {
  try {
    console.log('🚀 Starting comprehensive Notary Everyday document updates...');

    // Find the Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Notary Everyday' },
          { slug: 'ne' },
          { slug: 'notary-everyday' }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);

    // Find Ryan as the updater
    const ryan = await prisma.users.findFirst({
      where: { email: 'ryan@notaryeveryday.com' }
    });

    if (!ryan) {
      console.log('❌ Ryan user not found');
      return;
    }

    console.log(`✅ Found Ryan: ${ryan.name} (${ryan.id})`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Update each document with comprehensive content
    for (const [title, content] of Object.entries(notaryContentLibrary)) {
      // Find the document
      const document = await prisma.workshopDocument.findFirst({
        where: {
          title: title,
          workspaceId: workspace.id,
          deletedAt: null
        }
      });

      if (!document) {
        console.log(`❌ Document not found: ${title}`);
        continue;
      }

      // Update the document content
      await prisma.workshopDocument.update({
        where: { id: document.id },
        data: {
          content: {
            markdown: content,
            description: document.description,
            tags: document.tags
          },
          updatedAt: new Date()
        }
      });

      // Create activity record
      await prisma.workshopActivity.create({
        data: {
          documentId: document.id,
          activityType: 'UPDATED',
          description: `Updated ${title} with comprehensive notary service sales content`,
          performedById: ryan.id,
          metadata: {
            contentLength: content.length,
            updateType: 'comprehensive-content',
            platform: 'notary-everyday'
          }
        }
      });

      console.log(`✅ Updated document: ${title} (${content.length} characters)`);
      updatedCount++;
    }

    console.log(`\n🎉 Notary Everyday document updates completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Documents updated: ${updatedCount}`);
    console.log(`   - Documents skipped: ${skippedCount}`);
    console.log(`   - Platform: Notary Everyday Sales Enablement`);

  } catch (error) {
    console.error('❌ Error updating Notary Everyday documents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the updates
updateNotaryEverydayDocuments();
