"use client";

import React from 'react';
import PersonDetailPage from '../../../components/PersonDetailPage';
import PasswordProtection from '../../../PasswordProtection';

// This would normally come from your data source
// For now, I'll create a sample person to demonstrate the structure
const samplePerson = {
  name: "Gary Swidler",
  title: "Chief Financial Officer",
  company: "Match Group",
  email: "gary.swidler@matchgroup.com",
  phone: "+1-214-555-0123",
  linkedin: "https://linkedin.com/in/garyswidler",
  archetype: {
    id: "economic-buyer",
    name: "Economic Buyer",
    role: "Decision Maker",
    description: "Senior executive with budget authority focused on ROI and business impact"
  },
  winningVariantStrategy: {
    situation: "Gary oversees Match Group's financial strategy, including significant investments in AI for fraud detection and credit scoring, but needs to demonstrate that these AI initiatives drive business growth and competitive advantage.",
    complication: "While the team can show sophisticated AI models and improved fraud detection, Gary struggles to prove that these technical achievements translate to measurable business impact like increased revenue or reduced operational costs.",
    futureState: "With Winning Variant's Snowflake-native experimentation platform, Gary can prove that AI fraud detection reduces losses by $3M annually and AI credit scoring increases approval rates by 8% ($5M in additional revenue). He transforms the narrative from 'our AI is accurate' to 'our AI drives $8M in business impact annually.'",
    keyMessage: "Turn AI accuracy into measurable financial impact and cost savings",
    tailoredApproach: "Lead with financial impact and cost savings. Show direct correlation between AI improvements and financial outcomes. Emphasize board-ready ROI dashboards and financial metrics."
  },
  painPoints: [
    "Can't prove AI ROI to board and investors",
    "ML team celebrates accuracy but financial impact unclear",
    "Board questioning $5M+ annual AI budget allocation",
    "Need to show AI as profit driver, not cost center"
  ],
  influenceScore: 95,
  confidence: 92,
  flightRisk: {
    score: 10,
    category: "ROOTED",
    reasoning: "C-level executive, long tenure, strong company performance, equity holder"
  },
  workHistory: [
    "CFO at Match Group (2018-Present) - $2.8B revenue, 3,000+ employees",
    "VP Finance at Tinder (2015-2018) - Led financial strategy for $1.2B acquisition",
    "Senior Director at IAC (2010-2015) - Managed portfolio of 50+ dating sites"
  ],
  aiInsights: [
    "Overseeing $5M+ annual AI/ML budget across Match Group portfolio",
    "Board demanding proof that AI investments drive revenue, not just accuracy",
    "Under pressure after Match Group stock dropped 15% last quarter",
    "Competing with Bumble and Hinge for market share in dating space"
  ],
  recentMoves: [
    "Hired new VP of Data Science in Q3 2024 to improve AI ROI measurement",
    "Launched $2M AI experimentation initiative across Tinder, Match, Hinge",
    "Presented to board on AI budget justification in October 2024"
  ],
  boardPressure: [
    "Board questioning $5M AI budget when revenue growth slowed to 3%",
    "Investors demanding proof that AI features increase subscription conversions",
    "Pressure to show AI ROI within 6 months or face budget cuts"
  ],
  competitiveThreats: [
    "Bumble's AI-powered matching gaining market share",
    "Hinge's 'Most Compatible' feature showing better user engagement",
    "New dating apps using AI to reduce user acquisition costs"
  ],
  budgetAuthority: "Controls $5M+ annual AI/ML budget, reports directly to CEO and board",
  decisionTimeline: "Q1 2025 budget cycle - needs to justify AI investments by March 2025"
};

interface PersonPageProps {
  params: Promise<{
    companySlug: string;
    personSlug: string;
  }>;
}

export default function PersonPage({ params }: PersonPageProps) {
  // Unwrap the params Promise using React.use()
  const { companySlug, personSlug } = React.use(params);
  
  // In a real implementation, you would:
  // 1. Look up the person data based on companySlug and personSlug
  // 2. Handle loading states and error cases
  // 3. Fetch from your data source (API, database, etc.)
  
  // For now, we'll use the sample data
  const person = samplePerson;

  return (
    <PasswordProtection correctPassword="WinningVariant-2025">
      <PersonDetailPage person={person} companySlug={companySlug} />
    </PasswordProtection>
  );
}
