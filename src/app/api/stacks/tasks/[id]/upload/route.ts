import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';
import { extractIdFromSlug } from '@/platform/utils/url-utils';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params (Next.js 15+ compatibility)
    const resolvedParams = await params;
    const paramValue = resolvedParams.id;
    
    // Extract ID from slug (handles both slug format "name-id" and raw ID)
    const taskId = extractIdFromSlug(paramValue);

    // Authenticate and authorize user
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    const { context, response } = authResult;

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const workspaceId = context.workspaceId;
    const userId = context.userId;

    if (!workspaceId || !userId) {
      return createErrorResponse('Workspace ID and user ID are required', 'MISSING_REQUIRED_FIELDS', 400);
    }

    if (!taskId) {
      return createErrorResponse('Task ID is required', 'TASK_ID_REQUIRED', 400);
    }

    // Verify task exists and belongs to workspace
    const task = await prisma.stacksTask.findFirst({
      where: {
        id: taskId,
        project: {
          workspaceId: workspaceId
        }
      },
      include: {
        project: {
          select: { workspaceId: true }
        }
      }
    });

    if (!task) {
      return createErrorResponse('Task not found', 'TASK_NOT_FOUND', 404);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return createErrorResponse('File is required', 'FILE_REQUIRED', 400);
    }

    // Validate file type (images only)
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse(
        'Only image files are allowed (PNG, JPG, JPEG, GIF, WebP)',
        'INVALID_FILE_TYPE',
        400
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return createErrorResponse(
        'File size exceeds 10MB limit',
        'FILE_TOO_LARGE',
        400
      );
    }

    // Generate secure filename
    const fileExtension = file.name.split('.').pop() || 'png';
    const secureFilename = `${randomBytes(16).toString('hex')}.${fileExtension}`;
    
    // Create upload directory structure: uploads/stacks/{workspaceId}/{taskId}/
    const uploadDir = join(process.cwd(), 'uploads', 'stacks', workspaceId, taskId);
    await mkdir(uploadDir, { recursive: true });

    // Save file to disk
    const filePath = join(uploadDir, secureFilename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create relative URL path
    const relativeUrl = `/uploads/stacks/${workspaceId}/${taskId}/${secureFilename}`;

    // Create attachment metadata
    const attachmentMetadata = {
      url: relativeUrl,
      filename: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId
    };

    // Get existing attachments or initialize empty array
    const existingAttachments = task.attachments && typeof task.attachments === 'object' && Array.isArray(task.attachments)
      ? task.attachments as any[]
      : [];

    // Add new attachment to the array
    const updatedAttachments = [...existingAttachments, attachmentMetadata];

    // Update task with new attachments
    await prisma.stacksTask.update({
      where: { id: taskId },
      data: {
        attachments: updatedAttachments as any
      }
    });

    return NextResponse.json({
      success: true,
      attachment: attachmentMetadata
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading image:', error);
    return createErrorResponse(
      'Failed to upload image',
      'UPLOAD_ERROR',
      500
    );
  }
}
