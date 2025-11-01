import { NextRequest, NextResponse } from 'next/server';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'winning-variant';
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log(`🎯 [DEMO PROSPECTS API] Loading prospects for scenario: ${scenario}, limit: ${limit}`);
    
    // Generate scenario-specific prospects data
    const prospects = generateScenarioProspects(scenario, limit);
    
    console.log(`✅ [DEMO PROSPECTS API] Generated ${prospects.length} prospects for scenario: ${scenario}`);
    
    return NextResponse.json({
      success: true,
      prospects: prospects,
      scenario: scenario,
      count: prospects.length
    });
    
  } catch (error) {
    console.error('❌ [DEMO PROSPECTS API] Error loading prospects:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load demo prospects',
        prospects: []
      },
      { status: 500 }
    );
  }
}

function generateScenarioProspects(scenario: string, limit: number) {
  // Return demo prospects data for the winning-variant scenario
  if (scenario === 'winning-variant') {
    return [
      {
        id: 'prospect-1-demo-2025',
        fullName: 'Sarah Chen',
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen@brex.com',
        title: 'VP of Marketing',
        jobTitle: 'VP of Marketing',
        company: 'Brex',
        industry: 'FinTech',
        department: 'Marketing',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 234-5678',
        linkedinUrl: 'https://linkedin.com/in/sarahchen',
        status: 'active',
        source: 'Demo Data',
        ownerId: 'demo-user-2025',
        lastAction: 'Engaged',
        lastActionDetails: 'Contact activity tracked',
        nextAction: 'Schedule follow-up',
        nextActionDetails: 'Follow up on initial conversation'
      },
      {
        id: 'prospect-2-demo-2025',
        fullName: 'Michael Rodriguez',
        firstName: 'Michael',
        lastName: 'Rodriguez',
        email: 'michael.rodriguez@brex.com',
        title: 'Head of Growth',
        jobTitle: 'Head of Growth',
        company: 'Brex',
        industry: 'FinTech',
        department: 'Growth',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 345-6789',
        linkedinUrl: 'https://linkedin.com/in/michaelrodriguez',
        status: 'active',
        source: 'Demo Data',
        ownerId: 'demo-user-2025',
        lastAction: 'Engaged',
        lastActionDetails: 'Contact activity tracked',
        nextAction: 'Schedule follow-up',
        nextActionDetails: 'Follow up on initial conversation'
      },
      {
        id: 'prospect-3-demo-2025',
        fullName: 'Jennifer Kim',
        firstName: 'Jennifer',
        lastName: 'Kim',
        email: 'jennifer.kim@firstpremier.com',
        title: 'Chief Marketing Officer',
        jobTitle: 'Chief Marketing Officer',
        company: 'First Premier Bank',
        industry: 'Banking',
        department: 'Marketing',
        city: 'Sioux Falls',
        state: 'SD',
        country: 'USA',
        phone: '+1 (555) 456-7890',
        linkedinUrl: 'https://linkedin.com/in/jenniferkim',
        status: 'active',
        source: 'Demo Data',
        ownerId: 'demo-user-2025',
        lastAction: 'Engaged',
        lastActionDetails: 'Contact activity tracked',
        nextAction: 'Schedule follow-up',
        nextActionDetails: 'Follow up on initial conversation'
      },
      {
        id: 'prospect-4-demo-2025',
        fullName: 'David Thompson',
        firstName: 'David',
        lastName: 'Thompson',
        email: 'david.thompson@firstpremier.com',
        title: 'VP of Digital Strategy',
        jobTitle: 'VP of Digital Strategy',
        company: 'First Premier Bank',
        industry: 'Banking',
        department: 'Strategy',
        city: 'Sioux Falls',
        state: 'SD',
        country: 'USA',
        phone: '+1 (555) 567-8901',
        linkedinUrl: 'https://linkedin.com/in/davidthompson',
        status: 'active',
        source: 'Demo Data',
        ownerId: 'demo-user-2025',
        lastAction: 'Engaged',
        lastActionDetails: 'Contact activity tracked',
        nextAction: 'Schedule follow-up',
        nextActionDetails: 'Follow up on initial conversation'
      },
      {
        id: 'prospect-5-demo-2025',
        fullName: 'Lisa Wang',
        firstName: 'Lisa',
        lastName: 'Wang',
        email: 'lisa.wang@match.com',
        title: 'VP of Product',
        jobTitle: 'VP of Product',
        company: 'Match Group',
        industry: 'Technology',
        department: 'Product',
        city: 'Dallas',
        state: 'TX',
        country: 'USA',
        phone: '+1 (555) 678-9012',
        linkedinUrl: 'https://linkedin.com/in/lisawang',
        status: 'active',
        source: 'Demo Data',
        ownerId: 'david-beitler-2025',
        lastAction: 'Engaged',
        lastActionDetails: 'Contact activity tracked',
        nextAction: 'Schedule follow-up',
        nextActionDetails: 'Follow up on initial conversation'
      },
      {
        id: 'prospect-6-demo-2025',
        fullName: 'Robert Johnson',
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.johnson@match.com',
        title: 'Head of Engineering',
        jobTitle: 'Head of Engineering',
        company: 'Match Group',
        industry: 'Technology',
        department: 'Engineering',
        city: 'Dallas',
        state: 'TX',
        country: 'USA',
        phone: '+1 (555) 789-0123',
        linkedinUrl: 'https://linkedin.com/in/robertjohnson',
        status: 'active',
        source: 'Demo Data',
        ownerId: 'david-beitler-2025',
        lastAction: 'Engaged',
        lastActionDetails: 'Contact activity tracked',
        nextAction: 'Schedule follow-up',
        nextActionDetails: 'Follow up on initial conversation'
      },
      {
        id: 'prospect-7-demo-2025',
        fullName: 'Amanda Foster',
        firstName: 'Amanda',
        lastName: 'Foster',
        email: 'amanda.foster@brex.com',
        title: 'Marketing Manager',
        jobTitle: 'Marketing Manager',
        company: 'Brex',
        industry: 'FinTech',
        department: 'Marketing',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 890-1234',
        linkedinUrl: 'https://linkedin.com/in/amandafoster',
        status: 'active',
        source: 'Demo Data',
        ownerId: 'demo-user-2025',
        lastAction: 'Engaged',
        lastActionDetails: 'Contact activity tracked',
        nextAction: 'Schedule follow-up',
        nextActionDetails: 'Follow up on initial conversation'
      },
      {
        id: 'prospect-8-demo-2025',
        fullName: 'James Wilson',
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@firstpremier.com',
        title: 'Digital Marketing Director',
        jobTitle: 'Digital Marketing Director',
        company: 'First Premier Bank',
        industry: 'Banking',
        department: 'Marketing',
        city: 'Sioux Falls',
        state: 'SD',
        country: 'USA',
        phone: '+1 (555) 901-2345',
        linkedinUrl: 'https://linkedin.com/in/jameswilson',
        status: 'active',
        source: 'Demo Data',
        ownerId: 'demo-user-2025',
        lastAction: 'Engaged',
        lastActionDetails: 'Contact activity tracked',
        nextAction: 'Schedule follow-up',
        nextActionDetails: 'Follow up on initial conversation'
      },
      {
        id: 'prospect-9-demo-2025',
        fullName: 'Maria Garcia',
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@match.com',
        title: 'Product Marketing Manager',
        jobTitle: 'Product Marketing Manager',
        company: 'Match Group',
        industry: 'Technology',
        department: 'Marketing',
        city: 'Dallas',
        state: 'TX',
        country: 'USA',
        phone: '+1 (555) 012-3456',
        linkedinUrl: 'https://linkedin.com/in/mariagarcia',
        status: 'active',
        source: 'Demo Data',
        ownerId: 'david-beitler-2025',
        lastAction: 'Engaged',
        lastActionDetails: 'Contact activity tracked',
        nextAction: 'Schedule follow-up',
        nextActionDetails: 'Follow up on initial conversation'
      },
      {
        id: 'prospect-10-demo-2025',
        fullName: 'Kevin Lee',
        firstName: 'Kevin',
        lastName: 'Lee',
        email: 'kevin.lee@brex.com',
        title: 'Growth Marketing Specialist',
        jobTitle: 'Growth Marketing Specialist',
        company: 'Brex',
        industry: 'FinTech',
        department: 'Growth',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 123-4567',
        linkedinUrl: 'https://linkedin.com/in/kevinlee',
        status: 'active',
        source: 'Demo Data',
        ownerId: 'demo-user-2025',
        lastAction: 'Engaged',
        lastActionDetails: 'Contact activity tracked',
        nextAction: 'Schedule follow-up',
        nextActionDetails: 'Follow up on initial conversation'
      }
    ].slice(0, limit);
  }
  
  // Return empty array for other scenarios
  return [];
}
