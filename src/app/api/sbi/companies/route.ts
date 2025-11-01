/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * 🏢 SBI COMPANIES MANAGEMENT API
 * 
 * Endpoint for managing company data and analysis
 */

import { NextRequest } from 'next/server';
import { DatabaseService } from '@/platform/services/sbi/database-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const dbService = new DatabaseService();

    if (query) {
      // Search companies
      const companies = await dbService.searchCompanies(query);
      return Response.json({
        success: true,
        data: companies.slice(offset, offset + limit),
        total: companies.length,
        limit,
        offset
      });
    } else {
      // Get all companies with pagination
      const companies = await dbService.getCompanies(limit, offset);
      const stats = await dbService.getAnalysisStats();
      
      return Response.json({
        success: true,
        data: companies,
        stats,
        limit,
        offset
      });
    }

  } catch (error) {
    console.error('❌ Companies API error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

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

    console.log(`🏢 Processing ${companies.length} companies for analysis`);

    const dbService = new DatabaseService();
    const results = [];

    for (const company of companies) {
      try {
        const result = await dbService.saveAnalysisResult({
          company: {
            name: company.name,
            domain: company.domain,
            website: company.website,
            industry: company.industry,
            size: company.size,
            location: company.location,
            status: 'active',
            confidence: 0,
            sources: ['manual_input'],
            lastVerified: new Date()
          },
          people: [],
          opportunities: []
        });
        
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to save company ${company.name}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          company: company.name
        });
      }
    }

    return Response.json({
      success: true,
      data: results,
      processed: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Companies creation error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '30');

    const dbService = new DatabaseService();
    const deletedCount = await dbService.cleanupOldAnalyses(olderThanDays);

    return Response.json({
      success: true,
      data: {
        deletedCount,
        olderThanDays
      },
      message: `Cleaned up ${deletedCount} old analyses`
    });

  } catch (error) {
    console.error('❌ Companies cleanup error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
