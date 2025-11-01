/**
 * 🚀 INTELLIGENT CSV IMPORT API
 * 
 * Handles CSV file uploads with AI-powered data cleaning and mapping:
 * - Parses CSV files with intelligent column detection
 * - Maps columns to database fields using AI
 * - Cleans and validates data
 * - Imports leads, prospects, opportunities, or contacts
 * - Returns detailed import results and suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { 
  detectImportType, 
  mapColumns, 
  cleanAndValidateData, 
  parseCSV, 
  generateImportPreview 
} from '@/platform/services/csv-import-service';
import { validatePhoneNumber } from '@/platform/utils/phone-validator';

// Using enhanced CSV import service for better data processing

// Import data to database
async function importToDatabase(
  data: any[],
  importType: string,
  workspaceId: string,
  userId: string
): Promise<{ imported: number; updated: number; errors: string[] }> {
  let imported = 0;
  let updated = 0;
  const errors: string[] = [];
  
  for (const record of data) {
    try {
      // Ensure required fields
      if (!record['fullName'] && !record.email) {
        errors.push(`Skipped record: Missing both name and email`);
        continue;
      }
      
      const baseData = {
        ...record,
        workspaceId,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Handle different import types
      switch (importType) {
        case 'leads':
          await importLead(baseData, imported, updated, errors);
          break;
        case 'prospects':
          await importProspect(baseData, imported, updated, errors);
          break;
        case 'opportunities':
          await importOpportunity(baseData, imported, updated, errors);
          break;
        case 'people':
          await importContact(baseData, imported, updated, errors);
          break;
      }
      
      imported++;
    } catch (error) {
      errors.push(`Error importing ${record.fullName || record.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return { imported, updated, errors };
}

async function importLead(data: any, imported: number, updated: number, errors: string[]) {
  // Validate phone number - set to null if fake/invalid
  if (data.phone) {
    const phoneValidation = validatePhoneNumber(data.phone);
    if (!phoneValidation.isValid) {
      console.log(`📞 Invalid phone number for lead ${data.fullName || data.email}: ${phoneValidation.reason}`);
      data.phone = null;
    }
  }
  
  // Check for existing lead
  if (data.email) {
    const existing = await prisma.leads.findFirst({
      where: {
        email: data.email,
        workspaceId: data.workspaceId
      , deletedAt: null}
    });
    
    if (existing) {
      await prisma.leads.update({
        where: { id: existing.id },
        data: { ...data, updatedAt: new Date() }
      });
      return;
    }
  }
  
  await prisma.leads.create({ data });
}

async function importProspect(data: any, imported: number, updated: number, errors: string[]) {
  // Validate phone number - set to null if fake/invalid
  if (data.phone) {
    const phoneValidation = validatePhoneNumber(data.phone);
    if (!phoneValidation.isValid) {
      console.log(`📞 Invalid phone number for prospect ${data.fullName || data.email}: ${phoneValidation.reason}`);
      data.phone = null;
    }
  }
  
  // Check for existing prospect
  if (data.email) {
    const existing = await prisma.prospects.findFirst({
      where: {
        email: data.email,
        workspaceId: data.workspaceId
      , deletedAt: null}
    });
    
    if (existing) {
      await prisma.prospects.update({
        where: { id: existing.id },
        data: { ...data, updatedAt: new Date() }
      });
      return;
    }
  }
  
  await prisma.prospects.create({ data });
}

async function importOpportunity(data: any, imported: number, updated: number, errors: string[]) {
  // Opportunities need additional fields
  const oppData = {
    ...data,
    amount: data.dealValue || data.estimatedValue || 0,
    stage: data.dealStage || 'prospecting',
    expectedCloseDate: data.closeDate ? new Date(data.closeDate) : null
  };
  
  await prisma.opportunities.create({ data: oppData });
}

async function importContact(data: any, imported: number, updated: number, errors: string[]) {
  // Validate phone number - set to null if fake/invalid
  if (data.phone) {
    const phoneValidation = validatePhoneNumber(data.phone);
    if (!phoneValidation.isValid) {
      console.log(`📞 Invalid phone number for contact ${data.fullName || data.email}: ${phoneValidation.reason}`);
      data.phone = null;
    }
  }
  
  // Import as Person record
  await prisma.people.create({ 
    data: {
      ...data,
      name: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim()
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;
    const userId = formData.get('userId') as string;
    const userIntent = formData.get('userIntent') as string; // User's natural language description
    
    console.log('📊 [CSV IMPORT] Processing file:', {
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
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'File must be a CSV file' },
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
    
    // Read and parse CSV with enhanced error handling
    const csvContent = await file.text();
    const { headers, data, parseErrors } = parseCSV(csvContent);
    
    console.log(`📋 [CSV IMPORT] Parsed ${data.length} records with headers:`, headers);
    if (parseErrors.length > 0) {
      console.warn('⚠️ [CSV IMPORT] Parse errors:', parseErrors);
    }
    
    // Intelligent column mapping with enhanced fuzzy matching
    const columnMapping = mapColumns(headers);
    console.log('🔗 [CSV IMPORT] Column mapping:', columnMapping);
    
    // Detect import type with enhanced logic
    const importType = detectImportType(headers, data.slice(0, 5));
    console.log(`🎯 [CSV IMPORT] Detected import type: ${importType}`);
    
    // Clean and validate data with comprehensive validation
    const { cleanedData, validationErrors, suggestions } = cleanAndValidateData(data, columnMapping);
    console.log(`🧹 [CSV IMPORT] Cleaned ${cleanedData.length} records`);
    if (validationErrors.length > 0) {
      console.warn('⚠️ [CSV IMPORT] Validation errors:', validationErrors);
    }
    
    // Generate import preview and recommendations
    const { preview, recommendations, confidence } = generateImportPreview(headers, data, columnMapping, importType);
    console.log(`🎯 [CSV IMPORT] Import confidence: ${confidence}%`);
    
    // Import to database
    const results = await importToDatabase(cleanedData, importType, workspaceId, userId);
    
    console.log('✅ [CSV IMPORT] Import completed:', results);
    
    return NextResponse.json({
      success: true,
      results: {
        ...results,
        totalRecords: data.length,
        importType,
        columnMapping,
        preview: preview,
        recommendations,
        confidence,
        validationErrors: validationErrors.slice(0, 10), // Limit to first 10 errors
        parseErrors: parseErrors.slice(0, 5), // Limit to first 5 parse errors
        suggestions
      }
    });
    
  } catch (error) {
    console.error('❌ [CSV IMPORT] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process CSV file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
