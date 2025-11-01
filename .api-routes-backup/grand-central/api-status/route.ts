import { NextResponse } from 'next/server';
import { API_REGISTRY } from '@/app/[workspace]/grand-central/data/api-registry';

export async function GET() {
  try {
    const apiStatuses = API_REGISTRY.map(api => {
      const missingKeys = api.authentication.envVars.filter(key => !process.env[key]);
      const isConfigured = missingKeys.length === 0;

      return {
        id: api.id,
        name: api.name,
        isConfigured,
        envKeys: api.authentication.envVars,
        missingKeys: isConfigured ? undefined : missingKeys,
        status: isConfigured ? 'configured' : 'not-configured'
      };
    });

    return NextResponse.json(apiStatuses);
  } catch (error) {
    console.error('Error fetching API status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API status' },
      { status: 500 }
    );
  }
}
