"use client";

import React from 'react';
import PasswordProtection from '../../PasswordProtection';
import Link from 'next/link';

export default function UtilityCommunicationsBuyerGroupPage() {
  return (
    <PasswordProtection correctPassword="TOPEngineersPlus-2025">
      <div className="min-h-screen bg-[var(--background)]" style={{ overflowY: 'auto', height: '100vh' }}>
        {/* Header */}
        <header className="border-b border-[var(--border)]">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-medium text-black">Adrata Intelligence</h1>
              
              <div className="flex items-center space-x-4">
                <Link 
                  href="/private/TOP/summary" 
                  className="text-sm text-[var(--muted)] hover:text-black transition-colors"
                >
                  ← Back to Summary
                </Link>
                <Link 
                  href="/" 
                  className="text-sm text-[var(--muted)] hover:text-black transition-colors"
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
              Use Case #1: Utility Communications Buyer Group Research
            </h1>
            <p className="text-xl text-[var(--muted)] mb-8">
              Strategic Analysis for Idaho Power Company: Communications Infrastructure Buyer Group Intelligence
            </p>
            
            <div className="flex flex-wrap gap-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium">Real Data Verified</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium">Utility Context Applied</span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 text-sm font-medium">Employment Verification</span>
            </div>
          </div>

          {/* User Request */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6">User Request in AI Right Panel</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
              <p className="text-blue-800 italic text-lg leading-relaxed">
                "I'm working with Idaho Power Company and need to find their communications engineering buyer group. 
                They're looking at upgrading their critical infrastructure communications systems. Who are the key 
                decision makers I should be talking to?"
              </p>
            </div>
          </section>

          {/* System Response */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6">Unified System Response</h2>
            
            <div className="space-y-8">
              <div className="bg-[var(--panel-background)] p-6">
                <h3 className="text-xl font-bold text-black mb-4">Company Context</h3>
                <p className="text-gray-700 text-lg">
                  <strong>Idaho Power Company</strong> (P.O. Box 70, Boise, ID 83707) - Major utility serving Idaho and Oregon
                </p>
                <p className="text-sm text-[var(--muted)] mt-2">
                  <strong>Data Source:</strong> Production database - Real company verified ✅
                </p>
              </div>

              <div className="bg-[var(--panel-background)] p-6">
                <h3 className="text-xl font-bold text-black mb-4">Existing Contacts Found</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="font-bold text-black">Adam Mattson</p>
                    <p className="text-gray-700">amattson@idahopower.com (✅ Verified in database)</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="font-bold text-black">Greg Frankamp</p>
                    <p className="text-gray-700">gfrankamp@idahopower.com (✅ Verified in database, Phone: (208) 388-2120)</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)] mt-4">
                  <strong>Data Source:</strong> Production database query - Real TOP contacts confirmed
                </p>
              </div>

              <div className="bg-[var(--panel-background)] p-6">
                <h3 className="text-xl font-bold text-black mb-4">Buyer Group Intelligence</h3>
                <p className="text-[var(--muted)] mb-4">Generated using TOP's context model for utility communications:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[var(--background)] p-4 border border-[var(--border)]">
                    <h4 className="font-bold text-black mb-2">Technical Decision Maker</h4>
                    <p className="text-gray-700 text-sm">Communications Engineer or System Engineer</p>
                  </div>
                  <div className="bg-[var(--background)] p-4 border border-[var(--border)]">
                    <h4 className="font-bold text-black mb-2">Budget Authority</h4>
                    <p className="text-gray-700 text-sm">Engineering Manager or Operations Manager</p>
                  </div>
                  <div className="bg-[var(--background)] p-4 border border-[var(--border)]">
                    <h4 className="font-bold text-black mb-2">End User Champion</h4>
                    <p className="text-gray-700 text-sm">Field Operations or Maintenance Supervisor</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sources Used */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-black mb-6">Data Sources & Verification</h2>
            
            <div className="bg-green-50 border border-green-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-green-800 mb-3">Primary Sources</h4>
                  <ul className="text-green-700 space-y-1">
                    <li>• Production Database (100% confidence)</li>
                    <li>• CoreSignal B2B Intelligence (90% confidence)</li>
                    <li>• DropContact Email Validation (95% confidence)</li>
                    <li>• TOP Utility Context Model (98% confidence)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-bold text-green-800 mb-3">Quality Assurance</h4>
                  <ul className="text-green-700 space-y-1">
                    <li>• All contacts verified in database</li>
                    <li>• Professional email domains confirmed</li>
                    <li>• Phone numbers validated where available</li>
                    <li>• Company information cross-referenced</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-[var(--border)] pt-8">
            <div className="flex justify-between items-center">
              <p className="text-sm text-[var(--muted)]">
                Report generated: December 19, 2024 | Data verified: Real TOP production database
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
