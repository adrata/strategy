import { NextRequest, NextResponse } from 'next/server';
import { integrationCategories } from '@/app/[workspace]/grand-central/utils/integrationCategories';

/**
 * GET /api/grand-central/nango/providers
 * Get all available integration providers from Nango
 */
export async function GET(request: NextRequest) {
  try {
    // For now, return our static list
    // In production, this would fetch from Nango API
    const providers = integrationCategories.flatMap(cat => cat.providers);

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

