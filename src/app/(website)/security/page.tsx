"use client";

import React from "react";
import Link from "next/link";
import { Shield, Lock, Eye, Server, FileText, Users, AlertTriangle, CheckCircle, Monitor, Key } from "lucide-react";

export default function SecurityPage() {
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
                <Link href="/security" className="text-sm text-[var(--foreground)] font-semibold">
                  Security
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
      <section className="pt-40 pb-32 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center">
            <div className="mb-8">
              <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-[var(--foreground)] mb-6">
              Enterprise-Grade Security & Compliance
            </h1>
            <p className="text-xl text-[var(--muted)] mb-8 max-w-3xl mx-auto">
              Your data security is our highest priority. We implement industry-leading security measures to protect your sensitive business information.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Request Security Assessment
              </Link>
              <Link
                href="/demo"
                className="bg-[var(--background)] text-blue-600 px-8 py-3 rounded-lg text-lg font-medium border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                See Security Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security Overview */}
      <section className="py-20 bg-[var(--background)]">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">Comprehensive Security Framework</h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              Our security-first architecture ensures your data is protected at every layer of our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Data Encryption */}
            <div className="bg-[var(--panel-background)] p-8 rounded-xl">
              <Lock className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">Data Encryption</h3>
              <p className="text-[var(--muted)] mb-4">
                End-to-end encryption with AES-256 for data at rest and TLS 1.3 for data in transit
              </p>
              <ul className="text-sm text-[var(--muted)] space-y-1">
                <li>• AES-256 encryption at rest</li>
                <li>• TLS 1.3 for data in transit</li>
                <li>• Key rotation every 90 days</li>
                <li>• Hardware security modules</li>
              </ul>
            </div>

            {/* Access Control */}
            <div className="bg-[var(--panel-background)] p-8 rounded-xl">
              <Key className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">Zero-Trust Access</h3>
              <p className="text-[var(--muted)] mb-4">
                Multi-factor authentication, role-based access controls, and continuous verification
              </p>
              <ul className="text-sm text-[var(--muted)] space-y-1">
                <li>• Multi-factor authentication (MFA)</li>
                <li>• Role-based access control (RBAC)</li>
                <li>• Single sign-on (SSO) integration</li>
                <li>• Continuous access verification</li>
              </ul>
            </div>

            {/* Infrastructure Security */}
            <div className="bg-[var(--panel-background)] p-8 rounded-xl">
              <Server className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">Infrastructure Security</h3>
              <p className="text-[var(--muted)] mb-4">
                Secure cloud infrastructure with network segmentation and DDoS protection
              </p>
              <ul className="text-sm text-[var(--muted)] space-y-1">
                <li>• Network segmentation</li>
                <li>• DDoS protection</li>
                <li>• Intrusion detection systems</li>
                <li>• Regular security updates</li>
              </ul>
            </div>

            {/* Monitoring & Detection */}
            <div className="bg-[var(--panel-background)] p-8 rounded-xl">
              <Monitor className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">24/7 Monitoring</h3>
              <p className="text-[var(--muted)] mb-4">
                Real-time security monitoring with automated threat detection and incident response
              </p>
              <ul className="text-sm text-[var(--muted)] space-y-1">
                <li>• 24/7 security operations center</li>
                <li>• Automated threat detection</li>
                <li>• Real-time alerting</li>
                <li>• Incident response team</li>
              </ul>
            </div>

            {/* Privacy Controls */}
            <div className="bg-[var(--panel-background)] p-8 rounded-xl">
              <Eye className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">Privacy Controls</h3>
              <p className="text-[var(--muted)] mb-4">
                Comprehensive privacy controls with data minimization and user consent management
              </p>
              <ul className="text-sm text-[var(--muted)] space-y-1">
                <li>• Data minimization principles</li>
                <li>• User consent management</li>
                <li>• Data retention policies</li>
                <li>• Right to deletion</li>
              </ul>
            </div>

            {/* Audit & Compliance */}
            <div className="bg-[var(--panel-background)] p-8 rounded-xl">
              <FileText className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">Audit Trails</h3>
              <p className="text-[var(--muted)] mb-4">
                Comprehensive audit logging with immutable records for compliance and forensics
              </p>
              <ul className="text-sm text-[var(--muted)] space-y-1">
                <li>• Immutable audit logs</li>
                <li>• User activity tracking</li>
                <li>• Data access monitoring</li>
                <li>• Compliance reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Certifications */}
      <section className="py-20 bg-[var(--panel-background)]">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">Compliance & Certifications</h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              We maintain the highest standards of compliance with global security and privacy regulations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-[var(--background)] p-6 rounded-xl border border-[var(--border)] text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">SOC 2 Type II</h3>
              <p className="text-sm text-[var(--muted)]">
                Independently audited security controls for enterprise data protection
              </p>
            </div>

            <div className="bg-[var(--background)] p-6 rounded-xl border border-[var(--border)] text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">GDPR</h3>
              <p className="text-sm text-[var(--muted)]">
                Full compliance with European data protection regulations
              </p>
            </div>

            <div className="bg-[var(--background)] p-6 rounded-xl border border-[var(--border)] text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">CCPA</h3>
              <p className="text-sm text-[var(--muted)]">
                California Consumer Privacy Act compliance for US data protection
              </p>
            </div>

            <div className="bg-[var(--background)] p-6 rounded-xl border border-[var(--border)] text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">HIPAA Ready</h3>
              <p className="text-sm text-[var(--muted)]">
                Healthcare data protection standards for sensitive information
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Best Practices */}
      <section className="py-20 bg-[var(--background)]">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-6">Security Best Practices</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Regular Security Assessments</h3>
                    <p className="text-[var(--muted)]">
                      Quarterly penetration testing and vulnerability assessments by independent security firms
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Employee Security Training</h3>
                    <p className="text-[var(--muted)]">
                      Regular security awareness training and phishing simulation exercises for all team members
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Incident Response Plan</h3>
                    <p className="text-[var(--muted)]">
                      Comprehensive incident response procedures with defined escalation paths and communication protocols
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Data Backup & Recovery</h3>
                    <p className="text-[var(--muted)]">
                      Automated daily backups with point-in-time recovery and disaster recovery testing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--panel-background)] p-8 rounded-xl">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-6">Security Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Security Incidents (2024)</span>
                  <span className="text-2xl font-bold text-green-600">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Data Breaches</span>
                  <span className="text-2xl font-bold text-green-600">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Uptime SLA</span>
                  <span className="text-2xl font-bold text-blue-600">99.9%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)]">Response Time</span>
                  <span className="text-2xl font-bold text-blue-600">&lt;15min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Contact */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-[var(--foreground)] mb-4">Security Contact & Resources</h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              Have security questions or need to report a vulnerability? We're here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <AlertTriangle className="h-8 w-8 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">Report a Vulnerability</h3>
              <p className="text-[var(--muted)] mb-4">
                We welcome responsible disclosure of security vulnerabilities. Please report any security issues to our dedicated security team.
              </p>
              <Link
                href="mailto:security@adrata.com"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                security@adrata.com
              </Link>
            </div>

            <div className="bg-[var(--background)] p-8 rounded-xl border border-[var(--border)]">
              <Users className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">Enterprise Security</h3>
              <p className="text-[var(--muted)] mb-4">
                Need enterprise security documentation or have compliance questions? Our security team can provide detailed information.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Security Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--foreground)] text-white py-16">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/platform" className="text-gray-300 hover:text-white transition-colors">Platform</Link></li>
                <li><Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="text-gray-300 hover:text-white transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/company" className="text-gray-300 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/careers" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/documentation" className="text-gray-300 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/help-center" className="text-gray-300 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/support" className="text-gray-300 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/security" className="text-gray-300 hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-[var(--muted)]">
            <p>&copy; 2024 Adrata. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 