import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Creating 5 Bars Services people records...');
    
    const people = [
      {
        firstName: 'John',
        lastName: 'Delisi',
        fullName: 'John Delisi',
        title: 'Chief Executive Officer',
        email: 'john.delisi@5bars.net',
        phone: '800.905.7221',
        companyId: '01K5D5VGQ35SXGBPK5F2WSMFM2',
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: {
          coresignalId: '770302196',
          buyerGroupRole: 'Decision Maker',
          dataSource: 'External'
        }
      },
      {
        firstName: 'Dustin',
        lastName: 'Stephens',
        fullName: 'Dustin Stephens',
        title: 'Project Director',
        email: 'dustin.stephens@5bars.net',
        phone: '800.905.7221',
        companyId: '01K5D5VGQ35SXGBPK5F2WSMFM2',
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: {
          coresignalId: '770302197',
          buyerGroupRole: 'Champion',
          dataSource: 'External'
        }
      }
    ];

    const results = [];

    for (const personData of people) {
      try {
        // Use upsert to create or update
        const person = await prisma.people.upsert({
          where: { 
            fullName: personData.fullName 
          },
          update: { 
            companyId: personData.companyId,
            customFields: personData.customFields
          },
          create: personData
        });
        
        console.log(`✅ ${personData.fullName}: ${person.id}`);
        results.push({ 
          name: personData.fullName, 
          status: 'success', 
          id: person.id,
          companyId: person.companyId
        });
        
      } catch (error) {
        console.error(`❌ Error with ${personData.fullName}:`, error);
        results.push({ 
          name: personData.fullName, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    // Verify the records were created
    const verification = await prisma.people.findMany({
      where: { companyId: '01K5D5VGQ35SXGBPK5F2WSMFM2' }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'People creation completed',
      results,
      verification: verification.map(p => ({
        id: p.id,
        fullName: p.fullName,
        title: p.title,
        companyId: p.companyId
      }))
    });

  } catch (error) {
    console.error('Error creating people:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }}
