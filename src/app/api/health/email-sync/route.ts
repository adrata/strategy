import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * Email Sync Health Check Endpoint
 * 
 * Provides health status for Grand Central email integration
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    let dbStatus = 'healthy';
    let dbError = null;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'unhealthy';
      dbError = error instanceof Error ? error.message : 'Unknown database error';
    }
    
    // Check email connections
    const connections = await prisma.grand_central_connections.findMany({
      where: {
        provider: { in: ['outlook', 'gmail'] }
      },
      select: {
        id: true,
        provider: true,
        status: true,
        lastSyncAt: true,
        createdAt: true
      }
    });
    
    // Check recent email activity
    const recentEmails = await prisma.email_messages.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    
    // Check email linking statistics
    const [totalEmails, linkedEmails, emailsWithActions] = await Promise.all([
      prisma.email_messages.count(),
      prisma.email_messages.count({
        where: {
          OR: [
            { personId: { not: null } },
            { companyId: { not: null } }
          ]
        }
      }),
      prisma.email_messages.count({
        where: {
          actions: { some: {} }
        }
      })
    ]);
    
    const linkRate = totalEmails > 0 ? Math.round((linkedEmails / totalEmails) * 100) : 0;
    const actionRate = totalEmails > 0 ? Math.round((emailsWithActions / totalEmails) * 100) : 0;
    
    // Check environment variables
    const envStatus = {
      nangoSecret: !!process.env.NANGO_SECRET_KEY || !!process.env.NANGO_SECRET_KEY_DEV,
      nangoPublic: !!process.env.NANGO_PUBLIC_KEY,
      nangoWebhook: !!process.env.NANGO_WEBHOOK_SECRET,
      microsoftClient: !!process.env.MICROSOFT_CLIENT_SECRET,
      googleClient: !!process.env.GOOGLE_CLIENT_SECRET,
      oauthBaseUrl: !!process.env.OAUTH_REDIRECT_BASE_URL || !!process.env.NEXT_PUBLIC_APP_URL
    };
    
    const envHealthy = Object.values(envStatus).every(Boolean);
    
    // Overall health status
    const overallStatus = dbStatus === 'healthy' && envHealthy ? 'healthy' : 'unhealthy';
    
    const responseTime = Date.now() - startTime;
    
    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      
      database: {
        status: dbStatus,
        error: dbError
      },
      
      environment: {
        status: envHealthy ? 'healthy' : 'unhealthy',
        variables: envStatus
      },
      
      connections: {
        total: connections.length,
        active: connections.filter(c => c.status === 'active').length,
        byProvider: {
          outlook: connections.filter(c => c.provider === 'outlook').length,
          gmail: connections.filter(c => c.provider === 'gmail').length
        },
        details: connections.map(conn => ({
          id: conn.id,
          provider: conn.provider,
          status: conn.status,
          lastSync: conn.lastSyncAt?.toISOString(),
          age: Math.round((Date.now() - conn.createdAt.getTime()) / (1000 * 60 * 60 * 24)) // days
        }))
      },
      
      emailStats: {
        totalEmails,
        recentEmails,
        linkedEmails,
        emailsWithActions,
        linkRate: `${linkRate}%`,
        actionRate: `${actionRate}%`
      },
      
      recommendations: generateRecommendations(connections, envStatus, linkRate, actionRate)
    };
    
    return NextResponse.json(healthData, {
      status: overallStatus === 'healthy' ? 200 : 503
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: { status: 'unknown' },
      environment: { status: 'unknown' },
      connections: { total: 0, active: 0 },
      emailStats: { totalEmails: 0, recentEmails: 0, linkRate: '0%', actionRate: '0%' }
    }, { status: 503 });
  }
}

function generateRecommendations(
  connections: any[],
  envStatus: Record<string, boolean>,
  linkRate: number,
  actionRate: number
): string[] {
  const recommendations: string[] = [];
  
  // Environment recommendations
  if (!envStatus.nangoSecret) {
    recommendations.push('Set NANGO_SECRET_KEY environment variable');
  }
  if (!envStatus.nangoPublic) {
    recommendations.push('Set NANGO_PUBLIC_KEY environment variable');
  }
  if (!envStatus.nangoWebhook) {
    recommendations.push('Set NANGO_WEBHOOK_SECRET environment variable');
  }
  if (!envStatus.microsoftClient) {
    recommendations.push('Set MICROSOFT_CLIENT_SECRET environment variable');
  }
  if (!envStatus.googleClient) {
    recommendations.push('Set GOOGLE_CLIENT_SECRET environment variable');
  }
  
  // Connection recommendations
  if (connections.length === 0) {
    recommendations.push('No email connections found - users need to connect their email accounts');
  }
  
  const activeConnections = connections.filter(c => c.status === 'active');
  if (activeConnections.length === 0 && connections.length > 0) {
    recommendations.push('No active email connections - check connection status');
  }
  
  // Performance recommendations
  if (linkRate < 50) {
    recommendations.push('Email linking rate is low - check email address matching logic');
  }
  
  if (actionRate < 10) {
    recommendations.push('Action creation rate is low - check action creation logic');
  }
  
  // Sync frequency recommendations
  const staleConnections = connections.filter(c => {
    if (!c.lastSyncAt) return true;
    const daysSinceSync = (Date.now() - c.lastSyncAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceSync > 1;
  });
  
  if (staleConnections.length > 0) {
    recommendations.push(`${staleConnections.length} connections haven't synced recently - check sync scheduler`);
  }
  
  return recommendations;
}
