import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'winning-variant';
    
    console.log(`🎯 [DEMO SELLERS API] Loading sellers for scenario: ${scenario}`);
    
    // Generate scenario-specific sellers data
    const sellers = generateScenarioSellers(scenario);
    
    console.log(`✅ [DEMO SELLERS API] Generated ${sellers.length} sellers for scenario: ${scenario}`);
    
    return NextResponse.json({
      success: true,
      sellers: sellers,
      scenario: scenario,
      count: sellers.length
    });
    
  } catch (error) {
    console.error('❌ [DEMO SELLERS API] Error loading sellers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load demo sellers',
        sellers: []
      },
      { status: 500 }
    );
  }
}

function generateScenarioSellers(scenario: string) {
  // Return empty array for all scenarios - no demo sellers data yet
  // Will be populated with real sellers from the 3 companies in another chat
  return [];
}
