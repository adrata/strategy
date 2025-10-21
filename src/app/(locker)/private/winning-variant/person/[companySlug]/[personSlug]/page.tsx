"use client";

import React from 'react';
import PersonDetailPage from '../../../components/PersonDetailPage';
import PasswordProtection from '../../../PasswordProtection';
import { getPersonBySlug, getCompanyData } from '../../../data/buyerGroupData';


interface PersonPageProps {
  params: Promise<{
    companySlug: string;
    personSlug: string;
  }>;
}

// Map BuyerGroupMember data to PersonDetailPage format
const mapPersonData = (buyerGroupMember: any, companySlug: string) => {
  const companyData = getCompanyData(companySlug);
  const companyName = companyData?.companyInfo.name || 'Unknown Company';
  
  return {
    name: buyerGroupMember.name,
    title: buyerGroupMember.title,
    company: companyName,
    email: buyerGroupMember.contactInfo.email || '',
    phone: buyerGroupMember.contactInfo.phone || '',
    linkedin: buyerGroupMember.contactInfo.linkedin || '',
    archetype: {
      id: buyerGroupMember.archetype.id,
      name: buyerGroupMember.archetype.name,
      role: buyerGroupMember.archetype.role,
      description: buyerGroupMember.archetype.description
    },
    winningVariantStrategy: {
      situation: buyerGroupMember.personalizedStrategy.situation,
      complication: buyerGroupMember.personalizedStrategy.complication,
      futureState: buyerGroupMember.personalizedStrategy.futureState,
      keyMessage: `Focus on ${buyerGroupMember.archetype.characteristics.motivations[0]?.toLowerCase() || 'strategic value'} and ${buyerGroupMember.archetype.characteristics.keyNeeds[0]?.toLowerCase() || 'business impact'}`,
      tailoredApproach: buyerGroupMember.archetype.characteristics.communicationStyle
    },
    painPoints: buyerGroupMember.archetype.characteristics.concerns,
    influenceScore: buyerGroupMember.influenceScore,
    confidence: buyerGroupMember.confidence,
    flightRisk: buyerGroupMember.flightRisk || {
      score: 50,
      category: "UNKNOWN",
      reasoning: "Flight risk data not available"
    },
    workHistory: [
      `${buyerGroupMember.title} at ${companyName}`,
      "Previous experience details not available"
    ],
    aiInsights: [
      `High influence score of ${buyerGroupMember.influenceScore}% in decision-making`,
      `Confidence level: ${buyerGroupMember.confidence}%`,
      `Role: ${buyerGroupMember.role} in buyer group`
    ],
    recentMoves: [
      "Recent activity details not available",
      "Focus on strategic engagement approach"
    ],
    boardPressure: [
      "Board pressure details not available",
      "Focus on business impact and ROI"
    ],
    competitiveThreats: [
      "Competitive threat analysis not available",
      "Focus on strategic differentiation"
    ],
    budgetAuthority: `${buyerGroupMember.role} with ${buyerGroupMember.influenceScore}% influence`,
    decisionTimeline: "Decision timeline not specified"
  };
};

export default function PersonPage({ params }: PersonPageProps) {
  // Unwrap the params Promise using React.use()
  const { companySlug, personSlug } = React.use(params);
  
  // Look up the person data based on companySlug and personSlug
  const buyerGroupMember = getPersonBySlug(companySlug, personSlug);
  
  // Handle person not found case
  if (!buyerGroupMember) {
    const companyData = getCompanyData(companySlug);
    const companyName = companyData?.companyInfo.name || 'Unknown Company';
    
    return (
      <PasswordProtection correctPassword="WinningVariant-2025">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Person Not Found</h1>
            <p className="text-gray-600 mb-6">
              The person you're looking for doesn't exist in the {companyName} buyer group intelligence report.
            </p>
            <a 
              href={`/private/winning-variant/${companySlug}`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to {companyName} Report
            </a>
          </div>
        </div>
      </PasswordProtection>
    );
  }

  // Map the buyer group member data to the expected format
  const person = mapPersonData(buyerGroupMember, companySlug);

  return (
    <PasswordProtection correctPassword="WinningVariant-2025">
      <PersonDetailPage person={person} companySlug={companySlug} />
    </PasswordProtection>
  );
}
