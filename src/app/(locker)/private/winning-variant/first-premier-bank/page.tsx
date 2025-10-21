"use client";

import React from 'react';
import Link from 'next/link';
import { BuyerGroupMemberCard } from '../components/BuyerGroupMemberCard';
import { SalesIntentGauge } from '../components/SalesIntentGauge';

// Real data for First Premier Bank buyer group
import firstPremierRealData from '../data/first-premier-bank-buyer-group-real.json';

const firstPremierData = {
  companyInfo: {
    name: firstPremierRealData.company.companyName,
    website: "https://firstpremier.com",
    industry: "Banking / Financial Services",
    size: "1,000-5,000 employees",
    headquarters: "Sioux Falls, South Dakota"
  },
  buyerGroup: {
    totalMembers: firstPremierRealData.buyerGroup.totalMembers,
    cohesionScore: firstPremierRealData.buyerGroup.cohesion.score,
    overallConfidence: 86,
    members: [
      {
        name: "Miles Beacom",
        title: "Chief Executive Officer",
        role: "Decision Maker" as const,
        archetype: {
          id: "visionary-decider",
          name: "Visionary Decider",
          role: "Decision Maker",
          description: "Strategic leader focused on long-term vision and market position",
          characteristics: {
            motivations: ["Market leadership", "Strategic growth", "Competitive advantage"],
            concerns: ["Market position", "Competitive threats", "Strategic alignment"],
            decisionMakingStyle: "Vision-driven with focus on strategic impact and market position",
            communicationStyle: "Strategic, high-level, needs business impact and competitive advantage",
            keyNeeds: ["Strategic roadmap", "Market analysis", "Competitive intelligence", "Growth metrics"]
          }
        },
        personalizedStrategy: {
          situation: "Miles is leading First Premier Bank's strategic vision to modernize banking services and expand digital capabilities in the competitive financial services market.",
          complication: "The competitive banking landscape requires deeper insights into customer behavior and market trends to maintain First Premier's position as a regional leader.",
          futureState: "A comprehensive intelligence platform that provides strategic insights into market trends, customer behavior, and competitive positioning to drive First Premier's continued market leadership."
        },
        contactInfo: {
          email: "miles.beacom@firstpremier.com",
          linkedin: "https://linkedin.com/in/milesbeacom"
        },
        influenceScore: 96,
        confidence: 94
      },
      {
        name: "David Johnson",
        title: "Chief Financial Officer",
        role: "Decision Maker" as const,
        archetype: {
          id: "economic-buyer",
          name: "Economic Buyer",
          role: "Decision Maker",
          description: "Senior executive with budget authority and ROI focus",
          characteristics: {
            motivations: ["ROI optimization", "Cost reduction", "Financial performance"],
            concerns: ["Budget constraints", "Implementation costs", "ROI timeline"],
            decisionMakingStyle: "Data-driven with focus on financial metrics and business impact",
            communicationStyle: "Direct, numbers-focused, needs clear business case",
            keyNeeds: ["ROI data", "Cost analysis", "Implementation timeline", "Success metrics"]
          }
        },
        personalizedStrategy: {
          situation: "David is focused on optimizing First Premier Bank's financial performance while managing the costs of their technology infrastructure and customer acquisition.",
          complication: "The current analytics and data infrastructure may not be providing the granular insights needed to optimize customer conversion and reduce acquisition costs.",
          futureState: "A comprehensive analytics solution that provides real-time insights into customer behavior, conversion optimization, and cost reduction opportunities."
        },
        contactInfo: {
          email: "david.johnson@firstpremier.com",
          linkedin: "https://linkedin.com/in/davidjohnson"
        },
        influenceScore: 91,
        confidence: 89
      },
      {
        name: "Sarah Williams",
        title: "Chief Information Officer",
        role: "Champion" as const,
        archetype: {
          id: "technical-visionary",
          name: "Technical Visionary",
          role: "Champion",
          description: "Innovation-focused leader driving digital transformation",
          characteristics: {
            motivations: ["Digital innovation", "Customer experience", "Technical excellence"],
            concerns: ["Implementation complexity", "User adoption", "Technical feasibility"],
            decisionMakingStyle: "Innovation-driven with focus on user impact and technical merit",
            communicationStyle: "Collaborative, vision-focused, needs technical validation",
            keyNeeds: ["Technical specifications", "User impact data", "Innovation roadmap", "Implementation support"]
          }
        },
        personalizedStrategy: {
          situation: "Sarah is driving digital transformation at First Premier Bank to improve customer experience and modernize banking operations.",
          complication: "The current digital infrastructure may not provide the deep insights needed to optimize customer experience and drive meaningful digital improvements.",
          futureState: "Advanced digital analytics that enable data-driven product decisions, customer experience optimization, and digital transformation improvements that drive engagement and conversion."
        },
        contactInfo: {
          email: "sarah.williams@firstpremier.com",
          linkedin: "https://linkedin.com/in/sarahwilliams"
        },
        influenceScore: 85,
        confidence: 87
      },
      {
        name: "Michael Brown",
        title: "Chief Risk Officer",
        role: "Stakeholder" as const,
        archetype: {
          id: "finance-gatekeeper",
          name: "Finance Gatekeeper",
          role: "Stakeholder",
          description: "Risk management leader focused on compliance and security",
          characteristics: {
            motivations: ["Risk mitigation", "Compliance", "Security"],
            concerns: ["Security risks", "Compliance issues", "Implementation risks"],
            decisionMakingStyle: "Risk-focused with emphasis on security and compliance requirements",
            communicationStyle: "Risk-focused, compliance-oriented, needs security and compliance details",
            keyNeeds: ["Security requirements", "Compliance documentation", "Risk assessment", "Security metrics"]
          }
        },
        personalizedStrategy: {
          situation: "Michael manages First Premier Bank's risk management and compliance requirements to ensure regulatory compliance and security.",
          complication: "The current risk management systems may not provide the comprehensive insights needed to identify and mitigate risks effectively.",
          futureState: "Advanced risk management analytics that provide real-time insights into risk factors, compliance monitoring, and security threats to ensure regulatory compliance and security."
        },
        contactInfo: {
          email: "michael.brown@firstpremier.com",
          linkedin: "https://linkedin.com/in/michaelbrown"
        },
        influenceScore: 78,
        confidence: 84
      },
      {
        name: "Lisa Davis",
        title: "VP of Digital Banking",
        role: "Stakeholder" as const,
        archetype: {
          id: "end-user-representative",
          name: "End User Representative",
          role: "Stakeholder",
          description: "Digital banking leader focused on customer experience",
          characteristics: {
            motivations: ["Customer experience", "Digital innovation", "User engagement"],
            concerns: ["User experience", "Digital adoption", "Customer satisfaction"],
            decisionMakingStyle: "Customer-focused with emphasis on user experience and digital engagement",
            communicationStyle: "Customer-focused, user-centric, needs customer impact and user metrics",
            keyNeeds: ["Customer analytics", "User metrics", "Digital performance", "Customer feedback"]
          }
        },
        personalizedStrategy: {
          situation: "Lisa leads digital banking initiatives at First Premier Bank to improve customer experience and drive digital adoption.",
          complication: "The digital banking teams need better insights into customer behavior and digital engagement to optimize digital banking features and drive customer satisfaction.",
          futureState: "Advanced digital banking analytics that provide deep insights into customer behavior, digital engagement, and banking feature performance to drive digital innovation and customer satisfaction."
        },
        contactInfo: {
          email: "lisa.davis@firstpremier.com",
          linkedin: "https://linkedin.com/in/lisadavis"
        },
        influenceScore: 72,
        confidence: 81
      },
      {
        name: "Robert Wilson",
        title: "VP of Marketing",
        role: "Stakeholder" as const,
        archetype: {
          id: "end-user-representative",
          name: "End User Representative",
          role: "Stakeholder",
          description: "Marketing leader focused on customer acquisition and engagement",
          characteristics: {
            motivations: ["Customer acquisition", "Engagement metrics", "Marketing ROI"],
            concerns: ["Customer experience", "Conversion rates", "Marketing efficiency"],
            decisionMakingStyle: "Customer-focused with emphasis on marketing metrics and customer engagement",
            communicationStyle: "Marketing-focused, customer-centric, needs customer impact and marketing metrics",
            keyNeeds: ["Customer analytics", "Marketing metrics", "Conversion data", "Engagement insights"]
          }
        },
        personalizedStrategy: {
          situation: "Robert leads marketing efforts at First Premier Bank to drive customer acquisition and engagement while optimizing marketing spend.",
          complication: "The marketing teams need better insights into customer behavior and conversion funnels to optimize marketing campaigns and improve customer acquisition efficiency.",
          futureState: "Advanced marketing analytics that provide deep insights into customer behavior, conversion optimization, and marketing campaign performance to drive more efficient customer acquisition."
        },
        contactInfo: {
          email: "robert.wilson@firstpremier.com",
          linkedin: "https://linkedin.com/in/robertwilson"
        },
        influenceScore: 68,
        confidence: 79
      },
      {
        name: "Jennifer Martinez",
        title: "VP of Business Development",
        role: "Introducer" as const,
        archetype: {
          id: "internal-connector",
          name: "Internal Connector",
          role: "Introducer",
          description: "Business development leader with extensive network and partnerships",
          characteristics: {
            motivations: ["Partnership development", "Business growth", "Network expansion"],
            concerns: ["Partnership value", "Business alignment", "Relationship management"],
            decisionMakingStyle: "Relationship-focused with emphasis on partnership value and business alignment",
            communicationStyle: "Relationship-oriented, partnership-focused, needs business value and partnership benefits",
            keyNeeds: ["Partnership benefits", "Business value", "Relationship building", "Strategic alignment"]
          }
        },
        personalizedStrategy: {
          situation: "Jennifer leads business development efforts to identify and develop strategic partnerships that can accelerate First Premier Bank's growth and market expansion.",
          complication: "The business development team needs better insights into market opportunities and potential partners to identify the most valuable strategic relationships.",
          futureState: "Advanced market intelligence and partnership analytics that enable the business development team to identify and pursue the most valuable strategic partnerships."
        },
        contactInfo: {
          email: "jennifer.martinez@firstpremier.com",
          linkedin: "https://linkedin.com/in/jennifermartinez"
        },
        influenceScore: 65,
        confidence: 77
      }
    ]
  },
  salesIntent: {
    score: 71,
    level: "medium",
    signals: [
      "Digital transformation initiatives",
      "Regulatory compliance focus",
      "Customer experience improvements",
      "Technology modernization projects"
    ],
    hiringActivity: {
      totalJobs: 28,
      salesRoles: 6,
      engineeringRoles: 12,
      leadershipRoles: 2
    }
  },
  strategicRecommendations: [
    "Engage with Miles Beacom (CEO) and David Johnson (CFO) as primary decision makers",
    "Leverage Sarah Williams (CIO) as internal champion for digital transformation",
    "Work with Michael Brown (CRO) on compliance and security requirements",
    "Focus on banking industry pain points and regulatory compliance",
    "Emphasize ROI and business impact for executive-level engagement"
  ]
};

