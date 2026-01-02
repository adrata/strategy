import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import {
  getNextPullDiscoveryQuestion,
  generatePullDiscoveryPrompt,
  analyzePullFromConversation,
  generateFollowUpQuestion
} from '@/platform/services/pull-intelligence-service';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * POST /api/intelligence/pull-discovery
 *
 * Real-time PULL discovery guidance for the AI assistant during calls
 *
 * Actions:
 * - get-next-question: Get the next question to ask based on current PULL state
 * - analyze-conversation: Extract PULL state from conversation transcript
 * - get-system-prompt: Get AI system prompt configured for PULL discovery
 * - generate-follow-ups: Get follow-up questions for a prospect response
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    const body = await request.json();

    const { action, ...params } = body;

    switch (action) {
      case 'get-next-question': {
        /**
         * Get the next discovery question based on current PULL state
         *
         * Input:
         * - currentPullState: { project?, urgency?, list?, limitations? }
         * - conversationContext?: string (optional context)
         *
         * Output:
         * - question: The next question to ask
         * - pullComponent: Which PULL component this targets
         * - purpose: Why to ask this question
         * - followUps: Follow-up questions
         * - pullScore: Current PULL score (0-100)
         */
        const { currentPullState, conversationContext } = params;

        const guidance = await getNextPullDiscoveryQuestion(
          workspaceId,
          currentPullState || {},
          conversationContext
        );

        return NextResponse.json({
          success: true,
          guidance
        });
      }

      case 'analyze-conversation': {
        /**
         * Analyze a conversation to extract PULL state
         *
         * Input:
         * - conversation: string (the conversation transcript)
         *
         * Output:
         * - project: Extracted project or null
         * - urgency: Extracted urgency or null
         * - list: Extracted options or null
         * - limitations: Extracted limitations or null
         * - pullScore: Calculated PULL score (0-100)
         * - nextStep: Recommended next action
         */
        const { conversation } = params;

        if (!conversation) {
          return NextResponse.json({
            success: false,
            error: 'Conversation text is required'
          }, { status: 400 });
        }

        const pullState = await analyzePullFromConversation(conversation, workspaceId);

        return NextResponse.json({
          success: true,
          pullState
        });
      }

      case 'get-system-prompt': {
        /**
         * Get AI system prompt for PULL discovery
         * Used to configure the AI assistant for calls
         *
         * Input:
         * - personContext?: PersonContext
         * - companyContext?: CompanyContext
         * - currentPullState?: { project?, urgency?, list?, limitations? }
         *
         * Output:
         * - systemPrompt: Full system prompt for AI assistant
         */
        const { personContext, companyContext, currentPullState } = params;

        const systemPrompt = await generatePullDiscoveryPrompt(
          workspaceId,
          personContext,
          companyContext,
          currentPullState
        );

        return NextResponse.json({
          success: true,
          systemPrompt
        });
      }

      case 'generate-follow-ups': {
        /**
         * Generate follow-up questions based on prospect response
         *
         * Input:
         * - prospectResponse: string (what the prospect said)
         * - pullComponent: 'project' | 'urgency' | 'list' | 'limitations'
         *
         * Output:
         * - followUps: Array of follow-up questions
         */
        const { prospectResponse, pullComponent } = params;

        if (!prospectResponse || !pullComponent) {
          return NextResponse.json({
            success: false,
            error: 'prospectResponse and pullComponent are required'
          }, { status: 400 });
        }

        const validComponents = ['project', 'urgency', 'list', 'limitations'];
        if (!validComponents.includes(pullComponent)) {
          return NextResponse.json({
            success: false,
            error: `Invalid pullComponent. Must be one of: ${validComponents.join(', ')}`
          }, { status: 400 });
        }

        const followUps = await generateFollowUpQuestion(
          prospectResponse,
          pullComponent as 'project' | 'urgency' | 'list' | 'limitations',
          workspaceId
        );

        return NextResponse.json({
          success: true,
          followUps
        });
      }

      case 'get-pull-summary': {
        /**
         * Get a formatted PULL summary for display
         *
         * Input:
         * - currentPullState: { project?, urgency?, list?, limitations? }
         *
         * Output:
         * - summary: Formatted summary
         * - score: PULL score
         * - readyToPitch: boolean
         * - missingComponents: Array of missing components
         */
        const { currentPullState } = params;

        const hasProject = currentPullState?.project && !currentPullState.project.toLowerCase().includes('unknown');
        const hasUrgency = currentPullState?.urgency && !currentPullState.urgency.toLowerCase().includes('unknown');
        const hasList = currentPullState?.list && !currentPullState.list.toLowerCase().includes('unknown');
        const hasLimitations = currentPullState?.limitations && !currentPullState.limitations.toLowerCase().includes('unknown');

        const score = [hasProject, hasUrgency, hasList, hasLimitations].filter(Boolean).length * 25;

        const missingComponents: string[] = [];
        if (!hasProject) missingComponents.push('Project');
        if (!hasUrgency) missingComponents.push('Urgency');
        if (!hasList) missingComponents.push('List of options');
        if (!hasLimitations) missingComponents.push('Limitations');

        const readyToPitch = score === 100;

        let summary = '';
        if (readyToPitch) {
          summary = `PULL IDENTIFIED (Score: ${score}/100)\n\n`;
          summary += `Project: ${currentPullState.project}\n`;
          summary += `Urgency: ${currentPullState.urgency}\n`;
          summary += `Options: ${currentPullState.list}\n`;
          summary += `Limitations: ${currentPullState.limitations}\n\n`;
          summary += `Ready to pitch what fits their specific need.`;
        } else {
          summary = `PULL Score: ${score}/100\n\n`;
          if (currentPullState?.project) summary += `P (Project): ${currentPullState.project}\n`;
          else summary += `P (Project): ❓ Not identified\n`;
          if (currentPullState?.urgency) summary += `U (Urgency): ${currentPullState.urgency}\n`;
          else summary += `U (Urgency): ❓ Not identified\n`;
          if (currentPullState?.list) summary += `L (List): ${currentPullState.list}\n`;
          else summary += `L (List): ❓ Not identified\n`;
          if (currentPullState?.limitations) summary += `L (Limitations): ${currentPullState.limitations}\n`;
          else summary += `L (Limitations): ❓ Not identified\n`;
          summary += `\nMissing: ${missingComponents.join(', ')}`;
        }

        return NextResponse.json({
          success: true,
          summary,
          score,
          readyToPitch,
          missingComponents,
          components: {
            project: currentPullState?.project || null,
            urgency: currentPullState?.urgency || null,
            list: currentPullState?.list || null,
            limitations: currentPullState?.limitations || null
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}. Valid actions: get-next-question, analyze-conversation, get-system-prompt, generate-follow-ups, get-pull-summary`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in PULL discovery:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute PULL discovery action'
    }, { status: 500 });
  }
}
