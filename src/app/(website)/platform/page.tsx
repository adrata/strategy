"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  PaperAirplaneIcon, 
  SparklesIcon,
  UserGroupIcon,
  ChartBarIcon,
  BoltIcon,
  CircleStackIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ServerIcon
} from "@heroicons/react/24/outline";

export default function PlatformPage() {

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-12">
              <Link href="/" className="text-xl font-medium text-gray-900">
                Adrata
              </Link>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-6">
                <Link href="/what-is-the-buyer-gap" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Buyer Gap
                </Link>
                <Link href="/platform" className="text-sm text-gray-900 font-semibold">
                  Platform
                </Link>
                <Link href="/pricing" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <Link href="/company" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Company
                </Link>
              </nav>
            </div>

            {/* Sign In and CTA Button */}
            <div className="flex items-center space-x-4">
              <Link href="/sign-in" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
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
      <section className="py-32 bg-white">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-6">
              The Buyer Group Intelligence Platform
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl">
              Securely integrate buyer group intelligence into your existing workflow and sales infrastructure. SOC 2 compliant, enterprise-grade security, seamless data flows.
            </p>
            <div className="flex">
              <Link
                href="/find-your-buyer-group"
                className="bg-white text-black border border-black px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center space-x-2 no-override"
              >
                <span>Schedule a demo</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Platform Demo Section */}
      <section className="py-20 bg-white">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              See Our Platform in Action
            </h2>
            <p className="text-lg text-gray-600">
              Real-time buyer group intelligence and AI-powered insights at your fingertips
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Real-time Stakeholder Analysis */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Real-time Stakeholder Analysis</h3>
                <div className="px-3 py-1 bg-gray-200 rounded-full text-sm text-gray-700">Live</div>
              </div>
              <p className="text-gray-600 mb-6">
                Watch as our AI identifies and maps buyer group members in real-time
              </p>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-900 font-sans">Sarah Chen</span>
                    <span className="text-gray-600">CEO • Decision Maker</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-900 font-sans">Michael Torres</span>
                    <span className="text-gray-600">CTO • Blocker</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-900 font-sans">Jennifer Liu</span>
                    <span className="text-gray-600">CFO • Stakeholder</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-900 font-sans">David Rodriguez</span>
                    <span className="text-gray-600">VP Sales • Champion</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Analysis Complete:</span> 4 key stakeholders identified
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Chat Interface - More Versatile */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Chat with Adrata</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Ask questions about buyer groups, stakeholder mapping, or platform capabilities
              </p>
              
              {/* Enhanced Chat Interface */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 overflow-y-auto">
                <div className="space-y-6">
                  {/* User message */}
                  <div className="flex justify-start">
                    <div className="max-w-md">
                      <div className="bg-gray-200 rounded-lg px-4 py-3">
                        <div className="text-sm text-gray-900">Why isn't Jack Smith in the buyer group?</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Adrata response */}
                  <div className="flex justify-start">
                    <div className="max-w-xl">
                      <div className="text-sm text-gray-900 space-y-3">
                        <p>Jack Smith isn't in the buyer group because:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>No decision-making authority for this purchase</li>
                          <li>Not involved in budget approval process</li>
                          <li>Functions as an end-user rather than stakeholder</li>
                        </ul>
                        <p>Our AI analyzes org charts, communication patterns, and decision-making history to identify true buyer group members. Jack may be important for implementation, but he's not part of the purchasing decision.</p>
                        <p className="text-gray-600">Would you like me to show you the actual buyer group members for this account?</p>
                      </div>
                    </div>
                  </div>

                  {/* Follow-up user message */}
                  <div className="flex justify-start">
                    <div className="max-w-md">
                      <div className="bg-gray-200 rounded-lg px-4 py-3">
                        <div className="text-sm text-gray-900">Yes, show me the buyer group</div>
                      </div>
                    </div>
                  </div>

                  {/* Adrata follow-up */}
                  <div className="flex justify-start">
                    <div className="max-w-xl">
                      <div className="text-sm text-gray-900 space-y-3">
                        <p>Here's the buyer group for TechCorp Solutions:</p>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Sarah Chen (CEO)</span>
                            <span className="text-gray-600">Decision Maker</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Michael Torres (CTO)</span>
                            <span className="text-gray-600">Blocker</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Jennifer Liu (CFO)</span>
                            <span className="text-gray-600">Stakeholder</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">David Rodriguez (VP Sales)</span>
                            <span className="text-gray-600">Champion</span>
                          </div>
                        </div>
                        <p className="text-gray-600">These are the 4 people who will actually influence this purchase decision.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deal Intelligence Dashboard */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Deal Intelligence Dashboard</h3>
                <div className="px-3 py-1 bg-gray-200 rounded-full text-sm text-gray-700">Analytics</div>
              </div>
              <p className="text-gray-600 mb-6">
                Get predictive insights and recommendations for your active deals
              </p>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">Deal Score</span>
                    <span className="text-gray-900 font-bold">87%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-900 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Champion Engagement</span>
                      <span className="text-gray-900">High</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget Confirmed</span>
                      <span className="text-gray-900">Yes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timeline</span>
                      <span className="text-gray-900">Q1 2025</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Action</span>
                      <span className="text-gray-900">CFO Meeting</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CRM Integration Preview */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">CRM Integration Preview</h3>
                <div className="px-3 py-1 bg-gray-200 rounded-full text-sm text-gray-700">Salesforce</div>
              </div>
              <p className="text-gray-600 mb-6">
                See how buyer group data flows directly into your existing CRM workflow
              </p>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">Account: TechCorp Solutions</span>
                  </div>
                  <div className="flex items-center gap-3 pl-5">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Opportunity: Enterprise Platform</span>
                  </div>
                  <div className="flex items-center gap-3 pl-5">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Next Action: Contact CFO Jennifer Liu</span>
                  </div>
                  <div className="flex items-center gap-3 pl-5">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Risk Alert: Competitor meeting scheduled</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm">
                    Sync to Salesforce
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Trust Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Built for Enterprise Security & Compliance
            </h2>
            <p className="text-lg text-gray-600">
              Your CIO will love our security-first architecture and seamless data integration capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <LockClosedIcon className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SOC 2 Type II Compliant</h3>
              <p className="text-gray-600 text-sm">
                Independently audited security controls for enterprise data protection
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheckIcon className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">GDPR & CCPA Ready</h3>
              <p className="text-gray-600 text-sm">
                Complete data privacy compliance with automated data handling controls
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <GlobeAltIcon className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Zero-Trust Architecture</h3>
              <p className="text-gray-600 text-sm">
                End-to-end encryption with role-based access controls and audit trails
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <ServerIcon className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">On-Premise Available</h3>
              <p className="text-gray-600 text-sm">
                Deploy within your infrastructure for maximum data control and security
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="border-t border-gray-700 pt-8 mb-8">
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center gap-2 text-gray-300">
                <ShieldCheckIcon className="w-5 h-5" />
                <span className="text-sm">SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <LockClosedIcon className="w-5 h-5" />
                <span className="text-sm">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <BoltIcon className="w-5 h-5" />
                <span className="text-sm">Enterprise Grade</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <ServerIcon className="w-5 h-5" />
                <span className="text-sm">99.9% Uptime SLA</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Adrata. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}