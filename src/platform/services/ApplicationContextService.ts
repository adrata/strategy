/**
 * 🧠 APPLICATION CONTEXT SERVICE
 * 
 * Centralized service for mapping application sections to their purposes,
 * capabilities, and AI guidance. Provides comprehensive context awareness
 * for the AI assistant across all application areas.
 */

export interface SectionContext {
  name: string;
  purpose: string;
  capabilities: string[];
  commonTasks: string[];
  aiGuidance: string;
  examples: string[];
  dataTypes?: string[];
  relatedSections?: string[];
}

export interface PageContext {
  primaryApp: string;
  secondarySection: string;
  detailView: string;
  breadcrumb: string;
  fullPath: string;
  isDetailPage: boolean;
  itemId?: string;
  itemName?: string;
  viewType?: 'list' | 'detail' | 'form' | 'editor';
  filters?: Record<string, any>;
}

export class ApplicationContextService {
  private static sectionMap: Map<string, SectionContext> = new Map([
    // PIPELINE SECTIONS
    ['leads', {
      name: 'Leads',
      purpose: 'Manage and qualify new potential customers',
      capabilities: ['Lead qualification', 'Contact enrichment', 'Status tracking', 'Follow-up management'],
      commonTasks: ['Qualify leads', 'Enrich contact data', 'Set follow-up reminders', 'Move to prospect stage'],
      aiGuidance: 'Help with lead qualification, data enrichment, and conversion strategies. Focus on identifying high-value prospects and creating effective outreach sequences.',
      examples: [
        'What should I know about this lead before calling?',
        'How do I qualify this lead as a real prospect?',
        'Create a follow-up sequence for this lead',
        'What objections might this lead have?'
      ],
      dataTypes: ['Contact info', 'Company data', 'Engagement history', 'Lead source'],
      relatedSections: ['prospects', 'companies', 'people']
    }],

    ['prospects', {
      name: 'Prospects',
      purpose: 'Manage qualified leads moving through the sales process',
      capabilities: ['Pipeline management', 'Deal progression', 'Stakeholder mapping', 'Decision process tracking'],
      commonTasks: ['Advance deals', 'Map stakeholders', 'Create proposals', 'Handle objections'],
      aiGuidance: 'Assist with deal advancement, stakeholder analysis, and closing strategies. Help identify decision makers and create compelling value propositions.',
      examples: [
        'Who are the key stakeholders at this company?',
        'How do I advance this deal to the next stage?',
        'What objections might they have?',
        'Create a proposal strategy for this prospect'
      ],
      dataTypes: ['Deal stages', 'Stakeholder info', 'Decision criteria', 'Timeline'],
      relatedSections: ['opportunities', 'companies', 'people']
    }],

    ['companies', {
      name: 'Companies',
      purpose: 'Manage company accounts and relationships',
      capabilities: ['Account management', 'Relationship building', 'Expansion opportunities', 'Account health monitoring'],
      commonTasks: ['Build relationships', 'Identify expansion opportunities', 'Monitor account health', 'Create account plans'],
      aiGuidance: 'Help with account strategy, relationship building, and identifying expansion opportunities. Focus on long-term value and account growth.',
      examples: [
        'What expansion opportunities exist at this company?',
        'How can I strengthen our relationship?',
        'Who else should I be talking to here?',
        'What are their business priorities?'
      ],
      dataTypes: ['Company info', 'Relationship history', 'Expansion opportunities', 'Account health'],
      relatedSections: ['people', 'opportunities', 'prospects']
    }],

    ['people', {
      name: 'People',
      purpose: 'Manage individual contacts and relationships',
      capabilities: ['Contact management', 'Relationship tracking', 'Communication history', 'Personal insights'],
      commonTasks: ['Build personal relationships', 'Track communication', 'Identify influencers', 'Maintain contact info'],
      aiGuidance: 'Assist with relationship building, communication strategies, and personal insights. Help understand individual motivations and communication preferences.',
      examples: [
        'How can I build a better relationship with this person?',
        'What communication style works best for them?',
        'Who do they report to?',
        'What are their personal interests?'
      ],
      dataTypes: ['Personal info', 'Communication history', 'Preferences', 'Influence level'],
      relatedSections: ['companies', 'leads', 'prospects']
    }],

    ['opportunities', {
      name: 'Opportunities',
      purpose: 'Track and manage active sales opportunities',
      capabilities: ['Deal tracking', 'Forecasting', 'Risk assessment', 'Closing strategies'],
      commonTasks: ['Track deal progress', 'Assess risks', 'Create closing plans', 'Forecast revenue'],
      aiGuidance: 'Help with deal management, risk assessment, and closing strategies. Focus on moving deals forward and identifying potential issues.',
      examples: [
        'What risks should I watch for in this deal?',
        'How do I accelerate this opportunity?',
        'What closing strategies work best here?',
        'How likely is this deal to close?'
      ],
      dataTypes: ['Deal value', 'Probability', 'Timeline', 'Competition'],
      relatedSections: ['prospects', 'companies', 'people']
    }],

    ['clients', {
      name: 'Clients',
      purpose: 'Manage existing customer relationships',
      capabilities: ['Customer success', 'Renewal management', 'Upselling', 'Support tracking'],
      commonTasks: ['Ensure customer success', 'Manage renewals', 'Identify upsell opportunities', 'Track satisfaction'],
      aiGuidance: 'Focus on customer success, retention, and growth. Help identify upsell opportunities and ensure customer satisfaction.',
      examples: [
        'How can I improve this client\'s success?',
        'What upsell opportunities exist?',
        'How do I ensure renewal?',
        'What support do they need?'
      ],
      dataTypes: ['Usage data', 'Satisfaction scores', 'Renewal dates', 'Growth potential'],
      relatedSections: ['companies', 'people', 'opportunities']
    }],

    ['sellers', {
      name: 'Sellers',
      purpose: 'Manage sales team performance and activities',
      capabilities: ['Performance tracking', 'Activity monitoring', 'Coaching', 'Goal management'],
      commonTasks: ['Track performance', 'Provide coaching', 'Set goals', 'Monitor activities'],
      aiGuidance: 'Help with sales team management, performance optimization, and coaching strategies. Focus on improving team effectiveness.',
      examples: [
        'How can I improve this seller\'s performance?',
        'What coaching does this seller need?',
        'How do I set effective goals?',
        'What activities drive results?'
      ],
      dataTypes: ['Performance metrics', 'Activity data', 'Goals', 'Coaching notes'],
      relatedSections: ['leads', 'prospects', 'opportunities']
    }],

    ['speedrun', {
      name: 'Speedrun',
      purpose: 'Rapid lead processing and qualification',
      capabilities: ['Quick qualification', 'Bulk processing', 'Fast follow-up', 'Efficiency tools'],
      commonTasks: ['Process leads quickly', 'Qualify in bulk', 'Set rapid follow-ups', 'Optimize efficiency'],
      aiGuidance: 'Focus on speed and efficiency in lead processing. Help optimize workflows and reduce time-to-contact.',
      examples: [
        'How can I process these leads faster?',
        'What\'s the quickest way to qualify?',
        'How do I optimize my workflow?',
        'What tools can speed this up?'
      ],
      dataTypes: ['Lead volume', 'Processing time', 'Conversion rates', 'Efficiency metrics'],
      relatedSections: ['leads', 'prospects']
    }],

    ['metrics', {
      name: 'Metrics',
      purpose: 'Track sales performance and analytics',
      capabilities: ['Performance analysis', 'Trend identification', 'Forecasting', 'Reporting'],
      commonTasks: ['Analyze performance', 'Identify trends', 'Create forecasts', 'Generate reports'],
      aiGuidance: 'Help analyze sales data, identify trends, and create actionable insights. Focus on data-driven decision making.',
      examples: [
        'What trends do you see in our data?',
        'How can I improve our conversion rate?',
        'What should I focus on this quarter?',
        'How do I forecast next month?'
      ],
      dataTypes: ['Performance data', 'Trends', 'Forecasts', 'KPIs'],
      relatedSections: ['leads', 'prospects', 'opportunities', 'sellers']
    }],

    // DATABASE SECTIONS
    ['database', {
      name: 'Database',
      purpose: 'Manage data structure, schemas, and relationships',
      capabilities: ['Schema management', 'Data modeling', 'Relationship mapping', 'Query optimization'],
      commonTasks: ['Design schemas', 'Create relationships', 'Optimize queries', 'Manage data integrity'],
      aiGuidance: 'Help with database design, schema optimization, and data modeling. Focus on best practices and performance.',
      examples: [
        'How should I structure this data?',
        'What relationships should I create?',
        'How can I optimize this query?',
        'What\'s the best way to model this?'
      ],
      dataTypes: ['Tables', 'Relationships', 'Indexes', 'Constraints'],
      relatedSections: ['tables', 'objects', 'attributes', 'relationships']
    }],

    ['tables', {
      name: 'Tables',
      purpose: 'Manage database tables and their structure',
      capabilities: ['Table design', 'Column management', 'Index optimization', 'Data validation'],
      commonTasks: ['Create tables', 'Modify schemas', 'Add indexes', 'Validate data'],
      aiGuidance: 'Assist with table design, schema modifications, and data validation. Focus on performance and data integrity.',
      examples: [
        'How should I design this table?',
        'What indexes do I need?',
        'How do I validate this data?',
        'What\'s the best column type?'
      ],
      dataTypes: ['Table schemas', 'Column definitions', 'Indexes', 'Constraints'],
      relatedSections: ['database', 'objects', 'attributes']
    }],

    ['objects', {
      name: 'Objects',
      purpose: 'Manage data objects and their properties',
      capabilities: ['Object modeling', 'Property management', 'Inheritance', 'Validation'],
      commonTasks: ['Create objects', 'Define properties', 'Set up inheritance', 'Add validation'],
      aiGuidance: 'Help with object-oriented data modeling, property definitions, and inheritance structures.',
      examples: [
        'How should I model this object?',
        'What properties does it need?',
        'How do I set up inheritance?',
        'What validation rules apply?'
      ],
      dataTypes: ['Object definitions', 'Properties', 'Methods', 'Inheritance'],
      relatedSections: ['database', 'tables', 'attributes']
    }],

    ['attributes', {
      name: 'Attributes',
      purpose: 'Define and manage data attributes',
      capabilities: ['Attribute definition', 'Type management', 'Validation rules', 'Default values'],
      commonTasks: ['Create attributes', 'Set types', 'Define validation', 'Configure defaults'],
      aiGuidance: 'Assist with attribute design, type selection, and validation rules. Focus on data quality and consistency.',
      examples: [
        'What type should this attribute be?',
        'How do I validate this field?',
        'What default value makes sense?',
        'How do I handle null values?'
      ],
      dataTypes: ['Attribute definitions', 'Types', 'Validation rules', 'Defaults'],
      relatedSections: ['database', 'tables', 'objects']
    }],

    ['relationships', {
      name: 'Relationships',
      purpose: 'Define and manage data relationships',
      capabilities: ['Relationship modeling', 'Cardinality definition', 'Referential integrity', 'Cascade rules'],
      commonTasks: ['Create relationships', 'Set cardinality', 'Define constraints', 'Configure cascades'],
      aiGuidance: 'Help with relationship design, referential integrity, and cascade rules. Focus on data consistency and performance.',
      examples: [
        'What type of relationship is this?',
        'How do I set up referential integrity?',
        'What cascade rules should I use?',
        'How do I optimize this relationship?'
      ],
      dataTypes: ['Relationship definitions', 'Cardinality', 'Constraints', 'Cascade rules'],
      relatedSections: ['database', 'tables', 'objects']
    }],

    // GRAND CENTRAL SECTIONS
    ['grand-central', {
      name: 'Grand Central',
      purpose: 'Manage integrations, APIs, and data connections',
      capabilities: ['Integration management', 'API configuration', 'Data synchronization', 'Workflow automation'],
      commonTasks: ['Configure integrations', 'Set up APIs', 'Sync data', 'Automate workflows'],
      aiGuidance: 'Help with integration setup, API configuration, and data synchronization. Focus on connecting systems and automating workflows.',
      examples: [
        'How do I set up this integration?',
        'What API endpoints do I need?',
        'How do I sync this data?',
        'What workflows can I automate?'
      ],
      dataTypes: ['API configurations', 'Integration settings', 'Sync rules', 'Workflow definitions'],
      relatedSections: ['apis', 'connectors', 'mcps', 'workshop']
    }],

    ['apis', {
      name: 'APIs',
      purpose: 'Manage API integrations and endpoints',
      capabilities: ['API configuration', 'Authentication setup', 'Endpoint management', 'Rate limiting'],
      commonTasks: ['Configure APIs', 'Set up auth', 'Manage endpoints', 'Monitor usage'],
      aiGuidance: 'Assist with API integration, authentication, and endpoint management. Focus on reliable and secure connections.',
      examples: [
        'How do I authenticate with this API?',
        'What endpoints should I use?',
        'How do I handle rate limits?',
        'How do I monitor API health?'
      ],
      dataTypes: ['API keys', 'Endpoints', 'Authentication', 'Usage metrics'],
      relatedSections: ['grand-central', 'connectors']
    }],

    ['connectors', {
      name: 'Connectors',
      purpose: 'Manage data connectors and integrations',
      capabilities: ['Connector setup', 'Data mapping', 'Sync configuration', 'Error handling'],
      commonTasks: ['Set up connectors', 'Map data fields', 'Configure sync', 'Handle errors'],
      aiGuidance: 'Help with connector configuration, data mapping, and synchronization. Focus on reliable data flow.',
      examples: [
        'How do I map these fields?',
        'What sync frequency should I use?',
        'How do I handle sync errors?',
        'What data transformations are needed?'
      ],
      dataTypes: ['Connector configs', 'Field mappings', 'Sync schedules', 'Error logs'],
      relatedSections: ['grand-central', 'apis']
    }],

    ['mcps', {
      name: 'MCPs',
      purpose: 'Manage Model Context Protocol servers',
      capabilities: ['MCP configuration', 'Context management', 'Protocol setup', 'Server monitoring'],
      commonTasks: ['Configure MCPs', 'Set up context', 'Monitor servers', 'Troubleshoot issues'],
      aiGuidance: 'Help with MCP setup, context configuration, and server management. Focus on AI model integration.',
      examples: [
        'How do I configure this MCP?',
        'What context should I provide?',
        'How do I monitor the server?',
        'What protocols are supported?'
      ],
      dataTypes: ['MCP configs', 'Context data', 'Server status', 'Protocol info'],
      relatedSections: ['grand-central', 'apis']
    }],

    ['workshop', {
      name: 'Workshop',
      purpose: 'Document management and collaboration',
      capabilities: ['Document storage', 'Version control', 'Collaboration', 'Search and organization'],
      commonTasks: ['Organize documents', 'Manage versions', 'Enable collaboration', 'Search content'],
      aiGuidance: 'Help with document organization, collaboration workflows, and content management. Focus on knowledge sharing and organization.',
      examples: [
        'How should I organize these documents?',
        'What collaboration features are available?',
        'How do I set up version control?',
        'How can I improve search?'
      ],
      dataTypes: ['Documents', 'Versions', 'Collaboration data', 'Search indexes'],
      relatedSections: ['grand-central', 'docs']
    }],

    // OLYMPUS SECTIONS
    ['olympus', {
      name: 'Olympus',
      purpose: 'Workflow automation and process management',
      capabilities: ['Workflow design', 'Process automation', 'Task management', 'Integration orchestration'],
      commonTasks: ['Design workflows', 'Automate processes', 'Manage tasks', 'Orchestrate integrations'],
      aiGuidance: 'Help with workflow design, process automation, and task management. Focus on efficiency and automation.',
      examples: [
        'How do I design this workflow?',
        'What processes can I automate?',
        'How do I optimize this workflow?',
        'What integrations do I need?'
      ],
      dataTypes: ['Workflow definitions', 'Process steps', 'Task data', 'Integration configs'],
      relatedSections: ['all-workflows', 'buyer-group', 'company', 'person', 'role']
    }],

    ['all-workflows', {
      name: 'All Workflows',
      purpose: 'Manage and monitor all workflow processes',
      capabilities: ['Workflow monitoring', 'Performance tracking', 'Error handling', 'Optimization'],
      commonTasks: ['Monitor workflows', 'Track performance', 'Handle errors', 'Optimize processes'],
      aiGuidance: 'Help with workflow monitoring, performance optimization, and error resolution. Focus on reliability and efficiency.',
      examples: [
        'How do I monitor workflow performance?',
        'What errors should I watch for?',
        'How do I optimize this workflow?',
        'What metrics should I track?'
      ],
      dataTypes: ['Workflow status', 'Performance metrics', 'Error logs', 'Optimization data'],
      relatedSections: ['olympus', 'buyer-group', 'company', 'person', 'role']
    }],

    ['buyer-group', {
      name: 'Buyer Group Intelligence',
      purpose: 'Manage buyer group intelligence workflows and processes',
      capabilities: ['Group intelligence management', 'Process automation', 'Communication workflows', 'Decision tracking'],
      commonTasks: ['Manage buyer group intelligence', 'Automate communications', 'Track decisions', 'Optimize processes'],
      aiGuidance: 'Help with Buyer Group Intelligence management, communication workflows, and decision tracking. Always refer to this feature as "Buyer Group Intelligence" (proper noun with capital letters). Focus on group dynamics and intelligence processes.',
      examples: [
        'How do I manage this Buyer Group Intelligence?',
        'What communication workflows work best for Buyer Group Intelligence?',
        'How do I track group decisions in Buyer Group Intelligence?',
        'What processes optimize Buyer Group Intelligence dynamics?'
      ],
      dataTypes: ['Group composition', 'Communication history', 'Decision records', 'Process metrics'],
      relatedSections: ['olympus', 'company', 'person']
    }],

    ['company', {
      name: 'Company',
      purpose: 'Company-specific workflows and processes',
      capabilities: ['Company workflows', 'Process customization', 'Integration management', 'Performance tracking'],
      commonTasks: ['Customize workflows', 'Manage integrations', 'Track performance', 'Optimize processes'],
      aiGuidance: 'Help with company-specific workflow customization, integration management, and performance optimization.',
      examples: [
        'How do I customize workflows for this company?',
        'What integrations work best?',
        'How do I track company performance?',
        'What processes need optimization?'
      ],
      dataTypes: ['Company configs', 'Workflow customizations', 'Integration settings', 'Performance data'],
      relatedSections: ['olympus', 'buyer-group', 'person']
    }],

    ['person', {
      name: 'Person',
      purpose: 'Individual person workflows and processes',
      capabilities: ['Personal workflows', 'Communication automation', 'Task management', 'Relationship tracking'],
      commonTasks: ['Create personal workflows', 'Automate communications', 'Manage tasks', 'Track relationships'],
      aiGuidance: 'Help with personal workflow creation, communication automation, and relationship management. Focus on individual efficiency.',
      examples: [
        'How do I create workflows for this person?',
        'What communication automation works?',
        'How do I manage their tasks?',
        'What relationship tracking is needed?'
      ],
      dataTypes: ['Personal configs', 'Communication rules', 'Task data', 'Relationship info'],
      relatedSections: ['olympus', 'buyer-group', 'company']
    }],

    ['role', {
      name: 'Role',
      purpose: 'Role-based workflows and processes',
      capabilities: ['Role workflows', 'Permission management', 'Process automation', 'Access control'],
      commonTasks: ['Define role workflows', 'Manage permissions', 'Automate processes', 'Control access'],
      aiGuidance: 'Help with role-based workflow design, permission management, and access control. Focus on security and efficiency.',
      examples: [
        'How do I design workflows for this role?',
        'What permissions are needed?',
        'How do I automate role processes?',
        'What access controls are required?'
      ],
      dataTypes: ['Role definitions', 'Permission sets', 'Process rules', 'Access controls'],
      relatedSections: ['olympus', 'person', 'company']
    }],

    // OTHER SECTIONS
    ['workshop', {
      name: 'Workshop',
      purpose: 'Document management and collaboration platform',
      capabilities: ['Document storage', 'Version control', 'Collaboration', 'Search and organization'],
      commonTasks: ['Organize documents', 'Manage versions', 'Enable collaboration', 'Search content'],
      aiGuidance: 'Help with document organization, collaboration workflows, and content management. Focus on knowledge sharing and organization.',
      examples: [
        'How should I organize these documents?',
        'What collaboration features are available?',
        'How do I set up version control?',
        'How can I improve search?'
      ],
      dataTypes: ['Documents', 'Versions', 'Collaboration data', 'Search indexes'],
      relatedSections: ['grand-central', 'docs']
    }],

    ['encode', {
      name: 'Encode',
      purpose: 'Code editor and development environment',
      capabilities: ['Code editing', 'File management', 'Version control', 'Development tools'],
      commonTasks: ['Edit code', 'Manage files', 'Control versions', 'Use development tools'],
      aiGuidance: 'Help with code development, file management, and development workflows. Focus on productivity and best practices.',
      examples: [
        'How do I optimize this code?',
        'What development tools are available?',
        'How do I manage file versions?',
        'What coding best practices apply?'
      ],
      dataTypes: ['Code files', 'Version history', 'Development configs', 'Tool settings'],
      relatedSections: ['tower', 'particle']
    }],

    ['tower', {
      name: 'Tower',
      purpose: 'Project and task management',
      capabilities: ['Project management', 'Task tracking', 'Team collaboration', 'Progress monitoring'],
      commonTasks: ['Manage projects', 'Track tasks', 'Collaborate with team', 'Monitor progress'],
      aiGuidance: 'Help with project management, task organization, and team collaboration. Focus on productivity and project success.',
      examples: [
        'How do I organize this project?',
        'What task management approach works best?',
        'How do I track team progress?',
        'What collaboration tools are available?'
      ],
      dataTypes: ['Projects', 'Tasks', 'Team data', 'Progress metrics'],
      relatedSections: ['stacks', 'encode']
    }],

    ['particle', {
      name: 'Particle',
      purpose: 'Component and UI management',
      capabilities: ['Component management', 'UI design', 'Asset organization', 'Design systems'],
      commonTasks: ['Manage components', 'Design UI', 'Organize assets', 'Create design systems'],
      aiGuidance: 'Help with component management, UI design, and design system creation. Focus on consistency and usability.',
      examples: [
        'How do I organize these components?',
        'What UI patterns work best?',
        'How do I create a design system?',
        'What assets do I need?'
      ],
      dataTypes: ['Components', 'UI elements', 'Assets', 'Design tokens'],
      relatedSections: ['encode', 'tower']
    }],

    ['action-guide', {
      name: 'Action Guide',
      purpose: 'Sales methodology and guidance system',
      capabilities: ['Methodology guidance', 'Best practices', 'Process templates', 'Performance coaching'],
      commonTasks: ['Follow methodology', 'Apply best practices', 'Use templates', 'Get coaching'],
      aiGuidance: 'Help with sales methodology, best practices, and performance coaching. Focus on sales effectiveness and process improvement.',
      examples: [
        'What methodology should I follow?',
        'What best practices apply here?',
        'How do I use this template?',
        'What coaching do I need?'
      ],
      dataTypes: ['Methodology rules', 'Best practices', 'Templates', 'Coaching data'],
      relatedSections: ['leads', 'prospects', 'opportunities']
    }],

    ['docs', {
      name: 'Docs',
      purpose: 'Documentation and knowledge management',
      capabilities: ['Documentation creation', 'Knowledge management', 'Content organization', 'Search and discovery'],
      commonTasks: ['Create documentation', 'Organize knowledge', 'Manage content', 'Enable search'],
      aiGuidance: 'Help with documentation creation, knowledge organization, and content management. Focus on clarity and discoverability.',
      examples: [
        'How do I structure this documentation?',
        'What content organization works best?',
        'How do I make this discoverable?',
        'What documentation standards apply?'
      ],
      dataTypes: ['Documents', 'Knowledge base', 'Content', 'Search indexes'],
      relatedSections: ['workshop', 'action-guide']
    }],

    ['stacks', {
      name: 'Stacks',
      purpose: 'Development backlog and issue management',
      capabilities: ['Backlog management', 'Issue tracking', 'Priority management', 'Progress monitoring'],
      commonTasks: ['Manage backlog', 'Track issues', 'Set priorities', 'Monitor progress'],
      aiGuidance: 'Help with backlog management, issue prioritization, and development progress tracking. Focus on efficiency and delivery.',
      examples: [
        'How do I prioritize this backlog?',
        'What issues need attention?',
        'How do I track development progress?',
        'What workflow optimizations help?'
      ],
      dataTypes: ['Backlog items', 'Issues', 'Priorities', 'Progress data'],
      relatedSections: ['tower', 'encode']
    }],

    ['chronicle', {
      name: 'Chronicle',
      purpose: 'Reporting and pitch creation',
      capabilities: ['Report generation', 'Pitch creation', 'Data visualization', 'Presentation tools'],
      commonTasks: ['Generate reports', 'Create pitches', 'Visualize data', 'Create presentations'],
      aiGuidance: 'Help with report creation, pitch development, and data visualization. Focus on compelling presentations and insights.',
      examples: [
        'How do I create an effective pitch?',
        'What data visualizations work best?',
        'How do I structure this report?',
        'What presentation techniques help?'
      ],
      dataTypes: ['Reports', 'Pitches', 'Visualizations', 'Presentations'],
      relatedSections: ['metrics', 'opportunities']
    }],

    ['news', {
      name: 'News',
      purpose: 'News and updates feed',
      capabilities: ['News aggregation', 'Update tracking', 'Content curation', 'Notification management'],
      commonTasks: ['Aggregate news', 'Track updates', 'Curate content', 'Manage notifications'],
      aiGuidance: 'Help with news aggregation, content curation, and update tracking. Focus on relevant and timely information.',
      examples: [
        'How do I find relevant news?',
        'What updates should I track?',
        'How do I curate content?',
        'What notification settings work best?'
      ],
      dataTypes: ['News items', 'Updates', 'Content', 'Notifications'],
      relatedSections: ['metrics', 'action-guide']
    }]
  ]);