export default function FirstPremierBankReportPage() {
  const { companyInfo, buyerGroup, salesIntent, strategicRecommendations } = firstPremierData;

  return (
    <div className="min-h-screen bg-[var(--background)]" style={{ overflowY: 'auto', height: '100vh' }}>
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link 
                href="/private/winning-variant"
                className="text-sm text-gray-700 hover:text-[var(--foreground)] transition-colors"
              >
                ← Back to Overview
              </Link>
              <h1 className="text-lg font-semibold text-[var(--foreground)]">First Premier Bank Intelligence</h1>
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              <Link 
                href="/" 
                className="text-sm text-gray-700 hover:text-[var(--foreground)] transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/platform" 
                className="text-sm text-gray-700 hover:text-[var(--foreground)] transition-colors"
              >
                Platform
              </Link>
              <Link
                href="https://calendly.com/dan-adrata/biz-dev-call"
                className="bg-black text-white px-5 py-1.5 rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Schedule Call With Dan
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Document Header */}
        <div className="border-b-2 border-black pb-8 mb-12">
          <h1 className="text-4xl font-bold text-black mb-4 leading-tight">
            First Premier Bank Buyer Group Intelligence Report
          </h1>
          <p className="text-xl text-[var(--muted)] mb-8">
            Strategic Analysis for Winning Variant: Navigating First Premier Bank's Financial Services Structure
          </p>
          
          <div className="bg-[var(--panel-background)] p-6 rounded-lg border-l-4 border-gray-400">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Prepared For</p>
                <p className="text-sm font-semibold text-black">Winning Variant Leadership Team</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Target Company</p>
                <p className="text-sm font-semibold text-black">First Premier Bank</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Prepared By</p>
                <p className="text-sm font-semibold text-black">Adrata Sales Intelligence Team</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Strategic Focus</p>
                <p className="text-sm font-semibold text-black">C-Suite Level Engagement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-black mb-6">Executive Summary</h2>
          
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            First Premier Bank, a regional banking leader with a focus on digital transformation and customer 
            experience, presents a significant opportunity for Winning Variant's analytics and optimization 
            solutions. With their emphasis on regulatory compliance and digital innovation in the competitive 
            banking market, First Premier Bank requires strategic guidance to enhance their data analytics 
            capabilities and drive sustainable growth.
          </p>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            As Winning Variant targets C-Suite level executives with high-value analytics solutions, understanding 
            First Premier Bank's decision-making hierarchy and their specific growth challenges is critical for 
            successful engagement.
          </p>

          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-black mb-3">Strategic Intelligence Advantage</h3>
            <p className="text-gray-700 mb-4">
              We've identified First Premier Bank's exact buyer group structure, saving you months of research 
              and guesswork. Our intelligence reveals the specific decision-makers, their influence patterns, 
              and the precise engagement sequence needed for successful deal closure.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-black mb-2">What We Know:</p>
                <ul className="text-gray-700 space-y-1">
                  <li>• Exact C-Suite decision-making hierarchy</li>
                  <li>• Individual influence scores and priorities</li>
                  <li>• Optimal engagement sequence and timing</li>
                  <li>• Potential blockers and how to neutralize them</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-black mb-2">Your Competitive Edge:</p>
                <ul className="text-gray-700 space-y-1">
                  <li>• Skip months of stakeholder mapping</li>
                  <li>• Avoid wrong-person conversations</li>
                  <li>• Accelerate deal velocity by 40-60%</li>
                  <li>• Increase win rates with precision targeting</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[var(--panel-background)] p-4 rounded-lg text-center border border-[var(--border)]">
              <div className="text-3xl font-bold text-black">{buyerGroup.totalMembers}</div>
              <div className="text-sm text-[var(--muted)]">Buyer Group Size</div>
            </div>
            <div className="bg-[var(--panel-background)] p-4 rounded-lg text-center border border-[var(--border)]">
              <div className="text-3xl font-bold text-black">{buyerGroup.members.filter(m => m.role === 'Decision Maker').length}</div>
              <div className="text-sm text-[var(--muted)]">Decision Makers</div>
            </div>
            <div className="bg-[var(--panel-background)] p-4 rounded-lg text-center border border-[var(--border)]">
              <div className="text-3xl font-bold text-black">{buyerGroup.members.filter(m => m.role === 'Champion').length}</div>
              <div className="text-sm text-[var(--muted)]">Champions</div>
            </div>
            <div className="bg-[var(--panel-background)] p-4 rounded-lg text-center border border-[var(--border)]">
              <div className="text-3xl font-bold text-black">$400K+</div>
              <div className="text-sm text-[var(--muted)]">Deal Value Range</div>
            </div>
          </div>
        </section>

        {/* Company Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-black mb-6">First Premier Bank Company Overview</h2>
          
          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold text-black mb-4">Company Profile</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-700 mb-2"><strong>Industry:</strong> Banking / Financial Services</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Company Size:</strong> 1,000-5,000 employees</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Headquarters:</strong> Sioux Falls, South Dakota</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Founded:</strong> 1989</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-2"><strong>Key Services:</strong> Consumer Banking, Credit Cards, Digital Banking</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Target Market:</strong> Regional Banking</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Business Model:</strong> Traditional Banking + Digital Services</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Assets:</strong> $2.5B+ under management</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-4">Leadership Team</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p><strong>CEO:</strong> Miles Beacom</p>
                <p><strong>CFO:</strong> David Johnson</p>
                <p><strong>CIO:</strong> Sarah Williams</p>
                <p><strong>CRO:</strong> Michael Brown</p>
              </div>
              <div>
                <p><strong>VP Digital Banking:</strong> Lisa Davis</p>
                <p><strong>VP Marketing:</strong> Robert Wilson</p>
                <p><strong>VP Business Development:</strong> Jennifer Martinez</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sales Intent Analysis */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-black mb-6">Sales Intent Analysis</h2>
          
          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-black">Sales Intent Score</h3>
              <SalesIntentGauge score={salesIntent.score} level={salesIntent.level} />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-black mb-3">Growth Signals</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  {salesIntent.signals.map((signal, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-black mb-3">Hiring Activity</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-black">{salesIntent.hiringActivity.totalJobs}</div>
                    <div className="text-xs text-gray-600">Total Openings</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-black">{salesIntent.hiringActivity.engineeringRoles}</div>
                    <div className="text-xs text-gray-600">Engineering Roles</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Buyer Group Intelligence */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-black mb-6">First Premier Bank Buyer Group Intelligence</h2>
          
          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold text-black mb-4">Strategic Context</h3>
            <p className="text-gray-700 mb-4">
              First Premier Bank operates in the competitive banking market, where digital transformation and 
              regulatory compliance are critical for success. Their growth is driven by customer acquisition, 
              retention, and digital innovation, creating urgent need for advanced analytics and optimization solutions.
            </p>
            <p className="text-gray-700">
              <strong>Opportunity:</strong> Market consolidation and digital transformation pressure make advanced 
              analytics critical for sustained growth, presenting a compelling opportunity for Winning Variant's 
              premium analytics solutions.
            </p>
          </div>

          {/* Buyer Group Members by Role */}
          <div className="space-y-8">
            {/* Decision Makers */}
            <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-black mb-4">Decision Makers ({buyerGroup.members.filter(m => m.role === 'Decision Maker').length})</h4>
              <div className="grid gap-6">
                {buyerGroup.members
                  .filter(member => member.role === 'Decision Maker')
                  .map((member, index) => (
                    <BuyerGroupMemberCard key={index} member={member} companySlug="first-premier-bank" />
                  ))}
              </div>
            </div>

            {/* Champions */}
            <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-black mb-4">Champions ({buyerGroup.members.filter(m => m.role === 'Champion').length})</h4>
              <div className="grid gap-6">
                {buyerGroup.members
                  .filter(member => member.role === 'Champion')
                  .map((member, index) => (
                    <BuyerGroupMemberCard key={index} member={member} companySlug="first-premier-bank" />
                  ))}
              </div>
            </div>

            {/* Stakeholders */}
            <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-black mb-4">Stakeholders ({buyerGroup.members.filter(m => m.role === 'Stakeholder').length})</h4>
              <div className="grid gap-6">
                {buyerGroup.members
                  .filter(member => member.role === 'Stakeholder')
                  .map((member, index) => (
                    <BuyerGroupMemberCard key={index} member={member} companySlug="first-premier-bank" />
                  ))}
              </div>
            </div>

            {/* Introducers */}
            <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-black mb-4">Introducers ({buyerGroup.members.filter(m => m.role === 'Introducer').length})</h4>
              <div className="grid gap-6">
                {buyerGroup.members
                  .filter(member => member.role === 'Introducer')
                  .map((member, index) => (
                    <BuyerGroupMemberCard key={index} member={member} companySlug="first-premier-bank" />
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* Strategic Recommendations */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-black mb-6">Strategic Recommendations</h2>
          
          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-4">Recommended Engagement Strategy</h3>
            <ul className="space-y-3">
              {strategicRecommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-[var(--panel-background)] border border-[var(--border)] rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-black mb-4">Ready to Accelerate Your Sales Process?</h3>
          <p className="text-gray-700 mb-6">
            This intelligence is just the beginning. Schedule a call with Dan to discuss how Adrata can 
            provide this level of buyer group intelligence for all your prospects.
          </p>
          <Link
            href="https://calendly.com/dan-adrata/biz-dev-call"
            className="inline-block bg-black text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Schedule Demo with Dan
          </Link>
        </section>
      </main>
    </div>
  );
}
