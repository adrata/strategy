"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function SystemStatusPage() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "newsletter",
          email: newsletterEmail,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setNewsletterSubmitted(true);
        setIsSubmitting(false);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setNewsletterSubmitted(false);
          setNewsletterEmail("");
        }, 3000);
      } else {
        throw new Error(result.error || "Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting newsletter:", error);
      setIsSubmitting(false);
      alert("There was an error subscribing to updates. Please try again.");
    }
  };
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-12">
              <Link href="/" className="text-xl font-medium text-gray-900">
                Adrata
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link href="/what-is-the-buyer-gap" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  Buyer Gap
                </Link>
                <Link href="/platform" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
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
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-8xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-6">
              System Status
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Real-time status and performance metrics for all Adrata services
            </p>
            
            {/* Overall Status */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 border border-green-200 rounded-full">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-800 font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>
      </section>

      {/* Service Status */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-8xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">Service Status</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h3 className="font-medium text-gray-900">Buyer Group Intelligence API</h3>
                    <p className="text-sm text-gray-600">Core AI analysis engine</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">Operational</div>
                  <div className="text-xs text-gray-500">99.9% uptime</div>
                </div>
              </div>
              
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h3 className="font-medium text-gray-900">Stakeholder Mapping</h3>
                    <p className="text-sm text-gray-600">Real-time relationship analysis</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">Operational</div>
                  <div className="text-xs text-gray-500">99.8% uptime</div>
                </div>
              </div>
              
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h3 className="font-medium text-gray-900">Data Enrichment</h3>
                    <p className="text-sm text-gray-600">Contact and company intelligence</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">Operational</div>
                  <div className="text-xs text-gray-500">99.9% uptime</div>
                </div>
              </div>
              
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h3 className="font-medium text-gray-900">CRM Integrations</h3>
                    <p className="text-sm text-gray-600">Salesforce, HubSpot, and other connectors</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">Operational</div>
                  <div className="text-xs text-gray-500">99.7% uptime</div>
                </div>
              </div>
              
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h3 className="font-medium text-gray-900">Web Application</h3>
                    <p className="text-sm text-gray-600">Main platform interface</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">Operational</div>
                  <div className="text-xs text-gray-500">99.9% uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="py-20 bg-white">
        <div className="max-w-8xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="text-3xl font-bold text-gray-900 mb-2">99.9%</div>
              <div className="text-sm font-medium text-gray-600 mb-1">Overall Uptime</div>
              <div className="text-xs text-gray-500">Last 30 days</div>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="text-3xl font-bold text-gray-900 mb-2">120ms</div>
              <div className="text-sm font-medium text-gray-600 mb-1">Average Response Time</div>
              <div className="text-xs text-gray-500">API endpoints</div>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
              <div className="text-sm font-medium text-gray-600 mb-1">Active Incidents</div>
              <div className="text-xs text-gray-500">Current status</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Incidents */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-8xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">Recent Incidents</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Incidents</h3>
              <p className="text-gray-600">All systems have been running smoothly for the past 30 days.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe to Updates */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Stay Updated
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Subscribe to status updates and be the first to know about any service changes
          </p>
          {newsletterSubmitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-medium">Successfully subscribed to updates!</p>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
} 