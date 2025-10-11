"use client";

import React from "react";
import Link from "next/link";

export default function WhatIsTheBuyerGapPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="bg-[var(--background)] border-b border-[var(--border)]">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-12">
              <Link href="/" className="text-xl font-medium text-[var(--foreground)]">
                Adrata
              </Link>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-6">
                <Link href="/what-is-the-buyer-gap" className="text-sm text-[var(--foreground)] font-semibold">
                  Buyer Gap
                </Link>
                <Link href="/platform" className="text-sm text-gray-700 hover:text-[var(--foreground)] transition-colors">
                  Platform
                </Link>
                <Link href="/pricing" className="text-sm text-gray-700 hover:text-[var(--foreground)] transition-colors">
                  Pricing
                </Link>
                <Link href="/company" className="text-sm text-gray-700 hover:text-[var(--foreground)] transition-colors">
                  Company
                </Link>
              </nav>
            </div>

            {/* Sign In and CTA Button */}
            <div className="flex items-center space-x-4">
              <Link href="/sign-in" className="text-sm text-gray-700 hover:text-[var(--foreground)] transition-colors">
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
        <section className="py-32 bg-[var(--background)]">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl font-semibold text-[var(--foreground)] mb-6">
                What is the Buyer Gap?
              </h1>
              <p className="text-xl text-[var(--muted)] mb-6 max-w-3xl">
                The Buyer Gap is the critical gap between knowing who matters in your deals—and who doesn't.
              </p>
              <p className="text-lg text-[var(--muted)] mb-8 max-w-3xl">
                The tools we've bought over the years have been in an effort to close that gap. And while they helped with symptoms, none addressed the root cause.
              </p>
              <div className="flex">
                <Link
                  href="/close-the-buyer-gap"
                  className="bg-[var(--background)] text-black border border-black px-8 py-3 rounded-lg font-medium hover:bg-[var(--panel-background)] transition-colors inline-flex items-center space-x-2 no-override"
                >
                  <span>Close Your Buyer Gap</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Definition Section */}
        <section className="py-20 bg-[var(--panel-background)]">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">
                The Universal Challenge in Complex Sales
              </h2>
              <p className="text-lg text-[var(--muted)]">
                Every sales organization faces the same invisible challenge
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                  The Distance
                </h3>
                <p className="text-[var(--muted)]">
                  Between who sellers contact and who actually controls the deal
                </p>
              </div>
              <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                  The Blindspot
                </h3>
                <p className="text-[var(--muted)]">
                  Between sales activity and true buyer influence
                </p>
              </div>
              <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">
                  The Gap
                </h3>
                <p className="text-[var(--muted)]">
                  Between knowing who matters in a deal—and who doesn't
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <h3 className="text-2xl font-semibold text-[var(--foreground)] mb-6 text-center">
                Where Deals Get Stuck: Working the Wrong People
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--foreground)] mb-2">85%</div>
                  <p className="text-[var(--muted)]">
                    Of top performers include Economic Buyers in their process
                  </p>
                  <div className="text-sm text-[var(--muted)] mt-2">
                    vs 8% of low performers 
                    <a href="#footnote-1" className="text-black hover:underline ml-1 text-xs">¹</a>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--foreground)] mb-2">11.7</div>
                  <p className="text-[var(--muted)]">
                    Average stakeholders involved in B2B purchasing decisions
                  </p>
                  <div className="text-sm text-[var(--muted)] mt-2">
                    2025 Gartner study
                    <a href="#footnote-2" className="text-black hover:underline ml-1 text-xs">²</a>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--foreground)] mb-2">18%</div>
                  <p className="text-[var(--muted)]">
                    Of salespeople are classified by buyers as trusted advisors
                  </p>
                  <div className="text-sm text-[var(--muted)] mt-2">
                    Who buyers respect
                    <a href="#footnote-3" className="text-black hover:underline ml-1 text-xs">³</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Case Studies Section */}
        <section className="py-20 bg-[var(--background)]">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">
                How the Buyer Gap Kills Deals
              </h2>
              <p className="text-lg text-[var(--muted)]">
                Real scenarios every sales professional recognizes
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Scenario 1 */}
              <div className="bg-[var(--panel-background)] p-8 rounded-xl border border-[var(--border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                  The "Champion" Who Wasn't
                </h3>
                <p className="text-[var(--muted)] mb-4 text-sm">
                  Sarah spent 6 months nurturing the VP of Operations who loved the demo. The deal was "95% closed" when procurement blocked it—Finance and the CFO had never been briefed. Her "champion" had no budget influence.
                </p>
                <div className="bg-[var(--background)] p-4 rounded border-l-4 border-[var(--border)]">
                  <p className="font-semibold text-[var(--foreground)] text-sm">The Buyer Gap:</p>
                  <p className="text-[var(--muted)] text-sm">Activity with users ≠ Influence with decision makers</p>
                </div>
              </div>

              {/* Scenario 2 */}
              <div className="bg-[var(--panel-background)] p-8 rounded-xl border border-[var(--border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                  The Invisible Veto Power
                </h3>
                <p className="text-[var(--muted)] mb-4 text-sm">
                  Marcus mapped the org chart and got buy-in from IT, Security, and the CTO. Contract ready to sign when Legal raised data sovereignty concerns—a blocker with absolute veto power who never appeared in any org chart.
                </p>
                <div className="bg-[var(--background)] p-4 rounded border-l-4 border-[var(--border)]">
                  <p className="font-semibold text-[var(--foreground)] text-sm">The Buyer Gap:</p>
                  <p className="text-[var(--muted)] text-sm">Org chart coverage ≠ Decision maker coverage</p>
                </div>
              </div>

              {/* Scenario 3 */}
              <div className="bg-[var(--panel-background)] p-8 rounded-xl border border-[var(--border)]">
                <div className="w-12 h-12 bg-[var(--foreground)] rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                  The Wrong Business Case
                </h3>
                <p className="text-[var(--muted)] mb-4 text-sm">
                  Jennifer built a compelling ROI case around operational efficiency. Unknown to her, the CEO's priority was customer experience, not efficiency. Her solution was seen as "nice to have" rather than "must have."
                </p>
                <div className="bg-[var(--background)] p-4 rounded border-l-4 border-[var(--border)]">
                  <p className="font-semibold text-[var(--foreground)] text-sm">The Buyer Gap:</p>
                  <p className="text-[var(--muted)] text-sm">Stakeholder priorities ≠ Economic buyer priorities</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Research Evidence Section */}
        <section className="py-20 bg-[var(--panel-background)]">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">
                The Research is Clear
              </h2>
              <p className="text-lg text-[var(--muted)]">
                Data from millions of opportunities and billions in pipeline
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-[var(--background)] p-6 rounded-xl border border-[var(--border)]">
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Buyer Behavior Study</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--muted)]">Buyers prefer to engage sellers late in process</span>
                    <span className="text-[var(--foreground)] font-bold">57%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--muted)]">Say conversations with sellers offer no value</span>
                    <span className="text-[var(--foreground)] font-bold">6x more than 2018</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--muted)]">Don't view sellers as valuable resource</span>
                    <span className="text-[var(--foreground)] font-bold">78%</span>
                  </div>
                </div>
                <p className="text-[var(--muted)] text-sm mt-4">
                  <a href="#footnote-4" className="text-black hover:underline">⁴ Korn Ferry 2021 Buyer Preferences Study</a>
                </p>
              </div>

              <div className="bg-[var(--background)] p-6 rounded-xl border border-[var(--border)]">
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Sales Performance Impact</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--muted)]">Organizations seeing longer sales cycles</span>
                    <span className="text-[var(--foreground)] font-bold">43%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--muted)]">More opportunities lost to no decision</span>
                    <span className="text-[var(--foreground)] font-bold">44%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--muted)]">Face challenges from more decision makers</span>
                    <span className="text-[var(--foreground)] font-bold">84%</span>
                  </div>
                </div>
                <p className="text-[var(--muted)] text-sm mt-4">
                  <a href="#footnote-5" className="text-black hover:underline">⁵ RAIN Group Global Sales Research</a>
                </p>
              </div>
            </div>

            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                  The Cost of the Buyer Gap
                </h3>
                <p className="text-[var(--muted)] text-lg mb-4">
                  Based on analysis of 3.2 million opportunities<a href="#footnote-6" className="text-black hover:underline ml-1 text-sm">⁶</a>:
                </p>
                <div className="text-3xl font-bold text-[var(--foreground)] mb-2">
                  $10M+<a href="#footnote-6" className="text-black hover:underline ml-1 text-base">⁶</a>
                </div>
                <p className="text-[var(--muted)]">
                  In lost revenue for typical enterprise companies due to misaligned buyer engagement
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Impact by Role Section */}
        <section className="py-20 bg-[var(--background)]">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">
                How the Buyer Gap Impacts Every Role
              </h2>
              <p className="text-lg text-[var(--muted)]">
                From the boardroom to the sales floor, everyone feels the pain
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[var(--panel-background)] p-6 rounded-xl border border-[var(--border)]">
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">CEO/CRO Pain</h3>
                <ul className="space-y-2 text-[var(--muted)] text-sm">
                  <li>• Forecasts consistently miss</li>
                  <li>• Pipeline conversion rates stagnant</li>
                  <li>• Sales cycles getting longer</li>
                  <li>• Win rates declining vs competition</li>
                  <li>• Revenue predictability broken</li>
                </ul>
              </div>

              <div className="bg-[var(--panel-background)] p-6 rounded-xl border border-[var(--border)]">
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Sales Manager Pain</h3>
                <ul className="space-y-2 text-[var(--muted)] text-sm">
                  <li>• Deals stalling in late stages</li>
                  <li>• "Sure thing" deals falling through</li>
                  <li>• Team missing quota repeatedly</li>
                  <li>• Unable to coach effectively</li>
                  <li>• Firefighting instead of strategizing</li>
                </ul>
              </div>

              <div className="bg-[var(--panel-background)] p-6 rounded-xl border border-[var(--border)]">
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Sales Rep Pain</h3>
                <ul className="space-y-2 text-[var(--muted)] text-sm">
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
        <section className="py-20 bg-[var(--panel-background)]">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-6">
                There's a Better Way
              </h2>
              <p className="text-xl text-[var(--muted)] mb-8 max-w-3xl mx-auto">
                What if you could see the complete buyer group, understand the real decision-making process, 
                and engage the right stakeholders from day one?
              </p>
              <div className="bg-[var(--background)] p-6 rounded-xl border border-[var(--border)] mb-8 max-w-3xl mx-auto">
                <p className="text-lg text-[var(--muted)] italic">
                  "86% of buyers say they're more likely to purchase when companies understand their goals, yet 59% of buyers say reps don't take the time to understand their business' unique challenges and objectives."
                </p>
                <p className="text-[var(--muted)] text-sm mt-2">- Salesforce State of Sales Report 2024</p>
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
                  className="bg-[var(--background)] text-black border border-[var(--border)] px-8 py-3 rounded-lg font-medium hover:bg-[var(--panel-background)] transition-colors"
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
      <section className="py-12 bg-[var(--hover)] border-t border-[var(--border)]">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6">References & Sources</h3>
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
              <span className="text-[var(--muted)]">Methodology available upon request.</span>
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
          <div className="border-t border-[var(--border)] pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-[var(--muted)] text-sm mb-4 md:mb-0">
              © 2025 Adrata. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-[var(--muted)] hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-[var(--muted)] hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="text-[var(--muted)] hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 