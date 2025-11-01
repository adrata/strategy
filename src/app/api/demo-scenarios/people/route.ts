import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Required for static export (desktop build)
export const dynamic = 'force-static';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scenario = searchParams.get('scenario') || 'winning-variant';
    
    console.log(`🎯 [DEMO PEOPLE API] Loading people for scenario: ${scenario}`);
    
    // Load real people data from database for demo scenarios
    const people = await loadRealPeopleForScenario(scenario);
    
    console.log(`✅ [DEMO PEOPLE API] Loaded ${people.length} people for scenario: ${scenario}`);
    
    return NextResponse.json({
      success: true,
      people: people,
      scenario: scenario,
      count: people.length
    });
    
  } catch (error) {
    console.error('❌ [DEMO PEOPLE API] Error loading people:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load demo people',
        people: []
      },
      { status: 500 }
    );
  }}

async function loadRealPeopleForScenario(scenario: string) {
  try {
    // Determine workspace ID based on scenario
    const workspaceId = scenario === 'zeropoint-vp-sales-2025' ? 'zeropoint-demo-2025' : 'demo-workspace-2025';
    
    console.log(`🔍 [DEMO PEOPLE API] Loading people from workspace: ${workspaceId}`);
    
    // Load people from database
    const people = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        email: true,
        phone: true,
        department: true,
        companyId: true,
        // Remove notes field to avoid string length issues
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Transform to Monaco format
    const transformedPeople = await Promise.all(people.map(async (person) => {
      // Get company name
      let companyName = 'Unknown Company';
      if (person.companyId) {
        const company = await prisma.companies.findFirst({
          where: { id: person.companyId },
          select: { name: true }
        });
        companyName = company?.name || 'Unknown Company';
      }
      
      // Parse notes for buyer group data
      let buyerGroupData = {};
      if (person.notes) {
        try {
          buyerGroupData = JSON.parse(person.notes);
        } catch (e) {
          console.warn(`Failed to parse notes for person ${person.id}:`, e);
        }
      }
      
      return {
        id: person.id,
        name: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim(),
        title: person.jobTitle || 'Unknown Title',
        company: companyName,
        email: person.email || '',
        phone: person.phone || '',
        department: person.department || 'Unknown Department',
        seniority: determineSeniorityFromTitle(person.jobTitle || ''),
        status: 'prospect',
        lastContact: person.updatedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        // Include buyer group data from notes
        ...buyerGroupData
      };
    }));
    
    console.log(`✅ [DEMO PEOPLE API] Transformed ${transformedPeople.length} people for scenario: ${scenario}`);
    return transformedPeople;
    
  } catch (error) {
    console.error('❌ [DEMO PEOPLE API] Error loading real people:', error);
    return [];
  }
}

function determineSeniorityFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('ceo') || t.includes('president') || t.includes('chief')) {
    return 'C-Level';
  }
  if (t.includes('vp') || t.includes('vice president')) {
    return 'VP';
  }
  if (t.includes('director')) {
    return 'Director';
  }
  if (t.includes('manager') || t.includes('head of')) {
    return 'Manager';
  }
  return 'Individual Contributor';
}
