import { NextRequest, NextResponse } from 'next/server';
import { Nango } from '@nangohq/node';
import { integrationCategories } from '@/app/[workspace]/grand-central/utils/integrationCategories';

/**
 * GET /api/grand-central/nango/providers
 * Get all available integration providers from Nango
 */
export async function GET(request: NextRequest) {
  try {
    // Always start with our static categories as the base
    let enhancedCategories = [...integrationCategories];
    
    // Try to enhance with Nango data if credentials are available
    const secretKey = process.env.NANGO_SECRET_KEY_DEV || process.env.NANGO_SECRET_KEY;
    const host = process.env.NANGO_HOST || 'https://api.nango.dev';
    
    if (secretKey) {
      try {
        const nango = new Nango({
          secretKey,
          host
        });
        
        // Try to fetch providers from Nango API
        const nangoProviders = await nango.listProviders();
        
        if (nangoProviders && nangoProviders.length > 0) {
          // Enhance static providers with Nango availability data
          enhancedCategories = integrationCategories.map(category => ({
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
                isAvailable: true // Default to available for static providers
              };
            })
          }));
          
          console.log(`Successfully enhanced ${nangoProviders.length} providers from Nango`);
        }
      } catch (nangoError) {
        console.warn('Nango API not available, using static provider list:', nangoError);
        // Continue with static data - don't fail the request
      }
    } else {
      console.warn('Nango credentials not configured, using static provider list');
    }

    // Always return the categories structure (what the frontend expects)
    return NextResponse.json(enhancedCategories);
  } catch (error) {
    console.error('Unexpected error in providers endpoint:', error);
    // Even on unexpected errors, return static data to keep the UI working
    return NextResponse.json(integrationCategories);
  }
}

