import { NextRequest, NextResponse } from 'next/server';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET(
  request: NextRequest,
  { params }: { params: { scenarioSlug: string } }
) {
  try {
    const { scenarioSlug } = params;
    
    console.log(`🎯 [DEMO SCENARIO API] Loading scenario: ${scenarioSlug}`);
    
    // Get scenario data from the main scenarios list
    const scenariosResponse = await fetch(`${request.nextUrl.origin}/api/demo-scenarios`);
    const scenariosData = await scenariosResponse.json();
    
    if (!scenariosData.success) {
      throw new Error('Failed to load scenarios');
    }
    
    // Find the specific scenario
    const scenario = scenariosData.scenarios.find((s: any) => s['slug'] === scenarioSlug);
    
    if (!scenario) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Scenario '${scenarioSlug}' not found`,
          scenario: null
        },
        { status: 404 }
      );
    }
    
    console.log(`✅ [DEMO SCENARIO API] Found scenario: ${scenario.name}`);
    
    return NextResponse.json({
      success: true,
      scenario: scenario
    });
    
  } catch (error) {
    console.error('❌ [DEMO SCENARIO API] Error loading scenario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load demo scenario',
        scenario: null
      },
      { status: 500 }
    );
  }
}
