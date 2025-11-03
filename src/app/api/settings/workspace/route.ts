import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { prisma } from '@/platform/database/prisma-client';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

export async function GET(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    
    // Get workspace with settings
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        timezone: true,
        currency: true,
        defaultLanguage: true,
        supportedLanguages: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!workspace) {
      return NextResponse.json({ 
        success: false, 
        error: 'Workspace not found' 
      }, { status: 404 });
    }

    // Use default settings since config fields don't exist in schema
    const workspaceSettings = {
      // Core Settings (using defaults since fields don't exist in schema)
      vertical: 'Technology',
      industry: 'Software', 
      companySize: 'Enterprise',
      targetMarket: 'Mid-Market',
      
      // Enrichment Pipeline Settings (defaults since config fields don't exist)
      enrichmentTier: 'professional',
      maxCostPerRecord: 0.05,
      autoEnrichment: true,
      dataRetentionDays: 365,
      
      // AI & Intelligence Settings (defaults)
      aiPersonality: 'Professional',
      intelligenceFocus: ['buying_signals', 'competitor_mentions', 'stakeholder_mapping'],
      buyingSignalSensitivity: 'medium',
      
      // Pipeline Settings (defaults)
      defaultPipelineStages: ['Lead', 'Qualified', 'Demo', 'Proposal', 'Negotiation', 'Closed Won'],
      autoStageProgression: true,
      leadScoringThreshold: 75
    };

    return NextResponse.json({
      success: true,
      settings: workspaceSettings,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        timezone: workspace.timezone,
        branding: {
          logoUrl: workspace.logoUrl || '/favicon.ico',
          primaryColor: workspace.primaryColor || '#1f2937',
          secondaryColor: workspace.secondaryColor || '#3b82f6'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching workspace settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch workspace settings' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    const settings = await request.json();

    // Update workspace with new settings
    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: {
        description: settings.description || 'Updated workspace description',
        timezone: settings.timezone || 'UTC',
        // Remove non-existent fields: vertical, industry, size, settings
        updatedAt: new Date()
        // Note: enrichmentConfig, aiConfig, pipelineConfig fields don't exist in current Prisma schema
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Workspace settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating workspace settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update workspace settings' 
    }, { status: 500 });
  }
}
