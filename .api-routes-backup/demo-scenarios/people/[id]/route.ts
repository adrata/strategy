import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    console.log(`🎯 [DEMO PERSON API] Loading person with ID: ${id}`);
    
    // Find the person in the database
    const person = await prisma.people.findFirst({
      where: {
        id: id,
        workspaceId: { in: ['demo-workspace-2025', 'zeropoint-demo-2025'] } // 🆕 FIX: Support both demo workspaces
      }
    });
    
    if (!person) {
      console.log(`❌ [DEMO PERSON API] Person not found: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Person not found',
          person: null
        },
        { status: 404 }
      );
    }
    
    console.log(`✅ [DEMO PERSON API] Person loaded: ${person.fullName}`);
    
    return NextResponse.json({
      success: true,
      person: person
    });
    
  } catch (error) {
    console.error('❌ [DEMO PERSON API] Error loading person:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load person',
        person: null
      },
      { status: 500 }
    );
  }}
