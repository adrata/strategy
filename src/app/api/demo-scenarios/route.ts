import { NextRequest, NextResponse } from 'next/server';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 [DEMO API] Loading demo scenarios...');
    
    // Demo scenarios with real company data (Winning Variant, SBI Growth, and ZeroPoint)
    const scenarios = [
      {
        id: 'winning-variant',
        name: 'Winning Variant',
        slug: 'winning-variant',
        description: 'Conversion rate optimization platform for e-commerce',
        industry: 'SaaS',
        targetAudience: 'E-commerce Marketing Teams',
        config: {
          company_size: '50-200',
          revenue_range: '$5M-$20M',
          growth_stage: 'Series A',
          primary_use_case: 'Conversion Optimization'
        },
        branding: {
          primary_color: '#1a365d',
          secondary_color: '#2d3748',
          logo: '🎯'
        },
        features: {
          enabled: ['pipeline', 'monaco', 'speedrun', 'analytics'],
          disabled: ['production-data', 'real-integrations']
        },
        demoUser: {
          id: 'demo@winning-variant.com',
          name: 'Kirk Morales',
          role: 'Founder & CEO',
          company: 'Winning Variant'
        }
      },
      {
        id: 'zeropoint-vp-sales-2025',
        name: 'ZeroPoint VP of Sales Demo',
        slug: 'zeropoint',
        description: 'VP of Sales perspective demo with real Monaco data - ADP, Adobe, AWS, Anthem companies with detailed buyer groups',
        industry: 'Technology',
        targetAudience: 'VP of Sales',
        config: {
          company_size: '5000+',
          revenue_range: '$100M+',
          growth_stage: 'Enterprise',
          primary_use_case: 'Enterprise Sales',
          companies: ['ADP', 'Adobe', 'Amazon Web Services', 'Anthem'],
          sellers: ['Kirk Harbaugh', 'Sarah Chen', 'Marcus Rodriguez', 'Amanda Thompson'],
          buyerGroups: 4,
          people: 40
        },
        branding: {
          primary_color: '#2563eb',
          secondary_color: '#1e40af',
          logo: '🚀'
        },
        features: {
          enabled: ['pipeline', 'monaco', 'speedrun', 'analytics', 'buyer-groups', 'detailed-people'],
          disabled: ['production-data', 'real-integrations']
        },
        demoUser: {
          id: 'demo@zeropoint.com',
          name: 'John Sylvester',
          role: 'VP of Sales',
          company: 'ZeroPoint',
          username: 'demo',
          password: 'VPGoat90!'
        }
      },
      {
        id: 'sbi-growth',
        name: 'SBI Growth',
        slug: 'sbi-growth',
        description: 'Strategic business intelligence and growth acceleration platform',
        industry: 'Business Intelligence',
        targetAudience: 'Enterprise Sales Teams',
        config: {
          company_size: '100-500',
          revenue_range: '$10M-$50M',
          growth_stage: 'Series A',
          primary_use_case: 'Sales Intelligence'
        },
        branding: {
          primary_color: '#2d3748',
          secondary_color: '#4a5568',
          logo: '📈'
        },
        features: {
          enabled: ['pipeline', 'monaco', 'speedrun', 'analytics'],
          disabled: ['production-data', 'real-integrations']
        },
        demoUser: {
          id: 'demo@sbi-growth.com',
          name: 'Sarah Johnson',
          role: 'Sales Director',
          company: 'SBI Growth'
        }
      }
    ];
    
    console.log(`✅ [DEMO API] Loaded ${scenarios.length} demo scenarios`);
    
    return NextResponse.json({
      success: true,
      scenarios: scenarios
    });
    
  } catch (error) {
    console.error('❌ [DEMO API] Error loading demo scenarios:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load demo scenarios',
        scenarios: []
      },
      { status: 500 }
    );
  }
}
