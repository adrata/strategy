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
    
    console.log(`🎯 [DEMO PROSPECT API] Loading prospect with ID: ${id}`);
    
    // Find the prospect in the database
    const prospect = await prisma.prospects.findFirst({
      where: {
        id: id,
        workspaceId: 'demo-workspace-2025',
        isDemoData: true
      }
    });
    
    if (!prospect) {
      console.log(`❌ [DEMO PROSPECT API] Prospect not found: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Prospect not found',
          prospect: null
        },
        { status: 404 }
      );
    }
    
    console.log(`✅ [DEMO PROSPECT API] Prospect loaded: ${prospect.fullName}`);
    
    return NextResponse.json({
      success: true,
      prospect: prospect
    });
    
  } catch (error) {
    console.error('❌ [DEMO PROSPECT API] Error loading prospect:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load prospect',
        prospect: null
      },
      { status: 500 }
    );
  }}
