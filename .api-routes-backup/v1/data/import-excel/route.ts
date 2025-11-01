/**
 * 📊 EXCEL IMPORT API ENDPOINT
 * 
 * Intelligent Excel file processing for lead import via AI chat
 * Supports .xlsx and .xls files with smart column mapping and deduplication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ExcelImportService } from '@/platform/services/ExcelImportService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;
    const userId = formData.get('userId') as string;
    const userIntent = formData.get('userIntent') as string;
    const importOptions = formData.get('importOptions') ? JSON.parse(formData.get('importOptions') as string) : {};
    
    console.log('📊 [EXCEL IMPORT] Processing file:', {
      fileName: file?.name,
      fileSize: file?.size,
      workspaceId,
      userId,
      userIntent
    });
    
    // Validation
    if (!file || !workspaceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: file, workspaceId, or userId' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream' // Sometimes Excel files are detected as this
    ];
    
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!allowedTypes.includes(file.type) && !['xlsx', 'xls'].includes(fileExtension || '')) {
      return NextResponse.json(
        { success: false, error: 'File must be an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }
    
    // File size validation (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }
    
    // Initialize Excel import service
    const excelImportService = new ExcelImportService(workspaceId, userId);
    
    // Process the Excel file
    const results = await excelImportService.processExcelFile(file, {
      userIntent,
      ...importOptions
    });
    
    console.log('✅ [EXCEL IMPORT] Import completed:', results);
    
    return NextResponse.json({
      success: true,
      results: {
        ...results,
        totalRecords: results.totalRecords,
        importedRecords: results.importedRecords,
        skippedRecords: results.skippedRecords,
        errors: results.errors.slice(0, 10), // Limit to first 10 errors
        importType: results.importType,
        columnMapping: results.columnMapping,
        preview: results.preview,
        recommendations: results.recommendations,
        confidence: results.confidence
      }
    });
    
  } catch (error) {
    console.error('❌ [EXCEL IMPORT] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process Excel file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for Excel import requests.'
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for Excel import requests.'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for Excel import requests.'
  }, { status: 405 });
}
