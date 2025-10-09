/**
 * 🏢 SBI BULK COMPANY ANALYSIS API
 * 
 * Endpoint for processing multiple companies through the complete intelligence pipeline:
 * 1. Company Resolution (acquisition detection)
 * 2. Role Detection (CFO/CRO identification)
 * 3. Email Discovery (with verification)
 * 4. Phone Discovery (with verification)
 */

import { NextRequest } from 'next/server';
import { BulkCompanyProcessor } from '@/platform/services/sbi/bulk-company-processor';
import { CompanyInput, ProcessingOptions } from '@/platform/services/sbi/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companies, options = {} } = body;

    // Validate input
    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return Response.json({
        success: false,
        error: 'Companies array is required and must not be empty'
      }, { status: 400 });
    }

    // Validate each company input
    for (const company of companies) {
      if (!company.name && !company.domain) {
        return Response.json({
          success: false,
          error: 'Each company must have either name or domain'
        }, { status: 400 });
      }
    }

    console.log(`🚀 Starting SBI bulk analysis for ${companies.length} companies`);

    // Process companies
    const processor = new BulkCompanyProcessor();
    const result = await processor.processCompanies(companies, options);

    console.log(`✅ SBI bulk analysis completed: ${result.totalProcessed} companies processed`);

    return Response.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ SBI bulk analysis error:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    message: 'SBI Bulk Company Analysis API',
    version: '1.0.0',
    endpoints: {
      'POST /api/sbi/bulk-analyze': 'Process multiple companies through intelligence pipeline'
    },
    pipeline: [
      'Company Resolution (acquisition detection)',
      'Role Detection (CFO/CRO identification)', 
      'Email Discovery (with verification)',
      'Phone Discovery (with verification)'
    ]
  });
}
