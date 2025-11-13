import { NextRequest, NextResponse } from 'next/server';
import { getV1AuthUser } from '../../../auth';
import { generatePersonIntelligence } from '@/platform/services/person-intelligence-generator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/people/[id]/generate-intelligence
 * Generate and store intelligence fields for a person
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: personId } = await params;
    console.log(`🤖 [PERSON INTELLIGENCE] Generating intelligence for person: ${personId}`);

    // Generate intelligence
    const result = await generatePersonIntelligence({
      personId,
      workspaceId: authUser.workspaceId,
      forceRegenerate: false
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    console.log(`✅ [PERSON INTELLIGENCE] Intelligence generated successfully for person ${personId}`);

    return NextResponse.json({
      success: true,
      data: {
        intelligence: result.intelligence,
        cached: result.cached || false
      },
      message: result.message
    });

  } catch (error) {
    console.error('❌ [PERSON INTELLIGENCE] Error generating intelligence:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate intelligence' 
      },
      { status: 500 }
    );
  }
}

