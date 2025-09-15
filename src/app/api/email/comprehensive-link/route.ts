import { NextRequest, NextResponse } from 'next/server';
import { ComprehensiveEmailLinkingService } from '@/platform/services/ComprehensiveEmailLinkingService';

const emailLinkingService = ComprehensiveEmailLinkingService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const { emailIds, workspaceId } = await request.json();

    if (!emailIds || !Array.isArray(emailIds)) {
      return NextResponse.json(
        { error: 'emailIds array is required' },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    console.log(`🔗 Linking ${emailIds.length} emails to entities...`);

    // Link emails in batch
    const results = await emailLinkingService.linkEmailsInBatch(emailIds, workspaceId);

    // Calculate summary statistics
    const summary = {
      totalProcessed: results.length,
      linkedToPerson: results.filter(r => r.linkedToPerson).length,
      linkedToCompany: results.filter(r => r.linkedToCompany).length,
      linkedToAction: results.filter(r => r.linkedToAction).length,
      fullyLinked: results.filter(r => r.linkedToPerson && r.linkedToCompany && r.linkedToAction).length,
      averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    };

    console.log(`✅ Email linking complete:`, summary);

    return NextResponse.json({
      success: true,
      summary,
      results
    });

  } catch (error) {
    console.error('❌ Error in comprehensive email linking:', error);
    return NextResponse.json(
      { error: 'Failed to link emails', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Get linking statistics
    const statistics = await emailLinkingService.getLinkingStatistics(workspaceId);

    return NextResponse.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('❌ Error getting email linking statistics:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics', details: error.message },
      { status: 500 }
    );
  }
}
