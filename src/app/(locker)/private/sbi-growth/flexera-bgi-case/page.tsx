"use client";

import React from 'react';
// Updated for deployment fix
import PasswordProtection from '../PasswordProtection';
import Link from 'next/link';

export default function FlexeraBusinessCasePage() {
  return (
    <PasswordProtection correctPassword="SBI-Flexera-2025">
      <div className="min-h-screen bg-white" style={{ overflowY: 'auto', height: '100vh' }}>
        {/* Header */}
        <header className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-semibold text-gray-900">SBI Growth Adrata</h1>
              
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
        <main className="max-w-4xl mx-auto px-6 py-12">
          {/* Document Header */}
          <div className="border-b-2 border-black pb-8 mb-12">
            <h1 className="text-4xl font-bold text-black mb-4 leading-tight">
              Flexera Buyer Group Intelligence Report
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Strategic Analysis for SBI Growth: Navigating Flexera's Complex Decision-Making Structure
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-400">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prepared For</p>
                  <p className="text-sm font-semibold text-black">SBI Growth Leadership Team</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Target Company</p>
                  <p className="text-sm font-semibold text-black">Flexera Software</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prepared By</p>
                  <p className="text-sm font-semibold text-black">Adrata Sales Intelligence Team</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Strategic Focus</p>
                  <p className="text-sm font-semibold text-black">CRO/CFO Level Engagement</p>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Executive Summary</h2>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Flexera, a global leader in software asset management and IT asset management solutions, presents a significant opportunity for SBI Growth's premium go-to-market consulting services. With their focus on helping organizations maximize technology investment value, Flexera requires strategic guidance to optimize their revenue operations, enhance their market positioning, and drive sustainable growth in the competitive ITAM space.
            </p>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              As SBI Growth targets CRO/CFO level executives with expensive, high-value consulting services, understanding Flexera's complex decision-making hierarchy and their specific growth challenges is critical for successful engagement.
            </p>

            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-black mb-3">Strategic Intelligence Advantage</h3>
              <p className="text-gray-700 mb-4">
                We've identified Flexera's exact buyer group structure, saving you months of research and guesswork. Our intelligence reveals the specific decision-makers, their influence patterns, and the precise engagement sequence needed for successful deal closure.
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
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-3xl font-bold text-black">11</div>
                <div className="text-sm text-gray-600">Buyer Group Size</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-3xl font-bold text-black">2</div>
                <div className="text-sm text-gray-600">Decision Makers</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-3xl font-bold text-black">5</div>
                <div className="text-sm text-gray-600">Champions</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-3xl font-bold text-black">$500K+</div>
                <div className="text-sm text-gray-600">Deal Value Range</div>
              </div>
            </div>
          </section>

          {/* Flexera Company Overview */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Flexera Company Overview</h2>
            
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Company Profile</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-700 mb-2"><strong>Industry:</strong> IT Management & Software Asset Management</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Company Size:</strong> 1,000-5,000 employees</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Headquarters:</strong> Itasca, Illinois</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Founded:</strong> 2008 (through merger)</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 mb-2"><strong>Key Products:</strong> Flexera One, Software Asset Management</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Target Market:</strong> Enterprise IT Organizations</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Business Model:</strong> SaaS/Software Licensing</p>
                  <p className="text-sm text-gray-700 mb-2"><strong>Competitors:</strong> ServiceNow, Snow Software, IBM</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-black mb-4">Leadership Team</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p><strong>CEO:</strong> Jim Ryan</p>
                  <p><strong>CFO:</strong> Josh Fraser</p>
                  <p><strong>President:</strong> Mike Jerich</p>
                  <p><strong>Chief Growth Officer:</strong> Eric Free</p>
                </div>
                <div>
                  <p><strong>VP Global Sales:</strong> Shinie Shaw</p>
                  <p><strong>VP Marketing:</strong> Michael Beaver</p>
                  <p><strong>VP Operations:</strong> Chris Anderson</p>
                  <p><strong>SVP Customer Experience:</strong> Barbara Boyer</p>
                  <p><strong>Chief People Officer:</strong> EL Lages</p>
                </div>
              </div>
            </div>
          </section>

          {/* Buyer Group Analysis */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Flexera Buyer Group Intelligence</h2>
            
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Strategic Context</h3>
              <p className="text-gray-700 mb-4">
                Flexera operates in the complex IT Asset Management (ITAM) market, where software licensing costs consume 15-30% of IT budgets. 
                Their growth is constrained by market saturation in traditional ITAM, creating urgent need for strategic guidance to expand into 
                adjacent markets (cloud governance, SaaS management) and optimize their go-to-market approach.
              </p>
              <p className="text-gray-700">
                <strong>Opportunity:</strong> Market consolidation and commoditization pressure make strategic differentiation critical for sustained growth, 
                presenting a compelling opportunity for SBI Growth's premium consulting services.
              </p>
            </div>

            <div className="space-y-8">
              {/* Decision Makers */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-4">Decision Makers (2)</h4>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-black pl-4">
                    <h5 className="font-semibold text-black text-lg">Jim Ryan (CEO)</h5>
                    <p className="text-sm text-gray-600 mb-3">Ultimate decision authority for strategic initiatives</p>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p><strong>Pain Points:</strong> Growth plateaued in core ITAM market. Needs expansion into cloud governance and SaaS management.</p>
                      <p><strong>Strategic Priorities:</strong> Market expansion, competitive differentiation, revenue diversification.</p>
                      <p><strong>Engagement Approach:</strong> Board-level strategic presentation on market opportunity analysis and growth acceleration.</p>
                      <p><strong>Decision Criteria:</strong> Strategic fit, market opportunity size, competitive advantage, execution feasibility.</p>
                    </div>
                  </div>

                  <div className="border-l-4 border-gray-600 pl-4">
                    <h5 className="font-semibold text-black text-lg">Josh Fraser (CFO)</h5>
                    <p className="text-sm text-gray-600 mb-3">Financial gatekeeper and ROI validator</p>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p><strong>Pain Points:</strong> Pressure to optimize costs while funding growth. ITAM commoditization squeezing margins.</p>
                      <p><strong>Strategic Priorities:</strong> Cost optimization, margin improvement, predictable revenue growth.</p>
                      <p><strong>Engagement Approach:</strong> Detailed financial modeling, ROI projections, cost-benefit analysis.</p>
                      <p><strong>Decision Criteria:</strong> Clear ROI, cost reduction potential, revenue impact, financial risk assessment.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Champions */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-4">Champions (5)</h4>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h5 className="font-semibold text-black">Cathleen Neibch (Sr Manager Rev Ops)</h5>
                    <p className="text-sm text-gray-600 mb-2">Primary champion with 7 years tenure and direct RevOps alignment</p>
                    <div className="text-xs text-gray-500">
                      <p><strong>Champion Potential:</strong> Very High - Perfect role alignment with SBI's RevOps GTM consulting focus, 7 years tenure</p>
                      <p><strong>Key Motivations:</strong> RevOps optimization, GTM efficiency, process improvement, strategic growth acceleration</p>
                      <p><strong>Engagement Strategy:</strong> Direct RevOps consulting value proposition, GTM process optimization</p>
                      <p><strong>Strategic Advantage:</strong> Most senior RevOps person on staff, positioned to influence C-Suite decisions</p>
                      <p><strong>Risk Assessment:</strong> Assess internal ability to drive deal on intro call. If not a driver, leverage for intros to other champions</p>
                    </div>
                  </div>

                  <div className="border-l-4 border-gray-500 pl-4">
                    <h5 className="font-semibold text-black">Eric Free (Chief Growth Officer)</h5>
                    <p className="text-sm text-gray-600 mb-2">Growth strategy champion and market expansion advocate</p>
                    <div className="text-xs text-gray-500">
                      <p><strong>Champion Potential:</strong> High - Directly responsible for growth initiatives and market expansion</p>
                      <p><strong>Key Motivations:</strong> Market opportunity identification, competitive advantage, growth acceleration</p>
                      <p><strong>Engagement Strategy:</strong> Market analysis, competitive intelligence, growth opportunity mapping</p>
                    </div>
                  </div>

                  <div className="border-l-4 border-gray-500 pl-4">
                    <h5 className="font-semibold text-black">Shinie Shaw (VP Global Sales)</h5>
                    <p className="text-sm text-gray-600 mb-2">Sales process champion and revenue impact advocate</p>
                    <div className="text-xs text-gray-500">
                      <p><strong>Champion Potential:</strong> High - Directly impacted by go-to-market improvements</p>
                      <p><strong>Key Motivations:</strong> Sales efficiency, deal velocity, revenue growth, competitive positioning</p>
                      <p><strong>Engagement Strategy:</strong> Sales process optimization, competitive analysis, revenue impact metrics</p>
                    </div>
                  </div>

                  <div className="border-l-4 border-gray-500 pl-4">
                    <h5 className="font-semibold text-black">Michael Beaver (VP Marketing)</h5>
                    <p className="text-sm text-gray-600 mb-2">Marketing strategy champion and brand positioning advocate</p>
                    <div className="text-xs text-gray-500">
                      <p><strong>Champion Potential:</strong> High - Directly responsible for market positioning and growth initiatives</p>
                      <p><strong>Key Motivations:</strong> Brand differentiation, market share growth, lead generation, competitive advantage</p>
                      <p><strong>Engagement Strategy:</strong> Market analysis, competitive positioning, brand strategy, growth acceleration</p>
                    </div>
                  </div>

                  <div className="border-l-4 border-gray-500 pl-4">
                    <h5 className="font-semibold text-black">Barbara Boyer (SVP Customer Experience)</h5>
                    <p className="text-sm text-gray-600 mb-2">Customer success champion and retention advocate</p>
                    <div className="text-xs text-gray-500">
                      <p><strong>Champion Potential:</strong> Medium - Focused on customer outcomes and satisfaction</p>
                      <p><strong>Key Motivations:</strong> Customer success, retention improvement, satisfaction metrics</p>
                      <p><strong>Engagement Strategy:</strong> Customer success stories, retention impact, satisfaction improvement</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stakeholders */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-4">Key Stakeholders (3)</h4>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-gray-400 pl-4">
                    <h5 className="font-semibold text-black">Mike Jerich (President)</h5>
                    <p className="text-sm text-gray-600">Operational execution and team alignment</p>
                    <p className="text-xs text-gray-500"><strong>Influence:</strong> Implementation feasibility and operational impact assessment</p>
                  </div>

                  <div className="border-l-4 border-gray-400 pl-4">
                    <h5 className="font-semibold text-black">EL Lages (Chief People Officer)</h5>
                    <p className="text-sm text-gray-600">Organizational change and team development</p>
                    <p className="text-xs text-gray-500"><strong>Influence:</strong> Change management and organizational readiness</p>
                  </div>

                  <div className="border-l-4 border-gray-400 pl-4">
                    <h5 className="font-semibold text-black">Thomas Charles Davis, Jr (Technology Operating Partner, Thoma Bravo)</h5>
                    <p className="text-sm text-gray-600">Strategic opener with VC/PE influence and direct buyer group access</p>
                    <p className="text-xs text-gray-500"><strong>Strategic Value:</strong> Primary investor relationship (Thoma Bravo purchased Flexera in 2008, reacquired controlling stake in 2020 for $2.85B with KKR as financier). Direct connection to Anthony Erickson (Head of Commercial Sales at SBI) provides warm introduction pathway to Flexera buyer group.</p>
                  </div>
                </div>
              </div>

              {/* Blockers */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-4">Definitive Blockers (4)</h4>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h5 className="font-semibold text-black">Jill DelGrosso (McNamara) (VP GTM Readiness & Programs)</h5>
                    <p className="text-sm text-gray-600 mb-2">Primary blocker with threat perception and territorial concerns</p>
                    <div className="text-sm text-gray-700">
                      <p><strong>Blocking Potential:</strong> Very High - Only 10 months tenure, perceives outside consultants as threat to her mandate</p>
                      <p><strong>Blocking Tactics:</strong> "We can do this ourselves, this is why I was hired" - internal capability claims, territorial protection</p>
                      <p><strong>Neutralization Strategy:</strong> Position SBI as complementary, emphasize partnership over replacement, address tenure insecurity</p>
                      <p><strong>Risk Assessment:</strong> High risk due to short tenure and territorial protection of strategic mandate</p>
                    </div>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4">
                    <h5 className="font-semibold text-black">Chris Anderson (VP Operations)</h5>
                    <p className="text-sm text-gray-600 mb-2">Operational efficiency gatekeeper and change resistance advocate</p>
                    <div className="text-sm text-gray-700">
                      <p><strong>Blocking Potential:</strong> High - Can block initiatives that disrupt current operations or require significant change</p>
                      <p><strong>Blocking Tactics:</strong> Operational risk concerns, implementation complexity, resource allocation challenges</p>
                      <p><strong>Neutralization Strategy:</strong> Phased implementation approach, operational impact mitigation, change management support</p>
                    </div>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4">
                    <h5 className="font-semibold text-black">Procurement & Legal Team</h5>
                    <p className="text-sm text-gray-600 mb-2">Vendor evaluation and contract negotiation gatekeepers</p>
                    <div className="text-sm text-gray-700">
                      <p><strong>Blocking Potential:</strong> High - Can delay or derail deals through extended evaluation processes</p>
                      <p><strong>Blocking Tactics:</strong> Extended RFP processes, competitive bidding requirements, contract complexity</p>
                      <p><strong>Neutralization Strategy:</strong> Early engagement, simplified contracting, reference customer validation</p>
                    </div>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4">
                    <h5 className="font-semibold text-black">Finance & Budget Committee</h5>
                    <p className="text-sm text-gray-600 mb-2">Budget allocation and financial approval authority</p>
                    <div className="text-sm text-gray-700">
                      <p><strong>Blocking Potential:</strong> High - Can block deals based on budget constraints or ROI concerns</p>
                      <p><strong>Blocking Tactics:</strong> Budget limitations, ROI skepticism, cost-benefit analysis requirements</p>
                      <p><strong>Neutralization Strategy:</strong> Detailed financial modeling, phased implementation, clear ROI demonstration</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Strategic Opener */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Strategic Opener Analysis</h2>
            
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Primary Strategic Opener</h3>
              <p className="text-gray-700 mb-4">
                The optimal entry point leverages the existing relationship between SBI Growth and Thoma Bravo, Flexera's primary investor, 
                providing the highest probability of successful buyer group access and deal acceleration. This bypasses traditional 
                vendor evaluation processes and provides immediate institutional credibility.
              </p>
              <p className="text-gray-700">
                <strong>Strategic Rationale:</strong> Investor-backed introductions carry significantly higher weight in enterprise sales, 
                particularly for premium consulting services where strategic alignment and institutional trust are paramount.
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-black mb-4">Thomas Charles Davis, Jr - Technology Operating Partner, Thoma Bravo</h4>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h5 className="font-semibold text-black mb-3">Strategic Context</h5>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• <strong>Investment History:</strong> Thoma Bravo purchased Flexera in 2008, reacquired controlling stake in 2020 for $2.85B</li>
                    <li>• <strong>Financial Structure:</strong> KKR serves as the financier for the 2020 acquisition</li>
                    <li>• <strong>Operating Role:</strong> Technology Operating Partner advising primarily on technology strategy</li>
                    <li>• <strong>Decision Influence:</strong> Direct access to Flexera's C-Suite and strategic decision-making process</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-black mb-3">Connection Pathway</h5>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• <strong>Direct Connection:</strong> Anthony Erickson, Head of Commercial Sales at SBI Growth</li>
                    <li>• <strong>Relationship Type:</strong> Existing business relationship with SBI Growth</li>
                    <li>• <strong>Introduction Value:</strong> Warm introduction with institutional credibility</li>
                    <li>• <strong>Strategic Alignment:</strong> SBI's blended consulting and technology deployment matches Thoma Bravo's tech focus</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-semibold text-black mb-3">Strategic Advantages</h5>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold text-black mb-2">Institutional Credibility:</p>
                    <ul className="space-y-1">
                      <li>• VC/PE backing provides immediate legitimacy</li>
                      <li>• Investor recommendation carries significant weight</li>
                      <li>• Bypasses traditional vendor evaluation processes</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-black mb-2">Strategic Alignment:</p>
                    <ul className="space-y-1">
                      <li>• Technology focus aligns with SBI's blended approach</li>
                      <li>• Growth acceleration matches investor objectives</li>
                      <li>• Direct access to decision-making authority</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Engagement Strategy */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">SBI Growth Engagement Strategy</h2>
            
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">CRO/CFO Level Approach</h3>
              <p className="text-gray-700">
                Given SBI Growth's focus on CRO/CFO level engagement, the strategy centers on demonstrating clear ROI and strategic value to Flexera's growth objectives.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Phase 1: Strategic Opener Engagement</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Primary Opener Target:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Thomas Charles Davis, Jr (Thoma Bravo) - Technology Operating Partner</li>
                      <li>• Leverage Anthony Erickson (SBI) connection for warm introduction</li>
                      <li>• Position SBI's blended consulting + technology approach</li>
                      <li>• Emphasize growth acceleration alignment with investor objectives</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Key Messages:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Technology-enabled GTM consulting for growth acceleration</li>
                      <li>• Strategic alignment with Thoma Bravo's technology focus</li>
                      <li>• Direct ROI impact on Flexera's market positioning</li>
                      <li>• Warm introduction pathway to Flexera buyer group</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Phase 2: Primary Champion Development</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Primary Champion Target:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Cathleen Neibch (Sr Manager Rev Ops) - 7 years tenure, perfect role alignment</li>
                      <li>• Direct RevOps GTM consulting value proposition</li>
                      <li>• Most senior RevOps person on staff with high clout</li>
                      <li>• Close to the problem with strategic influence</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Champion Strategy:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• RevOps optimization and GTM efficiency focus</li>
                      <li>• Strategic growth alignment and process improvement</li>
                      <li>• Internal advocacy development and deal pushing</li>
                      <li>• Personality assessment for internal drive capability</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Phase 3: C-Suite Executive Engagement</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Primary C-Suite Targets:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Jim Ryan (CEO) - Final approval for strategic initiatives</li>
                      <li>• Josh Fraser (CFO) - Budget authority for premium consulting</li>
                      <li>• Eric Free (Chief Growth Officer) - Strategic growth investments</li>
                      <li>• Mike Jerich (President) - Operational strategy oversight</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Key Messages:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Premium ROI and revenue optimization focus</li>
                      <li>• Strategic growth alignment and market positioning</li>
                      <li>• Competitive advantage metrics and market share growth</li>
                      <li>• Enterprise-level consulting value proposition</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Phase 4: Primary Blocker Neutralization</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Primary Blocker Target:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Jill DelGrosso (VP GTM Readiness & Programs) - 10 months tenure</li>
                      <li>• High threat perception of external consultants</li>
                      <li>• Territorial protection of her hiring mandate</li>
                      <li>• "We can do this ourselves" resistance</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Neutralization Strategy:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Position SBI as complementary to her role</li>
                      <li>• Emphasize partnership over replacement</li>
                      <li>• Highlight her success metrics through external expertise</li>
                      <li>• Address tenure insecurity with collaborative approach</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Phase 5: Technical Validation</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Technical Stakeholders:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Engineering teams</li>
                      <li>• IT operations</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Validation Focus:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Technical feasibility</li>
                      <li>• Integration requirements</li>
                      <li>• Implementation timeline</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Phase 6: Secondary Champion Development</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Secondary Champions:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Shinie Shaw (VP Global Sales)</li>
                      <li>• Michael Beaver (VP Marketing)</li>
                      <li>• Barbara Boyer (SVP Customer Experience)</li>
                      <li>• Eric Free (Chief Growth Officer)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-3"><strong>Champion Strategy:</strong></p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Internal advocacy development</li>
                      <li>• Success story sharing</li>
                      <li>• Executive support building</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Research Methodology */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Research Methodology</h2>
            
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Intelligence Gathering Process</h3>
              <p className="text-gray-700 mb-4">
                This buyer group intelligence was developed through systematic analysis of SBI's sales process, 
                Flexera's organizational structure, and enterprise sales methodology targeting for tech-enabled GTM consulting engagements.
              </p>
              <p className="text-gray-700">
                <strong>Intelligence Framework:</strong> Multi-dimensional approach analyzing organizational dynamics, 
                individual motivations, network relationships, and strategic priorities to identify optimal engagement pathways.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Research Sources</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• SBI Growth company website and service descriptions</li>
                  <li>• LinkedIn content from company page and leadership</li>
                  <li>• AI-powered analysis of service positioning</li>
                  <li>• PE/VC history analysis (Thoma Bravo investment timeline)</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Strategic Analysis</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Company website leadership roster and organizational structure</li>
                  <li>• LinkedIn data analysis for tenure and network proximity</li>
                  <li>• Career history evaluation and content engagement analysis</li>
                  <li>• Cross-reference of names for optimal fit assessment</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Key Success Factors */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Success Strategy</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Critical Success Elements</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• <strong>ROI Focus:</strong> Quantify business impact and cost savings</li>
                  <li>• <strong>Strategic Alignment:</strong> Connect to Flexera's growth objectives</li>
                  <li>• <strong>Technical Validation:</strong> Ensure engineering team buy-in</li>
                  <li>• <strong>Executive Sponsorship:</strong> Build C-level support early</li>
                  <li>• <strong>Change Management:</strong> Address organizational impact</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Risk Mitigation</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• <strong>Procurement Process:</strong> Understand vendor evaluation criteria</li>
                  <li>• <strong>Budget Constraints:</strong> Align with fiscal year planning</li>
                  <li>• <strong>Technical Concerns:</strong> Address integration challenges early</li>
                  <li>• <strong>Competitive Pressure:</strong> Differentiate from alternatives</li>
                  <li>• <strong>Timeline Delays:</strong> Build buffer into implementation plan</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section className="mb-12">
            <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-black mb-6">Recommended Next Steps</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-bold text-black mb-3">Immediate Actions (Week 1-2)</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• Leverage Anthony Erickson connection to Thomas Charles Davis, Jr</li>
                    <li>• Prepare Thoma Bravo introduction materials and value proposition</li>
                    <li>• Research Cathleen Neibch's background and RevOps priorities</li>
                    <li>• Develop Jill DelGrosso neutralization strategy</li>
                  </ul>
                </div>
                
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-bold text-black mb-3">Strategic Engagement (Week 3-4)</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>• Execute Thoma Bravo introduction through warm connection</li>
                    <li>• Engage Cathleen Neibch as primary champion</li>
                    <li>• Address Jill DelGrosso's territorial concerns proactively</li>
                    <li>• Schedule C-Suite level meetings with investor backing</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg text-center">
                <p className="text-lg font-bold text-black mb-3">
                  <strong>Strategic Engagement Question:</strong> "How can SBI Growth's premium consulting services directly impact Flexera's revenue growth, market positioning, and operational efficiency in the competitive ITAM space while leveraging our strategic investor relationship for accelerated deal velocity?"
                </p>
                <p className="text-sm text-gray-700 mb-4">
                  Focus on quantifiable business outcomes and ROI that resonate with C-Suite level priorities for expensive, high-value consulting investments, 
                  while emphasizing the strategic advantage of investor-backed credibility and warm introduction pathways.
                </p>
                <a 
                  href="https://calendly.com/dan-adrata/biz-dev-call" 
                  className="inline-block bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition-colors"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Schedule Strategy Call →
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adrata - Buyer Group Intelligence Platform</h3>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Contact:</strong> Dan Mirolli, Head of Revenue - dan@adrata.com
            </p>
            <p className="text-sm text-gray-700 mb-4">
              <strong>Demo:</strong> Schedule Executive Demo<br/>
              <a href="https://calendly.com/dan-adrata/biz-dev-call" className="text-gray-700 underline">Schedule Call With Dan</a>
            </p>
            <p className="text-xs text-gray-500">© 2025 Adrata. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </PasswordProtection>
  );
}
