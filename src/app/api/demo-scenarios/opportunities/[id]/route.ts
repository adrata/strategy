import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    console.log(`🎯 [DEMO OPPORTUNITY API] Loading opportunity with ID: ${id}`);
    
    // Find the opportunity in the database
    const opportunity = await prisma.opportunities.findFirst({
      where: {
        id: id,
        workspaceId: 'demo-workspace-2025',
        isDemoData: true
      }
    });
    
    if (!opportunity) {
      console.log(`❌ [DEMO OPPORTUNITY API] Opportunity not found: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Opportunity not found',
          opportunity: null
        },
        { status: 404 }
      );
    }
    
    console.log(`✅ [DEMO OPPORTUNITY API] Opportunity loaded: ${opportunity.name}`);
    
    return NextResponse.json({
      success: true,
      opportunity: opportunity
    });
    
  } catch (error) {
    console.error('❌ [DEMO OPPORTUNITY API] Error loading opportunity:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load opportunity',
        opportunity: null
      },
      { status: 500 }
    );
  }}
