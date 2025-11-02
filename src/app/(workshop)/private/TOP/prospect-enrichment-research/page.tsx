"use client";

import React from 'react';
import PasswordProtection from '../../PasswordProtection';
import Link from 'next/link';

export default function ProspectEnrichmentResearchPage() {
  return (
    <PasswordProtection correctPassword="TOPEngineersPlus-2025">
      <div className="min-h-screen bg-background" style={{ overflowY: 'auto', height: '100vh' }}>
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-medium text-black">Adrata Intelligence</h1>
              
              <div className="flex items-center space-x-4">
                <Link 
                  href="/private/TOP/summary" 
                  className="text-sm text-muted hover:text-black transition-colors"
                >
                  ← Back to Summary
                </Link>
                <Link 
                  href="/" 
                  className="text-sm text-muted hover:text-black transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="https://calendly.com/justin-johnson/top-engineers-plus-demo"
                  className="bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Schedule Demo
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
              Use Case #2: Prospect Enrichment Research
            </h1>
            <p className="text-xl text-muted mb-8">
              Strategic Analysis for Chris Mantle at Puget Sound Energy: Complete Profile Intelligence
            </p>
            
            <div className="flex flex-wrap gap-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium">Real Contact Verified</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium">Employment Verified</span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 text-sm font-medium">Professional Email</span>
            </div>
          </div>

          {/* User Request */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6">User Request in AI Right Panel</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
              <p className="text-blue-800 italic text-lg leading-relaxed">
                "I have a contact named Chris Mantle at Puget Sound Energy. Can you tell me more about him? 
                I want to understand his role, background, and how he fits into their communications infrastructure 
                decision-making process."
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6">Contact Found in Database</h2>
            
            <div className="bg-panel-background p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-black mb-4">Verified Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Name:</span>
                      <span>Chris Mantle (✅ Verified in production database)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span>chris.mantle@pse.com (✅ Professional email confirmed)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Phone:</span>
                      <span>(425) 248-5632 (✅ Available for validation)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Company:</span>
                      <span>Puget Sound Energy (✅ Confirmed in database)</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-black mb-4">Engagement History</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Current Status:</span>
                      <span>Opportunity stage (High engagement)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Conference:</span>
                      <span>UTC 9 attendee</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Location:</span>
                      <span>9515 Willows Rd NE, Redmond, WA 98052</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-green-100 border border-green-200">
                <p className="text-sm text-green-700">
                  <strong>Data Sources:</strong> Production database + DropContact email validation
                </p>
              </div>
            </div>
          </section>

          {/* Employment Verification */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6">Employment Verification</h2>
            
            <div className="bg-green-50 border border-green-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-green-500 rounded-full mr-3"></div>
                <span className="text-lg font-bold text-green-800">VERIFIED CURRENT EMPLOYEE</span>
              </div>
              <p className="text-green-700 leading-relaxed">
                Verified through multiple sources as of September 2025. Chris Mantle is currently 
                employed at Puget Sound Energy in their engineering division.
              </p>
              <p className="text-sm text-green-600 mt-4">
                <strong>Verification Source:</strong> Perplexity Pro real-time web intelligence with citations
              </p>
            </div>
          </section>

          {/* Role Analysis */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6">Role & Responsibility Analysis</h2>
            
            <div className="bg-panel-background p-6">
              <p className="text-muted mb-6">Based on PSE organizational structure and utility industry patterns:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-black mb-3">Likely Role & Authority</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Likely Role:</strong> Communications Engineer or System Engineer</li>
                    <li>• <strong>Department:</strong> Engineering/Operations</li>
                    <li>• <strong>Decision Authority:</strong> Technical influence (Medium-High)</li>
                    <li>• <strong>Budget Authority:</strong> Recommender/Influencer</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-black mb-3">Project Involvement</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Infrastructure modernization projects</li>
                    <li>• Communications system upgrades</li>
                    <li>• Technology vendor evaluation</li>
                    <li>• Technical specification development</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Company Context */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6">Company Context - Puget Sound Energy</h2>
            
            <div className="bg-blue-50 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-blue-800 mb-3">Company Profile</h4>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Major utility serving Washington state</li>
                    <li>• Focus on grid modernization and smart infrastructure</li>
                    <li>• Active in renewable energy integration</li>
                    <li>• Known for technology adoption in utility operations</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-blue-800 mb-3">Strategic Context</h4>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Regulatory environment: Washington Utilities Commission</li>
                    <li>• Investment focus: Infrastructure resilience</li>
                    <li>• Technology priorities: Communications reliability</li>
                    <li>• Market position: Leading regional utility</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Recommended Approach */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-black mb-6">Recommended Approach</h2>
            
            <div className="bg-orange-50 border border-orange-200 p-6">
              <ol className="space-y-3 text-orange-800">
                <li className="flex items-start">
                  <span className="bg-orange-200 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                  <span>Reference UTC 9 conference for warm opening</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-orange-200 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                  <span>Focus on PSE's grid modernization initiatives</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-orange-200 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                  <span>Discuss communications infrastructure reliability</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-orange-200 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                  <span>Ask about current technology challenges</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-orange-200 text-orange-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                  <span>Position TOP's critical infrastructure expertise</span>
                </li>
              </ol>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-border pt-8">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted">
                Report generated: December 19, 2024 | Contact verified: Real TOP production database
              </p>
              <Link 
                href="/private/TOP/summary"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Summary
              </Link>
            </div>
          </footer>
        </main>
      </div>
    </PasswordProtection>
  );
}
