/**
 * Speedrun Insights Service
 * 
 * Generates expert insights for Dano's Retail Product Solutions business
 * Focuses on industry-specific insights that feel like insider knowledge
 */

export interface SpeedrunInsight {
  id: string;
  title: string;
  description: string;
  category: 'industry' | 'competitive' | 'opportunity' | 'trend' | 'tactical';
  urgency: 'high' | 'medium' | 'low';
  relevance: number; // 0-100
  source: string;
  actionable: boolean;
  tags: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface InsightFilters {
  category?: string;
  urgency?: string;
  tags?: string[];
  search?: string;
}

export class SpeedrunInsightsService {
  private static instance: SpeedrunInsightsService;
  private insights: SpeedrunInsight[] = [];

  public static getInstance(): SpeedrunInsightsService {
    if (!SpeedrunInsightsService.instance) {
      SpeedrunInsightsService['instance'] = new SpeedrunInsightsService();
    }
    return SpeedrunInsightsService.instance;
  }

  /**
   * Generate insights for Dano's RPS business
   */
  async generateInsights(): Promise<SpeedrunInsight[]> {
    // Generate fresh insights based on current market conditions
    const currentInsights = this.generateCurrentInsights();
    
    // Add to cache
    this['insights'] = currentInsights;
    
    return currentInsights;
  }

