"use client";

import React from 'react';
import Link from 'next/link';
import { BuyerGroupMemberCard } from '../components/BuyerGroupMemberCard';
import { ArchetypeBadge } from '../components/ArchetypeBadge';
import { SalesIntentGauge } from '../components/SalesIntentGauge';

// Mock data - in production this would be loaded from the discovery results
const matchGroupData = {
  companyInfo: {
    name: "Match Group",
    website: "https://mtch.com",
    industry: "Online Dating / Technology",
    size: "2,000+ employees",
    headquarters: "Dallas, Texas"
  },
  buyerGroup: {
    totalMembers: 8,
    cohesionScore: 87,
    overallConfidence: 92,
    members: [
      {
        name: "Gary Swidler",
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
            "Technology": {
              situation: "CEO making strategic technology decisions that impact competitive advantage",
              complication: "Balancing technology innovation with business strategy and financial returns",
              futureState: "Becomes the technology strategy champion who drives digital transformation"
            }
          }
        },
        personalizedStrategy: {
          situation: "Gary Swidler has been CFO at Match Group since 2018, overseeing a $2.8B revenue company with 3,000+ employees. He's under intense pressure from the board to prove ROI on their $5M+ annual AI/ML investments, especially after Match Group's stock dropped 15% last quarter due to increased competition from Bumble and Hinge.",
          complication: "Gary's data science team keeps showing him '95% model accuracy' for their matching algorithms, but he can't prove to the board that these AI improvements actually increased subscription revenue or reduced churn. The board is questioning whether to continue the $5M AI budget when they can't see the business impact.",
          futureState: "With Winning Variant's Snowflake-native experimentation platform, Gary can prove that their AI matching algorithms increased subscription conversions by 12% ($18M in additional revenue) and reduced churn by 8% ($12M in retained revenue) - transforming the narrative from 'our AI is accurate' to 'our AI drives $30M in revenue impact annually.'"
        },
        contactInfo: {
          email: "gary.swidler@match.com",
          linkedin: "https://linkedin.com/in/garyswidler"
        },
        influenceScore: 95,
        confidence: 94,
        flightRisk: {
          score: 10,
          category: "ROOTED",
          reasoning: "C-level executive with 6+ years tenure, strong equity position, recently promoted to CFO role"
        }
      },
      {
        name: "Sharmistha Dubey",
        title: "Chief Product Officer",
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
          situation: "Sharmistha Dubey joined Match Group as CPO in 2021 after 8 years at Google, where she led product for YouTube. She's now responsible for product strategy across Match Group's $2.8B portfolio including Tinder (60M users), Match.com (25M users), and Hinge (20M users). She's under pressure to increase user engagement after Tinder's daily active users dropped 3% last quarter.",
          complication: "Sharmistha's product team can see user behavior data but can't prove that their AI-powered features (like Tinder's Smart Photos or Hinge's Most Compatible) actually increase matches or subscription conversions. She needs to show the board that product investments in AI features drive measurable business outcomes, not just user satisfaction scores.",
          futureState: "Winning Variant's experimentation platform gives Sharmistha the tools to prove that AI-powered features increase matches by 15% and subscription conversions by 8% - showing the board that product investments in AI directly drive revenue growth and user engagement across all Match Group platforms."
        },
        contactInfo: {
          email: "sharmistha.dubey@match.com",
          linkedin: "https://linkedin.com/in/sharmisthadubey"
        },
        influenceScore: 88,
        confidence: 91,
        flightRisk: {
          score: 25,
          category: "STABLE",
          reasoning: "Recently joined from Google, good compensation package, but may seek opportunities if product metrics don't improve"
        }
      },
      {
        name: "Bernard Kim",
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
          situation: "Bernard is leading Match Group's strategic vision to maintain market leadership in online dating while expanding into new markets and technologies.",
          complication: "The competitive landscape requires deeper insights into user behavior and market trends to maintain Match Group's position as the industry leader.",
          futureState: "A comprehensive intelligence platform that provides strategic insights into market trends, user behavior, and competitive positioning to drive Match Group's continued market leadership."
        },
        contactInfo: {
          email: "bernard.kim@match.com",
          linkedin: "https://linkedin.com/in/bernardkim"
        },
        influenceScore: 98,
        confidence: 96
      },
      {
        name: "Sarah Johnson",
        title: "VP of Data & Analytics",
        role: "Stakeholder" as const,
        archetype: {
          id: "technical-architect",
          name: "The Technical Architect",
          role: "Stakeholder",
          description: "CTO, IT Director, or Senior Engineer evaluating technical fit",
          characteristics: {
            motivations: ["Technical excellence", "System performance", "Architecture quality"],
            concerns: ["Technical complexity", "Data security", "Integration challenges"],
            decisionMakingStyle: "Technical evaluation with focus on system architecture and data quality",
            communicationStyle: "Technical, detail-oriented, needs technical specifications and architecture details",
            keyNeeds: ["Technical documentation", "Security requirements", "Integration specs", "Performance metrics"]
          },
          situation: "A senior technical leader responsible for evaluating and implementing technology solutions",
          complication: "Must balance technical requirements with business needs while ensuring system reliability",
          futureState: "Becomes the technical champion who ensures successful implementation and integration",
          industryPersonalization: {
            "Technology": {
              situation: "Leading technical architecture decisions for a technology company",
              complication: "Ensuring technical solutions align with business strategy and scalability requirements",
              futureState: "Becomes the technical strategy leader who drives successful technology implementations"
            }
          }
        },
        personalizedStrategy: {
          situation: "Sarah manages Match Group's data infrastructure and analytics capabilities across all platforms to support business intelligence and product decisions.",
          complication: "The current data architecture may not be scalable enough to handle the increasing volume of user data and provide real-time insights needed for business decisions.",
          futureState: "A modern, scalable data platform that provides real-time analytics, advanced machine learning capabilities, and seamless integration across all Match Group properties."
        },
        contactInfo: {
          email: "sarah.johnson@match.com",
          linkedin: "https://linkedin.com/in/sarahjohnson"
        },
        influenceScore: 75,
        confidence: 89
      },
      {
        name: "Michael Chen",
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
          situation: "Michael leads the engineering teams responsible for building and maintaining Match Group's technology infrastructure across all platforms.",
          complication: "The engineering teams need better tools and insights to optimize system performance, reduce technical debt, and improve development velocity.",
          futureState: "Advanced development tools and analytics that enable faster development cycles, better system monitoring, and improved code quality across all Match Group engineering teams."
        },
        contactInfo: {
          email: "michael.chen@match.com",
          linkedin: "https://linkedin.com/in/michaelchen"
        },
        influenceScore: 72,
        confidence: 87
      },
      {
        name: "David Wilson",
        title: "VP of Marketing",
        role: "Stakeholder" as const,
        archetype: {
          id: "end-user-representative",
          name: "End User Representative",
          role: "Stakeholder",
          description: "Marketing leader focused on user acquisition and engagement",
          characteristics: {
            motivations: ["User acquisition", "Engagement metrics", "Marketing ROI"],
            concerns: ["User experience", "Conversion rates", "Marketing efficiency"],
            decisionMakingStyle: "User-focused with emphasis on marketing metrics and user engagement",
            communicationStyle: "Marketing-focused, user-centric, needs user impact and marketing metrics",
            keyNeeds: ["User analytics", "Marketing metrics", "Conversion data", "Engagement insights"]
          }
        },
        personalizedStrategy: {
          situation: "David leads marketing efforts across Match Group's portfolio to drive user acquisition and engagement while optimizing marketing spend.",
          complication: "The marketing teams need better insights into user behavior and conversion funnels to optimize marketing campaigns and improve user acquisition efficiency.",
          futureState: "Advanced marketing analytics that provide deep insights into user behavior, conversion optimization, and marketing campaign performance to drive more efficient user acquisition."
        },
        contactInfo: {
          email: "david.wilson@match.com",
          linkedin: "https://linkedin.com/in/davidwilson"
        },
        influenceScore: 68,
        confidence: 85
      },
      {
        name: "Lisa Rodriguez",
        title: "Chief Technology Officer",
        role: "Stakeholder" as const,
        archetype: {
          id: "technical-architect",
          name: "Technical Architect",
          role: "Stakeholder",
          description: "CTO responsible for overall technology strategy and architecture",
          characteristics: {
            motivations: ["Technology strategy", "Innovation", "Technical excellence"],
            concerns: ["Technology alignment", "Implementation complexity", "Technical debt"],
            decisionMakingStyle: "Strategic technical evaluation with focus on long-term technology vision",
            communicationStyle: "Strategic technical, needs technology roadmap and strategic alignment",
            keyNeeds: ["Technology strategy", "Innovation roadmap", "Technical specifications", "Strategic alignment"]
          }
        },
        personalizedStrategy: {
          situation: "Lisa is responsible for Match Group's overall technology strategy and ensuring the technology infrastructure supports the company's growth and innovation goals.",
          complication: "The technology infrastructure needs to be modernized to support Match Group's growth plans and provide the foundation for future innovation.",
          futureState: "A modern, scalable technology platform that supports Match Group's growth, enables innovation, and provides the foundation for future product development."
        },
        contactInfo: {
          email: "lisa.rodriguez@match.com",
          linkedin: "https://linkedin.com/in/lisarodriguez"
        },
        influenceScore: 82,
        confidence: 88
      },
      {
        name: "Robert Kim",
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
          situation: "Robert leads business development efforts to identify and develop strategic partnerships that can accelerate Match Group's growth and market expansion.",
          complication: "The business development team needs better insights into market opportunities and potential partners to identify the most valuable strategic relationships.",
          futureState: "Advanced market intelligence and partnership analytics that enable the business development team to identify and pursue the most valuable strategic partnerships."
        },
        contactInfo: {
          email: "robert.kim@match.com",
          linkedin: "https://linkedin.com/in/robertkim"
        },
        influenceScore: 65,
        confidence: 83
      }
    ]
  },
  salesIntent: {
    score: 78,
    level: "high",
    signals: [
      "Recent hiring in data analytics roles",
      "Expansion of engineering teams",
      "Increased focus on user experience optimization",
      "Strategic partnerships in technology space"
    ],
    hiringActivity: {
      totalJobs: 45,
      salesRoles: 8,
      engineeringRoles: 22,
      leadershipRoles: 3
    }
  },
  archetypeDistribution: {
    "economic-buyer": 1,
    "technical-visionary": 1,
    "visionary-decider": 1,
    "technical-architect": 3,
    "end-user-representative": 1,
    "internal-connector": 1
  },
  strategicRecommendations: [
    "Engage with Bernard Kim (CEO) and Gary Swidler (CFO) as primary decision makers",
    "Leverage Sharmistha Dubey (CPO) as internal champion for product innovation",
    "Work with Sarah Johnson (VP Data) and Lisa Rodriguez (CTO) on technical requirements",
    "Focus on ROI and business impact for executive-level engagement",
    "Emphasize user experience and conversion optimization for product team"
  ]
};

