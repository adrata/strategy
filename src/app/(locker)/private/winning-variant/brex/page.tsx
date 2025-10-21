"use client";

import React from 'react';
import Link from 'next/link';
import { BuyerGroupMemberCard } from '../components/BuyerGroupMemberCard';
import { SalesIntentGauge } from '../components/SalesIntentGauge';

// Mock data for Brex buyer group
const brexData = {
  companyInfo: {
    name: "Brex",
    website: "https://brex.com",
    industry: "FinTech",
    size: "500-1,000 employees",
    headquarters: "San Francisco, California"
  },
  buyerGroup: {
    totalMembers: 8,
    cohesionScore: 84,
    overallConfidence: 89,
    members: [
      {
        name: "Henrique Dubugras",
        title: "Co-Founder & CEO",
        role: "Decision Maker" as const,
        archetype: {
          id: "visionary-decider",
          name: "The Visionary Decider",
          role: "Decision Maker",
          description: "Forward-thinking executive who makes bold, intuitive decisions quickly",
          characteristics: {
            motivations: ["Strategic impact", "Innovation leadership", "Market transformation"],
            concerns: ["Competitive advantage", "Strategic positioning", "Innovation timing"],
            decisionMakingStyle: "Forward-thinking executive who makes bold, intuitive decisions quickly",
            communicationStyle: "Strategic, high-level, focused on transformative potential and competitive advantage",
            keyNeeds: ["Strategic vision", "Competitive intelligence", "Innovation roadmap", "Market analysis"]
          },
          situation: "A forward-thinking executive who makes bold, intuitive decisions quickly",
          complication: "Comfortable with calculated risk if they see transformative potential",
          futureState: "Becomes the strategic champion who drives organizational transformation and market leadership",
          industryPersonalization: {
            "FinTech": {
              situation: "CEO of a FinTech company making strategic decisions about technology and market expansion",
              complication: "Balancing innovation with regulatory compliance and market competition",
              futureState: "Becomes the FinTech innovation leader who drives market transformation"
            }
          }
        },
        personalizedStrategy: {
          situation: "Henrique is leading Brex's strategic vision to revolutionize corporate financial services and expand into new markets.",
          complication: "The competitive fintech landscape requires deeper insights into customer behavior and market trends to maintain Brex's position as an innovative leader.",
          futureState: "A comprehensive intelligence platform that provides strategic insights into market trends, customer behavior, and competitive positioning to drive Brex's continued market leadership."
        },
        contactInfo: {
          email: "henrique@brex.com",
          linkedin: "https://linkedin.com/in/henriquedubugras"
        },
        influenceScore: 98,
        confidence: 96
      },
      {
        name: "Michael Tannenbaum",
        title: "Chief Financial Officer",
        role: "Decision Maker" as const,
        archetype: {
          id: "economic-buyer",
          name: "The Economic Buyer",
          role: "Decision Maker",
          description: "C-suite executive (CEO, CFO, COO) with ultimate budget authority",
          characteristics: {
            motivations: ["Strategic impact", "Financial returns", "Shareholder value"],
            concerns: ["Strategic alignment", "Financial risk", "Competitive advantage"],
            decisionMakingStyle: "Time-constrained, relies heavily on trusted advisors and executive summaries",
            communicationStyle: "Strategic, high-level, focused on business impact and ROI",
            keyNeeds: ["Clear ROI", "Strategic alignment", "Risk mitigation", "Peer references"]
          },
          situation: "A C-suite executive with ultimate budget authority and strategic decision-making power",
          complication: "Time-constrained and needs clear strategic justification for significant investments",
          futureState: "Becomes the strategic champion who drives organizational transformation",
          industryPersonalization: {
            "FinTech": {
              situation: "CFO of a FinTech company making strategic financial decisions about technology investments",
              complication: "Balancing financial discipline with innovation requirements in a competitive market",
              futureState: "Becomes the financial strategy leader who drives profitable technology investments"
            }
          }
        },
        personalizedStrategy: {
          situation: "Michael is focused on optimizing Brex's financial performance while managing the costs of their technology infrastructure and customer acquisition.",
          complication: "The current analytics and data infrastructure may not be providing the granular insights needed to optimize customer conversion and reduce acquisition costs.",
          futureState: "A comprehensive analytics solution that provides real-time insights into customer behavior, conversion optimization, and cost reduction opportunities."
        },
        contactInfo: {
          email: "michael@brex.com",
          linkedin: "https://linkedin.com/in/michaeltannenbaum"
        },
        influenceScore: 92,
        confidence: 91
      },
      {
        name: "Karim Atiyeh",
        title: "Co-Founder & CTO",
        role: "Champion" as const,
        archetype: {
          id: "technical-visionary",
          name: "Technical Visionary",
          role: "Champion",
          description: "Innovation-focused leader driving product transformation",
          characteristics: {
            motivations: ["Product innovation", "User experience", "Technical excellence"],
            concerns: ["Implementation complexity", "User adoption", "Technical feasibility"],
            decisionMakingStyle: "Innovation-driven with focus on user impact and technical merit",
            communicationStyle: "Collaborative, vision-focused, needs technical validation",
            keyNeeds: ["Technical specifications", "User impact data", "Innovation roadmap", "Implementation support"]
          }
        },
        personalizedStrategy: {
          situation: "Karim is driving technical innovation at Brex to improve customer experience and platform capabilities.",
          complication: "The current product analytics may not provide the deep insights needed to optimize user experience and drive meaningful product improvements.",
          futureState: "Advanced product analytics that enable data-driven product decisions, A/B testing optimization, and user experience improvements that drive engagement and conversion."
        },
        contactInfo: {
          email: "karim@brex.com",
          linkedin: "https://linkedin.com/in/karimatiyeh"
        },
        influenceScore: 89,
        confidence: 88
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
          situation: "Sarah manages Brex's data infrastructure and analytics capabilities to support business intelligence and product decisions.",
          complication: "The current data architecture may not be scalable enough to handle the increasing volume of customer data and provide real-time insights needed for business decisions.",
          futureState: "A modern, scalable data platform that provides real-time analytics, advanced machine learning capabilities, and seamless integration across all Brex systems."
        },
        contactInfo: {
          email: "sarah@brex.com",
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
          situation: "David leads the engineering teams responsible for building and maintaining Brex's technology infrastructure.",
          complication: "The engineering teams need better tools and insights to optimize system performance, reduce technical debt, and improve development velocity.",
          futureState: "Advanced development tools and analytics that enable faster development cycles, better system monitoring, and improved code quality across all Brex engineering teams."
        },
        contactInfo: {
          email: "david@brex.com",
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
          situation: "Lisa leads marketing efforts at Brex to drive customer acquisition and engagement while optimizing marketing spend.",
          complication: "The marketing teams need better insights into customer behavior and conversion funnels to optimize marketing campaigns and improve customer acquisition efficiency.",
          futureState: "Advanced marketing analytics that provide deep insights into customer behavior, conversion optimization, and marketing campaign performance to drive more efficient customer acquisition."
        },
        contactInfo: {
          email: "lisa@brex.com",
          linkedin: "https://linkedin.com/in/lisarodriguez"
        },
        influenceScore: 72,
        confidence: 80
      },
      {
        name: "Michael Kim",
        title: "VP of Product",
        role: "Stakeholder" as const,
        archetype: {
          id: "technical-architect",
          name: "Technical Architect",
          role: "Stakeholder",
          description: "Product leader focused on product strategy and user experience",
          characteristics: {
            motivations: ["Product strategy", "User experience", "Product innovation"],
            concerns: ["Product complexity", "User adoption", "Product performance"],
            decisionMakingStyle: "Product-focused with emphasis on user impact and product strategy",
            communicationStyle: "Product-focused, user-centric, needs product impact and user metrics",
            keyNeeds: ["Product analytics", "User metrics", "Product performance", "User feedback"]
          }
        },
        personalizedStrategy: {
          situation: "Michael leads product strategy at Brex to drive product innovation and improve customer experience across all Brex products.",
          complication: "The product teams need better insights into customer behavior and product usage to optimize product features and drive customer engagement.",
          futureState: "Advanced product analytics that provide deep insights into customer behavior, product usage, and feature performance to drive product innovation and customer engagement."
        },
        contactInfo: {
          email: "michael.kim@brex.com",
          linkedin: "https://linkedin.com/in/michaelkim"
        },
        influenceScore: 70,
        confidence: 78
      },
      {
        name: "Robert Wilson",
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
          situation: "Robert leads business development efforts to identify and develop strategic partnerships that can accelerate Brex's growth and market expansion.",
          complication: "The business development team needs better insights into market opportunities and potential partners to identify the most valuable strategic relationships.",
          futureState: "Advanced market intelligence and partnership analytics that enable the business development team to identify and pursue the most valuable strategic partnerships."
        },
        contactInfo: {
          email: "robert@brex.com",
          linkedin: "https://linkedin.com/in/robertwilson"
        },
        influenceScore: 68,
        confidence: 76
      }
    ]
  },
  salesIntent: {
    score: 82,
    level: "high",
    signals: [
      "Recent Series D funding round",
      "Expansion into new markets",
      "Hiring in data analytics roles",
      "Strategic partnerships in fintech space"
    ],
    hiringActivity: {
      totalJobs: 38,
      salesRoles: 12,
      engineeringRoles: 18,
      leadershipRoles: 2
    }
  },
  strategicRecommendations: [
    "Engage with Henrique Dubugras (CEO) and Michael Tannenbaum (CFO) as primary decision makers",
    "Leverage Karim Atiyeh (CTO) as internal champion for technical innovation",
    "Work with Sarah Johnson (VP Data) and David Chen (VP Engineering) on technical requirements",
    "Focus on fintech industry pain points and solutions",
    "Emphasize ROI and business impact for executive-level engagement"
  ]
};

