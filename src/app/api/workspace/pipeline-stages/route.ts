import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { prisma } from '@/platform/database/prisma-client';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, sectionType } = await request.json();
    
    if (!workspaceId || !sectionType) {
      return NextResponse.json({ error: 'Missing workspaceId or sectionType' }, { status: 400 });
    }

    try {
      // Use shared Prisma client
      // const prisma = new PrismaClient(); // Already imported above
      
      // Note: PipelineStep model doesn't have workspaceId/sectionType fields in current schema
      // Return default stages for now until schema is updated
      const stages: any[] = [];

      // If no custom stages found, return default stages for this section
      if (stages['length'] === 0) {
        const defaultStages = getDefaultStages(sectionType);
        return NextResponse.json(defaultStages);
      }

      const result = NextResponse.json(stages);return result;
    } catch (dbError) {
      console.error('Database error fetching pipeline stages:', dbError);
      // Return default stages if database error
      const defaultStages = getDefaultStages(sectionType);
      return NextResponse.json(defaultStages);
    }
  } catch (error) {
    console.error('Error fetching pipeline stages:', error);
    return NextResponse.json({ error: 'Failed to fetch pipeline stages' }, { status: 500 });
  }
}

function getDefaultStages(sectionType: string) {
  switch (sectionType) {
    case 'opportunities':
      return [
        { id: 'build', name: 'Build', order: 1, color: '#3B82F6' },
        { id: 'justify', name: 'Justify', order: 2, color: '#10B981' },
        { id: 'negotiate', name: 'Negotiate', order: 3, color: '#F59E0B' },
        { id: 'legal-procurement', name: 'Legal/Procurement', order: 4, color: '#8B5CF6' }
      ];
    case 'clients':
      return [
        { id: 'activate', name: 'Activate', order: 1, color: '#3B82F6' },
        { id: 'embed', name: 'Embed', order: 2, color: '#10B981' },
        { id: 'optimize', name: 'Optimize', order: 3, color: '#F59E0B' },
        { id: 'evangelize', name: 'Evangelize', order: 4, color: '#8B5CF6' },
        { id: 'expand', name: 'Expand', order: 5, color: '#06B6D4' }
      ];
    case 'leads':
      return [
        { id: 'generate', name: 'Generate', order: 1, color: '#3B82F6' },
        { id: 'initiate', name: 'Initiate', order: 2, color: '#10B981' },
        { id: 'educate', name: 'Educate', order: 3, color: '#F59E0B' }
      ];
    case 'partners':
      return [
        { id: 'prospect', name: 'Prospect', order: 1, color: '#3B82F6' },
        { id: 'negotiate', name: 'Negotiate', order: 2, color: '#10B981' },
        { id: 'active', name: 'Active', order: 3, color: '#F59E0B' },
        { id: 'review', name: 'Review', order: 4, color: '#8B5CF6' }
      ];
    default:
      return [];
  }
}
