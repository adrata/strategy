"use client";

import React from "react";
import Link from "next/link";

export default function WhatIsTheBuyerGapPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-12">
              <Link href="/" className="text-xl font-medium text-gray-900">
                Adrata
              </Link>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-6">
                <Link href="/what-is-the-buyer-gap" className="text-sm text-gray-900 font-semibold">
                  Buyer Gap
                </Link>
                <Link href="/platform" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Platform
                </Link>
                <Link href="/pricing" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <Link href="/company" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Company
                </Link>
              </nav>
            </div>

            {/* Sign In and CTA Button */}
            <div className="flex items-center space-x-4">
              <Link href="/sign-in" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                Sign In
              </Link>
              <Link
                href="/demo"
                className="bg-black text-white px-5 py-1.5 rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                See a demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-32 bg-white">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-6">
                What is the Buyer Gap?
              </h1>
              <p className="text-xl text-gray-600 mb-6 max-w-3xl">
                The Buyer Gap is the critical gap between knowing who matters in your deals—and who doesn't.
              </p>
              <p className="text-lg text-gray-600 mb-8 max-w-3xl">
                The tools we've bought over the years have been in an effort to close that gap. And while they helped with symptoms, none addressed the root cause.
              </p>
              <div className="flex">
                <Link
                  href="/close-the-buyer-gap"
                  className="bg-white text-black border border-black px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center space-x-2 no-override"
                >
                  <span>Close Your Buyer Gap</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Definition Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                The Universal Challenge in Complex Sales
              </h2>
              <p className="text-lg text-gray-600">
                Every sales organization faces the same invisible challenge
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="bg-white p-8 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  The Distance
                </h3>
                <p className="text-gray-600">
                  Between who sellers contact and who actually controls the deal
                </p>
              </div>
              <div className="bg-white p-8 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  The Blindspot
                </h3>
                <p className="text-gray-600">
                  Between sales activity and true buyer influence
                </p>
              </div>
              <div className="bg-white p-8 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  The Gap
                </h3>
                <p className="text-gray-600">
                  Between knowing who matters in a deal—and who doesn't
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                Where Deals Get Stuck: Working the Wrong People
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">85%</div>
                  <p className="text-gray-600">
                    Of top performers include Economic Buyers in their process
                  </p>
                  <div className="text-sm text-gray-500 mt-2">
                    vs 8% of low performers 
                    <a href="#footnote-1" className="text-black hover:underline ml-1 text-xs">¹</a>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">11.7</div>
                  <p className="text-gray-600">
                    Average stakeholders involved in B2B purchasing decisions
                  </p>
                  <div className="text-sm text-gray-500 mt-2">
                    2025 Gartner study
                    <a href="#footnote-2" className="text-black hover:underline ml-1 text-xs">²</a>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">18%</div>
                  <p className="text-gray-600">
                    Of salespeople are classified by buyers as trusted advisors
                  </p>
                  <div className="text-sm text-gray-500 mt-2">
                    Who buyers respect
                    <a href="#footnote-3" className="text-black hover:underline ml-1 text-xs">³</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Case Studies Section */}
        <section className="py-20 bg-white">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                How the Buyer Gap Kills Deals
              </h2>
              <p className="text-lg text-gray-600">
                Real scenarios every sales professional recognizes
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Scenario 1 */}
              <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  The "Champion" Who Wasn't
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Sarah spent 6 months nurturing the VP of Operations who loved the demo. The deal was "95% closed" when procurement blocked it—Finance and the CFO had never been briefed. Her "champion" had no budget influence.
                </p>
                <div className="bg-white p-4 rounded border-l-4 border-gray-600">
                  <p className="font-semibold text-gray-900 text-sm">The Buyer Gap:</p>
                  <p className="text-gray-600 text-sm">Activity with users ≠ Influence with decision makers</p>
                </div>
              </div>

              {/* Scenario 2 */}
              <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  The Invisible Veto Power
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Marcus mapped the org chart and got buy-in from IT, Security, and the CTO. Contract ready to sign when Legal raised data sovereignty concerns—a blocker with absolute veto power who never appeared in any org chart.
                </p>
                <div className="bg-white p-4 rounded border-l-4 border-gray-600">
                  <p className="font-semibold text-gray-900 text-sm">The Buyer Gap:</p>
                  <p className="text-gray-600 text-sm">Org chart coverage ≠ Decision maker coverage</p>
                </div>
              </div>

              {/* Scenario 3 */}
              <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  The Wrong Business Case
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Jennifer built a compelling ROI case around operational efficiency. Unknown to her, the CEO's priority was customer experience, not efficiency. Her solution was seen as "nice to have" rather than "must have."
                </p>
                <div className="bg-white p-4 rounded border-l-4 border-gray-600">
                  <p className="font-semibold text-gray-900 text-sm">The Buyer Gap:</p>
                  <p className="text-gray-600 text-sm">Stakeholder priorities ≠ Economic buyer priorities</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Research Evidence Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                The Research is Clear
              </h2>
              <p className="text-lg text-gray-600">
                Data from millions of opportunities and billions in pipeline
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Buyer Behavior Study</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Buyers prefer to engage sellers late in process</span>
                    <span className="text-gray-900 font-bold">57%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Say conversations with sellers offer no value</span>
                    <span className="text-gray-900 font-bold">6x more than 2018</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Don't view sellers as valuable resource</span>
                    <span className="text-gray-900 font-bold">78%</span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-4">
                  <a href="#footnote-4" className="text-black hover:underline">⁴ Korn Ferry 2021 Buyer Preferences Study</a>
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Sales Performance Impact</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Organizations seeing longer sales cycles</span>
                    <span className="text-gray-900 font-bold">43%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">More opportunities lost to no decision</span>
                    <span className="text-gray-900 font-bold">44%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Face challenges from more decision makers</span>
                    <span className="text-gray-900 font-bold">84%</span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-4">
                  <a href="#footnote-5" className="text-black hover:underline">⁵ RAIN Group Global Sales Research</a>
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  The Cost of the Buyer Gap
                </h3>
                <p className="text-gray-600 text-lg mb-4">
                  Based on analysis of 3.2 million opportunities<a href="#footnote-6" className="text-black hover:underline ml-1 text-sm">⁶</a>:
                </p>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  $10M+<a href="#footnote-6" className="text-black hover:underline ml-1 text-base">⁶</a>
                </div>
                <p className="text-gray-600">
                  In lost revenue for typical enterprise companies due to misaligned buyer engagement
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Impact by Role Section */}
        <section className="py-20 bg-white">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                How the Buyer Gap Impacts Every Role
              </h2>
              <p className="text-lg text-gray-600">
                From the boardroom to the sales floor, everyone feels the pain
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">CEO/CRO Pain</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• Forecasts consistently miss</li>
                  <li>• Pipeline conversion rates stagnant</li>
                  <li>• Sales cycles getting longer</li>
                  <li>• Win rates declining vs competition</li>
                  <li>• Revenue predictability broken</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Sales Manager Pain</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• Deals stalling in late stages</li>
                  <li>• "Sure thing" deals falling through</li>
                  <li>• Team missing quota repeatedly</li>
                  <li>• Unable to coach effectively</li>
                  <li>• Firefighting instead of strategizing</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Sales Rep Pain</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• Working deals that never close</li>
                  <li>• Surprised by late-stage objections</li>
                  <li>• Losing to "no decision"</li>
                  <li>• Can't access real decision makers</li>
                  <li>• Quota feels impossible</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Teaser Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-gray-900 mb-6">
                There's a Better Way
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                What if you could see the complete buyer group, understand the real decision-making process, 
                and engage the right stakeholders from day one?
              </p>
              <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8 max-w-3xl mx-auto">
                <p className="text-lg text-gray-600 italic">
                  "86% of buyers say they're more likely to purchase when companies understand their goals, yet 59% of buyers say reps don't take the time to understand their business' unique challenges and objectives."
                </p>
                <p className="text-gray-500 text-sm mt-2">- Salesforce State of Sales Report 2024</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/close-the-buyer-gap"
                  className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center space-x-2"
                >
                  <span>Close The Buyer Gap</span>
                </Link>
                <Link
                  href="/demo"
                  className="bg-white text-black border border-gray-300 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  See How It Works
                </Link>
              </div>
              
              <div className="text-center mt-8">
                <Link
                  href="/buyer-gap-implications"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2 font-medium"
                  style={{ color: 'white' }}
                >
                  <span style={{ color: 'white' }}>See the full cost of ignoring this problem</span>
                  <span style={{ color: 'white' }}>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footnotes Section */}
      <section className="py-12 bg-gray-100 border-t border-gray-200">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">References & Sources</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div id="footnote-1" className="border-l-4 border-black pl-4">
              <strong>¹</strong> Ebsta Benchmark Report 2023: "State of Sales Performance" - Analysis of 850,000+ opportunities across 2,000+ sales organizations. 
              <a href="https://www.ebsta.com/benchmark-report" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">View Report →</a>
            </div>
            
            <div id="footnote-2" className="border-l-4 border-black pl-4">
              <strong>²</strong> Gartner 2025 B2B Buying Study: "Buying Group Complexity Report" - Latest analysis showing average of 11.7 stakeholders involved in enterprise B2B purchasing decisions. 
              <a href="https://www.gartner.com/en/sales/research" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">View Research →</a>
            </div>
            
            <div id="footnote-3" className="border-l-4 border-black pl-4">
              <strong>³</strong> Steve W. Martin Sales Research: "Buyer-Seller Relationship Study" published in Harvard Business Review. 
              <a href="https://hbr.org/search?term=steve+martin+sales" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">Search HBR Articles →</a>
            </div>
            
            <div id="footnote-4" className="border-l-4 border-black pl-4">
              <strong>⁴</strong> Korn Ferry Institute: "Buyer Preferences in the Digital Age" 2021 study of 2,300+ B2B buyers across enterprise organizations. 
              <a href="https://www.kornferry.com/insights" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">View Research →</a>
            </div>
            
            <div id="footnote-5" className="border-l-4 border-black pl-4">
              <strong>⁵</strong> RAIN Group: "Top Performance in Sales Prospecting" - Global sales research study analyzing 42,000+ sales professionals. 
              <a href="https://www.rainsalestraining.com/sales-research" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">Access Research →</a>
            </div>
            
            <div id="footnote-6" className="border-l-4 border-black pl-4">
              <strong>⁶</strong> Adrata Analysis: Revenue impact modeling based on 3.2M+ opportunities from enterprise sales organizations (2022-2024). 
              <span className="text-gray-600">Methodology available upon request.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="text-2xl font-bold mb-4">Adrata</div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                The Leader in Buyer Group Intelligence. Solving the Buyer Gap Problem for Enterprise Sales Teams.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link href="/platform" className="text-gray-300 hover:text-white transition-colors">Platform</Link></li>
                <li><Link href="/demo" className="text-gray-300 hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/company" className="text-gray-300 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/careers" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                <li><Link href="/support" className="text-gray-300 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/documentation" className="text-gray-300 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/system-status" className="text-gray-300 hover:text-white transition-colors">System Status</Link></li>
                <li><Link href="/security" className="text-gray-300 hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Adrata. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 