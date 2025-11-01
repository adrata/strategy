/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * 🧪 SBI SYSTEM TEST API
 * 
 * Endpoint for testing the complete SBI system
 */

import { NextRequest } from 'next/server';
import { BulkCompanyProcessor } from '@/platform/services/sbi/bulk-company-processor';
import { CompanyAnalyzer } from '@/platform/services/sbi/company-analyzer';
import { DatabaseService } from '@/platform/services/sbi/database-service';
import { ExecutiveVerification } from '@/platform/services/sbi/executive-verification';
import { CompanyInput } from '@/platform/services/sbi/types';

export async function GET() {
  return Response.json({
    message: 'SBI System Test API',
    version: '1.0.0',
    description: 'Test the complete SBI system functionality',
    testEndpoints: {
      'POST /api/sbi/test/single': 'Test single company analysis',
      'POST /api/sbi/test/bulk': 'Test bulk company processing',
      'POST /api/sbi/test/verification': 'Test executive verification',
      'POST /api/sbi/test/database': 'Test database operations'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType, testData } = body;

    console.log(`🧪 Running SBI system test: ${testType}`);

    switch (testType) {
      case 'single':
        return await testSingleCompanyAnalysis(testData);
      case 'bulk':
        return await testBulkProcessing(testData);
      case 'verification':
        return await testExecutiveVerification(testData);
      case 'database':
        return await testDatabaseOperations();
      case 'full':
        return await testFullSystem();
      default:
        return Response.json({
          success: false,
          error: 'Invalid test type. Use: single, bulk, verification, database, or full'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ SBI test error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

async function testSingleCompanyAnalysis(testData: any) {
  try {
    const testCompany: CompanyInput = testData || {
      name: 'Test Company Inc',
      domain: 'testcompany.com',
      website: 'https://testcompany.com'
    };

    console.log('🔍 Testing single company analysis...');
    
    const analyzer = new CompanyAnalyzer();
    const result = await analyzer.analyzeCompany(testCompany, {
      includeAcquisitionCheck: true,
      includeRoleDetection: true,
      includeEmailDiscovery: true,
      includePhoneDiscovery: true
    });

    return Response.json({
      success: true,
      testType: 'single',
      data: {
        company: testCompany,
        result: result,
        pipelineSteps: [
          'Company Resolution',
          'Role Detection', 
          'Email Discovery',
          'Phone Discovery'
        ],
        overallConfidence: result.overallConfidence
      }
    });

  } catch (error) {
    console.error('❌ Single company test failed:', error);
    return Response.json({
      success: false,
      testType: 'single',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testBulkProcessing(testData: any) {
  try {
    const testCompanies: CompanyInput[] = testData || [
      {
        name: 'Test Company 1',
        domain: 'testcompany1.com'
      },
      {
        name: 'Test Company 2', 
        domain: 'testcompany2.com'
      }
    ];

    console.log(`🔍 Testing bulk processing for ${testCompanies.length} companies...`);
    
    const processor = new BulkCompanyProcessor();
    const result = await processor.processCompanies(testCompanies, {
      includeAcquisitionCheck: true,
      includeRoleDetection: true,
      includeEmailDiscovery: true,
      includePhoneDiscovery: true,
      maxRetries: 2,
      timeoutMs: 30000
    });

    return Response.json({
      success: true,
      testType: 'bulk',
      data: {
        companies: testCompanies,
        result: result,
        totalProcessed: result.totalProcessed,
        successfulAnalyses: result.successfulAnalyses,
        failedAnalyses: result.failedAnalyses
      }
    });

  } catch (error) {
    console.error('❌ Bulk processing test failed:', error);
    return Response.json({
      success: false,
      testType: 'bulk',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testExecutiveVerification(testData: any) {
  try {
    const testExecutive = testData?.executive || {
      name: 'John Smith',
      title: 'Chief Financial Officer',
      company: 'Test Company Inc',
      email: 'john.smith@testcompany.com'
    };

    const testCompany = testData?.company || {
      name: 'Test Company Inc',
      domain: 'testcompany.com',
      website: 'https://testcompany.com'
    };

    console.log('🔍 Testing executive verification...');
    
    const verifier = new ExecutiveVerification();
    const result = await verifier.verifyExecutiveIdentity(testExecutive, testCompany);

    return Response.json({
      success: true,
      testType: 'verification',
      data: {
        executive: testExecutive,
        company: testCompany,
        result: result,
        verificationSources: result.verificationSources?.length || 0,
        verificationScore: result.verificationScore
      }
    });

  } catch (error) {
    console.error('❌ Executive verification test failed:', error);
    return Response.json({
      success: false,
      testType: 'verification',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testDatabaseOperations() {
  try {
    console.log('🔍 Testing database operations...');
    
    const dbService = new DatabaseService();
    
    // Test getting stats
    const stats = await dbService.getAnalysisStats();
    
    // Test searching companies
    const searchResults = await dbService.searchCompanies('test');
    
    // Test getting companies with pagination
    const companies = await dbService.getCompanies(10, 0);

    return Response.json({
      success: true,
      testType: 'database',
      data: {
        stats: stats,
        searchResults: searchResults.length,
        companies: companies.length,
        databaseConnected: true
      }
    });

  } catch (error) {
    console.error('❌ Database operations test failed:', error);
    return Response.json({
      success: false,
      testType: 'database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testFullSystem() {
  try {
    console.log('🔍 Running full system test...');
    
    const results = {
      single: null,
      bulk: null,
      verification: null,
      database: null
    };

    // Test all components
    try {
      results.single = await testSingleCompanyAnalysis({
        name: 'Full Test Company',
        domain: 'fulltest.com'
      });
    } catch (error) {
      results.single = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    try {
      results.database = await testDatabaseOperations();
    } catch (error) {
      results.database = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    try {
      results.verification = await testExecutiveVerification({
        executive: {
          name: 'Jane Doe',
          title: 'CFO',
          company: 'Full Test Company'
        },
        company: {
          name: 'Full Test Company',
          domain: 'fulltest.com'
        }
      });
    } catch (error) {
      results.verification = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    const allTestsPassed = Object.values(results).every(result => 
      result && typeof result === 'object' && 'success' in result && result.success
    );

    return Response.json({
      success: allTestsPassed,
      testType: 'full',
      data: {
        results: results,
        allTestsPassed: allTestsPassed,
        systemStatus: allTestsPassed ? 'HEALTHY' : 'ISSUES_DETECTED'
      }
    });

  } catch (error) {
    console.error('❌ Full system test failed:', error);
    return Response.json({
      success: false,
      testType: 'full',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
