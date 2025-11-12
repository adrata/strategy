"use client";

import React from 'react';
import Link from 'next/link';

export default function EIPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link 
                href="/private"
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                ← Back to Private
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">E&I Cooperative Services</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-black mb-4">Buyer Group Intelligence Reports</h2>
          <p className="text-gray-700">
            Strategic buyer group analysis for E&I Cooperative Services
          </p>
        </div>

        <div className="grid gap-6">
          <Link
            href="/private/ei/wgu-retention"
            className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-blue-300 transition-all"
          >
            <h3 className="text-xl font-semibold text-blue-600 mb-2">
              WGU - Student Retention Solution
            </h3>
            <p className="text-gray-600 mb-4">
              Buyer group analysis for Western Governors University targeting student retention solutions ($500K-$1.4M deal size)
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Target: WGU</span>
              <span>•</span>
              <span>Product: Student Retention</span>
              <span>•</span>
              <span>Deal Size: $500K-$1.4M</span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

