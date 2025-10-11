"use client";

import React from "react";
import Link from "next/link";

export default function CareersPage() {
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
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold text-[var(--foreground)] mb-6">
              Build the Future of Sales Intelligence
            </h1>
            <p className="text-xl text-[var(--muted)] mb-8 max-w-3xl mx-auto">
              Join our mission to solve the most expensive problem in enterprise sales through cutting-edge AI and mathematical innovation
            </p>
          </div>
        </div>
      </section>

      {/* Why Adrata */}
      <section className="py-20 bg-[var(--panel-background)]">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">Why Adrata?</h2>
            <p className="text-lg text-[var(--muted)]">Work on technology that matters with people who care</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <div className="w-12 h-12 bg-[var(--hover)] rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Groundbreaking Technology</h3>
              <p className="text-[var(--muted)]">
                Work on AI systems that decode complex human behavior and organizational dynamics—technology that's never been built before.
              </p>
            </div>

            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <div className="w-12 h-12 bg-[var(--hover)] rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h2M7 7h2m2 0h2m2 0h2M7 11h2m2 0h2m2 0h2M7 15h2m2 0h2m2 0h2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Research-Driven</h3>
              <p className="text-[var(--muted)]">
                Every feature is backed by rigorous scientific research. You'll work with PhDs, published researchers, and mathematical models.
              </p>
            </div>

            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <div className="w-12 h-12 bg-[var(--hover)] rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Massive Impact</h3>
              <p className="text-[var(--muted)]">
                Your work will directly impact how enterprises make billion-dollar decisions. Every algorithm you write changes how business gets done.
              </p>
            </div>

            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <div className="w-12 h-12 bg-[var(--hover)] rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Learning Culture</h3>
              <p className="text-[var(--muted)]">
                Continuous learning is built into our DNA. Conference talks, research publications, patent applications—we invest in your growth.
              </p>
            </div>

            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <div className="w-12 h-12 bg-[var(--hover)] rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Global Remote</h3>
              <p className="text-[var(--muted)]">
                Work from anywhere with a truly distributed team. We hire the best talent regardless of location and support flexible work styles.
              </p>
            </div>

            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <div className="w-12 h-12 bg-[var(--hover)] rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Equity & Benefits</h3>
              <p className="text-[var(--muted)]">
                Competitive equity packages, comprehensive health benefits, unlimited PTO, and the tools you need to do your best work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We're Looking For */}
      <section className="py-20 bg-[var(--background)]">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">What We're Looking For</h2>
            <p className="text-lg text-[var(--muted)]">The kind of people who thrive at Adrata</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-6">Engineering</h3>
              <ul className="space-y-3 text-[var(--muted)]">
                <li>• Machine Learning Engineers with expertise in NLP and graph neural networks</li>
                <li>• Full-stack developers passionate about complex data visualization</li>
                <li>• Platform engineers focused on scalable, real-time AI systems</li>
                <li>• DevOps engineers with enterprise security and compliance experience</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-6">Research & Product</h3>
              <ul className="space-y-3 text-[var(--muted)]">
                <li>• Data scientists with background in network analysis and social psychology</li>
                <li>• Product managers with enterprise B2B and sales technology experience</li>
                <li>• UX researchers who understand complex enterprise workflows</li>
                <li>• Applied researchers in organizational behavior and decision science</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-6">Business</h3>
              <ul className="space-y-3 text-[var(--muted)]">
                <li>• Sales engineers with deep enterprise sales experience</li>
                <li>• Customer success managers who understand complex B2B relationships</li>
                <li>• Marketing professionals with AI/ML and enterprise software background</li>
                <li>• Business development focused on strategic partnerships</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-6">Operations</h3>
              <ul className="space-y-3 text-[var(--muted)]">
                <li>• People operations leaders experienced with remote, global teams</li>
                <li>• Finance professionals with SaaS and AI company experience</li>
                <li>• Legal counsel specializing in AI ethics and data privacy</li>
                <li>• Security experts in enterprise compliance and data protection</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-[var(--panel-background)]">
        <div className="max-w-4xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">Ready to Join Us?</h2>
            <p className="text-lg text-[var(--muted)]">
              We're always looking for exceptional people, even if we don't have a perfect role posted yet
            </p>
          </div>

          <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Our Process</h3>
                <ol className="space-y-3 text-[var(--muted)]">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                    <span>Initial conversation about your background and interests</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                    <span>Technical or domain-specific discussion with team members</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                    <span>Project-based collaboration to see how we work together</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                    <span>Final conversation with leadership team</span>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Get in Touch</h3>
                <p className="text-[var(--muted)] mb-6">
                  Don't see a perfect fit? Reach out anyway. We're building something special and would love to hear from you.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/contact"
                    className="block w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-center"
                  >
                    Contact Us About Opportunities
                  </Link>
                  <p className="text-sm text-[var(--muted)] text-center">
                    Include your background, what excites you about Adrata, and what kind of role you're looking for
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="text-2xl font-bold mb-4">Adrata</div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                The Leader in buyer group intelligence. Decode complex buyer dynamics in seconds, not months.
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

          {/* Security & Compliance */}
          <div className="border-t border-[var(--border)] pt-8 mb-8">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm">SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm">Enterprise Grade</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">99.9% Uptime SLA</span>
              </div>
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