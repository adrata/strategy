/**
 * 🤖 AI-POWERED REPORT GENERATION SYSTEM
 * 
 * Generates comprehensive reports using Claude AI and real data from:
 * - CoreSignal (company data)
 * - Perplexity (real-time company intelligence)
 * - Workspace data (internal insights)
 */

import { PrismaClient } from '@prisma/client';

export interface CompanyReportData {
  // CoreSignal Data
  companyName: string;
  industry: string;
  companySize: string;
  employeeCount: number;
  companyType: string;
  website: string;
  location: string;
  foundedYear?: number;
  description?: string;
  
  // Perplexity Data
  recentNews?: string[];
  competitors?: string[];
  marketPosition?: string;
  financialData?: any;
  technologyStack?: string[];
  
  // Workspace Data
  workspaceId: string;
  contactCount: number;
  engagementHistory?: any[];
  painPoints?: string[];
  opportunities?: string[];
}

export interface ReportTemplate {
  type: 'competitive' | 'industry' | 'growth' | 'tech' | 'pain';
  title: string;
  sections: string[];
  dataRequirements: string[];
}

export class AIReportGenerator {
  private prisma: PrismaClient;
  private claudeApiKey: string;
  private perplexityApiKey: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY || '';
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
  }

  /**
   * 🎯 GENERATE COMPREHENSIVE COMPANY REPORT
   */
  async generateCompanyReport(
    companyName: string,
    reportType: string,
    workspaceId: string,
    personId?: string
  ): Promise<string> {
    try {
      console.log(`🤖 [AI REPORT] Generating ${reportType} report for ${companyName}`);
      
      // Step 1: Gather all available data
      const reportData = await this.gatherReportData(companyName, workspaceId, personId);
      
      // Step 2: Get real-time data from Perplexity
      const perplexityData = await this.getPerplexityData(companyName, reportType);
      
      // Step 3: Generate report using Claude
      const report = await this.generateReportWithClaude(reportData, perplexityData, reportType);
      
      console.log(`✅ [AI REPORT] Generated ${reportType} report for ${companyName}`);
      return report;
      
    } catch (error) {
      console.error('❌ [AI REPORT] Error generating report:', error);
      throw error;
    }
  }

  /**
   * 📊 GATHER ALL AVAILABLE DATA
   */
  private async gatherReportData(
    companyName: string, 
    workspaceId: string, 
    personId?: string
  ): Promise<CompanyReportData> {
    // Get person data if personId provided
    let personData = null;
    if (personId) {
      personData = await this.prisma.people.findUnique({
        where: { id: personId },
        include: { company: true }
      });
    }

    // Get CoreSignal data from person's custom fields
    const coresignalData = personData?.customFields?.coresignalData || {};
    const activeExperience = coresignalData.experience?.find((exp: any) => exp.active_experience === 1) || coresignalData.experience?.[0];

    // Get workspace data
    const workspaceData = await this.getWorkspaceData(workspaceId, companyName);

    return {
      // CoreSignal Data
      companyName: activeExperience?.company_name || companyName,
      industry: activeExperience?.company_industry || 'Manufacturing',
      companySize: activeExperience?.company_size_range || '501-1000 employees',
      employeeCount: activeExperience?.company_employees_count || 310,
      companyType: activeExperience?.company_type || 'Public Company',
      website: activeExperience?.company_website || '',
      location: activeExperience?.company_hq_full_address || '',
      foundedYear: activeExperience?.company_founded_year,
      description: activeExperience?.company_description,
      
      // Workspace Data
      workspaceId,
      contactCount: workspaceData.contactCount,
      engagementHistory: workspaceData.engagementHistory,
      painPoints: workspaceData.painPoints,
      opportunities: workspaceData.opportunities
    };
  }

  /**
   * 🔍 GET PERPLEXITY DATA
   */
  private async getPerplexityData(companyName: string, reportType: string): Promise<any> {
    try {
      const prompt = this.buildPerplexityPrompt(companyName, reportType);
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.2,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch (error) {
      console.error('❌ [PERPLEXITY] Error fetching data:', error);
      return null;
    }
  }

  /**
   * 🧠 GENERATE REPORT WITH CLAUDE
   */
  private async generateReportWithClaude(
    reportData: CompanyReportData,
    perplexityData: any,
    reportType: string
  ): Promise<string> {
    try {
      const prompt = this.buildClaudePrompt(reportData, perplexityData, reportType);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.claudeApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
        }),
      });

      const data = await response.json();
      return data.content[0].text;
      
    } catch (error) {
      console.error('❌ [CLAUDE] Error generating report:', error);
      throw error;
    }
  }

  /**
   * 📝 BUILD PERPLEXITY PROMPT
   */
  private buildPerplexityPrompt(companyName: string, reportType: string): string {
    const basePrompt = `Research ${companyName} and provide comprehensive information for a ${reportType} analysis. Include:`;
    
    const specificRequirements = {
      competitive: `
        - Main competitors and market position
        - Competitive advantages and weaknesses
        - Market share and industry standing
        - Recent competitive moves and strategies
        - SWOT analysis insights
      `,
      industry: `
        - Industry trends and growth patterns
        - Market size and opportunities
        - Regulatory environment
        - Technology adoption in the industry
        - Future outlook and predictions
      `,
      growth: `
        - Revenue growth trends
        - Expansion plans and strategies
        - Investment and funding activity
        - Market expansion initiatives
        - Growth challenges and opportunities
      `,
      tech: `
        - Technology stack and infrastructure
        - Digital transformation initiatives
        - Innovation and R&D investments
        - Technology partnerships
        - Digital maturity assessment
      `,
      pain: `
        - Industry challenges and pain points
        - Operational inefficiencies
        - Technology gaps
        - Market pressures
        - Customer pain points
      `
    };

    return `${basePrompt}${specificRequirements[reportType as keyof typeof specificRequirements] || specificRequirements.competitive}`;
  }

  /**
   * 🧠 BUILD CLAUDE PROMPT
   */
  private buildClaudePrompt(
    reportData: CompanyReportData,
    perplexityData: any,
    reportType: string
  ): string {
    return `
You are an expert business analyst creating a comprehensive ${reportType} analysis report for ${reportData.companyName}.

COMPANY DATA:
- Company: ${reportData.companyName}
- Industry: ${reportData.industry}
- Size: ${reportData.companySize} (${reportData.employeeCount} employees)
- Type: ${reportData.companyType}
- Website: ${reportData.website}
- Location: ${reportData.location}
- Founded: ${reportData.foundedYear || 'Unknown'}

REAL-TIME RESEARCH DATA:
${perplexityData || 'No additional research data available'}

WORKSPACE CONTEXT:
- Contacts in workspace: ${reportData.contactCount}
- Engagement history: ${JSON.stringify(reportData.engagementHistory || [])}
- Identified pain points: ${JSON.stringify(reportData.painPoints || [])}
- Opportunities: ${JSON.stringify(reportData.opportunities || [])}

Please create a comprehensive ${reportType} analysis report that includes:

1. Executive Summary
2. Company Overview
3. Market Analysis
4. Competitive Landscape
5. Key Insights and Recommendations
6. Strategic Opportunities
7. Risk Assessment
8. Next Steps

Make the report actionable, data-driven, and specific to ${reportData.companyName}. Use the real data provided and create insights that would be valuable for sales and business development teams.

Format the report in clear sections with bullet points, data highlights, and actionable recommendations.
    `;
  }

  /**
   * 📊 GET WORKSPACE DATA
   */
  private async getWorkspaceData(workspaceId: string, companyName: string): Promise<any> {
    try {
      // Get contact count for this company
      const contactCount = await this.prisma.people.count({
        where: {
          workspaceId,
          company: {
            name: {
              contains: companyName,
              mode: 'insensitive'
            }
          }
        }
      });

      // Get engagement history
      const engagementHistory = await this.prisma.actions.findMany({
        where: {
          workspaceId,
          person: {
            company: {
              name: {
                contains: companyName,
                mode: 'insensitive'
              }
            }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      return {
        contactCount,
        engagementHistory,
        painPoints: [],
        opportunities: []
      };
      
    } catch (error) {
      console.error('❌ [WORKSPACE DATA] Error fetching workspace data:', error);
      return {
        contactCount: 0,
        engagementHistory: [],
        painPoints: [],
        opportunities: []
      };
    }
  }
}

export default AIReportGenerator;
