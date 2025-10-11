"use client";

import React from "react";
import Link from "next/link";

export default function DocumentationPage() {
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
      <section className="pt-40 pb-32 bg-[var(--background)]">
        <div className="max-w-8xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold text-[var(--foreground)] mb-6">
              Developer Documentation
            </h1>
            <p className="text-xl text-[var(--muted)] mb-8 max-w-3xl mx-auto">
              Complete technical documentation, API references, and integration guides for the Adrata platform
            </p>
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-20 bg-[var(--panel-background)]">
        <div className="max-w-8xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Start */}
            <div className="lg:col-span-1">
              <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
                <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-6">Quick Start</h2>
                <ul className="space-y-4">
                  <li>
                    <Link href="#" className="block p-4 bg-[var(--panel-background)] rounded-lg hover:bg-[var(--hover)] transition-colors">
                      <h3 className="font-medium text-[var(--foreground)] mb-1">Authentication</h3>
                      <p className="text-sm text-[var(--muted)]">Get started with API authentication</p>
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="block p-4 bg-[var(--panel-background)] rounded-lg hover:bg-[var(--hover)] transition-colors">
                      <h3 className="font-medium text-[var(--foreground)] mb-1">First API Call</h3>
                      <p className="text-sm text-[var(--muted)]">Make your first buyer group query</p>
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="block p-4 bg-[var(--panel-background)] rounded-lg hover:bg-[var(--hover)] transition-colors">
                      <h3 className="font-medium text-[var(--foreground)] mb-1">SDKs</h3>
                      <p className="text-sm text-[var(--muted)]">Official SDKs for popular languages</p>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* API Reference */}
            <div className="lg:col-span-2">
              <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
                <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-6">API Reference</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Buyer Groups</h3>
                    <ul className="space-y-2">
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Get buyer group</Link></li>
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">List stakeholders</Link></li>
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Analyze influence</Link></li>
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Track evolution</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Intelligence</h3>
                    <ul className="space-y-2">
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Pain analysis</Link></li>
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Buying signals</Link></li>
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Flight risk</Link></li>
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Competitive threats</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Data Management</h3>
                    <ul className="space-y-2">
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Import contacts</Link></li>
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Export data</Link></li>
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Sync CRM</Link></li>
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Webhooks</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">Analytics</h3>
                    <ul className="space-y-2">
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Performance metrics</Link></li>
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Usage analytics</Link></li>
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Custom reports</Link></li>
                      <li><Link href="#" className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">Data insights</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Guides */}
      <section className="py-20 bg-[var(--background)]">
        <div className="max-w-8xl mx-auto px-6">
          <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-12 text-center">Integration Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[var(--panel-background)] p-6 rounded-xl border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">Salesforce</h3>
              <p className="text-[var(--muted)] text-sm mb-4">Connect with Salesforce CRM for seamless data sync</p>
              <Link href="#" className="text-black font-medium text-sm hover:underline">View Guide →</Link>
            </div>
            <div className="bg-[var(--panel-background)] p-6 rounded-xl border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">HubSpot</h3>
              <p className="text-[var(--muted)] text-sm mb-4">Integrate with HubSpot for enhanced buyer intelligence</p>
              <Link href="#" className="text-black font-medium text-sm hover:underline">View Guide →</Link>
            </div>
            <div className="bg-[var(--panel-background)] p-6 rounded-xl border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">Outreach</h3>
              <p className="text-[var(--muted)] text-sm mb-4">Power your sequences with buyer group insights</p>
              <Link href="#" className="text-black font-medium text-sm hover:underline">View Guide →</Link>
            </div>
            <div className="bg-[var(--panel-background)] p-6 rounded-xl border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">Slack</h3>
              <p className="text-[var(--muted)] text-sm mb-4">Get real-time alerts in your team channels</p>
              <Link href="#" className="text-black font-medium text-sm hover:underline">View Guide →</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 