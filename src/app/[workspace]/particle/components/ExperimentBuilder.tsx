"use client";

import React, { useState } from "react";
import { useParticle } from "../layout";

export function ExperimentBuilder() {
  const { setIsCreateModalOpen } = useParticle();

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Experiment Builder
        </h2>
        <p className="text-muted mb-6">
          Design and configure your scientific experiments with our intuitive builder. 
          Create A/B tests, multivariate experiments, and performance benchmarks.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Building
          </button>
          <p className="text-sm text-muted">
            Or select an experiment from the left panel to view details
          </p>
        </div>
      </div>
    </div>
  );
}
