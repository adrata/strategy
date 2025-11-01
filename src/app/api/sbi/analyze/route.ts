/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * 🔍 SBI SINGLE COMPANY ANALYSIS API
 * 
 * Endpoint for analyzing a single company through the 4-step pipeline
 */

import { NextRequest } from 'next/server';
import { CompanyAnalyzer } from '@/platform/services/sbi/company-analyzer';
import { DatabaseService } from '@/platform/services/sbi/database-service';
import { CompanyInput, ProcessingOptions } from '@/platform/services/sbi/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, options = {} } = body;

    // Validate input
    if (!company) {
      return Response.json({
        success: false,
        error: 'Company information is required'
      }, { status: 400 });
    }

    if (!company.name && !company.domain) {
      return Response.json({
        success: false,
        error: 'Company must have either name or domain'
      }, { status: 400 });
    }

    console.log(`🔍 Starting SBI analysis for company: ${company.name || company.domain}`);

    // Analyze the company
    const analyzer = new CompanyAnalyzer();
    const result = await analyzer.analyzeCompany(company, options);

    // Save to database
    const dbService = new DatabaseService();
    const saveResult = await dbService.saveAnalysisResult(result);

    console.log(`✅ SBI analysis completed for ${company.name || company.domain}: ${result.overallConfidence}% confidence`);

    return Response.json({
      success: true,
      data: {
        analysis: result,
        saved: saveResult
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ SBI analysis error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    message: 'SBI Single Company Analysis API',
    version: '1.0.0',
    description: 'Analyze a single company through the 4-step pipeline',
    pipeline: [
      '1. Company Resolution (acquisition detection, domain resolution)',
      '2. Role Detection (CFO/CRO identification)',
      '3. Email Discovery (with verification)',
      '4. Phone Discovery (with verification)'
    ],
    usage: {
      method: 'POST',
      endpoint: '/api/sbi/analyze',
      body: {
        company: {
          name: 'string (optional)',
          domain: 'string (optional)',
          website: 'string (optional)',
          industry: 'string (optional)',
          size: 'string (optional)',
          location: 'string (optional)'
        },
        options: {
          includeAcquisitionCheck: 'boolean (default: true)',
          includeRoleDetection: 'boolean (default: true)',
          includeEmailDiscovery: 'boolean (default: true)',
          includePhoneDiscovery: 'boolean (default: true)',
          maxRetries: 'number (default: 3)',
          timeoutMs: 'number (default: 30000)'
        }
      }
    }
  });
}
