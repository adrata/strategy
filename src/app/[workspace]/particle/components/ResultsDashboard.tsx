"use client";

import React from "react";

export function ResultsDashboard() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Results Dashboard
        </h2>
        <p className="text-muted mb-6">
          View comprehensive results and statistical analysis from your experiments. 
          Track performance metrics, confidence intervals, and statistical significance.
        </p>
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Select an experiment from the left panel to view detailed results
          </p>
        </div>
      </div>
    </div>
  );
}
