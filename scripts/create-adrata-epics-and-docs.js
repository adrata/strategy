#!/usr/bin/env node

/**
 * Create Epics and Strategy Documents for Adrata Workspace
 * 
 * This script:
 * 1. Fetches all stories from the Adrata workspace
 * 2. Analyzes and groups them into logical epics
 * 3. Creates epics for each group
 * 4. Associates stories with their respective epics
 * 5. Creates 3 core strategy documents (papers/pitches)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

// Epic categories based on Adrata platform structure
const EPIC_CATEGORIES = {
  'Platform Core': {
    keywords: ['platform', 'core', 'infrastructure', 'architecture', 'system', 'foundation', 'base'],
    description: 'Core platform infrastructure and foundational systems'
  },
  'AI & Intelligence': {
    keywords: ['ai', 'intelligence', 'monaco', 'machine learning', 'analytics', 'insights', 'prediction', 'ml'],
    description: 'AI-powered intelligence and analytics capabilities'
  },
  'Data Acquisition': {
    keywords: ['data', 'acquisition', 'enrichment', 'brightdata', 'scraping', 'collection', 'import', 'sync'],
    description: 'Data collection, enrichment, and integration pipelines'
  },
  'Action Platform': {
    keywords: ['action', 'outbox', 'acquire', 'workflow', 'automation', 'process', 'pipeline'],
    description: 'Action Platform features for lead management and workflow automation'
  },
  'User Experience': {
    keywords: ['ui', 'ux', 'interface', 'design', 'user', 'frontend', 'dashboard', 'view', 'panel'],
    description: 'User interface and experience improvements'
  },
  'Stacks & Project Management': {
    keywords: ['stacks', 'project', 'story', 'task', 'backlog', 'epic', 'workstream', 'kanban'],
    description: 'Stacks project management and task tracking features'
  },
  'Grand Central': {
    keywords: ['grand central', 'unified', 'dashboard', 'consolidation', 'integration'],
    description: 'Grand Central unified dashboard and integration hub'
  },
  'Security & Compliance': {
    keywords: ['security', 'auth', 'authentication', 'authorization', 'permission', 'access', 'compliance', 'soc2'],
    description: 'Security, authentication, and compliance features'
  },
  'Performance & Optimization': {
    keywords: ['performance', 'optimization', 'speed', 'cache', 'query', 'database', 'index', 'fast'],
    description: 'Performance improvements and system optimizations'
  },
  'API & Integrations': {
    keywords: ['api', 'integration', 'webhook', 'external', 'third-party', 'connect', 'sync'],
    description: 'API development and external integrations'
  },
  'Mobile & Desktop': {
    keywords: ['mobile', 'desktop', 'app', 'tauri', 'electron', 'native', 'ios', 'android'],
    description: 'Mobile and desktop application development'
  },
  'Testing & Quality': {
    keywords: ['test', 'testing', 'qa', 'quality', 'bug', 'fix', 'error', 'validation'],
    description: 'Testing, quality assurance, and bug fixes'
  },
  'Other': {
    keywords: [],
    description: 'Other features and improvements'
  }
};

// Strategy documents content
const STRATEGY_DOCUMENTS = [
  {
    title: 'Adrata Platform Strategy & Vision',
    documentType: 'pitch',
    description: 'High-level strategic overview of Adrata platform vision, positioning, and value proposition',
    content: {
      sections: [
        {
          title: 'Executive Summary',
          content: `Adrata is a world-class, end-to-end business intelligence and sales automation platform that transforms raw data into strategic advantage. Our platform consists of 30+ integrated applications working in harmony to deliver unprecedented business insights and automation capabilities.

**Core Value Proposition:**
- Transform raw data into actionable intelligence
- Automate sales workflows and lead management
- Provide real-time insights and predictions
- Enable seamless collaboration and decision-making`
        },
        {
          title: 'Platform Architecture',
          content: `**4 Core Layers:**

1. **Data Acquisition Layer**
   - BrightData integration for web scraping
   - Multi-provider waterfall enrichment (Hunter.io, Prospeo, ContactOut)
   - Real-time data processing and quality scoring

2. **Monaco Intelligence Pipeline**
   - 30-step comprehensive analysis
   - Buyer group dynamics and organizational structure analysis
   - Decision journey mapping and competitive intelligence

3. **Strategic Memory Engine**
   - ML-powered business impact predictions
   - Real-time KPI tracking and performance analysis
   - Dynamic priority adjustment based on results

4. **Action Platform Interface**
   - Ultra-fast lead processing and management
   - Advanced prospecting and lead qualification
   - Real-time collaboration and insights sharing`
        },
        {
          title: 'Key Applications',
          content: `**Core Applications:**
- Action Platform: Lead management and workflow automation
- Monaco: Intelligence pipeline and analysis
- Grand Central: Unified dashboard and integration hub
- Stacks: Project management and task tracking
- Oasis: Analytics and reporting
- Speedrun: Rapid execution and delivery

**Departmental Applications:**
- Pulse, Garage, Vault, Navigate, Harmony, Shield, Tower

**Specialized Applications:**
- Nightlife analytics and multi-platform event management
- Enterprise provisioning and workflow automation`
        },
        {
          title: 'Market Position',
          content: `Adrata competes in the enterprise sales intelligence and automation market, positioned as:

- **Premium Intelligence Platform**: Comprehensive data analysis and insights
- **Automation Leader**: End-to-end workflow automation
- **Integration Hub**: Seamless connection with 30+ applications
- **AI-First**: Advanced machine learning and predictive analytics`
        },
        {
          title: 'Growth Strategy',
          content: `**Short-term (Q1-Q2 2025):**
- Enhance core platform stability and performance
- Expand AI capabilities and intelligence features
- Improve user experience and interface design
- Strengthen security and compliance (SOC 2)

**Long-term (Q3-Q4 2025):**
- Enterprise market expansion
- Advanced analytics and reporting
- Mobile and desktop application growth
- International market expansion`
        }
      ]
    }
  },
  {
    title: 'Adrata Technical Architecture & Implementation Plan',
    documentType: 'paper',
    description: 'Detailed technical architecture, implementation patterns, and development roadmap',
    content: {
      sections: [
        {
          title: 'System Architecture',
          content: `**Technology Stack:**
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with Prisma
- **Authentication**: NextAuth.js with JWT
- **Deployment**: Vercel with multi-environment support (develop, staging, main)

**Key Architectural Patterns:**
- Server Components for performance optimization
- Client Components for interactivity
- API Routes for backend logic
- Context Providers for state management
- Modular component architecture`
        },
        {
          title: 'Data Layer',
          content: `**Database Schema:**
- Workspaces: Multi-tenant workspace management
- Projects: Project organization within workspaces
- Stories: User stories and requirements
- Tasks: Task management and tracking
- Epics: Epic-level feature organization
- Epochs: Higher-level strategic initiatives

**Data Relationships:**
- Workspace → Projects → Epics → Stories → Tasks
- Stories can belong to Epics or directly to Projects
- Tasks can belong to Stories or directly to Projects`
        },
        {
          title: 'API Architecture',
          content: `**API Structure:**
- RESTful API design with Next.js API Routes
- Secure authentication using getSecureApiContext
- Workspace-scoped data access
- Error handling and logging
- Rate limiting and security headers

**Key Endpoints:**
- /api/stacks/projects: Project management
- /api/stacks/epics: Epic management
- /api/v1/stacks/stories: Story management
- /api/stacks/tasks: Task management
- /api/v1/stacks/vision: Vision documents`
        },
        {
          title: 'Frontend Architecture',
          content: `**Component Structure:**
- Platform UI components in /platform/ui
- Product-specific components in /products
- Frontend components in /frontend
- Shared utilities and hooks

**State Management:**
- React Context for global state (StacksProvider)
- Zustand for complex state management
- React Query for server state
- Local state with useState/useReducer`
        },
        {
          title: 'Performance Optimization',
          content: `**Optimization Strategies:**
- Code splitting with dynamic imports
- Image optimization with next/image
- Server Components for reduced client bundle
- Caching strategies for API responses
- Database query optimization
- Index optimization for frequent queries`
        },
        {
          title: 'Security Implementation',
          content: `**Security Measures:**
- Authentication via NextAuth.js
- Authorization with workspace access control
- Input validation with Zod schemas
- SQL injection prevention via Prisma
- XSS protection with React
- CSRF protection
- Secure headers (HSTS, CSP, X-Frame-Options)`
        },
        {
          title: 'Implementation Roadmap',
          content: `**Phase 1: Foundation (Completed)**
- Core platform infrastructure
- Basic CRUD operations
- Authentication and authorization
- Workspace management

**Phase 2: Core Features (In Progress)**
- Epic and story organization
- Task management
- Vision documents
- Project tracking

**Phase 3: Advanced Features (Planned)**
- Advanced analytics
- AI-powered insights
- Enhanced automation
- Mobile applications`
        }
      ]
    }
  },
  {
    title: 'Adrata Market Strategy & Competitive Analysis',
    documentType: 'paper',
    description: 'Market positioning, competitive analysis, and go-to-market strategy',
    content: {
      sections: [
        {
          title: 'Market Overview',
          content: `**Target Markets:**
- Enterprise sales teams seeking intelligence and automation
- B2B companies with complex sales processes
- Organizations requiring advanced data analysis
- Companies needing workflow automation

**Market Size:**
- Global sales intelligence market: $2.1B (2024)
- Sales automation market: $5.8B (2024)
- Expected CAGR: 15-20% through 2028`
        },
        {
          title: 'Competitive Landscape',
          content: `**Primary Competitors:**
- Salesforce: CRM and sales automation
- HubSpot: Marketing and sales platform
- Outreach: Sales engagement platform
- LinkedIn Sales Navigator: Lead intelligence

**Competitive Advantages:**
- **Integrated Platform**: 30+ applications in one ecosystem
- **AI-Powered**: Advanced intelligence and predictions
- **Customizable**: Flexible architecture for different use cases
- **Performance**: Optimized for speed and efficiency
- **Modern Stack**: Built on latest technologies`
        },
        {
          title: 'Value Proposition',
          content: `**For Sales Teams:**
- Comprehensive lead intelligence
- Automated workflow management
- Real-time insights and predictions
- Seamless collaboration tools

**For Executives:**
- Strategic business intelligence
- Performance tracking and KPIs
- Data-driven decision making
- Competitive intelligence

**For Developers:**
- Modern, scalable architecture
- API-first design
- Extensible platform
- Developer-friendly tools`
        },
        {
          title: 'Go-to-Market Strategy',
          content: `**Phase 1: Product-Market Fit**
- Focus on core platform stability
- Enhance user experience
- Gather customer feedback
- Iterate based on usage patterns

**Phase 2: Market Expansion**
- Enterprise sales outreach
- Strategic partnerships
- Industry-specific solutions
- International expansion

**Phase 3: Market Leadership**
- Advanced feature development
- Market thought leadership
- Community building
- Innovation leadership`
        },
        {
          title: 'Pricing Strategy',
          content: `**Pricing Model:**
- Workspace-based pricing
- Tiered feature access
- Usage-based add-ons
- Enterprise custom pricing

**Value Metrics:**
- Number of workspaces
- Data volume processed
- API usage
- Advanced features enabled`
        },
        {
          title: 'Customer Success',
          content: `**Success Metrics:**
- Customer retention rate
- Feature adoption rate
- User engagement
- Time to value

**Support Strategy:**
- Comprehensive documentation
- Developer resources
- Community support
- Enterprise support options`
        }
      ]
    }
  }
];

// Function to categorize a story into an epic
function categorizeStory(story) {
  const title = (story.title || '').toLowerCase();
  const description = (story.description || '').toLowerCase();
  const combined = `${title} ${description}`;
  
  // Score each category
  const scores = {};
  for (const [category, config] of Object.entries(EPIC_CATEGORIES)) {
    scores[category] = 0;
    for (const keyword of config.keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        scores[category] += 1;
      }
    }
  }
  
  // Find the category with the highest score
  let maxScore = 0;
  let bestCategory = 'Other';
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }
  
  return bestCategory;
}

// Function to create epic
async function createEpic(projectId, title, description, priority = 'medium') {
  try {
    const epic = await prisma.stacksEpic.create({
      data: {
        projectId,
        title,
        description,
        status: 'todo',
        priority,
        product: null,
        section: null
      }
    });
    return epic;
  } catch (error) {
    console.error(`Error creating epic "${title}":`, error);
    throw error;
  }
}

// Function to update story with epicId
async function associateStoryWithEpic(storyId, epicId) {
  try {
    await prisma.stacksStory.update({
      where: { id: storyId },
      data: { epicId }
    });
  } catch (error) {
    console.error(`Error associating story ${storyId} with epic ${epicId}:`, error);
    throw error;
  }
}

// Function to create vision document
async function createVisionDocument(workspaceId, userId, document) {
  try {
    const doc = await prisma.workshopDocument.create({
      data: {
        title: document.title,
        description: document.description,
        documentType: document.documentType,
        workspaceId,
        ownerId: userId,
        createdById: userId,
        content: document.content,
        fileType: 'application/json',
        status: 'published',
        tags: ['strategy', 'epics', 'adrata']
      }
    });
    return doc;
  } catch (error) {
    console.error(`Error creating vision document "${document.title}":`, error);
    throw error;
  }
}

// Main function
async function createEpicsAndDocs() {
  try {
    console.log('🚀 Creating Epics and Strategy Documents for Adrata Workspace\n');
    console.log('='.repeat(70));
    
    // Verify workspace
    const workspace = await prisma.workspaces.findUnique({
      where: { id: ADRATA_WORKSPACE_ID }
    });
    
    if (!workspace) {
      console.error(`❌ Workspace with ID ${ADRATA_WORKSPACE_ID} not found!`);
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.slug})\n`);
    
    // Get or create project
    let project = await prisma.stacksProject.findFirst({
      where: { workspaceId: ADRATA_WORKSPACE_ID }
    });
    
    if (!project) {
      console.log('📋 Creating default project...');
      project = await prisma.stacksProject.create({
        data: {
          workspaceId: ADRATA_WORKSPACE_ID,
          name: 'Adrata Platform',
          description: 'Main project for Adrata workspace'
        }
      });
      console.log(`✅ Created project: ${project.name}\n`);
    } else {
      console.log(`✅ Using existing project: ${project.name}\n`);
    }
    
    // Fetch all stories
    console.log('📝 Fetching stories...');
    const stories = await prisma.stacksStory.findMany({
      where: {
        project: {
          workspaceId: ADRATA_WORKSPACE_ID
        }
      },
      include: {
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Found ${stories.length} stories\n`);
    
    if (stories.length === 0) {
      console.log('⚠️  No stories found. Creating epics without story associations.\n');
    } else {
      // Categorize stories
      console.log('📊 Categorizing stories into epics...');
      const categorizedStories = {};
      
      for (const story of stories) {
        const category = categorizeStory(story);
        if (!categorizedStories[category]) {
          categorizedStories[category] = [];
        }
        categorizedStories[category].push(story);
      }
      
      console.log('\n📈 Story Distribution:');
      for (const [category, categoryStories] of Object.entries(categorizedStories)) {
        console.log(`   ${category}: ${categoryStories.length} stories`);
      }
      console.log('');
      
      // Create epics for each category
      console.log('🎯 Creating epics...');
      const epicMap = {};
      
      for (const [category, categoryStories] of Object.entries(categorizedStories)) {
        if (categoryStories.length === 0) continue;
        
        const config = EPIC_CATEGORIES[category];
        const epicTitle = category;
        const epicDescription = `${config.description}\n\nContains ${categoryStories.length} stories.`;
        
        // Determine priority based on story count
        let priority = 'medium';
        if (categoryStories.length >= 10) priority = 'high';
        else if (categoryStories.length <= 2) priority = 'low';
        
        try {
          const epic = await createEpic(project.id, epicTitle, epicDescription, priority);
          epicMap[category] = epic;
          console.log(`   ✅ Created epic: "${epicTitle}" (${categoryStories.length} stories})`);
          
          // Associate stories with epic
          for (const story of categoryStories) {
            await associateStoryWithEpic(story.id, epic.id);
          }
          console.log(`      Associated ${categoryStories.length} stories`);
        } catch (error) {
          console.error(`   ❌ Failed to create epic "${epicTitle}":`, error.message);
        }
      }
      
      console.log('\n✅ Epics created and stories associated\n');
    }
    
    // Create strategy documents
    console.log('📄 Creating strategy documents...');
    
    // Get a user from the workspace for document ownership
    const workspaceUser = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        isActive: true
      },
      include: {
        user: true
      }
    });
    
    if (!workspaceUser) {
      console.error('❌ No active users found in workspace. Cannot create documents.');
      return;
    }
    
    const userId = workspaceUser.userId;
    
    for (const doc of STRATEGY_DOCUMENTS) {
      try {
        const createdDoc = await createVisionDocument(ADRATA_WORKSPACE_ID, userId, doc);
        console.log(`   ✅ Created ${doc.documentType}: "${doc.title}"`);
      } catch (error) {
        console.error(`   ❌ Failed to create document "${doc.title}":`, error.message);
      }
    }
    
    console.log('\n✅ Strategy documents created\n');
    
    // Summary
    console.log('='.repeat(70));
    console.log('📊 Summary:');
    console.log(`   Workspace: ${workspace.name}`);
    console.log(`   Project: ${project.name}`);
    console.log(`   Stories processed: ${stories.length}`);
    
    // Count epics if they were created
    if (stories.length > 0) {
      const epicCount = await prisma.stacksEpic.count({
        where: { projectId: project.id }
      });
      console.log(`   Epics created: ${epicCount}`);
    } else {
      console.log(`   Epics created: 0 (no stories to categorize)`);
    }
    
    console.log(`   Strategy documents created: ${STRATEGY_DOCUMENTS.length}`);
    console.log('='.repeat(70));
    console.log('\n✅ All done!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createEpicsAndDocs();

