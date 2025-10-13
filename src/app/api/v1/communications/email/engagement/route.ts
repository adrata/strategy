import { NextRequest, NextResponse } from 'next/server';
import { emailEngagementAnalyzer } from '@/platform/services/email-engagement-analyzer';

/**
 * 📧 EMAIL ENGAGEMENT ANALYSIS API
 * 
 * GET: Analyze email engagement patterns
 * POST: Update engagement scores
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    const emailId = searchParams.get('emailId');
    const workspaceId = searchParams.get('workspaceId');
    const type = searchParams.get('type') || 'contact'; // 'contact', 'email', 'high-engagement', 'low-engagement'

    if (type === 'email' && emailId) {
      // Analyze specific email participation
      const analysis = await emailEngagementAnalyzer.analyzeEmailParticipation(emailId);
      
      if (!analysis) {
        return NextResponse.json(
          { success: false, error: 'Email not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: analysis
      });

    } else if (type === 'contact' && contactId) {
      // Analyze contact engagement
      const analysis = await emailEngagementAnalyzer.analyzeContactEngagement(contactId);
      
      if (!analysis) {
        return NextResponse.json(
          { success: false, error: 'Contact not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: analysis
      });

    } else if (type === 'high-engagement' && workspaceId) {
      // Get high engagement contacts
      const limit = parseInt(searchParams.get('limit') || '50');
      const contacts = await emailEngagementAnalyzer.getHighEngagementContacts(workspaceId, limit);

      return NextResponse.json({
        success: true,
        data: {
          contacts,
          count: contacts.length,
          criteria: 'Active participation rate > 50%'
        }
      });

    } else if (type === 'low-engagement' && workspaceId) {
      // Get low engagement contacts
      const limit = parseInt(searchParams.get('limit') || '50');
      const contacts = await emailEngagementAnalyzer.getLowEngagementContacts(workspaceId, limit);

      return NextResponse.json({
        success: true,
        data: {
          contacts,
          count: contacts.length,
          criteria: 'Active participation rate < 30%'
        }
      });

    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid parameters. Use: contactId, emailId, workspaceId, or type' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ [API] Error in email engagement analysis:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to analyze email engagement',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, workspaceId } = await request.json();

    if (action === 'update-scores' && workspaceId) {
      // Update engagement scores for all contacts in workspace
      await emailEngagementAnalyzer.updateContactEngagementScores(workspaceId);

      return NextResponse.json({
        success: true,
        message: 'Engagement scores updated successfully'
      });

    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid action. Use: update-scores with workspaceId' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ [API] Error updating engagement scores:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update engagement scores',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