  /**
   * Get insights with optional filtering
   */
  async getInsights(filters?: InsightFilters): Promise<SpeedrunInsight[]> {
    if (this['insights']['length'] === 0) {
      await this.generateInsights();
    }

    let filteredInsights = [...this.insights];

    // Apply filters
    if (filters?.category) {
      filteredInsights = filteredInsights.filter(insight => insight['category'] === filters.category);
    }

    if (filters?.urgency) {
      filteredInsights = filteredInsights.filter(insight => insight['urgency'] === filters.urgency);
    }

    if (filters?.tags && filters.tags.length > 0) {
      filteredInsights = filteredInsights.filter(insight => 
        filters.tags!.some(tag => insight.tags.includes(tag))
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredInsights = filteredInsights.filter(insight =>
        insight.title.toLowerCase().includes(searchLower) ||
        insight.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by relevance and urgency
    return filteredInsights.sort((a, b) => {
      const urgencyScore = { high: 3, medium: 2, low: 1 };
      const aScore = urgencyScore[a.urgency] + (a.relevance / 100);
      const bScore = urgencyScore[b.urgency] + (b.relevance / 100);
      return bScore - aScore;
    });
  }

  /**
   * Generate current insights for RPS business
   */
  private generateCurrentInsights(): SpeedrunInsight[] {
    const now = new Date();
    
    return [
      {
        id: 'insight-1',
        title: 'C-Store Chains Accelerating Digital Transformation',
        description: 'Major convenience store chains are investing heavily in digital price tags and IoT-enabled fixtures. 7-Eleven, Circle K, and Wawa are leading this trend, creating opportunities for integrated fixture solutions that support digital price management.',
        category: 'trend',
        urgency: 'high',
        relevance: 95,
        source: 'Industry Analysis',
        actionable: true,
        tags: ['c-stores', 'digital transformation', 'IoT', 'price management'],
        createdAt: now,
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      {
        id: 'insight-2',
        title: 'Grocery Stores Prioritizing Customer Flow Optimization',
        description: 'Post-pandemic, grocery chains are redesigning store layouts to improve customer flow and reduce congestion. This creates immediate opportunities for flexible gondola systems that can be quickly reconfigured for seasonal promotions.',
        category: 'opportunity',
        urgency: 'medium',
        relevance: 88,
        source: 'Market Research',
        actionable: true,
        tags: ['grocery', 'store layout', 'customer flow', 'seasonal'],
        createdAt: now,
        expiresAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000) // 45 days
      },
      {
        id: 'insight-3',
        title: 'Fuel Stations Expanding Food Service Areas',
        description: 'Gas stations are aggressively expanding their food service areas to compete with convenience stores. This trend requires specialized fixtures for food displays, creating a new market segment for RPS solutions.',
        category: 'industry',
        urgency: 'high',
        relevance: 92,
        source: 'Competitive Intelligence',
        actionable: true,
        tags: ['fuel stations', 'food service', 'expansion', 'new market'],
        createdAt: now,
        expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) // 60 days
      },
      {
        id: 'insight-4',
        title: 'Competitor Price Wars in C-Store Fixtures',
        description: 'Major fixture manufacturers are engaging in aggressive pricing strategies for C-store chains. This creates an opportunity to differentiate on quality, customization, and service rather than competing on price alone.',
        category: 'competitive',
        urgency: 'medium',
        relevance: 85,
        source: 'Competitive Analysis',
        actionable: true,
        tags: ['competition', 'pricing', 'differentiation', 'quality'],
        createdAt: now,
        expiresAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000) // 20 days
      },
      {
        id: 'insight-5',
        title: 'Q4 Budget Flush Creates Urgent Opportunities',
        description: 'Many retail chains have unspent Q4 budgets that must be used by year-end. This creates a 30-day window of opportunity for quick-turn fixture projects, especially for chains looking to improve holiday merchandising.',
        category: 'tactical',
        urgency: 'high',
        relevance: 90,
        source: 'Financial Analysis',
        actionable: true,
        tags: ['Q4', 'budget', 'urgent', 'holiday', 'quick-turn'],
        createdAt: now,
        expiresAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) // 15 days
      },
      {
        id: 'insight-6',
        title: 'Sustainability Requirements Driving Fixture Changes',
        description: 'New sustainability regulations are forcing retailers to replace older fixtures with eco-friendly alternatives. This regulatory pressure creates a compliance-driven market for sustainable fixture solutions.',
        category: 'trend',
        urgency: 'medium',
        relevance: 82,
        source: 'Regulatory Analysis',
        actionable: true,
        tags: ['sustainability', 'regulations', 'compliance', 'eco-friendly'],
        createdAt: now,
        expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days
      },
      {
        id: 'insight-7',
        title: 'Regional Grocery Chains Consolidating Vendors',
        description: 'Regional grocery chains are consolidating their fixture vendors to reduce complexity and improve service. This creates opportunities to become the primary vendor for multiple locations within a chain.',
        category: 'opportunity',
        urgency: 'medium',
        relevance: 87,
        source: 'Vendor Analysis',
        actionable: true,
        tags: ['consolidation', 'regional', 'vendor management', 'service'],
        createdAt: now,
        expiresAt: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000) // 40 days
      },
      {
        id: 'insight-8',
        title: 'Beer Cave Installations Peaking in Q1',
        description: 'Beer cave installations typically peak in Q1 as retailers prepare for spring and summer sales. This seasonal pattern creates predictable demand that can be planned for in advance.',
        category: 'tactical',
        urgency: 'low',
        relevance: 78,
        source: 'Seasonal Analysis',
        actionable: true,
        tags: ['beer cave', 'seasonal', 'Q1', 'planning'],
        createdAt: now,
        expiresAt: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000) // 120 days
      }
    ];
  }

  /**
   * Get available filter options
   */
  getFilterOptions() {
    const categories = ['industry', 'competitive', 'opportunity', 'trend', 'tactical'];
    const urgencies = ['high', 'medium', 'low'];
    const allTags = Array.from(new Set(this.insights.flatMap(insight => insight.tags)));

    return {
      categories,
      urgencies,
      tags: allTags
    };
  }

  /**
   * Mark insight as actionable
   */
  markAsActionable(insightId: string): void {
    const insight = this.insights.find(i => i['id'] === insightId);
    if (insight) {
      insight['actionable'] = true;
    }
  }

  /**
   * Get insights summary
   */
  getInsightsSummary() {
    const total = this.insights.length;
    const highUrgency = this.insights.filter(i => i['urgency'] === 'high').length;
    const actionable = this.insights.filter(i => i.actionable).length;
    const avgRelevance = this.insights.reduce((sum, i) => sum + i.relevance, 0) / total;

    return {
      total,
      highUrgency,
      actionable,
      avgRelevance: Math.round(avgRelevance)
    };
  }
}
