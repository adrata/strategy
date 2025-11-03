import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedAuthUser } from '@/platform/api-auth';
import { Nango } from '@nangohq/node';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * GET /api/grand-central/nango/config
 * Check Nango configuration status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUnifiedAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check environment variables
    const secretKey = process.env.NANGO_SECRET_KEY_DEV || process.env.NANGO_SECRET_KEY;
    const publicKey = process.env.NANGO_PUBLIC_KEY;
    const host = process.env.NANGO_HOST || 'https://api.nango.dev';

    const config = {
      hasSecretKey: !!secretKey,
      hasPublicKey: !!publicKey,
      host,
      secretKeyPrefix: secretKey ? secretKey.substring(0, 8) + '...' : null,
      publicKeyPrefix: publicKey ? publicKey.substring(0, 8) + '...' : null,
    };

    // Test Nango connection if secret key is available
    let nangoStatus = 'not_configured';
    let nangoError = null;
    
    if (secretKey) {
      try {
        const nango = new Nango({
          secretKey,
          host
        });
        
        // Try to list providers to test connection
        await nango.listProviders();
        nangoStatus = 'connected';
      } catch (error) {
        nangoStatus = 'error';
        nangoError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      config,
      nangoStatus,
      nangoError,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking Nango config:', error);
    return NextResponse.json(
      { error: 'Failed to check Nango configuration' },
      { status: 500 }
    );
  }
}
