"use client";

import React from 'react';
import Link from 'next/link';

export default function ModernLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-white text-xl font-bold">Adrata</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/what-is-the-buyer-gap" className="text-gray-300 hover:text-white transition-colors">
              Buyer Gap
            </Link>
            <Link href="/platform" className="text-gray-300 hover:text-white transition-colors">
              Platform
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/sign-in" className="text-gray-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/demo" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
              Get Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Changed to white background */}
      <main className="relative z-10 px-4 py-20 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-[var(--foreground)] mb-6">
            Find Your Buyer Group
            <span className="block text-blue-500">in Seconds</span>
          </h1>
          <p className="text-xl text-[var(--muted)] mb-8 max-w-3xl mx-auto">
            Stop guessing who makes the decisions. Enter any company name and instantly 
            discover the complete buyer group, decision-makers, and stakeholders for your next deal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/find-your-buyer-group" className="bg-black text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-gray-800 transition-colors">
              Find Your Buyer Group →
            </Link>
            <Link href="/demo" className="border border-[var(--border)] text-gray-700 px-8 py-3 rounded-md text-lg font-semibold hover:bg-[var(--panel-background)] transition-colors">
              Watch Demo
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 px-4 py-20 bg-[var(--foreground)]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Leader in Buyer Group Intelligence
            </h2>
            <p className="text-xl text-gray-300">
              Decode complex buyer dynamics in enterprise sales
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 p-8 rounded-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Instant Buyer Mapping
              </h3>
              <p className="text-gray-300">
                Enter any company name and get the complete buyer group structure with roles, 
                influence levels, and decision-making power.
              </p>
            </div>

            <div className="bg-gray-800/50 p-8 rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Real-Time Intelligence
              </h3>
              <p className="text-gray-300">
                Get up-to-date information on org changes, new hires, and shifting 
                dynamics that impact your deals.
              </p>
            </div>

            <div className="bg-gray-800/50 p-8 rounded-lg">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                AI-Powered Insights
              </h3>
              <p className="text-gray-300">
                Advanced AI analyzes communication patterns, org charts, and market signals 
                to reveal hidden buyer relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Sales Process?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of sales professionals who use Adrata to identify and engage 
            the right buyers from day one.
          </p>
          <Link href="/demo" className="bg-blue-500 text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-blue-600 transition-colors">
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-12 bg-[var(--foreground)]/80">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-white text-xl font-bold">Adrata</span>
              </div>
              <p className="text-[var(--muted)]">
                The Leader in buyer group intelligence. Decode complex buyer dynamics in enterprise sales.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/platform" className="text-[var(--muted)] hover:text-white transition-colors">Platform</Link></li>
                <li><Link href="/demo" className="text-[var(--muted)] hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="/pricing" className="text-[var(--muted)] hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-[var(--muted)] hover:text-white transition-colors">About</Link></li>
                <li><Link href="/careers" className="text-[var(--muted)] hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="text-[var(--muted)] hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help-center" className="text-[var(--muted)] hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/documentation" className="text-[var(--muted)] hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/support" className="text-[var(--muted)] hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-[var(--muted)]">
              © 2025 Adrata Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 