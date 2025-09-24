import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId');

    if (!workspaceId || !userId) {
      return NextResponse.json({ success: false, error: 'Missing workspaceId or userId' }, { status: 400 });
    }

    console.log('🎯 Starting 5Bars Buyer Group Analysis...');
    
    // Get the 5Bars company data
    const company = await prisma.companies.findUnique({
      where: { id: '01K5D5VGQ35SXGBPK5F2WSMFM2' },
      include: {
        people: true
      }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: '5Bars company not found' }, { status: 404 });
    }

    console.log(`📋 Company: ${company.name}`);
    console.log(`👥 Existing people: ${company.people.length}`);

    // Import and run the analysis script
    const FiveBarsBuyerGroupAnalyzer = require('../../../../scripts/analyze-5bars-buyer-group-comprehensive.js');
    const analyzer = new FiveBarsBuyerGroupAnalyzer();
    
    // Run the analysis
    await analyzer.execute();
    
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: '5Bars buyer group analysis completed successfully',
      data: {
        company: {
          id: company.id,
          name: company.name,
          existingPeople: company.people.length
        },
        processingTime: processingTime
      }
    });

  } catch (error: any) {
    console.error('❌ [5BARS BUYER GROUP API] Error during analysis:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current 5Bars company data
    const company = await prisma.companies.findUnique({
      where: { id: '01K5D5VGQ35SXGBPK5F2WSMFM2' },
      include: {
        people: {
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            email: true,
            customFields: true
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: '5Bars company not found' }, { status: 404 });
    }

    // Analyze existing buyer group data
    const buyerGroupAnalysis = company.customFields?.buyerGroupAnalysis || null;
    const coresignalData = company.customFields?.coresignalData || null;

    // Count people by buyer group role
    const peopleByRole = {
      decisionMakers: 0,
      champions: 0,
      influencers: 0,
      stakeholders: 0,
      unknown: 0
    };

    company.people.forEach(person => {
      const role = person.customFields?.buyerGroupRole;
      if (role === 'Decision Maker') peopleByRole.decisionMakers++;
      else if (role === 'Champion') peopleByRole.champions++;
      else if (role === 'Influencer') peopleByRole.influencers++;
      else if (role === 'Stakeholder') peopleByRole.stakeholders++;
      else peopleByRole.unknown++;
    });

    return NextResponse.json({
      success: true,
      data: {
        company: {
          id: company.id,
          name: company.name,
          website: company.website,
          industry: company.industry,
          size: company.size
        },
        people: {
          total: company.people.length,
          byRole: peopleByRole,
          list: company.people.map(p => ({
            id: p.id,
            name: p.fullName,
            title: p.jobTitle,
            email: p.email,
            buyerGroupRole: p.customFields?.buyerGroupRole || 'Unknown',
            influenceLevel: p.customFields?.influenceLevel || 'Unknown'
          }))
        },
        buyerGroupAnalysis,
        coresignalData,
        lastUpdated: company.updatedAt
      }
    });

  } catch (error: any) {
    console.error('❌ [5BARS BUYER GROUP API] Error fetching data:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
