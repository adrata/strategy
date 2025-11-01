import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'winning-variant';
    
    console.log(`🎯 [DEMO LEADS API] Loading leads for scenario: ${scenario}`);
    
    // Generate scenario-specific leads data
    const leads = generateScenarioLeads(scenario);
    
    console.log(`✅ [DEMO LEADS API] Generated ${leads.length} leads for scenario: ${scenario}`);
    
    return NextResponse.json({
      success: true,
      leads: leads,
      scenario: scenario,
      count: leads.length
    });
    
  } catch (error) {
    console.error('❌ [DEMO LEADS API] Error loading leads:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load demo leads',
        leads: []
      },
      { status: 500 }
    );
  }
}

function generateScenarioLeads(scenario: string) {
  // Return empty array for all scenarios - no demo leads data yet
  // In a real implementation, this would return demo leads data
  return [];
}
