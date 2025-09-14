import { NextRequest, NextResponse } from "next/server";

// GET: Fetch enrichment executions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // Return empty executions for now to prevent 405 errors
    return NextResponse.json({
      success: true,
      executions: [],
      activeExecutions: []
    });

  } catch (error) {
    console.error('❌ [ENRICHMENT GET] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch enrichment executions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: Company enrichment endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companies, workspaceId } = body;

    if (!companies || !Array.isArray(companies)) {
      return NextResponse.json({ error: "companies array is required" }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // For now, return the companies as-is to prevent 404 errors
    // This is a placeholder implementation
    return NextResponse.json({
      success: true,
      enrichedCompanies: companies.map((company: any) => ({
        ...company,
        enriched: true,
        enrichmentDate: new Date().toISOString()
      }))
    });

  } catch (error) {
    console.error('❌ [ENRICHMENT] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to enrich companies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
