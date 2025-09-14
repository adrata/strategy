import { NextRequest, NextResponse } from 'next/server';
import { MasterRankingEngine } from '@/platform/services/master-ranking-engine';

export const runtime = 'nodejs';

/**
 * 🏆 MASTER RANKING API
 * 
 * Returns the master ranking of ALL contacts (1-N) and filtered views
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const userId = searchParams.get("userId");
    const view = searchParams.get("view") as 'speedrun' | 'leads' | 'prospects' | 'opportunities' | 'all';

    if (!workspaceId || !userId) {
      return NextResponse.json({ error: "workspaceId and userId are required" }, { status: 400 });
    }

    console.log(`🏆 [MASTER RANKING API] Generating ranking for workspace: ${workspaceId}, view: ${view || 'all'}`);

    // Generate master ranking
    const masterRanking = await MasterRankingEngine.generateMasterRanking(workspaceId, userId);
    
    // Get filtered view if requested
    const filteredData = view && view !== 'all' 
      ? MasterRankingEngine.getFilteredView(masterRanking, view)
      : masterRanking;
    
    // Calculate timing distribution for insights
    const timingDistribution = masterRanking.reduce((acc, contact) => {
      const timing = contact.nextActionTiming;
      acc[timing] = (acc[timing] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      masterRanking: view === 'all' ? masterRanking : filteredData,
      totalContacts: masterRanking.length,
      view: view || 'all',
      timingDistribution,
      topOpportunities: masterRanking
        .filter(c => c['type'] === 'opportunity_contact')
        .slice(0, 10)
        .map(c => ({
          rank: c.masterRank,
          name: c.name,
          company: c.company,
          value: c.opportunityValue,
          stage: c.opportunityStage
        }))
    });

  } catch (error) {
    console.error('❌ [MASTER RANKING API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate master ranking',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
