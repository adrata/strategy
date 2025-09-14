import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    console.log(`🎯 [DEMO COMPANY API] Loading company with ID: ${id}`);
    
    // Find the company in the database
    const company = await prisma.companies.findFirst({
      where: {
        id: id,
        workspaceId: { in: ['demo-workspace-2025', 'zeropoint-demo-2025'] } // 🆕 FIX: Support both demo workspaces
      }
    });
    
    if (!company) {
      console.log(`❌ [DEMO COMPANY API] Company not found: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Company not found',
          company: null
        },
        { status: 404 }
      );
    }
    
    console.log(`✅ [DEMO COMPANY API] Company loaded: ${company.name}`);
    
    return NextResponse.json({
      success: true,
      company: company
    });
    
  } catch (error) {
    console.error('❌ [DEMO COMPANY API] Error loading company:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load company',
        company: null
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
