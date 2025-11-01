import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

/**
 * POST /api/workshop/upload
 * Upload a file to Atrium
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;
    const folderId = formData.get('folderId') as string;
    const documentType = formData.get('documentType') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;

    if (!file || !workspaceId) {
      return NextResponse.json(
        { error: 'File and workspace ID are required' },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/markdown',
      'application/json',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      );
    }

    // Generate secure filename
    const fileExtension = file.name.split('.').pop() || '';
    const secureFilename = `${randomBytes(16).toString('hex')}.${fileExtension}`;
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', 'atrium', workspaceId);
    await mkdir(uploadDir, { recursive: true });

    // Save file to disk
    const filePath = join(uploadDir, secureFilename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Determine document type from file type if not provided
    let detectedDocumentType = documentType;
    if (!detectedDocumentType) {
      detectedDocumentType = detectDocumentTypeFromMimeType(file.type);
    }

    // Parse tags
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

    // Create document record in database
    const { prisma } = await import('@/platform/prisma');
    const document = await prisma.workshopDocument.create({
      data: {
        title: title || file.name,
        description,
        documentType: detectedDocumentType,
        fileUrl: `/uploads/atrium/${workspaceId}/${secureFilename}`,
        fileType: file.type,
        fileSize: file.size,
        folderId: folderId || null,
        workspaceId,
        ownerId: session.user.id,
        tags: parsedTags,
        status: 'draft',
        isEncrypted: false, // TODO: Implement encryption
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log upload activity
    await prisma.workshopActivity.create({
      data: {
        documentId: document.id,
        userId: session.user.id,
        activityType: 'uploaded',
        description: `Uploaded file "${file.name}"`,
        metadata: {
          originalName: file.name,
          fileSize: file.size,
          fileType: file.type,
          documentType: detectedDocumentType,
        },
      },
    });

    return NextResponse.json({
      document,
      message: 'File uploaded successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * Detect document type from MIME type
 */
function detectDocumentTypeFromMimeType(mimeType: string): string {
  if (mimeType.includes('word') || mimeType.includes('text/plain') || mimeType.includes('text/markdown')) {
    return 'paper';
  }
  
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return 'pitch';
  }
  
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('csv')) {
    return 'grid';
  }
  
  if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('typescript')) {
    return 'code';
  }
  
  // Default to paper for unknown types
  return 'paper';
}
