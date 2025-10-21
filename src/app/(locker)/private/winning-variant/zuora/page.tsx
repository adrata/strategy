"use client";

import React from 'react';
import Link from 'next/link';
import { BuyerGroupMemberCard } from '../components/BuyerGroupMemberCard';
import { SalesIntentGauge } from '../components/SalesIntentGauge';

// Mock data for Zuora buyer group
const zuoraData = {
  companyInfo: {
    name: "Zuora",
    website: "https://zuora.com",
    industry: "SaaS / Subscription Management",
    size: "1,000-5,000 employees",
    headquarters: "Redwood City, California"
  },
  buyerGroup: {
    totalMembers: 8,
    cohesionScore: 86,
    overallConfidence: 90,
    members: [
      {
        name: "Tien Tzuo",
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
          situation: "Tien is leading Zuora's strategic vision to revolutionize subscription business models and expand into new markets.",
          complication: "The competitive SaaS landscape requires deeper insights into customer behavior and market trends to maintain Zuora's position as the subscription economy leader.",
          futureState: "A comprehensive intelligence platform that provides strategic insights into market trends, customer behavior, and competitive positioning to drive Zuora's continued market leadership."
        },
        contactInfo: {
          email: "tien.tzuo@zuora.com",
          linkedin: "https://linkedin.com/in/tientzuo"
        },
        influenceScore: 98,
        confidence: 96
      },
      {
        name: "Todd McElhatton",
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
          situation: "Todd is focused on optimizing Zuora's financial performance while managing the costs of their technology infrastructure and customer acquisition.",
          complication: "The current analytics and data infrastructure may not be providing the granular insights needed to optimize customer conversion and reduce acquisition costs.",
          futureState: "A comprehensive analytics solution that provides real-time insights into customer behavior, conversion optimization, and cost reduction opportunities."
        },
        contactInfo: {
          email: "todd.mcelhatton@zuora.com",
          linkedin: "https://linkedin.com/in/toddmcelhatton"
        },
        influenceScore: 93,
        confidence: 91
      },
      {
        name: "Amy Guggenheim Shenkan",
        title: "Chief Revenue Officer",
        role: "Champion" as const,
        archetype: {
          id: "technical-visionary",
          name: "Technical Visionary",
          role: "Champion",
          description: "Revenue-focused leader driving growth and customer success",
          characteristics: {
            motivations: ["Revenue growth", "Customer success", "Sales optimization"],
            concerns: ["Revenue targets", "Customer retention", "Sales efficiency"],
            decisionMakingStyle: "Revenue-driven with focus on customer impact and sales performance",
            communicationStyle: "Revenue-focused, customer-centric, needs revenue impact and sales metrics",
            keyNeeds: ["Revenue analytics", "Customer metrics", "Sales performance", "Growth metrics"]
          }
        },
        personalizedStrategy: {
          situation: "Amy is driving revenue growth at Zuora through customer success and sales optimization initiatives.",
          complication: "The current revenue analytics may not provide the deep insights needed to optimize customer success and drive meaningful revenue improvements.",
          futureState: "Advanced revenue analytics that enable data-driven revenue decisions, customer success optimization, and sales performance improvements that drive growth and customer satisfaction."
        },
        contactInfo: {
          email: "amy.shenkan@zuora.com",
          linkedin: "https://linkedin.com/in/amyshenkan"
        },
        influenceScore: 88,
        confidence: 89
      },
      {
        name: "Rob Seger",
        title: "Chief Technology Officer",
        role: "Stakeholder" as const,
        archetype: {
          id: "technical-architect",
          name: "Technical Architect",
          role: "Stakeholder",
          description: "Technical leader responsible for technology strategy and architecture",
          characteristics: {
            motivations: ["Technical excellence", "Innovation", "System performance"],
            concerns: ["Technical complexity", "System reliability", "Technical debt"],
            decisionMakingStyle: "Technical evaluation with focus on system architecture and technical merit",
            communicationStyle: "Technical, detail-oriented, needs technical specifications and architecture details",
            keyNeeds: ["Technical documentation", "System requirements", "Performance metrics", "Integration details"]
          }
        },
        personalizedStrategy: {
          situation: "Rob is responsible for Zuora's technology strategy and ensuring the technology infrastructure supports the company's growth and innovation goals.",
          complication: "The technology infrastructure needs to be modernized to support Zuora's growth plans and provide the foundation for future innovation.",
          futureState: "A modern, scalable technology platform that supports Zuora's growth, enables innovation, and provides the foundation for future product development."
        },
        contactInfo: {
          email: "rob.seger@zuora.com",
          linkedin: "https://linkedin.com/in/robseger"
        },
        influenceScore: 82,
        confidence: 87
      },
      {
        name: "Sarah Johnson",
        title: "VP of Data & Analytics",
        role: "Stakeholder" as const,
        archetype: {
          id: "technical-architect",
          name: "Technical Architect",
          role: "Stakeholder",
          description: "Technical leader responsible for data infrastructure and analytics",
          characteristics: {
            motivations: ["Technical excellence", "Data quality", "System performance"],
            concerns: ["Technical complexity", "Data security", "Integration challenges"],
            decisionMakingStyle: "Technical evaluation with focus on system architecture and data quality",
            communicationStyle: "Technical, detail-oriented, needs technical specifications and architecture details",
            keyNeeds: ["Technical documentation", "Security requirements", "Integration specs", "Performance metrics"]
          }
        },
        personalizedStrategy: {
          situation: "Sarah manages Zuora's data infrastructure and analytics capabilities to support business intelligence and product decisions.",
          complication: "The current data architecture may not be scalable enough to handle the increasing volume of customer data and provide real-time insights needed for business decisions.",
          futureState: "A modern, scalable data platform that provides real-time analytics, advanced machine learning capabilities, and seamless integration across all Zuora systems."
        },
        contactInfo: {
          email: "sarah.johnson@zuora.com",
          linkedin: "https://linkedin.com/in/sarahjohnson"
        },
        influenceScore: 78,
        confidence: 85
      },
      {
        name: "David Chen",
        title: "VP of Engineering",
        role: "Stakeholder" as const,
        archetype: {
          id: "technical-architect",
          name: "Technical Architect",
          role: "Stakeholder",
          description: "Engineering leader focused on technical implementation and system architecture",
          characteristics: {
            motivations: ["Technical excellence", "System reliability", "Developer productivity"],
            concerns: ["Implementation complexity", "System performance", "Technical debt"],
            decisionMakingStyle: "Technical evaluation with focus on implementation feasibility and system performance",
            communicationStyle: "Technical, implementation-focused, needs technical details and implementation roadmap",
            keyNeeds: ["Technical specifications", "Implementation timeline", "Performance requirements", "Integration details"]
          }
        },
        personalizedStrategy: {
          situation: "David leads the engineering teams responsible for building and maintaining Zuora's technology infrastructure.",
          complication: "The engineering teams need better tools and insights to optimize system performance, reduce technical debt, and improve development velocity.",
          futureState: "Advanced development tools and analytics that enable faster development cycles, better system monitoring, and improved code quality across all Zuora engineering teams."
        },
        contactInfo: {
          email: "david.chen@zuora.com",
          linkedin: "https://linkedin.com/in/davidchen"
        },
        influenceScore: 75,
        confidence: 82
      },
      {
        name: "Lisa Rodriguez",
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
          situation: "Lisa leads marketing efforts at Zuora to drive customer acquisition and engagement while optimizing marketing spend.",
          complication: "The marketing teams need better insights into customer behavior and conversion funnels to optimize marketing campaigns and improve customer acquisition efficiency.",
          futureState: "Advanced marketing analytics that provide deep insights into customer behavior, conversion optimization, and marketing campaign performance to drive more efficient customer acquisition."
        },
        contactInfo: {
          email: "lisa.rodriguez@zuora.com",
          linkedin: "https://linkedin.com/in/lisarodriguez"
        },
        influenceScore: 72,
        confidence: 80
      },
      {
        name: "Michael Kim",
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
          situation: "Michael leads business development efforts to identify and develop strategic partnerships that can accelerate Zuora's growth and market expansion.",
          complication: "The business development team needs better insights into market opportunities and potential partners to identify the most valuable strategic relationships.",
          futureState: "Advanced market intelligence and partnership analytics that enable the business development team to identify and pursue the most valuable strategic partnerships."
        },
        contactInfo: {
          email: "michael.kim@zuora.com",
          linkedin: "https://linkedin.com/in/michaelkim"
        },
        influenceScore: 68,
        confidence: 76
      }
    ]
  },
  salesIntent: {
    score: 85,
    level: "high",
    signals: [
      "Strong subscription economy growth",
      "Expansion into new markets",
      "Hiring in data analytics roles",
      "Strategic partnerships in SaaS space"
    ],
    hiringActivity: {
      totalJobs: 42,
      salesRoles: 15,
      engineeringRoles: 20,
      leadershipRoles: 3
    }
  },
  strategicRecommendations: [
    "Engage with Tien Tzuo (CEO) and Todd McElhatton (CFO) as primary decision makers",
    "Leverage Amy Guggenheim Shenkan (CRO) as internal champion for revenue growth",
    "Work with Rob Seger (CTO) and Sarah Johnson (VP Data) on technical requirements",
    "Focus on SaaS industry pain points and subscription economy solutions",
    "Emphasize ROI and business impact for executive-level engagement"
  ]
};

