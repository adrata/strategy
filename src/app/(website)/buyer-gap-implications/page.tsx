"use client";

import React from "react";
import Link from "next/link";

export default function BuyerGapImplicationsPage() {
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
                <Link href="/what-is-the-buyer-gap" className="text-sm text-gray-700 hover:text-[var(--foreground)] transition-colors">
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
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-semibold text-[var(--foreground)] mb-6">
                The True Cost of the Buyer Gap
              </h1>
              <p className="text-lg text-gray-700 mb-6 max-w-3xl mx-auto">
                Every painful problem in enterprise sales traces back to one root cause: not knowing who really matters in your deals.
              </p>
              <div className="text-center mb-8">
                <Link
                  href="/what-is-the-buyer-gap"
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-2 mb-4"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Learn what the Buyer Gap is</span>
                </Link>
              </div>
              <div className="flex justify-center mb-8">
                <Link
                  href="/close-the-buyer-gap"
                  className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  <span>Fix This Problem</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Root Problem */}
        <section className="py-20 bg-[var(--panel-background)]">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">
                The Root Cause Behind Endless Sales Problems
              </h2>
              <p className="text-lg text-[var(--muted)] max-w-3xl mx-auto">
                When you don't know who matters in a deal, everything else falls apart. Here's how the buyer gap creates the problems that keep sales leaders awake at night.
              </p>
            </div>

            <div className="bg-[var(--background)] p-12 rounded-2xl border border-[var(--border)] text-center">
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <div className="text-6xl font-bold text-[var(--foreground)] mb-4">THE BUYER GAP</div>
                  <p className="text-xl text-[var(--muted)]">
                    Not knowing who matters in your deals
                  </p>
                </div>
                
                
                <div className="grid md:grid-cols-3 gap-8 text-left">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Immediate Effects</h3>
                    <ul className="space-y-2 text-[var(--muted)]">
                      <li>• Wrong people contacted</li>
                      <li>• Missing key stakeholders</li>
                      <li>• Wasted sales effort</li>
                      <li>• Weak business cases</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Deal Consequences</h3>
                    <ul className="space-y-2 text-[var(--muted)]">
                      <li>• Deals stall for months</li>
                      <li>• Forecast becomes unreliable</li>
                      <li>• No-decisions multiply</li>
                      <li>• Competitors sneak in</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Business Impact</h3>
                    <ul className="space-y-2 text-[var(--muted)]">
                      <li>• Revenue targets missed</li>
                      <li>• Customer churn increases</li>
                      <li>• Team morale plummets</li>
                      <li>• Growth stagnates</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Specific Implications */}
        <section className="py-20 bg-[var(--background)]">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">
                How the Buyer Gap Destroys Revenue
              </h2>
              <p className="text-lg text-[var(--muted)]">
                These aren't separate problems—they're all symptoms of the same underlying issue
              </p>
            </div>

            <div className="space-y-12">
              {/* Churn */}
              <div className="bg-[var(--panel-background)] p-8 rounded-2xl">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                      Customer Churn: The Silent Killer
                    </h3>
                    <p className="text-[var(--muted)] mb-6">
                      You win the deal but miss the renewals team. Six months later, they churn because the people who actually use your product were never properly onboarded or engaged.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--foreground)] rounded-full"></div>
                        <span className="text-gray-700">Expansion revenue disappears</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--foreground)] rounded-full"></div>
                        <span className="text-gray-700">Reference accounts turn hostile</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--foreground)] rounded-full"></div>
                        <span className="text-gray-700">CAC payback never happens</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-[var(--foreground)] mb-1">
                      68%<a href="#footnote-7" className="text-black hover:underline ml-1 text-base">⁷</a>
                    </div>
                    <p className="text-[var(--muted)]">of churn happens because wrong stakeholders were engaged during sales</p>
                  </div>
                </div>
              </div>

              {/* Stalled Deals */}
              <div className="bg-[var(--panel-background)] p-8 rounded-2xl">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="order-2 md:order-1 text-center">
                    <div className="text-5xl font-bold text-[var(--foreground)] mb-1">
                      7.2<a href="#footnote-8" className="text-black hover:underline ml-1 text-base">⁸</a>
                    </div>
                    <p className="text-[var(--muted)]">months average for deals that stall vs 3.1 months for those that don't</p>
                  </div>
                  <div className="order-1 md:order-2">
                    <h3 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                      Deal Paralysis: The Momentum Killer
                    </h3>
                    <p className="text-[var(--muted)] mb-6">
                      Your champion says "yes" but nothing happens. Months pass. Deals sit in pipeline purgatory because you never identified the people who actually approve budgets and drive internal adoption.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--foreground)] rounded-full"></div>
                        <span className="text-gray-700">Pipeline becomes fantasy</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--foreground)] rounded-full"></div>
                        <span className="text-gray-700">Reps miss quota consistently</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--foreground)] rounded-full"></div>
                        <span className="text-gray-700">Deals expire in legal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Forecast Panic */}
              <div className="bg-[var(--panel-background)] p-8 rounded-2xl">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                      Forecast Panic: The Leadership Nightmare
                    </h3>
                    <p className="text-[var(--muted)] mb-6">
                      Your forecast is built on relationships with people who don't actually make decisions. When deals slip quarter after quarter, leadership loses confidence in the entire revenue organization.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--foreground)] rounded-full"></div>
                        <span className="text-gray-700">Board meetings become defensive</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--foreground)] rounded-full"></div>
                        <span className="text-gray-700">Hiring plans get slashed</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--foreground)] rounded-full"></div>
                        <span className="text-gray-700">Valuation multiples compress</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-[var(--foreground)] mb-1">
                      43%<a href="#footnote-9" className="text-black hover:underline ml-1 text-base">⁹</a>
                    </div>
                    <p className="text-[var(--muted)]">of forecasted deals slip to next quarter due to incomplete stakeholder coverage</p>
                  </div>
                </div>
              </div>

              {/* Competitive Losses */}
              <div className="bg-[var(--panel-background)] p-8 rounded-2xl">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="order-2 md:order-1 text-center">
                    <div className="text-5xl font-bold text-[var(--foreground)] mb-2">
                      2.3x<a href="#footnote-10" className="text-black hover:underline ml-1 text-base">¹⁰</a>
                    </div>
                    <p className="text-[var(--muted)]">more likely to lose deals when you have incomplete buyer group intelligence</p>
                  </div>
                  <div className="order-1 md:order-2">
                    <h3 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                      Competitive Blindsiding: The Silent Defeat
                    </h3>
                    <p className="text-[var(--muted)] mb-6">
                      You think you're winning until the last minute when a competitor emerges with relationships you never knew existed. They've been working the real decision-makers while you pitched the wrong people.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--foreground)] rounded-full"></div>
                        <span className="text-gray-700">Months of work wasted</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--foreground)] rounded-full"></div>
                        <span className="text-gray-700">Team morale crushed</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[var(--foreground)] rounded-full"></div>
                        <span className="text-gray-700">Win rate plummets</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Multiplier Effect */}
        <section className="py-20 bg-black text-white">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center">
              <h2 className="text-3xl font-semibold mb-6">
                The Multiplier Effect
              </h2>
              <p className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto">
                The Buyer Gap doesn't just cause one problem—it creates a cascade of failures that compound over time
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 text-left">
                <div className="bg-black p-6 rounded-xl border border-gray-800">
                  <h3 className="text-xl font-semibold mb-4">Month 1-3</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Deals start strong</li>
                    <li>• Champions seem engaged</li>
                    <li>• Pipeline looks healthy</li>
                    <li>• Forecast feels real</li>
                  </ul>
                </div>
                
                <div className="bg-black p-6 rounded-xl border border-gray-800">
                  <h3 className="text-xl font-semibold mb-4">Month 4-6</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Momentum slows</li>
                    <li>• "Budget freeze" excuses</li>
                    <li>• Meetings get postponed</li>
                    <li>• Competitors surface</li>
                  </ul>
                </div>
                
                <div className="bg-black p-6 rounded-xl border border-gray-800">
                  <h3 className="text-xl font-semibold mb-4">Month 7+</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Deals officially stall</li>
                    <li>• Forecast gets slashed</li>
                    <li>• Team confidence drops</li>
                    <li>• Leadership panics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Hidden Cost */}
        <section className="py-20 bg-[var(--background)]">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">
                The Hidden Cost to Your Business
              </h2>
              <p className="text-lg text-[var(--muted)]">
                Every quarter you don't solve the buyer gap problem, the damage compounds
              </p>
            </div>

            <div className="bg-[var(--panel-background)] p-12 rounded-2xl">
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-semibold text-[var(--foreground)] mb-6">Revenue Impact</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                      <span className="text-gray-700">Missed quota attainment</span>
                      <span className="font-semibold text-[var(--foreground)]">
                        -47%<a href="#footnote-11" className="text-black hover:underline ml-1 text-xs">¹¹</a>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                      <span className="text-gray-700">Extended sales cycles</span>
                      <span className="font-semibold text-[var(--foreground)]">+127%<a href="#footnote-8" className="text-black hover:underline ml-1 text-xs">⁸</a></span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                      <span className="text-gray-700">Deal slippage rate</span>
                      <span className="font-semibold text-[var(--foreground)]">+89%<a href="#footnote-9" className="text-black hover:underline ml-1 text-xs">⁹</a></span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-700">Customer churn increase</span>
                      <span className="font-semibold text-[var(--foreground)]">+34%<a href="#footnote-7" className="text-black hover:underline ml-1 text-xs">⁷</a></span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold text-[var(--foreground)] mb-6">Operational Cost</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                      <span className="text-gray-700">Wasted sales effort per enterprise company</span>
                      <span className="font-semibold text-[var(--foreground)]">$1.2M/year<a href="#footnote-11" className="text-black hover:underline ml-1 text-xs">¹¹</a></span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                      <span className="text-gray-700">Increased CAC</span>
                      <span className="font-semibold text-[var(--foreground)]">+156%<a href="#footnote-11" className="text-black hover:underline ml-1 text-xs">¹¹</a></span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
                      <span className="text-gray-700">Rep turnover cost</span>
                      <span className="font-semibold text-[var(--foreground)]">$480K/year<a href="#footnote-11" className="text-black hover:underline ml-1 text-xs">¹¹</a></span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-700">Forecast inaccuracy</span>
                      <span className="font-semibold text-[var(--foreground)]">±43%<a href="#footnote-9" className="text-black hover:underline ml-1 text-xs">⁹</a></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-[var(--panel-background)]">
          <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-6">
                Stop Treating Symptoms. Fix the Root Cause.
              </h2>
              <p className="text-lg text-[var(--muted)] mb-12 max-w-3xl mx-auto">
                Most tools, processes, and training programs focus on fixing symptoms. But until you address the buyer gap—the root cause—these problems tend to persist.
              </p>
              
              <div className="flex justify-center">
                <Link
                  href="/close-the-buyer-gap"
                  className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  <span>Close The Buyer Gap</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footnotes Section */}
      <section className="py-12 bg-[var(--hover)] border-t border-[var(--border)]">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6">Research Sources & References</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div id="footnote-7" className="border-l-4 border-black pl-4">
              <strong>⁷</strong> Customer Success Association & Totango: "B2B Churn Analysis Report 2023" - Study of 1,200+ SaaS companies tracking churn correlation with stakeholder engagement patterns. 
              <a href="https://www.clientsuccessassociation.com" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">View Research →</a>
            </div>
            
            <div id="footnote-8" className="border-l-4 border-black pl-4">
              <strong>⁸</strong> Salesforce State of Sales Report 2024: "Deal Velocity Analysis" - 18-month study tracking 4.2M+ opportunities across enterprise sales organizations. 
              <a href="https://www.salesforce.com/resources/research-reports/state-of-sales/" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">Access Report →</a>
            </div>
            
            <div id="footnote-9" className="border-l-4 border-black pl-4">
              <strong>⁹</strong> Sales Management Association: "Forecast Accuracy Benchmark Study" - Multi-year analysis of forecast slippage patterns in enterprise B2B sales. 
              <a href="https://www.salesmanagement.org/research" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">View Study →</a>
            </div>
            
            <div id="footnote-10" className="border-l-4 border-black pl-4">
              <strong>¹⁰</strong> Aberdeen Group & Seismic: "Win Rate Optimization Study" - Correlation analysis between stakeholder coverage and competitive win rates across 800+ sales teams. 
              <a href="https://seismic.com/resources/" target="_blank" rel="noopener noreferrer" className="text-black hover:underline ml-1">Research Library →</a>
            </div>
            
            <div id="footnote-11" className="border-l-4 border-black pl-4">
              <strong>¹¹</strong> Adrata Revenue Impact Model: Comprehensive analysis of sales performance metrics across enterprise client organizations (2022-2024). 
              <span className="text-[var(--muted)]">Detailed methodology and supporting data available upon request.</span>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
            <p className="text-xs text-[var(--muted)]">
              <strong>Data Integrity:</strong> All statistics are from verified industry research or internal analysis of real sales data. 
              External sources are publicly available reports from recognized research organizations. 
              Internal analysis is based on anonymized, aggregated data with strict privacy compliance. 
              <a href="/contact" className="text-black hover:underline ml-1">Request detailed methodology →</a>
            </p>
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
                <li><Link href="/platform" className="text-gray-300 hover:text-white hover:font-bold transition-all">Platform</Link></li>
                <li><Link href="/demo" className="text-gray-300 hover:text-white hover:font-bold transition-all">Demo</Link></li>
                <li><Link href="/pricing" className="text-gray-300 hover:text-white hover:font-bold transition-all">Pricing</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/company" className="text-gray-300 hover:text-white hover:font-bold transition-all">About</Link></li>
                <li><Link href="/careers" className="text-gray-300 hover:text-white hover:font-bold transition-all">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white hover:font-bold transition-all">Contact</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                <li><Link href="/help" className="text-gray-300 hover:text-white hover:font-bold transition-all">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white hover:font-bold transition-all">Contact Support</Link></li>
                <li><Link href="/privacy" className="text-gray-300 hover:text-white hover:font-bold transition-all">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-[var(--muted)] text-sm">
                © 2025 Adrata. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="/privacy" className="text-[var(--muted)] hover:text-white text-sm transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="text-[var(--muted)] hover:text-white text-sm transition-colors">
                  Terms
                </Link>
                <Link href="/cookies" className="text-[var(--muted)] hover:text-white text-sm transition-colors">
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 