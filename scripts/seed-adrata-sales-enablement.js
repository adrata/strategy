const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Adrata Buyer Group Intelligence Platform sales enablement documents
const adrataSalesEnablementDocs = [
  {
    filename: '01-buyer-group-intelligence-overview.md',
    title: 'Buyer Group Intelligence Platform Overview',
    description: 'Comprehensive guide to our buyer group intelligence platform and its core capabilities',
    tags: ['buyer-group', 'intelligence', 'platform', 'overview']
  },
  {
    filename: '02-go-to-buyer-operating-system.md',
    title: 'Go-to-Buyer Operating System',
    description: 'Complete guide to our go-to-buyer operating system and methodology',
    tags: ['go-to-buyer', 'operating-system', 'methodology', 'process']
  },
  {
    filename: '03-buyer-group-discovery.md',
    title: 'Buyer Group Discovery Process',
    description: 'How to identify and map buyer groups within target organizations',
    tags: ['discovery', 'buyer-group', 'mapping', 'identification']
  },
  {
    filename: '04-intelligence-gathering.md',
    title: 'Intelligence Gathering Techniques',
    description: 'Advanced techniques for gathering buyer group intelligence and insights',
    tags: ['intelligence', 'gathering', 'research', 'insights']
  },
  {
    filename: '05-buyer-persona-development.md',
    title: 'Buyer Persona Development',
    description: 'Creating detailed buyer personas and understanding decision-making dynamics',
    tags: ['buyer-persona', 'personas', 'decision-making', 'dynamics']
  },
  {
    filename: '06-influence-mapping.md',
    title: 'Influence Mapping & Power Dynamics',
    description: 'Mapping influence networks and understanding power dynamics within buyer groups',
    tags: ['influence', 'mapping', 'power-dynamics', 'networks']
  },
  {
    filename: '07-engagement-strategies.md',
    title: 'Buyer Group Engagement Strategies',
    description: 'Proven strategies for engaging buyer groups and building relationships',
    tags: ['engagement', 'strategies', 'relationships', 'buyer-groups']
  },
  {
    filename: '08-platform-demonstrations.md',
    title: 'Platform Demonstration Guide',
    description: 'How to effectively demonstrate the buyer group intelligence platform',
    tags: ['demonstration', 'platform', 'demo', 'showcase']
  },
  {
    filename: '09-value-proposition-framework.md',
    title: 'Value Proposition Framework',
    description: 'Articulating value propositions for buyer group intelligence solutions',
    tags: ['value-proposition', 'framework', 'positioning', 'benefits']
  },
  {
    filename: '10-implementation-roadmap.md',
    title: 'Implementation & Onboarding Roadmap',
    description: 'Step-by-step guide for implementing buyer group intelligence solutions',
    tags: ['implementation', 'onboarding', 'roadmap', 'deployment']
  },
  {
    filename: '11-roi-measurement.md',
    title: 'ROI Measurement & Success Metrics',
    description: 'How to measure ROI and success metrics for buyer group intelligence',
    tags: ['roi', 'measurement', 'metrics', 'success']
  },
  {
    filename: '12-competitive-positioning.md',
    title: 'Competitive Positioning Guide',
    description: 'Positioning against competitors in the buyer intelligence space',
    tags: ['competitive', 'positioning', 'differentiation', 'market']
  }
];

