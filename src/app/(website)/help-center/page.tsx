"use client";

import React from "react";
import Link from "next/link";

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--background)] border-b border-[var(--border)]">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-12">
              <Link href="/" className="text-xl font-medium text-[var(--foreground)]">
                Adrata
              </Link>
              
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

      {/* Hero Section */}
      <section className="pt-40 pb-20 bg-[var(--background)]">
        <div className="max-w-8xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-semibold text-[var(--foreground)] mb-6">
              Help Center
            </h1>
            <p className="text-xl text-[var(--muted)] mb-8 max-w-3xl mx-auto">
              Find answers to common questions and learn how to get the most from your buyer group intelligence platform
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for help..."
                  className="w-full px-6 py-4 border border-[var(--border)] rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-20 bg-[var(--panel-background)]">
        <div className="max-w-8xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Getting Started</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Setting up your account</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">First buyer group analysis</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Understanding stakeholder maps</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Inviting team members</Link></li>
              </ul>
            </div>

            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Platform Features</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Stakeholder mapping</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Influence analysis</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Deal evolution tracking</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Pain intelligence</Link></li>
              </ul>
            </div>

            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Integrations</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">CRM integration</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Email platforms</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Sales tools</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">API access</Link></li>
              </ul>
            </div>

            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Account Management</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Billing and pricing</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">User permissions</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Security settings</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Data export</Link></li>
              </ul>
            </div>

            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Troubleshooting</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Common issues</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Data sync problems</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Performance optimization</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Browser compatibility</Link></li>
              </ul>
            </div>

            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Best Practices</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Buyer group analysis</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Team collaboration</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Data management</Link></li>
                <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Sales workflows</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-20 bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">
            Still need help?
          </h2>
          <p className="text-lg text-[var(--muted)] mb-8">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Link
            href="/contact"
            className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </section>
    </div>
  );
} 