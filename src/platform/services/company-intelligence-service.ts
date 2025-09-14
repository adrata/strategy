import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ExecutiveLeader {
  id: string;
  name: string;
  title: string;
  tenure: string;
  email?: string;
  linkedin?: string;
  department?: string;
}

export interface BuyerGroupStakeholder {
  id: string;
  name: string;
  title: string;
  role: 'Decision Maker' | 'Champion' | 'Stakeholder' | 'Blocker' | 'Influencer';
  status: 'engaged' | 'interested' | 'neutral' | 'concerned' | 'blocked';
  email?: string;
  department?: string;
  influence: 'High' | 'Medium' | 'Low';
  lastContact?: Date;
}

export interface CompanyIntelligence {
  executives: ExecutiveLeader[];
  stakeholders: BuyerGroupStakeholder[];
  companyNews: Array<{
    date: string;
    headline: string;
    source: string;
    url?: string;
  }>;
}

class CompanyIntelligenceService {
  private static instance: CompanyIntelligenceService;

  private constructor() {}

  static getInstance(): CompanyIntelligenceService {
    if (!CompanyIntelligenceService.instance) {
      CompanyIntelligenceService['instance'] = new CompanyIntelligenceService();
    }
    return CompanyIntelligenceService.instance;
  }

  async getCompanyIntelligence(companyName: string, workspaceId: string): Promise<CompanyIntelligence> {
    try {
      console.log(`🔍 Fetching company intelligence for ${companyName} in workspace ${workspaceId}`);

      // For demo companies, always return fallback data to avoid database dependency
      const companyNameLower = companyName.toLowerCase();
      if (companyNameLower.includes('adp') || companyNameLower.includes('nike') || companyNameLower.includes('datacorp')) {
        console.log(`🎭 Using demo fallback data for ${companyName}`);
        return this.getFallbackData(companyName);
      }

      // Get company account
      const account = await prisma.accounts.findFirst({
        where: {
          name: {
            contains: companyName,
            mode: 'insensitive'
          },
          workspaceId: workspaceId
        },
        include: {
          contacts: true,
          opportunities: {
            include: {
              stakeholders: {
                include: {
                  contact: true
                }
              }
            }
          }
        }
      });

      if (!account) {
        console.log(`❌ No account found for ${companyName} in workspace ${workspaceId}`);
        return this.getFallbackData(companyName);
      }

      // Get executive leadership team from contacts
      const executives = await this.getExecutiveLeadership(account.id, workspaceId);

      // Get buyer group stakeholders from opportunities and stakeholders
      const stakeholders = await this.getBuyerGroupStakeholders(account.id, workspaceId);

      // Get company news (placeholder for now - could be integrated with news API)
      const companyNews = await this.getCompanyNews(companyName);

      return {
        executives,
        stakeholders,
        companyNews
      };

    } catch (error) {
      console.error('❌ Error fetching company intelligence:', error);
      return this.getFallbackData(companyName);
    }
  }

