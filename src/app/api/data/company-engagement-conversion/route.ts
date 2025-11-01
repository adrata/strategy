import { NextRequest, NextResponse } from 'next/server';
import { companyEngagementConverter } from '@/platform/services/company-engagement-conversion';

/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * GET: Get company engagement conversion statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || 'adrata';
    
    console.log(`📊 [COMPANY CONVERSION API] Getting stats for workspace: ${workspaceId}`);
    
    const stats = await companyEngagementConverter.getConversionStats(workspaceId);
    
    return NextResponse.json({
      success: true,
      stats,
      message: 'Conversion statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ [COMPANY CONVERSION API] Error getting stats:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get conversion statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST: Trigger company engagement conversion process
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId, leadId } = await request.json();
    
    if (!workspaceId) {
      return NextResponse.json({
        success: false,
        error: 'workspaceId is required'
      }, { status: 400 });
    }
    
    console.log(`🔄 [COMPANY CONVERSION API] Processing conversions for workspace: ${workspaceId}`);
    
    let conversions;
    
    if (leadId) {
      // Process specific lead update
      console.log(`🎯 Processing specific lead update: ${leadId}`);
      const singleConversion = await companyEngagementConverter.processLeadEngagementUpdate(leadId, workspaceId);
      conversions = singleConversion ? [singleConversion] : [];
    } else {
      // Process all companies
      console.log(`🔄 Processing all companies in workspace`);
      conversions = await companyEngagementConverter.processCompanyEngagementConversions(workspaceId);
    }
    
    return NextResponse.json({
      success: true,
      conversions,
      companiesConverted: conversions.length,
      totalLeadsConverted: conversions.reduce((sum, c) => sum + c.leadIds.length, 0),
      totalProspectsCreated: conversions.reduce((sum, c) => sum + c.prospectIds.length, 0),
      message: conversions.length > 0 ? 
        `Successfully converted ${conversions.length} companies to prospects` :
        'No companies qualified for conversion at this time'
    });
    
  } catch (error) {
    console.error('❌ [COMPANY CONVERSION API] Error processing conversions:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process company conversions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
