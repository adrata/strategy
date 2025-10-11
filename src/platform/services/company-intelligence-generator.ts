import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'],
});

export interface CompanyIntelligenceData {
  strategicWants: string[];
  criticalNeeds: string[];
  businessUnits: Array<{
    name: string;
    functions: string[];
    color: string;
  }>;
  strategicIntelligence: string;
  adrataStrategy: string;
}

export interface CoreSignalCompanyData {
  name: string;
  industry: string;
  sector: string;
  size: string;
  employeeCount: number;
  foundedYear: number;
  description: string;
  descriptionEnriched: string;
  website: string;
  linkedinUrl: string;
  linkedinFollowers: number;
  technologiesUsed: string[];
  competitors: string[];
  companyUpdates: any[];
  hqLocation: string;
  hqCity: string;
  hqState: string;
  isPublic: boolean;
  stockSymbol: string;
  naicsCodes: string[];
  sicCodes: string[];
}

export class CompanyIntelligenceGenerator {
  private static readonly TOP_ENGINEERS_PLUS_CONTEXT = `
TOP Engineers Plus, PLLC is a specialized telecommunications engineering firm that provides:

CORE SERVICES:
- Communications Engineering: Fiber optic design, microwave engineering, strategic planning, project management
- Critical Infrastructure: Utility communications, broadband deployment, infrastructure modernization, resilience planning  
- Operations & Process: Operational excellence, process improvement, change management, quality control
- Strategic Consulting: Strategic plan reviews, technology assessment, organizational alignment, client engagement

UNIQUE VALUE PROPOSITION:
- "Technology, Operations, and People" - the unique connection between these three elements
- Decades of experience in critical infrastructure sector
- Deep resource pool with diverse business and life experience
- Focus on turning complex challenges into simple, actionable solutions
- Specialized in utility communications engineering and broadband deployment

INDUSTRY FOCUS:
- Telecommunications industry
- Critical infrastructure and operations
- Utility communications engineering
- Broadband deployment
- Strategic planning and process optimization

RECENT ACTIVITIES:
- Active at UTC Telecom & Technology conferences (Booth #1259, #921)
- Recent rebranding with new logo and modern approach
- Focus on helping utilities modernize networks, improve resilience, reduce costs
- Strong presence in utility communications engineering space

COMPETITIVE ADVANTAGES:
- Specialized expertise in utility communications
- Process-oriented approach to complex engineering challenges
- Change management and organizational alignment capabilities
- Strategic planning and technology assessment expertise
- Focus on operational excellence and process improvement
`;

  static async generateIntelligence(
    companyData: CoreSignalCompanyData,
    forceRegenerate: boolean = false
  ): Promise<CompanyIntelligenceData> {
    try {
      const prompt = `
You are an expert sales strategist for TOP Engineers Plus, PLLC, a specialized telecommunications engineering firm. 

TOP ENGINEERS PLUS CONTEXT:
${this.TOP_ENGINEERS_PLUS_CONTEXT}

TARGET COMPANY DATA:
- Name: ${companyData.name}
- Industry: ${companyData.industry}
- Employees: ${companyData.employeeCount}
- LinkedIn Followers: ${companyData.linkedinFollowers}
- Location: ${companyData.hqLocation}
- Founded: ${companyData.foundedYear}
- Public: ${companyData.isPublic ? 'Yes' : 'No'}
- Stock Symbol: ${companyData.stockSymbol || 'N/A'}
- Website: ${companyData.website}
- Description: ${companyData.description}
- Technologies Used: ${companyData.technologiesUsed?.join(', ') || 'N/A'}
- Recent Updates: ${companyData.companyUpdates?.slice(0, 3).map(update => `${update.date}: ${update.description?.substring(0, 100)}...`).join('; ') || 'N/A'}

TASK: Generate sophisticated sales intelligence for TOP Engineers Plus on how to position and sell to ${companyData.name}. This should be highly specific to TOP's actual services and the target company's real needs.

REQUIREMENTS:
1. Strategic Wants: 4 specific wants that align with TOP's services and the company's actual challenges
2. Critical Needs: 4 specific needs that TOP can address with their specialized expertise
3. Business Units: 4 business units that represent TOP's service areas, with specific functions
4. Strategic Intelligence: Comprehensive analysis of the company and how TOP should approach them
5. Adrata Strategy: Specific, actionable strategy for TOP to position and sell to this company

Make this highly specific to TOP's actual business model and the target company's real data. Avoid generic advice.
`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse the response and extract structured data
      const intelligence = this.parseClaudeResponse(content.text);
      
      return intelligence;

    } catch (error) {
      console.error('Error generating intelligence with Claude:', error);
      throw new Error('Failed to generate intelligence');
    }
  }

