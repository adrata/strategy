import { useState, useEffect, useCallback } from "react";

export interface DeepValueReport {
  id: string;
  title: string;
  type: 'company' | 'role' | 'industry' | 'buyer-group';
  description: string;
  category: string;
  isGenerating?: boolean;
  content?: string;
  generatedAt?: string;
}

export function useDeepValueReports(record: any) {
  const [reports, setReports] = useState<DeepValueReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);

  // Generate reports based on record data
  const generateReports = useCallback((record: any): DeepValueReport[] => {
    if (!record) return [];

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
  }, []);

  // Generate reports when record changes
  useEffect(() => {
    if (record) {
      const generatedReports = generateReports(record);
      setReports(generatedReports);
    }
  }, [record, generateReports]);

  // Handle report click - generate content with Claude
  const handleReportClick = useCallback(async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    console.log('📊 Opening Deep Value Report:', report.title);
    setActiveReport(reportId);
    
    // Mark as generating
    setReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, isGenerating: true } : r
    ));

    try {
      // Generate report content using Claude
      const content = await generateReportContent(report, record);
      
      // Update report with generated content
      setReports(prev => prev.map(r => 
        r.id === reportId ? { 
          ...r, 
          isGenerating: false, 
          content,
          generatedAt: new Date().toISOString()
        } : r
      ));
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, isGenerating: false } : r
      ));
    }
  }, [reports, record]);

  const handleReportBack = useCallback(() => {
    setActiveReport(null);
  }, []);

  return {
    reports,
    isLoading,
    activeReport,
    handleReportClick,
    handleReportBack
  };
}

// Generate report content using Claude AI
async function generateReportContent(report: DeepValueReport, record: any): Promise<string> {
  const prompt = buildReportPrompt(report, record);
  
  try {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        appType: 'pipeline',
        workspaceId: record.workspaceId,
        userId: record.assignedUserId,
        currentRecord: record,
        recordType: 'people'
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

// Build specific prompts for different report types
function buildReportPrompt(report: DeepValueReport, record: any): string {
  const company = record.company?.name || record.companyName || 'Company';
  const title = record.jobTitle || record.title || 'Professional';
  const industry = record.company?.industry || record.industry || 'Industry';
  const buyerRole = record.customFields?.buyerGroupRole || 'Stakeholder';

  switch (report.type) {
    case 'company':
      return `Generate a comprehensive ${report.title} for ${company}. Include:
      - Competitive landscape analysis
      - Market positioning insights
      - Growth opportunities
      - Strategic recommendations
      - Key metrics and benchmarks
      
      Format as a professional business report with clear sections and actionable insights.`;

    case 'role':
      return `Generate a detailed ${report.title} for a ${title} at ${company}. Include:
      - Decision-making patterns and preferences
      - Communication style recommendations
      - Engagement strategies
      - Pain points and motivations
      - Success metrics and KPIs
      
      Focus on practical sales and relationship-building insights.`;

    case 'industry':
      return `Generate an ${report.title} for the ${industry} industry. Include:
      - Current market trends and drivers
      - Technology adoption patterns
      - Regulatory considerations
      - Growth opportunities
      - Competitive dynamics
      
      Provide data-driven insights and future outlook.`;

    case 'buyer-group':
      return `Generate a comprehensive ${report.title} for ${company}. Include:
      - Decision maker identification
      - Influence mapping
      - Decision process analysis
      - Stakeholder relationships
      - Engagement recommendations
      
      Focus on practical sales strategy and relationship building.`;

    default:
      return `Generate a comprehensive ${report.title} with relevant business insights and actionable recommendations.`;
  }
}
