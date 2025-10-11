import { NextRequest, NextResponse } from 'next/server';
import { Nango } from '@nangohq/node';
import { integrationCategories } from '@/app/[workspace]/grand-central/utils/integrationCategories';

const nango = new Nango({
  secretKey: process.env.NANGO_SECRET_KEY_DEV || process.env.NANGO_SECRET_KEY!,
  host: process.env.NANGO_HOST || 'https://api.nango.dev'
});

/**
 * GET /api/grand-central/nango/providers
 * Get all available integration providers from Nango
 */
export async function GET(request: NextRequest) {
  try {
    let nangoProviders: any[] = [];
    
    // Try to fetch providers from Nango API
    try {
      nangoProviders = await nango.listProviders();
    } catch (error) {
      console.warn('Failed to fetch providers from Nango, using static list:', error);
    }

    // If Nango is not configured or fails, use our static list
    if (nangoProviders.length === 0) {
      const staticProviders = integrationCategories.flatMap(cat => cat.providers);
      return NextResponse.json(staticProviders);
    }

    // Merge Nango providers with our static categories
    const mergedProviders = integrationCategories.map(category => ({
      ...category,
      providers: category.providers.map(staticProvider => {
        // Check if this provider exists in Nango
        const nangoProvider = nangoProviders.find(np => np.provider === staticProvider.id);
        
        if (nangoProvider) {
          return {
            ...staticProvider,
            isAvailable: true,
            nangoConfig: nangoProvider
          };
        }
        
        return {
          ...staticProvider,
          isAvailable: false
        };
      })
    }));

    return NextResponse.json(mergedProviders);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

