import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('Creating 5 Bars Services people...');
    
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
        // Check if exists
        const existing = await prisma.people.findFirst({
          where: { fullName: personData.fullName }
        });

        if (existing) {
          console.log(`✅ ${personData.fullName} already exists`);
          // Update with company association
          await prisma.people.update({
            where: { id: existing.id },
            data: { companyId: personData.companyId }
          });
          results.push({ name: personData.fullName, status: 'updated', id: existing.id });
        } else {
          const person = await prisma.people.create({ data: personData });
          console.log(`✅ Created ${personData.fullName} (ID: ${person.id})`);
          results.push({ name: personData.fullName, status: 'created', id: person.id });
        }
      } catch (error) {
        console.error(`❌ Error with ${personData.fullName}:`, error);
        results.push({ name: personData.fullName, status: 'error', error: error.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'People creation completed',
      results 
    });

  } catch (error) {
    console.error('Error creating people:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }}