  /**
   * Get comprehensive context for a given page
   */
  static getPageContextInfo(pageContext: PageContext): {
    sectionInfo: SectionContext | null;
    contextString: string;
    guidance: string;
    examples: string[];
  } {
    const { secondarySection, detailView, isDetailPage, itemId, itemName } = pageContext;
    
    // Get section information
    const sectionInfo = this.sectionMap.get(secondarySection) || null;
    
    // Build context string
    let contextString = `You are in the ${sectionInfo?.name || secondarySection} section`;
    
    if (detailView) {
      contextString += `, specifically viewing ${detailView}`;
    }
    
    if (isDetailPage && itemName) {
      contextString += `, looking at ${itemName}`;
    } else if (isDetailPage && itemId) {
      contextString += `, viewing item ${itemId}`;
    }
    
    // Add section-specific context
    if (sectionInfo) {
      contextString += `.\n\nThis section is for: ${sectionInfo.purpose}`;
      contextString += `\n\nKey capabilities: ${sectionInfo.capabilities.join(', ')}`;
      contextString += `\n\nCommon tasks: ${sectionInfo.commonTasks.join(', ')}`;
    }
    
    return {
      sectionInfo,
      contextString,
      guidance: sectionInfo?.aiGuidance || 'Provide general assistance with this section.',
      examples: sectionInfo?.examples || []
    };
  }

  /**
   * Get all available sections
   */
  static getAllSections(): SectionContext[] {
    return Array.from(this.sectionMap.values());
  }

  /**
   * Get section by name
   */
  static getSection(name: string): SectionContext | null {
    return this.sectionMap.get(name) || null;
  }

  /**
   * Check if a section exists
   */
  static hasSection(name: string): boolean {
    return this.sectionMap.has(name);
  }

  /**
   * Get related sections
   */
  static getRelatedSections(sectionName: string): SectionContext[] {
    const section = this.sectionMap.get(sectionName);
    if (!section?.relatedSections) return [];
    
    return section.relatedSections
      .map(name => this.sectionMap.get(name))
      .filter(Boolean) as SectionContext[];
  }
}
