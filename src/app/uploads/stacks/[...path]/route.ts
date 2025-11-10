import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';

export const dynamic = 'force-dynamic';

/**
 * Serve uploaded Stacks images
 * Route: /uploads/stacks/[workspaceId]/[taskId]/[filename]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Resolve params (Next.js 15+ compatibility)
    const resolvedParams = await params;
    const pathParts = resolvedParams.path;

    if (!pathParts || pathParts.length < 3) {
      return new NextResponse('Invalid path', { status: 400 });
    }

    const [workspaceId, taskId, ...filenameParts] = pathParts;
    const filename = filenameParts.join('/');

    if (!workspaceId || !taskId || !filename) {
      return new NextResponse('Missing required path parameters', { status: 400 });
    }

    // Authenticate user (but allow access if they have workspace access)
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: false // Don't require workspace access for file serving
    });

    const { context, response } = authResult;

    // If authentication failed, still try to serve the file (public access)
    // But verify workspace access if context is available
    if (context && context.workspaceId && context.workspaceId !== workspaceId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Construct file path
    const filePath = join(process.cwd(), 'uploads', 'stacks', workspaceId, taskId, filename);

    try {
      // Read file from disk
      const fileBuffer = await readFile(filePath);

      // Determine content type from file extension
      const extension = filename.split('.').pop()?.toLowerCase();
      const contentTypeMap: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };
      const contentType = contentTypeMap[extension || ''] || 'application/octet-stream';

      // Return file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        },
      });
    } catch (fileError) {
      console.error('Error reading file:', fileError);
      return new NextResponse('File not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

