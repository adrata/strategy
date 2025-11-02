"use client";

import React from "react";
import Link from "next/link";

export default function TermsOfServicePage() {
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
              Terms of Service
            </h1>
            <p className="text-lg text-muted mb-8">
              Last updated: July 14, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Terms of Service Content */}
      <section className="py-20 bg-panel-background">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="bg-background p-8 rounded-xl border border-border">
            <div className="prose prose-lg max-w-none">
              <h2>Agreement to Terms</h2>
              <p>
                These Terms of Service ("Terms") constitute a legally binding agreement between you and Adrata ("Company," "we," "our," or "us") concerning your access to and use of the Adrata buyer group intelligence platform and related services (the "Service").
              </p>
              <p>
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, then you may not access the Service.
              </p>

              <h2>Description of Service</h2>
              <p>
                Adrata provides an AI-powered buyer group intelligence platform that helps enterprise sales teams identify, analyze, and engage complex buyer groups. Our Service includes:
              </p>
              <ul>
                <li>Stakeholder mapping and influence analysis</li>
                <li>Buyer group dynamics and relationship intelligence</li>
                <li>Predictive analytics and deal intelligence</li>
                <li>CRM integrations and workflow automation</li>
                <li>Enterprise-grade security and compliance features</li>
              </ul>

              <h2>User Accounts</h2>
              
              <h3>Account Registration</h3>
              <p>
                To access certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
              </p>

              <h3>Account Responsibility</h3>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.
              </p>

              <h3>Account Termination</h3>
              <p>
                We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>

              <h2>Acceptable Use</h2>
              
              <h3>Permitted Use</h3>
              <p>
                You may use our Service only for lawful purposes and in accordance with these Terms. You agree to use the Service in a manner consistent with any applicable laws or regulations.
              </p>

              <h3>Prohibited Activities</h3>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for any unlawful purpose or to solicit unlawful activity</li>
                <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                <li>Attempt to gain unauthorized access to any portion of the Service</li>
                <li>Use automated scripts, bots, or other means to access the Service without permission</li>
                <li>Reverse engineer, decompile, or disassemble any portion of the Service</li>
                <li>Transmit viruses, malware, or other harmful code</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the intellectual property rights of others</li>
              </ul>

              <h2>Data and Privacy</h2>
              
              <h3>Your Data</h3>
              <p>
                You retain ownership of any data, information, or content that you submit to or through the Service ("Your Data"). You grant us a license to use Your Data solely to provide and improve the Service.
              </p>

              <h3>Data Processing</h3>
              <p>
                Our collection and use of personal information is governed by our Privacy Policy. By using the Service, you consent to the collection, use, and disclosure of your information as described in our Privacy Policy.
              </p>

              <h3>Data Security</h3>
              <p>
                We implement appropriate technical and organizational measures to protect Your Data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>

              <h2>Intellectual Property Rights</h2>
              
              <h3>Our Intellectual Property</h3>
              <p>
                The Service and its entire contents, features, and functionality are owned by Adrata and are protected by copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>

              <h3>Limited License</h3>
              <p>
                We grant you a limited, non-exclusive, non-transferable, and revocable license to access and use the Service strictly in accordance with these Terms.
              </p>

              <h3>Feedback</h3>
              <p>
                Any feedback, comments, or suggestions you provide regarding the Service may be used by us without restriction or compensation to you.
              </p>

              <h2>Payment Terms</h2>
              
              <h3>Subscription Fees</h3>
              <p>
                Access to certain features of the Service requires payment of subscription fees. All fees are non-refundable except as expressly stated in these Terms or required by law.
              </p>

              <h3>Billing</h3>
              <p>
                Subscription fees are billed in advance on a recurring basis. You authorize us to charge your payment method for all applicable fees.
              </p>

              <h3>Price Changes</h3>
              <p>
                We reserve the right to modify our pricing with thirty (30) days' notice. Continued use of the Service after price changes constitutes acceptance of the new pricing.
              </p>

              <h2>Service Availability</h2>
              
              <h3>Uptime</h3>
              <p>
                While we strive to maintain high availability, we do not guarantee that the Service will be available at all times. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
              </p>

              <h3>Modifications</h3>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without notice.
              </p>

              <h2>Disclaimers and Limitations</h2>
              
              <h3>Disclaimer of Warranties</h3>
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>

              <h3>Limitation of Liability</h3>
              <p>
                IN NO EVENT SHALL ADRATA BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.
              </p>

              <h3>Maximum Liability</h3>
              <p>
                OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US FOR THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>

              <h2>Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Adrata and its officers, directors, employees, and agents from any claims, damages, losses, and expenses arising out of your use of the Service or violation of these Terms.
              </p>

              <h2>Governing Law and Dispute Resolution</h2>
              
              <h3>Governing Law</h3>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Delaware, United States, without regard to its conflict of law provisions.
              </p>

              <h3>Dispute Resolution</h3>
              <p>
                Any disputes arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>

              <h2>General Provisions</h2>
              
              <h3>Entire Agreement</h3>
              <p>
                These Terms constitute the entire agreement between you and us regarding the Service and supersede all prior communications and proposals.
              </p>

              <h3>Severability</h3>
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full force and effect.
              </p>

              <h3>Waiver</h3>
              <p>
                No waiver of any term or condition shall be deemed a continuing waiver of such term or any other term.
              </p>

              <h3>Changes to Terms</h3>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service. Your continued use constitutes acceptance of the modified Terms.
              </p>

              <h2>Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <ul>
                <li><strong>Email:</strong> legal@adrata.com</li>
                <li><strong>Address:</strong> Adrata Legal Department, 1234 Innovation Drive, Suite 100, San Francisco, CA 94105</li>
                <li><strong>Phone:</strong> +1 (555) 123-4567</li>
              </ul>
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