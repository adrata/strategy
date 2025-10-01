import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateIntelligenceProfile } from '@/platform/services/ai-intelligence-generator';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { recordId, recordType, workspaceId } = await request.json();

    if (!recordId || !recordType || !workspaceId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get the record with all related data
    const record = await getRecordWithContext(recordId, recordType, workspaceId);
    
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Generate AI-powered intelligence profile
    console.log('🤖 Generating intelligence for:', record.fullName || record.name);
    const intelligenceProfile = await generateIntelligenceProfile(record);
    console.log('✅ Intelligence generated:', intelligenceProfile.influenceLevel);

    // Update the record with the new intelligence data
    const updateData = {
      customFields: {
        ...record.customFields,
        influenceLevel: intelligenceProfile.influenceLevel,
        engagementStrategy: intelligenceProfile.engagementStrategy,
        seniority: intelligenceProfile.seniority,
        isBuyerGroupMember: intelligenceProfile.isBuyerGroupMember,
        influenceScore: intelligenceProfile.influenceScore,
        decisionPower: intelligenceProfile.decisionPower,
        primaryRole: intelligenceProfile.primaryRole,
        engagementLevel: intelligenceProfile.engagementLevel,
        communicationStyle: intelligenceProfile.communicationStyle,
        decisionMaking: intelligenceProfile.decisionMaking,
        preferredContact: intelligenceProfile.preferredContact,
        responseTime: intelligenceProfile.responseTime,
        painPoints: intelligenceProfile.painPoints,
        interests: intelligenceProfile.interests,
        goals: intelligenceProfile.goals,
        challenges: intelligenceProfile.challenges,
        opportunities: intelligenceProfile.opportunities,
        intelligenceSummary: intelligenceProfile.summary,
        lastIntelligenceGenerated: new Date().toISOString()
      }
    };

    // Update the record in the database
    let updatedRecord;
    switch (recordType) {
      case 'people':
        updatedRecord = await prisma.people.update({
          where: { id: recordId },
          data: updateData
        });
        break;
      case 'leads':
        updatedRecord = await prisma.leads.update({
          where: { id: recordId },
          data: updateData
        });
        break;
      case 'prospects':
        updatedRecord = await prisma.prospects.update({
          where: { id: recordId },
          data: updateData
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid record type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      intelligenceProfile,
      record: updatedRecord
    });
  } catch (error) {
    console.error('Error generating intelligence profile:', error);
    return NextResponse.json({ error: 'Failed to generate intelligence profile' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function getRecordWithContext(recordId: string, recordType: string, workspaceId: string) {
  const baseWhere = { id: recordId, workspaceId };

  switch (recordType) {
    case 'people':
      return await prisma.people.findFirst({
        where: baseWhere,
        include: {
          company: true
        }
      });
    
    case 'leads':
      return await prisma.leads.findFirst({
        where: baseWhere,
        include: {
          company: true,
          person: true,
          opportunity: true
        }
      });
    
    case 'prospects':
      return await prisma.prospects.findFirst({
        where: baseWhere,
        include: {
          company: true,
          person: true,
          opportunity: true
        }
      });
    
    default:
      return null;
  }
}