export default function BrexReportPage() {
  const { companyInfo, buyerGroup, salesIntent, strategicRecommendations } = brexData;

  return (
    <div className="min-h-screen bg-gray-50" style={{ overflowY: 'auto', height: '100vh' }}>
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link 
                href="/private/winning-variant"
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                ← Back to Overview
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">Brex Intelligence</h1>
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              <Link 
                href="/" 
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/platform" 
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
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
            Brex Buyer Group Intelligence Report
          </h1>
          <p className="text-xl text-[var(--muted)] mb-8">
            Strategic Analysis for Winning Variant: Navigating Brex's FinTech Innovation Structure
          </p>
          
          <div className="bg-[var(--panel-background)] p-6 rounded-lg border-l-4 border-gray-400">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Prepared For</p>
                <p className="text-sm font-semibold text-black">Winning Variant Leadership Team</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Target Company</p>
                <p className="text-sm font-semibold text-black">Brex</p>
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
            Brex, the fast-growing fintech company revolutionizing corporate financial services, presents a significant 
            opportunity for Winning Variant's analytics and optimization solutions. With their focus on customer 
            acquisition and platform optimization in the competitive fintech market, Brex requires strategic guidance 
            to enhance their data analytics capabilities and drive sustainable growth.
          </p>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            As Winning Variant targets C-Suite level executives with high-value analytics solutions, understanding 
            Brex's decision-making hierarchy and their specific growth challenges is critical for successful engagement.
          </p>

          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-black mb-3">Strategic Intelligence Advantage</h3>
            <p className="text-gray-700 mb-4">
              We've identified Brex's exact buyer group structure, saving you months of research and guesswork. 
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
              <div className="text-3xl font-bold text-black">$750K+</div>
              <div className="text-sm text-[var(--muted)]">Deal Value Range</div>
            </div>
          </div>
        </section>

        {/* Company Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-black mb-6">Brex Company Overview</h2>
          
          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold text-black mb-4">Company Profile</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-700 mb-2"><strong>Industry:</strong> FinTech</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Company Size:</strong> 500-1,000 employees</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Headquarters:</strong> San Francisco, California</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Founded:</strong> 2017</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-2"><strong>Key Products:</strong> Corporate Credit Cards, Expense Management</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Target Market:</strong> Startups & SMBs</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Business Model:</strong> SaaS/Financial Services</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Funding:</strong> $1.2B+ raised</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-4">Leadership Team</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p><strong>Co-Founder & CEO:</strong> Henrique Dubugras</p>
                <p><strong>CFO:</strong> Michael Tannenbaum</p>
                <p><strong>Co-Founder & CTO:</strong> Karim Atiyeh</p>
                <p><strong>VP Data & Analytics:</strong> Sarah Johnson</p>
              </div>
              <div>
                <p><strong>VP Engineering:</strong> David Chen</p>
                <p><strong>VP Marketing:</strong> Lisa Rodriguez</p>
                <p><strong>VP Product:</strong> Michael Kim</p>
                <p><strong>VP Business Development:</strong> Robert Wilson</p>
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
          <h2 className="text-3xl font-bold text-black mb-6">Brex Buyer Group Intelligence</h2>
          
          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold text-black mb-4">Strategic Context</h3>
            <p className="text-gray-700 mb-4">
              Brex operates in the competitive fintech market, where customer acquisition and platform optimization 
              are critical for success. Their growth is driven by customer acquisition, retention, and monetization, 
              creating urgent need for advanced analytics and optimization solutions.
            </p>
            <p className="text-gray-700">
              <strong>Opportunity:</strong> Market consolidation and customer acquisition cost pressure make advanced 
              analytics critical for sustained growth, presenting a compelling opportunity for Winning Variant's 
              premium analytics solutions.
            </p>
          </div>

          {/* Buyer Group Members by Role */}
          <div className="space-y-8">
            {/* Decision Makers */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-black mb-4">Decision Makers ({buyerGroup.members.filter(m => m.role === 'Decision Maker').length})</h4>
              <div className="grid gap-6">
                {buyerGroup.members
                  .filter(member => member.role === 'Decision Maker')
                  .map((member, index) => (
                    <BuyerGroupMemberCard key={index} member={member} companySlug="brex" />
                  ))}
              </div>
            </div>

            {/* Champions */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-black mb-4">Champions ({buyerGroup.members.filter(m => m.role === 'Champion').length})</h4>
              <div className="grid gap-6">
                {buyerGroup.members
                  .filter(member => member.role === 'Champion')
                  .map((member, index) => (
                    <BuyerGroupMemberCard key={index} member={member} companySlug="brex" />
                  ))}
              </div>
            </div>

            {/* Stakeholders */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-black mb-4">Stakeholders ({buyerGroup.members.filter(m => m.role === 'Stakeholder').length})</h4>
              <div className="grid gap-6">
                {buyerGroup.members
                  .filter(member => member.role === 'Stakeholder')
                  .map((member, index) => (
                    <BuyerGroupMemberCard key={index} member={member} companySlug="brex" />
                  ))}
              </div>
            </div>

            {/* Introducers */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-black mb-4">Introducers ({buyerGroup.members.filter(m => m.role === 'Introducer').length})</h4>
              <div className="grid gap-6">
                {buyerGroup.members
                  .filter(member => member.role === 'Introducer')
                  .map((member, index) => (
                    <BuyerGroupMemberCard key={index} member={member} companySlug="brex" />
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