  private static parseClaudeResponse(response: string): CompanyIntelligenceData {
    // This is a simplified parser - in production, you'd want more robust parsing
    const lines = response.split('\n');
    
    // Extract strategic wants
    const strategicWants = this.extractList(lines, 'Strategic Wants:', 'Critical Needs:');
    
    // Extract critical needs  
    const criticalNeeds = this.extractList(lines, 'Critical Needs:', 'Business Units:');
    
    // Extract business units
    const businessUnits = this.extractBusinessUnits(lines);
    
    // Extract strategic intelligence
    const strategicIntelligence = this.extractSection(lines, 'Strategic Intelligence:', 'Adrata Strategy:');
    
    // Extract Adrata strategy
    const adrataStrategy = this.extractSection(lines, 'Adrata Strategy:', '');
    
    return {
      strategicWants,
      criticalNeeds,
      businessUnits,
      strategicIntelligence,
      adrataStrategy
    };
  }

  private static extractList(lines: string[], startMarker: string, endMarker: string): string[] {
    const startIndex = lines.findIndex(line => line.includes(startMarker));
    const endIndex = endMarker ? lines.findIndex(line => line.includes(endMarker)) : lines.length;
    
    if (startIndex === -1) return [];
    
    const listLines = lines.slice(startIndex + 1, endIndex === -1 ? lines.length : endIndex);
    return listLines
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map(line => line.replace(/^[-•]\s*/, '').trim())
      .filter(item => item.length > 0);
  }

  private static extractBusinessUnits(lines: string[]): Array<{name: string; functions: string[]; color: string}> {
    const businessUnits: Array<{name: string; functions: string[]; color: string}> = [];
    const colors = ['bg-blue-100 border-blue-200', 'bg-green-100 border-green-200', 'bg-purple-100 border-purple-200', 'bg-orange-100 border-orange-200'];
    
    // This is a simplified extraction - you'd want more robust parsing
    const unitNames = ['Communications Engineering', 'Critical Infrastructure', 'Operations & Process', 'Strategic Consulting'];
    const unitFunctions = [
      ['Fiber optic design', 'Microwave engineering', 'Strategic planning', 'Project management'],
      ['Utility communications', 'Broadband deployment', 'Infrastructure modernization', 'Resilience planning'],
      ['Operational excellence', 'Process improvement', 'Change management', 'Quality control'],
      ['Strategic plan reviews', 'Technology assessment', 'Organizational alignment', 'Client engagement']
    ];
    
    unitNames.forEach((name, index) => {
      businessUnits.push({
        name,
        functions: unitFunctions[index] || [],
        color: colors[index] || 'bg-[var(--hover)] border-[var(--border)]'
      });
    });
    
    return businessUnits;
  }

  private static extractSection(lines: string[], startMarker: string, endMarker: string): string {
    const startIndex = lines.findIndex(line => line.includes(startMarker));
    const endIndex = endMarker ? lines.findIndex(line => line.includes(endMarker)) : lines.length;
    
    if (startIndex === -1) return '';
    
    const sectionLines = lines.slice(startIndex + 1, endIndex === -1 ? lines.length : endIndex);
    return sectionLines
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ');
  }
}