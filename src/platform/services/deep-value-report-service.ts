import { authFetch } from '@/platform/api-fetch';

export interface DeepValueReport {
  id: string;
  title: string;
  type: 'company' | 'role' | 'industry' | 'buyer-group';
  description: string;
  category: string;
  isGenerating?: boolean;
  content?: string;
  generatedAt?: string;
  sourceRecordId?: string;
  sourceRecordType?: string;
  workspaceId?: string;
  userId?: string;
}

export interface ReportGenerationContext {
  // Person/Contact Info
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  
  // Company Info
  companyName: string;
  companyIndustry?: string;
  companySize?: string;
  companyRevenue?: string;
  companyEmployees?: number;
  
  // Intelligence Data
  influenceLevel?: string;
  engagementStrategy?: string;
  seniority?: string;
  isBuyerGroupMember?: boolean;
  
  // CoreSignal Data
  skills?: string[];
  experience?: any[];
  education?: any[];
  totalExperience?: number;
  
  // Related Records
  contacts?: any[];
  decisionMakers?: any[];
  leads?: any[];
  opportunities?: any[];
  
  // User's Product/Service Context
  userProduct?: string;
  userService?: string;
  userCompany?: string;
  
  // Raw record for additional context
  rawRecord: any;
}

export class DeepValueReportService {
  private static instance: DeepValueReportService;
  
  static getInstance(): DeepValueReportService {
    if (!DeepValueReportService.instance) {
      DeepValueReportService.instance = new DeepValueReportService();
    }
    return DeepValueReportService.instance;
  }

