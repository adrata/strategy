import { NextRequest, NextResponse } from 'next/server';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'winning-variant';
    
    console.log(`🎯 [DEMO OPPORTUNITIES API] Loading opportunities for scenario: ${scenario}`);
    
    // Generate scenario-specific opportunities data
    const opportunities = generateScenarioOpportunities(scenario);
    
    console.log(`✅ [DEMO OPPORTUNITIES API] Generated ${opportunities.length} opportunities for scenario: ${scenario}`);
    
    return NextResponse.json({
      success: true,
      opportunities: opportunities,
      scenario: scenario,
      count: opportunities.length
    });
    
  } catch (error) {
    console.error('❌ [DEMO OPPORTUNITIES API] Error loading opportunities:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load demo opportunities',
        opportunities: []
      },
      { status: 500 }
    );
  }
}

function generateScenarioOpportunities(scenario: string) {
  // Return empty array for all scenarios - no demo opportunities data yet
  // In a real implementation, this would return demo opportunities data
  return [];
}
