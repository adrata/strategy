import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    console.log(`🎯 [DEMO LEAD API] Loading lead with ID: ${id}`);
    
    // Find the lead in the database
    const lead = await prisma.leads.findFirst({
      where: {
        id: id,
        workspaceId: 'demo-workspace-2025',
        isDemoData: true
      }
    });
    
    if (!lead) {
      console.log(`❌ [DEMO LEAD API] Lead not found: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Lead not found',
          lead: null
        },
        { status: 404 }
      );
    }
    
    console.log(`✅ [DEMO LEAD API] Lead loaded: ${lead.fullName}`);
    
    return NextResponse.json({
      success: true,
      lead: lead
    });
    
  } catch (error) {
    console.error('❌ [DEMO LEAD API] Error loading lead:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load lead',
        lead: null
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
