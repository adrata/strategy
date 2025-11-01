/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * 🎯 SBI EXECUTIVE VERIFICATION API
 * 
 * Endpoint for verifying executive identity through multi-source verification
 */

import { NextRequest } from 'next/server';
import { ExecutiveVerification } from '@/platform/services/sbi/executive-verification';
import { ExecutiveContact } from '@/platform/services/sbi/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { executive, company } = body;

    // Validate input
    if (!executive || !company) {
      return Response.json({
        success: false,
        error: 'Executive and company information are required'
      }, { status: 400 });
    }

    if (!executive.name || !company.name) {
      return Response.json({
        success: false,
        error: 'Executive name and company name are required'
      }, { status: 400 });
    }

    console.log(`🔍 Starting executive verification for ${executive.name} at ${company.name}`);

    // Verify executive identity
    const verifier = new ExecutiveVerification();
    const result = await verifier.verifyExecutiveIdentity(executive, company);

    console.log(`✅ Executive verification completed: ${result.verified ? 'VERIFIED' : 'NOT VERIFIED'} (${result.verificationScore}% score)`);

    return Response.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Executive verification error:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    message: 'SBI Executive Verification API',
    version: '1.0.0',
    endpoints: {
      'POST /api/sbi/verification': 'Verify executive identity through multi-source verification'
    },
    verificationSources: [
      'LinkedIn Profile Verification',
      'Company Website Verification', 
      'News/PR Verification',
      'SEC Filings Verification',
      'Professional Networks Verification'
    ]
  });
}

