import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { prisma } from '@/platform/database/prisma-client';

// 🚀 PERFORMANCE: Request deduplication to prevent multiple calls
const pendingRequests = new Map<string, Promise<any>>();

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await request.json();
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    // 🚀 PERFORMANCE: Check for existing request to prevent duplicates
    const requestKey = `workspace-config-${workspaceId}`;
    const existingRequest = pendingRequests.get(requestKey);
    
    if (existingRequest) {
      console.log(`⚡ [WORKSPACE CONFIG] Deduplicating request for workspace: ${workspaceId}`);
      const data = await existingRequest;
      return NextResponse.json(data);
    }

    // 🚀 PERFORMANCE: Create promise for request deduplication
    const requestPromise = (async () => {
      // Query database for workspace configuration
      const workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: {
          id: true,
          name: true,
          // Remove fields that don't exist in the schema
          // timezone: true,
          // currency: true, 
          // dateFormat: true,
          // logoUrl: true,
          // primaryColor: true,
          // secondaryColor: true
        }
      });

      if (!workspace) {
        return { 
          error: 'Workspace not found',
          defaultConfig: getDefaultWorkspaceConfig()
        };
      }

      // Determine branding colors based on workspace name
      let primaryColor = '#3b82f6'; // Default blue
      let secondaryColor = '#1f2937'; // Default dark gray
      
      if (workspace['name'] === 'Retail Product Solutions') {
        primaryColor = '#AE3033'; // RPS red
        secondaryColor = '#3b82f6'; // Blue as secondary
      } else if (workspace['name'] === 'Notary Everyday') {
        primaryColor = '#0A1F49'; // Notary dark blue
        secondaryColor = '#3b82f6'; // Blue as secondary
      }

      return {
        id: workspace.id,
        name: workspace.name,
        timezone: 'UTC', // Default since field doesn't exist in schema
        currency: 'USD', // Default since field doesn't exist in schema
        dateFormat: 'MM/DD/YYYY', // Default since field doesn't exist in schema
        defaultPipelineView: 'kanban', // Default value since field doesn't exist in schema
        settings: {}, // Default empty object since field doesn't exist in schema
        branding: {
          logoUrl: '/favicon.ico', // Standard favicon
          primaryColor: primaryColor,
          secondaryColor: secondaryColor
        }
      };
    })();

    // Add to pending requests for deduplication
    pendingRequests.set(requestKey, requestPromise);
    
    try {
      const data = await requestPromise;
      if (data.error) {
        return NextResponse.json(data, { status: 404 });
      }
      return NextResponse.json(data);
    } finally {
      // Clean up pending request
      pendingRequests.delete(requestKey);
    }
  } catch (error) {
    console.error('Error fetching workspace config:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch workspace config',
      defaultConfig: getDefaultWorkspaceConfig()
    }, { status: 500 });
  }
}

function getDefaultWorkspaceConfig() {
  return {
    timezone: 'UTC',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    defaultPipelineView: 'kanban',
    settings: {}
  };
}
