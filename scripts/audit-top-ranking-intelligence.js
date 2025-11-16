#!/usr/bin/env node

/**
 * 🔍 TOP Engineering Plus Ranking Intelligence Audit
 * 
 * Analyzes if the global ranking system is smart enough to prioritize:
 * - Opportunities > Prospects > Leads
 * - High-value deals
 * - Engaged contacts
 * 
 * Usage:
 *   node scripts/audit-top-ranking-intelligence.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class TopRankingAudit {
  constructor() {
    this.workspaceId = TOP_ENGINEERING_PLUS_WORKSPACE_ID;
  }

  async run() {
    console.log('🔍 TOP ENGINEERING PLUS RANKING INTELLIGENCE AUDIT');
    console.log('='.repeat(70));
    console.log('');

    try {
      await prisma.$connect();
      
      // Get workspace info
      const workspace = await prisma.workspaces.findUnique({
        where: { id: this.workspaceId },
        select: { id: true, name: true, slug: true }
      });

      if (!workspace) {
        console.log('❌ TOP Engineering Plus workspace not found!');
        return;
      }

      console.log(`📊 Workspace: ${workspace.name} (${workspace.slug})`);
      console.log('');

      // Get all people with globalRank
      const allPeople = await prisma.people.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          globalRank: { not: null }
        },
        select: {
          id: true,
          fullName: true,
          status: true,
          globalRank: true,
          buyerGroupRole: true,
          influenceScore: true,
          engagementScore: true,
          jobTitle: true,
          lastAction: true,
          lastActionDate: true,
          company: {
            select: {
              id: true,
              name: true,
              status: true,
              globalRank: true,
              opportunityAmount: true,
              opportunityStage: true
            }
          },
          _count: {
            select: {
              actions: {
                where: {
                  status: 'COMPLETED',
                  type: { in: ['EMAIL', 'CALL', 'MEETING', 'DEMO'] }
                }
              }
            }
          }
        },
        orderBy: {
          globalRank: 'asc'
        }
      });

      console.log(`📈 Total people with globalRank: ${allPeople.length}`);
      console.log('');

      // Analyze by status
      const statusAnalysis = this.analyzeByStatus(allPeople);
      this.printStatusAnalysis(statusAnalysis);

      // Analyze top 50 (Speedrun)
      const top50Analysis = this.analyzeTop50(allPeople);
      this.printTop50Analysis(top50Analysis);

      // Check if prospects/opportunities are ranked higher
      const rankingIntelligence = this.analyzeRankingIntelligence(allPeople);
      this.printRankingIntelligence(rankingIntelligence);

      // Analyze ranking factors
      const factorAnalysis = this.analyzeRankingFactors(allPeople);
      this.printFactorAnalysis(factorAnalysis);

      // Recommendations
      this.printRecommendations(statusAnalysis, rankingIntelligence, factorAnalysis);

    } catch (error) {
      console.error('❌ Error:', error.message);
      console.error(error.stack);
    } finally {
      await prisma.$disconnect();
    }
  }

  analyzeByStatus(people) {
    const statusGroups = {
      OPPORTUNITY: [],
      PROSPECT: [],
      LEAD: [],
      CLIENT: [],
      OTHER: []
    };

    people.forEach(person => {
      const status = (person.status || '').toUpperCase();
      if (status === 'OPPORTUNITY') {
        statusGroups.OPPORTUNITY.push(person);
      } else if (status === 'PROSPECT') {
        statusGroups.PROSPECT.push(person);
      } else if (status === 'LEAD') {
        statusGroups.LEAD.push(person);
      } else if (status === 'CLIENT') {
        statusGroups.CLIENT.push(person);
      } else {
        statusGroups.OTHER.push(person);
      }
    });

    return {
      groups: statusGroups,
      stats: {
        opportunity: {
          count: statusGroups.OPPORTUNITY.length,
          avgRank: this.calculateAvgRank(statusGroups.OPPORTUNITY),
          top50Count: statusGroups.OPPORTUNITY.filter(p => p.globalRank <= 50).length,
          top100Count: statusGroups.OPPORTUNITY.filter(p => p.globalRank <= 100).length
        },
        prospect: {
          count: statusGroups.PROSPECT.length,
          avgRank: this.calculateAvgRank(statusGroups.PROSPECT),
          top50Count: statusGroups.PROSPECT.filter(p => p.globalRank <= 50).length,
          top100Count: statusGroups.PROSPECT.filter(p => p.globalRank <= 100).length
        },
        lead: {
          count: statusGroups.LEAD.length,
          avgRank: this.calculateAvgRank(statusGroups.LEAD),
          top50Count: statusGroups.LEAD.filter(p => p.globalRank <= 50).length,
          top100Count: statusGroups.LEAD.filter(p => p.globalRank <= 100).length
        },
        client: {
          count: statusGroups.CLIENT.length,
          avgRank: this.calculateAvgRank(statusGroups.CLIENT),
          top50Count: statusGroups.CLIENT.filter(p => p.globalRank <= 50).length,
          top100Count: statusGroups.CLIENT.filter(p => p.globalRank <= 100).length
        }
      }
    };
  }

  analyzeTop50(people) {
    const top50 = people.slice(0, 50);
    
    return {
      total: top50.length,
      byStatus: {
        opportunity: top50.filter(p => (p.status || '').toUpperCase() === 'OPPORTUNITY').length,
        prospect: top50.filter(p => (p.status || '').toUpperCase() === 'PROSPECT').length,
        lead: top50.filter(p => (p.status || '').toUpperCase() === 'LEAD').length,
        client: top50.filter(p => (p.status || '').toUpperCase() === 'CLIENT').length,
        other: top50.filter(p => {
          const status = (p.status || '').toUpperCase();
          return !['OPPORTUNITY', 'PROSPECT', 'LEAD', 'CLIENT'].includes(status);
        }).length
      },
      avgEngagement: this.calculateAvgEngagement(top50),
      avgInfluence: this.calculateAvgInfluence(top50),
      withBuyerGroupRole: top50.filter(p => p.buyerGroupRole).length,
      withActions: top50.filter(p => p._count.actions > 0).length
    };
  }

  analyzeRankingIntelligence(people) {
    const opportunities = people.filter(p => (p.status || '').toUpperCase() === 'OPPORTUNITY');
    const prospects = people.filter(p => (p.status || '').toUpperCase() === 'PROSPECT');
    const leads = people.filter(p => (p.status || '').toUpperCase() === 'LEAD');

    // Check if opportunities rank higher than prospects
    const oppAvgRank = this.calculateAvgRank(opportunities);
    const prospectAvgRank = this.calculateAvgRank(prospects);
    const leadAvgRank = this.calculateAvgRank(leads);

    // Check top 50 distribution
    const top50Opp = opportunities.filter(p => p.globalRank <= 50).length;
    const top50Prospect = prospects.filter(p => p.globalRank <= 50).length;
    const top50Lead = leads.filter(p => p.globalRank <= 50).length;

    // Check if higher-value opportunities rank higher
    const opportunitiesWithValue = opportunities.filter(p => 
      p.company?.opportunityAmount && parseFloat(p.company.opportunityAmount) > 0
    );
    const highValueOpps = opportunitiesWithValue.filter(p => 
      parseFloat(p.company.opportunityAmount) >= 50000
    );
    const highValueAvgRank = this.calculateAvgRank(highValueOpps);
    const lowValueAvgRank = this.calculateAvgRank(
      opportunitiesWithValue.filter(p => parseFloat(p.company.opportunityAmount) < 50000)
    );

    return {
      opportunitiesRankHigher: oppAvgRank < prospectAvgRank,
      prospectsRankHigher: prospectAvgRank < leadAvgRank,
      opportunityAvgRank: oppAvgRank,
      prospectAvgRank: prospectAvgRank,
      leadAvgRank: leadAvgRank,
      top50Distribution: {
        opportunity: top50Opp,
        prospect: top50Prospect,
        lead: top50Lead
      },
      highValueRanking: {
        highValueAvgRank: highValueAvgRank,
        lowValueAvgRank: lowValueAvgRank,
        highValueRankHigher: highValueAvgRank < lowValueAvgRank,
        highValueCount: highValueOpps.length
      }
    };
  }

  analyzeRankingFactors(people) {
    const top50 = people.slice(0, 50);
    const bottom50 = people.slice(-50);

    return {
      top50: {
        avgInfluenceScore: this.calculateAvgInfluence(top50),
        avgEngagementScore: this.calculateAvgEngagement(top50),
        withBuyerGroupRole: top50.filter(p => p.buyerGroupRole).length,
        withActions: top50.filter(p => p._count.actions > 0).length,
        avgActions: top50.reduce((sum, p) => sum + p._count.actions, 0) / top50.length
      },
      bottom50: {
        avgInfluenceScore: this.calculateAvgInfluence(bottom50),
        avgEngagementScore: this.calculateAvgEngagement(bottom50),
        withBuyerGroupRole: bottom50.filter(p => p.buyerGroupRole).length,
        withActions: bottom50.filter(p => p._count.actions > 0).length,
        avgActions: bottom50.reduce((sum, p) => sum + p._count.actions, 0) / bottom50.length
      }
    };
  }

  calculateAvgRank(people) {
    if (people.length === 0) return null;
    const sum = people.reduce((acc, p) => acc + (p.globalRank || 0), 0);
    return Math.round(sum / people.length);
  }

  calculateAvgEngagement(people) {
    if (people.length === 0) return 0;
    const sum = people.reduce((acc, p) => acc + (p.engagementScore || 0), 0);
    return Math.round((sum / people.length) * 100) / 100;
  }

  calculateAvgInfluence(people) {
    if (people.length === 0) return 0;
    const sum = people.reduce((acc, p) => acc + (p.influenceScore || 0), 0);
    return Math.round((sum / people.length) * 100) / 100;
  }

  printStatusAnalysis(analysis) {
    console.log('📊 STATUS DISTRIBUTION ANALYSIS');
    console.log('-'.repeat(70));
    console.log('');
    
    const stats = analysis.stats;
    
    console.log('Overall Distribution:');
    console.log(`  Opportunities: ${stats.opportunity.count} (avg rank: ${stats.opportunity.avgRank || 'N/A'})`);
    console.log(`  Prospects: ${stats.prospect.count} (avg rank: ${stats.prospect.avgRank || 'N/A'})`);
    console.log(`  Leads: ${stats.lead.count} (avg rank: ${stats.lead.avgRank || 'N/A'})`);
    console.log(`  Clients: ${stats.client.count} (avg rank: ${stats.client.avgRank || 'N/A'})`);
    console.log('');

    console.log('Top 50 (Speedrun) Distribution:');
    console.log(`  Opportunities: ${stats.opportunity.top50Count} (${((stats.opportunity.top50Count / 50) * 100).toFixed(1)}%)`);
    console.log(`  Prospects: ${stats.prospect.top50Count} (${((stats.prospect.top50Count / 50) * 100).toFixed(1)}%)`);
    console.log(`  Leads: ${stats.lead.top50Count} (${((stats.lead.top50Count / 50) * 100).toFixed(1)}%)`);
    console.log(`  Clients: ${stats.client.top50Count} (${((stats.client.top50Count / 50) * 100).toFixed(1)}%)`);
    console.log('');

    console.log('Top 100 Distribution:');
    console.log(`  Opportunities: ${stats.opportunity.top100Count} (${((stats.opportunity.top100Count / 100) * 100).toFixed(1)}%)`);
    console.log(`  Prospects: ${stats.prospect.top100Count} (${((stats.prospect.top100Count / 100) * 100).toFixed(1)}%)`);
    console.log(`  Leads: ${stats.lead.top100Count} (${((stats.lead.top100Count / 100) * 100).toFixed(1)}%)`);
    console.log('');
  }

  printTop50Analysis(analysis) {
    console.log('🏆 TOP 50 (SPEEDRUN) QUALITY ANALYSIS');
    console.log('-'.repeat(70));
    console.log('');
    
    console.log(`Status Breakdown:`);
    console.log(`  Opportunities: ${analysis.byStatus.opportunity} (${((analysis.byStatus.opportunity / analysis.total) * 100).toFixed(1)}%)`);
    console.log(`  Prospects: ${analysis.byStatus.prospect} (${((analysis.byStatus.prospect / analysis.total) * 100).toFixed(1)}%)`);
    console.log(`  Leads: ${analysis.byStatus.lead} (${((analysis.byStatus.lead / analysis.total) * 100).toFixed(1)}%)`);
    console.log(`  Clients: ${analysis.byStatus.client} (${((analysis.byStatus.client / analysis.total) * 100).toFixed(1)}%)`);
    console.log(`  Other: ${analysis.byStatus.other} (${((analysis.byStatus.other / analysis.total) * 100).toFixed(1)}%)`);
    console.log('');
    
    console.log(`Engagement Metrics:`);
    console.log(`  Avg Influence Score: ${analysis.avgInfluence}`);
    console.log(`  Avg Engagement Score: ${analysis.avgEngagement}`);
    console.log(`  With Buyer Group Role: ${analysis.withBuyerGroupRole} (${((analysis.withBuyerGroupRole / analysis.total) * 100).toFixed(1)}%)`);
    console.log(`  With Actions: ${analysis.withActions} (${((analysis.withActions / analysis.total) * 100).toFixed(1)}%)`);
    console.log('');
  }

  printRankingIntelligence(intelligence) {
    console.log('🧠 RANKING INTELLIGENCE CHECK');
    console.log('-'.repeat(70));
    console.log('');

    console.log('Status Priority (lower rank = higher priority):');
    console.log(`  Opportunities avg rank: ${intelligence.opportunityAvgRank || 'N/A'}`);
    console.log(`  Prospects avg rank: ${intelligence.prospectAvgRank || 'N/A'}`);
    console.log(`  Leads avg rank: ${intelligence.leadAvgRank || 'N/A'}`);
    console.log('');

    const oppHigher = intelligence.opportunitiesRankHigher ? '✅ YES' : '❌ NO';
    const prospectHigher = intelligence.prospectsRankHigher ? '✅ YES' : '❌ NO';
    
    console.log(`Priority Check:`);
    console.log(`  Opportunities rank higher than Prospects: ${oppHigher}`);
    console.log(`  Prospects rank higher than Leads: ${prospectHigher}`);
    console.log('');

    console.log('Top 50 Distribution (from all records):');
    console.log(`  Opportunities: ${intelligence.top50Distribution.opportunity}`);
    console.log(`  Prospects: ${intelligence.top50Distribution.prospect}`);
    console.log(`  Leads: ${intelligence.top50Distribution.lead}`);
    console.log('');
    
    // Note: These numbers represent how many of each status type have ranks <= 50
    // They may not add up to 50 if there are other statuses or if some records are missing

    if (intelligence.highValueRanking.highValueCount > 0) {
      console.log('High-Value Opportunity Ranking:');
      console.log(`  High-value (>$50K) avg rank: ${intelligence.highValueRanking.highValueAvgRank || 'N/A'}`);
      console.log(`  Low-value (<$50K) avg rank: ${intelligence.highValueRanking.lowValueAvgRank || 'N/A'}`);
      const highValueHigher = intelligence.highValueRanking.highValueRankHigher ? '✅ YES' : '❌ NO';
      console.log(`  High-value rank higher: ${highValueHigher}`);
      console.log('');
    }
  }

  printFactorAnalysis(factors) {
    console.log('⚙️  RANKING FACTOR ANALYSIS');
    console.log('-'.repeat(70));
    console.log('');

    console.log('Top 50 vs Bottom 50:');
    console.log(`  Influence Score: ${factors.top50.avgInfluenceScore} vs ${factors.bottom50.avgInfluenceScore}`);
    console.log(`  Engagement Score: ${factors.top50.avgEngagementScore} vs ${factors.bottom50.avgEngagementScore}`);
    console.log(`  Buyer Group Role: ${factors.top50.withBuyerGroupRole} vs ${factors.bottom50.withBuyerGroupRole}`);
    console.log(`  With Actions: ${factors.top50.withActions} vs ${factors.bottom50.withActions}`);
    console.log(`  Avg Actions: ${factors.top50.avgActions.toFixed(1)} vs ${factors.bottom50.avgActions.toFixed(1)}`);
    console.log('');
  }

  printRecommendations(statusAnalysis, intelligence, factors) {
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(70));
    console.log('');

    const recommendations = [];

    // Check if opportunities are prioritized
    if (!intelligence.opportunitiesRankHigher) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Opportunities are NOT ranking higher than Prospects',
        solution: 'Update ranking algorithm to heavily weight OPPORTUNITY status (suggest +500 rank boost)'
      });
    }

    // Check if prospects are prioritized over leads
    if (!intelligence.prospectsRankHigher) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Prospects are NOT ranking higher than Leads',
        solution: 'Update ranking algorithm to weight PROSPECT status higher than LEAD (suggest +300 rank boost)'
      });
    }

    // Check top 50 distribution
    const top50OppPct = (intelligence.top50Distribution.opportunity / 50) * 100;
    const top50ProspectPct = (intelligence.top50Distribution.prospect / 50) * 100;
    
    if (top50OppPct < 30) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: `Only ${top50OppPct.toFixed(1)}% of top 50 are Opportunities (should be 40%+)`,
        solution: 'Increase status weight in ranking algorithm to prioritize Opportunities in Speedrun'
      });
    }

    if (top50ProspectPct < 20) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: `Only ${top50ProspectPct.toFixed(1)}% of top 50 are Prospects (should be 30%+)`,
        solution: 'Increase status weight in ranking algorithm to prioritize Prospects in Speedrun'
      });
    }

    // Check high-value ranking
    if (intelligence.highValueRanking.highValueCount > 0 && !intelligence.highValueRanking.highValueRankHigher) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'High-value opportunities are NOT ranking higher than low-value',
        solution: 'Add opportunityAmount as a ranking factor (higher value = lower rank)'
      });
    }

    // Check engagement factors
    if (factors.top50.avgEngagementScore < factors.bottom50.avgEngagementScore) {
      recommendations.push({
        priority: 'LOW',
        issue: 'Top 50 has lower engagement scores than bottom 50',
        solution: 'Review engagement score calculation - may need to increase weight'
      });
    }

    if (recommendations.length === 0) {
      console.log('✅ Ranking system appears to be working correctly!');
      console.log('   Opportunities and Prospects are properly prioritized.');
    } else {
      recommendations.forEach((rec, idx) => {
        console.log(`${idx + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`   Solution: ${rec.solution}`);
        console.log('');
      });
    }

    console.log('');
    console.log('📝 NEXT STEPS:');
    console.log('1. Review the ranking algorithm in src/app/api/v1/speedrun/re-rank/route.ts');
    console.log('2. Ensure status priority weights are: OPPORTUNITY (10) > PROSPECT (8) > LEAD (2)');
    console.log('3. Consider adding opportunityAmount as a ranking factor');
    console.log('4. Run re-rank API to update globalRank values: POST /api/v1/speedrun/re-rank');
    console.log('');
  }
}

// Run audit
async function main() {
  const audit = new TopRankingAudit();
  await audit.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TopRankingAudit;

