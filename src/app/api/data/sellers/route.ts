import { NextRequest, NextResponse } from 'next/server';
import { authFetch } from '@/platform/auth-fetch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId');
    
    console.log(`🎯 [SELLERS API] Loading sellers for workspace: ${workspaceId}, user: ${userId}`);
    
    // For demo purposes, return hardcoded sellers data
    const sellers = [
      {
        id: 'demo-user-2025',
        name: 'Kirk Morales',
        email: 'demo@winning-variant.com',
        title: 'Founder & CEO',
        company: 'Winning Variant',
        assignedCompanies: ['Brex', 'First Premier Bank'],
        assignedProspects: 6,
        assignedLeads: 0,
        assignedOpportunities: 0
      },
      {
        id: 'david-beitler-2025',
        name: 'David Beitler',
        email: 'david@winning-variant.com',
        title: 'Co-Founder',
        company: 'Winning Variant',
        assignedCompanies: ['Match Group'],
        assignedProspects: 4,
        assignedLeads: 0,
        assignedOpportunities: 1
      }
    ];
    
    console.log(`✅ [SELLERS API] Returning ${sellers.length} sellers`);
    
    return NextResponse.json({
      success: true,
      data: sellers,
      count: sellers.length
    });
    
  } catch (error) {
    console.error('❌ [SELLERS API] Error loading sellers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load sellers',
        data: []
      },
      { status: 500 }
    );
  }
}

