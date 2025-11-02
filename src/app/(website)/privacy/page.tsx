"use client";

import React from "react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex justify-between items-center py-4">
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
      <section className="pt-40 pb-20 bg-background">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold text-foreground mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted mb-8">
              Last updated: July 14, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-20 bg-panel-background">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="bg-background p-8 rounded-xl border border-border">
            <div className="prose prose-lg max-w-none">
              <h2>Introduction</h2>
              <p>
                Adrata ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our buyer group intelligence platform and related services (the "Service").
              </p>

              <h2>Information We Collect</h2>
              
              <h3>Information You Provide</h3>
              <ul>
                <li><strong>Account Information:</strong> Name, email address, company information, and contact details when you create an account</li>
                <li><strong>Profile Data:</strong> Job title, department, and other professional information you choose to provide</li>
                <li><strong>Communication Data:</strong> Messages, feedback, and other communications you send to us</li>
                <li><strong>Payment Information:</strong> Billing details processed securely through our payment providers</li>
              </ul>

              <h3>Information We Collect Automatically</h3>
              <ul>
                <li><strong>Usage Data:</strong> How you interact with our Service, including features used and time spent</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
                <li><strong>Cookies and Tracking:</strong> Information collected through cookies and similar technologies</li>
                <li><strong>Log Data:</strong> Server logs, error reports, and performance metrics</li>
              </ul>

              <h3>Business Intelligence Data</h3>
              <ul>
                <li><strong>Professional Networks:</strong> Information about business relationships and organizational structures</li>
                <li><strong>Public Information:</strong> Publicly available professional information from legitimate sources</li>
                <li><strong>Behavioral Analytics:</strong> Patterns and insights derived from aggregated, anonymized data</li>
              </ul>

              <h2>How We Use Your Information</h2>
              
              <h3>Service Delivery</h3>
              <ul>
                <li>Provide and maintain our buyer group intelligence platform</li>
                <li>Process transactions and manage your account</li>
                <li>Deliver customer support and respond to inquiries</li>
                <li>Send service-related communications and updates</li>
              </ul>

              <h3>Product Improvement</h3>
              <ul>
                <li>Analyze usage patterns to improve our algorithms and features</li>
                <li>Conduct research and development for new capabilities</li>
                <li>Perform quality assurance and testing</li>
                <li>Generate anonymized insights and benchmarks</li>
              </ul>

              <h3>Business Operations</h3>
              <ul>
                <li>Comply with legal obligations and enforce our terms</li>
                <li>Prevent fraud, abuse, and security incidents</li>
                <li>Protect the rights and safety of our users</li>
                <li>Conduct business analytics and reporting</li>
              </ul>

              <h2>Information Sharing and Disclosure</h2>
              
              <p>We do not sell, trade, or rent your personal information to third parties. We may share information in the following circumstances:</p>

              <h3>Service Providers</h3>
              <p>
                We work with trusted third-party service providers who assist us in operating our platform, conducting business, or serving our users. These providers have access to personal information only as needed to perform their functions and are contractually obligated to maintain confidentiality.
              </p>

              <h3>Legal Requirements</h3>
              <p>
                We may disclose information when required by law, regulation, legal process, or governmental request, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
              </p>

              <h3>Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change in ownership or control.
              </p>

              <h2>Data Security</h2>
              
              <p>We implement industry-standard security measures to protect your information:</p>
              <ul>
                <li><strong>Encryption:</strong> Data encrypted in transit using TLS 1.3 and at rest using AES-256</li>
                <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication</li>
                <li><strong>Infrastructure:</strong> Secure cloud infrastructure with regular security audits</li>
                <li><strong>Monitoring:</strong> 24/7 security monitoring and incident response</li>
                <li><strong>Compliance:</strong> SOC 2 Type II, GDPR, and other security standards</li>
              </ul>

              <h2>Your Rights and Choices</h2>
              
              <h3>Access and Control</h3>
              <ul>
                <li><strong>Account Access:</strong> View and update your account information at any time</li>
                <li><strong>Data Portability:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              </ul>

              <h3>Communication Preferences</h3>
              <ul>
                <li>Opt out of marketing communications while maintaining service-related messages</li>
                <li>Manage notification preferences through your account settings</li>
                <li>Unsubscribe from email lists using provided links</li>
              </ul>

              <h3>Cookie Management</h3>
              <ul>
                <li>Configure cookie preferences through our cookie management tool</li>
                <li>Disable cookies through your browser settings (may affect functionality)</li>
                <li>Opt out of analytics tracking where available</li>
              </ul>

              <h2>International Data Transfers</h2>
              
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. When we transfer personal information internationally, we implement appropriate safeguards, including standard contractual clauses and adequacy decisions.
              </p>

              <h2>Data Retention</h2>
              
              <p>
                We retain personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. Specific retention periods depend on the type of information and applicable legal requirements.
              </p>

              <h2>Children's Privacy</h2>
              
              <p>
                Our Service is not intended for individuals under the age of 16. We do not knowingly collect personal information from children under 16. If you become aware that a child has provided us with personal information, please contact us immediately.
              </p>

              <h2>Changes to This Policy</h2>
              
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of the Service after such modifications constitutes acceptance of the updated policy.
              </p>

              <h2>Contact Us</h2>
              
              <p>
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <ul>
                <li><strong>Email:</strong> privacy@adrata.com</li>
              </ul>

              <p>
                For GDPR-related inquiries, please contact our Data Protection Officer at dpo@adrata.com.
              </p>
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
          <div className="border-t border-border pt-8 mb-8">
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
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted text-sm mb-4 md:mb-0">
              © 2025 Adrata. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-muted hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-muted hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="text-muted hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 