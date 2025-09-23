import { NextRequest, NextResponse } from 'next/server';
import { UnifiedMasterRankingEngine } from '@/platform/services/unified-master-ranking';

/**
 * 🏆 UNIFIED MASTER RANKING API
 * 
 * Returns the unified master ranking for all sections:
 * - Companies (1-476)
 * - People (1-4760) 
 * - Leads (1-2000)
 * - Prospects (2001-4760)
 * - Speedrun (1-30)
 */

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Get workspace and user from request
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId');
    
    if (!workspaceId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing workspaceId or userId'
      }, { status: 400 });
    }
    
    console.log(`🏆 [UNIFIED MASTER RANKING API] Generating master ranking for workspace: ${workspaceId}, user: ${userId}`);
    
    // Generate unified master ranking
    const unifiedRanking = await UnifiedMasterRankingEngine.generateMasterRanking(workspaceId, userId);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ [UNIFIED MASTER RANKING API] Generated ranking in ${processingTime}ms`);
    
    return NextResponse.json({
      success: true,
      data: {
        companies: unifiedRanking.companies,
        people: unifiedRanking.people,
        leads: unifiedRanking.leads,
        prospects: unifiedRanking.prospects,
        speedrun: unifiedRanking.speedrun,
        lastCalculated: unifiedRanking.lastCalculated,
        counts: {
          companies: unifiedRanking.companies.length,
          people: unifiedRanking.people.length,
          leads: unifiedRanking.leads.length,
          prospects: unifiedRanking.prospects.length,
          speedrun: unifiedRanking.speedrun.length
        }
      },
      processingTime
    });
    
  } catch (error) {
    console.error('❌ [UNIFIED MASTER RANKING API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      data: {
        companies: [],
        people: [],
        leads: [],
        prospects: [],
        speedrun: [],
        counts: {
          companies: 0,
          people: 0,
          leads: 0,
          prospects: 0,
          speedrun: 0
        }
      }
    }, { status: 500 });
  }
}