export default function MatchGroupReportPage() {
  const { companyInfo, buyerGroup, salesIntent, strategicRecommendations } = matchGroupData;

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
              <h1 className="text-lg font-semibold text-gray-900">Match Group Intelligence</h1>
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
            Match Group Buyer Group Intelligence Report
          </h1>
          <p className="text-xl text-[var(--muted)] mb-8">
            Strategic Analysis for Winning Variant: Navigating Match Group's Complex Decision-Making Structure
          </p>
          
          <div className="bg-[var(--panel-background)] p-6 rounded-lg border-l-4 border-gray-400">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Prepared For</p>
                <p className="text-sm font-semibold text-black">Winning Variant Leadership Team</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Target Company</p>
                <p className="text-sm font-semibold text-black">Match Group</p>
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
            Match Group, the global leader in online dating with brands including Match.com, Tinder, and Hinge, 
            presents a significant opportunity for Winning Variant's analytics and optimization solutions. With 
            their focus on user engagement and conversion optimization across multiple platforms, Match Group 
            requires strategic guidance to enhance their data analytics capabilities and drive sustainable growth 
            in the competitive online dating market.
          </p>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            As Winning Variant targets C-Suite level executives with high-value analytics solutions, understanding 
            Match Group's complex decision-making hierarchy and their specific growth challenges is critical for 
            successful engagement.
          </p>

          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-black mb-3">Strategic Intelligence Advantage</h3>
            <p className="text-gray-700 mb-4">
              We've identified Match Group's exact buyer group structure, saving you months of research and guesswork. 
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
              <div className="text-3xl font-bold text-black">$500K+</div>
              <div className="text-sm text-[var(--muted)]">Deal Value Range</div>
            </div>
          </div>
        </section>

        {/* Company Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-black mb-6">Match Group Company Overview</h2>
          
          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold text-black mb-4">Company Profile</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-700 mb-2"><strong>Industry:</strong> Online Dating & Technology</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Company Size:</strong> 2,000+ employees</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Headquarters:</strong> Dallas, Texas</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Founded:</strong> 1995</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-2"><strong>Key Brands:</strong> Match.com, Tinder, Hinge, OkCupid</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Target Market:</strong> Global Online Dating</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Business Model:</strong> Freemium SaaS</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Revenue:</strong> $3.2B+ annually</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-4">Leadership Team</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p><strong>CEO:</strong> Bernard Kim</p>
                <p><strong>CFO:</strong> Gary Swidler</p>
                <p><strong>CPO:</strong> Sharmistha Dubey</p>
                <p><strong>CTO:</strong> Lisa Rodriguez</p>
              </div>
              <div>
                <p><strong>VP Data & Analytics:</strong> Sarah Johnson</p>
                <p><strong>VP Engineering:</strong> Michael Chen</p>
                <p><strong>VP Marketing:</strong> David Wilson</p>
                <p><strong>VP Business Development:</strong> Robert Kim</p>
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
          <h2 className="text-3xl font-bold text-black mb-6">Match Group Buyer Group Intelligence</h2>
          
          <div className="bg-[var(--panel-background)] border border-[var(--border)] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold text-black mb-4">Strategic Context</h3>
            <p className="text-gray-700 mb-4">
              Match Group operates in the competitive online dating market, where user engagement and conversion 
              optimization are critical for success. Their growth is driven by user acquisition, retention, and 
              monetization across multiple platforms, creating urgent need for advanced analytics and optimization 
              solutions.
            </p>
            <p className="text-gray-700">
              <strong>Opportunity:</strong> Market consolidation and user acquisition cost pressure make advanced 
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
                    <BuyerGroupMemberCard key={index} member={member} companySlug="match-group" />
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
                    <BuyerGroupMemberCard key={index} member={member} companySlug="match-group" />
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
                    <BuyerGroupMemberCard key={index} member={member} companySlug="match-group" />
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
                    <BuyerGroupMemberCard key={index} member={member} companySlug="match-group" />
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
