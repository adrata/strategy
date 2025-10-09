import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Test endpoint received:', body);
    
    const testData = {
      name: body.name || 'Test Company',
      website: body.website || 'test.com',
      workspaceId: body.workspaceId || '01K1VBYmf75hgmvmz06psnc9ug',
      assignedUserId: body.userId || '01K1VBYYV7TRPY04NW4TW4XWRB',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Creating company with data:', testData);
    console.log('Field lengths:');
    Object.entries(testData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        console.log(`  ${key}: ${value.length} chars - "${value}"`);
      } else {
        console.log(`  ${key}: ${typeof value} - ${value}`);
      }
    });
    
    const result = await prisma.companies.create({
      data: testData
    });
    
    console.log('Success! Created company:', result.id);
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Company created successfully'
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
