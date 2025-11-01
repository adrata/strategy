/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * Buyer Group Intelligence API
 * 
 * GET /api/intelligence/buyer-group/[companyId]
 * 
 * Returns comprehensive buyer group analysis for a company
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    
    console.log(`👥 [BUYER_GROUP_INTELLIGENCE_API] Fetching buyer group analysis for company: ${companyId}`);

    // Get all people associated with the company
    const people = await prisma.people.findMany({
      where: { 
        companyId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        department: true,
        seniority: true,
        email: true,
        linkedinUrl: true,
        buyerGroupRole: true,
        customFields: true,
        coresignalData: true,
        enrichedData: true,
        lastActionDate: true,
        lastAction: true,
        nextAction: true,
        nextActionDate: true,
        engagementScore: true,
        funnelStage: true,
        rank: true
      },
      orderBy: { rank: 'desc' }
    });

    // Analyze buyer group composition
    const buyerGroupAnalysis = analyzeBuyerGroup(people);

    // Get recent actions for the company
    const recentActions = await prisma.actions.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        person: {
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            buyerGroupRole: true
          }
        }
      }
    });

    // Calculate engagement metrics
    const engagementMetrics = calculateEngagementMetrics(people, recentActions);

    // Generate recommendations
    const recommendations = generateBuyerGroupRecommendations(buyerGroupAnalysis, engagementMetrics);

    const result = {
      companyId,
      buyerGroupAnalysis,
      engagementMetrics,
      recommendations,
      lastUpdated: new Date()
    };

    console.log(`✅ [BUYER_GROUP_INTELLIGENCE_API] Generated buyer group analysis for company: ${companyId}`);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error(`❌ [BUYER_GROUP_INTELLIGENCE_API] Error fetching buyer group intelligence:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch buyer group intelligence',
        data: null
      },
      { status: 500 }
    );
  }
}

/**
 * Analyze buyer group composition
 */
function analyzeBuyerGroup(people: any[]) {
  const totalPeople = people.length;
  const buyerGroupMembers = people.filter(p => p.buyerGroupRole);
  const decisionMakers = people.filter(p => 
    p.buyerGroupRole && 
    ['Decision Maker', 'Influencer', 'Champion'].includes(p.buyerGroupRole)
  );
  const champions = people.filter(p => p.buyerGroupRole === 'Champion');
  const influencers = people.filter(p => p.buyerGroupRole === 'Influencer');

  // Role distribution
  const roleDistribution = buyerGroupMembers.reduce((acc, person) => {
    const role = person.buyerGroupRole || 'Unknown';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Department distribution
  const departmentDistribution = people.reduce((acc, person) => {
    const dept = person.department || 'Unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Seniority distribution
  const seniorityDistribution = people.reduce((acc, person) => {
    const seniority = person.seniority || 'Unknown';
    acc[seniority] = (acc[seniority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalPeople,
    buyerGroupMembers: buyerGroupMembers.length,
    decisionMakers: decisionMakers.length,
    champions: champions.length,
    influencers: influencers.length,
    coverage: {
      buyerGroupCoverage: totalPeople > 0 ? (buyerGroupMembers.length / totalPeople) * 100 : 0,
      decisionMakerCoverage: totalPeople > 0 ? (decisionMakers.length / totalPeople) * 100 : 0
    },
    roleDistribution,
    departmentDistribution,
    seniorityDistribution,
    members: buyerGroupMembers.map(member => ({
      id: member.id,
      name: member.fullName,
      title: member.jobTitle,
      department: member.department,
      role: member.buyerGroupRole,
      seniority: member.seniority,
      engagementScore: member.engagementScore,
      lastAction: member.lastAction,
      lastActionDate: member.lastActionDate,
      nextAction: member.nextAction,
      nextActionDate: member.nextActionDate
    }))
  };
}

/**
 * Calculate engagement metrics
 */
function calculateEngagementMetrics(people: any[], recentActions: any[]) {
  const totalPeople = people.length;
  const engagedPeople = people.filter(p => p.lastActionDate);
  const activePeople = people.filter(p => {
    if (!p.lastActionDate) return false;
    const lastActionDate = new Date(p.lastActionDate);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastActionDate > thirtyDaysAgo;
  });

  // Action distribution by type
  const actionTypes = recentActions.reduce((acc, action) => {
    const type = action.type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Engagement by person
  const engagementByPerson = people.map(person => {
    const personActions = recentActions.filter(action => action.personId === person.id);
    return {
      personId: person.id,
      name: person.fullName,
      actionCount: personActions.length,
      lastActionDate: person.lastActionDate,
      engagementScore: person.engagementScore || 0
    };
  });

  return {
    totalPeople,
    engagedPeople: engagedPeople.length,
    activePeople: activePeople.length,
    engagementRate: totalPeople > 0 ? (engagedPeople.length / totalPeople) * 100 : 0,
    activityRate: totalPeople > 0 ? (activePeople.length / totalPeople) * 100 : 0,
    actionTypes,
    engagementByPerson,
    recentActions: recentActions.slice(0, 10).map(action => ({
      id: action.id,
      type: action.type,
      description: action.description,
      personName: action.person?.fullName,
      personRole: action.person?.buyerGroupRole,
      createdAt: action.createdAt
    }))
  };
}

/**
 * Generate buyer group recommendations
 */
function generateBuyerGroupRecommendations(buyerGroupAnalysis: any, engagementMetrics: any) {
  const recommendations = [];

  // Coverage recommendations
  if (buyerGroupAnalysis.coverage.buyerGroupCoverage < 50) {
    recommendations.push({
      type: 'coverage',
      priority: 'High',
      title: 'Expand Buyer Group Coverage',
      description: `Only ${buyerGroupAnalysis.coverage.buyerGroupCoverage.toFixed(1)}% of people have buyer group roles assigned. Identify and assign roles to key stakeholders.`,
      actions: [
        'Review all company contacts and identify decision makers',
        'Assign buyer group roles based on job titles and seniority',
        'Focus on departments with low coverage'
      ]
    });
  }

  if (buyerGroupAnalysis.coverage.decisionMakerCoverage < 20) {
    recommendations.push({
      type: 'decision_makers',
      priority: 'High',
      title: 'Identify More Decision Makers',
      description: `Only ${buyerGroupAnalysis.coverage.decisionMakerCoverage.toFixed(1)}% of people are identified as decision makers. This may indicate incomplete buyer group mapping.`,
      actions: [
        'Research C-level executives and department heads',
        'Identify budget holders and procurement contacts',
        'Map influence networks within the organization'
      ]
    });
  }

  // Engagement recommendations
  if (engagementMetrics.engagementRate < 30) {
    recommendations.push({
      type: 'engagement',
      priority: 'Medium',
      title: 'Improve Engagement Rate',
      description: `Only ${engagementMetrics.engagementRate.toFixed(1)}% of people have recent actions. Increase outreach to buyer group members.`,
      actions: [
        'Schedule regular touchpoints with key stakeholders',
        'Share relevant content and insights',
        'Invite to webinars or events'
      ]
    });
  }

  if (engagementMetrics.activityRate < 20) {
    recommendations.push({
      type: 'activity',
      priority: 'High',
      title: 'Increase Activity with Buyer Group',
      description: `Only ${engagementMetrics.activityRate.toFixed(1)}% of people have had actions in the last 30 days. Prioritize engagement with decision makers.`,
      actions: [
        'Focus on champions and influencers first',
        'Create personalized outreach campaigns',
        'Leverage existing relationships to warm introductions'
      ]
    });
  }

  // Role-specific recommendations
  if (buyerGroupAnalysis.champions === 0) {
    recommendations.push({
      type: 'champions',
      priority: 'High',
      title: 'Identify and Nurture Champions',
      description: 'No champions identified in the buyer group. Champions are crucial for internal advocacy.',
      actions: [
        'Look for people who have shown interest in your solution',
        'Identify those who have engaged positively in the past',
        'Develop relationships with potential champions'
      ]
    });
  }

  if (buyerGroupAnalysis.influencers < 2) {
    recommendations.push({
      type: 'influencers',
      priority: 'Medium',
      title: 'Expand Influencer Network',
      description: `Only ${buyerGroupAnalysis.influencers} influencers identified. Build relationships with more influencers.`,
      actions: [
        'Identify subject matter experts and thought leaders',
        'Connect with people who influence decision makers',
        'Engage with technical and business stakeholders'
      ]
    });
  }

  return recommendations;
}
