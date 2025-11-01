import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Required for static export (desktop build)
export const dynamic = 'force-static';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    console.log(`🎯 [DEMO SELLER API] Loading seller with ID: ${id}`);
    
    // Find the seller in the database (sellers are workspace_users)
    const seller = await prisma.workspace_users.findFirst({
      where: {
        userId: id,
        workspaceId: { in: ['demo-workspace-2025', 'zeropoint-demo-2025'] } // 🆕 FIX: Support both demo workspaces
      }
    });
    
    if (!seller) {
      console.log(`❌ [DEMO SELLER API] Seller not found: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Seller not found',
          seller: null
        },
        { status: 404 }
      );
    }
    
    // Get the user data separately
    const user = await prisma.users.findUnique({
      where: { id: seller.userId }
    });
    
    // Format the seller data
    const sellerData = {
      id: seller.userId,
      name: user?.name || user?.email || 'Unknown',
      title: user?.jobTitle || 'Sales Representative',
      company: 'Adrata',
      email: user?.email,
      phone: user?.phone,
      createdAt: seller.createdAt.toISOString(),
      notes: `Demo seller for ${seller.workspaceId}`
    };
    
    console.log(`✅ [DEMO SELLER API] Seller loaded: ${sellerData.name}`);
    
    return NextResponse.json({
      success: true,
      seller: sellerData
    });
    
  } catch (error) {
    console.error('❌ [DEMO SELLER API] Error loading seller:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load seller',
        seller: null
      },
      { status: 500 }
    );
  }}
