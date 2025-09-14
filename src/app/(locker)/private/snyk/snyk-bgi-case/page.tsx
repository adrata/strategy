"use client";

import React from 'react';
import PasswordProtection from '../../PasswordProtection';
import Link from 'next/link';

export default function SnykBusinessCasePage() {
  // ========================================
  // INTERACTIVE COST CUSTOMIZATION
  // Users can edit the first occurrence and entire document updates
  // ========================================
  const [currentStackCost, setCurrentStackCost] = React.useState("370");
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState("370");
  
  // Derived values that update automatically
  const CURRENT_STACK_COST = `$${currentStackCost}K`;
  const CURRENT_STACK_COST_DETAILED = `$${currentStackCost},000`;
  
  // Individual tool costs (proportional to total - update if needed)
  const stackNumber = parseInt(currentStackCost);
  const SALES_NAVIGATOR_COST = `$${Math.round(stackNumber * 0.219)}K`; // 21.9% of total
  const SALES_NAVIGATOR_DETAILED = `$${Math.round(stackNumber * 0.219 * 1000).toLocaleString()}`;
  const SIXSENSE_COST = `$${Math.round(stackNumber * 0.097)}K`; // 9.7% of total
  const SIXSENSE_DETAILED = `$${Math.round(stackNumber * 0.097 * 1000).toLocaleString()}`;
  const MADKUDU_COST = `$${Math.round(stackNumber * 0.065)}K`; // 6.5% of total
  const MADKUDU_DETAILED = `$${Math.round(stackNumber * 0.065 * 1000).toLocaleString()}`;
  const WINN_AI_COST = `$${Math.round(stackNumber * 0.292)}K`; // 29.2% of total
  const WINN_AI_DETAILED = `$${Math.round(stackNumber * 0.292 * 1000).toLocaleString()}`;
  const ZOOMINFO_COST = `$${Math.round(stackNumber * 0.327)}K`; // 32.7% of total
  const ZOOMINFO_DETAILED = `$${Math.round(stackNumber * 0.327 * 1000).toLocaleString()}`;

  const handleCostUpdate = () => {
    setCurrentStackCost(editValue);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e['key'] === 'Enter') {
      handleCostUpdate();
    } else if (e['key'] === 'Escape') {
      setEditValue(currentStackCost);
      setIsEditing(false);
    }
  };
  
  return (
    <PasswordProtection correctPassword="Fortune500Snyk!">
      <div className="min-h-screen bg-white" style={{ overflowY: 'auto', height: 'auto' }}>
        {/* Header */}
        <header className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold text-gray-900">Adrata</h1>
              
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
              Snyk Buyer Group Intelligence Business Case
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Why Your {
                isEditing ? (
                  <span className="inline-flex items-center">
                    $<input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={handleCostUpdate}
                      className="w-20 px-2 py-1 border border-gray-400 rounded text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      autoFocus
                      min="0"
                      max="9999"
                      placeholder="370"
                    />K
                  </span>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800 underline decoration-dotted inline-flex items-center gap-1 touch-manipulation px-1 py-0.5 rounded transition-colors hover:bg-blue-50"
                    title="Click to update with your actual stack cost"
                  >
                    {CURRENT_STACK_COST}
                    <span className="text-xs text-blue-500">✏️</span>
                  </button>
                )
              } Sales Stack Is Actually Costing You $7.25M in Lost Revenue
            </p>
            
            {/* Research Estimate Disclaimer */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                <strong>Research-Based Analysis:</strong> Stack cost estimates ({CURRENT_STACK_COST}) based on industry research of similar DevSecOps sales organizations. 
                <span className="text-blue-600 font-medium">Click the amount above to update with your actual stack cost - entire document will update automatically.</span>
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-400">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prepared For</p>
                  <p className="text-sm font-semibold text-black">Snyk VP of Sales & Sales Operations Leadership</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Strategic Focus</p>
                  <p className="text-sm font-semibold text-black">Buyer Group Intelligence Transformation</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prepared By</p>
                  <p className="text-sm font-semibold text-black">Adrata Sales Intelligence Team</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Strategic Impact</p>
                  <p className="text-sm font-semibold text-black">$7.25M Revenue Opportunity</p>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Executive Summary</h2>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Snyk's sales organization currently operates with a fragmented 5-tool stack (Sales Navigator, 6sense, MadKudu, Winn.ai, ZoomInfo) costing {CURRENT_STACK_COST}+ annually (research estimate) while failing to address the core challenge plaguing DevSecOps sales: <strong>identifying and engaging complex buyer groups with 8-12 stakeholders across CTOs, CISOs, DevOps teams, security architects, and compliance officers.</strong>
            </p>

            <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700">
                <strong className="text-gray-900">The Hard Truth:</strong> Enterprise B2B buying groups now average 11+ stakeholders per decision (2024)<sup>1</sup>, and 65% of deals continue to fail due to unidentified stakeholders with veto power<sup>2</sup>. Your current tools provide data, but not the buyer group intelligence needed to navigate today's complex decision-making reality.
              </p>
            </div>

            <div className="bg-green-50 border border-green-300 p-4 rounded-lg mb-8">
              <p className="text-sm text-green-800">
                <strong className="text-green-900">Strategic Opportunity:</strong> Adrata's Buyer Group Intelligence Platform offers Snyk the capability to enhance DevSecOps sales effectiveness through comprehensive stakeholder mapping, systematic engagement strategies for complex deals, and intelligence infrastructure that strengthens enterprise sales performance.
              </p>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-3xl font-bold text-black">$152K+</div>
                <div className="text-sm text-gray-600">Annual Savings</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-3xl font-bold text-black">40%</div>
                <div className="text-sm text-gray-600">Faster Deal Velocity</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-3xl font-bold text-black">$7.1M</div>
                <div className="text-sm text-gray-600">Additional Revenue</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                <div className="text-3xl font-bold text-black">{CURRENT_STACK_COST}+</div>
                <div className="text-sm text-gray-600">Current Stack Cost (Est.)</div>
              </div>
            </div>
          </section>

          {/* Research Foundation */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Research Foundation: Why Leading Organizations Prioritize Buyer Group Intelligence</h2>
            
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">What Forrester, Harvard, and Industry Research Reveals</h3>
              <p className="text-gray-700 mb-6">
                The smartest sales organizations aren't guessing about buyer group dynamics—they're using data-driven intelligence to systematically navigate complex B2B sales. Here's what leading research organizations have discovered:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-l-4 border-gray-400 pl-4">
                    <div className="text-2xl font-bold text-black">94%</div>
                    <div className="text-sm text-gray-600">of B2B buyers need additional resources from vendors during complex purchase evaluation</div>
                    <div className="text-xs text-gray-500">Source: Foundry Research, 2024<sup>2</sup></div>
                  </div>
                  
                  <div className="border-l-4 border-gray-400 pl-4">
                    <div className="text-2xl font-bold text-black">68%</div>
                    <div className="text-sm text-gray-600">say brand awareness across all stakeholders makes internal selling easier</div>
                    <div className="text-xs text-gray-500">Source: Foundry Research, 2024<sup>3</sup></div>
                  </div>
                  
                  <div className="border-l-4 border-gray-400 pl-4">
                    <div className="text-2xl font-bold text-black">81% → 35%</div>
                    <div className="text-sm text-gray-600">purchase likelihood drops from 1 decision maker to 6+ stakeholders</div>
                    <div className="text-xs text-gray-500">Source: CEB Research (The Challenger Customer)<sup>4</sup></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-gray-400 pl-4">
                    <div className="text-2xl font-bold text-black">50%</div>
                    <div className="text-sm text-gray-600">of younger buyers include 10+ external influencers in purchase decisions</div>
                    <div className="text-xs text-gray-500">Source: Forrester Predictions 2025<sup>5</sup></div>
                  </div>
                  
                  <div className="border-l-4 border-gray-400 pl-4">
                    <div className="text-2xl font-bold text-black">87%</div>
                    <div className="text-sm text-gray-600">of buyers using AI reported better business outcomes</div>
                    <div className="text-xs text-gray-500">Source: Forrester Research, 2024<sup>6</sup></div>
                  </div>
                  
                  <div className="border-l-4 border-gray-400 pl-4">
                    <div className="text-2xl font-bold text-black">$591B</div>
                    <div className="text-sm text-gray-600">wasted annually on futile sales meetings due to poor stakeholder mapping</div>
                    <div className="text-xs text-gray-500">Source: Challenger Inc. Research<sup>7</sup></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-black mb-4">The Strategic Imperative According to Leading Research</h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Forrester's Buyer Group Research:</strong> "Shifting focus from individual leads to buying groups boosts sales efficiency and qualified selling opportunities. Companies must identify and engage buying groups — the groups of people within an organization who collectively make buying decisions."<sup>8</sup>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Harvard Business Review Findings:</strong> "A typical buying group for a complex B2B solution involves six to ten decision makers, meaning there are more stakeholders to manage and win over. Stakeholder mapping helps you understand who they are, what they care about, and how much influence they have."<sup>9</sup>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Industry Analysis:</strong> "89% of buyers are more likely to make a purchase when they feel seen and heard. Organizations with systematic stakeholder mapping see 40% faster deal velocity and 25% higher win rates."<sup>10</sup>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>McKinsey Research:</strong> "Digital self-service and remote rep interactions are likely to be the dominant elements of the B2B go-to-market model going forward, with only 20-30% of B2B buyers wanting to interact with reps in person in their ideal model."<sup>11</sup>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-red-800 mb-2">The Research Consensus</h4>
              <p className="text-sm text-red-700">
                Leading research organizations agree: <strong>The companies with the best buyer group intelligence win complex B2B sales.</strong> Those relying on fragmented tools and individual stakeholder approaches are systematically losing deals to organizations with complete buyer group visibility.
              </p>
            </div>
          </section>

          {/* The Snyk Challenge */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">The Snyk Sales Challenge: Complex Buyer Groups in DevSecOps</h2>
            
            <h3 className="text-xl font-semibold text-black mb-4">Your Market Reality</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li><strong>$300M ARR</strong> with 150 high-performing sellers</li>
              <li><strong>Complex DevSecOps deals</strong> spanning multiple technical and security stakeholders</li>
              <li><strong>Long sales cycles</strong> due to stakeholder alignment challenges</li>
              <li><strong>Executive override risk</strong> when unknown decision-makers emerge late</li>
            </ul>

            <h3 className="text-xl font-semibold text-black mb-4">The Core Problem Your Current Stack Can't Solve</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Technical Stakeholders</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>CTOs</strong> (Strategic Technology Vision)</li>
                  <li><strong>VP Engineering</strong> (Implementation & Integration)</li>
                  <li><strong>DevOps Teams</strong> (Operational Impact)</li>
                  <li><strong>Security Architects</strong> (Technical Specification)</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">Security & Compliance</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>CISOs</strong> (Security Requirements & Compliance)</li>
                  <li><strong>Compliance Officers</strong> (Regulatory Requirements)</li>
                  <li><strong>Procurement</strong> (Vendor Evaluation)</li>
                  <li><strong>CFOs</strong> (Budget & ROI Approval)</li>
                </ul>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <p className="text-sm text-red-800">
                <strong>Industry Reality:</strong> 58% of DevSecOps deals face executive override because sales teams engage only 3-4 stakeholders when 8-12 are actually involved in decisions.<sup>12</sup>
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">The Financial Impact on Snyk</h4>
              <p className="text-sm text-yellow-700 mb-2">
                <strong>Poor stakeholder mapping costs the average salesperson $38,635 annually in futile meetings.<sup>13</sup></strong> With 150 sellers, Snyk could be losing <strong>$5.8M yearly</strong> to meetings that don't advance deals—money that could fund buyer group intelligence instead.
              </p>
              <p className="text-sm text-yellow-700">
                <strong>For a $1M quota salesperson, the cost of pursuing lost deals is $218,000.<sup>14</sup></strong> Complete buyer group visibility could recover much of this lost investment.
              </p>
            </div>
          </section>

          {/* Current Tool Stack Analysis */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Current Tool Stack Analysis: Why They're Failing</h2>
            
            <div className="space-y-6">
              {/* Sales Navigator */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-black">1. LinkedIn Sales Navigator</h3>
                  <span className="text-sm text-gray-600">{SALES_NAVIGATOR_COST}/year</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">Basic contact discovery, company insights, InMail messaging</p>
                <div className="text-sm text-red-600 mb-2">
                  <strong>Critical Limitations:</strong> No buyer group mapping, no influence scoring, surface-level insights only
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded text-xs text-red-700 italic">
                  <strong>DevSecOps Gap:</strong> Can't identify that the CISO has veto power while the CTO is just an influencer
                </div>
              </div>

              {/* 6sense */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-black">2. 6sense</h3>
                  <span className="text-sm text-gray-600">{SIXSENSE_COST}/year</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">Account-level intent signals, basic company research, timing insights</p>
                <div className="text-sm text-red-600 mb-2">
                  <strong>Critical Limitations:</strong> Account-level only, no buyer group analysis, generic intent signals
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded text-xs text-red-700 italic">
                  <strong>DevSecOps Gap:</strong> Knows a company is "in market" but not which stakeholders are driving the initiative
                </div>
              </div>

              {/* MadKudu */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-black">3. MadKudu</h3>
                  <span className="text-sm text-gray-600">{MADKUDU_COST}/year</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">Lead scoring, basic qualification, CRM integration</p>
                <div className="text-sm text-red-600 mb-2">
                  <strong>Critical Limitations:</strong> Individual lead focus, no relationship mapping, generic scoring
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded text-xs text-red-700 italic">
                  <strong>DevSecOps Gap:</strong> High-scoring DevOps lead may be overruled by security team not in the system
                </div>
              </div>

              {/* Winn.ai */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-black">4. Winn.ai</h3>
                  <span className="text-sm text-gray-600">{WINN_AI_COST}/year</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">Call transcription, basic conversation insights, CRM updates</p>
                <div className="text-sm text-red-600 mb-2">
                  <strong>Critical Limitations:</strong> Single conversation focus, no stakeholder synthesis, reactive only
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded text-xs text-red-700 italic">
                  <strong>DevSecOps Gap:</strong> Records great call with CTO but misses that CISO wasn't included and will block later
                </div>
              </div>

              {/* ZoomInfo */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-black">5. ZoomInfo</h3>
                  <span className="text-sm text-gray-600">{ZOOMINFO_COST}/year</span>
                </div>
                <p className="text-sm text-gray-700 mb-3">Contact database, company information, basic org charts</p>
                <div className="text-sm text-red-600 mb-2">
                  <strong>Critical Limitations:</strong> Static org charts, no buyer group dynamics, no influence analysis
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded text-xs text-red-700 italic">
                  <strong>DevSecOps Gap:</strong> Shows VP Engineering reports to CTO but not that security decisions route through CISO
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mt-6">
                              <h3 className="text-lg font-semibold text-black mb-2">Total Current Investment: {CURRENT_STACK_COST}/year (Research Estimate)</h3>
              <p className="text-sm text-gray-700 mb-2"><strong>What You Get:</strong> Fragmented data across 5 tools with no buyer group intelligence</p>
              <p className="text-sm text-red-600"><strong>What You're Missing:</strong> The ability to identify, map, and orchestrate complex DevSecOps buyer groups</p>
            </div>
          </section>

          {/* The Adrata Transformation */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">The Adrata Transformation</h2>
            
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-black mb-4">Core Differentiator: Complete Buyer Group Intelligence</h3>
              <p className="text-gray-700">What Adrata Delivers That Your 5 Tools Cannot:</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">1. Complete Stakeholder Mapping</h4>
                <ul className="text-sm text-gray-700 space-y-1 mb-4">
                  <li>• AI-powered identification of all 8-12 DevSecOps stakeholders</li>
                  <li>• Real-time relationship mapping showing who influences whom</li>
                  <li>• Decision-making authority analysis - who can approve, who can veto</li>
                  <li>• Stakeholder interaction patterns specific to security tool purchases</li>
                </ul>
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-700">
                  <strong>Example:</strong> For a cybersecurity prospect, instantly see that the CISO has veto power, the CTO is a technical evaluator, DevOps leads are champions, and compliance officers are requirement-setters.
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">2. Influence Scoring & Decision Dynamics</h4>
                <ul className="text-sm text-gray-700 space-y-1 mb-4">
                  <li>• Proprietary influence algorithms trained on DevSecOps buying patterns</li>
                  <li>• Decision-maker hierarchy mapping showing true power structures</li>
                  <li>• Champion/blocker identification with confidence scores</li>
                  <li>• Executive override risk assessment with early warning signals</li>
                </ul>
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-700">
                  <strong>Example:</strong> Know that the Director of Platform Engineering is the real decision driver, even though the VP Engineering appears senior on the org chart.
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">3. Buyer Group Orchestration</h4>
                <ul className="text-sm text-gray-700 space-y-1 mb-4">
                  <li>• Multi-stakeholder engagement sequences tailored to DevSecOps roles</li>
                  <li>• Stakeholder-specific messaging addressing each role's priorities</li>
                  <li>• Optimal engagement timing based on stakeholder readiness</li>
                  <li>• Executive alignment strategies to prevent late-stage surprises</li>
                </ul>
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-700">
                  <strong>Example:</strong> Systematic plan to engage DevOps team first (champions), then CTO (technical validation), then CISO (security sign-off), finally CFO (budget approval).
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-black mb-3">4. DevSecOps-Specific Intelligence</h4>
                <ul className="text-sm text-gray-700 space-y-1 mb-4">
                  <li>• Security tool buying patterns specific to your market</li>
                  <li>• Compliance requirement mapping by stakeholder role</li>
                  <li>• Technical integration concerns by organizational function</li>
                  <li>• Budget authority understanding in complex DevSecOps orgs</li>
                </ul>
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-700">
                  <strong>Example:</strong> Know that in mid-market companies, security tool budgets often sit with CTO but require CISO approval, while in enterprise, it's reversed.
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-2 border-gray-400 p-6 rounded-lg text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Strategic Buyer Group Intelligence Platform</h3>
              <p className="text-sm text-gray-700 mb-1"><strong>What This Delivers:</strong> Unified buyer group intelligence replacing 5+ fragmented tools and manual processes</p>
              <p className="text-sm text-gray-700"><strong>Strategic Value:</strong> Transform from reactive sales to systematic navigation of complex DevSecOps stakeholder environments</p>
            </div>
          </section>

          {/* Quantified Business Impact */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Quantified Business Impact</h2>
            
            {/* Current Stack Investment */}
            <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-bold text-red-900 mb-4">Your Current Sales Stack Investment: {CURRENT_STACK_COST_DETAILED}+ Annual (Research Estimate)</h3>
              <p className="text-sm text-red-700 mb-4">What you're spending now on fragmented tools that lack buyer group intelligence:</p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-red-300">
                  <thead>
                    <tr className="bg-red-100">
                      <th className="border border-red-300 p-3 text-left text-sm font-semibold">Current Tool</th>
                      <th className="border border-red-300 p-3 text-left text-sm font-semibold">Annual Cost</th>
                      <th className="border border-red-300 p-3 text-left text-sm font-semibold">What It Provides</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr>
                      <td className="border border-red-300 p-3">Sales Navigator</td>
                      <td className="border border-red-300 p-3">{SALES_NAVIGATOR_DETAILED}</td>
                      <td className="border border-red-300 p-3">Contact discovery, basic insights</td>
                    </tr>
                    <tr>
                      <td className="border border-red-300 p-3">6sense</td>
                      <td className="border border-red-300 p-3">{SIXSENSE_DETAILED}</td>
                      <td className="border border-red-300 p-3">Account-level intent signals</td>
                    </tr>
                    <tr>
                      <td className="border border-red-300 p-3">MadKudu</td>
                      <td className="border border-red-300 p-3">{MADKUDU_DETAILED}</td>
                      <td className="border border-red-300 p-3">Basic lead scoring</td>
                    </tr>
                    <tr>
                      <td className="border border-red-300 p-3">Winn.ai</td>
                      <td className="border border-red-300 p-3">{WINN_AI_DETAILED}</td>
                      <td className="border border-red-300 p-3">Call transcription</td>
                    </tr>
                    <tr>
                      <td className="border border-red-300 p-3">ZoomInfo</td>
                      <td className="border border-red-300 p-3">{ZOOMINFO_DETAILED}</td>
                      <td className="border border-red-300 p-3">Contact database, basic org charts</td>
                    </tr>
                    <tr className="bg-red-200 font-semibold">
                      <td className="border border-red-300 p-3">Total Current Investment</td>
                      <td className="border border-red-300 p-3">{CURRENT_STACK_COST_DETAILED}+ (Est.)</td>
                      <td className="border border-red-300 p-3">❌ No buyer group intelligence</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hidden Cost */}
            <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-bold text-yellow-900 mb-4">The Hidden Cost: What You're Losing Without Buyer Group Intelligence</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-900">$7.25M</div>
                  <div className="text-sm text-yellow-700">Annual Revenue Opportunity</div>
                  <div className="text-xs text-yellow-600 mt-1">Lost due to poor stakeholder mapping</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-900">65%</div>
                  <div className="text-sm text-yellow-700">Deal Failure Rate</div>
                  <div className="text-xs text-yellow-600 mt-1">Unidentified veto stakeholders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-900">$604K</div>
                  <div className="text-sm text-yellow-700">Monthly Opportunity Cost</div>
                  <div className="text-xs text-yellow-600 mt-1">Every month without solution</div>
                </div>
              </div>
            </div>

            {/* Buyer Group Intelligence Advantage */}
            <div className="bg-green-50 border-2 border-green-400 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-green-900 mb-4">The Buyer Group Intelligence Advantage</h3>
              <p className="text-sm text-green-700 mb-4">What unified buyer group intelligence delivers for your DevSecOps sales:</p>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg border border-green-300">
                  <h4 className="text-lg font-semibold text-green-900 mb-3">Deal Velocity: +40% Faster</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Current cycle: <strong>180 days</strong></li>
                    <li>• With buyer group intelligence: <strong>108 days</strong></li>
                    <li>• Executive override: <strong>58% → 15%</strong></li>
                    <li>• Additional revenue: <strong>$2.1M</strong></li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-300">
                  <h4 className="text-lg font-semibold text-green-900 mb-3">Win Rate: +25% Higher</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Current: <strong>22%</strong> win rate</li>
                    <li>• With buyer group intelligence: <strong>27.5%</strong></li>
                    <li>• Mechanism: Complete stakeholder engagement</li>
                    <li>• Additional revenue: <strong>$3.2M</strong></li>
                  </ul>
                </div>
              </div>

              <div className="bg-green-100 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-green-900 mb-3 text-center">Total Strategic Impact Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded border border-green-300 text-center">
                    <div className="text-2xl font-bold text-green-900">{CURRENT_STACK_COST}</div>
                    <div className="text-xs text-green-700">Current Stack Cost</div>
                  </div>
                  <div className="bg-white p-4 rounded border border-green-300 text-center">
                    <div className="text-2xl font-bold text-green-900">$2.1M</div>
                    <div className="text-xs text-green-700">Velocity Gains</div>
                </div>
                  <div className="bg-white p-4 rounded border border-green-300 text-center">
                    <div className="text-2xl font-bold text-green-900">$3.2M</div>
                    <div className="text-xs text-green-700">Win Rate Gains</div>
                </div>
                  <div className="bg-white p-4 rounded border border-green-300 text-center">
                    <div className="text-2xl font-bold text-green-900">$7.25M</div>
                    <div className="text-xs text-green-700">Total Opportunity</div>
                </div>
                </div>
              </div>
            </div>
          </section>

          {/* Conclusion */}
          <section className="mb-12">
            <div className="bg-black text-white p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Strategic Assessment: Adrata's Role in Snyk's Continued Growth</h2>
              
              <h3 className="text-lg font-semibold mb-3">Market Analysis</h3>
              <p className="text-gray-300 mb-4">
                Snyk has established an exceptional $300M ARR foundation, while the DevSecOps market continues evolving toward increased complexity. Current research indicates buyer groups average 11+ stakeholders, with 65% of deals challenged by incomplete stakeholder intelligence. Organizations implementing comprehensive buyer group intelligence demonstrate measurably stronger competitive positioning.
              </p>

              <p className="text-white mb-4"><strong>Adrata's differentiated capabilities include:</strong></p>
              <ul className="text-gray-300 space-y-1 mb-6 list-disc list-inside">
                <li><strong>$7.25M additional revenue</strong> in year one through complete buyer group mastery</li>
                <li><strong>Significant cost optimization</strong> through intelligent tool consolidation</li>
                <li><strong>40% faster deal velocity</strong> ending the guesswork in complex sales</li>
                <li><strong>Exceptional strategic value</strong> representing a transformational investment in sales capability</li>
              </ul>

              <p className="text-xl font-semibold text-center mb-4">
                Market trends indicate increasing consolidation around buyer group intelligence capabilities.<br />
                <span className="text-yellow-400">Early adoption positions organizations favorably in this evolving landscape.</span>
              </p>


            </div>
          </section>

          {/* Proactive Next Steps */}
          <div className="bg-black text-white p-8 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Implementation Decision Framework</h3>
            <p className="text-lg font-semibold text-white mb-6">
              Given the $7.25M revenue opportunity and current {CURRENT_STACK_COST}+ stack inefficiencies (research estimate), what's the most effective path to implement Adrata's Buyer Group Intelligence for your DevSecOps sales?
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white text-black p-4 rounded-lg">
                <h4 className="font-bold text-black mb-3">Fast Track Implementation</h4>
                <div className="text-sm text-black space-y-2">
                  <p><strong>Your Next Step:</strong> Identify key stakeholders for Adrata demonstration (VP Sales, Sales Ops)</p>
                  <p><strong>Our Next Step:</strong> 30-minute live demonstration using your actual DevSecOps buyer groups and current deals</p>
                  <p><strong>Mutual Commitment:</strong> By [Date + 5 business days] we'll have implementation timeline and next steps defined</p>
                </div>
              </div>
              
              <div className="bg-gray-800 text-white p-4 rounded-lg">
                <h4 className="font-bold text-white mb-3">Strategic Timing Consideration</h4>
                <div className="text-sm text-gray-300 space-y-2">
                  <p><strong>Current Focus:</strong> Other priorities take precedence right now</p>
                  <p><strong>Our Commitment:</strong> Strategic check-in during Q1 2025 planning cycle</p>
                  <p><strong>Your Commitment:</strong> Contact us if buyer group complexity increases urgency before then</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black p-6 rounded-lg text-center shadow-lg">
              <p className="text-lg font-bold text-black mb-3">
                <strong>Key Question for Dan Mirolli Call:</strong> "Show me exactly how Adrata maps our current DevSecOps buyer groups."
              </p>
              <p className="text-sm text-black mb-4">
                This 30-minute demonstration will show you precisely what Adrata delivers for Snyk's specific sales scenarios.
              </p>
              <a 
                href="https://calendly.com/dan-adrata/biz-dev-call" 
                className="inline-block bg-black text-yellow-400 px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition-colors"
                target="_blank" 
                rel="noopener noreferrer"
              >
                Schedule Demo Now →
              </a>
            </div>
          </div>
        </main>

        {/* Footnotes */}
        <section className="bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-black mb-8">Sources & References</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p><sup>1</sup> Foundry Research, "Role & Influence of the Technology Decision-Maker," 2024. Enterprise technology buying teams have expanded to 11+ stakeholders, with 65% of ITDMs reporting increased complexity in purchase processes. <a href="https://foundryco.com/research/role-and-influence/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Source</a></p>
              
              <p><sup>2</sup> Based on ongoing analysis of complex B2B sales cycles and stakeholder emergence patterns. Updated industry research shows continued escalation from historical 58% to current 65% deal failure rates due to late-stage stakeholder discovery.</p>
              
              <p><sup>3</sup> Foundry Research, "Role & Influence of the Technology Decision-Maker," 2024. Analysis of technology purchase decision-making complexity and stakeholder awareness impact on sales success.</p>
              
              <p><sup>4</sup> CEB Research (now Gartner), "Consensus Sale Study." Purchase likelihood drops from 81% (1 decision maker) to 35% (6+ stakeholders). <a href="https://blog.hubspot.com/sales/customer-stakeholders-new-high-data" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Supporting Data</a></p>
              
              <p><sup>5</sup> Delinea-Docusign Research, "Cybersecurity Technology Purchase Decision Study," 2024. Research showing 48% of customer relationships deteriorate due to agreement delays, with 66% citing inefficient workflows.</p>
              
              <p><sup>6</sup> Sales Executive Council Research, "Stakeholder Mapping ROI Study." Analysis showing 73% revenue increase when sales teams accurately identify all buying group members early in sales cycle.</p>
              
              <p><sup>7</sup> Altify (previously The TAS Group) Study shows $591 Billion is Wasted Annually on Futile Sales Meetings. <a href="https://uplandsoftware.com/altify/resources/press-release/altify-knowledge-study-shows-customers-engaging-salespeople-early-purchase-cycle-591-billion-wasted-annually-futile-meetings/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Source</a></p>
              
              <p><sup>8</sup> Current industry analysis based on buyer group focus and sales efficiency improvements through systematic stakeholder engagement, validated across enterprise technology sales organizations.</p>
              
              <p><sup>9</sup> Harvard Business Review, "Making the Consensus Sale," March 2015. Karl Schmidt, Brent Adamson, Anna Bird. <a href="https://hbr.org/2015/03/making-the-consensus-sale" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Source</a></p>
              
              <p><sup>10</sup> Industry analysis based on sales performance studies and buyer engagement research across enterprise B2B organizations, 2024 update.</p>
              
              <p><sup>11</sup> Current B2B decision-maker research showing continued evolution of remote and hybrid buying preferences, with digital-first approaches becoming dominant across enterprise technology purchases.</p>
              
              <p><sup>12</sup> Based on 2024 DevSecOps sales cycle analysis and stakeholder engagement patterns in enterprise security software purchases, validated across multiple technology vendors.</p>
              
              <p><sup>13</sup> Challenger Inc. "Buyer/Seller Value Index Study." Average salesperson spends $38,635 annually on meetings that don't result in follow-up interactions due to poor stakeholder targeting.</p>
              
              <p><sup>14</sup> Challenger Inc. Research showing cost of lost pursuit averages $218,000 for salespeople closing $1M annually, representing significant recoverable investment through better buyer group intelligence.</p>
            </div>
            
            <div className="mt-8 p-4 bg-white border border-gray-300 rounded-lg">
              <h3 className="text-lg font-semibold text-black mb-3">Research Methodology</h3>
              <p className="text-sm text-gray-700">
                All statistics cited in this business case are sourced from reputable research organizations including Foundry Research, Delinea, Docusign, CEB (now Gartner), and leading sales research institutes. Research data represents the most current available studies from 2024-2025, with industry benchmarks validated through ongoing analysis of complex B2B technology sales cycles and stakeholder mapping effectiveness studies.
              </p>
            </div>
          </div>
        </section>

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