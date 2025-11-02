"use client";

import React from "react";
import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-12">
              <Link href="/" className="text-xl font-medium text-foreground">
                Adrata
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link href="/what-is-the-buyer-gap" className="text-sm text-gray-700 hover:text-foreground transition-colors">
                  Buyer Gap
                </Link>
                <Link href="/platform" className="text-sm text-gray-700 hover:text-foreground transition-colors">
                  Platform
                </Link>
                <Link href="/pricing" className="text-sm text-gray-700 hover:text-foreground transition-colors">
                  Pricing
                </Link>
                <Link href="/company" className="text-sm text-gray-700 hover:text-foreground transition-colors">
                  Company
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/sign-in" className="text-sm text-gray-700 hover:text-foreground transition-colors">
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
      <section className="pt-40 pb-32 bg-background">
        <div className="max-w-8xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold text-foreground mb-6">
              How can we help you?
            </h1>
            <p className="text-xl text-muted mb-8 max-w-3xl mx-auto">
              Get the support you need to maximize your buyer group intelligence platform
            </p>
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-20 bg-panel-background">
        <div className="max-w-8xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Link href="/help-center" className="bg-background p-8 rounded-xl border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-hover rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Help Center</h3>
              <p className="text-muted">
                Browse our comprehensive knowledge base with guides and FAQs
              </p>
            </Link>

            <Link href="/documentation" className="bg-background p-8 rounded-xl border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-hover rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Documentation</h3>
              <p className="text-muted">
                Technical documentation, API references, and integration guides
              </p>
            </Link>

            <Link href="/system-status" className="bg-background p-8 rounded-xl border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-hover rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">System Status</h3>
              <p className="text-muted">
                Real-time status of all Adrata services and platform uptime
              </p>
            </Link>

            <Link href="/security" className="bg-background p-8 rounded-xl border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-hover rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Security</h3>
              <p className="text-muted">
                Security policies, compliance information, and trust center
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold text-foreground mb-4">
            Need Direct Support?
          </h2>
          <p className="text-lg text-muted mb-8">
            Our support team is here to help with any questions or issues
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/demo"
              className="bg-background text-black border border-black px-8 py-3 rounded-lg font-medium hover:bg-panel-background transition-colors"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 