  private async getExecutiveLeadership(accountId: string, workspaceId: string): Promise<ExecutiveLeader[]> {
    try {
      // Get contacts with executive titles
      const executives = await prisma.contacts.findMany({
        where: {
          accountId: accountId,
          workspaceId: workspaceId,
          jobTitle: {
            contains: 'Chief',
            mode: 'insensitive'
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      // Also get VP and Director level contacts
      const vpDirectors = await prisma.contacts.findMany({
        where: {
          accountId: accountId,
          workspaceId: workspaceId,
          jobTitle: {
            contains: 'VP',
            mode: 'insensitive'
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      const allExecutives = [...executives, ...vpDirectors];

      return allExecutives.map(contact => ({
        id: contact.id,
        name: contact.fullName || 'Unknown',
        title: contact.jobTitle || 'Executive',
        tenure: this.calculateTenure(contact.createdAt),
        email: contact.email || undefined,
        department: contact.department || undefined
      }));

    } catch (error) {
      console.error('❌ Error fetching executive leadership:', error);
      return [];
    }
  }

  private async getBuyerGroupStakeholders(accountId: string, workspaceId: string): Promise<BuyerGroupStakeholder[]> {
    try {
      // Get stakeholders from opportunities
      const stakeholders = await prisma.opportunityStakeholder.findMany({
        where: {
          opportunity: {
            accountId: accountId,
            workspaceId: workspaceId
          }
        },
        include: {
          contact: true,
          opportunity: true
        }
      });

      // Get contacts from the account
      const contacts = await prisma.contacts.findMany({
        where: {
          accountId: accountId,
          workspaceId: workspaceId
        , deletedAt: null},
        take: 20
      });

      // Combine and deduplicate stakeholders
      const stakeholderMap = new Map<string, BuyerGroupStakeholder>();

      // Add opportunity stakeholders
      stakeholders.forEach(stakeholder => {
        if (stakeholder.contact) {
          const key = stakeholder.contact.id;
          stakeholderMap.set(key, {
            id: stakeholder.contact.id,
            name: stakeholder.contact.fullName || 'Unknown',
            title: stakeholder.contact.jobTitle || 'Stakeholder',
            role: this.determineStakeholderRole(stakeholder.contact.jobTitle),
            status: this.determineStakeholderStatus(stakeholder.contact.jobTitle),
            email: stakeholder.contact.email || undefined,
            department: stakeholder.contact.department || undefined,
            influence: this.determineInfluence(stakeholder.contact.jobTitle),
            lastContact: stakeholder.updatedAt
          });
        }
      });

      // Add additional contacts
      contacts.forEach(contact => {
        if (!stakeholderMap.has(contact.id)) {
          stakeholderMap.set(contact.id, {
            id: contact.id,
            name: contact.fullName || 'Unknown',
            title: contact.jobTitle || 'Stakeholder',
            role: this.determineStakeholderRole(contact.jobTitle),
            status: 'neutral',
            email: contact.email || undefined,
            department: contact.department || undefined,
            influence: this.determineInfluence(contact.jobTitle),
            lastContact: contact.updatedAt
          });
        }
      });

      return Array.from(stakeholderMap.values()).slice(0, 10); // Limit to 10 stakeholders

    } catch (error) {
      console.error('❌ Error fetching buyer group stakeholders:', error);
      return [];
    }
  }

  private async getCompanyNews(companyName: string): Promise<Array<{date: string, headline: string, source: string, url?: string}>> {
    // Placeholder for company news - could integrate with news API
    // For now, return empty array
    return [];
  }

  private calculateTenure(createdAt: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
    return `${diffYears} years`;
  }

  private determineStakeholderRole(jobTitle: string | null): BuyerGroupStakeholder['role'] {
    if (!jobTitle) return 'Stakeholder';
    
    const title = jobTitle.toLowerCase();
    if (title.includes('ceo') || title.includes('president') || title.includes('cto') || title.includes('cfo')) {
      return 'Decision Maker';
    }
    if (title.includes('vp') || title.includes('director')) {
      return 'Champion';
    }
    if (title.includes('manager') || title.includes('lead')) {
      return 'Influencer';
    }
    return 'Stakeholder';
  }

  private determineStakeholderStatus(jobTitle: string | null): BuyerGroupStakeholder['status'] {
    if (!jobTitle) return 'neutral';
    
    const title = jobTitle.toLowerCase();
    if (title.includes('ceo') || title.includes('president')) {
      return 'engaged';
    }
    if (title.includes('vp') || title.includes('director')) {
      return 'interested';
    }
    return 'neutral';
  }

  private determineInfluence(jobTitle: string | null): 'High' | 'Medium' | 'Low' {
    if (!jobTitle) return 'Medium';
    
    const title = jobTitle.toLowerCase();
    if (title.includes('ceo') || title.includes('president') || title.includes('cto') || title.includes('cfo')) {
      return 'High';
    }
    if (title.includes('vp') || title.includes('director')) {
      return 'High';
    }
    if (title.includes('manager') || title.includes('lead')) {
      return 'Medium';
    }
    return 'Low';
  }

  private getFallbackData(companyName: string): CompanyIntelligence {
    // Return rich demo data for demo companies
    const companyNameLower = companyName.toLowerCase();
    
    if (companyNameLower.includes('adp')) {
      return {
        executives: [
          {
            id: 'exec-1',
            name: 'Carlos Rodriguez',
            title: 'Chief Executive Officer',
            tenure: '8 years',
            email: 'carlos.rodriguez@adp.com',
            department: 'Executive Leadership'
          },
          {
            id: 'exec-2', 
            name: 'Kathleen Winters',
            title: 'Chief Financial Officer',
            tenure: '5 years',
            email: 'kathleen.winters@adp.com',
            department: 'Finance'
          },
          {
            id: 'exec-3',
            name: 'Stuart Sackman',
            title: 'Chief Technology Officer', 
            tenure: '6 years',
            email: 'stuart.sackman@adp.com',
            department: 'Technology'
          }
        ],
        stakeholders: [
          {
            id: 'stake-1',
            name: 'Sarah Rodriguez',
            title: 'VP of Engineering',
            role: 'Champion',
            status: 'positive',
            email: 'sarah.rodriguez@adp.com',
            department: 'Engineering',
            influence: 'High',
            lastContact: new Date('2024-12-01')
          },
          {
            id: 'stake-2', 
            name: 'James Wilson',
            title: 'Director Platform Architecture',
            role: 'Decision Maker',
            status: 'neutral',
            email: 'james.wilson@adp.com',
            department: 'Platform Architecture',
            influence: 'Medium',
            lastContact: new Date('2024-11-15')
          },
          {
            id: 'stake-3',
            name: 'Michael Chen',
            title: 'Senior Software Engineer',
            role: 'Influencer',
            status: 'positive',
            email: 'michael.chen@adp.com',
            department: 'Engineering',
            influence: 'Medium',
            lastContact: new Date('2024-11-20')
          },
          {
            id: 'stake-4',
            name: 'Lisa Thompson',
            title: 'VP Product Management',
            role: 'Decision Maker',
            status: 'neutral',
            email: 'lisa.thompson@adp.com',
            department: 'Product',
            influence: 'High',
            lastContact: new Date('2024-10-30')
          },
          {
            id: 'stake-5',
            name: 'David Kim',
            title: 'Security Director',
            role: 'Blocker',
            status: 'cautious',
            email: 'david.kim@adp.com',
            department: 'Security',
            influence: 'Medium',
            lastContact: new Date('2024-11-10')
          }
        ],
        companyNews: [
          {
            date: '2024-12-10',
            headline: 'ADP Announces Major Platform Modernization Initiative',
            source: 'ADP Press Release',
            url: 'https://mediacenter.adp.com/2024-12-10-platform-modernization'
          },
          {
            date: '2024-11-28',
            headline: 'ADP Reports Strong Q4 Growth in Cloud Services',
            source: 'Business Wire',
            url: 'https://www.businesswire.com/news/adp-q4-growth'
          },
          {
            date: '2024-11-15', 
            headline: 'ADP Expands AI Capabilities in Workforce Management',
            source: 'TechCrunch',
            url: 'https://techcrunch.com/adp-ai-expansion'
          }
        ]
      };
    }
    
    // Return generic fallback for other companies
    return {
      executives: [
        {
          id: 'exec-generic-1',
          name: 'Chief Executive Officer',
          title: 'CEO',
          tenure: '3 years',
          department: 'Executive Leadership'
        }
      ],
      stakeholders: [
        {
          id: 'stake-generic-1',
          name: 'Technology Decision Maker',
          title: 'VP Technology',
          role: 'Decision Maker',
          status: 'neutral',
          department: 'Technology',
          influence: 'High',
          lastContact: new Date()
        }
      ],
      companyNews: []
    };
  }
}

export { CompanyIntelligenceService };
export const companyIntelligenceService = CompanyIntelligenceService.getInstance(); 