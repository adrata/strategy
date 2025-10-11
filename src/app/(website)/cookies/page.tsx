"use client";

import React from "react";
import Link from "next/link";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--background)] border-b border-[var(--border)]">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex justify-between items-center py-4">
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
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold text-[var(--foreground)] mb-6">
              Cookie Policy
            </h1>
            <p className="text-lg text-[var(--muted)] mb-8">
              Last updated: July 14, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Cookie Policy Content */}
      <section className="py-20 bg-[var(--panel-background)]">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
            <div className="prose prose-lg max-w-none">
              <h2>What Are Cookies</h2>
              <p>
                Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to site owners about how their site is being used.
              </p>

              <h2>How We Use Cookies</h2>
              <p>
                Adrata uses cookies and similar tracking technologies to improve your experience on our website and platform. We use cookies for the following purposes:
              </p>

              <h3>Essential Cookies</h3>
              <p>
                These cookies are necessary for the website to function properly and cannot be disabled in our systems. They are usually only set in response to actions made by you, such as setting your privacy preferences, logging in, or filling in forms.
              </p>
              <ul>
                <li><strong>Authentication:</strong> Remember your login status and maintain your session</li>
                <li><strong>Security:</strong> Protect against fraud and ensure secure connections</li>
                <li><strong>Site Functionality:</strong> Enable core website features and navigation</li>
                <li><strong>Load Balancing:</strong> Distribute traffic across our servers efficiently</li>
              </ul>

              <h3>Analytics Cookies</h3>
              <p>
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website's performance and user experience.
              </p>
              <ul>
                <li><strong>Usage Analytics:</strong> Track page views, time spent, and navigation patterns</li>
                <li><strong>Performance Monitoring:</strong> Measure website speed and identify errors</li>
                <li><strong>Feature Usage:</strong> Understand which features are most valuable to users</li>
                <li><strong>Conversion Tracking:</strong> Measure the effectiveness of our marketing efforts</li>
              </ul>

              <h3>Functional Cookies</h3>
              <p>
                These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
              </p>
              <ul>
                <li><strong>Preferences:</strong> Remember your settings and customization choices</li>
                <li><strong>Language Settings:</strong> Store your preferred language and region</li>
                <li><strong>Interface Customization:</strong> Maintain your dashboard and layout preferences</li>
                <li><strong>Accessibility:</strong> Support accessibility features and assistive technologies</li>
              </ul>

              <h3>Marketing Cookies</h3>
              <p>
                These cookies are used to make advertising messages more relevant to you and your interests. They also perform functions like preventing the same ad from appearing repeatedly.
              </p>
              <ul>
                <li><strong>Advertising:</strong> Deliver relevant advertisements based on your interests</li>
                <li><strong>Retargeting:</strong> Show you relevant ads on other websites you visit</li>
                <li><strong>Campaign Measurement:</strong> Track the effectiveness of our advertising campaigns</li>
                <li><strong>Social Media:</strong> Enable social sharing and track social media engagement</li>
              </ul>

              <h2>Third-Party Cookies</h2>
              <p>
                We work with trusted third-party service providers who may set cookies on our website to help us deliver our services. These include:
              </p>

              <h3>Analytics Providers</h3>
              <ul>
                <li><strong>Google Analytics:</strong> Website traffic and user behavior analysis</li>
                <li><strong>Mixpanel:</strong> Product analytics and user engagement tracking</li>
                <li><strong>Hotjar:</strong> User experience analysis and heatmap generation</li>
              </ul>

              <h3>Marketing Platforms</h3>
              <ul>
                <li><strong>Google Ads:</strong> Advertising and conversion tracking</li>
                <li><strong>LinkedIn Ads:</strong> Professional audience targeting and tracking</li>
                <li><strong>Facebook Pixel:</strong> Social media advertising and remarketing</li>
              </ul>

              <h3>Customer Support</h3>
              <ul>
                <li><strong>Intercom:</strong> Customer support chat and messaging</li>
                <li><strong>Zendesk:</strong> Support ticket management and knowledge base</li>
              </ul>

              <h3>Infrastructure</h3>
              <ul>
                <li><strong>Cloudflare:</strong> Content delivery network and security services</li>
                <li><strong>AWS:</strong> Cloud hosting and infrastructure services</li>
              </ul>

              <h2>Cookie Management</h2>
              
              <h3>Browser Settings</h3>
              <p>
                Most web browsers allow you to control cookies through their settings preferences. You can set your browser to:
              </p>
              <ul>
                <li>Block all cookies</li>
                <li>Block third-party cookies only</li>
                <li>Delete cookies when you close your browser</li>
                <li>Notify you when a cookie is being set</li>
              </ul>

              <h3>Cookie Consent Management</h3>
              <p>
                We provide a cookie consent banner that allows you to choose which types of cookies you want to accept. You can modify your preferences at any time by clicking on the "Cookie Settings" link in our website footer.
              </p>

              <h3>Opt-Out Options</h3>
              <p>
                You can opt out of specific tracking services:
              </p>
              <ul>
                <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline">Google Analytics Opt-out Browser Add-on</a></li>
                <li><strong>Google Ads:</strong> <a href="https://adssettings.google.com/" className="text-blue-600 hover:underline">Google Ad Settings</a></li>
                <li><strong>Digital Advertising Alliance:</strong> <a href="https://www.aboutads.info/choices/" className="text-blue-600 hover:underline">DAA WebChoices Tool</a></li>
              </ul>

              <h2>Impact of Disabling Cookies</h2>
              <p>
                Please note that if you choose to disable cookies, some features of our website and platform may not function properly:
              </p>
              <ul>
                <li>You may need to log in every time you visit</li>
                <li>Your preferences and settings may not be saved</li>
                <li>Some interactive features may not work correctly</li>
                <li>We may not be able to remember your marketing preferences</li>
                <li>Performance and user experience may be reduced</li>
              </ul>

              <h2>Mobile Cookies and Tracking</h2>
              <p>
                On mobile devices, we may use additional tracking technologies:
              </p>
              <ul>
                <li><strong>Mobile Identifiers:</strong> Device advertising IDs for mobile app analytics</li>
                <li><strong>SDK Analytics:</strong> Software development kit tracking for mobile apps</li>
                <li><strong>Push Notifications:</strong> Notification preferences and delivery tracking</li>
                <li><strong>Location Data:</strong> General location information for service optimization</li>
              </ul>

              <h2>Cookie Retention</h2>
              <p>
                Different cookies have different retention periods:
              </p>
              <ul>
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain until their expiration date or manual deletion</li>
                <li><strong>Essential Cookies:</strong> Typically retained for the duration of your session</li>
                <li><strong>Analytics Cookies:</strong> Usually retained for 1-2 years</li>
                <li><strong>Marketing Cookies:</strong> Generally retained for 30-90 days</li>
              </ul>

              <h2>Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website and updating the "Last Updated" date.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
              </p>
              <ul>
                <li><strong>Email:</strong> privacy@adrata.com</li>
                <li><strong>Subject Line:</strong> "Cookie Policy Inquiry"</li>
                <li><strong>Address:</strong> Adrata Privacy Team, 1234 Innovation Drive, Suite 100, San Francisco, CA 94105</li>
              </ul>

              <p>
                You can also manage your cookie preferences by clicking the "Cookie Settings" button in our website footer.
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