export default function ZuoraReportPage() {
  const { companyInfo, buyerGroup, salesIntent, strategicRecommendations } = zuoraData;

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
              <h1 className="text-lg font-semibold text-[var(--foreground)]">Zuora Intelligence</h1>
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
            Zuora Buyer Group Intelligence Report
          </h1>
          <p className="text-xl text-[var(--muted)] mb-8">
            Strategic Analysis for Winning Variant: Navigating Zuora's Subscription Economy Structure
          </p>
          
          <div className="bg-[var(--panel-background)] p-6 rounded-lg border-l-4 border-gray-400">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Prepared For</p>
                <p className="text-sm font-semibold text-black">Winning Variant Leadership Team</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Target Company</p>
                <p className="text-sm font-semibold text-black">Zuora</p>
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
            Zuora, the leading subscription economy platform, presents a significant opportunity for Winning 
            Variant's analytics and optimization solutions. With their focus on subscription business models 
            and revenue optimization in the competitive SaaS market, Zuora requires strategic guidance to 
            enhance their data analytics capabilities and drive sustainable growth.
          </p>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            As Winning Variant targets C-Suite level executives with high-value analytics solutions, understanding 
            Zuora's decision-making hierarchy and their specific growth challenges is critical for successful engagement.
          </p>

          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-black mb-3">Strategic Intelligence Advantage</h3>
            <p className="text-gray-700 mb-4">
              We've identified Zuora's exact buyer group structure, saving you months of research and guesswork. 
              Our intelligence reveals the specific decision-makers, their influence patterns, and the precise 
              engagement sequence needed for successful deal closure.
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
              <div className="text-3xl font-bold text-black">$600K+</div>
              <div className="text-sm text-[var(--muted)]">Deal Value Range</div>
            </div>
          </div>
        </section>

        {/* Company Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-black mb-6">Zuora Company Overview</h2>
          
          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold text-black mb-4">Company Profile</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-700 mb-2"><strong>Industry:</strong> SaaS / Subscription Management</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Company Size:</strong> 1,000-5,000 employees</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Headquarters:</strong> Redwood City, California</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Founded:</strong> 2007</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-2"><strong>Key Products:</strong> Zuora Billing, Zuora Revenue, Zuora Collect</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Target Market:</strong> Subscription Businesses</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Business Model:</strong> SaaS Platform</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Revenue:</strong> $400M+ annually</p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--background)] border border-[var(--border)] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-4">Leadership Team</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p><strong>CEO:</strong> Tien Tzuo</p>
                <p><strong>CFO:</strong> Todd McElhatton</p>
                <p><strong>CRO:</strong> Amy Guggenheim Shenkan</p>
                <p><strong>CTO:</strong> Rob Seger</p>
              </div>
              <div>
                <p><strong>VP Data & Analytics:</strong> Sarah Johnson</p>
                <p><strong>VP Engineering:</strong> David Chen</p>
                <p><strong>VP Marketing:</strong> Lisa Rodriguez</p>
                <p><strong>VP Business Development:</strong> Michael Kim</p>
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
          <h2 className="text-3xl font-bold text-black mb-6">Zuora Buyer Group Intelligence</h2>
          
          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold text-black mb-4">Strategic Context</h3>
            <p className="text-gray-700 mb-4">
              Zuora operates in the competitive SaaS market, where subscription business models and revenue 
              optimization are critical for success. Their growth is driven by customer acquisition, retention, 
              and subscription revenue optimization, creating urgent need for advanced analytics and optimization solutions.
            </p>
            <p className="text-gray-700">
              <strong>Opportunity:</strong> Market consolidation and subscription economy growth make advanced 
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
                    <BuyerGroupMemberCard key={index} member={member} companySlug="zuora" />
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
                    <BuyerGroupMemberCard key={index} member={member} companySlug="zuora" />
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
                    <BuyerGroupMemberCard key={index} member={member} companySlug="zuora" />
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
                    <BuyerGroupMemberCard key={index} member={member} companySlug="zuora" />
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
