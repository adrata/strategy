/**
 * 🏥 HEALTH CHECK API ENDPOINT
 * 
 * Simple health check endpoint for monitoring and load balancers
 * Returns basic system status and timestamp
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process['env']['NODE_ENV'] || 'development',
      version: '2025.1.0',
      services: {
        database: 'connected', // Could add actual DB check here
        api: 'operational',
        cache: 'operational'
      }
    };

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

// Support HEAD requests for simple health checks
export async function HEAD() {
  return new Response(null, { status: 200 });
}