async function seedAdrataSalesEnablement() {
  try {
    console.log('🚀 Starting Adrata sales enablement document seeding...');

    // Find the Adrata workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Adrata' },
          { slug: 'adrata' }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ Adrata workspace not found');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);

    // Find users - use Ross as the creator
    const ross = await prisma.users.findFirst({
      where: { email: 'ross@adrata.com' }
    });

    const dan = await prisma.users.findFirst({
      where: { email: 'dan@adrata.com' }
    });

    const todd = await prisma.users.findFirst({
      where: { email: 'todd@adrata.com' }
    });

    if (!ross) {
      console.log('❌ Ross user not found');
      return;
    }

    console.log(`✅ Found Ross: ${ross.name} (${ross.id})`);

    // Ensure Dan and Todd are members of the workspace (they should already be)
    if (dan) {
      const danMembership = await prisma.workspace_users.findFirst({
        where: {
          userId: dan.id,
          workspaceId: workspace.id
        }
      });

      if (!danMembership) {
        await prisma.workspace_users.create({
          data: {
            userId: dan.id,
            workspaceId: workspace.id,
            role: 'MANAGER',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Added Dan to workspace`);
      } else {
        console.log(`✅ Dan already a member of workspace`);
      }
    }

    if (todd) {
      const toddMembership = await prisma.workspace_users.findFirst({
        where: {
          userId: todd.id,
          workspaceId: workspace.id
        }
      });

      if (!toddMembership) {
        await prisma.workspace_users.create({
          data: {
            userId: todd.id,
            workspaceId: workspace.id,
            role: 'MANAGER',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Added Todd to workspace`);
      } else {
        console.log(`✅ Todd already a member of workspace`);
      }
    }

    // Create a sales enablement folder
    let salesFolder = await prisma.workshopFolder.findFirst({
      where: {
        name: 'Sales Enablement',
        workspaceId: workspace.id
      }
    });

    if (!salesFolder) {
      salesFolder = await prisma.workshopFolder.create({
        data: {
          name: 'Sales Enablement',
          description: 'Sales enablement documents for Adrata buyer group intelligence platform',
          workspaceId: workspace.id,
          ownerId: ross.id
        }
      });
      console.log(`✅ Created Sales Enablement folder`);
    } else {
      console.log(`✅ Sales Enablement folder already exists`);
    }

    // Seed documents
    let createdCount = 0;
    let skippedCount = 0;

    for (const doc of adrataSalesEnablementDocs) {
      // Check if document already exists
      const existing = await prisma.workshopDocument.findFirst({
        where: {
          title: doc.title,
          workspaceId: workspace.id,
          deletedAt: null
        }
      });

      if (existing) {
        console.log(`⏭️  Skipping ${doc.title} - already exists`);
        skippedCount++;
        continue;
      }

      // Create comprehensive content for each document
      let content = '';
      
      switch (doc.filename) {
        case '01-buyer-group-intelligence-overview.md':
          content = `# Buyer Group Intelligence Platform Overview

## What is Buyer Group Intelligence?

Buyer Group Intelligence is our revolutionary platform that transforms how sales teams understand, engage, and sell to complex buyer groups within target organizations. Unlike traditional sales approaches that focus on individual contacts, our platform maps entire buyer ecosystems.

## Core Capabilities

### 1. Buyer Group Mapping
- **Complete Ecosystem View**: Map all stakeholders involved in purchasing decisions
- **Relationship Mapping**: Understand how buyers influence each other
- **Decision Process Flow**: Visualize the entire decision-making journey

### 2. Intelligence Gathering
- **Real-time Data**: Continuously updated intelligence on buyer groups
- **Behavioral Insights**: Track engagement patterns and preferences
- **Competitive Intelligence**: Monitor competitor interactions with buyer groups

### 3. Engagement Optimization
- **Personalized Outreach**: Tailored messaging for each buyer persona
- **Timing Optimization**: Know when and how to engage each stakeholder
- **Channel Selection**: Choose the most effective communication channels

## Key Benefits

- **Higher Win Rates**: 40% increase in deal closure rates
- **Faster Sales Cycles**: 30% reduction in sales cycle length
- **Better Deal Quality**: Higher average deal sizes and customer satisfaction
- **Reduced Churn**: Stronger relationships lead to better retention

## Target Use Cases

- Enterprise B2B sales
- Complex solution selling
- Long sales cycles
- Multi-stakeholder decisions
- High-value deals

*This document provides the foundation for understanding our buyer group intelligence platform.*`;
          break;

        case '02-go-to-buyer-operating-system.md':
          content = `# Go-to-Buyer Operating System

## The Adrata Go-to-Buyer Methodology

Our Go-to-Buyer Operating System is a comprehensive methodology that transforms how sales teams approach complex B2B sales by focusing on buyer groups rather than individual contacts.

## The Five Pillars

### 1. Discovery & Mapping
**Objective**: Understand the complete buyer ecosystem
- Identify all stakeholders
- Map relationships and influence
- Understand decision criteria
- Document buying process

### 2. Intelligence Gathering
**Objective**: Collect actionable insights
- Research buyer backgrounds
- Track engagement patterns
- Monitor competitive activity
- Gather behavioral data

### 3. Strategy Development
**Objective**: Create targeted engagement strategies
- Develop buyer personas
- Create messaging frameworks
- Plan engagement sequences
- Define success metrics

### 4. Execution & Engagement
**Objective**: Execute coordinated outreach
- Personalized communication
- Multi-channel engagement
- Relationship building
- Value demonstration

### 5. Optimization & Learning
**Objective**: Continuously improve performance
- Track engagement metrics
- Analyze win/loss patterns
- Refine strategies
- Share learnings

## Implementation Framework

### Phase 1: Foundation (Weeks 1-2)
- Platform setup and configuration
- Team training and certification
- Initial buyer group mapping

### Phase 2: Pilot (Weeks 3-6)
- Select pilot accounts
- Execute go-to-buyer process
- Measure initial results
- Gather feedback

### Phase 3: Scale (Weeks 7-12)
- Roll out to full team
- Optimize processes
- Share best practices
- Measure ROI

## Success Metrics

- **Engagement Rate**: % of buyer group members engaged
- **Response Rate**: % of outreach that generates responses
- **Meeting Rate**: % of responses that convert to meetings
- **Win Rate**: % of opportunities that close successfully
- **Cycle Time**: Average time from first contact to close

*This operating system ensures consistent, effective buyer group engagement across your entire sales organization.*`;
          break;

        case '03-buyer-group-discovery.md':
          content = `# Buyer Group Discovery Process

## Understanding Buyer Groups

A buyer group is a collection of individuals within an organization who collectively influence or make purchasing decisions. Understanding these groups is crucial for successful B2B sales.

## Types of Buyer Group Members

### 1. Economic Buyers
- **Role**: Control budget and final approval
- **Characteristics**: Senior executives, CFOs, department heads
- **Focus**: ROI, budget impact, strategic alignment

### 2. Technical Buyers
- **Role**: Evaluate technical feasibility and requirements
- **Characteristics**: IT directors, technical leads, architects
- **Focus**: Technical specifications, integration, security

### 3. User Buyers
- **Role**: Will use the solution daily
- **Characteristics**: End users, department managers
- **Focus**: Usability, functionality, workflow impact

### 4. Influencers
- **Role**: Influence decision without direct authority
- **Characteristics**: Consultants, advisors, internal champions
- **Focus**: Industry expertise, best practices, recommendations

## Discovery Process

### Step 1: Initial Research
- Company org chart analysis
- LinkedIn network mapping
- Industry research
- Recent company news

### Step 2: Stakeholder Identification
- Identify all potential buyers
- Map reporting relationships
- Understand roles and responsibilities
- Note external influences

### Step 3: Relationship Mapping
- Map internal relationships
- Identify influence networks
- Understand communication patterns
- Document decision dynamics

### Step 4: Validation & Refinement
- Confirm stakeholder roles
- Validate influence levels
- Update relationship maps
- Refine engagement strategies

## Discovery Tools & Techniques

### Platform Features
- **Org Chart Mapping**: Visual representation of buyer groups
- **Relationship Intelligence**: AI-powered relationship analysis
- **Engagement Tracking**: Monitor interaction patterns
- **Competitive Monitoring**: Track competitor interactions

### Research Methods
- **Social Media Analysis**: LinkedIn, Twitter, company blogs
- **News & Press Releases**: Recent company developments
- **Industry Reports**: Market trends and insights
- **Mutual Connections**: Leverage existing relationships

## Common Discovery Mistakes

1. **Focusing on Single Contacts**: Missing the broader buyer group
2. **Ignoring Influencers**: Underestimating indirect influence
3. **Static Mapping**: Not updating as relationships change
4. **One-Size-Fits-All**: Not tailoring approach to different buyer types

## Best Practices

- **Start Broad, Then Narrow**: Begin with all stakeholders, then focus
- **Validate Continuously**: Regularly confirm and update information
- **Leverage Multiple Sources**: Use various research methods
- **Document Everything**: Maintain detailed records of findings

*Effective buyer group discovery is the foundation of successful go-to-buyer strategies.*`;
          break;

        default:
          content = `# ${doc.title}\n\n${doc.description}\n\n---\n\n*This document is a placeholder. Please add the actual content for ${doc.title}.*`;
      }

      // Create the document
      const document = await prisma.workshopDocument.create({
        data: {
          title: doc.title,
          description: doc.description,
          content: {
            markdown: content,
            description: doc.description,
            tags: doc.tags
          },
          documentType: 'paper',
          status: 'published',
          folderId: salesFolder.id,
          tags: doc.tags,
          ownerId: ross.id,
          workspaceId: workspace.id,
          createdById: ross.id,
          reportType: 'SALES_ENABLEMENT',
          sourceRecordType: 'ENABLEMENT',
          generatedByAI: false,
          metadata: {
            category: 'sales-enablement',
            tags: doc.tags,
            filename: doc.filename,
            createdAt: new Date().toISOString(),
            platform: 'buyer-group-intelligence'
          }
        }
      });

      // Create activity record
      await prisma.workshopActivity.create({
        data: {
          documentId: document.id,
          activityType: 'CREATED',
          description: `Created Adrata sales enablement document: ${doc.title}`,
          performedById: ross.id,
          metadata: {
            filename: doc.filename,
            tags: doc.tags,
            platform: 'buyer-group-intelligence'
          }
        }
      });

      console.log(`✅ Created document: ${doc.title}`);
      createdCount++;
    }

    console.log(`\n🎉 Adrata sales enablement seeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Documents created: ${createdCount}`);
    console.log(`   - Documents skipped: ${skippedCount}`);
    console.log(`   - Total documents: ${adrataSalesEnablementDocs.length}`);
    console.log(`   - Platform: Buyer Group Intelligence`);

  } catch (error) {
    console.error('❌ Error seeding Adrata sales enablement documents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedAdrataSalesEnablement();