  /**
   * Generate all available report types for a record
   */
  async generateAllReports(record: any, recordType: string, workspaceId: string, userId: string): Promise<DeepValueReport[]> {
    const context = this.buildRecordContext(record, recordType);
    const reportTypes = this.getAvailableReportTypes(record, recordType);
    
    const reports: DeepValueReport[] = reportTypes.map(reportType => ({
      id: `${record.id}-${reportType.id}`,
      title: reportType.title,
      type: reportType.type,
      description: reportType.description,
      category: reportType.category,
      isGenerating: true,
      sourceRecordId: record.id,
      sourceRecordType: recordType,
      workspaceId,
      userId
    }));

    // Generate all reports in parallel
    const generationPromises = reports.map(async (report) => {
      try {
        const content = await this.generateReportContent(report, context, workspaceId, userId);
        return {
          ...report,
          content,
          isGenerating: false,
          generatedAt: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Failed to generate report ${report.id}:`, error);
        return {
          ...report,
          content: 'Failed to generate report. Please try again.',
          isGenerating: false,
          generatedAt: new Date().toISOString()
        };
      }
    });

    return Promise.all(generationPromises);
  }

  /**
   * Generate a single report with streaming support
   */
  async *streamReportGeneration(
    report: DeepValueReport, 
    context: ReportGenerationContext,
    workspaceId: string,
    userId: string
  ): AsyncGenerator<{ type: 'chunk' | 'complete' | 'error', content?: string, error?: string }> {
    try {
      yield { type: 'chunk', content: '# ' + report.title + '\n\n' };
      
      const prompt = this.buildReportPrompt(report, context);
      
      const response = await fetch('/api/ai-chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          appType: 'pipeline',
          workspaceId,
          userId,
          currentRecord: context.rawRecord,
          recordType: context.rawRecord.recordType || 'people',
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                yield { type: 'chunk', content: data.content };
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      yield { type: 'complete' };
    } catch (error) {
      console.error('Report generation error:', error);
      yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update a report with AI edits
   */
  async *updateReportWithAI(
    reportId: string,
    editInstruction: string,
    currentContent: string,
    context: ReportGenerationContext,
    workspaceId: string,
    userId: string
  ): AsyncGenerator<{ type: 'chunk' | 'complete' | 'error', content?: string, error?: string }> {
    try {
      const prompt = `Please update the following report based on this instruction: "${editInstruction}"

Current report content:
${currentContent}

Please provide the updated report content with the requested changes.`;

      const response = await fetch('/api/ai-chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          appType: 'pipeline',
          workspaceId,
          userId,
          currentRecord: context.rawRecord,
          recordType: context.rawRecord.recordType || 'people',
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                yield { type: 'chunk', content: data.content };
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      yield { type: 'complete' };
    } catch (error) {
      console.error('Report update error:', error);
      yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Save report to Workshop
   */
  async saveReportToWorkshop(report: DeepValueReport, content: string): Promise<string> {
    try {
      const response = await authFetch('/api/workshop/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: report.title,
          content,
          type: 'paper',
          reportType: report.type,
          sourceRecordId: report.sourceRecordId,
          sourceRecordType: report.sourceRecordType,
          generatedByAI: true,
          metadata: {
            reportId: report.id,
            category: report.category,
            generatedAt: report.generatedAt
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save report: ${response.statusText}`);
      }

      const result = await response.json();
      return result.documentId;
    } catch (error) {
      console.error('Failed to save report to Workshop:', error);
      throw error;
    }
  }

  /**
   * Get available report types for a record
   */
  private getAvailableReportTypes(record: any, recordType: string): Array<{
    id: string;
    title: string;
    type: 'company' | 'role' | 'industry' | 'buyer-group';
    description: string;
    category: string;
  }> {
    const company = record.company?.name || record.companyName || 'Company';
    const title = record.jobTitle || record.title || 'Professional';
    const industry = record.company?.industry || record.industry || 'Industry';
    const buyerRole = record.customFields?.buyerGroupRole || 'Stakeholder';

    return [
      // Company Intelligence Reports
      {
        id: 'company-competitive-analysis',
        title: `${company} Competitive Analysis`,
        type: 'company',
        description: `Comprehensive competitive landscape and market positioning for ${company}`,
        category: 'Company Intelligence'
      },
      {
        id: 'company-market-position',
        title: `${company} Market Position Report`,
        type: 'company',
        description: 'Strategic positioning and growth opportunities',
        category: 'Company Intelligence'
      },
      
      // Role Intelligence Reports
      {
        id: 'role-decision-framework',
        title: `${title} Decision Framework`,
        type: 'role',
        description: `Decision-making patterns and engagement strategies for ${title} role`,
        category: 'Role Intelligence'
      },
      {
        id: 'role-engagement-strategy',
        title: `${buyerRole} Engagement Strategy`,
        type: 'role',
        description: `Personalized engagement approach for ${buyerRole}`,
        category: 'Role Intelligence'
      },
      
      // Industry Analysis Reports
      {
        id: 'industry-market-trends',
        title: `${industry} Market Trends`,
        type: 'industry',
        description: 'Industry insights, trends, and market dynamics',
        category: 'Industry Analysis'
      },
      {
        id: 'industry-technology-landscape',
        title: `${industry} Technology Landscape`,
        type: 'industry',
        description: 'Technology adoption and disruption analysis',
        category: 'Industry Analysis'
      },
      
      // Buyer Group Intelligence Reports
      {
        id: 'buyer-group-map',
        title: `${company} Buyer Group Map`,
        type: 'buyer-group',
        description: 'Decision makers, influencers, and stakeholder mapping',
        category: 'Buyer Group Intelligence'
      },
      {
        id: 'decision-process-analysis',
        title: 'Decision Process Analysis',
        type: 'buyer-group',
        description: 'Procurement workflow and decision-making process analysis',
        category: 'Buyer Group Intelligence'
      }
    ];
  }

  /**
   * Build rich context from record data
   */
  private buildRecordContext(record: any, recordType: string): ReportGenerationContext {
    const coresignalData = record.customFields?.coresignal || {};
    const company = record.company || {};
    
    return {
      // Person/Contact Info
      name: record.fullName || record.name || coresignalData.full_name || 'Contact',
      title: record.jobTitle || record.title || coresignalData.active_experience_title || 'Professional',
      email: record.email || coresignalData.primary_professional_email,
      phone: record.phone || coresignalData.phone,
      linkedin: record.linkedin || coresignalData.linkedin_url,
      
      // Company Info
      companyName: company.name || coresignalData.experience?.[0]?.company_name || 'Company',
      companyIndustry: company.industry || coresignalData.experience?.[0]?.company_industry,
      companySize: company.size || coresignalData.experience?.[0]?.company_size,
      companyRevenue: company.revenue,
      companyEmployees: company.employees,
      
      // Intelligence Data
      influenceLevel: record.customFields?.influenceLevel,
      engagementStrategy: record.customFields?.engagementStrategy,
      seniority: record.customFields?.seniority,
      isBuyerGroupMember: record.customFields?.isBuyerGroupMember,
      
      // CoreSignal Data
      skills: coresignalData.inferred_skills || coresignalData.skills || [],
      experience: coresignalData.experience || [],
      education: coresignalData.education || [],
      totalExperience: coresignalData.total_experience_duration_months,
      
      // Related Records
      contacts: record.contacts || [],
      decisionMakers: record.decisionMakers || [],
      leads: record.leads || [],
      opportunities: record.opportunityStakeholders?.map((os: any) => os.opportunity) || [],
      
      // User's Product/Service Context (would come from workspace settings)
      userProduct: 'Adrata Platform', // TODO: Get from workspace settings
      userService: 'Sales Intelligence & CRM', // TODO: Get from workspace settings
      userCompany: 'Adrata', // TODO: Get from workspace settings
      
      // Raw record for additional context
      rawRecord: { ...record, recordType }
    };
  }

  /**
   * Generate report content using AI
   */
  private async generateReportContent(
    report: DeepValueReport, 
    context: ReportGenerationContext,
    workspaceId: string,
    userId: string
  ): Promise<string> {
    const prompt = this.buildReportPrompt(report, context);
    
    // CRITICAL: Ensure no trailing slash - defensive fix for Next.js trailingSlash config
    // Next.js trailingSlash: true causes POST→GET conversion on redirects
    let apiUrl = '/api/ai-chat';
    apiUrl = apiUrl.replace(/\/+$/, ''); // Remove trailing slashes
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.replace(/\/+$/, ''); // Double-check (defensive)
    }
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          appType: 'pipeline',
          workspaceId,
          userId,
          currentRecord: context.rawRecord,
          recordType: context.rawRecord.recordType || 'people'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response || 'Report generation failed';
    } catch (error) {
      console.error('❌ Report generation error:', error);
      return 'Unable to generate report at this time. Please try again later.';
    }
  }

  /**
   * Build specific prompts for different report types
   */
  private buildReportPrompt(report: DeepValueReport, context: ReportGenerationContext): string {
    const { name, title, companyName, companyIndustry, companySize, skills, userProduct, userService } = context;

    switch (report.type) {
      case 'company':
        return `Generate a comprehensive ${report.title} for ${companyName}. 

Context:
- Person: ${name} (${title})
- Company: ${companyName} (${companyIndustry}, ${companySize})
- Our Product: ${userProduct} - ${userService}

Include:
- Competitive landscape analysis
- Market positioning insights
- Growth opportunities
- Strategic recommendations
- Key metrics and benchmarks
- How ${userProduct} can provide value to ${companyName}

Format as a professional business report with clear sections and actionable insights.`;

      case 'role':
        return `Generate a detailed ${report.title} for a ${title} at ${companyName}.

Context:
- Person: ${name} (${title})
- Company: ${companyName} (${companyIndustry})
- Our Product: ${userProduct} - ${userService}
- Skills: ${skills?.slice(0, 5).join(', ') || 'Not specified'}

Include:
- Decision-making patterns and preferences
- Communication style recommendations
- Engagement strategies
- Pain points and motivations
- Success metrics and KPIs
- How to position ${userProduct} for this role

Focus on practical sales and relationship-building insights.`;

      case 'industry':
        return `Generate an ${report.title} for the ${companyIndustry} industry.

Context:
- Company: ${companyName} (${companyIndustry})
- Our Product: ${userProduct} - ${userService}

Include:
- Current market trends and drivers
- Technology adoption patterns
- Regulatory considerations
- Growth opportunities
- Competitive dynamics
- How ${userProduct} fits into industry trends

Provide data-driven insights and future outlook.`;

      case 'buyer-group':
        return `Generate a comprehensive ${report.title} for ${companyName}.

Context:
- Person: ${name} (${title})
- Company: ${companyName} (${companyIndustry}, ${companySize})
- Our Product: ${userProduct} - ${userService}

Include:
- Decision maker identification
- Influence mapping
- Decision process analysis
- Stakeholder relationships
- Engagement recommendations
- How to navigate the buyer group for ${userProduct}

Focus on practical sales strategy and relationship building.`;

      default:
        return `Generate a comprehensive ${report.title} with relevant business insights and actionable recommendations for ${userProduct}.`;
    }
  }
}

export const deepValueReportService = DeepValueReportService.getInstance();
