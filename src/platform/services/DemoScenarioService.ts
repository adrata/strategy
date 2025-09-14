import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Demo Scenario Service
 * Manages dynamic demo data and replaces all hardcoded references
 * Supports multiple client scenarios with seamless switching
 */
export class DemoScenarioService {
  private static instance: DemoScenarioService;
  private currentScenario: string | null = null;
  private scenarioCache = new Map<string, any>();
  private static readonly SCENARIO_STORAGE_KEY = 'adrata_current_demo_scenario';

  constructor() {
    // Load persisted scenario from localStorage on initialization
    this.loadPersistedScenario();
  }

  static getInstance(): DemoScenarioService {
    if (!DemoScenarioService.instance) {
      DemoScenarioService['instance'] = new DemoScenarioService();
    }
    return DemoScenarioService.instance;
  }

  /**
   * Load the persisted scenario from localStorage
   */
  private loadPersistedScenario(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(DemoScenarioService.SCENARIO_STORAGE_KEY);
        if (stored) {
          this['currentScenario'] = stored;
          console.log(`🔄 DemoScenarioService: Restored scenario from localStorage: ${stored}`);
        } else {
          // Default to ZeroPoint VP Sales if no stored scenario (has ADP buyer groups)
          this['currentScenario'] = 'zeropoint-vp-sales-2025';
          console.log(`🎭 DemoScenarioService: No stored scenario, defaulting to: zeropoint-vp-sales-2025`);
        }
      } else {
        // Fallback for server-side rendering or when localStorage is not available
        this['currentScenario'] = 'zeropoint-vp-sales-2025';
      }
    } catch (error) {
      console.error('❌ DemoScenarioService: Error loading persisted scenario:', error);
      this['currentScenario'] = 'zeropoint-vp-sales-2025';
    }
  }

  /**
   * Save the current scenario to localStorage
   */
  private saveScenarioToStorage(scenarioSlug: string | null): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (scenarioSlug) {
          localStorage.setItem(DemoScenarioService.SCENARIO_STORAGE_KEY, scenarioSlug);
          console.log(`💾 DemoScenarioService: Saved scenario to localStorage: ${scenarioSlug}`);
        } else {
          localStorage.removeItem(DemoScenarioService.SCENARIO_STORAGE_KEY);
          console.log(`🗑️ DemoScenarioService: Removed scenario from localStorage`);
        }
      }
    } catch (error) {
      console.error('❌ DemoScenarioService: Error saving scenario to localStorage:', error);
    }
  }

  /**
   * Set the current demo scenario
   */
  setCurrentScenario(scenarioSlug: string | null): void {
    this['currentScenario'] = scenarioSlug;
    this.saveScenarioToStorage(scenarioSlug);
    console.log(`🎭 DemoScenarioService: Set current scenario to ${scenarioSlug}`);
  }

  /**
   * Get the current demo scenario
   */
  getCurrentScenario(): string | null {
    return this.currentScenario;
  }

  /**
   * Check if we're in demo mode
   */
  isDemoMode(): boolean {
    return this.currentScenario !== null;
  }

  /**
   * Force refresh the current scenario (useful for debugging)
   */
  forceRefreshScenario(): void {
    console.log('🔄 DemoScenarioService: Force refreshing scenario...');
    this.loadPersistedScenario();
    console.log(`🔄 DemoScenarioService: Current scenario after refresh: ${this.currentScenario}`);
  }

  /**
   * Clear scenario cache and reset to default
   */
  clearScenarioCache(): void {
    console.log('🧹 DemoScenarioService: Clearing scenario cache...');
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(DemoScenarioService.SCENARIO_STORAGE_KEY);
      }
      this['currentScenario'] = 'zeropoint-vp-sales-2025'; // Set to the correct default
      this.scenarioCache.clear();
      console.log('✅ DemoScenarioService: Scenario cache cleared');
    } catch (error) {
      console.error('❌ DemoScenarioService: Error clearing scenario cache:', error);
    }
  }

  /**
   * Get all available demo scenarios
   */
  async getAvailableScenarios() {
    try {
      const scenarios = await (prisma as any).demoScenario.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      });
      
      return scenarios.map((scenario: any) => ({
        id: scenario.id,
        name: scenario.name,
        slug: scenario.slug,
        description: scenario.description,
        industry: scenario.industry,
        targetAudience: scenario.targetAudience,
        config: scenario.config as any,
        branding: scenario.branding as any,
        features: scenario.features as any,
        demoUser: scenario.demoUser as any
      }));
    } catch (error) {
      console.error('❌ DemoScenarioService: Error fetching scenarios:', error);
      return [];
    }
  }

  /**
   * Get demo scenario by slug
   */
  async getScenario(slug: string) {
    try {
      // Check cache first
      if (this.scenarioCache.has(slug)) {
        return this.scenarioCache.get(slug);
      }

      const scenario = await prisma.demoScenario.findUnique({
        where: { slug }
      });

      if (scenario) {
        const scenarioData = {
          id: scenario.id,
          name: scenario.name,
          slug: scenario.slug,
          description: scenario.description,
          industry: scenario.industry,
          targetAudience: scenario.targetAudience,
          config: scenario.config as any,
          branding: scenario.branding as any,
          features: scenario.features as any,
          demoUser: scenario.demoUser as any
        };

        // Cache for future use
        this.scenarioCache.set(slug, scenarioData);
        return scenarioData;
      }

      return null;
    } catch (error) {
      console.error(`❌ DemoScenarioService: Error fetching scenario ${slug}:`, error);
      return null;
    }
  }

  /**
   * Get demo user data for current scenario
   * Replaces hardcoded "Dan Mirolli" references
   */
  async getDemoUser() {
    if (!this.currentScenario) {
      return {
        name: "Demo User",
        firstName: "Demo",
        lastName: "User",
        company: "Demo Company",
        workspace: "Demo Workspace",
        initial: "D"
      };
    }

    const scenario = await this.getScenario(this.currentScenario);
    
    // Check for demo user in scenario config
    if (scenario?.config?.demoUser) {
      const user = scenario.config.demoUser;
      return {
        name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "James Gold",
        firstName: user.firstName || "James",
        lastName: user.lastName || "Gold",
        company: user.company || "ZeroPoint",
        workspace: scenario.name || "ZeroPoint Workspace",
        initial: (user.fullName || user.firstName || String.fromCharCode(74)).charAt(0).toUpperCase()
      };
    }

    // Fallback to James Gold for ZeroPoint Leader
    return {
      name: "James Gold",
      firstName: "James", 
      lastName: "Gold",
      company: "ZeroPoint",
      workspace: "ZeroPoint Workspace",
      initial: String.fromCharCode(74)
    };
  }

  /**
   * Get demo companies for current scenario
   * Replaces hardcoded Monaco sample companies
   */
  async getDemoCompanies() {
    if (!this.currentScenario) {
      return [];
    }

    try {
      const companies = await prisma.leads.findMany({
        where: {
          demoScenarioId: this.currentScenario,
          isDemoData: true
        },
        select: {
          id: true,
          company: true,
          companyDomain: true,
          industry: true,
          companySize: true,
          city: true,
          status: true,
          estimatedValue: true,
          currency: true,
          lastActionDate: true,
          createdAt: true,
          updatedAt: true,
          customFields: true
        },
        distinct: ['company'],
        orderBy: { company: 'asc' } // Consistent alphabetical ordering
      });

      return companies
        .filter(lead => lead.company)
        .map(lead => {
          const customFields = lead.customFields as any || {};
          return {
            id: `company-${lead.id}`,
            name: lead.company!,
            domain: lead.companyDomain || `${lead.company?.toLowerCase().replace(/\s+/g, '')}.com`,
            industry: lead.industry || 'Technology',
            employeeCount: this.parseEmployeeCount(lead.companySize),
            revenue: this.formatRevenue(lead.estimatedValue, lead.currency),
            location: lead.city || 'San Francisco, CA',
            icpScore: Math.floor(Math.random() * 20) + 80, // 80-100 for demo
            lastUpdated: (lead.lastActionDate || lead.updatedAt).toISOString(),
            status: this.mapLeadStatusToCompanyStatus(lead.status),
            engineeringHeadcount: customFields.engineeringHeadcount || 100 // Real company engineering headcount
          };
        });
    } catch (error) {
      console.error('❌ DemoScenarioService: Error fetching demo companies:', error);
      return [];
    }
  }

  /**
   * Get demo people for current scenario
   * Replaces hardcoded Monaco sample people
   */
  async getDemoPeople() {
    if (!this.currentScenario) {
      return [];
    }

    try {
      const people = await prisma.leads.findMany({
        where: {
          demoScenarioId: this.currentScenario,
          isDemoData: true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          jobTitle: true,
          company: true,
          email: true,
          phone: true,
          linkedinUrl: true,
          city: true,
          state: true,
          department: true,
          status: true,
          buyerGroupRole: true,
          lastActionDate: true
        },
        orderBy: { fullName: 'asc' } // Consistent alphabetical ordering
      });

      return people.map(person => ({
        id: person.id,
        name: person.fullName,
        title: person.jobTitle || 'Technology Executive',
        company: person.company || 'Enterprise Company',
        email: person.email || `${person.firstName?.toLowerCase()}.${person.lastName?.toLowerCase()}@${person.company?.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: person.phone || '+1-555-000-0000',
        linkedin: person.linkedinUrl || `https://linkedin.com/in/${person.firstName?.toLowerCase()}-${person.lastName?.toLowerCase()}`,
        location: [person.city, person.state].filter(Boolean).join(', ') || 'San Francisco, CA',
        department: person.department || 'Technology',
        seniority: this.inferSeniority(person.jobTitle),
        lastContact: person.lastActionDate?.toISOString().split('T')[0] || '2025-01-01',
        status: person.status,
        buyerGroupRole: person.buyerGroupRole || 'Stakeholder'
      }));
    } catch (error) {
      console.error('❌ DemoScenarioService: Error fetching demo people:', error);
      return [];
    }
  }

  /**
   * Get demo sellers for current scenario
   * Replaces hardcoded DEMO_SELLERS array
   */
  async getDemoSellers() {
    if (!this.currentScenario) {
      return [];
    }

    const scenario = await this.getScenario(this.currentScenario);
    
    // If scenario has sellers feature disabled, return empty array
    if (scenario?.features?.hideSellers) {
      return [];
    }

    try {
      // Get sellers from scenario config
      const sellers = scenario?.config?.sellers || [];
      
      // Enhance each seller with company data
      const companies = await this.getDemoCompanies();
      
      return sellers.map((seller: any) => ({
        ...seller,
        companies: companies
      }));
    } catch (error) {
      console.error('❌ DemoScenarioService: Error fetching demo sellers:', error);
      return [];
    }
  }

  /**
   * Check if sellers should be visible for current scenario
   */
  async isSellersVisible(): Promise<boolean> {
    if (!this.currentScenario) {
      return true; // Default to visible
    }

    const scenario = await this.getScenario(this.currentScenario);
    return !scenario?.features?.hideSellers;
  }

  /**
   * Get demo opportunities for current scenario
   */
  async getDemoOpportunities() {
    if (!this.currentScenario) {
      return [];
    }

    try {
      // For now, return sample opportunities data until relationships are properly set up
      // TODO: Implement proper opportunity-lead relationships in database
      return [
        {
          id: 'opp-1',
          name: 'Enterprise Security Platform',
          company: 'Demo Company',
          dealSize: '$250K',
          closeProb: '85%',
          stage: 'Technical Review',
          priority: 'High',
          nextAction: 'Schedule demo',
          expectedCloseDate: '2025-03-15',
          contact: 'Demo Contact',
          contactTitle: 'CISO'
        }
      ];
    } catch (error) {
      console.error('❌ DemoScenarioService: Error fetching demo opportunities:', error);
      return [];
    }
  }

  // Helper methods removed duplicate implementations - using the ones below

  private inferSeniority(jobTitle: string | null): string {
    if (!jobTitle) return 'Individual Contributor';
    
    const title = jobTitle.toLowerCase();
    if (title.includes('ceo') || title.includes('cto') || title.includes('cfo') || title.includes('chief')) {
      return 'C-Level';
    } else if (title.includes('vp') || title.includes('vice president')) {
      return 'VP';
    } else if (title.includes('director')) {
      return 'Director';
    } else if (title.includes('manager') || title.includes('head of')) {
      return 'Manager';
    }
    
    return 'Individual Contributor';
  }

  /**
   * Distribute leads across verticals to ensure balanced filtering results
   */
  private distributeLeadsAcrossVerticals(leads: any[], limit: number): any[] {
    // First, categorize existing leads by vertical
    const leadsByVertical: Record<string, any[]> = {
      'C Stores': [],
      'Grocery Stores': [],
      'Corporate Retailers': [],
      'Quick Service Restaurants': []
    };

    // Categorize existing leads
    leads.forEach(lead => {
      const vertical = this.inferVerticalFromCompany(lead.company);
      if (leadsByVertical[vertical]) {
        leadsByVertical[vertical].push({ ...lead, vertical });
      } else {
        leadsByVertical['Corporate Retailers'].push({ ...lead, vertical: 'Corporate Retailers' });
      }
    });

    // Calculate target per vertical (aim for balanced distribution)
    const targetPerVertical = Math.ceil(limit / 4); // 4 verticals
    const resultLeads: any[] = [];

    // For each vertical, ensure minimum representation
    const verticals = ['C Stores', 'Grocery Stores', 'Corporate Retailers', 'Quick Service Restaurants'];
    
    verticals.forEach(vertical => {
      const verticalLeads = leadsByVertical[vertical];
      
      if (verticalLeads.length >= targetPerVertical) {
        // Take first N leads for this vertical
        resultLeads.push(...verticalLeads.slice(0, targetPerVertical));
      } else {
        // Add all existing leads for this vertical
        resultLeads.push(...verticalLeads);
        
        // Generate additional synthetic leads to meet target
        const needed = Math.min(targetPerVertical - verticalLeads.length, 5); // Cap at 5 synthetic per vertical
        for (let i = 0; i < needed; i++) {
          resultLeads.push(this.generateSyntheticLead(vertical, i));
        }
      }
    });

    // Fill remaining slots with any extra leads, prioritizing variety
    const remaining = limit - resultLeads.length;
    if (remaining > 0) {
      const extraLeads: any[] = [];
      verticals.forEach(vertical => {
        const usedCount = resultLeads.filter(l => l['vertical'] === vertical).length;
        const availableExtra = leadsByVertical[vertical].slice(usedCount);
        extraLeads.push(...availableExtra);
      });
      
      resultLeads.push(...extraLeads.slice(0, remaining));
    }

    return resultLeads.slice(0, limit);
  }

  /**
   * Generate synthetic lead for specific vertical
   */
  private generateSyntheticLead(vertical: string, index: number): any {
    const baseCompanies = {
      'C Stores': ['7-Eleven', 'Circle K', 'Wawa', 'Sheetz', "Casey's"],
      'Grocery Stores': ['Kroger', 'Safeway', 'Whole Foods', 'Publix', 'Wegmans'],
      'Corporate Retailers': ['Walmart', 'Target', 'Costco', 'Home Depot', 'Best Buy'],
      'Quick Service Restaurants': ['McDonald\'s', 'Subway', 'Starbucks', 'Taco Bell', 'KFC']
    };

    const companies = baseCompanies[vertical as keyof typeof baseCompanies] || baseCompanies['Corporate Retailers'];
    const company = companies[index % companies.length];
    
    const titles = ['VP Technology', 'Director IT', 'CTO', 'IT Manager', 'Senior Developer'];
    const title = titles[index % titles.length];
    
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan'];
    const lastNames = ['Johnson', 'Williams', 'Brown', 'Davis', 'Miller'];
    
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[index % lastNames.length];
    
    return {
      id: `${vertical.replace(/\s+/g, '')}-${index}`,
      fullName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      jobTitle: title,
      company,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '').replace(/'/g, '')}.com`,
      phone: `+1-555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      estimatedValue: 50000 + (index * 10000),
      vertical,
      department: 'Technology',
      buyerGroupRole: ['Decision Maker', 'Champion', 'Stakeholder'][index % 3],
      city: 'New York',
      state: 'NY',
      linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      description: `Business development opportunity at ${company}`
    };
  }

  /**
   * Infer vertical from company name for filtering
   */
  private inferVerticalFromCompany(companyName: string | null): string {
    if (!companyName) return 'Corporate Retailers';
    
    const company = companyName.toLowerCase();
    
    // C-Store companies (convenience stores)
    if (company.includes('7-eleven') || company.includes('circle k') || company.includes('wawa') || 
        company.includes('sheetz') || company.includes("casey's") || company.includes('racetrac') || 
        company.includes('pilot') || company.includes('flying j') || company.includes('speedway') ||
        company.includes('marathon') || company.includes('united pacific') || company.includes("stewart's") ||
        company.includes('thorntons') || company.includes('kwik trip') || company.includes('cumberland')) {
      return 'C Stores';
    }
    
    // Grocery stores
    if (company.includes('kroger') || company.includes('safeway') || company.includes('whole foods') || 
        company.includes('publix') || company.includes('wegmans') || company.includes('harris teeter') ||
        company.includes('giant') || company.includes('food lion') || company.includes('shoprite') ||
        company.includes('albertsons') || company.includes('meijer') || company.includes('h-e-b') ||
        company.includes('food 4 less') || company.includes('kings') || company.includes('ralphs')) {
      return 'Grocery Stores';
    }
    
    // Corporate retailers
    if (company.includes('walmart') || company.includes('target') || company.includes('costco') || 
        company.includes('home depot') || company.includes('lowes') || company.includes('best buy') ||
        company.includes("sam's club") || company.includes("bj's") || company.includes('menards') ||
        company.includes('tractor supply') || company.includes('dollar tree') || company.includes('dollar general') ||
        company.includes('family dollar') || company.includes('autozone') || company.includes("o'reilly")) {
      return 'Corporate Retailers';
    }
    
    // Quick service restaurants
    if (company.includes("mcdonald") || company.includes('subway') || company.includes('starbucks') || 
        company.includes('dunkin') || company.includes('taco bell') || company.includes('kfc') ||
        company.includes('burger king') || company.includes('wendy') || company.includes('chick-fil-a') ||
        company.includes('chipotle') || company.includes('domino') || company.includes('pizza hut') ||
        company.includes('papa john') || company.includes('arby') || company.includes('sonic') ||
        company.includes('dairy queen') || company.includes('jack in the box') || company.includes('popeyes')) {
      return 'Quick Service Restaurants';
    }
    
    // Default to Corporate Retailers for unclassified companies
    return 'Corporate Retailers';
  }

  /**
   * Get RTP prospects for current scenario
   * Replaces hardcoded speedrun prospect data
   */
  async getRtpProspects(limit = 20) {
    if (!this.currentScenario) {
      return [];
    }

    try {
      const leads = await (prisma as any).lead.findMany({
        where: {
          demoScenarioId: this.currentScenario,
          isDemoData: true
        },
        orderBy: { fullName: 'asc' }, // Consistent alphabetical ordering
        take: limit
      });

      // Get scenario details for dynamic content
      const scenario = await this.getScenario(this.currentScenario);
      const scenarioName = scenario?.name || 'Demo';
      
      // Ensure balanced vertical distribution for filtering
      const distributedLeads = this.distributeLeadsAcrossVerticals(leads, limit);
      
      // Group leads by company for proper Speedrun ranking
      const leadsByCompany = distributedLeads.reduce((acc: any, lead: any) => {
        const company = lead.company || 'Enterprise Company';
        if (!acc[company]) acc[company] = [];
        acc[company].push(lead);
        return acc;
      }, {});

      // FIXED SPEEDRUN RANKING ORDER - Ensures consistent 1A, 1B, 2A, 2B ranking
      // This prevents re-ranking between sessions for reliable VP demos
      // BUT: Allow dynamic ranking for demo users to test speedrun engine features
      const FIXED_SPEEDRUN_ORDER = [
        'Robinhood',    // 1A-1E: $145K Large Enterprise 
        'Stripe',       // 2A-2E: $135K Large Enterprise
        'Shopify',      // 3A-3E: $125K Large Enterprise
        'Zoom',         // 4A-4E: $115K Large Enterprise
        'Roblox',       // 5A-5D: $105K Large Enterprise
        'Epic Games',   // 6A-6D: $98K Mid Enterprise
        'Plaid',        // 7A-7D: $85K Mid Enterprise
        'Discord',      // 8A-8D: $78K Mid Enterprise
        'Chime',        // 9A-9D: $72K Mid Enterprise
        'Figma'         // 10A-10D: $65K Mid Enterprise
      ];

      // Check if speedrun engine settings exist (indicates user wants dynamic ranking)
      const speedrunSettings = typeof window !== 'undefined' ? localStorage.getItem('speedrun-engine-settings') : null;
      const allowDynamicRanking = speedrunSettings !== null;

      // Sort companies by fixed order, then any others alphabetically
      // BUT: If dynamic ranking is enabled, use different logic for demo users
      let companiesByPriority;
      
      if (allowDynamicRanking) {
        // For demo users with speedrun engine settings: apply MEDDPIC/methodology-based ranking
        console.log('🎯 DemoScenarioService: Dynamic ranking enabled - using methodology-based order');
        const settings = JSON.parse(speedrunSettings || '{}');
        
        companiesByPriority = Object.entries(leadsByCompany).sort(([a, aLeads], [b, bLeads]) => {
          if (settings['methodology'] === 'meddpicc') {
            // MEDDPICC: Prioritize companies with VPs/Directors and higher deal values
            const aHasDecisionMaker = (aLeads as any[]).some((lead: any) => 
              lead.jobTitle?.toLowerCase().includes('vp') || 
              lead.jobTitle?.toLowerCase().includes('director') ||
              lead.jobTitle?.toLowerCase().includes('cto') ||
              lead.jobTitle?.toLowerCase().includes('ciso')
            );
            const bHasDecisionMaker = (bLeads as any[]).some((lead: any) => 
              lead.jobTitle?.toLowerCase().includes('vp') || 
              lead.jobTitle?.toLowerCase().includes('director') ||
              lead.jobTitle?.toLowerCase().includes('cto') ||
              lead.jobTitle?.toLowerCase().includes('ciso')
            );
            
            if (aHasDecisionMaker !== bHasDecisionMaker) {
              return bHasDecisionMaker ? 1 : -1;
            }
            
            // Secondary: by company name for consistency
            return a.localeCompare(b);
          } else {
            // Other methodologies: use original fixed order
            const aIndex = FIXED_SPEEDRUN_ORDER.indexOf(a);
            const bIndex = FIXED_SPEEDRUN_ORDER.indexOf(b);
            
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.localeCompare(b);
          }
        });
      } else {
        // Original fixed ordering for production demos
        companiesByPriority = Object.entries(leadsByCompany).sort(([a], [b]) => {
          const aIndex = FIXED_SPEEDRUN_ORDER.indexOf(a);
          const bIndex = FIXED_SPEEDRUN_ORDER.indexOf(b);
          
          // If both companies are in the fixed order, sort by that order
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          
          // If only one is in the fixed order, it goes first
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          
          // If neither is in the fixed order, sort alphabetically
          return a.localeCompare(b);
        });
      }

      const rankedLeads: any[] = [];
      
      companiesByPriority.forEach(([company, companyLeads]: [string, any], companyIndex: number) => {
        // Sort people within company by buyer group priority, then by name for consistency
        const priorityOrder = ['Decision Maker', 'Champion', 'Stakeholder', 'Influencer', 'Opener'];
        const sortedLeads = (companyLeads as any[]).sort((a, b) => {
          const aPriority = priorityOrder.indexOf(a.buyerGroupRole || 'Opener');
          const bPriority = priorityOrder.indexOf(b.buyerGroupRole || 'Opener');
          
          // First sort by role priority
          const roleDiff = (aPriority === -1 ? 999 : aPriority) - (bPriority === -1 ? 999 : bPriority);
          if (roleDiff !== 0) return roleDiff;
          
          // Then sort by name for consistent ordering within same role
          return (a.fullName || '').localeCompare(b.fullName || '');
        });

        // Assign ranks: 1A-1F for first company, 2A-2F for second, etc.
        sortedLeads.forEach((lead: any, personIndex: number) => {
          const companyNum = companyIndex + 1;
          const personLetter = String.fromCharCode(65 + personIndex); // A, B, C, D, E, F
          rankedLeads.push({
            ...lead,
            companyIndex,
            personIndex,
            rank: `${companyNum}${personLetter}`,
            id: `${companyNum}${personLetter}`
          });
        });
      });

      return rankedLeads.map((lead: any, globalIndex: number) => ({
        id: lead.id,
        rank: lead.rank,
        name: lead.fullName || 'Executive Contact',
        title: lead.jobTitle || 'Technology Leader', 
        company: lead.company || 'Enterprise Company',
        email: lead.email || `${lead.firstName?.toLowerCase()}.${lead.lastName?.toLowerCase()}@${lead.company?.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: lead.phone || '+1-555-000-0000',
        dealSize: this.formatCurrency(lead.estimatedValue || 75000, 'USD'), // Use actual estimated value
        priority: globalIndex < 3 ? 'High Priority' : globalIndex < 6 ? 'Medium Priority' : globalIndex < 12 ? 'Low Priority' : 'Medium Priority',
        stage: ['Discovery', 'Proposal', 'Negotiation', 'Closing'][globalIndex % 4],
        status: ['Ready', 'Read', 'Completed'][globalIndex % 3],
        valueDriver: this.generateScenarioSpecificValueDriver(lead, scenario),
        engagement: Math.floor(Math.random() * 5) + 1,
        pain: this.generateScenarioSpecificPainSummary(lead, scenario), // Correct field name
        painSummary: this.generateScenarioSpecificPainSummary(lead, scenario), // Keep for compatibility
        // Additional required fields for complete prospect data
        buyingSignal: this.generateBuyingSignal(lead, scenario),
        closeProb: this.generateCloseProb(lead.estimatedValue || 75000),
        nextAction: this.generateNextAction(lead, scenario),
        timeline: this.generateTimeline(lead.estimatedValue || 75000),
        linkedin: lead.linkedinUrl || `https://linkedin.com/in/${lead.firstName?.toLowerCase()}-${lead.lastName?.toLowerCase()}`,
        location: [lead.city, lead.state].filter(Boolean).join(', ') || 'USA',
        department: lead.department || 'Technology',
        seniority: this.inferSeniority(lead.jobTitle),
        buyerRole: lead.buyerGroupRole || 'Technical Evaluator',
        influence: this.inferInfluence(lead.jobTitle),
        // Vertical for filtering - CRITICAL for Speedrun filters to work
        vertical: lead.vertical || this.inferVerticalFromCompany(lead.company) || 'Corporate Retailers',
        // Optional fields
        score: this.generateScore(lead.estimatedValue || 75000),
        budget: this.formatCurrency(lead.estimatedValue || 75000, 'USD'),
        enterpriseLevel: this.generateEnterpriseLevel(lead.estimatedValue || 75000)
      }));
    } catch (error) {
      console.error('❌ DemoScenarioService: Error fetching RTP prospects:', error);
      return [];
    }
  }

  /**
   * Get buyer group for specific company
   * Replaces hardcoded buyer group data in Monaco AI Chat
   */
  async getDemoBuyerGroup(company: string) {
    if (!this.currentScenario) {
      return [];
    }

    try {
      const leads = await (prisma as any).lead.findMany({
        where: {
          demoScenarioId: this.currentScenario,
          isDemoData: true,
          company: company
        }
      });

      return leads.map((lead: any) => ({
        name: lead.fullName || 'Executive Contact',
        title: lead.jobTitle || 'Technology Executive',
        role: lead.jobTitle || 'Technology Executive',
        email: lead.email || '',
        phone: lead.phone || '',
        linkedin: lead.linkedinUrl || '',
        company: lead.company || company,
        department: lead.department || 'Technology',
        seniority: lead.seniority || 'Senior',
        buyerGroupRole: lead.buyerGroupRole || 'Stakeholder',
        engagement: Math.floor(Math.random() * 5) + 1,
        painSummary: `Strategic initiatives at ${company} require modern solutions for competitive advantage`
      }));
    } catch (error) {
      console.error('❌ DemoScenarioService: Error fetching buyer group:', error);
      return [];
    }
  }

  private formatCurrency(amount: number | null, currency: string): string {
    if (!amount) return '$0';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    return formatter.format(amount);
  }

  private formatRevenue(amount: number | null, currency?: string): string {
    if (!amount) return '$0';
    
    // Format as currency for revenue display
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    return formatter.format(amount);
  }

  private parseEmployeeCount(companySize?: string | null): string {
    if (!companySize) return 'Unknown';
    
    // Map company size categories to employee count ranges
    const sizeMap: Record<string, string> = {
      'small': '1-50 employees',
      'medium': '51-200 employees',
      'medium-enterprise': '201-1000 employees',
      'large': '1000-5000 employees',
      'enterprise': '5000+ employees',
      'large-enterprise': '5000+ employees'
    };
    
    return sizeMap[companySize.toLowerCase()] || companySize;
  }

  private mapLeadStatusToCompanyStatus(leadStatus?: string): string {
    if (!leadStatus) return 'Buyer Group Identified';
    
    // Map lead statuses to buyer group-focused company statuses
    const statusMap: Record<string, string> = {
      'new': 'Buyer Group Identified',
      'contacted': 'Buyer Group Engaged', 
      'qualified': 'Buyer Group Engaged',
      'prospecting': 'Buyer Group Identified',
      'negotiating': 'Buyer Group Engaged',
      'won': 'Customer',
      'lost': 'Disqualified',
      'closed': 'Buyer Group Engaged'
    };
    
    return statusMap[leadStatus.toLowerCase()] || 'Buyer Group Identified';
  }

  /**
   * Generate scenario-specific value driver content - Enhanced for CloudCaddie
   */
  private generateScenarioSpecificValueDriver(lead: any, scenario: any): string {
    const company = lead.company || 'Company';
    const name = lead.fullName || lead.firstName || 'Executive';
    const title = lead.jobTitle || lead.title || 'Leader';
    const scenarioSlug = scenario?.slug || '';
    
    // CloudCaddie-specific value drivers
    if (scenarioSlug.includes('cloudcaddie') || this.isCloudCaddieScenario(scenario)) {
      return this.generateCloudCaddieValueDriver(lead, company, name, title);
    }
    
    // Legacy scenario handling
    if (scenarioSlug === 'snyk') {
      return `Our developer security platform addresses ${company}'s critical application security and vulnerability management needs`;
    } else if (scenarioSlug.includes('zeropoint')) {
      return `ZeroPoint's quantum-resistant encryption suite addresses ${company}'s critical security modernization needs`;
    } else if (scenarioSlug.includes('dell')) {
      return `Dell's enterprise infrastructure solutions address ${company}'s critical IT modernization and scalability needs`;
    } else {
      return `Our enterprise platform addresses ${company}'s critical business transformation needs`;
    }
  }

  /**
   * Generate CloudCaddie-specific value drivers based on role and company context
   */
  private generateCloudCaddieValueDriver(lead: any, company: string, name: string, title: string): string {
    const titleLower = title.toLowerCase();
    const dealValue = lead.estimatedValue || 75000;
    
    // Executive-level value drivers
    if (titleLower.includes('cro') || titleLower.includes('chief revenue')) {
      if (dealValue > 150000) {
        return `Revenue acceleration: CloudCaddie can help ${name} increase ${company}'s sales velocity by 35% and improve win rates by 28% through advanced buyer intelligence`;
      } else {
        return `Predictable revenue growth: CloudCaddie provides ${name} the sales intelligence needed to build a more predictable revenue engine at ${company}`;
      }
    }
    
    if (titleLower.includes('vp') && (titleLower.includes('sales') || titleLower.includes('revenue'))) {
      if (dealValue > 100000) {
        return `Sales team productivity: CloudCaddie can help ${name} increase rep productivity by 40% and reduce sales cycle time by 25% at ${company}`;
      } else {
        return `Quota attainment: CloudCaddie's buyer intelligence helps ${name} improve team quota attainment and forecast accuracy at ${company}`;
      }
    }
    
    // Management-level value drivers
    if (titleLower.includes('director') && titleLower.includes('sales')) {
      return `Sales execution excellence: CloudCaddie provides ${name} the tools to coach reps more effectively and prioritize high-value opportunities at ${company}`;
    }
    
    if (titleLower.includes('head of') && (titleLower.includes('sales') || titleLower.includes('revenue'))) {
      return `Scalable sales processes: CloudCaddie helps ${name} build repeatable, data-driven sales motions that scale with ${company}'s growth`;
    }
    
    // Individual contributor value drivers
    if (titleLower.includes('account') && (titleLower.includes('executive') || titleLower.includes('manager'))) {
      return `Deal acceleration: CloudCaddie's buyer group mapping helps ${name} navigate complex sales cycles and close deals faster at ${company}`;
    }
    
    if (titleLower.includes('enterprise') && titleLower.includes('sales')) {
      return `Enterprise deal intelligence: CloudCaddie provides ${name} the stakeholder insights needed to win complex enterprise deals at ${company}`;
    }
    
    if (titleLower.includes('business development')) {
      return `Pipeline generation: CloudCaddie's intelligent prospecting helps ${name} identify and qualify high-potential opportunities for ${company}`;
    }
    
    // Marketing value drivers
    if (titleLower.includes('marketing')) {
      return `Marketing attribution: CloudCaddie helps ${name} prove marketing's revenue impact and optimize campaign targeting at ${company}`;
    }
    
    // Operations value drivers
    if (titleLower.includes('operations') || titleLower.includes('ops')) {
      return `Sales efficiency: CloudCaddie's automation and analytics help ${name} streamline processes and improve operational efficiency at ${company}`;
    }
    
    // Company-size specific value drivers
    if (this.isLargeEnterprise(company, lead)) {
      return `Enterprise sales standardization: CloudCaddie helps ${name} standardize best practices and drive consistent results across ${company}'s global sales organization`;
    }
    
    if (this.isMidMarketCompany(company, lead)) {
      return `Competitive advantage: CloudCaddie helps ${name} compete with larger competitors by providing enterprise-grade sales intelligence at ${company}`;
    }
    
    // Technology company specific
    if (this.isTechCompany(company, lead)) {
      return `Data-driven sales: CloudCaddie's AI-powered platform provides ${name} the advanced analytics and automation that aligns with ${company}'s technical culture`;
    }
    
    // Default value driver
    return `Sales performance optimization: CloudCaddie provides ${name} the buyer intelligence and automation needed to accelerate sales performance at ${company}`;
  }

  /**
   * Generate scenario-specific pain summary content - Enhanced for CloudCaddie
   */
  private generateScenarioSpecificPainSummary(lead: any, scenario: any): string {
    const company = lead.company || 'Company';
    const name = lead.fullName || lead.firstName || 'Executive';
    const title = lead.jobTitle || lead.title || 'Leader';
    const scenarioSlug = scenario?.slug || '';
    
    // CloudCaddie-specific personalized summaries
    if (scenarioSlug.includes('cloudcaddie') || this.isCloudCaddieScenario(scenario)) {
      return this.generateCloudCaddiePersonalizedSummary(lead, company, name, title);
    }
    
    // Legacy scenario handling
    if (scenarioSlug === 'snyk') {
      return `${name} at ${company} needs comprehensive developer security tools to identify and fix vulnerabilities early in the development lifecycle`;
    } else if (scenarioSlug.includes('zeropoint')) {
      return `${name} at ${company} needs quantum-resistant security infrastructure to future-proof against emerging threats`;
    } else if (scenarioSlug.includes('dell')) {
      return `${name} at ${company} needs scalable enterprise infrastructure to support digital transformation initiatives`;
    } else {
      return `${name} at ${company} needs modern enterprise solutions to drive business growth and operational efficiency`;
    }
  }

  /**
   * Generate CloudCaddie-specific personalized summary based on person's role and company
   */
  private generateCloudCaddiePersonalizedSummary(lead: any, company: string, name: string, title: string): string {
    const titleLower = title.toLowerCase();
    const companyLower = company.toLowerCase();
    
    // Role-based CloudCaddie value propositions
    if (titleLower.includes('cro') || titleLower.includes('chief revenue')) {
      return `${name} as ${title} at ${company} is likely focused on accelerating revenue growth and improving sales team performance. CloudCaddie's Sales Acceleration platform can help ${company} increase deal velocity, improve win rates, and provide the revenue predictability that ${name} needs to hit aggressive growth targets.`;
    }
    
    if (titleLower.includes('vp') && (titleLower.includes('sales') || titleLower.includes('revenue'))) {
      return `${name} as ${title} at ${company} is responsible for scaling sales operations and hitting quarterly targets. CloudCaddie's buyer group intelligence and sales automation can help ${name} identify high-value prospects faster, reduce sales cycle time, and improve team productivity across ${company}'s sales organization.`;
    }
    
    if (titleLower.includes('director') && titleLower.includes('sales')) {
      return `${name} as ${title} at ${company} manages day-to-day sales execution and team performance. CloudCaddie's intelligent prospecting and engagement tools can help ${name} coach reps more effectively, prioritize the best opportunities, and increase overall team quota attainment at ${company}.`;
    }
    
    if (titleLower.includes('head of') && (titleLower.includes('sales') || titleLower.includes('revenue') || titleLower.includes('enablement'))) {
      return `${name} as ${title} at ${company} is building scalable sales processes and enablement programs. CloudCaddie's platform provides the buyer intelligence and automation that ${name} needs to create repeatable, data-driven sales motions that can scale with ${company}'s growth.`;
    }
    
    if (titleLower.includes('account') && (titleLower.includes('executive') || titleLower.includes('manager'))) {
      return `${name} as ${title} at ${company} is focused on growing key accounts and closing complex deals. CloudCaddie's buyer group mapping and stakeholder intelligence can help ${name} navigate complex sales cycles, identify all decision makers, and accelerate deal progression at ${company}.`;
    }
    
    if (titleLower.includes('enterprise') && titleLower.includes('sales')) {
      return `${name} as ${title} at ${company} handles large, complex enterprise deals with long sales cycles. CloudCaddie's advanced buyer intelligence and deal acceleration tools can help ${name} map buying committees, identify champions, and reduce time-to-close for enterprise opportunities at ${company}.`;
    }
    
    if (titleLower.includes('business development') || titleLower.includes('bd ')) {
      return `${name} as ${title} at ${company} is responsible for identifying and developing new business opportunities. CloudCaddie's intelligent prospecting and market intelligence can help ${name} discover high-potential prospects, understand their buying process, and create more qualified pipeline for ${company}.`;
    }
    
    if (titleLower.includes('marketing') && (titleLower.includes('vp') || titleLower.includes('director'))) {
      return `${name} as ${title} at ${company} needs to generate high-quality leads and demonstrate marketing ROI. CloudCaddie's buyer intelligence and attribution capabilities can help ${name} identify which prospects are most likely to convert, optimize campaign targeting, and prove marketing's impact on ${company}'s revenue growth.`;
    }
    
    if (titleLower.includes('operations') || titleLower.includes('ops')) {
      return `${name} as ${title} at ${company} is focused on optimizing sales processes and improving operational efficiency. CloudCaddie's automation and analytics can help ${name} streamline workflows, eliminate manual tasks, and provide the data insights needed to scale ${company}'s sales operations effectively.`;
    }
    
    // Company-size specific messaging
    if (this.isLargeEnterprise(company, lead)) {
      return `${name} as ${title} at ${company} manages complex sales processes across a large organization. CloudCaddie's enterprise-grade buyer intelligence and Sales Acceleration platform can help ${name} standardize best practices, improve cross-team collaboration, and drive consistent results across ${company}'s global sales organization.`;
    }
    
    if (this.isMidMarketCompany(company, lead)) {
      return `${name} as ${title} at ${company} is scaling sales operations in a growing mid-market company. CloudCaddie's intelligent automation and buyer insights can help ${name} punch above their weight, compete with larger competitors, and accelerate ${company}'s growth trajectory through more efficient sales processes.`;
    }
    
    // Technology company specific
    if (this.isTechCompany(company, lead)) {
      return `${name} as ${title} at ${company} understands the importance of data-driven sales processes. CloudCaddie's AI-powered buyer intelligence and sales automation aligns with ${company}'s technical culture, providing the advanced analytics and integration capabilities that ${name} needs to optimize sales performance.`;
    }
    
    // Default personalized summary
    return `${name} as ${title} at ${company} is likely focused on improving sales performance and driving revenue growth. CloudCaddie's buyer intelligence platform can help ${name} identify the best prospects, understand their buying process, and accelerate deal progression to achieve ${company}'s ambitious growth goals.`;
  }

  /**
   * Helper methods to determine company characteristics
   */
  private isCloudCaddieScenario(scenario: any): boolean {
    return scenario?.customer?.toLowerCase().includes('cloudcaddie') || 
           scenario?.name?.toLowerCase().includes('cloudcaddie');
  }

  private isLargeEnterprise(company: string, lead: any): boolean {
    const largeEnterpriseIndicators = ['microsoft', 'google', 'amazon', 'salesforce', 'oracle', 'sap', 'ibm', 'cisco', 'dell', 'hp', 'adobe', 'servicenow', 'workday', 'splunk', 'datadog', 'snowflake', 'atlassian', 'zoom', 'slack', 'dropbox', 'box', 'twilio', 'stripe', 'square', 'paypal', 'uber', 'lyft', 'airbnb', 'netflix', 'spotify'];
    return largeEnterpriseIndicators.some(indicator => company.toLowerCase().includes(indicator)) ||
           (lead['estimatedValue'] && lead.estimatedValue > 200000);
  }

  private isMidMarketCompany(company: string, lead: any): boolean {
    return !this.isLargeEnterprise(company, lead) && 
           (lead['estimatedValue'] && lead.estimatedValue > 50000 && lead.estimatedValue <= 200000);
  }

  private isTechCompany(company: string, lead: any): boolean {
    const techIndicators = ['software', 'tech', 'data', 'cloud', 'ai', 'saas', 'platform', 'analytics', 'security', 'cyber', 'dev', 'api', 'digital', 'automation', 'intelligence'];
    return techIndicators.some(indicator => 
      company.toLowerCase().includes(indicator) || 
      (lead['industry'] && lead.industry.toLowerCase().includes(indicator))
    );
  }

  /**
   * Generate buying signal based on scenario and deal value
   */
  private generateBuyingSignal(lead: any, scenario: any): string {
    const value = lead.estimatedValue || 75000;
    const scenarioSlug = scenario?.slug || '';
    
    if (scenarioSlug === 'snyk') {
      if (value > 150000) return 'Security audit completed';
      if (value > 100000) return 'Budget approved';
      if (value > 50000) return 'Technical evaluation';
      return 'Initial interest';
    } else if (scenarioSlug.includes('zeropoint')) {
      if (value > 150000) return 'Quantum threat assessment';
      if (value > 100000) return 'Security roadmap review';
      return 'Encryption modernization';
    } else {
      if (value > 150000) return 'Budget approved';
      if (value > 100000) return 'Technical evaluation';
      return 'Initial discovery';
    }
  }

  /**
   * Generate close probability based on deal value and stage
   */
  private generateCloseProb(value: number): string {
    if (value > 150000) return `${Math.floor(Math.random() * 20) + 75}%`; // 75-95%
    if (value > 100000) return `${Math.floor(Math.random() * 25) + 60}%`; // 60-85%
    if (value > 50000) return `${Math.floor(Math.random() * 30) + 45}%`;  // 45-75%
    return `${Math.floor(Math.random() * 35) + 30}%`; // 30-65%
  }

  /**
   * Generate next action based on scenario and lead
   */
  private generateNextAction(lead: any, scenario: any): string {
    const scenarioSlug = scenario?.slug || '';
    const actions = [];
    
    if (scenarioSlug === 'snyk') {
      actions.push('Security demo', 'Developer tool walkthrough', 'Integration planning', 'Security audit review', 'Technical discussion');
    } else if (scenarioSlug.includes('zeropoint')) {
      actions.push('Quantum demo', 'Security roadmap', 'Technical deep dive', 'Executive briefing');
    } else {
      actions.push('Product demo', 'Technical discussion', 'Business case review', 'Stakeholder meeting');
    }
    
    return actions[Math.floor(Math.random() * actions.length)] || 'Follow up';
  }

  /**
   * Generate timeline based on deal value
   */
  private generateTimeline(value: number): string {
    if (value > 150000) return Math.random() > 0.5 ? 'URGENT' : 'Q1 2025';
    if (value > 100000) return Math.random() > 0.5 ? 'Q1 2025' : 'Q2 2025';
    if (value > 50000) return Math.random() > 0.5 ? 'Q2 2025' : 'Q3 2025';
    return Math.random() > 0.5 ? 'Q3 2025' : 'Q4 2025';
  }

  /**
   * Generate enterprise level based on deal value and company size
   */
  private generateEnterpriseLevel(value: number): string {
    // Based on typical enterprise software spend patterns
    if (value > 150000) return 'Large Enterprise';
    if (value > 100000) return 'Enterprise';
    if (value > 50000) return 'Mid Enterprise';
    return 'Growth';
  }

  /**
   * Infer influence level from job title
   */
  private inferInfluence(jobTitle: string | null): string {
    if (!jobTitle) return 'Medium';
    
    const title = jobTitle.toLowerCase();
    if (title.includes('ceo') || title.includes('president') || title.includes('founder')) {
      return 'Very High';
    }
    if (title.includes('cto') || title.includes('cio') || title.includes('cso') || title.includes('vp')) {
      return 'High';
    }
    if (title.includes('director') || title.includes('head of') || title.includes('principal')) {
      return 'High';
    }
    if (title.includes('manager') || title.includes('lead') || title.includes('senior')) {
      return 'Medium';
    }
    return 'Low';
  }

  /**
   * Generate engagement score based on deal value
   */
  private generateScore(value: number): string {
    if (value > 150000) return `${Math.floor(Math.random() * 10) + 85}`; // 85-95
    if (value > 100000) return `${Math.floor(Math.random() * 15) + 70}`; // 70-85
    if (value > 50000) return `${Math.floor(Math.random() * 20) + 55}`;  // 55-75
    return `${Math.floor(Math.random() * 25) + 40}`; // 40-65
  }

  /**
   * Clear cache (useful for testing or when scenarios are updated)
   */
  clearCache(): void {
    this.scenarioCache.clear();
    console.log('🗑️ DemoScenarioService: Cache cleared');
  }
}

export const demoScenarioService = DemoScenarioService.getInstance(); 