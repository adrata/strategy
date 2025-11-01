/**
 * 🏢 SBI STATUS API
 * 
 * Health check and status endpoint for SBI services
 */

import { NextRequest } from 'next/server';
import { DatabaseService } from '@/platform/services/sbi/database-service';

export async function GET(request: NextRequest) {
  try {
    const dbService = new DatabaseService();
    const stats = await dbService.getAnalysisStatistics();
    
    return Response.json({
      success: true,
      service: 'SBI Bulk Company Analysis',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      statistics: {
        totalCompanies: stats.totalCompanies,
        totalPeople: stats.totalPeople,
        totalOpportunities: stats.totalOpportunities,
        averageConfidence: Math.round(stats.averageConfidence)
      },
      endpoints: {
        'POST /api/sbi/bulk-analyze': 'Process multiple companies',
        'GET /api/sbi/status': 'Service health check'
      }
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      service: 'SBI Bulk Company Analysis',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
