"use client";

import React from 'react';
import PasswordProtection from '../PasswordProtection';
import Link from 'next/link';

export default function CloudCaddieMainPage() {
  return (
    <PasswordProtection correctPassword="CloudCaddieGoat-2025">
      <div className="min-h-screen bg-white" style={{ overflowY: 'auto', height: '100vh' }}>
        {/* Header */}
        <header className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-semibold text-gray-900">CloudCaddie Intelligence</h1>
              
              {/* Navigation Links */}
              <div className="flex items-center space-x-6">
                <Link 
                  href="/" 
                  className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/platform" 
                  className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Platform
                </Link>
                <Link
                  href="https://calendly.com/dan-adrata/biz-dev-call"
                  className="bg-black text-white px-5 py-1.5 rounded-2xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Schedule Call With Dan
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-6 py-12">
          {/* Document Header */}
          <div className="border-b-2 border-black pb-8 mb-12">
            <h1 className="text-4xl font-bold text-black mb-4 leading-tight">
              CloudCaddie Intelligence Reports
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Strategic Intelligence and Pre-Sales Analysis Reports
            </p>
            <div className="flex items-center space-x-8 text-sm text-gray-500">
              <span>Generated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
              <span>Platform: CloudCaddie</span>
            </div>
          </div>

          {/* Reports List */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">
              Available Reports
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link 
                href="/private/cloudcaddie/tim-frost-presales-report"
                className="block bg-gray-50 hover:bg-gray-100 p-6 rounded-lg border border-gray-200 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tim Frost Pre-Sales Report
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Comprehensive intelligence report for Tim Frost, CIO at North Carolina Industrial Commission
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Pre-Sales Intelligence</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Active</span>
                </div>
              </Link>
            </div>
          </section>

          {/* Quick Stats */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">
              Intelligence Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Active Reports</h3>
                <p className="text-3xl font-bold text-blue-800">1</p>
                <p className="text-sm text-blue-600">Pre-sales intelligence reports</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Targets Analyzed</h3>
                <p className="text-3xl font-bold text-green-800">1</p>
                <p className="text-sm text-green-600">Government CIO prospects</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Success Rate</h3>
                <p className="text-3xl font-bold text-purple-800">100%</p>
                <p className="text-sm text-purple-600">Intelligence accuracy</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-gray-200 pt-8 mt-12">
            <div className="text-center text-gray-500 text-sm">
              <p>CloudCaddie Intelligence Platform - Strategic Sales Intelligence</p>
              <p>For questions or additional reports, contact the sales team</p>
            </div>
          </footer>
        </main>
      </div>
    </PasswordProtection>
  );
}
