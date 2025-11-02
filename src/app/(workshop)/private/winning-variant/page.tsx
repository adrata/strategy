"use client";

import React from 'react';
import PasswordProtection from './PasswordProtection';
import Link from 'next/link';

export default function WinningVariantPage() {
  return (
    <PasswordProtection correctPassword="WinningVariant-2025">
      <div className="min-h-screen bg-background" style={{ overflowY: 'auto', height: '100vh' }}>
        {/* Header */}
        <header className="border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-semibold text-foreground">Winning Variant Intelligence</h1>
              
              {/* Navigation Links */}
              <div className="flex items-center space-x-6">
                <Link 
                  href="/" 
                  className="text-sm text-gray-700 hover:text-foreground transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/platform" 
                  className="text-sm text-gray-700 hover:text-foreground transition-colors"
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
              Winning Variant Buyer Group Intelligence
            </h1>
            <p className="text-xl text-muted mb-8">
              Strategic Analysis for AI Impact Visibility Platform: Comprehensive Buyer Group Intelligence for Your Target Companies
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Executive Summary</h2>
              <p className="text-gray-700 mb-4">
                We found the <strong>exact people</strong> who matter at your 4 target companies. Out of <strong>15,000+ employees</strong>, only <strong>40 people</strong> can actually buy your AI Impact Visibility platform. We know who they are, what they care about, and how to win them.
              </p>
              <p className="text-gray-700">
                <strong>Without us:</strong> You'll spend months researching thousands of people, waste time on the wrong contacts, and lose deals to competitors who know the real decision makers. <strong>With us:</strong> You get the exact 40 people who matter, their pain points, influence scores, and the exact strategies to close them.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prepared For</p>
                  <p className="text-sm font-semibold text-gray-900">Winning Variant Leadership Team</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Target Companies</p>
                  <p className="text-sm font-semibold text-gray-900">4 Strategic Prospects</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prepared By</p>
                  <p className="text-sm font-semibold text-gray-900">Adrata Sales Intelligence Team</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Strategic Focus</p>
                  <p className="text-sm font-semibold text-gray-900">C-Suite Level Engagement</p>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-6">Executive Summary</h2>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              We've conducted comprehensive buyer group intelligence analysis for your four target companies, 
              providing detailed insights into their decision-making structures, key stakeholders, and optimal 
              engagement strategies. This intelligence will accelerate your sales process and increase your 
              win rates.
            </p>

            <div className="bg-panel-background border border-border p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-black mb-3">Strategic Intelligence Advantage</h3>
              <p className="text-gray-700 mb-4">
                We've identified the exact buyer group structure for each of your target companies, saving you 
                months of research and guesswork. Our intelligence reveals the specific decision-makers, their 
                influence patterns, and the precise engagement sequence needed for successful deal closure.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-black mb-2">What We Know:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Exact C-Suite decision-making hierarchy for each company</li>
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

            {/* Strategic Insights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-panel-background p-4 rounded-lg text-center border border-border">
                <div className="text-3xl font-bold text-black">40</div>
                <div className="text-sm text-muted">Precision Buyer Group</div>
              </div>
              <div className="bg-panel-background p-4 rounded-lg text-center border border-border">
                <div className="text-3xl font-bold text-black">15,000+</div>
                <div className="text-sm text-muted">Total Employees</div>
              </div>
              <div className="bg-panel-background p-4 rounded-lg text-center border border-border">
                <div className="text-3xl font-bold text-black">98%</div>
                <div className="text-sm text-muted">Strategic Relevance</div>
              </div>
              <div className="bg-panel-background p-4 rounded-lg text-center border border-border">
                <div className="text-3xl font-bold text-black">$15M+</div>
                <div className="text-sm text-muted">Combined AI Budgets</div>
              </div>
            </div>
          </section>

          {/* Company Cards */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-8">Target Company Intelligence Reports</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Match Group */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Match Group</h3>
                    <p className="text-sm text-gray-600 mb-2">Online Dating Platform Owner</p>
                    <p className="text-xs text-gray-500">mtch.com • 3,000+ employees</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">10</div>
                    <div className="text-xs text-gray-500">Precision Buyer Group</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">2</div>
                    <div className="text-xs text-gray-500">Decision Makers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">3</div>
                    <div className="text-xs text-gray-500">Champions</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">3</div>
                    <div className="text-xs text-gray-500">Stakeholders</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">1</div>
                    <div className="text-xs text-gray-500">Blockers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">1</div>
                    <div className="text-xs text-gray-500">Introducers</div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-4">
                  <strong>Scale Challenge:</strong> 3,000+ employees → We found the exact 10 who matter
                  <br/><br/>
                  <strong>Key Insight:</strong> 8 people actively struggling with AI ROI measurement - need to prove ML models drive subscription growth, not just matching accuracy.
                </p>
                
                <Link 
                  href="/private/winning-variant/match-group"
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 hover:text-white transition-colors"
                >
                  View Match Group Report →
                </Link>
              </div>

              {/* Brex */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Brex</h3>
                    <p className="text-sm text-gray-600 mb-2">FinTech Corporate Cards</p>
                    <p className="text-xs text-gray-500">brex.com • 1,000-5,000 employees</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">12</div>
                    <div className="text-xs text-gray-500">Precision Buyer Group</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">2</div>
                    <div className="text-xs text-gray-500">Decision Makers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">4</div>
                    <div className="text-xs text-gray-500">Champions</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">4</div>
                    <div className="text-xs text-gray-500">Stakeholders</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">1</div>
                    <div className="text-xs text-gray-500">Blockers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">1</div>
                    <div className="text-xs text-gray-500">Introducers</div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-4">
                  <strong>Scale Challenge:</strong> 1,000+ employees → We found the exact 12 who matter
                  <br/><br/>
                  <strong>Key Insight:</strong> 8 people actively struggling with AI ROI measurement - need to prove ML models drive revenue and reduce costs, not just improve detection accuracy.
                </p>
                
                <Link 
                  href="/private/winning-variant/brex"
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 hover:text-white transition-colors"
                >
                  View Brex Report →
                </Link>
              </div>

              {/* First Premier Bank */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">First Premier Bank</h3>
                    <p className="text-sm text-gray-600 mb-2">Regional Banking</p>
                    <p className="text-xs text-gray-500">firstpremier.com • 1000-5000 employees</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">8</div>
                    <div className="text-xs text-gray-500">Buyer Group Members</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">2</div>
                    <div className="text-xs text-gray-500">Decision Makers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">3</div>
                    <div className="text-xs text-gray-500">Champions</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">2</div>
                    <div className="text-xs text-gray-500">Stakeholders</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">1</div>
                    <div className="text-xs text-gray-500">Blockers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">Introducers</div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-4">
                  <strong>Scale Challenge:</strong> 1,000-5,000 employees → We found the exact 8 who matter
                  <br/><br/>
                  <strong>Key Insight:</strong> 6 people actively struggling with AI ROI measurement - need to prove ML models drive fraud detection accuracy and reduce credit losses, not just improve detection rates.
                </p>
                
                <Link 
                  href="/private/winning-variant/first-premier-bank"
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 hover:text-white transition-colors"
                >
                  View First Premier Report →
                </Link>
              </div>

              {/* Zuora */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Zuora</h3>
                    <p className="text-sm text-gray-600 mb-2">Subscription Management Platform</p>
                    <p className="text-xs text-gray-500">zuora.com • 1000-5000 employees</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">8</div>
                    <div className="text-xs text-gray-500">Buyer Group Members</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">2</div>
                    <div className="text-xs text-gray-500">Decision Makers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">3</div>
                    <div className="text-xs text-gray-500">Champions</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">2</div>
                    <div className="text-xs text-gray-500">Stakeholders</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">1</div>
                    <div className="text-xs text-gray-500">Blockers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">Introducers</div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-4">
                  <strong>Scale Challenge:</strong> 1,000-5,000 employees → We found the exact 8 who matter
                  <br/><br/>
                  <strong>Key Insight:</strong> 5 people actively struggling with subscription analytics - need to prove ML models drive churn prediction accuracy and revenue optimization, not just improve forecasting metrics.
                </p>
                
                <Link 
                  href="/private/winning-variant/zuora"
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 hover:text-white transition-colors"
                >
                  View Zuora Report →
                </Link>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="bg-panel-background border border-border rounded-lg p-8 text-center">
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
    </PasswordProtection>
  );
}
